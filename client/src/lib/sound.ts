const AUDIO_ENABLED_KEY = 'motovault-audio-enabled';

export function isAudioEnabled(): boolean {
  const val = localStorage.getItem(AUDIO_ENABLED_KEY);
  return val === null ? true : val === 'true';
}

export function setAudioEnabled(enabled: boolean): void {
  localStorage.setItem(AUDIO_ENABLED_KEY, String(enabled));
}

const DEFAULT_REV_URL = "https://cavgduiyohxlghkyldur.supabase.co/storage/v1/object/public/motorcycle-images/audio/tanweraman-motorcycle-engine-rev-2-337870.mp3";

function playDefaultSynth() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 110;
    gain.gain.value = 0.1;
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
  } catch (e) {}
}

async function playDefaultSound() {
  try {
    const audio = new Audio(DEFAULT_REV_URL);
    audio.crossOrigin = "anonymous";
    audio.volume = 0.6;
    return audio.play().catch(() => playDefaultSynth());
  } catch (err) {
    playDefaultSynth();
  }
}

export async function playMotorcycleRevSound(forceUrl?: string | null) {
  if (!isAudioEnabled()) return;
  
  // Se abbiamo un URL (dallo user profile o caricato), proviamo quello
  if (forceUrl && forceUrl.startsWith('http')) {
    try {
      const audio = new Audio(forceUrl);
      audio.crossOrigin = "anonymous";
      audio.volume = 0.8;
      return audio.play().catch((err) => {
        console.warn("Custom audio failed, falling back to default:", err);
        return playDefaultSound();
      });
    } catch (err) {
      return playDefaultSound();
    }
  }
  
  // Altrimenti suoniamo il default di sistema
  return playDefaultSound();
}

/**
 * Syncs server preferences to local storage for the sound engine
 */
export function initSoundEngine(userData: any) {
  if (userData?.audioEnabled !== undefined) {
    localStorage.setItem(AUDIO_ENABLED_KEY, String(userData.audioEnabled));
  }
}

// Funzioni di utilità rimaste per compatibilità UI ma semplificate
export function setCustomLoginAudio(dataUrl: string) {}
export function removeCustomLoginAudio() {}
export function getCustomLoginAudioName(): string | null { return null; }
export function setCustomLoginAudioName(name: string) {}
export function removeCustomLoginAudioName() {}
export function hasCustomLoginAudio(): boolean { return false; }
