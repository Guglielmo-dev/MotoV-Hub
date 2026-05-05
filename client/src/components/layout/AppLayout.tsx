import { Sidebar } from "./Sidebar";
import { Bike, Menu, X, LayoutDashboard, Users, BookOpen } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { NotificationInbox } from "./NotificationInbox";
import { ChatBot } from "./ChatBot";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initSoundEngine, playMotorcycleRevSound } from "@/lib/sound";
import { useEffect } from "react";

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
  const [showTrustpilot, setShowTrustpilot] = useState(true);
  const [location] = useLocation();
  const { data: user } = useAuth();
  const { t } = useTranslation();
  const DEFAULT_REV_URL = "https://cavgduiyohxlghkyldur.supabase.co/storage/v1/object/public/motorcycle-images/audio/tanweraman-motorcycle-engine-rev-2-337870.mp3";

  // Sync sound engine and play start sound on mount/user change
  useEffect(() => {
    if (user) {
      console.log("[AudioDebug] App loaded for user:", user.username);
      initSoundEngine(user);

      // Clean up legacy login flag if present
      if (window.location.search.includes('login=true')) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      const playSound = () => {
        console.log("[AudioDebug] Playing start sound (URL: " + (user.customAudioData || "default") + ")");
        playMotorcycleRevSound(user.customAudioData)
          .then(() => console.log("[AudioDebug] Audio played successfully"))
          .catch(err => console.warn("[AudioDebug] Audio play failed:", err));
      };

      const handleInteraction = () => {
        console.log("[AudioDebug] Interaction detected, attempting playback...");
        playSound();
        ['click', 'mousedown', 'keydown', 'touchstart', 'mousemove'].forEach(evt => 
          window.removeEventListener(evt, handleInteraction, { capture: true })
        );
      };

      // Auto-play attempt
      setTimeout(() => {
        console.log("[AudioDebug] Attempting auto-play...");
        playMotorcycleRevSound(user.customAudioData)
          .then(() => console.log("[AudioDebug] Auto-play success!"))
          .catch((err) => {
            console.log("[AudioDebug] Auto-play blocked, waiting for interaction...");
            ['click', 'mousedown', 'keydown', 'touchstart', 'mousemove'].forEach(evt => 
              window.addEventListener(evt, handleInteraction, { once: true, capture: true })
            );
          });
      }, 500);
    }
  }, [user?.id]);

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
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden glow-green">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
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

        <div className="flex-1 p-4 sm:p-10 max-w-7xl mx-auto w-full pt-20 md:pt-8">
          {children}
        </div>

        {/* Trustpilot Section */}
        {showTrustpilot && (
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-10 mt-8 relative group">
            <div className="bg-card/30 border border-white/5 rounded-2xl p-6 pr-12 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-primary/10 transition-all relative overflow-hidden">
              <button
                onClick={() => setShowTrustpilot(false)}
                className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
                title={t('common.close')}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1 text-center md:text-left relative z-0">
                <h3 className="text-lg font-black font-display uppercase tracking-tight text-white italic">
                  {t('common.reviewUs') || 'Ti piace MotoVault?'}
                </h3>
                <p className="text-[11px] text-muted-foreground font-medium max-w-xs leading-relaxed">
                  {t('common.reviewUsDesc') || 'Aiutaci a crescere lasciando una recensione'}
                </p>
              </div>

              {/* Trustpilot Mock Widget */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-6 h-6 bg-[#00b67a] flex items-center justify-center rounded-sm">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-black tracking-tighter text-[10px] uppercase">Trustpilot</span>
                  <span className="text-muted-foreground text-[8px] font-mono">Verified</span>
                </div>
              </div>

              <button className="px-5 py-2.5 bg-[#00b67a] hover:bg-[#00b67a]/90 text-white font-black uppercase tracking-widest text-[10px] rounded-lg transition-all shadow-lg shadow-[#00b67a]/10 active:scale-95">
                {t('common.writeReview') || 'Scrivi Recensione'}
              </button>
            </div>
          </div>
        )}

        <footer className="border-t border-white/5 py-12 px-8 mt-12 bg-zinc-950/30">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-8 text-[10px] text-muted-foreground font-mono">
            <div className="flex flex-col items-center sm:items-start gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center border border-primary/30 overflow-hidden">
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="text-primary/80 font-black tracking-[0.2em] uppercase">MOTOVAULT</span>
              </div>
              <span className="opacity-50 font-black tracking-[0.1em] uppercase">{t('common.developedBy')} KAWACODER</span>
              <a
                href="mailto:kawacoder900@gmail.com"
                className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 group px-2 py-1 bg-white/5 rounded-md"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                kawacoder900@gmail.com
              </a>
            </div>
            <div className="text-center sm:text-right space-y-2 opacity-60 max-w-xs leading-relaxed">
              <p>{t('common.trademarks')}</p>
              <p>{t('common.independentProject')}</p>
            </div>
          </div>
        </footer>
      </main>
      <ChatBot />
    </div>
  );
}
