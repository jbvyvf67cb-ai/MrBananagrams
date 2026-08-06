// v2 controls (per the v4 spreadsheet's new control scheme):
//   W       = turn MB left          ←  camera follows MB's facing
//   D       = turn MB right
//   ↑       = jump
//   ↓       = move backward
//   ←       = strafe left
//   →       = strafe right
//   Space   = move forward          (added: no forward key was specified;
//                                    flagged in docs/spec-gaps-v2.md)
//   X       = throw banana peel     (carried over from v1)
//   E       = 5-peel special blast  (carried over from v1)

const held = new Set();
const edges = new Set();

const KEYMAP = {
  KeyW: 'turnL',
  KeyD: 'turnR',
  ArrowUp: 'jump',
  ArrowDown: 'back',
  ArrowLeft: 'strafeL',
  ArrowRight: 'strafeR',
  Space: 'fwd',
  KeyX: 'shoot', KeyJ: 'shoot',
  KeyE: 'special', KeyK: 'special',
};

export function initInput() {
  window.addEventListener('keydown', (e) => {
    const a = KEYMAP[e.code];
    if (!a) return;
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
    if (!held.has(a)) edges.add(a);
    held.add(a);
  });
  window.addEventListener('keyup', (e) => {
    const a = KEYMAP[e.code];
    if (a) held.delete(a);
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
