export function playAlertSound(urgent: boolean): void {
  try {
    void urgent;
    const audio = new Audio('/the-rock-sound-effect.mp3');
    audio.currentTime = 0;
    void audio.play();
  } catch {
    // Audio playback not available: silent fallback
  }
}
