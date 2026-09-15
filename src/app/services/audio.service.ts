import { Injectable, NgZone } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {
  soundEnabled = true;
  musicEnabled = true;
  hapticsEnabled = true;

  // Master levels are intentionally stronger than the previous version.
  // The compressor keeps louder effects from clipping while preserving punch.
  private soundVolume = 0.22;
  private musicVolume = 0.14;
  private masterVolume = 0.85;

  private ctx?: AudioContext;
  private masterGain?: GainNode;
  private compressor?: DynamicsCompressorNode;
  private musicTimer?: ReturnType<typeof setInterval>;
  private musicStep = 0;

  constructor(private zone: NgZone) {
    try {
      const saved = JSON.parse(localStorage.getItem('brain-rush-audio') || '{}');
      this.soundEnabled = saved.sound ?? true;
      this.musicEnabled = saved.music ?? true;
      this.hapticsEnabled = saved.haptics ?? true;
    } catch {}
  }

  private getContext(): AudioContext | undefined {
    if (typeof window === 'undefined') return undefined;

    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        this.ctx = new Ctx();

        // Master chain: all game audio passes through a compressor and
        // master gain so the sound is louder and more consistent.
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -18;
        this.compressor.knee.value = 18;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.18;

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.masterVolume;

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }

    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  unlock(): void {
    const ctx = this.getContext();
    if (ctx?.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    if (this.musicEnabled) {
      this.startMusic();
    }
  }

  private outputNode(ctx: AudioContext): AudioNode {
    return this.compressor ?? ctx.destination;
  }

  private tone(
    freq: number,
    duration = 0.08,
    type: OscillatorType = 'sine',
    volume = this.soundVolume,
    allowWhenSoundOff = false,
    detune = 0
  ) {
    if (!allowWhenSoundOff && !this.soundEnabled) return;

    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0002, volume),
      ctx.currentTime + 0.008
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + duration
    );

    osc.connect(gain).connect(this.outputNode(ctx));
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.025);
  }

  click() {
    this.tone(620, 0.07, 'sine', 0.16);
    this.tone(930, 0.045, 'triangle', 0.08, false, 4);
    this.haptic(8);
  }

  correct() {
    this.tone(740, 0.10, 'sine', 0.22);
    // Deferred tone only, no Angular state involved — keep it out of the zone
    // so it doesn't schedule an extra change-detection pass on every correct
    // answer (which, in fast gameplay, can be many times per second).
    this.zone.runOutsideAngular(() => {
      setTimeout(() => this.tone(980, 0.14, 'sine', 0.18), 45);
    });
    this.haptic(12);
  }

  wrong() {
    this.tone(180, 0.18, 'sawtooth', 0.13);
    this.tone(145, 0.13, 'triangle', 0.08, false, -6);
    this.haptic(28);
  }

  success() {
    this.zone.runOutsideAngular(() => {
      [660, 830, 1040, 1320].forEach((f, i) =>
        setTimeout(() => this.tone(f, 0.16, 'sine', 0.17), i * 65)
      );
    });
    this.haptic([15, 20, 15]);
  }

  gameOver() {
    this.zone.runOutsideAngular(() => {
      [440, 330, 220].forEach((f, i) =>
        setTimeout(() => this.tone(f, 0.2, 'triangle', 0.14), i * 90)
      );
    });
  }

  haptic(pattern: number | number[] = 10) {
    if (!this.hapticsEnabled) return;

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch {}
  }

  setSound(value: boolean) {
    this.soundEnabled = value;
    this.persist();

    if (value) {
      this.unlock();
      this.click();
    }
  }

  setMusic(value: boolean) {
    this.musicEnabled = value;
    this.persist();

    if (value) {
      this.unlock();
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  setHaptics(value: boolean) {
    this.hapticsEnabled = value;
    this.persist();

    if (value) {
      this.haptic(20);
    }
  }

  startMusic() {
    if (!this.musicEnabled || this.musicTimer) return;

    const ctx = this.getContext();
    if (!ctx) return;

    /*
     * A small layered synth loop instead of a single quiet oscillator.
     * It gives the game a fuller background sound without adding MP3 files.
     */
    const melody = [
      261.63, 329.63, 392.00, 329.63,
      293.66, 349.23, 440.00, 349.23,
      261.63, 329.63, 392.00, 493.88,
      440.00, 349.23, 329.63, 293.66
    ];

    const bass = [
      130.81, 130.81, 146.83, 146.83,
      164.81, 164.81, 146.83, 130.81
    ];

    const playNote = (
      frequency: number,
      duration: number,
      volume: number,
      type: OscillatorType,
      offset = 0
    ) => {
      if (!this.musicEnabled) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const now = ctx.currentTime + offset;

      osc.type = type;
      osc.frequency.value = frequency;

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain).connect(this.outputNode(ctx));
      osc.start(now);
      osc.stop(now + duration + 0.03);
    };

    const tick = () => {
      if (!this.musicEnabled) return;

      const step = this.musicStep++;
      playNote(
        melody[step % melody.length],
        0.34,
        this.musicVolume,
        'triangle'
      );

      // Soft harmony gives the background more body.
      playNote(
        melody[step % melody.length] * 1.498,
        0.26,
        this.musicVolume * 0.34,
        'sine'
      );

      if (step % 2 === 0) {
        playNote(
          bass[Math.floor(step / 2) % bass.length],
          0.45,
          this.musicVolume * 0.48,
          'sine'
        );
      }
    };

    tick();
    // The music loop only schedules Web Audio oscillators — it never touches
    // any Angular-bound state, so it doesn't need to run inside Angular's
    // zone. Left in-zone, this setInterval would trigger a full app-wide
    // change-detection pass roughly 2.5 times per second for as long as
    // music is enabled (i.e. almost the entire time the app is open).
    this.zone.runOutsideAngular(() => {
      this.musicTimer = setInterval(tick, 390);
    });
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
    }

    this.musicTimer = undefined;
  }

  persist() {
    try {
      localStorage.setItem(
        'brain-rush-audio',
        JSON.stringify({
          sound: this.soundEnabled,
          music: this.musicEnabled,
          haptics: this.hapticsEnabled
        })
      );
    } catch {}
  }
}
