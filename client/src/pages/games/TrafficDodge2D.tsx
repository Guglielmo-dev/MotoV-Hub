import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Trophy, RefreshCw, Gamepad2, Play, Lightbulb, Bike as BikeIcon, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { useMotorcycles } from "@/hooks/use-motorcycles";
import { cn } from "@/lib/utils";
import { type Motorcycle } from "@shared/schema";

interface TrafficDodge2DProps {
  onBack: () => void;
}

export function TrafficDodge2D({ onBack }: TrafficDodge2DProps) {
  const { t } = useTranslation();
  const { data: user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'setup' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [primaryColor, setPrimaryColor] = useState('#00FF41');
  const [selectedBike, setSelectedBike] = useState<Motorcycle | null>(null);
  const [selectionIndex, setSelectionIndex] = useState(0);
  const [highBeamActive, setHighBeamActive] = useState(false);
  const { data: motorcycles } = useMotorcycles();

  const getBrandColor = (brand: string) => {
    const b = brand.toLowerCase();
    if (b.includes('kawasaki')) return '#00FF41';
    if (b.includes('ducati')) return '#FF0000';
    if (b.includes('yamaha')) return '#0000FF';
    if (b.includes('honda')) return '#FF4500';
    if (b.includes('suzuki')) return '#1B458F';
    if (b.includes('ktm')) return '#FF6600';
    if (b.includes('bmw')) return '#00BFFF';
    return null;
  };

  const triggerHighBeam = () => {
    if (gameState === 'playing') {
      gameRef.current.highBeamTimer = 20;
      setHighBeamActive(true);
      setTimeout(() => setHighBeamActive(false), 200);
    }
  };

  const gameRef = useRef({
    lanesCount: 4,
    laneWidth: 0,
    bikeLane: 1, // 0 to 3
    bikeX: 0,
    bikeVelocityX: 0,
    bikeLean: 0,
    bikeY: 0,
    speed: 6,
    distance: 0,
    highBeamTimer: 0,
    obstacles: [] as { x: number, y: number, lane: number, targetLane: number, width: number, height: number, speed: number, color: string, passed: boolean, turnSignal: 'none' | 'left' | 'right', turnTimer: number }[],
    frameCount: 0,
    roadOffset: 0
  });

  useEffect(() => {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--primary');
    const temp = document.createElement('div');
    temp.style.color = `hsl(${color})`;
    document.body.appendChild(temp);
    const resolvedColor = getComputedStyle(temp).color || '#00FF41';
    document.body.removeChild(temp);
    setPrimaryColor(resolvedColor);
  }, []);

  const startGame = (bike: Motorcycle | null = null) => {
    const laneW = (canvasRef.current?.parentElement?.clientWidth || 400) / 4;
    
    // Determine color
    let color = '#00FF41';
    if (bike) {
      color = getBrandColor(bike.brand) || '#00FF41';
    } else {
      const themeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary');
      const temp = document.createElement('div');
      temp.style.color = `hsl(${themeColor})`;
      document.body.appendChild(temp);
      color = getComputedStyle(temp).color || '#00FF41';
      document.body.removeChild(temp);
    }
    
    setPrimaryColor(color);
    setSelectedBike(bike);
    setGameState('playing');
    setScore(0);
    gameRef.current = {
      ...gameRef.current,
      bikeLane: 1,
      bikeX: 1 * laneW + (laneW / 2),
      bikeVelocityX: 0,
      bikeLean: 0,
      speed: 6,
      distance: 0,
      obstacles: [],
      frameCount: 0,
      roadOffset: 0
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
      gameRef.current.bikeY = canvas.height - 120;
      if (gameRef.current.bikeX === 0) {
        gameRef.current.bikeX = gameRef.current.bikeLane * gameRef.current.laneWidth + (gameRef.current.laneWidth / 2);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        gameRef.current.bikeLane = Math.max(0, gameRef.current.bikeLane - 1);
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        gameRef.current.bikeLane = Math.min(gameRef.current.lanesCount - 1, gameRef.current.bikeLane + 1);
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') {
        triggerHighBeam();
      }
    };

    const handleTouch = (e: TouchEvent) => {
      const touchX = e.touches[0].clientX;
      const width = window.innerWidth;
      if (touchX < width / 2) {
        gameRef.current.bikeLane = Math.max(0, gameRef.current.bikeLane - 1);
      } else {
        gameRef.current.bikeLane = Math.min(gameRef.current.lanesCount - 1, gameRef.current.bikeLane + 1);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouch);
    handleResize();

    const drawBike = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, rotation: number = 0, isHighBeam: boolean = false) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(3, 5, width / 2, height / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tires
      ctx.fillStyle = '#111';
      // Front tire
      ctx.fillRect(-3, -height / 2 - 4, 6, 12);
      // Rear tire
      ctx.fillRect(-4, height / 2 - 8, 8, 14);

      // Main body (Fairing / Tank)
      ctx.fillStyle = color;
      ctx.beginPath();
      // Pointy front, wider middle, tapered back
      ctx.moveTo(0, -height / 2);
      ctx.quadraticCurveTo(width / 2, -height / 4, width / 2.5, 0);
      ctx.lineTo(width / 3, height / 4);
      ctx.lineTo(-width / 3, height / 4);
      ctx.lineTo(-width / 2.5, 0);
      ctx.quadraticCurveTo(-width / 2, -height / 4, 0, -height / 2);
      ctx.fill();

      // Seat
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.roundRect(-width / 3.5, 0, width / 1.75, height / 2.5, 3);
      ctx.fill();

      // Handlebars
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-width / 1.5, -height / 3);
      ctx.lineTo(0, -height / 4);
      ctx.lineTo(width / 1.5, -height / 3);
      ctx.stroke();

      // Windshield
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.arc(0, -height / 2 + 5, 8, Math.PI, 0);
      ctx.fill();

      // Pilot Shoulders/Arms
      ctx.fillStyle = '#222';
      ctx.beginPath();
      ctx.ellipse(0, -2, width / 2 - 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pilot Helmet
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(0, -5, 7, 0, Math.PI * 2);
      ctx.fill();
      
      // Helmet visor
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.arc(0, -7, 5, Math.PI * 0.8, Math.PI * 0.2, true);
      ctx.fill();

      // Headlight
      ctx.fillStyle = '#FFF';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FFF';
      ctx.beginPath();
      ctx.arc(0, -height / 2 - 2, 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Light beam
      const beamLength = isHighBeam ? 250 : 100;
      const beamWidth = isHighBeam ? width * 4 : width * 2;
      const gradient = ctx.createLinearGradient(0, -height/2, 0, -height/2 - beamLength);
      gradient.addColorStop(0, isHighBeam ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(-2, -height/2);
      ctx.lineTo(-beamWidth, -height/2 - beamLength);
      ctx.lineTo(beamWidth, -height/2 - beamLength);
      ctx.lineTo(2, -height/2);
      ctx.fill();

      // Taillight
      ctx.shadowBlur = 5;
      ctx.shadowColor = 'red';
      ctx.fillStyle = '#F00';
      ctx.fillRect(-3, height / 2 - 2, 6, 3);

      ctx.restore();
    };

    const drawCar = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string, turnSignal: 'none' | 'left' | 'right' = 'none', frameCount: number = 0) => {
      ctx.save();
      ctx.translate(x, y);

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(-width / 2 + 5, -height / 2 + 5, width, height);

      // Body
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-width / 2, -height / 2, width, height, 4);
      ctx.fill();

      // Windshield
      ctx.fillStyle = '#111';
      ctx.fillRect(-width / 2 + 4, -height / 4, width - 8, height / 3);

      // Rear window
      ctx.fillRect(-width / 2 + 4, height / 2 - 10, width - 8, 6);

      // Headlights
      ctx.fillStyle = '#FFF';
      ctx.beginPath(); ctx.arc(-width / 2 + 6, -height / 2 + 4, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(width / 2 - 6, -height / 2 + 4, 3, 0, Math.PI * 2); ctx.fill();
      
      // Taillights
      ctx.fillStyle = '#F00';
      ctx.fillRect(-width / 2 + 2, height / 2 - 4, 8, 4);
      ctx.fillRect(width / 2 - 10, height / 2 - 4, 8, 4);

      // Turn signals
      if (turnSignal !== 'none' && frameCount % 20 < 10) {
        ctx.fillStyle = '#FFA500';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFA500';
        if (turnSignal === 'left') {
          ctx.fillRect(-width / 2 + 2, height / 2 - 4, 8, 4);
          ctx.fillRect(-width / 2 + 6, -height / 2 + 4, 4, 4); // front
        } else if (turnSignal === 'right') {
          ctx.fillRect(width / 2 - 10, height / 2 - 4, 8, 4);
          ctx.fillRect(width / 2 - 10, -height / 2 + 4, 4, 4); // front
        }
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    };

    const draw = (time: number) => {
      const g = gameRef.current;
      g.frameCount++;
      if (g.highBeamTimer > 0) g.highBeamTimer--;
      
      // Update road
      g.roadOffset = (g.roadOffset + g.speed) % 60;
      g.distance += g.speed;
      
      // Speed progression
      if (g.frameCount % 300 === 0 && g.speed < 20) {
        g.speed += 0.5;
      }

      // Update score (1 point per 100 distance)
      const currentScore = Math.floor(g.distance / 100);
      setScore(currentScore);

      // Spawn obstacles
      // The higher the speed, the more frequent obstacles spawn
      const spawnRate = Math.max(20, 80 - g.speed * 2);
      if (g.frameCount % Math.floor(spawnRate) === 0) {
        const lane = Math.floor(Math.random() * g.lanesCount);
        // Ensure we don't spawn exactly on top of another recent spawn in the same lane
        const recentInLane = g.obstacles.some(o => o.lane === lane && o.y < 150);
        
        if (!recentInLane) {
          const isTruck = Math.random() > 0.8;
          const colors = ['#e74c3c', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#95a5a6'];
          g.obstacles.push({
            x: lane * g.laneWidth + (g.laneWidth / 2),
            y: -100,
            lane: lane,
            targetLane: lane,
            width: isTruck ? 44 : 36,
            height: isTruck ? 90 : 60,
            speed: isTruck ? g.speed * 0.4 : g.speed * 0.6 + Math.random() * 2, // Cars move slower than player
            color: colors[Math.floor(Math.random() * colors.length)],
            passed: false,
            turnSignal: 'none',
            turnTimer: 0
          });
        }
      }

      // Physics & Game logic
      const targetBikeX = g.bikeLane * g.laneWidth + (g.laneWidth / 2);
      
      // Spring physics for fluid "serpentine" movement
      const stiffness = 0.08;
      const damping = 0.35;
      const springForce = (targetBikeX - g.bikeX) * stiffness;
      g.bikeVelocityX = (g.bikeVelocityX + springForce) * (1 - damping);
      g.bikeX += g.bikeVelocityX;
      
      // Lean angle is directly proportional to horizontal velocity
      const targetLean = (g.bikeVelocityX / g.laneWidth) * 2.5; 
      g.bikeLean += (targetLean - g.bikeLean) * 0.4; // Snappy lean recovery

      const bikeWidth = 24;
      const bikeHeight = 48;

      g.obstacles.forEach((obs, index) => {
        // Obstacle moves down relative to the player
        obs.y += (g.speed - obs.speed);
        
        // Horizontal movement for lane changes
        const targetX = obs.targetLane * g.laneWidth + (g.laneWidth / 2);
        obs.x += (targetX - obs.x) * 0.1; // Smooth lateral movement
        
        if (Math.abs(obs.x - targetX) < 1) {
           obs.lane = obs.targetLane;
           if (obs.turnSignal !== 'none') obs.turnSignal = 'none'; // Turn off signal when done
        }

        // Headlight approach logic (Car moves out of the way)
        const dxToBike = Math.abs(g.bikeX - obs.x);
        const dyToBike = obs.y - g.bikeY; // Negative means car is ahead of bike
        
        // Only dodge if high beams are flashed, bike is behind the car, in the same lane, and within range
        if (g.highBeamTimer > 0 && g.bikeLane === obs.targetLane && dyToBike < -50 && dyToBike > -350 && dxToBike < g.laneWidth / 2) {
           if (obs.turnSignal === 'none' && obs.turnTimer <= 0) {
              // Try to change lane
              const canMoveLeft = obs.lane > 0 && !g.obstacles.some(o => o !== obs && o.targetLane === obs.lane - 1 && Math.abs(o.y - obs.y) < 120);
              const canMoveRight = obs.lane < g.lanesCount - 1 && !g.obstacles.some(o => o !== obs && o.targetLane === obs.lane + 1 && Math.abs(o.y - obs.y) < 120);
              
              if (canMoveRight) {
                 obs.targetLane = obs.lane + 1;
                 obs.turnSignal = 'right';
                 obs.turnTimer = 60; // Cooldown
              } else if (canMoveLeft) {
                 obs.targetLane = obs.lane - 1;
                 obs.turnSignal = 'left';
                 obs.turnTimer = 60;
              }
           }
        }
        
        if (obs.turnTimer > 0) obs.turnTimer--;
      });

      // Prevent cars passing through each other
      // Sort obstacles by Y ascending (smallest Y is furthest ahead on the road)
      const sortedObstacles = [...g.obstacles].sort((a, b) => a.y - b.y);
      for (let i = 0; i < sortedObstacles.length; i++) {
        const leader = sortedObstacles[i];
        for (let j = i + 1; j < sortedObstacles.length; j++) {
          const follower = sortedObstacles[j]; // Follower is closer to player (larger Y)
          // Only check collision if they are in the same physical lane or target lane
          if (leader.targetLane === follower.targetLane || leader.lane === follower.lane) {
            const minDistance = leader.height / 2 + follower.height / 2 + 15;
            if (follower.y - leader.y < minDistance) {
              // Follower catches up, must brake (move down screen)
              follower.y = leader.y + minDistance;
              follower.speed = leader.speed; // Match speed
            }
          }
        }
      }

      g.obstacles.forEach((obs, index) => {
        // Update score for passing
        if (!obs.passed && obs.y > g.bikeY + bikeHeight) {
           obs.passed = true;
           setScore(s => s + 5); // Bonus points for passing
        }

        // Collision Detection AABB
        const dx = Math.abs(g.bikeX - obs.x);
        const dy = Math.abs(g.bikeY - obs.y);
        
        if (dx < (bikeWidth/2 + obs.width/2 - 4) && dy < (bikeHeight/2 + obs.height/2 - 4)) {
          // Game Over
          setGameState('gameover');
          if (currentScore > highScore) setHighScore(currentScore);
        }

        // Cleanup
        if (obs.y > canvas.height + 150) {
          g.obstacles.splice(index, 1);
        }
      });

      // RENDER
      ctx.fillStyle = '#2c3e50';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw road
      ctx.fillStyle = '#34495e';
      const roadMargin = 20;
      ctx.fillRect(roadMargin, 0, canvas.width - roadMargin * 2, canvas.height);

      // Draw lane dividers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 4;
      ctx.setLineDash([30, 30]);
      ctx.lineDashOffset = -g.roadOffset;
      
      for (let i = 1; i < g.lanesCount; i++) {
        const x = i * g.laneWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      
      // Draw curbs
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(roadMargin, 0); ctx.lineTo(roadMargin, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(canvas.width - roadMargin, 0); ctx.lineTo(canvas.width - roadMargin, canvas.height); ctx.stroke();

      // Draw obstacles
      g.obstacles.forEach(obs => {
        drawCar(ctx, obs.x, obs.y, obs.width, obs.height, obs.color, obs.turnSignal, g.frameCount);
      });

      // Draw Bike
      drawBike(ctx, g.bikeX, g.bikeY, bikeWidth, bikeHeight, primaryColor, g.bikeLean, g.highBeamTimer > 0);
      
      // Draw Speed overlay
      ctx.fillStyle = '#FFF';
      ctx.font = '16px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${Math.floor(g.speed * 10)} km/h`, canvas.width - 10, 30);

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
  }, [gameState, highScore, primaryColor]);

  return (
    <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500 min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-8 px-4">
        <button
          onClick={onBack}
          className="group flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all border border-white/10 hover:border-white/20"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold tracking-wide uppercase text-sm">{t('games.trafficDodge.back', 'Back')}</span>
        </button>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground opacity-60">{t('games.trafficDodge.highScore', 'High Score')}</span>
            <div className="flex items-center gap-2 text-xl font-black text-primary">
              <Trophy className="w-5 h-5" />
              {highScore}
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col items-end min-w-[100px]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground opacity-60">{t('games.trafficDodge.score', 'Score')}</span>
            <span className="text-2xl font-black font-mono tabular-nums leading-none">{score}</span>
          </div>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative w-full max-w-lg aspect-[2/3] max-h-[70vh] rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black ring-1 ring-white/5 group">
        <canvas
          ref={canvasRef}
          className="block w-full h-full"
        />

        {gameState === 'start' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-8 text-center z-10">
            <div className="w-24 h-24 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center mb-6 animate-pulse">
              <Gamepad2 className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white">Traffic Dodge</h2>
            <p className="text-muted-foreground mb-8 text-sm max-w-[250px] leading-relaxed">
              {t('games.trafficDodge.desc', 'Dodge traffic, survive as long as possible, and set a new high score.')}
            </p>
            <button
              onClick={() => setGameState('setup')}
              className="flex items-center gap-3 px-8 py-4 bg-primary text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(var(--primary),0.3)]"
            >
              <Play className="w-5 h-5 fill-current" />
              {t('games.trafficDodge.playNow', 'Play Now')}
            </button>
            <p className="mt-6 text-[10px] font-mono text-muted-foreground uppercase tracking-widest opacity-50">
              {t('games.trafficDodge.controls', 'Use A/D or Arrow Keys to steer')}
            </p>
          </div>
        )}

        {gameState === 'setup' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-6 text-center z-20 animate-in fade-in zoom-in-95 duration-500">
            <h3 className="text-xl font-black uppercase tracking-widest mb-8 text-primary">Seleziona la tua Moto</h3>
            
            <div className="grid grid-cols-1 gap-6 w-full max-w-sm">
              {/* Default Bike Card */}
              <button
                onClick={() => startGame(null)}
                className="group relative flex flex-col items-center p-6 rounded-3xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-primary/5 transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BikeIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                </div>
                <span className="font-black uppercase tracking-widest text-sm mb-1">Moto di Default</span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">Kawasaki Style</span>
              </button>

              {/* Garage Bike Card */}
              <div className="relative">
                {(!motorcycles || motorcycles.length === 0) ? (
                  <div className="flex flex-col items-center p-6 rounded-3xl bg-white/5 border border-white/10 opacity-50 grayscale">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                      <Trophy className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm mb-1">Il Tuo Garage</span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase">Nessuna moto disponibile</span>
                  </div>
                ) : motorcycles.length === 1 ? (
                  <button
                    onClick={() => startGame(motorcycles[0])}
                    className="w-full group relative flex flex-col items-center p-6 rounded-3xl bg-primary/10 border border-primary/30 hover:border-primary hover:bg-primary/20 transition-all shadow-[0_0_20px_rgba(var(--primary),0.1)]"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <BikeIcon className="w-6 h-6 text-primary" />
                    </div>
                    <span className="font-black uppercase tracking-widest text-sm mb-1">{motorcycles[0].model}</span>
                    <span className="text-[10px] font-mono text-primary uppercase tracking-tighter font-bold">{motorcycles[0].brand}</span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center p-6 rounded-3xl bg-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
                    <div className="flex items-center justify-between w-full mb-4 px-2">
                      <button 
                        onClick={() => setSelectionIndex(prev => (prev - 1 + motorcycles.length) % motorcycles.length)}
                        className="p-2 rounded-full hover:bg-primary/20 text-primary transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mb-2">
                          <BikeIcon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-black uppercase tracking-tight text-xs">{motorcycles[selectionIndex].model}</span>
                        <span className="text-[8px] font-mono text-primary uppercase font-bold">{motorcycles[selectionIndex].brand}</span>
                      </div>
                      <button 
                        onClick={() => setSelectionIndex(prev => (prev + 1) % motorcycles.length)}
                        className="p-2 rounded-full hover:bg-primary/20 text-primary transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => startGame(motorcycles[selectionIndex])}
                      className="w-full py-3 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(var(--primary),0.3)]"
                    >
                      Seleziona
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => setGameState('start')}
              className="mt-8 text-[10px] font-mono text-muted-foreground uppercase tracking-widest hover:text-white transition-colors"
            >
              Annulla
            </button>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-8 text-center z-10 animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-5xl font-black uppercase tracking-tighter text-red-500 mb-2 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
              {t('games.trafficDodge.gameOver', 'CRASHED')}
            </h2>
            <p className="text-muted-foreground mb-8 text-sm font-mono uppercase tracking-widest">
              {t('games.trafficDodge.finalScore', 'Final Score')}: {score}
            </p>
            
            <button
              onClick={() => setGameState('setup')}
              className="flex items-center gap-3 px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all"
            >
              <RefreshCw className="w-5 h-5" />
              {t('games.trafficDodge.playAgain', 'Play Again')}
            </button>
          </div>
        )}
        
        {/* CRT Scanline Effect Overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] opacity-20" />

        {/* High Beam Button for Mobile/Touch */}
        {gameState === 'playing' && (
          <button
            onClick={triggerHighBeam}
            className={cn(
              "absolute bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center transition-all z-20 shadow-lg border-2",
              highBeamActive 
                ? "bg-white text-black border-white scale-95 shadow-[0_0_20px_rgba(255,255,255,0.8)]" 
                : "bg-black/50 text-white/70 border-white/20 hover:bg-white/10 backdrop-blur-md"
            )}
          >
            <Lightbulb className={cn("w-7 h-7", highBeamActive ? "fill-current" : "")} />
          </button>
        )}
      </div>
    </div>
  );
}

export default TrafficDodge2D;
