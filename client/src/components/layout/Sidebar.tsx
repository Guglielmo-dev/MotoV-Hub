import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Bike, LogOut, ChevronLeft,
  ChevronRight, Users, BookOpen, Gamepad2, Pencil, Check, X,
  ShoppingBag
} from "lucide-react";
import { useAuth, useLogout, useUpdateUsername } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { SettingsTrigger } from "@/components/SettingsModal";
import { UserProfileModal } from "./UserProfileModal";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const links: { href: string; label: string; icon: any; exact: boolean; page: PageName }[] = [
    { href: "/", label: t('nav.dashboard'), icon: LayoutDashboard, exact: true, page: 'Dashboard' },
    { href: "/garage", label: t('nav.garage'), icon: Bike, exact: false, page: 'Garage' },
    // { href: "/community", label: t('nav.community'), icon: Users, exact: false, page: 'Community' },
    { href: "/travel", label: t('nav.travelDiary'), icon: BookOpen, exact: false, page: 'TravelDiary' },
    // { href: "/games", label: t('nav.games'), icon: Gamepad2, exact: false, page: 'Games' },
    { href: "/shop", label: t('nav.shop', { defaultValue: 'Store' }), icon: ShoppingBag, exact: false, page: 'Shop' },
  ];

  return (
    <aside
      className="bg-card border-r border-white/5 hidden md:flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 shadow-2xl"
      style={{ width: collapsed ? 76 : 280 }}
    >
      {/* Header */}
      <div className={`flex items-center border-b border-white/5 h-20 relative ${collapsed ? 'justify-center px-0' : 'px-6 gap-3'}`}>
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/30 overflow-hidden glow-green">
          <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-xl font-black font-display tracking-[0.2em] leading-none mb-0.5 whitespace-nowrap overflow-hidden">
              MOTO<span className="text-primary">VAULT</span>
            </span>
            <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest leading-none opacity-60">
              {t('nav.version', { defaultValue: 'Command Center v1.0' })}
            </span>
          </div>
        )}
        <button
          data-testid="button-sidebar-toggle"
          onClick={onToggle}
          title={collapsed ? t('common.confirm') : t('common.close')}
          className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-card border border-white/10 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all z-10 shadow-lg backdrop-blur-md"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className={`flex-1 py-6 space-y-2 ${collapsed ? 'px-3' : 'px-4'}`}>
        {links.map((link) => {
          const isActive = link.exact ? location === link.href : location === link.href || location.startsWith(link.href + '/') || (link.href !== '/' && location.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              title={collapsed ? link.label : undefined}
              onMouseEnter={() => prefetchPage(link.page)}
              className={`
                group flex items-center rounded-xl font-bold transition-all duration-300 relative
                ${collapsed ? 'justify-center p-3.5' : 'gap-4 px-4 py-3.5'}
                ${isActive
                  ? 'bg-primary/10 text-primary border border-primary/25 shadow-[0_0_20px_rgba(var(--primary),0.05)]'
                  : 'text-muted-foreground/70 hover:text-foreground hover:bg-white/5 border border-transparent'}
              `}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_15px_var(--color-primary)]" />
              )}
              <link.icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-primary' : 'group-hover:text-primary'}`} />
              {!collapsed && (
                <div className="flex flex-col">
                  <span className="text-sm uppercase tracking-wider">{link.label}</span>
                  <span className="text-[10px] lowercase font-normal opacity-40 group-hover:opacity-70 transition-opacity capitalize">
                    {link.page.toLowerCase()} {t('nav.insights', { defaultValue: 'insights' })}
                  </span>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Session Block */}
      <div className="border-y border-white/5 py-6 my-2">
        {isLoading ? (
          <div className={`flex items-center animate-pulse ${collapsed ? 'justify-center' : 'gap-3 px-6'}`}>
            <div className="w-9 h-9 rounded-full bg-white/5 flex-shrink-0" />
            {!collapsed && (
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-2 bg-white/5 rounded w-1/2" />
              </div>
            )}
          </div>
        ) : user ? (
          <div 
            onClick={() => setIsProfileOpen(true)}
            className={`
              flex items-center cursor-pointer group/user-block transition-all duration-300 hover:bg-white/5 mx-2 rounded-xl py-2
              ${collapsed ? 'justify-center' : 'gap-3 px-4'}
            `} 
            title={collapsed ? user.username : undefined}
          >
            <Avatar className={`w-9 h-9 border border-primary/20 transition-transform group-hover/user-block:scale-105 ${collapsed ? '' : 'flex-shrink-0'}`}>
              <AvatarImage 
                key={user.avatarUrl} 
                src={user.avatarUrl || undefined} 
                className="object-cover" 
              />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs uppercase">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            
            {!collapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-display font-bold uppercase tracking-wider text-foreground truncate group-hover/user-block:text-primary transition-colors">
                    {user.username}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
                    {t('common.online')}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <UserProfileModal 
        open={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />

      {/* Bottom Actions */}
      <div className={`pb-6 space-y-2 mt-auto ${collapsed ? 'px-3' : 'px-4'}`}>
        <SettingsTrigger collapsed={collapsed} />
        <button
          onClick={() => logout()}
          disabled={isPending}
          title={collapsed ? t('nav.signOut') : undefined}
          className={`group flex items-center rounded-xl font-bold text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all duration-300 w-full
            ${collapsed ? 'justify-center p-3.5' : 'gap-4 px-4 py-3.5'}
          `}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 transition-transform group-hover:-translate-x-1" />
          {!collapsed && <span className="text-sm uppercase tracking-wider">{t('nav.signOut')}</span>}
        </button>
      </div>
    </aside>
  );
}
