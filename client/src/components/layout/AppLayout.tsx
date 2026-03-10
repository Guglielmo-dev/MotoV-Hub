import { Sidebar } from "./Sidebar";
import { Bike, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  const closeMenu = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-md border-b border-white/5 z-40 flex items-center justify-between px-4">
        <h1 className="text-2xl font-bold font-display flex items-center gap-2">
          <Bike className="w-5 h-5 text-primary" />
          MOTO<span className="text-primary">V</span>
        </h1>
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

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen">
        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
