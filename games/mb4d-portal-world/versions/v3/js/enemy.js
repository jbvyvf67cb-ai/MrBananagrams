import { CFG } from './config.js';
import { mat, C, facetedSphere } from './geometry.js';

// Enemy fruit. fire orange = chaser; blazing grapfruit = ranged shooter.
export function createEnemy(scene, type, pos) {
  const spec = CFG.enemies[type];
  const root = new BABYLON.TransformNode('en', scene);
  root.position.set(pos[0], 0.9, pos[2]);

  const isOrange = type === 'fire orange';
  const bodyColor = isOrange ? C(0.98, 0.55, 0.12) : C(0.95, 0.40, 0.45);
  const glow = isOrange ? C(0.6, 0.25, 0.0) : C(0.5, 0.1, 0.15);
  const radius = isOrange ? 0.7 : 0.92;

  const body = facetedSphere(scene, 'enBody', radius, 2);
  body.parent = root; body.material = mat(scene, 'enMat' + Math.random(), bodyColor, { emissive: glow });

  // angry eyes
  const eyeMat = mat(scene, 'enEye', C(0.05, 0.03, 0.02));
  for (const sx of [-0.25, 0.25]) {
    const e = facetedSphere(scene, 'ee', 0.12, 1);
    e.parent = root; e.position.set(sx, 0.15, radius * 0.85); e.material = eyeMat;
  }

  return {
    type, root, body, radius,
    hp: spec.hp, maxHp: spec.hp, alive: true,
    shootTimer: spec.shootInterval || 0,
    bob: Math.random() * Math.PI * 2,
    center: () => root.position,
    scoreValue: spec.scoreValue,
  };
}

export function updateEnemy(e, dt, player, cb) {
  if (!e.alive) return;
  const spec = CFG.enemies[e.type];
  const pp = player.pos();
  const toP = new BABYLON.Vector3(pp.x - e.root.position.x, 0, pp.z - e.root.position.z);
  const dist = toP.length();
  if (dist > 1e-3) toP.scaleInPlace(1 / dist);

  e.bob += dt * 3;
  e.root.position.y = 0.9 + Math.sin(e.bob) * 0.15;
  e.root.rotation.y += dt * 1.5;

  if (spec.behavior === 'chase') {
    e.root.position.x += toP.x * spec.speed * dt;
    e.root.position.z += toP.z * spec.speed * dt;
    if (dist < e.radius + CFG.player.radius + 0.1 && pp.y < 1.5) cb.hitPlayer(spec.contactDmg);
  } else { // shooter — keep standoff, lob fireballs
    if (dist > spec.standoff + 1) {
      e.root.position.x += toP.x * spec.speed * dt;
      e.root.position.z += toP.z * spec.speed * dt;
    } else if (dist < spec.standoff - 1) {
      e.root.position.x -= toP.x * spec.speed * dt;
      e.root.position.z -= toP.z * spec.speed * dt;
    }
    e.shootTimer -= dt;
    if (e.shootTimer <= 0) {
      e.shootTimer = spec.shootInterval;
      const origin = e.root.position.clone();
      const dir = new BABYLON.Vector3(toP.x, 0.05, toP.z).normalize();
      cb.spawnFireball(origin, dir.scale(spec.fireballSpeed), spec.fireballDmg);
    }
    if (dist < e.radius + CFG.player.radius && pp.y < 1.5) cb.hitPlayer(spec.contactDmg);
  }
}

// returns scoreValue if this hit killed it, else 0
export function damageEnemy(e, amt) {
  if (!e.alive) return 0;
  e.hp -= amt;
  e.body.material.emissiveColor = C(1, 1, 1);
  setTimeout(() => { if (e.alive) e.body.material.emissiveColor = (e.type === 'fire orange') ? C(0.6, 0.25, 0) : C(0.5, 0.1, 0.15); }, 60);
  if (e.hp <= 0) {
    e.alive = false;
    const root = e.root;
    let t = 0;
    const obs = e.root.getScene().onBeforeRenderObservable.add(() => {
      t += 0.05; root.scaling.setAll(Math.max(0, 1 - t)); root.rotation.y += 0.4;
      if (t >= 1) { root.getScene().onBeforeRenderObservable.remove(obs); root.dispose(); }
    });
    return e.scoreValue;
  }
  return 0;
}

// Enemy/boss -> player fireballs.
export class Fireballs {
  constructor(scene) {
    this.scene = scene; this.list = [];
    this.mat = mat(scene, 'fbMat', C(1.0, 0.45, 0.1), { emissive: C(0.8, 0.3, 0.0) });
  }
  spawn(origin, vel, dmg) {
    let fb = this.list.find((x) => !x.active);
    if (!fb) {
      const m = facetedSphere(this.scene, 'fb' + this.list.length, 0.3, 1);
      m.material = this.mat; m.isPickable = false;
      fb = { mesh: m, vel: new BABYLON.Vector3(), dmg: 0, life: 0, active: false };
      this.list.push(fb);
    }
    fb.mesh.position.copyFrom(origin); fb.vel.copyFrom(vel); fb.dmg = dmg;
    fb.life = 3; fb.active = true; fb.mesh.setEnabled(true);
  }
  update(dt, player, onHitPlayer) {
    const pc = player.pos();
    for (const fb of this.list) {
      if (!fb.active) continue;
      fb.mesh.position.addInPlace(fb.vel.scale(dt));
      fb.life -= dt;
      const hit = BABYLON.Vector3.Distance(fb.mesh.position, new BABYLON.Vector3(pc.x, pc.y + 0.9, pc.z)) < 0.9;
      if (hit) onHitPlayer(fb.dmg);
      if (hit || fb.life <= 0 || fb.mesh.position.y < -1 || fb.mesh.position.length() > 60) {
        fb.active = false; fb.mesh.setEnabled(false);
      }
    }
  }
}
