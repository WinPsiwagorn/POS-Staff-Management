export function playAlertSound(urgent: boolean): void {
  try {
    const ctx = new AudioContext();

    if (urgent) {
      // Two sharp beeps at C6
      for (let i = 0; i < 2; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.value = 1047;
        const t0 = ctx.currentTime + i * 0.22;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.18, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
        osc.start(t0);
        osc.stop(t0 + 0.16);
      }
      setTimeout(() => ctx.close(), 600);
    } else {
      // Soft two-tone chime: A5 → E5
      const freqs = [880, 659];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t0 = ctx.currentTime + i * 0.18;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.15, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.35);
        osc.start(t0);
        osc.stop(t0 + 0.35);
      });
      setTimeout(() => ctx.close(), 800);
    }
  } catch {
    // Web Audio not available — silent fallback
  }
}
