import { Sidebar } from "./Sidebar";
import { Bike, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface AppLayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_KEY = 'motovault-sidebar-collapsed';

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_KEY) === 'true');
  const [location] = useLocation();

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SIDEBAR_KEY, String(next));
  };

  const closeMenu = () => setMobileOpen(false);
  const sidebarWidth = collapsed ? 64 : 256;

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
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-muted-foreground hover:text-white">
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-background/95 backdrop-blur-sm z-30 pt-20 px-4">
          <nav className="flex flex-col space-y-4">
            <Link href="/" onClick={closeMenu} className={`p-4 rounded-xl text-lg font-medium ${location === '/' ? 'bg-primary/20 text-primary' : 'text-foreground bg-card'}`}>
              Dashboard
            </Link>
            <Link href="/garage" onClick={closeMenu} className={`p-4 rounded-xl text-lg font-medium ${location.startsWith('/garage') ? 'bg-primary/20 text-primary' : 'text-foreground bg-card'}`}>
              Garage
            </Link>
          </nav>
        </div>
      )}

      {/* Main Content + Footer */}
      <main
        className="flex-1 pt-16 md:pt-0 min-h-screen flex flex-col transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-white/5 py-6 px-8 mt-12">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground font-mono">
            <span className="text-primary/80 font-semibold tracking-wider uppercase">
              Developed by KawaCoder
            </span>
            <p className="text-center sm:text-right leading-relaxed">
              All motorcycle brands mentioned are trademarks of their respective owners.
              <br />
              This project is an independent developer portfolio project.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
