// MB4D v8 — input scheme per Gameplay B2 (Data6) + Data7 patches:
//
//   ← / →   turn MB left / right
//   ↑ / ↓   forward / back
//   Space   jump (Space + Space = double jump) — also "press" things
//   W A S D camera pan (up/left/down/right)
//   Q       recenter camera behind MB
//   Z       crouch
//   X       throw a peel
//   R       throw a peel (alias; matches the L1/MB4 peel binding) + "press" things
//   Enter   alternate "press" key for buttons (L4)
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

  // Space jumps AND presses level-4's button.
  Space:      ['jump', 'press'],
  Enter:      ['press'],

  // Camera (mapped to camera, NOT MB movement)
  KeyW: ['camUp'],
  KeyS: ['camDown'],
  KeyA: ['camLeft'],
  KeyD: ['camRight'],
  KeyQ: ['camReset'],

  KeyZ: ['crouch'],
  // X and R both throw a peel (Data7 brings R back for the MB4 mini-game;
  // we accept it in the 3D world too so the same key works everywhere).
  // Both also count as "press" so the level-4 button responds to either.
  KeyX: ['peel', 'press'],
  KeyR: ['peel', 'press'],
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
