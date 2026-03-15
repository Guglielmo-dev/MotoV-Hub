import { Link, useLocation } from "wouter";
import { LayoutDashboard, Bike, LogOut } from "lucide-react";
import { useLogout } from "@/hooks/use-auth";
import { useTheme } from "@/context/ThemeContext";
import { SettingsTrigger } from "@/components/SettingsModal";

export function Sidebar() {
  const [location] = useLocation();
  const { mutate: logout, isPending } = useLogout();
  const { theme } = useTheme();

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
          <span className="text-2xl font-black font-display tracking-widest">
            MOTO<span className="text-primary">VAULT</span>
          </span>
        </div>
        <p className="text-muted-foreground text-xs mt-2 font-mono tracking-wider">MOTORCYCLE MANAGER</p>
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

      <div className="px-4 pb-2 space-y-1 border-t border-white/5 pt-4">
        <SettingsTrigger />
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
