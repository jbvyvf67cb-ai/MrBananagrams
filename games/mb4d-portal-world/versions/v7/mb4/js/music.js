// ============================================================
//  MUSIC — backing track for the game.
//
//  Two modes:
//  1. File mode: if audio/match.mp3 / audio/title.mp3 exist, stream them.
//  2. Synth mode: procedurally-generated chiptune loop (Mesoamerican-
//     flavored pentatonic), no external assets needed.
//
//  The system auto-detects which mode to use on init by trying to fetch
//  the files. If they exist, file mode. Otherwise synth mode.
// ============================================================
'use strict';

(function () {
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let muted = false;
  let volume = 0.35;   // music a bit quieter than SFX

  let mode = 'none';    // 'file' | 'synth' | 'none'
  let currentAudioEl = null;
  let synthState = null;
  let probedFiles = false;

  // Available track files (one per game state). The system will try to
  // fetch each and use whichever exists.
  const TRACK_FILES = {
    title: 'audio/title.mp3',
    match: 'audio/match.mp3',
    win:   'audio/win.mp3',
    lose:  'audio/lose.mp3',
  };
  const filesExist = {};

  function ensureCtx() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 1;
    masterGain.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = volume;
    musicGain.connect(masterGain);
    return ctx;
  }

  // ---- File mode ----
  async function probeFiles() {
    if (probedFiles) return;
    probedFiles = true;
    for (const [key, path] of Object.entries(TRACK_FILES)) {
      try {
        const res = await fetch(path, { method: 'HEAD' });
        filesExist[key] = res.ok;
      } catch (e) {
        filesExist[key] = false;
      }
    }
  }

  function playFile(trackKey) {
    if (!filesExist[trackKey]) return false;
    stopCurrent();
    const el = new Audio(TRACK_FILES[trackKey]);
    el.loop = (trackKey !== 'win' && trackKey !== 'lose');
    el.volume = muted ? 0 : volume;
    el.play().catch(() => {/* autoplay blocked — wait for user gesture */});
    currentAudioEl = el;
    return true;
  }

  function stopFile() {
    if (currentAudioEl) {
      try { currentAudioEl.pause(); currentAudioEl.src = ''; } catch (_) {}
      currentAudioEl = null;
    }
  }

  // ---- Synth mode ----
  // Pentatonic minor scale on root D (D, F, G, A, C). Mesoamerican music
  // didn't really use these scales, but a chiptune-flavored pentatonic minor
  // feels "ancient and ritualistic" to a modern listener and avoids the
  // cultural sin of trying to authentically reproduce something we don't
  // have surviving examples of. This is intentionally stylized "evocative,"
  // not historical.
  const SCALE = [146.83, 174.61, 196.00, 220.00, 261.63];   // D3 F3 G3 A3 C4
  const BASS  = [73.42, 110.00];                              // D2 A2

  function startSynth(trackKey) {
    ensureCtx();
    if (!ctx) return;
    stopSynth();
    const tempo = trackKey === 'title' ? 92 : 116;   // BPM
    const beatMs = 60000 / tempo;
    const stepMs = beatMs / 4;   // sixteenth notes

    const state = {
      step: 0,
      timer: null,
      tempo, beatMs, stepMs,
    };

    // Pattern: each "step" plays optional bass / melody notes.
    const len = 64;   // 16 beats per loop
    function tick() {
      const s = state.step % len;
      const now = ctx.currentTime;

      // Bass drum on every beat (every 4 steps)
      if (s % 4 === 0) {
        playPercNote(now, 80, 0.08, 0.50);   // low thump
      }
      // Snare/clap on beats 2 and 4 (steps 8, 24, 40, 56)
      if (s === 8 || s === 24 || s === 40 || s === 56) {
        playNoise(now, 0.06, 0.25, 1800);
      }
      // Bass melody on certain steps
      const bassPattern = [0, 16, 32, 48];
      if (bassPattern.includes(s)) {
        const note = BASS[Math.floor(s / 32) % BASS.length];
        playToneNote(now, note, 0.35, 'sawtooth', 0.18);
      }
      // Melody — pentatonic noodling, somewhat sparse
      const melodyPattern = [2, 6, 10, 14, 18, 22, 28, 34, 38, 42, 46, 54, 60];
      if (melodyPattern.includes(s)) {
        // Pick a note from the scale, with slight randomness for variation
        const idx = ((s / 2) | 0) % SCALE.length;
        const useIdx = Math.random() < 0.15 ? (idx + 1) % SCALE.length : idx;
        const note = SCALE[useIdx];
        const dur = (Math.random() < 0.3) ? stepMs * 1.4 / 1000 : stepMs * 0.8 / 1000;
        playToneNote(now, note, dur, 'triangle', 0.16);
      }
      // Occasional "wood block" percussion (flam)
      if (s === 12 || s === 28 || s === 44 || s === 60) {
        playPercNote(now, 700, 0.04, 0.10);
      }

      state.step++;
    }

    state.timer = setInterval(tick, stepMs);
    synthState = state;
  }

  function stopSynth() {
    if (synthState && synthState.timer) {
      clearInterval(synthState.timer);
      synthState = null;
    }
  }

  function playToneNote(when, freq, dur, type, peak) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(g).connect(musicGain);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }

  function playPercNote(when, freq, dur, peak) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 2, when);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, when + dur);
    g.gain.setValueAtTime(peak, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    osc.connect(g).connect(musicGain);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  function playNoise(when, dur, peak, lpHz) {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = peak;
    if (lpHz) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = lpHz;
      src.connect(lp).connect(g).connect(musicGain);
    } else {
      src.connect(g).connect(musicGain);
    }
    src.start(when);
  }

  function stopCurrent() {
    stopFile();
    stopSynth();
  }

  // Public API
  const Music4 = {
    async init() {
      ensureCtx();
      await probeFiles();
    },

    play(trackKey) {
      // trackKey: 'title' | 'match' | 'win' | 'lose'
      ensureCtx();
      if (!ctx) return;
      // Prefer file mode if the file exists
      if (filesExist[trackKey]) {
        mode = 'file';
        playFile(trackKey);
      } else {
        // Synth mode — only generates for 'title' and 'match' (win/lose are one-shots)
        if (trackKey === 'win' || trackKey === 'lose') {
          // Brief sting via the existing Audio4 helpers — caller handles this
          mode = 'none';
          return;
        }
        mode = 'synth';
        startSynth(trackKey);
      }
    },

    stop() {
      stopCurrent();
      mode = 'none';
    },

    setMuted(m) {
      muted = m;
      if (musicGain) musicGain.gain.value = m ? 0 : volume;
      if (currentAudioEl) currentAudioEl.volume = m ? 0 : volume;
    },
    isMuted() { return muted; },

    setVolume(v) {
      volume = Math.max(0, Math.min(1, v));
      if (musicGain) musicGain.gain.value = muted ? 0 : volume;
      if (currentAudioEl) currentAudioEl.volume = muted ? 0 : volume;
    },

    resume() {
      ensureCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },

    mode() { return mode; },
  };

  window.Music4 = Music4;
})();
