// ============================================================
//  AUDIO — synthesized Web Audio chiptune. No asset loading.
//  Exposes window.Audio4 (avoid clashing with the DOM Audio).
// ============================================================
'use strict';

(function () {
  let ctx = null;
  let masterGain = null;
  let muted = false;

  function ensureCtx() {
    if (ctx) return ctx;
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 0.6;
    masterGain.connect(ctx.destination);
    return ctx;
  }

  // tiny synth note. freq Hz, dur seconds, type osc, attack/decay shape.
  function note(freq, dur, type, peak, sustain) {
    ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(peak ?? 0.25, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, sustain ?? 0.05), now + dur * 0.5);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(masterGain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  // noise burst (for thunks, crowd, etc.)
  function noise(dur, peak, lowpassHz) {
    ensureCtx();
    if (!ctx) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    gain.gain.value = peak ?? 0.3;
    if (lowpassHz) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = lowpassHz;
      src.connect(lp).connect(gain).connect(masterGain);
    } else {
      src.connect(gain).connect(masterGain);
    }
    src.start();
  }

  const Audio4 = {
    resume() {
      ensureCtx();
      if (ctx && ctx.state === 'suspended') ctx.resume();
    },
    setMuted(m) {
      muted = m;
      if (masterGain) masterGain.gain.value = m ? 0 : 0.6;
    },
    isMuted() { return muted; },

    // SFX library
    jump()       { note(420, 0.15, 'square', 0.20); setTimeout(() => note(620, 0.12, 'square', 0.18), 60); },
    land()       { noise(0.06, 0.18, 600); },
    hip()        { note(220, 0.10, 'sawtooth', 0.35); noise(0.12, 0.35, 1800); },
    knee()       { note(160, 0.14, 'square', 0.40); noise(0.10, 0.40, 1200); },
    elbow()      { note(380, 0.08, 'square', 0.30); note(520, 0.12, 'triangle', 0.25); noise(0.10, 0.30, 2400); },
    miss()       { note(180, 0.10, 'sawtooth', 0.18); },
    score()      { note(523, 0.10); setTimeout(() => note(659, 0.10), 90); setTimeout(() => note(784, 0.18), 180); },
    hoopWin()    {
      // huge fanfare
      const seq = [523, 659, 784, 1046, 784, 1046, 1318];
      seq.forEach((f, i) => setTimeout(() => note(f, 0.18, 'square', 0.35), i * 110));
    },
    onFire()     {
      // ascending "ignition" trill
      [523, 659, 784, 988].forEach((f, i) => setTimeout(() => note(f, 0.08, 'square', 0.30), i * 50));
    },
    cooldown()   { note(140, 0.06, 'sawtooth', 0.10); },
    uiClick()    { note(880, 0.06, 'square', 0.18); },
    uiBack()     { note(440, 0.06, 'square', 0.18); },

    // Math-tile feedback
    mathRight() {
      // gentle ascending chime
      note(659, 0.06, 'triangle', 0.30);
      setTimeout(() => note(880, 0.10, 'triangle', 0.32), 60);
    },
    mathWrong() {
      // big nasty buzzer
      note(140, 0.30, 'sawtooth', 0.45, 0.30);
      noise(0.30, 0.30, 600);
    },
    powerUpEarned(tier) {
      // big triumphant chord, more notes for major tier
      const seq = tier === 'major'
        ? [523, 659, 784, 1046, 1318, 1568]
        : [523, 659, 988];
      seq.forEach((f, i) => setTimeout(() => note(f, 0.14, 'square', 0.32), i * 70));
    },

    // Announcer "voice" — pitched noise burst with phoneme-ish shaping.
    // Not actual speech. Provides a punchy "BWAAA" stab on big moments.
    announceStab(intensity) {
      ensureCtx();
      if (!ctx) return;
      const i = intensity ?? 1;
      note(180 + 40 * Math.random(), 0.08, 'sawtooth', 0.40 * i);
      setTimeout(() => note(260 + 60 * Math.random(), 0.14, 'square', 0.30 * i), 70);
      setTimeout(() => noise(0.08, 0.20 * i, 1400), 90);
    },

    // POWERUP HORN — short two-tone rising blast.
    // The "you got something!" signature. ~400ms total.
    powerUpHorn(intensity) {
      ensureCtx();
      if (!ctx) return;
      const i = intensity ?? 1;
      // Rising horn: punchy square note → bright square note
      note(330, 0.10, 'square', 0.35 * i, 0.12);
      setTimeout(() => note(523, 0.18, 'square', 0.40 * i, 0.15), 80);
      // Sparkle on top
      setTimeout(() => note(1046, 0.10, 'triangle', 0.18 * i), 140);
      setTimeout(() => note(1568, 0.08, 'triangle', 0.14 * i), 220);
      // Quick noise burst for grit
      setTimeout(() => noise(0.05, 0.15 * i, 3000), 60);
    },

    // FIGHT HORN — single descending blast, like a referee horn.
    // Used for "rally start."
    fightHorn(intensity) {
      ensureCtx();
      if (!ctx) return;
      const i = intensity ?? 1;
      // Two simultaneous notes forming a perfect-5th, going down a step
      const now = ctx.currentTime;
      const blast = (freq, dur) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + dur);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.30 * i, now + 0.01);
        g.gain.linearRampToValueAtTime(0.25 * i, now + dur * 0.7);
        g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        osc.connect(g).connect(masterGain);
        osc.start(now);
        osc.stop(now + dur + 0.02);
      };
      blast(330, 0.40);
      blast(495, 0.40);
    },

    // CROWD WHOOP — short cheering reaction (~250ms). Used for raya score
    // fallbacks (the existing score() chime is more melodic; this adds energy).
    crowdWhoop(intensity) {
      ensureCtx();
      if (!ctx) return;
      const i = intensity ?? 1;
      noise(0.22, 0.20 * i, 1800);
      setTimeout(() => note(660, 0.10, 'square', 0.18 * i), 40);
      setTimeout(() => note(880, 0.10, 'triangle', 0.14 * i), 100);
    },

    // Try to play a pre-recorded voice clip. If no clip is found for this
    // key, falls back to an event-specific synth noise (NOT speech imitation).
    // Key examples: 'fight', 'victory', 'you_win', 'jaguar_step', 'twin_sun'.
    speak(key, intensity) {
      if (muted) return;
      VOICE_CACHE = VOICE_CACHE || {};
      const cached = VOICE_CACHE[key];
      const playFallback = () => {
        // Match the noise to the event type — different events sound different.
        if (key === 'fight') {
          Audio4.fightHorn(intensity || 1);
        } else if (key === 'raya' || key === 'hoop') {
          Audio4.crowdWhoop(intensity || 1);
        } else if (key === 'you_win') {
          Audio4.powerUpHorn(1.3);
        } else {
          // Default: powerup horn (used for all 8 powerup unlock keys)
          Audio4.powerUpHorn(intensity || 1);
        }
      };
      if (cached === 'missing') { playFallback(); return; }
      if (cached === 'ok') {
        new Audio(`audio/voice/${key}.mp3`).play().catch(() => {});
        return;
      }
      // First time we've seen this key — probe with HEAD so we don't spam 404s
      const url = `audio/voice/${key}.mp3`;
      fetch(url, { method: 'HEAD' }).then(res => {
        if (res.ok) {
          VOICE_CACHE[key] = 'ok';
          const a = new Audio(url);
          a.volume = 0.85;
          a.play().catch(() => {});
        } else {
          VOICE_CACHE[key] = 'missing';
          playFallback();
        }
      }).catch(() => {
        VOICE_CACHE[key] = 'missing';
        playFallback();
      });
    },
  };

  let VOICE_CACHE;
  window.Audio4 = Audio4;
})();
