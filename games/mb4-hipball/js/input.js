// ============================================================
//  INPUT — keyboard + touch buttons. Exposes window.Input4 with
//  a per-player input state. Player 1 only on touch.
// ============================================================
'use strict';

(function () {
  // Per-player input flags. Updated each frame from key states.
  const p1 = freshInput();
  const p2 = freshInput();

  function freshInput() {
    return {
      left: false, right: false, fwd: false, back: false,
      jump: false, jumpPressed: false,
      hip: false, hipPressed: false,
      knee: false, kneePressed: false,
      elbow: false, elbowPressed: false,
      _prev: {},
    };
  }

  // raw key flags — keydown sets true, keyup sets false
  const keys = {};
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    keys[e.key.toLowerCase()] = true;
    keys[e.code] = true;
    // Prevent scroll on game keys
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Space'].includes(e.key)) e.preventDefault();
  }, { passive: false });
  window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
    keys[e.code] = false;
  });

  // Touch buttons. DOM creates them in index.html; we listen for press/release.
  const touchFlags = { left: false, right: false, jump: false, hip: false, knee: false, elbow: false };
  function bindTouch(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    const on = (ev) => { ev.preventDefault(); touchFlags[key] = true; };
    const off = (ev) => { ev.preventDefault(); touchFlags[key] = false; };
    el.addEventListener('touchstart', on, { passive: false });
    el.addEventListener('touchend', off, { passive: false });
    el.addEventListener('touchcancel', off, { passive: false });
    el.addEventListener('mousedown', on);
    el.addEventListener('mouseup', off);
    el.addEventListener('mouseleave', off);
  }
  function setupTouch() {
    bindTouch('btn-left',  'left');
    bindTouch('btn-right', 'right');
    bindTouch('btn-jump',  'jump');
    bindTouch('btn-hip',   'hip');
    bindTouch('btn-knee',  'knee');
    bindTouch('btn-elbow', 'elbow');
  }

  // Per-frame: compute current state + edge-triggered "pressed" flags
  function tick() {
    // Player 1: WASD + Space + Z/X/C (left-hand cluster, all near each other)
    updatePlayer(p1, {
      left:  keys['a'] || keys['ArrowLeft'] || touchFlags.left,
      right: keys['d'] || keys['ArrowRight'] || touchFlags.right,
      fwd:   keys['w'] || keys['ArrowUp'],         // INTO the screen (toward hoop)
      back:  keys['s'] || keys['ArrowDown'],       // OUT (toward camera)
      jump:  keys[' '] || keys['Space'] || touchFlags.jump,
      hip:   keys['z'] || touchFlags.hip,
      knee:  keys['x'] || touchFlags.knee,
      elbow: keys['c'] || touchFlags.elbow,
    });

    // Player 2 (local couch co-op): numpad. Same direction convention —
    // Numpad8 = into the screen, Numpad5 = out.
    updatePlayer(p2, {
      left:  keys['Numpad4'] || false,
      right: keys['Numpad6'] || false,
      fwd:   keys['Numpad8'] || false,             // up = into screen
      back:  keys['Numpad5'] || false,             // down = out
      jump:  keys['Numpad0'] || false,
      hip:   keys['Numpad1'] || false,
      knee:  keys['Numpad2'] || false,
      elbow: keys['Numpad3'] || false,
    });
  }

  function updatePlayer(p, raw) {
    // edge: pressed = down this frame, wasn't last frame
    p.jumpPressed  = raw.jump  && !p._prev.jump;
    p.hipPressed   = raw.hip   && !p._prev.hip;
    p.kneePressed  = raw.knee  && !p._prev.knee;
    p.elbowPressed = raw.elbow && !p._prev.elbow;
    p.left = raw.left; p.right = raw.right;
    p.fwd  = raw.fwd;  p.back  = raw.back;
    p.jump = raw.jump;
    p.hip = raw.hip; p.knee = raw.knee; p.elbow = raw.elbow;
    p._prev = { jump: raw.jump, hip: raw.hip, knee: raw.knee, elbow: raw.elbow };
  }

  window.Input4 = { tick, setupTouch, p1, p2, freshInput };
})();
