// ============================================================================
// SUPER MARIO BROS. — Authentic NES 2A03 4-Channel Chiptune Synthesizer
// Channels: Pulse 1 (25% duty), Pulse 2 (50% duty), Triangle Bass, Noise Drums
// ============================================================================
(function (global) {
  'use strict';

  const NOTE_FREQ = {
    C2: 65.41, Cs2: 69.30, D2: 73.42, Ds2: 77.78, E2: 82.41, F2: 87.31, Fs2: 92.50, G2: 98.00, Gs2: 103.83, A2: 110.00, As2: 116.54, B2: 123.47,
    C3: 130.81, Cs3: 138.59, D3: 146.83, Ds3: 155.56, E3: 164.81, F3: 174.61, Fs3: 185.00, G3: 196.00, Gs3: 207.65, A3: 220.00, As3: 233.08, B3: 246.94,
    C4: 261.63, Cs4: 277.18, D4: 293.66, Ds4: 311.13, E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30, A4: 440.00, As4: 466.16, B4: 493.88,
    C5: 523.25, Cs5: 554.37, D5: 587.33, Ds5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99, G5: 783.99, Gs5: 830.61, A5: 880.00, As5: 932.33, B5: 987.77,
    C6: 1046.50, Cs6: 1108.73, D6: 1174.66, Ds6: 1244.51, E6: 1318.51, F6: 1396.91, G6: 1567.98
  };

  // Build authentic NES 25% duty cycle pulse wave via Fourier series
  function createPulseWave(ctx, duty = 0.25) {
    const harmonics = 24;
    const real = new Float32Array(harmonics);
    const imag = new Float32Array(harmonics);
    for (let n = 1; n < harmonics; n++) {
      real[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
    }
    return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.master = null;
      this.pulse25 = null;
      this.pulse12 = null;
      this.muted = false;
      this.paused = false;
      this.pauseSuspendTimer = null;
      this.currentTrack = null;
      this.trackTimer = null;
      this.stepIndex = 0;
      this.tempoScale = 1.0;
    }

    init() {
      if (this.ctx) {
        if (!this.paused && this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.30;

      // Authentic NES 2A03 / CRT TV analog output filter (removes harsh digital squeak)
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2600;
      lp.Q.value = 0.6;

      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 75;

      this.master.connect(hp);
      hp.connect(lp);
      lp.connect(this.ctx.destination);

      this.pulse25 = createPulseWave(this.ctx, 0.25);
      this.pulse50 = createPulseWave(this.ctx, 0.5);
      this.pulse12 = createPulseWave(this.ctx, 0.125);
    }

    setMuted(flag) {
      this.muted = !!flag;
      if (global.MarioAssets) global.MarioAssets.setMuted(this.muted);
      if (this.master && this.ctx) {
        this.master.gain.setValueAtTime(this.muted ? 0 : 0.26, this.ctx.currentTime);
      }
    }

    toggleMute() {
      this.setMuted(!this.muted);
      return this.muted;
    }

    setPaused(flag) {
      const next = !!flag;
      if (this.pauseSuspendTimer) {
        clearTimeout(this.pauseSuspendTimer);
        this.pauseSuspendTimer = null;
      }
      this.paused = next;
      if (next) {
        if (global.MarioAssets) global.MarioAssets.pauseMusic();
        if (this.ctx && this.ctx.state === 'running') {
          // Let the brief NES pause chime finish (~280ms), then fully suspend AudioContext
          this.pauseSuspendTimer = setTimeout(() => {
            if (this.paused && this.ctx && this.ctx.state === 'running') {
              this.ctx.suspend().catch(() => {});
            }
          }, 280);
        }
      } else {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (global.MarioAssets) global.MarioAssets.resumeMusic();
      }
    }

    tone(freq, startTime, duration, type = 'pulse25', volume = 0.18, freqEnd = null, decay = false) {
      if (!this.ctx || !this.master || this.muted || !freq) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      if (type === 'pulse25' && this.pulse25) {
        osc.setPeriodicWave(this.pulse25);
      } else if (type === 'pulse50' && this.pulse50) {
        osc.setPeriodicWave(this.pulse50);
      } else if (type === 'pulse12' && this.pulse12) {
        osc.setPeriodicWave(this.pulse12);
      } else {
        osc.type = (type === 'pulse25' || type === 'pulse50' || type === 'pulse12') ? 'square' : type;
      }
      osc.frequency.setValueAtTime(freq, startTime);
      if (freqEnd !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), startTime + duration);
      }
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.005);
      if (decay) {
        // Snappy NES 2A03 hardware volume-envelope decay (warm & bouncy, not buzzy)
        gain.gain.exponentialRampToValueAtTime(Math.max(0.0008, volume * 0.22), startTime + duration);
      } else {
        gain.gain.setValueAtTime(volume * 0.85, Math.max(startTime + 0.007, startTime + duration - 0.015));
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      }
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.012);
    }

    noise(startTime, duration, volume = 0.18, freq = 1400) {
      if (!this.ctx || !this.master || this.muted) return;
      const sr = this.ctx.sampleRate;
      const len = Math.max(1, Math.floor(sr * duration));
      const buf = this.ctx.createBuffer(1, len, sr);
      const data = buf.getChannelData(0);
      // LFSR-like gritty 8-bit noise
      let lfsr = 0x7fff;
      for (let i = 0; i < len; i++) {
        if (i % 4 === 0) {
          const bit = ((lfsr >> 0) ^ (lfsr >> 1)) & 1;
          lfsr = (lfsr >> 1) | (bit << 14);
        }
        data[i] = ((lfsr & 1) ? 1 : -1) * (1 - i / len);
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(startTime);
    }

    // ---- Authentic NES Sound Effects ----
    playSfx(name) {
      this.init();
      if (this.muted) return;
      if (global.MarioAssets && global.MarioAssets.playSfx(name, this.muted)) return;
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      switch (name) {
        case 'jump':
          this.tone(185, t, 0.17, 'pulse25', 0.22, 590);
          break;
        case 'jumpBig':
          this.tone(130, t, 0.21, 'pulse25', 0.24, 430);
          break;
        case 'swim':
          this.noise(t, 0.09, 0.13, 1100);
          this.tone(360, t + 0.012, 0.055, 'sine', 0.18, 255);
          this.tone(560, t + 0.045, 0.04, 'sine', 0.11, 360);
          break;
        case 'spring':
          this.tone(150, t, 0.14, 'pulse25', 0.22, 680);
          this.tone(360, t + 0.10, 0.14, 'pulse25', 0.20, 920);
          break;
        case 'coin':
          this.tone(NOTE_FREQ.B5, t, 0.075, 'pulse25', 0.22);
          this.tone(NOTE_FREQ.E6, t + 0.075, 0.28, 'pulse25', 0.22);
          break;
        case 'bump':
          this.tone(160, t, 0.09, 'triangle', 0.38, 60);
          break;
        case 'break':
          this.noise(t, 0.16, 0.30, 900);
          this.tone(240, t, 0.09, 'pulse25', 0.16, 65);
          break;
        case 'stomp':
          this.tone(390, t, 0.055, 'pulse25', 0.22, 130);
          this.tone(195, t + 0.045, 0.075, 'triangle', 0.30, 75);
          break;
        case 'kick':
          this.tone(240, t, 0.075, 'pulse25', 0.22, 540);
          break;
        case 'fireball':
          this.tone(740, t, 0.06, 'pulse12', 0.18, 210);
          break;
        case 'cannon':
          this.noise(t, 0.14, 0.32, 320);
          this.tone(120, t, 0.12, 'triangle', 0.34, 42);
          break;
        case 'powerupAppear': {
          const seq = [261, 329, 392, 494, 587, 698, 784];
          seq.forEach((f, i) => this.tone(f, t + i * 0.045, 0.055, 'pulse25', 0.18));
          break;
        }
        case 'powerup': {
          const seq = ['C4','E4','G4','C5','E5','G5','C6','G4','B4','D5','G5','B5','D6'];
          seq.forEach((n, i) => this.tone(NOTE_FREQ[n], t + i * 0.042, 0.065, 'pulse25', 0.20));
          break;
        }
        case 'shrink': {
          const seq = [520, 440, 350, 260, 195, 145];
          seq.forEach((f, i) => this.tone(f, t + i * 0.05, 0.06, 'pulse25', 0.22));
          break;
        }
        case 'oneUp': {
          const seq = ['E5','G5','E6','C6','D6','G6'];
          seq.forEach((n, i) => this.tone(NOTE_FREQ[n], t + i * 0.085, 0.10, 'pulse25', 0.24));
          break;
        }
        case 'pipe': {
          for (let i = 0; i < 3; i++) {
            this.tone(250 - i * 40, t + i * 0.115, 0.095, 'pulse25', 0.20, 90);
          }
          break;
        }
        case 'flagpole':
          this.tone(740, t, 0.58, 'pulse25', 0.18, 210);
          break;
        case 'bowserFire':
          this.noise(t, 0.30, 0.26, 650);
          this.tone(170, t, 0.26, 'sawtooth', 0.15, 65);
          break;
        case 'bridgeCollapse':
          this.noise(t, 0.10, 0.26, 750);
          this.tone(145, t, 0.09, 'pulse25', 0.18, 55);
          break;
        case 'pause':
          this.tone(NOTE_FREQ.E5, t, 0.06, 'pulse25', 0.20);
          this.tone(NOTE_FREQ.C5, t + 0.06, 0.06, 'pulse25', 0.20);
          this.tone(NOTE_FREQ.E5, t + 0.12, 0.06, 'pulse25', 0.20);
          this.tone(NOTE_FREQ.C5, t + 0.18, 0.09, 'pulse25', 0.20);
          break;
        case 'hurry': {
          const seq = ['C5','E5','G5','C6','G5','C6','E6'];
          seq.forEach((n, i) => this.tone(NOTE_FREQ[n], t + i * 0.065, 0.075, 'pulse25', 0.22));
          break;
        }
        case 'death': {
          const notes = [
            ['B4', 0.00, 0.10], ['F5', 0.12, 0.10], ['F5', 0.28, 0.10],
            ['F5', 0.42, 0.12], ['E5', 0.56, 0.12], ['D5', 0.70, 0.12],
            ['C5', 0.84, 0.12], ['E4', 0.98, 0.10], ['C4', 1.12, 0.25]
          ];
          notes.forEach(([n, off, dur]) => this.tone(NOTE_FREQ[n], t + off, dur, 'pulse25', 0.24));
          break;
        }
        case 'stageClear': {
          const notes = [
            ['G4', 0.00, 0.09], ['C5', 0.10, 0.09], ['E5', 0.20, 0.09],
            ['G5', 0.30, 0.09], ['C6', 0.40, 0.18], ['G5', 0.62, 0.12],
            ['Gs4', 0.78, 0.09], ['C5', 0.88, 0.09], ['Ds5', 0.98, 0.09],
            ['Gs5', 1.08, 0.18], ['Ds5', 1.30, 0.12],
            ['As4', 1.46, 0.09], ['D5', 1.56, 0.09], ['F5', 1.66, 0.09],
            ['As5', 1.76, 0.18], ['C6', 2.00, 0.45]
          ];
          notes.forEach(([n, off, dur]) => this.tone(NOTE_FREQ[n], t + off, dur, 'pulse25', 0.22));
          break;
        }
        case 'worldClear': {
          const notes = [
            ['C5', 0.00, 0.11], ['E5', 0.12, 0.11], ['G5', 0.24, 0.11], ['C6', 0.36, 0.22],
            ['B5', 0.60, 0.11], ['G5', 0.72, 0.11], ['A5', 0.84, 0.11], ['C6', 0.96, 0.24],
            ['D6', 1.24, 0.14], ['E6', 1.40, 0.45]
          ];
          notes.forEach(([n, off, dur]) => this.tone(NOTE_FREQ[n], t + off, dur, 'pulse25', 0.22));
          break;
        }
        case 'gameOver': {
          const notes = [
            ['C5', 0.00, 0.18], ['G4', 0.24, 0.18], ['E4', 0.48, 0.22],
            ['A4', 0.74, 0.16], ['B4', 0.92, 0.16], ['A4', 1.10, 0.16],
            ['Gs4', 1.28, 0.18], ['As4', 1.48, 0.18], ['Gs4', 1.68, 0.18],
            ['G4', 1.88, 0.48]
          ];
          notes.forEach(([n, off, dur]) => this.tone(NOTE_FREQ[n], t + off, dur, 'pulse25', 0.22));
          break;
        }
      }
    }

    // ---- Full 4-Channel NES Soundtracks ----
    playMusic(trackName, tempoScale = 1.0) {
      this.init();
      if (this.currentTrack === trackName && this.tempoScale === tempoScale && (this.trackTimer || (global.MarioAssets && global.MarioAssets.activeAudio))) {
        return;
      }
      this.stopMusic();
      this.currentTrack = trackName;
      this.tempoScale = tempoScale;
      this.stepIndex = 0;

      if (global.MarioAssets && global.MarioAssets.playMusic(trackName, tempoScale, this.muted)) {
        return;
      }

      // Full authentic 1985 NTSC NES Overworld Theme (Intro plays once, then loops A-A-B-C)
      // Tempo: 9 NES frames per 8th note = 150ms (200 BPM), with authentic quarter-note triplet on G4-E5-G5!
      const OW_INTRO_L = ['E5','E5',null,'E5', null,'C5','E5',null, 'G5',null,null,null, 'G4',null,null,null];
      const OW_INTRO_H = ['Fs4','Fs4',null,'Fs4', null,'Fs4','Fs4',null, 'B4',null,null,null, 'G3',null,null,null];
      const OW_INTRO_B = ['D3','D3',null,'D3', null,'D3','D3',null, 'G3',null,null,null, 'G2',null,null,null];
      const OW_INTRO_D = new Array(16).fill(1);

      const OW_A_L = [
        'C5',null,null,'G4', null,null,'E4',null, null,'A4',null,'B4', null,'As4','A4',null,
        'G4','E5','G5', 'A5',null,'F5','G5', null,'E5',null,'C5', 'D5','B4',null,null
      ];
      const OW_A_H = [
        'E4',null,null,'C4', null,null,'G3',null, null,'C4',null,'D4', null,'Cs4','C4',null,
        'C4','G4','B4', 'C5',null,'A4','B4', null,'G4',null,'E4', 'F4','D4',null,null
      ];
      const OW_A_B = [
        'G3',null,null,'E3', null,null,'C3',null, null,'F3',null,'G3', null,'Fs3','F3',null,
        'E3','C4','E4', 'F4',null,'D4','E4', null,'C4',null,'A3', 'B3','G3',null,null
      ];
      // Indices 16,17,18 are the iconic quarter-note triplet (4/3 of an 8th note each = 4 beats total)
      const OW_A_D = [
        1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1,
        4/3,4/3,4/3, 1,1,1,1, 1,1,1,1, 1,1,1,1
      ];

      const OW_B_L = [
        null,null,'G5','Fs5', 'F5','Ds5',null,'E5', null,'Gs4','A4','C5', null,'A4','C5','D5',
        null,null,'G5','Fs5', 'F5','Ds5',null,'E5', null,'C6',null,'C6', 'C6',null,null,null,
        null,null,'G5','Fs5', 'F5','Ds5',null,'E5', null,'Gs4','A4','C5', null,'A4','C5','D5',
        null,null,'Ds5',null, null,'D5',null,null, 'C5',null,null,null, null,null,null,null
      ];
      const OW_B_H = [
        null,null,'E5','Ds5', 'D5','B4',null,'C5', null,'E4','F4','A4', null,'F4','A4','B4',
        null,null,'E5','Ds5', 'D5','B4',null,'C5', null,'G5',null,'G5', 'G5',null,null,null,
        null,null,'E5','Ds5', 'D5','B4',null,'C5', null,'E4','F4','A4', null,'F4','A4','B4',
        null,null,'Gs4',null, null,'G4',null,null, 'E4',null,null,null, null,null,null,null
      ];
      const OW_B_B = [
        'C3',null,null,'G3', null,null,'C4',null, 'F3',null,null,'C4', 'C4',null,'F3',null,
        'C3',null,null,'G3', null,null,'G3','C4', null,'G3',null,'G3', 'G3',null,null,null,
        'C3',null,null,'G3', null,null,'C4',null, 'F3',null,null,'C4', 'C4',null,'F3',null,
        'C3',null,'Gs3',null, null,'As3',null,null, 'C4',null,null,'G3', 'C3',null,null,null
      ];
      const OW_B_D = new Array(64).fill(1);

      const OW_C_L = [
        'C5','C5',null,'C5', null,'C5','D5',null, 'E5','C5',null,'A4', 'G4',null,null,null,
        'C5','C5',null,'C5', null,'C5','D5','E5', null,null,null,null, null,null,null,null,
        'C5','C5',null,'C5', null,'C5','D5',null, 'E5','C5',null,'A4', 'G4',null,null,null
      ];
      const OW_C_H = [
        'Gs4','Gs4',null,'Gs4', null,'Gs4','As4',null, 'G4','E4',null,'C4', 'C4',null,null,null,
        'Gs4','Gs4',null,'Gs4', null,'Gs4','As4','G4', null,null,null,null, null,null,null,null,
        'Gs4','Gs4',null,'Gs4', null,'Gs4','As4',null, 'G4','E4',null,'C4', 'C4',null,null,null
      ];
      const OW_C_B = [
        'Gs2',null,null,'Ds3', null,null,'Gs3',null, 'G3',null,null,'C3', 'G2',null,null,null,
        'Gs2',null,null,'Ds3', null,null,'Gs3',null, 'G3',null,null,'C3', 'G2',null,null,null,
        'Gs2',null,null,'Ds3', null,null,'Gs3',null, 'G3',null,null,'C3', 'G2',null,null,null
      ];
      const OW_C_D = new Array(48).fill(1);

      const tracks = {
        overworld: {
          stepMs: 150,
          loopStart: 16,
          drums: true,
          lead: [...OW_INTRO_L, ...OW_A_L, ...OW_A_L, ...OW_B_L, ...OW_C_L],
          harm: [...OW_INTRO_H, ...OW_A_H, ...OW_A_H, ...OW_B_H, ...OW_C_H],
          bass: [...OW_INTRO_B, ...OW_A_B, ...OW_A_B, ...OW_B_B, ...OW_C_B],
          durs: [...OW_INTRO_D, ...OW_A_D, ...OW_A_D, ...OW_B_D, ...OW_C_D]
        },
        underground: {
          stepMs: 150,
          loopStart: 0,
          drums: false,
          lead: [
            'C4','C5','A3','A4', 'As3','As4',null,null, null,null,null,null, null,null,null,null,
            'C4','C5','A3','A4', 'As3','As4',null,null, null,null,null,null, null,null,null,null,
            'F3','F4','D3','D4', 'Ds3','Ds4',null,null, null,null,null,null, null,null,null,null,
            'F3','F4','D3','D4', 'Ds3','Ds4',null,null, 'Ds4','D4','Cs4',null, 'C4',null,'Gs3','G3',
            'Fs3','F3','E3','Ds3', null,null,null,null, null,null,null,null, null,null,null,null
          ],
          harm: [],
          bass: [
            'C3','C4','A2','A3', 'As2','As3',null,null, null,null,null,null, null,null,null,null,
            'C3','C4','A2','A3', 'As2','As3',null,null, null,null,null,null, null,null,null,null,
            'F2','F3','D2','D3', 'Ds2','Ds3',null,null, null,null,null,null, null,null,null,null,
            'F2','F3','D2','D3', 'Ds2','Ds3',null,null, 'Ds3','D3','Cs3',null, 'C3',null,'Gs2','G2',
            'Fs2','F2','E2','Ds2', null,null,null,null, null,null,null,null, null,null,null,null
          ]
        },
        underwater: {
          // Classic 3/4 Underwater Waltz (150 BPM, 12 NES frames per 8th = 200ms)
          stepMs: 200,
          loopStart: 0,
          drums: false,
          lead: [
            'D4','E4','Fs4','G4','A4','As4', 'B4','B4','B4','B4',null,'G4',
            'E5',null,null,'Ds5',null,null, 'E5',null,null,null,'G4','A4',
            'B4','C5','D5','E5',null,'D5', 'B4',null,null,null,'G4',null,
            'D5',null,null,'Cs5',null,null, 'D5',null,null,null,'G4','A4',
            'B4','C5','Cs5','D5',null,'G4', 'F5',null,null,null,'G4',null,
            'G5',null,null,'G5','G5','G5', 'G5','F5','E5','F5','E5','D5',
            'E5',null,null,'C5',null,null, 'A4',null,null,'C5',null,null
          ],
          harm: [
            null,null,null,null,null,null, 'G4',null,'D4','G4',null,'D4',
            'G4',null,'C4','Fs4',null,'C4', 'G4',null,'C4','G4',null,'C4',
            'G4',null,'D4','G4',null,'D4', 'G4',null,'D4','G4',null,'D4',
            'F4',null,'B3','E4',null,'As3', 'F4',null,'B3','F4',null,'B3',
            'F4',null,'B3','F4',null,'B3', 'B4',null,'G4','B4',null,'G4',
            'B4',null,'G4','B4',null,'G4', 'B4',null,'G4','B4',null,'G4',
            'G4',null,'E4','G4',null,'E4', 'E4',null,'C4','E4',null,'C4'
          ],
          bass: [
            null,null,null,null,null,null, 'G2',null,'D3','G2',null,'D3',
            'C3',null,'G3','C3',null,'G3', 'C3',null,'G3','C3',null,'G3',
            'G2',null,'D3','G2',null,'D3', 'G2',null,'D3','G2',null,'D3',
            'G2',null,'D3','G2',null,'D3', 'G2',null,'D3','G2',null,'D3',
            'G2',null,'D3','G2',null,'D3', 'G2',null,'D3','G2',null,'D3',
            'G2',null,'D3','G2',null,'D3', 'G2',null,'D3','G2',null,'D3',
            'C3',null,'G3','C3',null,'G3', 'C3',null,'G3','C3',null,'G3'
          ]
        },
        castle: {
          stepMs: 100,
          loopStart: 0,
          drums: false,
          lead: [
            'D4','Ds4','D4','Cs4','D4','Ds4','D4','Cs4','D4','Ds4','D4','F4','E4','Ds4','D4','Cs4',
            'G4','Gs4','G4','Fs4','G4','Gs4','G4','Fs4','G4','Gs4','G4','As4','A4','Gs4','G4','Fs4',
            'As4','B4','As4','A4','As4','B4','As4','A4','As4','B4','As4','Cs5','C5','B4','As4','A4'
          ],
          harm: [
            'A3','As3','A3','Gs3','A3','As3','A3','Gs3','A3','As3','A3','C4','B3','As3','A3','Gs3',
            'D4','Ds4','D4','Cs4','D4','Ds4','D4','Cs4','D4','Ds4','D4','F4','E4','Ds4','D4','Cs4',
            'F4','Fs4','F4','E4','F4','Fs4','F4','E4','F4','Fs4','F4','Gs4','G4','Fs4','F4','E4'
          ],
          bass: [
            'D2',null,'A2',null,'D2',null,'A2',null,'D2',null,'As2',null,'A2',null,'G2',null,
            'G2',null,'D3',null,'G2',null,'D3',null,'G2',null,'Ds3',null,'D3',null,'C3',null,
            'As2',null,'F3',null,'As2',null,'F3',null,'As2',null,'Fs3',null,'F3',null,'Ds3',null
          ]
        },
        starman: {
          // Authentic Koji Kondo Invincibility ostinato (fallback if starman.ogg unavailable)
          stepMs: 96,
          loopStart: 0,
          drums: true,
          lead: [
            'C5',null,'C5',null,'C5',null,'D4','C5', null,null,'C5',null,'D4','C5','D4','C5',
            'B4',null,'B4',null,'B4',null,'C4','B4', null,null,'B4',null,'C4','B4','C4','B4'
          ],
          harm: [
            'A4',null,'A4',null,'A4',null,'F4','A4', null,null,'A4',null,'F4','A4','F4','A4',
            'G4',null,'G4',null,'G4',null,'E4','G4', null,null,'G4',null,'E4','G4','E4','G4'
          ],
          bass: [
            'D3',null,null,'A3',null,null,'D4',null, 'D3',null,'A3',null,'D4',null,'A3',null,
            'C3',null,null,'G3',null,null,'C4',null, 'C3',null,'G3',null,'C4',null,'G3',null
          ]
        }
      };

      const tr = tracks[trackName];
      if (!tr) return;

      const baseStepSec = (tr.stepMs / 1000) / tempoScale;
      const loopStart = tr.loopStart || 0;
      let nextStepTime = this.ctx ? this.ctx.currentTime + 0.03 : 0;

      const schedule = () => {
        if (this.currentTrack !== trackName || !this.ctx) return;
        if (this.paused || this.ctx.state !== 'running') {
          nextStepTime = this.ctx.currentTime + 0.03;
          return;
        }
        // Prevent catch-up burst after tab pause
        if (nextStepTime < this.ctx.currentTime - 0.15) {
          nextStepTime = this.ctx.currentTime + 0.02;
        }

        const lookahead = 0.12;
        while (nextStepTime < this.ctx.currentTime + lookahead) {
          const idx = this.stepIndex;
          const mult = (tr.durs && tr.durs[idx]) ? tr.durs[idx] : 1;
          const stepSec = baseStepSec * mult;

          if (!this.muted) {
            const leadNote = tr.lead[idx];
            const harmNote = tr.harm && tr.harm.length ? tr.harm[idx % tr.harm.length] : null;
            const bassNote = tr.bass && tr.bass.length ? tr.bass[idx % tr.bass.length] : null;
            const dur = stepSec * 0.86;

            if (leadNote && NOTE_FREQ[leadNote]) {
              this.tone(NOTE_FREQ[leadNote], nextStepTime, dur, 'pulse25', 0.12, null, true);
            }
            if (harmNote && NOTE_FREQ[harmNote]) {
              this.tone(NOTE_FREQ[harmNote], nextStepTime, dur * 0.88, 'pulse50', 0.08, null, true);
            }
            if (bassNote && NOTE_FREQ[bassNote]) {
              this.tone(NOTE_FREQ[bassNote], nextStepTime, dur * 1.12, 'triangle', 0.34, null, false);
            }
            if (tr.drums) {
              const beat = idx % 8;
              if (beat === 0 || beat === 4) {
                this.noise(nextStepTime, 0.04, 0.09, 360);
              } else if (beat === 2 || beat === 6) {
                this.noise(nextStepTime, 0.055, 0.08, 920);
              }
            }
          }

          nextStepTime += stepSec;
          this.stepIndex++;
          if (this.stepIndex >= tr.lead.length) {
            this.stepIndex = loopStart;
          }
        }
      };

      schedule();
      this.trackTimer = setInterval(schedule, 25);
    }

    stopMusic() {
      if (global.MarioAssets) global.MarioAssets.stopMusic();
      if (this.trackTimer) {
        clearInterval(this.trackTimer);
        this.trackTimer = null;
      }
      this.currentTrack = null;
    }
  }

  global.MarioAudio = new SoundEngine();
})(window);
