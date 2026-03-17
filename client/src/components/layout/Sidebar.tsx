import { Link, useLocation } from "wouter";
import { LayoutDashboard, Bike, LogOut, ChevronLeft, ChevronRight, Users, BookOpen } from "lucide-react";
import { useLogout } from "@/hooks/use-auth";
import { useTheme } from "@/context/ThemeContext";
import { SettingsTrigger } from "@/components/SettingsModal";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const { mutate: logout, isPending } = useLogout();
  const { theme } = useTheme();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/garage", label: "Garage", icon: Bike, exact: false },
    { href: "/community", label: "Community", icon: Users, exact: false },
    { href: "/travel", label: "Travel Diary", icon: BookOpen, exact: false },
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
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card border border-white/15 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all z-10"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
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

      {/* Bottom */}
      <div className={`pb-3 border-t border-white/5 pt-3 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        <SettingsTrigger collapsed={collapsed} />
        <button
          onClick={() => logout()}
          disabled={isPending}
          title={collapsed ? 'Sign Out' : undefined}
          className={`flex items-center rounded-xl font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full
            ${collapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'}
          `}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
