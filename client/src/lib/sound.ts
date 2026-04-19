const AUDIO_STORAGE_KEY = 'motovault-login-audio';
const AUDIO_ENABLED_KEY = 'motovault-audio-enabled';

export function isAudioEnabled(): boolean {
  const val = localStorage.getItem(AUDIO_ENABLED_KEY);
  return val === null ? true : val === 'true';
}

export function setAudioEnabled(enabled: boolean): void {
  localStorage.setItem(AUDIO_ENABLED_KEY, String(enabled));
}

function makeDistortionCurve(amount: number): Float32Array {
  const samples = 256;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function playDefaultSynth() {
  try {
    const ctx = new AudioContext();
    const gainMaster = ctx.createGain();
    gainMaster.gain.setValueAtTime(0, ctx.currentTime);
    gainMaster.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.08);
    gainMaster.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.45);
    gainMaster.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.9);
    gainMaster.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 1.3);
    gainMaster.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.8);

    const distortion = ctx.createWaveShaper();
    distortion.curve = makeDistortionCurve(280) as any;
    distortion.oversample = '4x';

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(75, ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(85, ctx.currentTime + 0.1);
    osc1.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.5);
    osc1.frequency.exponentialRampToValueAtTime(95, ctx.currentTime + 1.1);
    osc1.frequency.linearRampToValueAtTime(82, ctx.currentTime + 1.8);

    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(38, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
    osc2.frequency.exponentialRampToValueAtTime(48, ctx.currentTime + 1.1);
    osc2.frequency.linearRampToValueAtTime(40, ctx.currentTime + 1.8);

    const osc2Gain = ctx.createGain();
    osc2Gain.gain.setValueAtTime(0.4, ctx.currentTime);

    const osc3 = ctx.createOscillator();
    osc3.type = 'sawtooth';
    osc3.frequency.setValueAtTime(160, ctx.currentTime);
    osc3.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.45);
    osc3.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 1.0);

    const osc3Gain = ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.15, ctx.currentTime);
    osc3Gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.45);
    osc3Gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 1.0);

    osc1.connect(distortion);
    osc2.connect(osc2Gain);
    osc2Gain.connect(distortion);
    osc3.connect(osc3Gain);
    osc3Gain.connect(distortion);
    distortion.connect(gainMaster);
    gainMaster.connect(ctx.destination);

    const t = ctx.currentTime;
    osc1.start(t); osc1.stop(t + 1.9);
    osc2.start(t); osc2.stop(t + 1.9);
    osc3.start(t); osc3.stop(t + 1.9);

    setTimeout(() => ctx.close(), 2200);
  } catch {
    // Silently fail
  }
}

export function playMotorcycleRevSound() {
  if (!isAudioEnabled()) return;
  const customAudio = localStorage.getItem(AUDIO_STORAGE_KEY);
  if (customAudio) {
    try {
      const audio = new Audio(customAudio);
      audio.volume = 0.8;
      audio.play().catch(() => playDefaultSynth());
      return;
    } catch {
      // fall through to default
    }
  }
  playDefaultSynth();
}

export function setCustomLoginAudio(dataUrl: string) {
  localStorage.setItem(AUDIO_STORAGE_KEY, dataUrl);
}

export function removeCustomLoginAudio() {
  localStorage.removeItem(AUDIO_STORAGE_KEY);
}

export function getCustomLoginAudioName(): string | null {
  const nameKey = AUDIO_STORAGE_KEY + '-name';
  return localStorage.getItem(nameKey);
}

export function setCustomLoginAudioName(name: string) {
  localStorage.setItem(AUDIO_STORAGE_KEY + '-name', name);
}

export function removeCustomLoginAudioName() {
  localStorage.removeItem(AUDIO_STORAGE_KEY + '-name');
}

export function hasCustomLoginAudio(): boolean {
  return !!localStorage.getItem(AUDIO_STORAGE_KEY);
}
