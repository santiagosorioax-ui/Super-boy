/**
 * Procedural Web Audio Synth for Santi 3D
 * Generates custom background adventure music & sound effects in real-time
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMusicPlaying = false;
  private musicInterval: number | null = null;
  private musicVolume = 0.4;
  private sfxVolume = 0.7;
  private stepInScale = 0;
  private noteIndex = 0;
  private isNightMood = false;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.ctx.destination);
    } catch {
      console.warn('Web Audio not supported');
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMusicVolume(val: number) {
    this.musicVolume = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicVolume, this.ctx.currentTime);
    }
  }

  public setSfxVolume(val: number) {
    this.sfxVolume = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.ctx.currentTime);
    }
  }

  public setNightMood(isNight: boolean) {
    this.isNightMood = isNight;
  }

  public startMusic() {
    this.init();
    this.resume();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.noteIndex = 0;

    // Upbeat Pentatonic / Adventure Progression (C major / A minor)
    const dayMelody = [
      261.63, 329.63, 392.00, 523.25, 392.00, 329.63,
      293.66, 349.23, 440.00, 587.33, 440.00, 349.23,
      329.63, 392.00, 523.25, 659.25, 523.25, 392.00,
      392.00, 440.00, 523.25, 659.25, 783.99, 659.25,
      523.25, 440.00, 392.00, 329.63, 293.66, 261.63,
    ];

    // Mystical / Serene Night Melody
    const nightMelody = [
      220.00, 261.63, 329.63, 440.00, 329.63, 261.63,
      196.00, 246.94, 293.66, 392.00, 293.66, 246.94,
      174.61, 220.00, 261.63, 349.23, 261.63, 220.00,
      196.00, 246.94, 293.66, 392.00, 493.88, 392.00
    ];

    const bassLine = [130.81, 146.83, 164.81, 174.61, 196.00, 164.81, 146.83, 130.81];

    const tempoMs = 210; // BPM ~ 140

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
      if (this.musicVolume <= 0.01) return;

      const t = this.ctx.currentTime;
      const melody = this.isNightMood ? nightMelody : dayMelody;
      const freq = melody[this.noteIndex % melody.length];
      const bassFreq = bassLine[Math.floor(this.noteIndex / 3) % bassLine.length];

      // Lead synth (Chime/Flute/Square wave)
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      
      osc.type = this.isNightMood ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      // Lowpass filter for smooth warm sound
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(this.isNightMood ? 900 : 1800, t);

      noteGain.gain.setValueAtTime(0, t);
      noteGain.gain.linearRampToValueAtTime(this.isNightMood ? 0.09 : 0.12, t + 0.03);
      noteGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.musicGain);

      osc.start(t);
      osc.stop(t + 0.36);

      // Bass note on every 3 notes
      if (this.noteIndex % 3 === 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(bassFreq * (this.isNightMood ? 0.75 : 1), t);

        bassGain.gain.setValueAtTime(0, t);
        bassGain.gain.linearRampToValueAtTime(0.14, t + 0.04);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);

        bassOsc.start(t);
        bassOsc.stop(t + 0.65);
      }

      // Soft percussion / Hi-hat click on day mode
      if (!this.isNightMood && this.noteIndex % 2 === 0) {
        this.playSoftHiHat(t);
      }

      this.noteIndex++;
    }, tempoMs);
  }

  private playSoftHiHat(t: number) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.04, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(6000, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.015, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.musicGain);

      whiteNoise.start(t);
      whiteNoise.stop(t + 0.04);
    } catch {
      // Ignored
    }
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public toggleMusic(): boolean {
    if (this.isMusicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public isPlaying(): boolean {
    return this.isMusicPlaying;
  }

  // --- SOUND EFFECTS ---

  public playCoinSound(combo = 1) {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    // Multi-frequency sparkly arpeggio
    const baseFreq = 587.33 * (1 + (combo % 8) * 0.1); // D5 base + combo pitch
    const notes = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];

    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.04);

      gain.gain.setValueAtTime(0, t + i * 0.04);
      gain.gain.linearRampToValueAtTime(0.18, t + i * 0.04 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.04);
      osc.stop(t + i * 0.04 + 0.3);
    });
  }

  public playJumpSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.16);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  public playSpringPadSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.22);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.36);
  }

  public playFootstep() {
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.06);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playFlashlightClick() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.03);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  public playVictoryFanfare() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const chords = [
      [523.25, 659.25, 783.99], // C
      [587.33, 739.99, 880.00], // D
      [659.25, 830.61, 987.77], // E
      [783.99, 987.77, 1174.66, 1567.98] // High C Maj
    ];

    chords.forEach((chord, step) => {
      const delay = step * 0.22;
      chord.forEach((freq) => {
        if (!this.ctx || !this.sfxGain) return;
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (step === 3 ? 1.2 : 0.4));

        osc.connect(gain);
        gain.connect(this.sfxGain);

        osc.start(t);
        osc.stop(t + (step === 3 ? 1.3 : 0.45));
      });
    });
  }

  public playShopBuySuccess() {
    this.playBuySound();
  }

  public playShopBuyFail() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.setValueAtTime(130, t + 0.1);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.26);
  }

  public playBuySound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    // Pleasant cash chime arpeggio (C6 -> E6 -> G6 -> C7)
    const pitches = [1046.5, 1318.5, 1567.98, 2093.0];
    pitches.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.045);

      gain.gain.setValueAtTime(0, t + idx * 0.045);
      gain.gain.linearRampToValueAtTime(0.18, t + idx * 0.045 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.045 + 0.25);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.045);
      osc.stop(t + idx * 0.045 + 0.26);
    });
  }

  public playDrinkPotionSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    // Bubbling upward pitch glissando
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.22);
    osc.frequency.exponentialRampToValueAtTime(1174.66, t + 0.35);

    gain.gain.setValueAtTime(0.02, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  public playSwordSlashSound(isLaser = false) {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (isLaser) {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.14);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.12);
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playEquipSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, t);
    osc.frequency.exponentialRampToValueAtTime(987.77, t + 0.08);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.13);
  }

  public playTeleportSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const notes = [329.63, 440.0, 554.37, 659.25, 880.0, 1108.73, 1318.51];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.035);
      gain.gain.setValueAtTime(0, t + idx * 0.035);
      gain.gain.linearRampToValueAtTime(0.18, t + idx * 0.035 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.035 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t + idx * 0.035);
      osc.stop(t + idx * 0.035 + 0.36);
    });
  }

  public playGameStartSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    // Energetic Game Launch Chords (C5 -> E5 -> G5 -> C6 power chord flourish)
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.22, vol: 0.16 },
      { freq: 659.25, time: 0.08, dur: 0.22, vol: 0.16 },
      { freq: 783.99, time: 0.16, dur: 0.28, vol: 0.18 },
      { freq: 1046.5, time: 0.24, dur: 0.55, vol: 0.22 },
      { freq: 1318.51, time: 0.24, dur: 0.55, vol: 0.18 },
    ];

    notes.forEach((n) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, t + n.time);

      gain.gain.setValueAtTime(0, t + n.time);
      gain.gain.linearRampToValueAtTime(n.vol, t + n.time + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.time + n.dur);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + n.time);
      osc.stop(t + n.time + n.dur + 0.05);
    });
  }
}

export const soundEngine = new SoundEngine();
