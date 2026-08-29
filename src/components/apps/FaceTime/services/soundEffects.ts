// Web Audio API based sound synthesizer for FaceTime sound effects (no external audio assets required)

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private ringInterval: number | null = null;
  private dialInterval: number | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Play outgoing dialing ring
  public playDialing() {
    this.stopSounds();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const playTone = () => {
      try {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        // US standard dial/ringback tone: 440Hz + 480Hz
        osc1.frequency.setValueAtTime(440, now);
        osc2.frequency.setValueAtTime(480, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.05);
        gain.gain.setValueAtTime(0.08, now + 1.2);
        gain.gain.linearRampToValueAtTime(0, now + 1.3);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.3);
        osc2.stop(now + 1.3);
      } catch (e) {}
    };

    playTone();
    this.dialInterval = window.setInterval(playTone, 3500);
  }

  // Play incoming FaceTime ringtone (modern marimba / chime melody)
  public playRinging() {
    this.stopSounds();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const playChimeSequence = () => {
      try {
        const notes = [
          { freq: 523.25, time: 0, dur: 0.2 },     // C5
          { freq: 659.25, time: 0.18, dur: 0.2 },  // E5
          { freq: 783.99, time: 0.36, dur: 0.25 }, // G5
          { freq: 1046.5, time: 0.54, dur: 0.4 }   // C6
        ];

        notes.forEach(({ freq, time, dur }) => {
          const now = ctx.currentTime + time;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + dur + 0.05);
        });
      } catch (e) {}
    };

    playChimeSequence();
    this.ringInterval = window.setInterval(playChimeSequence, 2400);
  }

  // Play connected chime
  public playConnected() {
    this.stopSounds();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 587.33, time: 0 },     // D5
        { freq: 880.00, time: 0.12 }   // A5
      ];

      notes.forEach(({ freq, time }) => {
        const t = now + time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.35);
      });
    } catch (e) {}
  }

  // Play call ended tone
  public playEndCall() {
    this.stopSounds();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [
        { freq: 659.25, time: 0 },     // E5
        { freq: 523.25, time: 0.12 },  // C5
        { freq: 392.00, time: 0.24 }   // G4
      ];

      notes.forEach(({ freq, time }) => {
        const t = now + time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.3);
      });
    } catch (e) {}
  }

  public stopSounds() {
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
    if (this.dialInterval) {
      clearInterval(this.dialInterval);
      this.dialInterval = null;
    }
  }
}

export const soundEffects = new SoundEffectsService();
