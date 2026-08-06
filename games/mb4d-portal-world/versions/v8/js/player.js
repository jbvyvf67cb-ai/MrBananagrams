import { CFG } from './config.js';
import { mat, C, facetedSphere } from './geometry.js';

// v7 player (the 3D world). Controls per Data6 Gameplay B2:
//   ← / →   turn MB
//   ↑ / ↓   forward / back
//   Space   jump (Space + Space = double jump)
//   Z       crouch
//   X       throw a peel
//   double-jump then X    →  5-peel special ("shots 5 peels everywhere")
//
// Camera is driven separately by WASD/Q (see camera.js).
export function createPlayer(scene) {
  const root = new BABYLON.TransformNode('mb', scene);
  const yellow = mat(scene, 'mbMat', C(0.97, 0.84, 0.18), { glossy: true });

  const body = facetedSphere(scene, 'mbBody', 0.62, 2);
  body.scaling.y = 1.25; body.position.y = 0.78; body.parent = root; body.material = yellow;
  const head = facetedSphere(scene, 'mbHead', 0.46, 2);
  head.position.y = 1.6; head.parent = root; head.material = yellow;

  const eyeMat = mat(scene, 'mbEye', C(0.1, 0.08, 0.06));
  for (const sx of [-0.18, 0.18]) {
    const eye = facetedSphere(scene, 'mbEye' + sx, 0.09, 1);
    eye.position.set(sx, 1.66, 0.4); eye.parent = root; eye.material = eyeMat;
  }
  const nose = BABYLON.MeshBuilder.CreateCylinder('mbNose', { diameterTop: 0, diameterBottom: 0.22, height: 0.3, tessellation: 12 }, scene);
  nose.rotation.x = Math.PI / 2; nose.position.set(0, 1.5, 0.5); nose.parent = root;
  nose.material = mat(scene, 'mbNoseMat', C(0.9, 0.7, 0.1));

  root.position.set(0, 0, 0);

  return {
    root, body,
    vel: new BABYLON.Vector3(0, 0, 0),
    yaw: Math.PI,
    hp: CFG.player.maxHp, maxHp: CFG.player.maxHp,
    jumpsUsed: 0, grounded: true, crouching: false,
    invuln: 0, peelCd: 0, specialCd: 0,
    lastJumpAt: -10,   // time the last jump was pressed
    doubleJumped: false,
    alive: true,
    pos: () => root.position,
  };
}

function facingVec(yaw) { return new BABYLON.Vector3(Math.sin(yaw), 0, Math.cos(yaw)); }

function toward(cur, tgt, step) {
  const d = tgt - cur;
  if (Math.abs(d) <= step) return tgt;
  return cur + Math.sign(d) * step;
}

export function updatePlayer(p, dt, world, input, cb, nowSec) {
  if (!p.alive) return;
  const P = CFG.player;

  // 1) Yaw — ← / → rotate MB.
  if (input.down('turnL')) p.yaw -= P.turnSpeed * dt;
  if (input.down('turnR')) p.yaw += P.turnSpeed * dt;

  // 2) Forward/back along MB's facing. No strafe (per the Data6 control list).
  const fwd = facingVec(p.yaw);
  const wish = new BABYLON.Vector3(0, 0, 0);
  if (input.down('fwd'))  wish.addInPlace(fwd);
  if (input.down('back')) wish.subtractInPlace(fwd);

  p.crouching = input.down('crouch') && p.grounded;
  const speed = P.moveSpeed * (p.crouching ? 0.45 : 1);
  let target = new BABYLON.Vector3(0, 0, 0);
  if (wish.lengthSquared() > 0) {
    wish.normalize();
    target = wish.scale(speed);
  }
  p.vel.x = toward(p.vel.x, target.x, P.accel * dt);
  p.vel.z = toward(p.vel.z, target.z, P.accel * dt);

  // 3) Jump + double jump (Space, then Space again mid-air).
  if (input.pressed('jump') && !p.crouching) {
    if (p.grounded) {
      p.vel.y = P.jumpRise[0]; p.jumpsUsed = 1; p.grounded = false;
      p.doubleJumped = false;
    } else if (p.jumpsUsed < P.maxJumps) {
      p.vel.y = P.jumpRise[p.jumpsUsed]; p.jumpsUsed++;
      p.doubleJumped = true;
      p.lastJumpAt = nowSec;
    }
  }

  // 3b) Ladder climb (v8). If MB is within the ladder's climb zone, holding
  // ↑ climbs up, ↓ climbs down, and gravity is suppressed. Stepping out
  // sideways drops MB back into normal physics with current upward momentum.
  p.onLadder = false;
  if (world.ladders) {
    const cur = p.root.position;
    for (const l of world.ladders) {
      const dx = cur.x - l.position.x;
      const dz = cur.z - l.position.z;
      if (Math.hypot(dx, dz) < l.radius && cur.y < l.height + 0.5) {
        p.onLadder = true;
        if (input.down('fwd')) p.vel.y = 4.5;
        else if (input.down('back')) p.vel.y = -3.5;
        else p.vel.y = 0;
        break;
      }
    }
  }
  if (!p.onLadder) p.vel.y -= P.gravity * dt;

  // 4) Integrate.
  const pos = p.root.position;
  pos.addInPlace(p.vel.scale(dt));

  // 5) Hazards (spikes). World may modify hp directly.
  if (world.hazards) {
    for (const h of world.hazards) {
      if (!h.alive) continue;
      const dx = pos.x - h.position.x, dz = pos.z - h.position.z;
      if (Math.hypot(dx, dz) < h.radius + P.radius && pos.y < 0.7 && p.invuln <= 0) {
        cb.hitSpike(h);
      }
    }
  }

  // 6) Ground clamp + arena confinement.
  if (pos.y <= world.groundY) {
    pos.y = world.groundY; p.vel.y = 0;
    if (!p.grounded) { p.grounded = true; p.jumpsUsed = 0; p.doubleJumped = false; }
  }
  const maxR = world.R - P.radius - 0.4;
  const flat = new BABYLON.Vector2(pos.x, pos.z);
  if (flat.length() > maxR) { flat.normalize().scaleInPlace(maxR); pos.x = flat.x; pos.z = flat.y; }

  // 7) Visuals: yaw + crouch squish.
  p.root.rotation.y = p.yaw;
  const sy = p.crouching ? P.crouchHeightMult : 1;
  p.root.scaling.y = sy;

  // 8) Peel + 5-peel special.
  p.peelCd = Math.max(0, p.peelCd - dt);
  p.specialCd = Math.max(0, p.specialCd - dt);
  if (input.pressed('peel')) {
    const muzzle = pos.add(fwd.scale(0.7)); muzzle.y += 1.0;
    // Double-jump + X → 5-peel special.
    if (p.doubleJumped && !p.grounded && p.specialCd === 0) {
      for (let i = 0; i < CFG.peel.specialCount; i++) {
        const a = p.yaw + (i / CFG.peel.specialCount) * Math.PI * 2;
        cb.shoot(muzzle.clone(), facingVec(a));
      }
      p.specialCd = CFG.peel.specialCooldown;
      p.doubleJumped = false;     // consumed
    } else if (p.peelCd === 0) {
      cb.shoot(muzzle, fwd);
      p.peelCd = CFG.peel.cooldown;
    }
  }

  // 9) i-frame flash.
  if (p.invuln > 0) {
    p.invuln = Math.max(0, p.invuln - dt);
    p.root.setEnabled(Math.floor(performance.now() / 80) % 2 === 0);
  } else {
    p.root.setEnabled(true);
  }
}

export function damagePlayer(p, amt) {
  if (p.invuln > 0 || !p.alive) return false;
  p.hp = Math.max(0, p.hp - amt);
  p.invuln = CFG.player.invulnTime;
  if (p.hp === 0) p.alive = false;
  return true;
}
