import { WorldDimension } from '../types';

/**
 * Procedural Web Audio Synth for Santi 3D
 * Generates custom background adventure music, sound effects, and dynamic ambient soundscapes in real-time
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private isMusicPlaying = false;
  private isAmbientPlaying = false;
  private musicInterval: number | null = null;
  private ambientTimer: number | null = null;
  private musicVolume = 0.4;
  private sfxVolume = 0.7;
  private ambientVolume = 0.45;
  private stepInScale = 0;
  private noteIndex = 0;
  private isNightMood = false;
  private currentDimension: WorldDimension = 'main';

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

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = this.ambientVolume;
      this.ambientGain.connect(this.ctx.destination);
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

  public setAmbientVolume(val: number) {
    this.ambientVolume = Math.max(0, Math.min(1, val));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.ambientVolume, this.ctx.currentTime);
    }
  }

  public setNightMood(isNight: boolean) {
    this.isNightMood = isNight;
  }

  public setDimension(dimension: WorldDimension) {
    if (this.currentDimension !== dimension) {
      this.currentDimension = dimension;
      // Trigger instant ambient cue for the new world
      if (this.isAmbientPlaying) {
        if (dimension === 'candy') {
          this.playFairyChimes(true);
        } else {
          this.playForestBreeze();
        }
      }
    }
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

  // --- DYNAMIC AMBIENT SOUNDSCAPE ENGINE ---

  public startAmbient() {
    this.init();
    this.resume();
    if (this.isAmbientPlaying) return;
    this.isAmbientPlaying = true;

    // Trigger initial ambient cue
    if (this.currentDimension === 'candy') {
      this.playCandyMagicalDrone();
    } else {
      this.playForestBreeze();
    }

    const scheduleNextAmbient = () => {
      if (!this.isAmbientPlaying) return;
      // Random delay between 2.2 and 4.8 seconds for natural organic soundscape
      const delayMs = 2200 + Math.random() * 2600;
      this.ambientTimer = window.setTimeout(() => {
        if (!this.isAmbientPlaying) return;
        this.triggerProceduralAmbientEvent();
        scheduleNextAmbient();
      }, delayMs);
    };

    scheduleNextAmbient();
  }

  public stopAmbient() {
    this.isAmbientPlaying = false;
    if (this.ambientTimer !== null) {
      clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  public isAmbientActive(): boolean {
    return this.isAmbientPlaying;
  }

  private triggerProceduralAmbientEvent() {
    if (!this.ctx || !this.ambientGain || this.ambientVolume <= 0.01) return;

    if (this.currentDimension === 'candy') {
      // Candy World: Sparkling chimes, sweet drones, sugar pops
      const rand = Math.random();
      if (rand < 0.42) {
        this.playFairyChimes();
      } else if (rand < 0.75) {
        this.playCandyMagicalDrone();
      } else {
        this.playSugarBubblePop();
      }
    } else {
      // Main Valley World: Forest wind, birds or nocturnal crickets/owls
      if (this.isNightMood) {
        const rand = Math.random();
        if (rand < 0.55) {
          this.playNightCrickets();
        } else if (rand < 0.82) {
          this.playForestBreeze();
        } else {
          this.playDistantOwl();
        }
      } else {
        const rand = Math.random();
        if (rand < 0.55) {
          this.playBirdChirp();
        } else if (rand < 0.82) {
          this.playForestBreeze();
        } else {
          this.playLeafRustle();
        }
      }
    }
  }

  /**
   * Valley Day: Gentle melodious bird chirps in the forest
   */
  public playBirdChirp() {
    if (!this.ctx || !this.ambientGain || this.ambientVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const chirpCount = 2 + Math.floor(Math.random() * 2); // 2 or 3 chirps
      const baseFreq = 2400 + Math.random() * 800; // 2.4kHz - 3.2kHz natural range

      for (let i = 0; i < chirpCount; i++) {
        const chirpTime = t + i * (0.09 + Math.random() * 0.04);
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Natural frequency curve: rapid rise then descent
        const f0 = baseFreq + (Math.random() - 0.5) * 200;
        const fPeak = f0 + 400 + Math.random() * 300;
        const fEnd = f0 - 150;

        osc.frequency.setValueAtTime(f0, chirpTime);
        osc.frequency.linearRampToValueAtTime(fPeak, chirpTime + 0.035);
        osc.frequency.exponentialRampToValueAtTime(Math.max(100, fEnd), chirpTime + 0.075);

        gain.gain.setValueAtTime(0, chirpTime);
        gain.gain.linearRampToValueAtTime(0.045, chirpTime + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, chirpTime + 0.08);

        osc.connect(gain);
        gain.connect(this.ambientGain);

        osc.start(chirpTime);
        osc.stop(chirpTime + 0.085);
      }
    } catch {
      // Audio safety
    }
  }

  /**
   * Valley: Peaceful breeze sweeping through the mountain trees
   */
  public playForestBreeze() {
    if (!this.ctx || !this.ambientGain || this.ambientVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const duration = 2.4 + Math.random() * 1.2;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pinkish filtered noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = lastOut * 0.85 + white * 0.15;
        data[i] = lastOut;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const centerFreq = this.isNightMood ? 320 : 480;
      filter.frequency.setValueAtTime(centerFreq, t);
      filter.frequency.linearRampToValueAtTime(centerFreq + 180, t + duration * 0.4);
      filter.frequency.exponentialRampToValueAtTime(centerFreq - 60, t + duration);
      filter.Q.setValueAtTime(1.4, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.065, t + duration * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      noiseSource.start(t);
      noiseSource.stop(t + duration);
    } catch {
      // Audio safety
    }
  }

  /**
   * Valley Day: Subtle flutter of leaves rustling
   */
  public playLeafRustle() {
    if (!this.ctx || !this.ambientGain || this.ambientVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const duration = 0.65;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, t);
      filter.Q.setValueAtTime(2.2, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.035, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      noiseSource.start(t);
      noiseSource.stop(t + duration);
    } catch {
      // Audio safety
    }
  }

  /**
   * Valley Night: High-pitched crickets chirping in meadow
   */
  public playNightCrickets() {
    if (!this.ctx || !this.ambientGain || this.ambientVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const pulseCount = 3 + Math.floor(Math.random() * 3);
      const baseFreq = 4400 + Math.random() * 400;

      for (let i = 0; i < pulseCount; i++) {
        const pulseTime = t + i * 0.035;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq, pulseTime);

        gain.gain.setValueAtTime(0, pulseTime);
        gain.gain.linearRampToValueAtTime(0.038, pulseTime + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, pulseTime + 0.026);

        osc.connect(gain);
        gain.connect(this.ambientGain);

        osc.start(pulseTime);
        osc.stop(pulseTime + 0.028);
      }
    } catch {
      // Audio safety
    }
  }

  /**
   * Valley Night: Distant soft owl hoot
   */
  public playDistantOwl() {
    if (!this.ctx || !this.ambientGain || this.ambientVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      // Two-tone soft hoot: "Hoo... Hoo-oo"
      const hoots = [
        { freq: 380, time: 0, dur: 0.26, vol: 0.038 },
        { freq: 330, time: 0.38, dur: 0.42, vol: 0.045 },
      ];

      hoots.forEach((h) => {
        if (!this.ctx || !this.ambientGain) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(h.freq, t + h.time);
        osc.frequency.exponentialRampToValueAtTime(h.freq * 0.94, t + h.time + h.dur);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, t + h.time);

        gain.gain.setValueAtTime(0, t + h.time);
        gain.gain.linearRampToValueAtTime(h.vol, t + h.time + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + h.time + h.dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);

        osc.start(t + h.time);
        osc.stop(t + h.time + h.dur + 0.02);
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * Candy World: Magical ethereal crystalline drone chord
   */
  public playCandyMagicalDrone() {
    if (!this.ctx || !this.ambientGain || this.ambientVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const duration = 3.2;
      // Sweet ethereal Lydian / Pentatonic chord frequencies (F5, A5, C6, E6)
      const chord = [523.25, 659.25, 783.99, 1046.5];

      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.ambientGain) return;
        const osc = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Gentle detuning for shimmer
        osc.frequency.setValueAtTime(freq * (1 + (idx - 1.5) * 0.003), t);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, t);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.028 / (idx + 1), t + 0.7);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ambientGain);

        osc.start(t);
        osc.stop(t + duration);
      });
    } catch {
      // Audio safety
    }
  }

  /**
   * Candy World: Sparkling fairy chime bells cascading
   */
  public playFairyChimes(instant = false) {
    if (!this.ctx || !this.ambientGain || this.ambientVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const pentatonic = [1046.5, 1318.51, 1567.98, 2093.0, 2637.02, 3135.96];
      const count = instant ? 6 : 4;
      const stagger = 0.07;

      for (let i = 0; i < count; i++) {
        const noteTime = t + i * stagger;
        const noteFreq = pentatonic[(i + Math.floor(Math.random() * 2)) % pentatonic.length];

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(noteFreq, noteTime);

        gain.gain.setValueAtTime(0, noteTime);
        gain.gain.linearRampToValueAtTime(0.032, noteTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.45);

        osc.connect(gain);
        gain.connect(this.ambientGain);

        osc.start(noteTime);
        osc.stop(noteTime + 0.48);
      }
    } catch {
      // Audio safety
    }
  }

  /**
   * Candy World: Playful sweet sugar bubble pop
   */
  public playSugarBubblePop() {
    if (!this.ctx || !this.ambientGain || this.ambientVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startFreq = 340 + Math.random() * 120;
      const endFreq = startFreq * (2.0 + Math.random() * 0.4);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(endFreq, t + 0.06);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.075);

      osc.connect(gain);
      gain.connect(this.ambientGain);

      osc.start(t);
      osc.stop(t + 0.08);
    } catch {
      // Audio safety
    }
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

  public playFlightToggleSound(isFlying: boolean) {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    if (isFlying) {
      // Ascending celestial whoosh for flight activation
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25]; // C E G C E
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + idx * 0.05 + 0.2);

        gain.gain.setValueAtTime(0.12, t + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.25);

        osc.connect(gain);
        gain.connect(this.sfxGain!);

        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.26);
      });
    } else {
      // Soft landing whoosh
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.2);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t);
      osc.stop(t + 0.23);
    }
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

  public playButtonClick() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.06);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public playCampfireHeal() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    // Warm gentle rising arpeggio for soothing campfire health restoration
    const notes = [329.63, 392.00, 493.88, 587.33]; // E4, G4, B4, D5 (Warm Em7)
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0, t + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, t + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.38);
    });
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

  public playZombieGroanSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.linearRampToValueAtTime(80, t + 0.25);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.6);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, t);
    filter.frequency.linearRampToValueAtTime(220, t + 0.5);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.13, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.68);
  }

  public playZombieHitSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    // Impact noise & squash pitch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.24);
  }

  public playZombieHurtSound() {
    this.playZombieHitSound();
  }

  public playZombieDeathSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.35);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  public playPortalTeleportSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    // Sci-fi / Magical dimensional portal whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.35);
    osc.frequency.linearRampToValueAtTime(1400, t + 0.6);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(2400, t + 0.5);
    filter.Q.setValueAtTime(4, t);

    gain.gain.setValueAtTime(0.02, t);
    gain.gain.linearRampToValueAtTime(0.24, t + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.8);
  }

  public playCandyPickupSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.12);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  public playPlayerHurtSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playPlayerDeathSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    // 3-note descending ominous demise chime
    const notes = [320, 240, 160, 90];
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.14);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + i * 0.14 + 0.2);

      gain.gain.setValueAtTime(0.32, t + i * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.14 + 0.28);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + i * 0.14);
      osc.stop(t + i * 0.14 + 0.3);
    });
  }

  public playNightAwakenSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.4);
    osc.frequency.linearRampToValueAtTime(90, t + 0.9);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.95);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 1.0);
  }

  // --- MAYAN TEMPLE & FINAL BOSS SOUNDS ---

  public playTempleGateOpenSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    // Ancient stone grind + mystic chime
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const filter1 = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(65, t);
    osc1.frequency.linearRampToValueAtTime(45, t + 0.8);

    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(220, t);

    gain1.gain.setValueAtTime(0.3, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.sfxGain);

    osc1.start(t);
    osc1.stop(t + 0.95);

    // Mystic harmonic chime
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq, t + 0.2 + idx * 0.08);

      gain2.gain.setValueAtTime(0.001, t + 0.2 + idx * 0.08);
      gain2.gain.linearRampToValueAtTime(0.12, t + 0.25 + idx * 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.7 + idx * 0.08);

      osc2.connect(gain2);
      gain2.connect(this.sfxGain);

      osc2.start(t + 0.2 + idx * 0.08);
      osc2.stop(t + 0.75 + idx * 0.08);
    });
  }

  public playBossRoar() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(70, t + 0.3);
    osc.frequency.linearRampToValueAtTime(95, t + 0.7);
    osc.frequency.exponentialRampToValueAtTime(40, t + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t);
    filter.frequency.linearRampToValueAtTime(500, t + 0.3);
    filter.frequency.exponentialRampToValueAtTime(120, t + 1.2);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.25);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 1.3);
  }

  public playFireballSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    // Flaming whoosh + hiss
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.4);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.linearRampToValueAtTime(1200, t + 0.2);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.45);
    filter.Q.setValueAtTime(2.5, t);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.48);
  }

  public playGroundSlamSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.35);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.42);
  }

  public playBossTiredSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    // Heavy sigh / wheeze + warning pulse
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.linearRampToValueAtTime(90, t + 0.5);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.6);
  }

  public playBossShieldDeflectSound() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    // High metallic clank
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(820, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  public playBossVictoryFanfare() {
    this.init();
    this.resume();
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0) return;

    const t = this.ctx.currentTime;
    // Grand triumphant fanfare
    const notes = [
      { f: 523.25, d: 0.15 }, // C5
      { f: 659.25, d: 0.15 }, // E5
      { f: 783.99, d: 0.18 }, // G5
      { f: 1046.5, d: 0.45 }, // C6
      { f: 1318.51, d: 0.55 }, // E6
    ];

    let offset = 0;
    notes.forEach((n) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t + offset);

      gain.gain.setValueAtTime(0.001, t + offset);
      gain.gain.linearRampToValueAtTime(0.25, t + offset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + n.d);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + offset);
      osc.stop(t + offset + n.d + 0.02);

      offset += n.d * 0.75;
    });
  }

  /**
   * Weather Sound: Dynamic Rain Droplets and Overcast Ambience
   */
  public playRainAmbience(intensity: number = 0.8) {
    if (!this.ctx || !this.ambientGain || this.ambientVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const duration = 1.2;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Filtered noise with tiny drop peaks
      for (let i = 0; i < bufferSize; i++) {
        const white = (Math.random() * 2 - 1);
        const dropImpulse = Math.random() < 0.008 ? (Math.random() * 2 - 1) * 3 : 0;
        data[i] = (white + dropImpulse) * 0.25;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400 + intensity * 1800, t);
      filter.Q.setValueAtTime(0.8, t);

      const gain = this.ctx.createGain();
      const vol = Math.min(0.12, 0.03 + intensity * 0.07);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      noiseSource.start(t);
      noiseSource.stop(t + duration);
    } catch {
      // Audio safety
    }
  }

  /**
   * Weather Sound: Distant Deep Thunder Clap
   */
  public playThunder() {
    if (!this.ctx || !this.sfxGain || this.sfxVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const duration = 2.8;

      // Low frequency rumble oscillator
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + duration);

      oscGain.gain.setValueAtTime(0.001, t);
      oscGain.gain.linearRampToValueAtTime(0.28, t + 0.05);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + duration);

      // Lowpass noise crackle for thunder crack
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = lastOut * 0.88 + white * 0.12;
        data[i] = lastOut;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, t);
      filter.frequency.exponentialRampToValueAtTime(90, t + duration);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.001, t);
      noiseGain.gain.linearRampToValueAtTime(0.35, t + 0.03);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.sfxGain);

      noiseSource.start(t);
      noiseSource.stop(t + duration);
    } catch {
      // Audio safety
    }
  }

  /**
   * Weather Sound: Howling Strong Wind Gust
   */
  public playWindGust(strength: number = 1.0) {
    if (!this.ctx || !this.ambientGain || this.ambientVolume <= 0.01) return;
    try {
      const t = this.ctx.currentTime;
      const duration = 2.6;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = lastOut * 0.82 + white * 0.18;
        data[i] = lastOut;
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const fCenter = 420 + strength * 350;
      filter.frequency.setValueAtTime(fCenter * 0.7, t);
      filter.frequency.linearRampToValueAtTime(fCenter * 1.35, t + duration * 0.45);
      filter.frequency.exponentialRampToValueAtTime(fCenter * 0.6, t + duration);
      filter.Q.setValueAtTime(2.6, t);

      const gain = this.ctx.createGain();
      const vol = Math.min(0.18, 0.04 + strength * 0.1);
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(vol, t + duration * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.ambientGain);

      noiseSource.start(t);
      noiseSource.stop(t + duration);
    } catch {
      // Audio safety
    }
  }
}

export const soundEngine = new SoundEngine();

