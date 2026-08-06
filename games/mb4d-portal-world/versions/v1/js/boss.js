import { CFG } from './config.js';
import { mat, C, facetedSphere, decoPoly } from './geometry.js';

// portalprotector — "a viking like monster", 2 phases, "easiest boss in the
// game, just attack head on, jump or peel". Telegraphed charges you dodge or
// jump; peel it or stomp its head. Phase 2 (<=50% hp) adds fireball volleys.
export function createBoss(scene, data, pos) {
  const root = new BABYLON.TransformNode('boss', scene);
  root.position.set(pos[0], 0, pos[2]);
  const R = CFG.boss.radius;

  const skin = mat(scene, 'bossSkin', C(0.45, 0.52, 0.62), { glossy: true });
  const body = facetedSphere(scene, 'bossBody', R, 2);
  body.scaling.y = 1.15; body.position.y = R; body.parent = root; body.material = skin;

  // Viking helmet + horns
  const helm = decoPoly(scene, 'bossHelm', R * 0.8, 2);
  helm.position.y = R * 2.05; helm.parent = root;
  helm.material = mat(scene, 'bossHelm', C(0.55, 0.45, 0.25), { glossy: true });
  for (const sx of [-1, 1]) {
    const horn = BABYLON.MeshBuilder.CreateCylinder('horn', { diameterTop: 0, diameterBottom: 0.5, height: 1.4, tessellation: 12 }, scene);
    horn.parent = root; horn.position.set(sx * R * 0.7, R * 2.2, 0); horn.rotation.z = sx * 0.5;
    horn.material = mat(scene, 'hornMat', C(0.9, 0.88, 0.8));
  }
  const eyeMat = mat(scene, 'bossEye', C(1, 0.85, 0.2), { emissive: C(0.9, 0.6, 0.0) });
  for (const sx of [-0.5, 0.5]) {
    const e = facetedSphere(scene, 'be', 0.22, 1);
    e.parent = root; e.position.set(sx, R * 1.35, R * 0.85); e.material = eyeMat;
  }

  return {
    root, body, skin, radius: R,
    hp: CFG.boss.hp, maxHp: CFG.boss.hp, alive: true,
    phase: 1, state: 'idle', timer: 1.2, lock: new BABYLON.Vector3(),
    headY: R * 2.1,
    center: () => new BABYLON.Vector3(root.position.x, R, root.position.z),
  };
}

export function updateBoss(b, dt, player, cb) {
  if (!b.alive) return;
  const B = CFG.boss;
  const pp = player.pos();
  const to = new BABYLON.Vector3(pp.x - b.root.position.x, 0, pp.z - b.root.position.z);
  const dist = to.length();
  if (dist > 1e-3) to.scaleInPlace(1 / dist);

  // face the player
  b.root.rotation.y = Math.atan2(to.x, to.z);
  b.timer -= dt;

  if (b.state === 'idle') {
    b.root.position.x += to.x * 1.5 * dt;   // slow drift toward player
    b.root.position.z += to.z * 1.5 * dt;
    if (b.phase === 2 && Math.random() < dt / 2.5) volley(b, to, cb);
    if (b.timer <= 0) { b.state = 'telegraph'; b.timer = B.chargeTelegraph; b.lock.copyFrom(pp); }
  } else if (b.state === 'telegraph') {
    const f = (Math.floor(performance.now() / 60) % 2 === 0);
    b.skin.emissiveColor = f ? C(0.6, 0.1, 0.1) : C(0, 0, 0);
    if (b.timer <= 0) {
      b.state = 'charge';
      b.timer = b.phase === 2 ? 0.7 : 0.9;
      const d = b.lock.subtract(b.root.position); d.y = 0;
      b.chargeDir = d.lengthSquared() > 1e-3 ? d.normalize() : new BABYLON.Vector3(0, 0, 1);
      b.skin.emissiveColor = C(0, 0, 0);
    }
  } else if (b.state === 'charge') {
    const sp = B.chargeSpeed * (b.phase === 2 ? 1.3 : 1);
    b.root.position.x += b.chargeDir.x * sp * dt;
    b.root.position.z += b.chargeDir.z * sp * dt;
    if (dist < b.radius + CFG.player.radius && pp.y < b.headY - 0.5) cb.hitPlayer(B.contactDmg);
    if (b.timer <= 0) { b.state = 'recover'; b.timer = B.chargeRecover; }
  } else if (b.state === 'recover') {
    if (b.timer <= 0) { b.state = 'idle'; b.timer = b.phase === 2 ? 1.4 : 2.0; }
  }

  // keep inside arena
  const maxR = 20;
  const fl = new BABYLON.Vector2(b.root.position.x, b.root.position.z);
  if (fl.length() > maxR) { fl.normalize().scaleInPlace(maxR); b.root.position.x = fl.x; b.root.position.z = fl.y; }
}

function volley(b, to, cb) {
  for (let i = -1; i <= 1; i++) {
    const a = Math.atan2(to.x, to.z) + i * 0.3;
    const dir = new BABYLON.Vector3(Math.sin(a), 0.05, Math.cos(a)).normalize();
    cb.spawnFireball(b.center().add(new BABYLON.Vector3(0, 0.5, 0)), dir.scale(11), CFG.boss.fireballDmg);
  }
}

// amt applied; returns { dead, enteredPhase2 }
export function damageBoss(b, amt) {
  if (!b.alive) return { dead: false, enteredPhase2: false };
  const wasP1 = b.phase === 1;
  b.hp = Math.max(0, b.hp - amt);
  b.body.material.emissiveColor = C(0.8, 0.8, 0.8);
  setTimeout(() => { if (b.alive) b.body.material.emissiveColor = C(0, 0, 0); }, 60);
  let enteredPhase2 = false;
  if (wasP1 && b.hp <= b.maxHp * CFG.boss.phase2At) { b.phase = 2; enteredPhase2 = true; }
  if (b.hp <= 0) {
    b.alive = false;
    let t = 0;
    const obs = b.root.getScene().onBeforeRenderObservable.add(() => {
      t += 0.02; b.root.scaling.setAll(Math.max(0, 1 - t)); b.root.rotation.y += 0.3;
      if (t >= 1) { b.root.getScene().onBeforeRenderObservable.remove(obs); b.root.dispose(); }
    });
    return { dead: true, enteredPhase2 };
  }
  return { dead: false, enteredPhase2 };
}
