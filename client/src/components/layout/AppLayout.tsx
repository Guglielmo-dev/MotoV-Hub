import { Sidebar } from "./Sidebar";
import { Bike, Menu, X, LayoutDashboard, Users, BookOpen } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { NotificationInbox } from "./NotificationInbox";
import { ChatBot } from "./ChatBot";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface AppLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_KEY = 'motovault-sidebar-collapsed';

const getInitials = (name: string) => {
  if (!name) return "??";
  if (name.includes(' ')) {
    return name.split(' ').map(p => p[0]).join('').toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === 'true');
  const [location] = useLocation();
  const { data: user } = useAuth();
  const { t } = useTranslation();

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  };

  const closeMenu = () => setMobileOpen(false);
  
  const mobileLinks = [
    { href: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { href: '/garage', label: t('nav.garage'), icon: Bike },
    { href: '/community', label: t('nav.community'), icon: Users },
    { href: '/travel', label: t('nav.travelDiary'), icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-md border-b border-white/5 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Bike className="w-4 h-4 text-black" />
          </div>
          <h1 className="text-xl font-bold font-display">MOTO<span className="text-primary">VAULT</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationInbox />
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-muted-foreground hover:text-white transition-colors">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-background/95 backdrop-blur-sm z-30 pt-20 px-4">
          {/* User Profile Mobile */}
          {user && (
            <div className="flex items-center gap-4 pt-4 pb-6 border-b border-white/5 mb-6 px-2">
              <Avatar className="w-10 h-10 border border-primary/20">
                <AvatarImage 
                  key={user.avatarUrl} 
                  src={user.avatarUrl || undefined} 
                  className="object-cover" 
                />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-base uppercase">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-display font-bold uppercase tracking-wider text-foreground truncate leading-none mb-1">
                  {user.username}
                </span>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground font-medium uppercase tracking-tight">{t('common.online')}</span>
                </div>
              </div>
            </div>
          )}

          <nav className="flex flex-col space-y-3">
            {mobileLinks.map(link => (
              <Link key={link.href} href={link.href} onClick={closeMenu}
                className={`p-4 min-h-[48px] rounded-xl text-lg font-medium flex items-center gap-3 ${location === link.href || (link.href !== '/' && location.startsWith(link.href)) ? 'bg-primary/20 text-primary' : 'text-foreground bg-card'}`}>
                <link.icon className="w-5 h-5 flex-shrink-0" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content + Footer */}
      <main
        className={`flex-1 min-h-screen flex flex-col transition-all duration-300
          ${collapsed ? 'md:ml-16' : 'md:ml-64'}
        `}
      >
        {/* Desktop Header / Top Bar */}
        <div className="hidden md:flex items-center justify-end px-8 py-4 border-b border-white/5 sticky top-0 bg-background/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-4">
             <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none mb-1">{user?.username}</span>
                <span className="text-[8px] font-mono text-primary uppercase tracking-tighter">System Active</span>
             </div>
             <NotificationInbox />
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>

        <footer className="border-t border-white/5 py-6 px-8 mt-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span className="text-primary/80 font-semibold tracking-wider uppercase">{t('common.developedBy')} KAWACODER</span>
            <p className="text-center sm:text-right leading-relaxed">
              {t('common.trademarks')}
              <br />{t('common.independentProject')}
            </p>
          </div>
        </footer>
      </main>
      <ChatBot />
    </div>
  );
}
