// Web Audio API synthesizer for wheel ticking sounds and winning fanfare

class SoundEngine {
  private ctx: AudioContext | null = null;
  private lastTickTime = 0;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Play a realistic mechanical click/ticker sound
  public playTick(speedRatio = 1) {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Rate-limit clicks slightly to prevent audio distortion at hyper-speeds
      if (now - this.lastTickTime < 0.02) return;
      this.lastTickTime = now;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Pitch shifts slightly with wheel speed for realistic sound
      const baseFreq = Math.min(800, 380 + speedRatio * 180);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.035);

      // Snappy attack and quick exponential decay
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Audio autoplay policy or device without audio
    }
  }

  // Play winning fanfare chords
  public playWin() {
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = now + idx * 0.09;
        const duration = 0.6;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch {
      // Audio autoplay policy
    }
  }
}

export const soundEngine = new SoundEngine();
