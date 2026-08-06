// Keyboard + touch input with edge detection (needed for multi-tap jumps).
// held  = currently-down logical actions
// edges = actions that went down THIS frame (cleared by endFrame()).

const held = new Set();
const edges = new Set();

// Map physical keys to logical actions.
const KEYMAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Space: 'jump',
  KeyX: 'shoot', KeyJ: 'shoot',
  KeyE: 'special', KeyK: 'special',
  ShiftLeft: 'crouch', ShiftRight: 'crouch', KeyC: 'crouch',
};

export function initInput() {
  window.addEventListener('keydown', (e) => {
    const a = KEYMAP[e.code];
    if (!a) return;
    if (e.code === 'Space') e.preventDefault();
    if (!held.has(a)) edges.add(a);   // edge only on the initial press
    held.add(a);
  });
  window.addEventListener('keyup', (e) => {
    const a = KEYMAP[e.code];
    if (a) held.delete(a);
  });
  window.addEventListener('blur', () => { held.clear(); edges.clear(); });
}

// Touch buttons (wired by hud.js) call these.
export function touchDown(action) { if (!held.has(action)) edges.add(action); held.add(action); }
export function touchUp(action) { held.delete(action); }
// For tap-style buttons (jump/shoot) we want an edge without sticky hold.
export function touchTap(action) { edges.add(action); held.delete(action); }

export const input = {
  down: (a) => held.has(a),
  pressed: (a) => edges.has(a),
  endFrame: () => edges.clear(),
};
