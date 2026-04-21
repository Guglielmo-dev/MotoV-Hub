import { useState, useMemo } from "react";
import { Bell, Mail, Trash2, Send, Plus, Info, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Notification, InsertNotification } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
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

export function NotificationInbox() {
  const { t, i18n } = useTranslation();
  const { data: user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showAdminForm, setShowAdminForm] = useState(false);
  
  // Admin Form State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<Notification['type']>("info");

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const hasUnread = useMemo(() => {
    if (!user?.lastReadNotificationsAt || notifications.length === 0) return notifications.length > 0;
    const lastRead = new Date(user.lastReadNotificationsAt).getTime();
    return notifications.some(n => new Date(n.createdAt!).getTime() > lastRead);
  }, [user, notifications]);

  const markAsReadMutation = useMutation({
    mutationFn: async () => apiRequest("POST", "/api/notifications/read"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
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
    if (open && hasUnread) {
      markAsReadMutation.mutate();
    }
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
          {hasUnread && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#0a0a0a] animate-pulse" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        sideOffset={12} 
        className="w-full max-w-[90vw] sm:w-[400px] p-0 bg-[#0d0d0d] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white">{t('notifications.title')}</h3>
          </div>
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

        <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
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
            ) : notifications.length > 0 ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="divide-y divide-white/5"
              >
                {notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type as keyof typeof TYPE_ICONS] || Info;
                  const isNew = user?.lastReadNotificationsAt 
                    ? new Date(n.createdAt!).getTime() > new Date(user.lastReadNotificationsAt).getTime()
                    : true;

                  return (
                    <div key={n.id} className={cn("p-5 group/item transition-colors", isNew ? "bg-primary/[0.02]" : "hover:bg-white/5")}>
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
                            {user?.isAdmin && (
                              <button 
                                onClick={() => deleteMutation.mutate(n.id)}
                                className="p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {n.content}
                          </p>
                          <span className="block text-[9px] font-mono uppercase tracking-widest text-muted-foreground/40 pt-1">
                            {format(new Date(n.createdAt!), "d MMM yyyy, HH:mm", { 
                              locale: i18n.language === 'it' ? it : enUS 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-muted-foreground/20" />
                </div>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground/40">{t('notifications.empty')}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </PopoverContent>
    </Popover>
  );
}
