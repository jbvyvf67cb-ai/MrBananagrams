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

    // CROWD ROAR — synthesized arena reaction. Layered filtered noise + a
    // low rumble. Used as a "shout" replacement when a real voice clip
    // isn't available for the moment.
    crowdRoar(intensity) {
      ensureCtx();
      if (!ctx) return;
      const i = intensity ?? 1;
      // Long noise burst with a bandpass sweep (gives the "crowd cheering" texture)
      const dur = 0.9;
      const len = Math.floor(ctx.sampleRate * dur);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let k = 0; k < len; k++) {
        // White noise with an amplitude envelope (swell + decay)
        const env = Math.min(1, k / (len * 0.15)) * Math.pow(1 - k / len, 1.5);
        d[k] = (Math.random() * 2 - 1) * env;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(600, ctx.currentTime);
      bp.frequency.linearRampToValueAtTime(1400, ctx.currentTime + dur);
      bp.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.value = 0.35 * i;
      src.connect(bp).connect(g).connect(masterGain);
      src.start();
      // Low rumble layer for thump
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(60, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(45, ctx.currentTime + dur);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0, ctx.currentTime);
      og.gain.linearRampToValueAtTime(0.22 * i, ctx.currentTime + 0.05);
      og.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(og).connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.05);
    },

    // Try to play a pre-recorded voice clip. If no clip is found for this
    // key, falls back to the synth stinger (announceStab + crowdRoar layered).
    // Key examples: 'fight', 'victory', 'you_win', 'jaguar_step', 'twin_sun'.
    speak(key, intensity) {
      if (muted) return;
      VOICE_CACHE = VOICE_CACHE || {};
      const cached = VOICE_CACHE[key];
      if (cached === 'missing') {
        Audio4.announceStab(intensity || 1);
        Audio4.crowdRoar(intensity || 1);
        return;
      }
      if (cached === 'ok') {
        // We already verified this file exists; just play
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
          Audio4.announceStab(intensity || 1);
          Audio4.crowdRoar(intensity || 1);
        }
      }).catch(() => {
        VOICE_CACHE[key] = 'missing';
        Audio4.announceStab(intensity || 1);
        Audio4.crowdRoar(intensity || 1);
      });
    },
  };

  let VOICE_CACHE;
  window.Audio4 = Audio4;
})();
