import { CFG } from './config.js';
import { mat, C, facetedSphere, decoPoly, manySidedCylinder } from './geometry.js';

// Bosses for the 3D world (Levels 2 and 3). Each builds its own visual rig and
// runs its own AI in updateBoss(). Damage is uniform: damageBoss(b, amt).
//
//   discombobcloud  — Level 2, 1200 hp, 3 phases. A swirling 3-layer cloud
//                     with a glowing core. "atack head on jump or peel".
//                     Drifts toward MB and lobs fireballs at increasing
//                     volume per phase; phase 3 vents a ring of fireballs.
//
//   babyblue        — Level 3, 2000 hp, 3 phases. "sneek atack with peel
//                     is most efective". Teleports every few seconds, often
//                     landing BEHIND MB, then dashes; phase 2 spawns two
//                     mini babies on teleport that linger as decoys.
export function createBoss(scene, kind, pos) {
  const def = CFG.bosses[kind];
  const root = new BABYLON.TransformNode('boss_' + kind, scene);
  root.position.set(pos[0], 0, pos[2]);
  const R = def.radius;

  if (kind === 'discombobcloud')   return buildDiscombobCloud(scene, root, def, R);
  if (kind === 'babyblue')         return buildBabyBlue(scene, root, def, R);
  if (kind === 'particlecolider')  return buildParticleColider(scene, root, def, R);
  if (kind === 'mmb')              return buildMmb(scene, root, def, R);
  return buildPortalprotector(scene, root, def, R);
}

// ---------------- Discombob Cloud (L2) ----------------
function buildDiscombobCloud(scene, root, def, R) {
  // Three nested cloud layers (each a faceted sphere @ subdivision 2 = 80 tris)
  // plus a hot core. The layers rotate independently for the "confusing" feel.
  const cloudMatA = mat(scene, 'cloudA', C(0.62, 0.55, 0.80), { emissive: C(0.18, 0.12, 0.30) });
  cloudMatA.alpha = 0.85;
  const cloudMatB = mat(scene, 'cloudB', C(0.78, 0.65, 0.95), { emissive: C(0.20, 0.16, 0.32) });
  cloudMatB.alpha = 0.7;
  const cloudMatC = mat(scene, 'cloudC', C(0.40, 0.55, 0.92), { emissive: C(0.10, 0.20, 0.35) });
  cloudMatC.alpha = 0.6;

  const layerA = facetedSphere(scene, 'cloudLayerA', R * 1.4, 2);
  layerA.parent = root; layerA.position.y = R * 1.5; layerA.material = cloudMatA;
  const layerB = facetedSphere(scene, 'cloudLayerB', R * 1.1, 2);
  layerB.parent = root; layerB.position.y = R * 1.6; layerB.material = cloudMatB;
  const layerC = facetedSphere(scene, 'cloudLayerC', R * 0.85, 2);
  layerC.parent = root; layerC.position.y = R * 1.7; layerC.material = cloudMatC;

  const core = facetedSphere(scene, 'cloudCore', R * 0.45, 2);
  core.parent = root; core.position.y = R * 1.5;
  core.material = mat(scene, 'cloudCoreMat', C(1.0, 0.85, 0.30), { emissive: C(0.95, 0.6, 0.10) });

  // Spinning charm orbs (decoPoly tiles) circling the cloud — confusing!
  const orbs = [];
  for (let i = 0; i < 5; i++) {
    const o = decoPoly(scene, 'cOrb' + i, 0.45, i);
    o.parent = root; o.material = mat(scene, 'cOrbMat' + i, C(1.0, 0.85, 0.30), { emissive: C(0.9, 0.6, 0.1) });
    o.isPickable = false;
    orbs.push({ mesh: o, phase: (i / 5) * Math.PI * 2 });
  }
  scene.onBeforeRenderObservable.add(() => {
    const t = performance.now() * 0.001;
    layerA.rotation.y += 0.005; layerB.rotation.y -= 0.008; layerC.rotation.y += 0.012;
    for (const o of orbs) {
      const a = t + o.phase;
      o.mesh.position.set(Math.cos(a) * R * 1.8, R * 1.5 + Math.sin(a * 0.7) * 0.5, Math.sin(a) * R * 1.8);
    }
  });

  return {
    kind: 'discombobcloud', root, body: layerA, core, layerA, layerB, layerC,
    radius: R, headY: R * 2.4,
    hp: def.hp, maxHp: def.hp, alive: true,
    phase: 1, state: 'idle', timer: 1.0,
    lock: new BABYLON.Vector3(),
    cycleVolley: 0,
    center: () => new BABYLON.Vector3(root.position.x, R * 1.5, root.position.z),
  };
}

// ---------------- Baby Blue (L3) ----------------
function buildBabyBlue(scene, root, def, R) {
  // A round baby-blue body with a tuft, oversized eyes, and a single tooth.
  const skin = mat(scene, 'bbSkin', C(0.55, 0.78, 0.95), { glossy: true });
  const body = facetedSphere(scene, 'bbBody', R, 2);
  body.scaling.y = 1.05; body.position.y = R; body.parent = root; body.material = skin;

  const tuft = facetedSphere(scene, 'bbTuft', 0.4, 1);
  tuft.parent = root; tuft.position.y = R * 2 + 0.1;
  tuft.material = mat(scene, 'bbTuftMat', C(0.70, 0.88, 1.0));

  const eyeMat = mat(scene, 'bbEye', C(1, 1, 1));
  const pupMat = mat(scene, 'bbPup', C(0.05, 0.1, 0.25));
  for (const sx of [-0.5, 0.5]) {
    const e = facetedSphere(scene, 'bbE', 0.32, 1);
    e.parent = root; e.position.set(sx, R * 1.25, R * 0.85); e.material = eyeMat;
    const p = facetedSphere(scene, 'bbP', 0.14, 1);
    p.parent = root; p.position.set(sx, R * 1.25, R * 0.95); p.material = pupMat;
  }
  const tooth = facetedSphere(scene, 'bbTooth', 0.13, 1);
  tooth.parent = root; tooth.position.set(0.18, R * 0.78, R * 0.85);
  tooth.scaling.y = 1.6; tooth.material = mat(scene, 'bbToothMat', C(1, 1, 1));

  return {
    kind: 'babyblue', root, body, skin,
    radius: R, headY: R * 2.0,
    hp: def.hp, maxHp: def.hp, alive: true,
    phase: 1, state: 'idle', timer: 2.0,
    teleportTimer: def.teleportEvery,
    lock: new BABYLON.Vector3(),
    minis: [],
    center: () => new BABYLON.Vector3(root.position.x, R, root.position.z),
  };
}

// ---------------- Portalprotector (kept; Level 1 only uses 2D version) ----------------
function buildPortalprotector(scene, root, def, R) {
  const skin = mat(scene, 'bossSkin', C(0.45, 0.52, 0.62), { glossy: true });
  const body = facetedSphere(scene, 'ppBody', R, 2);
  body.scaling.y = 1.15; body.position.y = R; body.parent = root; body.material = skin;
  return {
    kind: 'portalprotector', root, body, skin, radius: R, headY: R * 2.1,
    hp: def.hp, maxHp: def.hp, alive: true, phase: 1,
    state: 'idle', timer: 1.2, lock: new BABYLON.Vector3(),
    center: () => new BABYLON.Vector3(root.position.x, R, root.position.z),
  };
}

// ---------------- Particle Collider (L4) ----------------
// "a big mashine ... 5 phases give it your hardest shot". A central core
// hangs between two prong arms; the whole rig hovers, slowly rotates, and
// pulses brighter as it loses hp.
function buildParticleColider(scene, root, def, R) {
  root.position.y = R * 1.2;

  // Suffix material names with a random tag to avoid name collisions if the
  // boss is rebuilt (e.g. on level restart) before old materials are GC'd.
  const tag = '_' + (Math.random() * 1e6 | 0);
  const frameMat = mat(scene, 'pcFrame' + tag, C(0.22, 0.24, 0.32), { glossy: true });
  const accentMat = mat(scene, 'pcAccent' + tag, C(0.30, 0.85, 1.0), { emissive: C(0.20, 0.70, 0.95) });
  const coreMat = mat(scene, 'pcCoreMat' + tag, C(1.0, 0.85, 0.30), { emissive: C(1.0, 0.7, 0.2) });

  // Central faceted core — the "particle" being collided.
  const core = facetedSphere(scene, 'pcCore' + tag, R * 0.55, 2);
  core.position.y = 0; core.parent = root;
  core.material = coreMat;

  // Two prong arms (40-sided cylinders) cradling the core.
  for (const sx of [-1, 1]) {
    const arm = manySidedCylinder(scene, 'pcArm' + sx + tag, { diameter: 0.7, height: R * 2.4, tess: 40 });
    arm.parent = root;
    arm.rotation.z = Math.PI / 2 - sx * 0.4;
    arm.position.set(sx * R * 1.1, 0, 0);
    arm.material = frameMat; arm.isPickable = false;
    const cap = facetedSphere(scene, 'pcArmCap' + sx + tag, 0.7, 1);
    cap.parent = root; cap.position.set(sx * R * 1.4, 0, 0);
    cap.material = accentMat; cap.isPickable = false;
  }

  // Top crown — a ring of 6 plates (decoPoly).
  const crownRoot = new BABYLON.TransformNode('pcCrown' + tag, scene);
  crownRoot.parent = root; crownRoot.position.y = R * 1.2;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const blade = decoPoly(scene, 'pcBlade' + i + tag, 0.6, i);
    blade.parent = crownRoot;
    blade.position.set(Math.cos(a) * 1.2, 0, Math.sin(a) * 1.2);
    blade.material = accentMat;
  }

  // "Eye" plate front and center (the mad-face spot in the final phase).
  const eye = facetedSphere(scene, 'pcEye' + tag, 0.4, 1);
  eye.parent = root; eye.position.set(0, R * 0.3, R * 0.6);
  eye.material = mat(scene, 'pcEyeMat' + tag, C(0.1, 0.1, 0.15), { emissive: C(0.5, 0.05, 0.05) });

  // We capture this observer so we can remove it when the boss is disposed.
  // (See damageBoss's death animation — that disposes root.) Without removal
  // we'd keep poking a dead node every frame; harmless but wasteful.
  const bossAnim = scene.onBeforeRenderObservable.add(() => {
    if (!root || root.isDisposed && root.isDisposed()) {
      scene.onBeforeRenderObservable.remove(bossAnim);
      return;
    }
    crownRoot.rotation.y += 0.012;
    core.rotation.y += 0.015;
    core.rotation.x += 0.005;
    root.position.y = R * 1.2 + Math.sin(performance.now() * 0.001) * 0.25;
  });

  return {
    kind: 'particlecolider', root, body: core, core, eye, accentMat, coreMat,
    radius: R, headY: R * 1.8,
    hp: def.hp, maxHp: def.hp, alive: true, phase: 1,
    state: 'idle', timer: 1.8,
    bombTimer: 0,
    _anim: bossAnim,
    center: () => new BABYLON.Vector3(root.position.x, R * 1.2, root.position.z),
  };
}

// ---------------- MMB (L5) — Metal MB ----------------
// "an exact copy of mb but made of metal the same size same shape". We build
// the same banana-body rig as the player but with chrome materials. The
// boss has two combat phases (1 and 3) with completely different feels —
// phase 1 is a stand-and-shoot lasers fight, phase 3 is a giant form with a
// weak-circle on the chest, lightning, and crush slams. Phase 2 (the race)
// doesn't tick the boss — it's a chase sequence handled by mmbLevel.js.
function buildMmb(scene, root, def, R) {
  const chromeBody  = mat(scene, 'mmbBody',  C(0.62, 0.66, 0.74), { glossy: true, emissive: C(0.10, 0.12, 0.18) });
  const chromeSkin  = mat(scene, 'mmbSkin',  C(0.40, 0.44, 0.52), { glossy: true });
  const visorMat    = mat(scene, 'mmbVisor', C(0.80, 0.10, 0.20), { emissive: C(0.95, 0.10, 0.20) });

  // Banana body — slightly bigger than player's so it reads as the boss.
  const bodyR = 0.74;
  const body = facetedSphere(scene, 'mmbBodyMesh', bodyR, 2);
  body.scaling.y = 1.25; body.position.y = bodyR + 0.05; body.parent = root;
  body.material = chromeBody;

  const head = facetedSphere(scene, 'mmbHead', 0.54, 2);
  head.position.y = 1.78; head.parent = root; head.material = chromeBody;

  // Glowing red visor where MB's eyes would be.
  const visor = BABYLON.MeshBuilder.CreateBox('mmbVisor', { width: 0.7, height: 0.18, depth: 0.18 }, scene);
  visor.parent = root; visor.position.set(0, 1.82, 0.45);
  visor.material = visorMat;

  // Metallic "stem" — what was the banana stem on MB.
  const stem = manySidedCylinder(scene, 'mmbStem', { diameter: 0.22, height: 0.32, tess: 40 });
  stem.parent = root; stem.position.y = 2.18;
  stem.material = chromeSkin;

  // Chest WEAK CIRCLE — invisible by default. Phase 3 reveals + grows it as
  // the "big circle the part where you can hit" per the spec.
  const weakCircle = manySidedCylinder(scene, 'mmbWeak', { diameter: 0.6, height: 0.08, tess: 40 });
  weakCircle.parent = root;
  weakCircle.position.set(0, 1.0, bodyR + 0.06);
  weakCircle.rotation.x = Math.PI / 2;
  weakCircle.material = mat(scene, 'mmbWeakMat', C(1.0, 0.25, 0.30), { emissive: C(0.95, 0.20, 0.25) });
  weakCircle.setEnabled(false);

  return {
    kind: 'mmb', root, body, skin: chromeBody, visor, weakCircle,
    radius: R, headY: 1.9,
    hp: def.hp, maxHp: def.hp, alive: true,
    phase: 1, state: 'idle', timer: 1.5,
    laserSeq: 0,       // cycles through red/blue/silver/gold
    laserTimer: 0,
    crushTimer: 0,
    lightningTimer: 0,
    raceFinished: false,
    giantMode: false,
    center: () => new BABYLON.Vector3(root.position.x, 1.0, root.position.z),
  };
}

// =========================================================================
//  AI
// =========================================================================
export function updateBoss(b, dt, player, cb) {
  if (!b.alive) return;
  if (b.kind === 'discombobcloud')  return tickCloud(b, dt, player, cb);
  if (b.kind === 'babyblue')        return tickBabyBlue(b, dt, player, cb);
  if (b.kind === 'particlecolider') return tickParticleColider(b, dt, player, cb);
  if (b.kind === 'mmb')             return tickMmb(b, dt, player, cb);
  return tickPortalprotector(b, dt, player, cb);
}

// ---- Particle Collider AI ----
// Phases progress through HP thresholds, set by spaceLevel.js (not in
// damageBoss, since the threshold logic is unique). We just react to b.phase:
//   1: still on the ground, awaiting button (we never tick during this)
//   2: drifts toward MB, lobs fireballs every 2.5s
//   3: faster drift, double-fireball every 2.0s
//   4: even faster, triple-fireball
//   5 (Data8): "the longest phase with 0 enemys ... hundreds of fire balls
//      and tens of lasers ... drops bombs every were". The fireball cadence
//      drops to a torrent + a ring fan, plus lasers fire on a slower track,
//      plus bombs continue.
function tickParticleColider(b, dt, player, cb) {
  const def = CFG.bosses.particlecolider;
  const pp = player.pos();
  const to = new BABYLON.Vector3(pp.x - b.root.position.x, 0, pp.z - b.root.position.z);
  const dist = to.length();
  if (dist > 1e-3) to.scaleInPlace(1 / dist);
  b.root.rotation.y = Math.atan2(to.x, to.z);
  b.timer -= dt;
  b.bombTimer -= dt;

  const driftSpeed = 1.4 + 0.5 * (b.phase - 2);
  b.root.position.x += to.x * driftSpeed * dt;
  b.root.position.z += to.z * driftSpeed * dt;

  // Fireball cadence per phase. v10 (Data10 F5) dialed phase 5 back from
  // "hundreds of fire balls and tens of lasers" to just "some fire balls" —
  // and the threshold dropped from 1500hp to 200hp, so phase 5 is now a
  // brief desperate finale rather than a long torrent.
  const cadence = b.phase === 2 ? 2.5 : b.phase === 3 ? 2.0 : b.phase === 4 ? 1.6 : 1.2;
  if (b.timer <= 0) {
    let shots;
    if (b.phase === 5) shots = 2;            // "some" — modest fan, not a torrent
    else if (b.phase === 4) shots = 3;
    else if (b.phase >= 3) shots = 2;
    else shots = 1;
    for (let i = -(shots - 1); i <= shots - 1; i += 2) {
      const a = Math.atan2(to.x, to.z) + i * 0.18;
      const dir = new BABYLON.Vector3(Math.sin(a), 0.05, Math.cos(a)).normalize();
      cb.spawnFireball(b.center().add(new BABYLON.Vector3(0, 0.4, 0)), dir.scale(13), def.fireballDmg);
    }
    b.timer = cadence;
  }

  // Lasers removed in v10 (Data10 F5 dropped them from the spec).

  // Bombs (phase 5 only) — telegraph an aim circle on the ground then drop.
  if (b.phase >= 5 && b.bombTimer <= 0) {
    b.bombTimer = def.bombInterval;
    cb.dropBomb(pp.clone(), def.bombDmg);
  }

  // Contact damage when MB is right under the rig.
  if (dist < b.radius + CFG.player.radius && pp.y < b.headY + 0.5) cb.hitPlayer(def.contactDmg);
}

// ---- Cloud ----
function tickCloud(b, dt, player, cb) {
  const def = CFG.bosses.discombobcloud;
  const pp = player.pos();
  const to = new BABYLON.Vector3(pp.x - b.root.position.x, 0, pp.z - b.root.position.z);
  const dist = to.length();
  if (dist > 1e-3) to.scaleInPlace(1 / dist);
  b.root.rotation.y = Math.atan2(to.x, to.z);
  b.timer -= dt;

  // Drift toward player (slower in higher phases since it gets more aggressive ranged).
  const driftSpeed = b.phase === 1 ? 2.2 : (b.phase === 2 ? 1.5 : 0.8);
  b.root.position.x += to.x * driftSpeed * dt;
  b.root.position.z += to.z * driftSpeed * dt;

  // Volley behavior
  if (b.timer <= 0) {
    const vol = b.phase;   // 1 fireball, then 2, then a ring of 6
    if (b.phase < 3) {
      for (let i = -vol + 1; i <= vol - 1; i += 2) {
        const a = Math.atan2(to.x, to.z) + i * 0.18;
        const dir = new BABYLON.Vector3(Math.sin(a), 0.04, Math.cos(a)).normalize();
        cb.spawnFireball(b.center().add(new BABYLON.Vector3(0, 0.4, 0)), dir.scale(13), def.fireballDmg);
      }
    } else {
      // Phase 3: vent a 6-fireball ring.
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const dir = new BABYLON.Vector3(Math.sin(a), 0.04, Math.cos(a)).normalize();
        cb.spawnFireball(b.center().add(new BABYLON.Vector3(0, 0.4, 0)), dir.scale(13), def.fireballDmg);
      }
    }
    b.timer = b.phase === 1 ? 2.6 : (b.phase === 2 ? 1.6 : 2.4);
  }

  // Contact damage when MB is right at the cloud base.
  if (dist < b.radius + CFG.player.radius && pp.y < b.headY - 0.5) cb.hitPlayer(def.contactDmg);
}

// ---- Baby Blue ----
function tickBabyBlue(b, dt, player, cb) {
  const def = CFG.bosses.babyblue;
  const pp = player.pos();
  const to = new BABYLON.Vector3(pp.x - b.root.position.x, 0, pp.z - b.root.position.z);
  const dist = to.length();
  if (dist > 1e-3) to.scaleInPlace(1 / dist);
  b.root.rotation.y = Math.atan2(to.x, to.z);
  b.timer -= dt;
  b.teleportTimer -= dt;

  // Teleport — usually behind MB ("sneek atack"). Quicker each phase.
  if (b.teleportTimer <= 0) {
    const behindX = pp.x - Math.sin(player.yaw) * 6.5;
    const behindZ = pp.z - Math.cos(player.yaw) * 6.5;
    teleportFlash(b);
    b.root.position.set(behindX, 0, behindZ);
    b.teleportTimer = b.phase === 1 ? def.teleportEvery : (b.phase === 2 ? def.teleportEvery * 0.7 : def.teleportEvery * 0.5);
    b.state = 'telegraph'; b.timer = def.chargeTelegraph;
    b.lock.copyFrom(pp);
    if (b.phase >= 2) spawnMini(b);
    return;
  }

  if (b.state === 'idle') {
    b.root.position.x += to.x * 2 * dt; b.root.position.z += to.z * 2 * dt;
    if (b.timer <= 0) { b.state = 'telegraph'; b.timer = def.chargeTelegraph; b.lock.copyFrom(pp); }
  } else if (b.state === 'telegraph') {
    const f = (Math.floor(performance.now() / 50) % 2 === 0);
    b.skin.emissiveColor = f ? C(0.5, 0.7, 1.0) : C(0, 0, 0);
    if (b.timer <= 0) {
      b.state = 'charge'; b.timer = 0.7;
      const d = b.lock.subtract(b.root.position); d.y = 0;
      b.chargeDir = d.lengthSquared() > 1e-3 ? d.normalize() : new BABYLON.Vector3(0, 0, 1);
      b.skin.emissiveColor = C(0, 0, 0);
    }
  } else if (b.state === 'charge') {
    const sp = def.chargeSpeed;
    b.root.position.x += b.chargeDir.x * sp * dt;
    b.root.position.z += b.chargeDir.z * sp * dt;
    if (dist < b.radius + CFG.player.radius && pp.y < b.headY - 0.5) cb.hitPlayer(def.contactDmg);
    if (b.timer <= 0) { b.state = 'recover'; b.timer = def.chargeRecover; }
  } else if (b.state === 'recover') {
    if (b.timer <= 0) { b.state = 'idle'; b.timer = 1.6; }
  }

  // Phase 3 also lobs a fireball every couple seconds.
  if (b.phase === 3) {
    b.shootTimer = (b.shootTimer || 0) - dt;
    if (b.shootTimer <= 0) {
      b.shootTimer = 2.0;
      const a = Math.atan2(to.x, to.z);
      const dir = new BABYLON.Vector3(Math.sin(a), 0.05, Math.cos(a)).normalize();
      cb.spawnFireball(b.center().add(new BABYLON.Vector3(0, 0.6, 0)), dir.scale(14), def.fireballDmg);
    }
  }

  // Confine to arena
  confineToArena(b, 22);

  // Animate decoy minis (no contact damage; they vanish after 4s).
  for (let i = b.minis.length - 1; i >= 0; i--) {
    const m = b.minis[i];
    m.life -= dt;
    m.root.rotation.y += dt * 1.4;
    if (m.life <= 0) { m.root.dispose(); b.minis.splice(i, 1); }
  }
}

function spawnMini(b) {
  const scene = b.root.getScene();
  const root = new BABYLON.TransformNode('miniBB', scene);
  root.position.set(b.root.position.x + (Math.random() - 0.5) * 4, 0, b.root.position.z + (Math.random() - 0.5) * 4);
  const body = facetedSphere(scene, 'mbB', b.radius * 0.45, 2);
  body.position.y = b.radius * 0.5; body.parent = root;
  body.material = mat(scene, 'miniBBMat' + Math.random(), C(0.55, 0.78, 0.95), { glossy: true });
  body.material.alpha = 0.7;
  b.minis.push({ root, life: 4.0 });
}

function teleportFlash(b) {
  const scene = b.root.getScene();
  const sp = facetedSphere(scene, 'tpFlash', b.radius * 1.2, 2);
  sp.position.copyFrom(b.root.position); sp.position.y = b.radius;
  sp.material = mat(scene, 'tpMat', C(0.8, 0.9, 1.0), { emissive: C(0.7, 0.85, 1.0) });
  let t = 0;
  const obs = scene.onBeforeRenderObservable.add(() => {
    t += 0.04; sp.scaling.setAll(1 + t * 1.5); sp.material.alpha = Math.max(0, 1 - t);
    if (t >= 1) { scene.onBeforeRenderObservable.remove(obs); sp.dispose(); }
  });
}

// ---- MMB (L5) ----
// Phase 1: stands and fires colored lasers (red/blue/silver/gold) in
//          sequence. Slow drift toward MB. No melee.
// Phase 2 (race): NOT TICKED HERE. mmbLevel.js handles the race; MMB is
//                 cosmetic in that phase and we won't be inside this fn.
// Phase 3: giant form. Weak-circle is visible. Crush attacks every ~3.5s,
//          lightning bolts strike near MB every ~2.5s. Slow approach.
function tickMmb(b, dt, player, cb) {
  const def = CFG.bosses.mmb;
  const pp = player.pos();
  const to = new BABYLON.Vector3(pp.x - b.root.position.x, 0, pp.z - b.root.position.z);
  const dist = to.length();
  if (dist > 1e-3) to.scaleInPlace(1 / dist);
  b.root.rotation.y = Math.atan2(to.x, to.z);

  if (b.phase === 1) {
    // Drift slowly toward MB so a kiting player isn't permanently safe.
    const sp = 1.6;
    b.root.position.x += to.x * sp * dt;
    b.root.position.z += to.z * sp * dt;

    // Colored lasers in sequence — red, blue, silver, gold.
    b.laserTimer = (b.laserTimer || 0) - dt;
    if (b.laserTimer <= 0) {
      b.laserTimer = 0.55;     // "laser after laser"
      const colors = [
        C(1.00, 0.20, 0.20),    // red
        C(0.30, 0.55, 1.00),    // blue
        C(0.85, 0.88, 0.92),    // silver
        C(1.00, 0.85, 0.20),    // gold
      ];
      const color = colors[b.laserSeq % 4];
      b.laserSeq++;
      const a = Math.atan2(to.x, to.z);
      // Slight spread for gold (the final color in the cycle) to make it
      // feel like an escalating beat.
      const spread = (b.laserSeq % 4 === 0) ? 0.16 : 0;
      const dir = new BABYLON.Vector3(Math.sin(a + spread), 0.02, Math.cos(a + spread)).normalize();
      if (cb.spawnMmbLaser) {
        cb.spawnMmbLaser(b.center().add(new BABYLON.Vector3(0, 0.4, 0)), dir.scale(32), def.laserDmg, color);
      }
    }

    if (dist < b.radius + CFG.player.radius && pp.y < b.headY) cb.hitPlayer(def.contactDmg);
    confineToArena(b, 22);
    return;
  }

  if (b.phase === 3) {
    // Make sure the giant form + weak circle are visible.
    if (!b.giantMode) {
      b.giantMode = true;
      b.root.scaling.setAll(def.giantScale);
      b.weakCircle.setEnabled(true);
      b.weakCircle.scaling.setAll(2.0);   // grow the weak point in giant form
    }
    // Slow lumbering approach.
    const sp = 1.0;
    b.root.position.x += to.x * sp * dt;
    b.root.position.z += to.z * sp * dt;

    // Lightning bolts strike near MB.
    b.lightningTimer = (b.lightningTimer || 0) - dt;
    if (b.lightningTimer <= 0) {
      b.lightningTimer = 2.5;
      if (cb.lightningAt) cb.lightningAt(pp.clone(), def.lightningDmg);
    }

    // Crush slam: telegraphed AOE near MB every ~3.5s.
    b.crushTimer = (b.crushTimer || 0) - dt;
    if (b.crushTimer <= 0) {
      b.crushTimer = 3.5;
      if (cb.crushAt) cb.crushAt(b.root.position.clone(), def.crushDmg);
    }

    // Direct body contact still hurts.
    if (dist < b.radius * def.giantScale + CFG.player.radius && pp.y < b.headY * def.giantScale) {
      cb.hitPlayer(def.contactDmg);
    }
    confineToArena(b, 22);
    return;
  }
  // Phase 2 — should never reach this branch; mmbLevel.js handles the race.
}

// ---- Portalprotector (kept for completeness) ----
function tickPortalprotector(b, dt, player, cb) {
  const def = CFG.bosses.portalprotector;
  const pp = player.pos();
  const to = new BABYLON.Vector3(pp.x - b.root.position.x, 0, pp.z - b.root.position.z);
  const dist = to.length();
  if (dist > 1e-3) to.scaleInPlace(1 / dist);
  b.root.rotation.y = Math.atan2(to.x, to.z);
  b.timer -= dt;
  if (b.state === 'idle') {
    b.root.position.x += to.x * 1.5 * dt; b.root.position.z += to.z * 1.5 * dt;
    if (b.timer <= 0) { b.state = 'telegraph'; b.timer = def.chargeTelegraph; b.lock.copyFrom(pp); }
  } else if (b.state === 'telegraph') {
    if (b.timer <= 0) {
      b.state = 'charge'; b.timer = 0.9;
      const d = b.lock.subtract(b.root.position); d.y = 0;
      b.chargeDir = d.lengthSquared() > 1e-3 ? d.normalize() : new BABYLON.Vector3(0, 0, 1);
    }
  } else if (b.state === 'charge') {
    b.root.position.x += b.chargeDir.x * def.chargeSpeed * dt;
    b.root.position.z += b.chargeDir.z * def.chargeSpeed * dt;
    if (dist < b.radius + CFG.player.radius && pp.y < b.headY - 0.5) cb.hitPlayer(def.contactDmg);
    if (b.timer <= 0) { b.state = 'recover'; b.timer = def.chargeRecover; }
  } else if (b.state === 'recover') {
    if (b.timer <= 0) { b.state = 'idle'; b.timer = 2.0; }
  }
  confineToArena(b, 22);
}

function confineToArena(b, maxR) {
  const fl = new BABYLON.Vector2(b.root.position.x, b.root.position.z);
  if (fl.length() > maxR) { fl.normalize().scaleInPlace(maxR); b.root.position.x = fl.x; b.root.position.z = fl.y; }
}

// =========================================================================
//  Damage
// =========================================================================
export function damageBoss(b, amt) {
  if (!b.alive) return { dead: false, enteredPhase: 0 };
  const def = CFG.bosses[b.kind];
  const oldPhase = b.phase;
  b.hp = Math.max(0, b.hp - amt);

  // Flash whichever main mesh exists
  const main = b.body || b.layerA || b.core;
  if (main && main.material) {
    main.material.emissiveColor = C(0.95, 0.95, 0.95);
    setTimeout(() => {
      if (b.alive && main.material) {
        if (b.kind === 'discombobcloud')       main.material.emissiveColor = C(0.18, 0.12, 0.30);
        else if (b.kind === 'particlecolider') main.material.emissiveColor = C(1.0, 0.7, 0.2);
        else                                    main.material.emissiveColor = C(0, 0, 0);
      }
    }, 60);
  }

  // Phase escalation (up to 5 thresholds — particlecolider uses all of them).
  let enteredPhase = 0;
  if (def.phase5At && oldPhase < 5 && b.hp <= def.hp * def.phase5At) { b.phase = 5; enteredPhase = 5; }
  else if (def.phase4At && oldPhase < 4 && b.hp <= def.hp * def.phase4At) { b.phase = 4; enteredPhase = 4; }
  else if (def.phase3At && oldPhase < 3 && b.hp <= def.hp * def.phase3At) { b.phase = 3; enteredPhase = 3; }
  else if (oldPhase < 2 && b.hp <= def.hp * (def.phase2At || 0.5)) { b.phase = 2; enteredPhase = 2; }

  if (b.hp <= 0) {
    b.alive = false;
    const root = b.root;
    let t = 0;
    const obs = root.getScene().onBeforeRenderObservable.add(() => {
      t += 0.02; root.scaling.setAll(Math.max(0, 1 - t)); root.rotation.y += 0.3;
      if (t >= 1) { root.getScene().onBeforeRenderObservable.remove(obs); root.dispose(); }
    });
    return { dead: true, enteredPhase };
  }
  return { dead: false, enteredPhase };
}
