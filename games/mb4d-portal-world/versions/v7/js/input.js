// MB4D v7 — input scheme per Gameplay B2 (Data6):
//
//   ← / →   turn MB left / right
//   ↑ / ↓   forward / back
//   Space   jump (Space + Space = double jump)
//   W A S D camera pan (up/left/down/right)
//   Q       recenter camera behind MB
//   Z       crouch
//   X       throw a peel
//   Space+Space then X within a beat → 5-peel special
//
// The Level 1 (MB4) iframe does its own input; we only matter in the 3D world.

const held = new Set();
const edges = new Set();

const KEYMAP = {
  ArrowLeft:  ['turnL'],
  ArrowRight: ['turnR'],
  ArrowUp:    ['fwd'],
  ArrowDown:  ['back'],

  Space:      ['jump'],

  // Camera (mapped to camera, NOT MB movement)
  KeyW: ['camUp'],
  KeyS: ['camDown'],
  KeyA: ['camLeft'],
  KeyD: ['camRight'],
  KeyQ: ['camReset'],

  KeyZ: ['crouch'],
  KeyX: ['peel'],
};

export function initInput() {
  window.addEventListener('keydown', (e) => {
    const actions = KEYMAP[e.code];
    if (!actions) return;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    for (const a of actions) {
      if (!held.has(a)) edges.add(a);
      held.add(a);
    }
  });
  window.addEventListener('keyup', (e) => {
    const actions = KEYMAP[e.code];
    if (!actions) return;
    for (const a of actions) held.delete(a);
  });
  window.addEventListener('blur', () => { held.clear(); edges.clear(); });
}

// Programmatic helpers so the on-screen touch HUD can synthesize key events
// from the same action vocabulary.
export function touchDown(action) { if (!held.has(action)) edges.add(action); held.add(action); }
export function touchUp(action)   { held.delete(action); }
export function touchTap(action)  { edges.add(action); held.delete(action); }

export const input = {
  down:    (a) => held.has(a),
  pressed: (a) => edges.has(a),
  endFrame: () => edges.clear(),
};
