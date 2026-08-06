// Melee attack module (v4) — replaces the peel-throw system from v1-v3.
//
// On press, MB's chosen move (crunch / slam / hip) creates a brief "hitbox" in
// front of him. Any enemy or boss within range and inside a forward-facing
// arc takes the move's damage and is pushed back. A short cooldown gates
// repeat presses.
//
// Damage values come from CFG.melee, which mirrors the Data5 spec verbatim:
//   crunch 30, slam 32, hip 26.

import { CFG } from './config.js';
import { mat, C, facetedSphere } from './geometry.js';

const COOLDOWN = { crunch: CFG.melee.crunch.cooldown, slam: CFG.melee.slam.cooldown, hip: CFG.melee.hip.cooldown };
const COLOR = {
  crunch: C(1.0, 0.85, 0.30),
  slam:   C(1.0, 0.45, 0.20),
  hip:    C(0.75, 0.95, 1.0),
};
const LABEL = { crunch: 'CRUNCH', slam: 'SLAM', hip: 'HIP' };

export function createMeleeKit(scene) {
  return { scene, cd: 0, flashes: [] };
}

// Test if a single target lies inside MB's forward arc/range. center: Vector3.
function inArc(player, center, range, arc) {
  const dx = center.x - player.root.position.x;
  const dz = center.z - player.root.position.z;
  const dist = Math.hypot(dx, dz);
  if (dist > range) return false;
  const angTo = Math.atan2(dx, dz);
  let diff = angTo - player.yaw;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) <= arc * 0.5;
}

// Called from main.js when MB is on the ground in the platformer phase.
// Returns the move name played, or null.
export function tryMelee(kit, player, input, targets, hud) {
  kit.cd = Math.max(0, kit.cd - 1/60);  // crude; refined by passing dt
  if (kit.cd > 0) return null;

  let move = null;
  if (input.pressed('crunch')) move = 'crunch';
  else if (input.pressed('slam'))   move = 'slam';
  else if (input.pressed('hip'))    move = 'hip';
  if (!move) return null;

  const spec = CFG.melee[move];
  kit.cd = COOLDOWN[move];

  let hitAny = false;
  for (const t of targets) {
    if (!t.alive) continue;
    const c = t.center();
    if (inArc(player, c, spec.range + t.radius * 0.6, spec.arc)) {
      t.onHit(spec.dmg, move);
      hitAny = true;
    }
  }
  spawnFlash(kit, player, move, spec);
  if (hitAny) hud.banner(LABEL[move] + ' ! −' + spec.dmg, 600);
  return move;
}

// Replace the crude per-frame cd tick with a dt-aware tick used each frame.
export function tickCooldown(kit, dt) {
  kit.cd = Math.max(0, kit.cd - dt);
}

function spawnFlash(kit, player, move, spec) {
  const fx = facetedSphere(kit.scene, 'meleeFx', 0.6, 1);
  fx.material = mat(kit.scene, 'meleeFxMat', COLOR[move], { emissive: COLOR[move].scale(0.6), glossy: true });
  fx.material.alpha = 0.7;
  const fwd = new BABYLON.Vector3(Math.sin(player.yaw), 0, Math.cos(player.yaw));
  fx.position.set(
    player.root.position.x + fwd.x * (spec.range * 0.6),
    player.root.position.y + 1.0,
    player.root.position.z + fwd.z * (spec.range * 0.6)
  );
  let t = 0;
  const obs = kit.scene.onBeforeRenderObservable.add(() => {
    t += 1/60;
    const k = t / 0.18;
    fx.scaling.setAll(1 + k * 1.6);
    fx.material.alpha = Math.max(0, 0.7 * (1 - k));
    if (k >= 1) { kit.scene.onBeforeRenderObservable.remove(obs); fx.dispose(); }
  });
}
