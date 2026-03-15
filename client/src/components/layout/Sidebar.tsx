import { Link, useLocation } from "wouter";
import { LayoutDashboard, Bike, LogOut, Palette } from "lucide-react";
import { useLogout } from "@/hooks/use-auth";
import { useTheme } from "@/context/ThemeContext";
import { BRAND_THEMES, BRAND_COLORS, type BrandId } from "@/lib/themes";

export function Sidebar() {
  const [location] = useLocation();
  const { mutate: logout, isPending } = useLogout();
  const { brandId, setBrand, theme } = useTheme();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/garage", label: "Garage", icon: Bike },
  ];

  return (
    <aside className="w-64 bg-card border-r border-white/5 hidden md:flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Bike className="w-4 h-4 text-black" />
          </div>
          <h1 className="text-2xl font-black font-display tracking-widest">
            KAWA<span className="text-primary">CODER</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-xs mt-2 font-mono tracking-wider">MOTORCYCLE VAULT</p>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-6">
        {links.map((link) => {
          const isActive = location === link.href || (link.href !== '/' && location.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href} className={`
              flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200
              ${isActive 
                ? 'bg-primary/10 text-primary border border-primary/20' 
                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'}
            `}
            style={isActive ? { boxShadow: `0 0 15px rgba(${theme.shadowRgb}, 0.18)` } : {}}>
              <link.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Brand Theme Picker */}
      <div className="px-4 pb-4 border-t border-white/5 pt-4">
        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
          <Palette className="w-3.5 h-3.5" />
          <span className="text-xs font-mono uppercase tracking-wider">Brand Theme</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {BRAND_THEMES.map((t) => {
            const isSelected = t.id === brandId;
            return (
              <button
                key={t.id}
                data-testid={`button-theme-${t.id}`}
                onClick={() => setBrand(t.id as BrandId)}
                title={t.name}
                className={`relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 border
                  ${isSelected 
                    ? 'border-white/30 bg-white/5' 
                    : 'border-transparent hover:border-white/10 hover:bg-white/5'}`}
              >
                <div
                  className="w-6 h-6 rounded-full ring-2 ring-offset-2 ring-offset-card transition-all"
                  style={{
                    backgroundColor: BRAND_COLORS[t.id as BrandId],
                    ringColor: isSelected ? BRAND_COLORS[t.id as BrandId] : 'transparent',
                    boxShadow: isSelected ? `0 0 10px ${BRAND_COLORS[t.id as BrandId]}88` : 'none',
                    outline: isSelected ? `2px solid ${BRAND_COLORS[t.id as BrandId]}` : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                />
                <span className={`text-[9px] font-mono uppercase tracking-wide leading-tight text-center
                  ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {t.name.split('-')[0].split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => logout()}
          disabled={isPending}
          className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
