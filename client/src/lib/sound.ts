const AUDIO_ENABLED_KEY = 'motovault-audio-enabled';

let initialSoundPlayed = false;

export function markInitialSoundPlayed() {
  initialSoundPlayed = true;
}

export function hasInitialSoundBeenPlayed() {
  return initialSoundPlayed;
}

export function resetInitialSoundFlag() {
  initialSoundPlayed = false;
}

const CUSTOM_AUDIO_KEY = 'motovault-custom-audio';
const CUSTOM_AUDIO_NAME_KEY = 'motovault-custom-audio-name';

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
  console.log("[SoundEngine] Playing default sound:", DEFAULT_REV_URL);
  try {
    const audio = new Audio(DEFAULT_REV_URL);
    audio.crossOrigin = "anonymous";
    audio.volume = 0.6;
    return audio.play().catch((err) => {
      console.warn("[SoundEngine] Default audio play blocked or failed:", err.name);
      return playDefaultSynth();
    });
  } catch (err) {
    console.error("[SoundEngine] Default audio exception:", err);
    playDefaultSynth();
  }
}

export async function playMotorcycleRevSound(forceUrl?: string | null) {
  if (!isAudioEnabled()) {
    console.log("[SoundEngine] Audio is disabled, skipping play");
    return;
  }
  
  // Se abbiamo un URL (dallo user profile o caricato), proviamo quello
  if (forceUrl && forceUrl.startsWith('http')) {
    console.log("[SoundEngine] Attempting to play custom audio:", forceUrl);
    try {
      const audio = new Audio(forceUrl);
      audio.crossOrigin = "anonymous";
      audio.volume = 0.8;
      return audio.play().catch((err) => {
        console.warn("[SoundEngine] Custom audio failed, falling back to default:", err.name);
        return playDefaultSound();
      });
    } catch (err) {
      console.error("[SoundEngine] Custom audio exception:", err);
      return playDefaultSound();
    }
  }
  
  // Altrimenti suoniamo il default di sistema
  console.log("[SoundEngine] No valid custom URL, playing default");
  return playDefaultSound();
}

/**
 * Syncs server preferences to local storage for the sound engine
 */
export function initSoundEngine(userData: any) {
  if (userData?.audioEnabled !== undefined) {
    localStorage.setItem(AUDIO_ENABLED_KEY, String(userData.audioEnabled));
  }
  
  if (userData?.customAudioData) {
    localStorage.setItem(CUSTOM_AUDIO_KEY, userData.customAudioData);
  } else if (userData?.customAudioData === null) {
    localStorage.removeItem(CUSTOM_AUDIO_KEY);
  }

  if (userData?.customAudioName) {
    localStorage.setItem(CUSTOM_AUDIO_NAME_KEY, userData.customAudioName);
  } else if (userData?.customAudioName === null) {
    localStorage.removeItem(CUSTOM_AUDIO_NAME_KEY);
  }
}

// Funzioni di utilità per compatibilità UI
export function setCustomLoginAudio(url: string) {
  localStorage.setItem(CUSTOM_AUDIO_KEY, url);
}

export function removeCustomLoginAudio() {
  localStorage.removeItem(CUSTOM_AUDIO_KEY);
}

export function getCustomLoginAudioName(): string | null {
  return localStorage.getItem(CUSTOM_AUDIO_NAME_KEY);
}

export function setCustomLoginAudioName(name: string) {
  localStorage.setItem(CUSTOM_AUDIO_NAME_KEY, name);
}

export function removeCustomLoginAudioName() {
  localStorage.removeItem(CUSTOM_AUDIO_NAME_KEY);
}

export function hasCustomLoginAudio(): boolean {
  return !!localStorage.getItem(CUSTOM_AUDIO_KEY);
}
