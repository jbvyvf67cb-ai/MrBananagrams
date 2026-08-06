// v3 controls — Q1 remap + Q2 hybrid Hipball phase.
//
// PLATFORMER phase (boss / world):
//   W       turn MB left            (camera follows MB's facing)
//   D       turn MB right
//   ↑       move FORWARD            (remap from v2: ↑ was jump)
//   ↓       move backward
//   ← / →   strafe
//   Space   jump (multi-tap = double / triple)   (remap from v2: Space was forward)
//   X       throw banana peel
//   E       5-peel special blast
//
// HIPBALL phase (Level 1 opener — exactly like MB4):
//   A / D   step back / forward on the court
//   Space   jump
//   Z       hip strike      (horizontal smash)
//   X       knee strike     (downward drive)
//   C       elbow strike    (upward lob — your only shot at the hoop)
//
// Some keys serve different actions in each phase. main.js queries only the
// action set relevant to the current phase.

const held = new Set();
const edges = new Set();

const KEYMAP = {
  KeyW: ['turnL'],
  ArrowUp: ['fwd'],
  ArrowDown: ['back'],
  ArrowLeft: ['strafeL'],
  ArrowRight: ['strafeR'],
  KeyE: ['special'],
  KeyJ: ['shoot'],
  KeyK: ['special'],

  // Shared keys (drive different actions per phase)
  KeyD: ['turnR', 'hbRight'],
  KeyA: ['hbLeft'],
  Space: ['jump', 'hbJump'],
  KeyX: ['shoot', 'hbKnee'],

  // Hipball-only
  KeyZ: ['hbHip'],
  KeyC: ['hbElbow'],
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

export function touchDown(action) { if (!held.has(action)) edges.add(action); held.add(action); }
export function touchUp(action) { held.delete(action); }
export function touchTap(action) { edges.add(action); held.delete(action); }

export const input = {
  down: (a) => held.has(a),
  pressed: (a) => edges.has(a),
  endFrame: () => edges.clear(),
};
