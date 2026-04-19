import { useState } from "react";
import { Gamepad2, Trophy, Play, Star, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NeonRider } from "./games/NeonRider";
import { RatingSystem } from "@/components/ui/RatingSystem";

export function Games() {
  const { t } = useTranslation();
  const [activeGame, setActiveGame] = useState<string | null>(null);

  if (activeGame === 'neon-rider') {
    return <NeonRider onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-display uppercase tracking-wide flex items-center gap-3">
            <Gamepad2 className="w-8 h-8 text-primary" />
            {t('games.title')}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('games.subtitle')}</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
          <Trophy className="w-4 h-4 text-primary" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Leaderboard Coming Soon</span>
        </div>
      </div>

      {/* Featured Game Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 relative group overflow-hidden rounded-3xl border border-white/10 surface-premium aspect-video sm:aspect-auto sm:h-[400px]">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary),0.15),transparent)] pointer-events-none" />
          <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
            <Gamepad2 className="w-40 h-40 text-primary -rotate-12" />
          </div>

          <div className="relative h-full p-8 sm:p-12 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-black uppercase tracking-tighter text-primary flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Featured
              </span>
              <RatingSystem targetType="game" targetId="neon-rider" showCount />
            </div>
            
            <h2 className="text-4xl sm:text-6xl font-black font-display uppercase tracking-tighter mb-4">
              {t('games.neonRider.title')}
            </h2>
            <p className="text-muted-foreground max-w-md text-sm sm:text-base mb-8 leading-relaxed">
              {t('games.neonRider.desc')}
            </p>

            <button 
              onClick={() => setActiveGame('neon-rider')}
              className="w-fit flex items-center gap-3 px-8 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(var(--primary),0.3)]"
            >
              <Play className="w-5 h-5 fill-current" />
              {t('games.neonRider.playNow')}
            </button>
          </div>
        </div>

        {/* Categories / Side Info */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl border border-white/10 bg-card/50 backdrop-blur-sm">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 opacity-60">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {['Arcade', 'Racing', 'Motorcycle', 'Retro', 'Neon'].map(cat => (
                <span key={cat} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider hover:border-primary/30 hover:text-primary transition-colors cursor-default">
                  {cat}
                </span>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-3xl border border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-700" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4 opacity-60">Upcoming</h3>
            <div className="space-y-4">
              {[
                { title: 'Moto Quiz', type: 'Trivia', progress: 'In Development' },
                { title: 'Traffic Dodge', type: 'Survive', progress: 'Planned' }
              ].map(item => (
                <div key={item.title} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors">
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground uppercase opacity-60">{item.type}</p>
                  </div>
                  <span className="text-[9px] font-mono text-primary/50 uppercase italic">{item.progress}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Games;
