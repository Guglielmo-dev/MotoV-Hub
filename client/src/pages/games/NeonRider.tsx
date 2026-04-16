import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RefreshCw, Gamepad2, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface NeonRiderProps {
  onBack: () => void;
}

export function NeonRider({ onBack }: NeonRiderProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('neon-rider-highscore') || 0));

  // Game Logic Ref
  const gameRef = useRef({
    lane: 1, // 0, 1, 2
    lanesCount: 3,
    targetLane: 1,
    laneWidth: 0,
    bikeX: 0,
    bikeY: 0,
    bikeWidth: 40,
    bikeHeight: 80,
    obstacles: [] as { x: number, y: number, type: 'block' | 'coin', id: number }[],
    speed: 5,
    frameCount: 0,
    lastTime: 0,
  });

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    gameRef.current = {
      ...gameRef.current,
      lane: 1,
      targetLane: 1,
      obstacles: [],
      speed: 5,
      frameCount: 0,
      lastTime: performance.now(),
    };
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const handleResize = () => {
      canvas.width = canvas.parentElement?.clientWidth || 400;
      canvas.height = canvas.parentElement?.clientHeight || 600;
      gameRef.current.laneWidth = canvas.width / gameRef.current.lanesCount;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        gameRef.current.targetLane = Math.max(0, gameRef.current.targetLane - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        gameRef.current.targetLane = Math.min(gameRef.current.lanesCount - 1, gameRef.current.targetLane + 1);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    handleResize();

    const draw = (time: number) => {
      const g = gameRef.current;
      const deltaTime = time - g.lastTime;
      g.lastTime = time;
      g.frameCount++;

      // Update bike position (smooth lane transition)
      const targetX = g.targetLane * g.laneWidth + (g.laneWidth / 2);
      g.bikeX += (targetX - g.bikeX) * 0.2;
      g.bikeY = canvas.height - 120;

      // Spawn obstacles
      if (g.frameCount % Math.max(20, Math.floor(60 - g.speed * 2)) === 0) {
        const lane = Math.floor(Math.random() * g.lanesCount);
        const type = Math.random() > 0.8 ? 'coin' : 'block';
        g.obstacles.push({
          id: Date.now() + Math.random(),
          x: lane * g.laneWidth + (g.laneWidth / 2),
          y: -50,
          type
        });
      }

      // Update obstacles
      g.obstacles.forEach((obs, index) => {
        obs.y += g.speed;
        
        // Collision detection
        const dx = Math.abs(g.bikeX - obs.x);
        const dy = Math.abs(g.bikeY - obs.y);
        
        if (dx < 30 && dy < 40) {
          if (obs.type === 'coin') {
            setScore(s => s + 10);
            g.obstacles.splice(index, 1);
            g.speed += 0.1; // Increase difficulty
          } else {
            setGameState('gameover');
          }
        }

        // Remove offscreen
        if (obs.y > canvas.height + 50) {
          g.obstacles.splice(index, 1);
          if (obs.type === 'block') setScore(s => s + 1);
        }
      });

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid / Road
      ctx.strokeStyle = '#00FF4122';
      ctx.lineWidth = 1;
      for (let i = 0; i <= g.lanesCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * g.laneWidth, 0);
        ctx.lineTo(i * g.laneWidth, canvas.height);
        ctx.stroke();
      }

      // Draw Horizon Glowing effect
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#000000');
      gradient.addColorStop(1, '#00FF4108');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Obstacles
      g.obstacles.forEach(obs => {
        if (obs.type === 'coin') {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#00FF41';
          ctx.fillStyle = '#00FF41';
          ctx.beginPath();
          ctx.arc(obs.x, obs.y, 10, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#FF0041';
          ctx.fillStyle = '#FF0041';
          ctx.beginPath();
          ctx.roundRect(obs.x - 15, obs.y - 15, 30, 30, 5);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      });

      // Draw Bike (Triangle/Simple Shape for now)
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#00FF41';
      ctx.fillStyle = '#00FF41';
      ctx.beginPath();
      ctx.moveTo(g.bikeX, g.bikeY - 20);
      ctx.lineTo(g.bikeX - 15, g.bikeY + 20);
      ctx.lineTo(g.bikeX + 15, g.bikeY + 20);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      if (gameState === 'playing') {
        animationId = requestAnimationFrame(draw);
      }
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'gameover' && score > highScore) {
      setHighScore(score);
      localStorage.setItem('neon-rider-highscore', score.toString());
    }
  }, [gameState, score, highScore]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-500">
      {/* HUD Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/40 backdrop-blur-md">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors uppercase font-black text-xs tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('games.neonRider.back')}
        </button>

        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">{t('games.neonRider.highScore')}</p>
            <p className="text-xl font-black font-display text-primary leading-none">{highScore.toLocaleString()}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">{t('games.neonRider.score')}</p>
            <p className="text-3xl font-black font-display text-white leading-none tabular-nums">{score.toLocaleString()}</p>
          </div>
        </div>

        <div className="w-24" /> {/* Spacer */}
      </div>

      {/* Game Area */}
      <div className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(0,255,65,0.05),transparent)]">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Overlays */}
        {gameState === 'start' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-6 max-w-sm px-6">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8 glow-green rotate-12">
                <Gamepad2 className="w-10 h-10 text-primary -rotate-12" />
              </div>
              <h2 className="text-4xl font-black font-display uppercase tracking-tighter">
                {t('games.neonRider.title')}
              </h2>
              <p className="text-muted-foreground text-sm uppercase tracking-widest opacity-60">
                {t('games.neonRider.start')}
              </p>
              <div className="pt-8">
                <button 
                  onClick={startGame}
                  className="px-10 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-2xl shadow-primary/20"
                >
                  <Play className="w-6 h-6 fill-current" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground/40 mt-12 uppercase tracking-[0.3em]">
                Use Arrows or A/D to switch lanes
              </p>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
            <div className="text-center space-y-4">
              <p className="text-sm font-black font-mono text-red-500 tracking-[0.5em] mb-2">{t('games.neonRider.gameOver')}</p>
              <h2 className="text-7xl font-black font-display uppercase tracking-tighter mb-8 tabular-nums">
                {score.toLocaleString()}
              </h2>
              <div className="flex flex-col gap-4">
                <button 
                  onClick={startGame}
                  className="flex items-center justify-center gap-3 px-12 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
                <button 
                  onClick={onBack}
                  className="px-12 py-4 rounded-2xl border border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all font-black uppercase tracking-widest text-xs"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Controls Hint */}
      {gameState === 'playing' && (
        <div className="p-6 bg-black/40 border-t border-white/5 flex justify-center items-center gap-12 text-muted-foreground/30 font-bold text-[10px] uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10 italic">A</span>
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10 italic">D</span>
            MOVE
          </div>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <div className="flex items-center gap-2 underline underline-offset-4 decoration-primary/30">
            AVOID BLOCKS
          </div>
          <div className="w-1 h-1 rounded-full bg-white/10" />
          <div className="flex items-center gap-2 underline underline-offset-4 decoration-primary/30 text-primary/40">
            COLLECT VAULT COINS
          </div>
        </div>
      )}
    </div>
  );
}
