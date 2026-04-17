import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RefreshCw, Gamepad2, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface NeonRiderProps {
  onBack: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
}

export function NeonRider({ onBack }: NeonRiderProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('neon-rider-highscore') || 0));
  const [primaryColor, setPrimaryColor] = useState('#00FF41'); // Default fallback

  // Helper to safely handle transparency with both HEX and RGB colors
  const safeAlpha = (color: string, alpha: number) => {
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }
    return color.length === 7 ? `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}` : color;
  };

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
    obstacles: [] as { x: number, y: number, type: 'block' | 'coin', id: number, color?: string, vehicleType?: 'car' | 'suv' | 'moto' }[],
    particles: [] as Particle[],
    rain: [] as RainDrop[],
    speed: 5,
    frameCount: 0,
    lastTime: 0,
    laneOffset: 0,
    uiFlash: { type: 'none' as 'none' | 'damage' | 'coin', timer: 0 },
    primaryColor: '#00FF41',
    shake: 0,
  });

  // Get theme color on mount
  useEffect(() => {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--primary');
    const temp = document.createElement('div');
    temp.style.color = `hsl(${color})`;
    document.body.appendChild(temp);
    const resolvedColor = getComputedStyle(temp).color;
    document.body.removeChild(temp);
    setPrimaryColor(resolvedColor);
    gameRef.current.primaryColor = resolvedColor;
  }, []);

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setDisplayScore(0);
    gameRef.current = {
      ...gameRef.current,
      lane: 1,
      targetLane: 1,
      obstacles: [],
      particles: [],
      rain: Array.from({ length: 30 }, () => ({
        x: Math.random() * 800,
        y: Math.random() * 800,
        speed: 10 + Math.random() * 10,
        length: 15 + Math.random() * 10
      })),
      speed: 5,
      frameCount: 0,
      laneOffset: 0,
      lastTime: performance.now(),
      uiFlash: { type: 'none', timer: 0 },
      shake: 0,
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

    const handleTouch = (e: TouchEvent) => {
      const touchX = e.touches[0].clientX;
      const width = window.innerWidth;
      if (touchX < width / 2) {
        gameRef.current.targetLane = Math.max(0, gameRef.current.targetLane - 1);
      } else {
        gameRef.current.targetLane = Math.min(gameRef.current.lanesCount - 1, gameRef.current.targetLane + 1);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouch);
    handleResize();

    // Helper functions for drawing
    const drawShadow = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(0, h/2 + 5, w*0.8, h*0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawBike = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, alpha: number = 1, scale: number = 1) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;

      if (alpha === 1) drawShadow(ctx, 15, 30);

      // Glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;

      // Main Body (Carena)
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 22, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wheels
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#1a1a1a';
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      
      // Front
      ctx.beginPath();
      ctx.roundRect(-4, -28, 8, 16, 4);
      ctx.fill(); ctx.stroke();
      
      // Rear
      ctx.beginPath();
      ctx.roundRect(-5, 12, 10, 18, 4);
      ctx.fill(); ctx.stroke();

      // Pilot
      ctx.fillStyle = '#111';
      ctx.strokeStyle = `${color}66`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 7, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();

      // Headlight
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'white';
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(0, -20, 2, 0, Math.PI * 2);
      ctx.fill();

      // Taillight
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'red';
      ctx.fillStyle = '#FF3333';
      ctx.fillRect(-2, 28, 4, 2);

      ctx.restore();
    };

    const drawVehicle = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, type: string, scale: number = 1) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      
      const w = type === 'suv' ? 35 : 28;
      const h = type === 'suv' ? 55 : 50;

      drawShadow(ctx, w*0.8, h*0.8);

      // Body
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-w/2, -h/2, w, h, 6);
      ctx.fill();

      // Roof
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.roundRect(-w/2 + 4, -h/2 + 10, w - 8, h - 22, 4);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#0a0a0a';
      [[-w/2, -h/2+5], [w/2-6, -h/2+5], [-w/2, h/2-15], [w/2-6, h/2-15]].forEach(([wx, wy]) => {
        ctx.fillRect(wx, wy, 6, 10);
      });

      // Lights
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'white';
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(-w/2 + 4, -h/2 + 4, 2, 0, Math.PI * 2);
      ctx.arc(w/2 - 4, -h/2 + 4, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = '#FF0000';
      ctx.fillStyle = '#FF0000';
      ctx.beginPath();
      ctx.arc(-w/2 + 4, h/2 - 4, 2, 0, Math.PI * 2);
      ctx.arc(w/2 - 4, h/2 - 4, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const spawnParticles = (x: number, y: number, color: string, count: number) => {
      for (let i = 0; i < count; i++) {
        gameRef.current.particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 30,
          maxLife: 30,
          color
        });
      }
    };

    const draw = (time: number) => {
      const g = gameRef.current;
      const deltaTime = time - g.lastTime;
      g.lastTime = time;
      g.frameCount++;

      const horizon = 50;
      const centerX = canvas.width / 2;
      const getPerspectiveX = (x: number, y: number) => {
        const perspectiveScale = 0.4 + (0.6 * (y / canvas.height));
        return centerX + (x - centerX) * perspectiveScale;
      };
      const getPerspectiveScale = (y: number) => 0.4 + (0.6 * (y / canvas.height));

      // Update bike position
      const targetX = g.targetLane * g.laneWidth + (g.laneWidth / 2);
      g.bikeX += (targetX - g.bikeX) * 0.15;
      g.bikeY = canvas.height - 150;

      // Update Lane Offset (Movement effect)
      g.laneOffset = (g.laneOffset + g.speed) % 70;

      // Spawn obstacles
      if (g.frameCount % Math.max(25, Math.floor(70 - g.speed * 3)) === 0) {
        const lane = Math.floor(Math.random() * g.lanesCount);
        const isCoin = Math.random() > 0.8;
        const vehicleColors = ['#C0392B','#2980B9','#8E44AD','#E67E22','#27AE60'];
        const vehicleType = Math.random() > 0.7 ? 'suv' : 'car';
        
        g.obstacles.push({
          id: Date.now() + Math.random(),
          x: lane * g.laneWidth + (g.laneWidth / 2),
          y: -100,
          type: isCoin ? 'coin' : 'block',
          color: vehicleColors[Math.floor(Math.random() * vehicleColors.length)],
          vehicleType: vehicleType as any
        });
      }

      // Update entities
      g.obstacles.forEach((obs, index) => {
        obs.y += g.speed;
        
        // Visual Position for collision (consistency with 3D look)
        const visualObsX = getPerspectiveX(obs.x, obs.y);
        const visualBikeX = getPerspectiveX(g.bikeX, g.bikeY);
        
        const dx = Math.abs(visualBikeX - visualObsX);
        const dy = Math.abs(g.bikeY - obs.y);
        
        const collisionYRange = obs.type === 'coin' ? 30 : 45;
        const collisionXRange = obs.type === 'coin' ? 25 : 35;

        if (dx < collisionXRange && dy < collisionYRange) {
          if (obs.type === 'coin') {
            setScore(s => s + 10);
            g.uiFlash = { type: 'coin', timer: 2 };
            spawnParticles(visualObsX, obs.y, '#FFD700', 8);
            g.obstacles.splice(index, 1);
            g.speed += 0.05;
          } else {
            g.uiFlash = { type: 'damage', timer: 5 };
            g.shake = 10;
            spawnParticles(visualBikeX, g.bikeY, g.primaryColor, 15);
            setGameState('gameover');
          }
        }
        if (obs.y > canvas.height + 100) {
          g.obstacles.splice(index, 1);
          if (obs.type === 'block') setScore(s => s + 1);
        }
      });

      // Update particles
      g.particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.life <= 0) g.particles.splice(i, 1);
      });

      // Update rain
      if (score > 50) {
        g.rain.forEach(drop => {
          drop.y += drop.speed;
          drop.x += 1;
          if (drop.y > canvas.height) { drop.y = -20; drop.x = Math.random() * canvas.width; }
        });
      }

      // --- RENDERING ---
      ctx.save();
      if (g.shake > 0) {
        ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
        g.shake *= 0.9;
        if (g.shake < 0.1) g.shake = 0;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background - Asphalt base
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Asphalt Texture
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.height; i += 4) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // 3D Perspective simulation (drawing lanes)
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      
      for (let i = 0; i <= g.lanesCount; i++) {
        const laneX = i * g.laneWidth;
        const bottomX = laneX;
        const topX = centerX + (laneX - centerX) * 0.4;
        
        ctx.beginPath();
        if (i > 0 && i < g.lanesCount) {
          ctx.setLineDash([40, 30]);
          ctx.lineDashOffset = -g.frameCount * g.speed;
        } else {
          ctx.setLineDash([]);
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        }
        
        ctx.moveTo(topX, horizon);
        ctx.lineTo(bottomX, canvas.height);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Horizon Glow
      const horizonGrad = ctx.createLinearGradient(0, 0, 0, 150);
      horizonGrad.addColorStop(0, safeAlpha(g.primaryColor, 0.15));
      horizonGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, 0, canvas.width, 150);

      // Draw Entities with Perspective
      g.obstacles.forEach(obs => {
        const px = getPerspectiveX(obs.x, obs.y);
        const ps = getPerspectiveScale(obs.y);

        if (obs.type === 'coin') {
          ctx.save();
          ctx.translate(px, obs.y);
          const rotationScale = Math.abs(Math.cos(g.frameCount * 0.1));
          ctx.scale(rotationScale * ps, 1 * ps);
          
          drawShadow(ctx, 12, 12);
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#FFD700';
          ctx.fillStyle = '#FFD700';
          ctx.strokeStyle = '#FFA500';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          
          ctx.fillStyle = '#8B6914';
          ctx.font = 'bold 8px font-mono';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('V', 0, 0);
          ctx.restore();
        } else {
          drawVehicle(ctx, px, obs.y, obs.color!, obs.vehicleType!, ps);
        }
      });

      // Draw Bike with Perspective and Blur
      const bikePX = getPerspectiveX(g.bikeX, g.bikeY);
      const bikePS = getPerspectiveScale(g.bikeY);

      for (let i = 4; i > 0; i--) {
        const trailY = g.bikeY + (i * 12);
        const trailX = getPerspectiveX(g.bikeX, trailY);
        const trailS = getPerspectiveScale(trailY) * (1 - (i * 0.05));
        const trailAlpha = 0.3 / i;
        drawBike(ctx, trailX, trailY, g.primaryColor, trailAlpha, trailS);
      }
      drawBike(ctx, bikePX, g.bikeY, g.primaryColor, 1, bikePS);

      // Particles
      g.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Rain
      if (score > 50) {
        ctx.strokeStyle = 'rgba(174,194,224,0.3)';
        g.rain.forEach(drop => {
          ctx.beginPath(); ctx.moveTo(drop.x, drop.y); ctx.lineTo(drop.x + 2, drop.y + drop.length); ctx.stroke();
        });
      }

      // Speed lines
      if (g.speed > 8) {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 5; i++) {
          const sx = i % 2 === 0 ? 10 : canvas.width - 20;
          const sy = (g.frameCount * 20 + i * 100) % canvas.height;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 10, sy); ctx.stroke();
        }
      }

      // UI Flashes
      if (g.uiFlash.timer > 0) {
        ctx.fillStyle = g.uiFlash.type === 'damage' ? 'rgba(255,0,0,0.2)' : 'rgba(255,215,0,0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        g.uiFlash.timer--;
      }

      ctx.restore(); // Restore shake transform

      if (gameState === 'playing') {
        animationId = requestAnimationFrame(draw);
      }
    };

    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('touchstart', handleTouch);
    };
  }, [gameState, score]);

  // Handle count-up for score
  useEffect(() => {
    if (gameState === 'gameover' && displayScore < score) {
      const step = Math.ceil((score - displayScore) / 10);
      const timer = setTimeout(() => setDisplayScore(s => Math.min(score, s + step)), 30);
      return () => clearTimeout(timer);
    }
  }, [gameState, score, displayScore]);

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
      <div className="flex-1 relative overflow-hidden bg-black">
        <canvas ref={canvasRef} className="w-full h-full block cursor-none" />

        {/* Overlays */}
        {gameState === 'start' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
            <div className="text-center space-y-6 max-w-sm px-6">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8 glow-green relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent animate-pulse" />
                <Gamepad2 className="w-10 h-10 text-primary z-10" />
              </div>
              <h2 className="text-4xl font-black font-display uppercase tracking-tighter">
                {t('games.neonRider.title')}
              </h2>
              
              {highScore > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                  <Trophy className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-black uppercase text-primary">{t('games.neonRider.highScore')}: {highScore}</span>
                </div>
              )}

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
              
              <div className="flex justify-center gap-8 mt-12 opacity-40">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-6 h-6 rounded border border-white/20 flex items-center justify-center text-[10px]">A</span>
                  </div>
                  <span className="text-[8px] uppercase font-bold tracking-widest">Left</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-6 h-6 rounded border border-white/20 flex items-center justify-center text-[10px]">D</span>
                  </div>
                  <span className="text-[8px] uppercase font-bold tracking-widest">Right</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95 backdrop-blur-md animate-in fade-in duration-700">
            <div className="text-center space-y-4">
              <p className="text-xs font-black font-mono text-red-500 tracking-[0.8em] mb-4 uppercase animate-pulse">{t('games.neonRider.gameOver')}</p>
              <h2 className="text-8xl font-black font-display uppercase tracking-tighter mb-8 tabular-nums text-white">
                {displayScore.toLocaleString()}
              </h2>
              
              {score === highScore && score > 0 && (
                <div className="flex items-center justify-center gap-2 text-primary font-black uppercase tracking-widest text-xs mb-8 animate-bounce">
                  <Trophy className="w-4 h-4" />
                  New Personal Best!
                </div>
              )}

              <div className="flex flex-col gap-4 max-w-[240px] mx-auto">
                <button 
                  onClick={startGame}
                  className="flex items-center justify-center gap-3 px-12 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  <RefreshCw className="w-5 h-5" />
                  Re-Launch
                </button>
                <button 
                  onClick={onBack}
                  className="px-12 py-4 rounded-2xl border border-white/5 text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all font-black uppercase tracking-widest text-[10px]"
                >
                  {t('games.neonRider.back')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Mobile Tap Zones */}
      <div className="h-24 bg-black/40 border-t border-white/5 flex items-stretch">
        <div 
          onClick={() => gameRef.current.targetLane = Math.max(0, gameRef.current.targetLane - 1)}
          className="flex-1 border-r border-white/5 flex items-center justify-center group active:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex flex-col items-center gap-1 text-muted-foreground/30 group-active:text-primary transition-colors">
            <span className="text-[10px] font-black tracking-widest leading-none mb-1">TAP LEFT</span>
            <div className="w-8 h-1 bg-current rounded-full" />
          </div>
        </div>
        <div 
          onClick={() => gameRef.current.targetLane = Math.min(gameRef.current.lanesCount - 1, gameRef.current.targetLane + 1)}
          className="flex-1 flex items-center justify-center group active:bg-white/5 transition-colors cursor-pointer"
        >
          <div className="flex flex-col items-center gap-1 text-muted-foreground/30 group-active:text-primary transition-colors">
            <span className="text-[10px] font-black tracking-widest leading-none mb-1">TAP RIGHT</span>
            <div className="w-8 h-1 bg-current rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
