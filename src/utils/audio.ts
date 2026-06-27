/**
 * Synthesizes sound effects using the browser's Web Audio API.
 * This ensures zero network dependencies and 100% reliable offline playback.
 */

class AudioSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  playSuccess() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Trumpet fanfare / celebratory chime
    const notes = [
      { f: 523.25, d: 0.1, t: 0 },   // C5
      { f: 659.25, d: 0.1, t: 0.1 }, // E5
      { f: 783.99, d: 0.1, t: 0.2 }, // G5
      { f: 1046.50, d: 0.3, t: 0.3 } // C6
    ];

    notes.forEach(note => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);
      
      gain.gain.setValueAtTime(0.15, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.t + note.d);
      
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(now + note.t);
      osc.stop(now + note.t + note.d);
    });
  }

  playClick() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  playLock() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.setValueAtTime(100, now + 0.08);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }
}

export const synth = new AudioSynth();
