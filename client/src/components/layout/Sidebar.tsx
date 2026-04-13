import { Link, useLocation } from "wouter";
import { LayoutDashboard, Bike, LogOut, ChevronLeft, ChevronRight, Users, BookOpen } from "lucide-react";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { useTheme } from "@/context/ThemeContext";
import { SettingsTrigger } from "@/components/SettingsModal";
import { useTranslation } from "react-i18next";

import { prefetchPage, PageName } from "@/lib/route-prefetch";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const getInitials = (name: string) => {
  if (!name) return "??";
  if (name.includes(' ')) {
    return name.split(' ').map(p => p[0]).join('').toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const { data: user, isLoading } = useAuth();
  const { mutate: logout, isPending } = useLogout();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const links: { href: string; label: string; icon: any; exact: boolean; page: PageName }[] = [
    { href: "/", label: t('nav.dashboard'), icon: LayoutDashboard, exact: true, page: 'Dashboard' },
    { href: "/garage", label: t('nav.garage'), icon: Bike, exact: false, page: 'Garage' },
    { href: "/community", label: t('nav.community'), icon: Users, exact: false, page: 'Community' },
    { href: "/travel", label: t('nav.travelDiary'), icon: BookOpen, exact: false, page: 'TravelDiary' },
  ];

  return (
    <aside
      className="bg-card border-r border-white/5 hidden md:flex flex-col h-screen fixed left-0 top-0 z-30 transition-all duration-300"
      style={{ width: collapsed ? 64 : 256 }}
    >
      {/* Header */}
      <div className={`flex items-center border-b border-white/5 h-16 relative ${collapsed ? 'justify-center px-0' : 'px-5 gap-2'}`}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Bike className="w-4 h-4 text-black" />
        </div>
        {!collapsed && (
          <span className="text-xl font-black font-display tracking-widest whitespace-nowrap overflow-hidden">
            MOTO<span className="text-primary">VAULT</span>
          </span>
        )}
        <button
          data-testid="button-sidebar-toggle"
          onClick={onToggle}
          title={collapsed ? t('common.confirm') : t('common.close')}
          className="absolute -right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card border border-white/15 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all z-10"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-4 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        {links.map((link) => {
          const isActive = link.exact ? location === link.href : location === link.href || location.startsWith(link.href + '/') || (link.href !== '/' && location.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              onMouseEnter={() => prefetchPage(link.page)}
              className={`
                flex items-center rounded-xl font-medium transition-all duration-200
                ${collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
                ${isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'}
              `}
              style={isActive ? { boxShadow: `0 0 15px rgba(${theme.shadowRgb}, 0.18)` } : {}}
            >
              <link.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Session Block */}
      <div className={`py-4 border-t border-b border-white/5 ${collapsed ? 'px-2' : 'px-3'}`}>
        {isLoading ? (
          <div className={`flex items-center animate-pulse ${collapsed ? 'justify-center' : 'gap-3 px-4'}`}>
            <div className="w-9 h-9 rounded-full bg-white/5 flex-shrink-0" />
            {!collapsed && (
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            )}
          </div>
        ) : user ? (
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 pl-2 pr-4'}`} title={collapsed ? user.username : undefined}>
            <div 
              className="w-9 h-9 rounded-full bg-[var(--primary)]/20 border border-[var(--primary)]/40 flex items-center justify-center flex-shrink-0 text-[var(--primary)] font-bold text-sm"
              style={{ boxShadow: collapsed ? `0 0 12px rgba(${theme.shadowRgb}, 0.1)` : 'none' }}
            >
              {getInitials(user.username)}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-display font-bold uppercase tracking-wider text-foreground truncate">
                  {user.username}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{t('common.online')}</span>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Bottom */}
      <div className={`pb-3 pt-3 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        <SettingsTrigger collapsed={collapsed} />
        <button
          onClick={() => logout()}
          disabled={isPending}
          title={collapsed ? t('nav.signOut') : undefined}
          className={`flex items-center rounded-xl font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full
            ${collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
          `}
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{t('nav.signOut')}</span>}
          </div>
        </button>
      </div>
    </aside>
  );
}
