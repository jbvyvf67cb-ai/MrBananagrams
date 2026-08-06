// v4 controls — per Data5 spreadsheet's rewritten Level 1 directive.
//
// PLATFORMER phase (waves, boss):
//   W       turn MB left            (camera follows MB's facing)
//   D       turn MB right
//   ↑       forward
//   ↓       back
//   ← / →   strafe
//   Space   jump (tap twice = double jump). Landing on an enemy = stomp.
//   Z       crunch  (melee, 30 dmg)
//   X       slam    (melee, 32 dmg)
//   C       hip     (melee, 26 dmg)
//
// HIPBALL phase (Level 1 opener):
//   A / D   step back / forward on the court
//   Space   jump
//   Z       crunch  (horizontal strike at the ball)
//   X       slam    (downward drive)
//   C       hip     (upward lob — the only shot that reaches the hoop)
//
// Peel-throw and 5-peel-blast from v1-v3 are intentionally removed
// ("you cant shot peeel in mb4 because its a ball game").

const held = new Set();
const edges = new Set();

const KEYMAP = {
  KeyW: ['turnL'],
  ArrowUp: ['fwd'],
  ArrowDown: ['back'],
  ArrowLeft: ['strafeL'],
  ArrowRight: ['strafeR'],

  // Shared (drive different actions per phase)
  KeyD: ['turnR', 'hbRight'],
  KeyA: ['hbLeft'],
  Space: ['jump', 'hbJump'],

  // Melee moves — same keys for Hipball strikes and platformer melee.
  KeyZ: ['crunch', 'hbCrunch'],
  KeyX: ['slam',   'hbSlam'],
  KeyC: ['hip',    'hbHip'],
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
