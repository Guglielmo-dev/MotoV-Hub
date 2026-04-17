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

interface GoldParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
}

interface Splash {
  x: number;
  y: number;
  life: number;
}

interface SkylineBuilding {
  x: number;
  width: number;
  height: number;
  signs: number[];
  windows: { x: number; y: number; state: boolean }[];
}

interface SpeedLine {
  x: number;
  y: number;
  length: number;
  opacity: number;
  isRight: boolean;
}

class AudioEngine {
  ctx: AudioContext | null = null;
  engineOsc: OscillatorNode | null = null;
  engineGain: GainNode | null = null;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startEngine(speed: number) {
    if (!this.ctx) return;
    this.stopEngine();
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.04;
    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.frequency.value = 80 + speed * 15;
    this.engineOsc.start();
  }

  updateEngine(speed: number) {
    if (this.engineOsc && this.ctx) {
      this.engineOsc.frequency.setTargetAtTime(80 + speed * 15, this.ctx.currentTime, 0.1);
    }
  }

  stopEngine() {
    if (this.engineOsc) {
      this.engineOsc.stop();
      this.engineOsc.disconnect();
      this.engineOsc = null;
    }
  }

  playCoin() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(880, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1320, this.ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  playNearMiss() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playGameOver() {
    if (!this.ctx) return;
    this.stopEngine();
    const ctx = this.ctx;
    const freqs = [440, 330, 220, 110];
    const duration = 0.12;
    
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, ctx.currentTime + (i * duration));
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + ((i + 1) * duration));
      
      osc.start(ctx.currentTime + (i * duration));
      osc.stop(ctx.currentTime + ((i + 1) * duration));
    });
  }
}

export function NeonRider({ onBack }: NeonRiderProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('neon-rider-highscore') || 0));
  const [primaryColor, setPrimaryColor] = useState('#00FF41');
  const audioRef = useRef(new AudioEngine());

  const safeAlpha = (color: string, alpha: number) => {
    if (color.startsWith('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', `, ${alpha})`);
    }
    return color.length === 7 ? `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}` : color;
  };

  const gameRef = useRef({
    lane: 1,
    lanesCount: 3,
    targetLane: 1,
    laneWidth: 0,
    bikeX: 0,
    bikeY: 0,
    bikeWidth: 40,
    bikeHeight: 80,
    bikeLean: 0,
    obstacles: [] as { x: number, y: number, type: 'block' | 'coin', id: number, color?: string, vehicleType?: 'car' | 'suv' | 'moto' | 'truck', nearMissed?: boolean }[],
    particles: [] as Particle[],
    rain: [] as RainDrop[],
    splashes: [] as Splash[],
    goldParticles: [] as GoldParticle[],
    floatingTexts: [] as FloatingText[],
    buildings: [] as SkylineBuilding[],
    speedLines: [] as SpeedLine[],
    speed: 5,
    frameCount: 0,
    lastTime: 0,
    laneOffset: 0,
    uiFlash: { type: 'none' as 'none' | 'damage' | 'coin', timer: 0 },
    primaryColor: '#00FF41',
    shake: 0,
    comboCount: 0,
    multiplier: 1,
  });

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

  useEffect(() => {
    return () => {
      audioRef.current.stopEngine();
    };
  }, []);

  const startGame = () => {
    audioRef.current.init();
    
    // Setup skyline buildings
    const newBuildings: SkylineBuilding[] = Array.from({ length: 16 }).map((_, i) => {
      const w = 20 + Math.random() * 30;
      const h = 30 + Math.random() * 60;
      const x = i * (400 / 16); 
      const isTall = h > 60;
      const signs = isTall ? [Math.random() * 20 + 10] : [];
      const windows = [];
      for(let wy = 10; wy < h; wy += 8) {
         for(let wx = 4; wx < w-4; wx += 8) {
           windows.push({x: wx, y: wy, state: Math.random() > 0.4});
         }
      }
      return { x, width: w, height: h, signs, windows };
    });

    // Setup speed lines
    const newSpeedLines: SpeedLine[] = Array.from({length: 16}).map((_, i) => ({
      x: i < 8 ? Math.random() * 30 : 0, 
      y: Math.random() * 600,
      length: 0, opacity: 0,
      isRight: i >= 8
    }));

    setGameState('playing');
    setScore(0);
    setDisplayScore(0);
    setComboMultiplier(1);
    
    gameRef.current = {
      ...gameRef.current,
      lane: 1,
      targetLane: 1,
      bikeLean: 0,
      obstacles: [],
      particles: [],
      splashes: [],
      goldParticles: [],
      floatingTexts: [],
      buildings: newBuildings,
      speedLines: newSpeedLines,
      rain: Array.from({ length: 60 }, () => ({
        x: Math.random() * 800,
        y: Math.random() * 800,
        speed: 12 + Math.random() * 6,
        length: 8 + Math.random() * 8
      })),
      speed: 5,
      frameCount: 0,
      laneOffset: 0,
      lastTime: performance.now(),
      uiFlash: { type: 'none', timer: 0 },
      shake: 0,
      comboCount: 0,
      multiplier: 1,
    };

    audioRef.current.startEngine(5);
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
      
      // Update speedlines right side based on true width
      gameRef.current.speedLines.forEach(sl => {
        if (sl.isRight) sl.x = canvas.width - 30 + Math.random() * 30;
      });
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

    const drawShadow = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.beginPath();
      ctx.ellipse(0, h/2 + 5, w*0.8, h*0.3, 0, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawBike = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, alpha: number = 1, scale: number = 1, rotation: number = 0) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha;

      // Headlight Cone (Step 4)
      if (alpha === 1) {
        const coneGrad = ctx.createLinearGradient(0, -25, 0, -90);
        coneGrad.addColorStop(0, 'rgba(255,255,255,0.25)');
        coneGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = coneGrad;
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(-25, -90);
        ctx.lineTo(25, -90);
        ctx.fill();

        // Exhaust Flames (Step 4)
        const offset = Math.random() * 4 - 2;
        const eHeight = 12 + Math.random() * 6;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.ellipse(offset, 32 + eHeight/2, 4, eHeight, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.globalAlpha = 0.8;
        ctx.beginPath(); ctx.ellipse(offset, 32 + eHeight/2 + 2, 2, eHeight - 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = alpha;
      }

      if (alpha === 1) drawShadow(ctx, 15, 30);

      // Outer Wide Glow
      if (alpha === 1) {
        ctx.save();
        ctx.shadowBlur = 60;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Main Body
      ctx.shadowBlur = 35;
      ctx.shadowColor = color;
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

      // Headlight core
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
      
      const isTruck = type === 'truck';
      const w = (type === 'suv' || isTruck) ? 38 : 32;
      const h = (type === 'suv' || isTruck) ? 65 : 52;

      drawShadow(ctx, w*0.8, h*0.8);

      // Body
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(-w/2, -h/2, w, h, 4);
      ctx.fill();

      // Roof
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.roundRect(-10, -14, 20, 28, 4);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#0a0a0a';
      [[-w/2, -h/2+5], [w/2-6, -h/2+5], [-w/2, h/2-15], [w/2-6, h/2-15]].forEach(([wx, wy]) => {
        ctx.fillRect(wx, wy, 6, 10);
      });

      // Truck Details (Step 5)
      if (isTruck) {
        ctx.fillStyle = '#FFA500';
        for(let sy = -h/2 + 5; sy < h/2 - 5; sy += 10) {
           ctx.fillRect(-w/2, sy, 2, 8);
           ctx.fillRect(w/2 - 2, sy, 2, 8);
        }
      }

      // Headlight Cones (Step 5)
      const cGrad = ctx.createLinearGradient(0, -h/2, 0, -h/2 - 80);
      cGrad.addColorStop(0, 'rgba(255,255,200,0.15)');
      cGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = cGrad;
      ctx.beginPath(); ctx.moveTo(-w/2 + 4, -h/2); ctx.lineTo(-w/2 - 2, -h/2 - 80); ctx.lineTo(-w/2 + 10, -h/2 - 80); ctx.fill();
      ctx.beginPath(); ctx.moveTo(w/2 - 4, -h/2); ctx.lineTo(w/2 - 10, -h/2 - 80); ctx.lineTo(w/2 + 2, -h/2 - 80); ctx.fill();

      // Core Lights
      ctx.shadowBlur = 10;
      ctx.shadowColor = 'white';
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(-w/2 + 6, -h/2 + 6, 3, 0, Math.PI * 2);
      ctx.arc(w/2 - 6, -h/2 + 6, 3, 0, Math.PI * 2);
      ctx.fill();

      // Taillights Pulsing (Step 5)
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#FF0000';
      ctx.fillStyle = `rgba(255,0,0,${0.7 + Math.sin(Date.now() * 0.01) * 0.3})`;
      ctx.beginPath();
      ctx.arc(-w/2 + 6, h/2 - 6, 3, 0, Math.PI * 2);
      ctx.arc(w/2 - 6, h/2 - 6, 3, 0, Math.PI * 2);
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
      g.frameCount++;
      g.lastTime = time;

      const horizon = 50;
      const centerX = canvas.width / 2;
      const getPerspectiveX = (x: number, y: number) => {
        const perspectiveScale = 0.4 + (0.6 * (y / canvas.height));
        return centerX + (x - centerX) * perspectiveScale;
      };
      const getPerspectiveScale = (y: number) => 0.4 + (0.6 * (y / canvas.height));

      // Update bike position and lean (Step 4)
      const targetX = g.targetLane * g.laneWidth + (g.laneWidth / 2);
      g.bikeX += (targetX - g.bikeX) * 0.15;
      g.bikeY = canvas.height - 150;
      
      const diff = targetX - g.bikeX;
      let desiredLean = 0;
      if (Math.abs(diff) > 2) desiredLean = diff > 0 ? 15 : -15;
      g.bikeLean += (desiredLean - g.bikeLean) * 0.15;

      // Update Audio Engine Engine Sound (Step 8)
      audioRef.current.updateEngine(g.speed);

      g.laneOffset = (g.laneOffset + g.speed) % 70;

      // Spawn obstacles (Step 5)
      if (g.frameCount % Math.max(25, Math.floor(70 - g.speed * 3)) === 0) {
        const lane = Math.floor(Math.random() * g.lanesCount);
        const isCoin = Math.random() > 0.8;
        const isTruck = !isCoin && Math.random() > 0.95;
        const vehicleColors = ['#C0392B','#2980B9','#8E44AD','#E67E22','#27AE60', '#1a1a1a'];
        const vType = isTruck ? 'truck' : (Math.random() > 0.7 ? 'suv' : 'car');
        const vColor = isTruck ? '#2C3E50' : vehicleColors[Math.floor(Math.random() * vehicleColors.length)];
        
        g.obstacles.push({
          id: Date.now() + Math.random(),
          x: lane * g.laneWidth + (g.laneWidth / 2),
          y: -100,
          type: isCoin ? 'coin' : 'block',
          color: vColor,
          vehicleType: vType as any,
          nearMissed: false
        });
      }

      // Update entities
      g.obstacles.forEach((obs, index) => {
        obs.y += g.speed * (obs.vehicleType === 'truck' ? 0.7 : 1);
        
        const visualObsX = getPerspectiveX(obs.x, obs.y);
        const visualBikeX = getPerspectiveX(g.bikeX, g.bikeY);
        
        const dx = Math.abs(visualBikeX - visualObsX);
        const dy = Math.abs(g.bikeY - obs.y);
        
        const collisionYRange = obs.type === 'coin' ? 30 : 45;
        const collisionXRange = obs.type === 'coin' ? 25 : 30;

        // Collision detection
        if (dx < collisionXRange && dy < collisionYRange) {
          if (obs.type === 'coin') {
            g.comboCount++;
            if (g.comboCount >= 3) {
              const newMult = Math.min(3, Math.floor(g.comboCount / 3) + 1);
              if (newMult !== g.multiplier) {
                 g.multiplier = newMult;
                 setComboMultiplier(newMult);
              }
            }
            setScore(s => s + (10 * g.multiplier));
            
            // Premium Coin bursts (Step 6)
            g.floatingTexts.push({ x: visualObsX, y: obs.y - 20, text: `+${10 * g.multiplier}`, life: 30 });
            audioRef.current.playCoin();
            for(let i=0; i<8; i++) {
               const a = (Math.PI*2/8)*i;
               g.goldParticles.push({x: visualObsX, y: obs.y, vx: Math.cos(a)*3, vy: Math.sin(a)*3, life: 15});
            }

            g.uiFlash = { type: 'coin', timer: 2 };
            g.obstacles.splice(index, 1);
            g.speed += 0.05;
          } else {
            g.uiFlash = { type: 'damage', timer: 5 };
            g.shake = 10;
            spawnParticles(visualBikeX, g.bikeY, g.primaryColor, 15);
            audioRef.current.playGameOver();
            setGameState('gameover');
          }
        }
        
        // Near Miss (Step 8)
        if (obs.type === 'block' && !obs.nearMissed && dy < 20 && dx > collisionXRange && dx < collisionXRange + 40) {
          obs.nearMissed = true;
          audioRef.current.playNearMiss();
        }

        if (obs.y > canvas.height + 100) {
          if (obs.type === 'block') {
            const val = obs.vehicleType === 'truck' ? 3 : 1;
            setScore(s => s + (val * g.multiplier));
            // Break combo multiplier
            g.comboCount = 0;
            if (g.multiplier !== 1) {
              g.multiplier = 1;
              setComboMultiplier(1);
            }
          }
          g.obstacles.splice(index, 1);
        }
      });

      // Update Arrays
      g.particles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life--; if (p.life <= 0) g.particles.splice(i, 1); });
      g.goldParticles.forEach((p, i) => { p.x += p.vx; p.y += p.vy; p.life--; if (p.life <= 0) g.goldParticles.splice(i, 1); });
      g.floatingTexts.forEach((ft, i) => { ft.y -= 1; ft.life--; if (ft.life <= 0) g.floatingTexts.splice(i, 1); });
      
      // Rain Update (Step 3)
      g.rain.forEach(drop => {
        drop.y += drop.speed;
        drop.x += 1; // Diagonal wind
        
        if (drop.y > canvas.height - 20 && drop.y - drop.speed <= canvas.height - 20) {
           g.splashes.push({x: drop.x, y: canvas.height - 20, life: 4});
        }
        if (drop.y > canvas.height) { drop.y = -20; drop.x = Math.random() * canvas.width; }
      });
      g.splashes.forEach((sp, i) => { sp.life--; if (sp.life <= 0) g.splashes.splice(i, 1); });
      
      // Speed lines update (Step 7)
      g.speedLines.forEach(sl => {
        sl.y += g.speed * 2;
        sl.length = (g.speed / 5) * 40;
        sl.opacity = Math.min(1, (g.speed / 20) * 0.6);
        if (sl.y > canvas.height) { sl.y = -50; sl.x = sl.isRight ? canvas.width - 30 + Math.random()*30 : Math.random()*30; }
      });

      // --- RENDERING ---
      ctx.save();
      if (g.shake > 0) {
        ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
        g.shake *= 0.9;
        if (g.shake < 0.1) g.shake = 0;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background
      const bgGrad = ctx.createLinearGradient(0, canvas.height * 0.15, 0, canvas.height);
      bgGrad.addColorStop(0, '#050508');
      bgGrad.addColorStop(1, '#0a0a10');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Puddle Glow (Step 2)
      ctx.fillStyle = `rgba(0,255,65,${(Math.sin(g.frameCount * 0.02) * 0.5 + 0.5) * 0.03})`;
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);

      // Skyline (Step 1)
      const skylineH = canvas.height * 0.15;
      g.buildings.forEach(b => {
        const bx = (b.x / 400) * canvas.width;
        const bw = (b.width / 400) * canvas.width;
        const bh = (b.height / 100) * skylineH;
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(bx, skylineH - bh, bw, bh);
        
        b.windows.forEach(w => {
           if (Math.random() > 0.995) w.state = !w.state;
           ctx.fillStyle = w.state ? safeAlpha(g.primaryColor, 0.4) : 'rgba(255,255,255,0.05)';
           ctx.fillRect(bx + w.x, skylineH - bh + w.y, 2, 3);
        });

        b.signs.forEach(sy => {
           const signColors = ['#FF1493', '#00FFFF', '#FF8C00'];
           const c = signColors[Math.floor(sy % signColors.length)];
           ctx.shadowBlur = 8; ctx.shadowColor = c; ctx.strokeStyle = c; ctx.lineWidth = 3;
           ctx.beginPath(); ctx.moveTo(bx + 4, skylineH - bh + sy); ctx.lineTo(bx + bw - 4, skylineH - bh + sy); ctx.stroke();
           ctx.shadowBlur = 0;
        });
      });

      // Asphalt Texture (Removed horizontal lines, keeping road clean)


      // Lanes and Reflections (Step 2)
      ctx.lineWidth = 2;
      for (let i = 0; i <= g.lanesCount; i++) {
        const laneX = i * g.laneWidth;
        const bottomX = laneX;
        const topX = centerX + (laneX - centerX) * 0.4;
        
        // Main line
        ctx.beginPath();
        if (i > 0 && i < g.lanesCount) {
          ctx.setLineDash([40, 30]);
          ctx.lineDashOffset = -g.frameCount * g.speed;
        } else {
          ctx.setLineDash([]);
        }
        ctx.strokeStyle = 'rgba(255,255,255,0.20)';
        ctx.moveTo(topX, skylineH);
        ctx.lineTo(bottomX, canvas.height);
        ctx.stroke();
        
        // Wet Reflection line
        if (i > 0 && i < g.lanesCount) {
           ctx.save();
           ctx.globalAlpha = 0.3;
           ctx.translate(0, 20); // Shift reflection down
           ctx.strokeStyle = 'rgba(255,255,255,0.5)'; // Brighter base to be faded by alpha
           
           // Simple gradient for fade
           const rGrad = ctx.createLinearGradient(0, canvas.height/2, 0, canvas.height);
           rGrad.addColorStop(0, 'rgba(255,255,255,0.8)');
           rGrad.addColorStop(1, 'rgba(255,255,255,0)');
           ctx.strokeStyle = rGrad;
           
           ctx.beginPath();
           ctx.moveTo(topX, skylineH);
           ctx.lineTo(bottomX, canvas.height);
           ctx.stroke();
           ctx.restore();
        }
      }
      ctx.setLineDash([]);

      const horizonGrad = ctx.createLinearGradient(0, skylineH - 20, 0, skylineH + 100);
      horizonGrad.addColorStop(0, safeAlpha(g.primaryColor, 0.2));
      horizonGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = horizonGrad;
      ctx.fillRect(0, skylineH - 20, canvas.width, 120);

      // Draw Entities
      g.obstacles.forEach(obs => {
        const px = getPerspectiveX(obs.x, obs.y);
        const ps = getPerspectiveScale(obs.y);

        // Vehicle Reflection (Step 2)
        ctx.save();
        ctx.translate(px, obs.y + (obs.type === 'coin' ? 20 : 35));
        const oGrad = ctx.createRadialGradient(0,0,0, 0,0, 25);
        oGrad.addColorStop(0, safeAlpha(obs.color || '#FFF', 0.05));
        oGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = oGrad;
        ctx.beginPath(); ctx.ellipse(0,0,25,10 * ps,0,0,Math.PI*2); ctx.fill();
        ctx.restore();

        if (obs.type === 'coin') {
          // Magnetic Aura (Step 6)
          const laneDiff = Math.abs((obs.x - g.laneWidth/2)/g.laneWidth - g.targetLane);
          if (laneDiff < 0.5 && obs.y > g.bikeY - 150 && obs.y < g.bikeY + 20) {
              for(let j=1; j<=3; j++) {
                 ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 - j*0.1})`;
                 ctx.lineWidth = 1.5;
                 ctx.beginPath();
                 const r = 12 + j * 8;
                 ctx.arc(px, obs.y + j*(g.speed), r * ps, 0, Math.PI*2);
                 ctx.stroke();
              }
          }
          
          // Premium Coin (Step 6)
          ctx.save();
          ctx.translate(px, obs.y);
          ctx.scale(Math.abs(Math.cos(g.frameCount * 0.08)) * ps, 1 * ps);
          
          const coinGrad = ctx.createRadialGradient(0,0,0, 0,0,14);
          coinGrad.addColorStop(0, '#FFE566');
          coinGrad.addColorStop(1, '#CC8800');
          ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 25;
          ctx.fillStyle = coinGrad;
          ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill();
          
          ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.stroke();
          
          ctx.shadowBlur = 0; ctx.fillStyle = '#8B6000';
          ctx.font = 'bold 16px font-display'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText('V', 0, 1);
          ctx.restore();
        } else {
          drawVehicle(ctx, px, obs.y, obs.color!, obs.vehicleType!, ps);
        }
      });

      // Bike Reflection (Step 2)
      const bikePX = getPerspectiveX(g.bikeX, g.bikeY);
      const bikePS = getPerspectiveScale(g.bikeY);
      
      ctx.save();
      ctx.translate(bikePX, g.bikeY + g.bikeHeight/2 + 5);
      const bGrad = ctx.createRadialGradient(0,0,0, 0,0, 30);
      bGrad.addColorStop(0, safeAlpha(g.primaryColor, 0.3));
      bGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bGrad;
      ctx.beginPath(); ctx.ellipse(0, 0, 30, 10, 0, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      // Bike Trails & Main Bike
      for (let i = 4; i > 0; i--) {
        const trailY = g.bikeY + (i * 12);
        const trailX = getPerspectiveX(g.bikeX, trailY);
        const trailS = getPerspectiveScale(trailY) * (1 - (i * 0.05));
        const trailAlpha = 0.3 / i;
        drawBike(ctx, trailX, trailY, g.primaryColor, trailAlpha, trailS, 0);
      }
      
      const leanAngle = (g.bikeLean * Math.PI) / 180;
      drawBike(ctx, bikePX, g.bikeY, g.primaryColor, 1, bikePS, leanAngle);

      // Gold Particles (Step 6)
      g.goldParticles.forEach(p => {
        ctx.fillStyle = `rgba(255, 215, 0, ${p.life/15})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI*2); ctx.fill();
      });

      // Floating Texts (Step 6)
      g.floatingTexts.forEach(ft => {
        ctx.fillStyle = `rgba(255, 215, 0, ${ft.life/30})`;
        ctx.font = 'bold 14px font-display'; ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
      });

      // Regular Particles
      g.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Rain & Splashes (Step 3)
      ctx.strokeStyle = 'rgba(150,200,255,0.2)';
      ctx.lineWidth = 0.5;
      g.rain.forEach(drop => {
        ctx.beginPath(); ctx.moveTo(drop.x, drop.y); ctx.lineTo(drop.x + 2, drop.y + drop.length); ctx.stroke();
      });
      ctx.lineWidth = 1;
      g.splashes.forEach(sp => {
        ctx.strokeStyle = `rgba(150,200,255,${sp.life/4 * 0.5})`;
        ctx.beginPath();
        for(let a=0; a<Math.PI; a+=Math.PI/4) {
           ctx.moveTo(sp.x, sp.y); ctx.lineTo(sp.x + Math.cos(a)*2, sp.y - Math.sin(a)*2);
        }
        ctx.stroke();
      });

      // Speed Lines Lateral (Step 7)
      ctx.lineWidth = 2;
      g.speedLines.forEach(sl => {
        ctx.strokeStyle = safeAlpha(g.primaryColor, sl.opacity);
        ctx.beginPath(); ctx.moveTo(sl.x, sl.y); ctx.lineTo(sl.x, sl.y + sl.length); ctx.stroke();
      });

      // HUD Speedometer (Step 9)
      ctx.save();
      ctx.translate(50, canvas.height - 40);
      ctx.beginPath();
      ctx.arc(0, 0, 30, Math.PI * 0.8, Math.PI * 2.2);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 4; ctx.stroke();
      
      const speedRatio = Math.min(1, g.speed / 20);
      ctx.beginPath();
      ctx.arc(0, 0, 30, Math.PI * 0.8, Math.PI * 0.8 + ((Math.PI * 1.4) * speedRatio));
      ctx.strokeStyle = g.primaryColor; ctx.stroke();
      
      ctx.fillStyle = 'white'; ctx.font = 'bold 12px font-mono'; ctx.textAlign = 'center';
      ctx.fillText(Math.floor(g.speed * 10).toString(), 0, -4);
      ctx.fillStyle = g.primaryColor; ctx.font = '8px font-mono';
      ctx.fillText('KM/H', 0, 6);
      ctx.restore();

      if (g.uiFlash.timer > 0) {
        ctx.fillStyle = g.uiFlash.type === 'damage' ? 'rgba(255,0,0,0.2)' : 'rgba(255,215,0,0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        g.uiFlash.timer--;
      }

      ctx.restore();

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
          <div className="text-center flex items-baseline gap-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mb-1">{t('games.neonRider.score')}</p>
              <p className="text-3xl font-black font-display text-white leading-none tabular-nums">{score.toLocaleString()}</p>
            </div>
            {comboMultiplier > 1 && (
               <span className="text-xl font-black text-[#FFD700] animate-pulse">x{comboMultiplier}</span>
            )}
          </div>
        </div>

        <div className="w-24" />
      </div>

      <div className="flex-1 relative overflow-hidden bg-black">
        <canvas ref={canvasRef} className="w-full h-full block cursor-none" />

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
