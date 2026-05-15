let alertAudio: HTMLAudioElement | null = null;
let listenersAttached = false;
let isUnlocked = false;
let hasPendingPlay = false;
let isMuted = false;

function getAlertAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!alertAudio) {
    alertAudio = new Audio('/the-rock-sound-effect.mp3');
    alertAudio.preload = 'auto';
  }
  return alertAudio;
}

function flushPendingPlay(): void {
  if (!hasPendingPlay || !isUnlocked || isMuted) return;
  hasPendingPlay = false;
  playAlertSound(false);
}

async function unlockAudio(): Promise<void> {
  const audio = getAlertAudio();
  if (!audio || isUnlocked) return;

  try {
    audio.muted = true;
    audio.currentTime = 0;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.muted = false;
    isUnlocked = true;
    flushPendingPlay();
  } catch {
    audio.muted = false;
  }
}

export function initializeAlertSound(): void {
  if (typeof window === 'undefined' || listenersAttached) return;
  listenersAttached = true;

  const onFirstInteraction = () => {
    void unlockAudio();
  };

  window.addEventListener('pointerdown', onFirstInteraction, { passive: true });
  window.addEventListener('keydown', onFirstInteraction, { passive: true });
  window.addEventListener('touchstart', onFirstInteraction, { passive: true });
  void getAlertAudio();
}

export function setAlertSoundMuted(muted: boolean): void {
  isMuted = muted;
  if (muted) {
    hasPendingPlay = false;
    alertAudio?.pause();
    if (alertAudio) {
      alertAudio.currentTime = 0;
    }
    return;
  }

  flushPendingPlay();
}

export function playAlertSound(urgent: boolean): void {
  void urgent;
  if (isMuted) return;

  const audio = getAlertAudio();
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  const attemptPlay = audio.play();
  if (!attemptPlay) return;

  void attemptPlay.catch(() => {
    hasPendingPlay = true;
  });
}
