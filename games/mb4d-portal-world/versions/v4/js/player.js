import { CFG } from './config.js';
import { mat, C, facetedSphere } from './geometry.js';

// v2 movement scheme (per the updated spreadsheet's Gameplay row):
//   W / D     rotate MB left / right (camera follows MB's facing)
//   Space     move forward in MB's facing direction
//   ↓         move backward
//   ← / →     strafe perpendicular to facing
//   ↑         jump (single / double / triple by re-press)
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
    jumpsUsed: 0, grounded: true,
    invuln: 0, alive: true,
    pos: () => root.position,
  };
}

function facingVec(yaw) { return new BABYLON.Vector3(Math.sin(yaw), 0, Math.cos(yaw)); }

// Move `cur` toward `tgt` by at most `step` (avoids depending on BABYLON.Scalar.MoveTowards).
function toward(cur, tgt, step) {
  const d = tgt - cur;
  if (Math.abs(d) <= step) return tgt;
  return cur + Math.sign(d) * step;
}

export function updatePlayer(p, dt, cam, world, input, cb) {
  if (!p.alive) return;
  const P = CFG.player;

  // 1) Yaw — W/D rotate MB. Camera follows yaw (see camera.js).
  if (input.down('turnL')) p.yaw -= P.turnSpeed * dt;
  if (input.down('turnR')) p.yaw += P.turnSpeed * dt;

  // 2) Facing-relative movement basis.
  const fwd = facingVec(p.yaw);
  const right = BABYLON.Vector3.Cross(fwd, BABYLON.Axis.Y).normalize();

  const wish = new BABYLON.Vector3(0, 0, 0);
  if (input.down('fwd'))      wish.addInPlace(fwd);
  if (input.down('back'))     wish.subtractInPlace(fwd);
  if (input.down('strafeR'))  wish.addInPlace(right);
  if (input.down('strafeL'))  wish.subtractInPlace(right);

  const speed = P.moveSpeed;
  let target = new BABYLON.Vector3(0, 0, 0);
  if (wish.lengthSquared() > 0) {
    wish.normalize();
    target = wish.scale(speed);
  }
  // Accelerate horizontal velocity toward target.
  p.vel.x = toward(p.vel.x, target.x, P.accel * dt);
  p.vel.z = toward(p.vel.z, target.z, P.accel * dt);

  // Jump (tap once = jump, tap again mid-air = double jump per Data5 spec).
  if (input.pressed('jump')) {
    if (p.grounded) { p.vel.y = P.jumpRise[0]; p.jumpsUsed = 1; p.grounded = false; }
    else if (p.jumpsUsed < P.maxJumps) { p.vel.y = P.jumpRise[p.jumpsUsed]; p.jumpsUsed++; }
  }
  p.vel.y -= P.gravity * dt;

  // Integrate.
  const pos = p.root.position;
  pos.addInPlace(p.vel.scale(dt));

  // Ground clamp.
  if (pos.y <= world.groundY) {
    pos.y = world.groundY; p.vel.y = 0;
    if (!p.grounded) { p.grounded = true; p.jumpsUsed = 0; }
  }

  // Confine to arena circle.
  const maxR = world.R - P.radius - 0.4;
  const flat = new BABYLON.Vector2(pos.x, pos.z);
  if (flat.length() > maxR) { flat.normalize().scaleInPlace(maxR); pos.x = flat.x; pos.z = flat.y; }

  // Visuals: yaw only.
  p.root.rotation.y = p.yaw;

  // I-frames flash.
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
