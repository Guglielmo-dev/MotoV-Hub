import { useState, useMemo } from "react";
import { Bell, Mail, Trash2, Send, Plus, Info, Zap, AlertTriangle, CheckCircle2, Archive, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Notification, InsertNotification } from "@shared/schema";
import { api } from "@shared/routes";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const TYPE_ICONS = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  game: Zap,
};

const TYPE_COLORS = {
  info: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  success: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  warning: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  game: "text-primary bg-primary/10 border-primary/20",
};

interface NotificationItemProps {
  n: Notification;
  isNew: boolean;
  isAdmin: boolean;
  onRead?: (id: number) => void;
  onDismiss: (id: number) => void;
  onDelete?: (id: number) => void;
  isReadView?: boolean;
}

function NotificationItem({ n, isNew, isAdmin, onRead, onDismiss, onDelete, isReadView }: NotificationItemProps) {
  const { t, i18n } = useTranslation();
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0]);
  const Icon = TYPE_ICONS[n.type as keyof typeof TYPE_ICONS] || Info;

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x < -100 && onRead && !isReadView) {
      onRead(n.id);
    } 
    else if (info.offset.x > 100) {
      onDismiss(n.id);
    }
  };

  // Dynamic opacity for background hints based on drag
  const dismissOpacity = useTransform(x, [0, 100], [0, 1]);
  const readOpacity = useTransform(x, [0, -100], [0, 1]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative overflow-hidden border-b border-white/5 last:border-0 bg-black"
    >
      {/* Background Actions Hints */}
      {!isAdmin && (
        <div className="absolute inset-0 flex items-center justify-between px-6 pointer-events-none">
          <motion.div style={{ opacity: dismissOpacity }} className="flex items-center gap-2 text-red-500">
            <X className="w-5 h-5" />
            <span className="text-[10px] font-black uppercase tracking-tighter">{t('notifications.actions.dismiss')}</span>
          </motion.div>
          <motion.div style={{ opacity: readOpacity }} className={cn("flex items-center gap-2 text-emerald-500", isReadView && "hidden")}>
            <span className="text-[10px] font-black uppercase tracking-tighter">{t('notifications.actions.markAsRead')}</span>
            <Check className="w-5 h-5" />
          </motion.div>
        </div>
      )}

      <motion.div
        style={{ x }}
        drag={isAdmin ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        className={cn(
          "relative z-10 p-5 bg-[#0d0d0d] border-white/5",
          !isAdmin && "cursor-grab active:cursor-grabbing",
          isNew ? "bg-primary/[0.04]" : "hover:bg-white/[0.02]"
        )}
      >
        <div className="flex items-start gap-4">
          <div className={cn("p-2 rounded-xl border shrink-0", TYPE_COLORS[n.type as keyof typeof TYPE_COLORS])}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-foreground">{n.title}</h4>
                {isNew && (
                  <span className="px-1.5 py-0.5 rounded bg-primary text-black text-[8px] font-black uppercase tracking-tighter">
                    {t('notifications.newBadge')}
                  </span>
                )}
              </div>
                            {isAdmin && onDelete && (
                <button 
                  onClick={() => onDelete(n.id)}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-red-500 hover:border-red-500/30 transition-all ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {n.content}
            </p>
            <div className="flex items-center justify-between pt-1">
              <span className="block text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40">
                {format(new Date(n.createdAt!), "d MMM yyyy, HH:mm", { 
                  locale: i18n.language === 'it' ? it : enUS 
                })}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function NotificationInbox() {
  const { t, i18n } = useTranslation();
  const { data: user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 5;
  
  // Admin Form State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<Notification['type']>("info");

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 10000, // Poll every 10 seconds for real-time feel
  });

  const readIds = useMemo(() => user?.readNotificationIds || [], [user]);
  const dismissedIds = useMemo(() => user?.dismissedNotificationIds || [], [user]);

  const filteredNotifications = useMemo(() => {
    const visible = notifications.filter(n => !dismissedIds.includes(n.id));
    const tabFiltered = activeTab === 'unread' 
      ? visible.filter(n => !readIds.includes(n.id))
      : visible.filter(n => readIds.includes(n.id));
    
    return tabFiltered;
  }, [notifications, readIds, dismissedIds, activeTab]);

  const paginatedNotifications = useMemo(() => {
    return filteredNotifications.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  }, [filteredNotifications, page]);

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);

  const hasUnreadBadge = useMemo(() => {
    return notifications.some(n => !readIds.includes(n.id) && !dismissedIds.includes(n.id));
  }, [notifications, readIds, dismissedIds]);

  // Reset page when tab changes
  useMemo(() => setPage(0), [activeTab]);

  const readMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("POST", `/api/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  });

  const dismissMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("POST", `/api/notifications/${id}/dismiss`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: t('notifications.actions.dismissToast') });
    }
  });

  const readAllMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/notifications/read-all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: t('notifications.actions.markAllRead') });
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertNotification) => apiRequest("POST", "/api/notifications", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: t('notifications.success') });
      setNewTitle("");
      setNewContent("");
      setShowAdminForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({ title: t('notifications.deleted') });
    }
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  const handleSend = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    createMutation.mutate({
      title: newTitle,
      content: newContent,
      type: newType,
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all group">
          <Bell className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          {hasUnreadBadge && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#0a0a0a] animate-pulse" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        sideOffset={12} 
        className="w-full max-w-[90vw] sm:w-[400px] p-0 bg-[#0d0d0d] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 space-y-4 bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white">{t('notifications.title')}</h3>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'unread' && filteredNotifications.length > 0 && (
                <button 
                  onClick={() => readAllMutation.mutate()}
                  className="p-1.5 rounded-lg border border-white/10 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all"
                  title={t('notifications.actions.markAllRead')}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
              {user?.isAdmin && (
                <button 
                  onClick={() => setShowAdminForm(!showAdminForm)}
                  className={cn(
                    "p-1.5 rounded-lg border transition-all",
                    showAdminForm ? "bg-red-500/10 border-red-500/50 text-red-500" : "bg-primary/10 border-primary/50 text-primary"
                  )}
                >
                  {showAdminForm ? <Plus className="w-4 h-4 rotate-45" /> : <Plus className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          {!showAdminForm && (
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
              {(['unread', 'read'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-1.5 text-[10px] font-black uppercase tracking-tighter rounded-lg transition-all relative",
                    activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-white"
                  )}
                >
                  {t(`notifications.tabs.${tab}`)}
                  {activeTab === tab && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg -z-10" 
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar overflow-x-hidden">
          <AnimatePresence mode="wait">
            {showAdminForm ? (
              <motion.div 
                key="admin-form"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 space-y-4 bg-primary/[0.03]"
              >
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">{t('notifications.adminTitle')}</h4>
                  
                  <div className="flex gap-2">
                    {(['info', 'game', 'success', 'warning'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setNewType(type)}
                        className={cn(
                          "px-2 py-1 rounded text-[9px] font-black uppercase border transition-all",
                          newType === type ? TYPE_COLORS[type] : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <input 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder={t('notifications.placeholderTitle')}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
                  />
                  <textarea 
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder={t('notifications.placeholderContent')}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary/50 resize-none font-mono text-[11px]"
                  />
                  <button 
                    disabled={createMutation.isPending || !newTitle || !newContent}
                    onClick={handleSend}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-black py-2 rounded-lg font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-transform disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    {t('notifications.send')}
                  </button>
                </div>
              </motion.div>
            ) : filteredNotifications.length > 0 ? (
              <motion.div 
                key={activeTab + page}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col"
              >
                {paginatedNotifications.map((n) => {
                  const isNew = !readIds.includes(n.id);
                  return (
                    <NotificationItem 
                      key={n.id}
                      n={n}
                      isNew={isNew && activeTab === 'unread'}
                      isAdmin={!!user?.isAdmin}
                      onRead={(id) => readMutation.mutate(id)}
                      onDismiss={(id) => dismissMutation.mutate(id)}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      isReadView={activeTab === 'read'}
                    />
                  );
                })}
                
                {totalPages > 1 && (
                  <div className="p-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-tighter hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                      Precedente
                    </button>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                      Pagina {page + 1} di {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages - 1}
                      onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-black uppercase tracking-tighter hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                      Successiva
                    </button>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 flex flex-col items-center justify-center text-center px-6"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  {activeTab === 'unread' ? <Mail className="w-6 h-6 text-muted-foreground/20" /> : <Archive className="w-6 h-6 text-muted-foreground/20" />}
                </div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40">{t('notifications.empty')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}
