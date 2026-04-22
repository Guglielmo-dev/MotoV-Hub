import { useState } from "react";
import { Gamepad2, Trophy, Play, Sparkles, BrainCircuit, Zap, Activity, LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { NeonRider } from "./games/NeonRider";
import { MotoQuiz } from "./games/MotoQuiz";
import { TrafficDodge2D } from "./games/TrafficDodge2D";
import { RatingSystem } from "@/components/ui/RatingSystem";
import { cn } from "@/lib/utils";

interface GameData {
  id: string;
  titleKey: string;
  descKey: string;
  icon: LucideIcon;
  category: string;
  color: string;
  isAvailable: boolean;
  type: string;
}

export function Games() {
  const { t } = useTranslation();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const AVAILABLE_GAMES: GameData[] = [
    {
      id: 'traffic-dodge',
      titleKey: 'games.trafficDodge.title',
      descKey: 'games.trafficDodge.desc',
      icon: Activity,
      category: 'Arcade',
      color: 'primary',
      isAvailable: true,
      type: 'Racing'
    },
    {
      id: 'neon-rider',
      titleKey: 'games.neonRider.title',
      descKey: 'games.neonRider.desc',
      icon: Zap,
      category: 'Arcade',
      color: 'primary',
      isAvailable: true,
      type: 'Racing'
    },
    {
      id: 'moto-quiz',
      titleKey: 'games.motoQuiz.title',
      descKey: 'games.motoQuiz.desc',
      icon: BrainCircuit,
      category: 'Trivia',
      color: 'primary',
      isAvailable: true,
      type: 'Trivia'
    }
  ];

  const UPCOMING_GAMES: any[] = [];

  const filteredGames = activeCategory
    ? AVAILABLE_GAMES.filter(g => g.category === activeCategory)
    : AVAILABLE_GAMES;

  if (activeGame === 'neon-rider') {
    return <NeonRider onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'moto-quiz') {
    return <MotoQuiz onBack={() => setActiveGame(null)} />;
  }

  if (activeGame === 'traffic-dodge') {
    return <TrafficDodge2D onBack={() => setActiveGame(null)} />;
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Games List */}
        <div className="lg:col-span-8 space-y-8">
          {filteredGames.length > 0 ? (
            filteredGames.map((game, idx) => (
              <div
                key={game.id}
                className="relative group overflow-hidden rounded-[2.5rem] border border-white/10 surface-premium transition-all duration-500 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-500"
              >
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(var(--primary),0.08),transparent)] pointer-events-none" />
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transition-all duration-700 group-hover:opacity-20 group-hover:scale-110 group-hover:-rotate-12">
                  <game.icon className="w-48 h-48 text-primary" />
                </div>

                <div className="relative p-8 sm:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-black uppercase tracking-tighter text-primary flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        {idx === 0 && !activeCategory ? 'Featured' : 'Popular'}
                      </span>
                      <RatingSystem targetType="game" targetId={game.id} showCount />
                    </div>

                    <h2 className="text-4xl sm:text-5xl font-black font-display uppercase tracking-tighter text-white group-hover:text-primary transition-colors">
                      {t(game.titleKey)}
                    </h2>
                    <p className="text-muted-foreground max-w-lg text-sm sm:text-base leading-relaxed">
                      {t(game.descKey)}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <button
                      onClick={() => setActiveGame(game.id)}
                      className="w-full md:w-auto min-w-[180px] flex items-center justify-center gap-3 px-8 py-5 bg-primary text-black font-black uppercase tracking-widest rounded-[1.25rem] hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(var(--primary),0.2)] group-hover:shadow-[0_0_40px_rgba(var(--primary),0.4)]"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      {t('games.neonRider.playNow')}
                    </button>
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground opacity-40">
                      Category: {game.type}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[2.5rem]">
              <Gamepad2 className="w-12 h-12 text-muted-foreground/20 mb-4" />
              <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest">Nessun gioco trovato in questa categoria.</p>
              <button
                onClick={() => setActiveCategory(null)}
                className="mt-6 text-primary text-[10px] font-black uppercase tracking-widest border-b border-primary/30 pb-1"
              >
                Resetta Filtri
              </button>
            </div>
          )}
        </div>

        {/* Categories / Side Info */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-8 rounded-[2rem] border border-white/10 bg-card/50 backdrop-blur-sm">
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6 opacity-60">Game Categories</h3>
            <div className="flex flex-wrap gap-2">
              {['Arcade', 'Racing', 'Motorcycle', 'Retro', 'Neon', 'Trivia'].map(cat => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(isActive ? null : cat)}
                    className={cn(
                      "px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all",
                      isActive
                        ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(var(--primary),0.2)]"
                        : "bg-white/5 border-white/5 text-muted-foreground hover:border-white/20 hover:text-white"
                    )}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-8 rounded-[2rem] border border-white/10 bg-card/50 backdrop-blur-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/20 transition-all duration-700" />
            <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-6 opacity-60">Future Releases</h3>
            <div className="space-y-4">
              {UPCOMING_GAMES.length > 0 ? UPCOMING_GAMES.map(item => (
                <div
                  key={item.title}
                  className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-black/40 border border-white/5 opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/5 text-muted-foreground">
                      <Gamepad2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight">{item.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase opacity-60">{item.type}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono uppercase italic text-primary/50">
                    {item.progress}
                  </span>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground italic">Nessun rilascio pianificato.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Games;
