// "Inspirations" — collectible orbs scattered through the 3D levels. Each
// gives points when MB walks (or jumps) into it. Several variants per the
// spec: a generic glowing orb; an acorn on top of the tallest tree; an orb
// hidden inside a log; an orb shrouded in mist; an orb tucked under a
// pine-tree leaf. Also the LEVEL-3-ONLY hidden SAW which, on contact,
// sprays "tree dust" and unlocks a 20000pt inspiration.

import { CFG } from './config.js';
import { mat, C, facetedSphere, manySidedCylinder } from './geometry.js';

const ORB_TIER_COLOR = {
  200:   { body: C(1.0, 0.85, 0.30), glow: C(0.95, 0.60, 0.10) },
  500:   { body: C(0.7, 0.95, 0.35), glow: C(0.5, 0.85, 0.20) },
  1000:  { body: C(0.85, 0.55, 1.0), glow: C(0.65, 0.30, 0.95) },
  20000: { body: C(1.0, 1.0, 1.0),   glow: C(0.95, 0.95, 0.95) },
};

function makeOrb(scene, value, name) {
  const c = ORB_TIER_COLOR[value] || ORB_TIER_COLOR[200];
  const orb = facetedSphere(scene, 'orb_' + name, CFG.collectible.radius, 2);
  orb.material = mat(scene, 'orbMat_' + name, c.body, { emissive: c.glow });
  return orb;
}

// Build all of `spec.inspirations` and place them. Each entry can be:
//   { id, kind, at, value, hint }
// where kind is one of: 'orb' | 'log' | 'acorn' | 'mist' | 'leaf'.
//
// Returns an array of collectible objects:
//   { id, kind, value, position, root, alive, _onCollect, label, baseY }
export function buildInspirations(scene, spec) {
  const out = [];
  for (const e of spec) {
    const root = new BABYLON.TransformNode('insp_' + e.id, scene);
    root.position.set(e.at[0], e.at[1], e.at[2]);
    const item = { id: e.id, kind: e.kind, value: e.value, position: root.position, root, alive: true, baseY: e.at[1], label: e.hint || '' };

    if (e.kind === 'orb') {
      const m = makeOrb(scene, e.value, e.id);
      m.parent = root;
      item.orb = m;
    } else if (e.kind === 'acorn') {
      // Acorn on top of the tallest tree — a faceted oval with a brown cap.
      const body = facetedSphere(scene, 'acorn_' + e.id, 0.5, 2);
      body.scaling.y = 1.3; body.parent = root;
      body.material = mat(scene, 'acornBody_' + e.id, C(0.86, 0.62, 0.22), { emissive: C(0.45, 0.25, 0.05) });
      const cap = facetedSphere(scene, 'acornCap_' + e.id, 0.45, 2);
      cap.scaling.set(1, 0.5, 1); cap.position.y = 0.32; cap.parent = root;
      cap.material = mat(scene, 'acornCap_' + e.id + 'M', C(0.35, 0.22, 0.10));
      item.orb = body;
    } else if (e.kind === 'log') {
      // A 40-sided hollow log. The orb is tucked inside.
      const log = manySidedCylinder(scene, 'log_' + e.id, { diameter: 1.5, height: 2.6, tess: 40 });
      log.rotation.z = Math.PI / 2;
      log.position.y = 0.7;
      log.parent = root;
      log.material = mat(scene, 'logMat_' + e.id, C(0.34, 0.20, 0.10));
      const m = makeOrb(scene, e.value, e.id);
      m.parent = root; m.position.y = 0.7;
      item.orb = m;
    } else if (e.kind === 'mist') {
      // A pulsing orb behind misty cloud blobs (the mist itself was drawn by
      // world-forest.js at the same corner).
      const m = makeOrb(scene, e.value, e.id);
      m.parent = root;
      item.orb = m;
    } else if (e.kind === 'leaf') {
      // A big drooping pine-leaf rosette with an orb just underneath. MB has
      // to crouch (Z) or jump into it to reach the orb.
      const stalk = manySidedCylinder(scene, 'leafStalk_' + e.id, { diameter: 0.12, height: 1.2, tess: 12 });
      stalk.parent = root; stalk.position.y = 0.6;
      stalk.material = mat(scene, 'leafStalk_' + e.id + 'M', C(0.32, 0.20, 0.08));
      const leaf = BABYLON.MeshBuilder.CreateCylinder('leaf_' + e.id, {
        diameterTop: 1.6, diameterBottom: 0.4, height: 0.4, tessellation: 40,
      }, scene);
      leaf.parent = root; leaf.position.y = 1.0;
      leaf.material = mat(scene, 'leafMat_' + e.id, C(0.12, 0.42, 0.18), { emissive: C(0.03, 0.10, 0.04) });
      const m = makeOrb(scene, e.value, e.id);
      m.parent = root; m.position.y = 0.4;
      item.orb = m;
    }

    // Floaty bob + spin for every inspiration's orb.
    const ph = Math.random() * Math.PI * 2;
    const orbBaseY = item.orb.position.y;
    scene.onBeforeRenderObservable.add(() => {
      if (!item.alive || !item.orb) return;
      item.orb.rotation.y += 0.04;
      // bob the orb (independently of the root, so the log/leaf stay put)
      item.orb.position.y = orbBaseY + Math.sin(performance.now() * 0.0016 + ph) * 0.18;
    });

    out.push(item);
  }
  return out;
}

// Test MB against every alive inspiration; consume any it touches.
// Returns an array of collected items (for the caller to score / banner).
export function tickInspirations(items, player) {
  const pp = player.pos();
  const got = [];
  for (const it of items) {
    if (!it.alive) continue;
    const dx = pp.x - it.position.x;
    const dz = pp.z - it.position.z;
    const dy = (pp.y + 1.0) - it.position.y;
    const flat = Math.hypot(dx, dz);
    if (flat < 1.0 && Math.abs(dy) < 1.6) {
      collect(it);
      got.push(it);
    }
  }
  return got;
}

function collect(it) {
  it.alive = false;
  const root = it.root;
  let t = 0;
  const scene = root.getScene();
  const obs = scene.onBeforeRenderObservable.add(() => {
    t += 0.04;
    root.scaling.setAll(Math.max(0, 1 + t * 0.5 - t * t * 1.5));
    root.position.y += 0.08;
    if (t >= 1) { scene.onBeforeRenderObservable.remove(obs); root.dispose(); }
  });
}

// =========================================================================
//  Hidden SAW (Level 3 only). Walking into it triggers a tree-dust shower
//  and reveals a 20000pt "smells so good" inspiration in place. This IS
//  the level-3 secret per Data6: "make part of a tree tree dust ... you
//  will get a inseration about how good it smeels that give you 20000pt".
// =========================================================================
export function buildSaw(scene, at) {
  const root = new BABYLON.TransformNode('sawRoot', scene);
  root.position.set(at[0], at[1], at[2]);

  // A small saw blade — 40-sided cylinder, dark teeth.
  const blade = manySidedCylinder(scene, 'sawBlade', { diameter: 1.4, height: 0.08, tess: 40 });
  blade.rotation.x = Math.PI / 2;
  blade.parent = root; blade.position.y = 0.4;
  blade.material = mat(scene, 'sawBladeMat', C(0.78, 0.82, 0.86), { emissive: C(0.3, 0.32, 0.35), glossy: true });

  // Tiny half-buried handle
  const handle = manySidedCylinder(scene, 'sawHandle', { diameter: 0.18, height: 0.7, tess: 12 });
  handle.parent = root; handle.position.set(0.6, 0.35, 0);
  handle.material = mat(scene, 'sawHandleMat', C(0.35, 0.22, 0.10));

  // Quiet shine so the player notices it.
  scene.onBeforeRenderObservable.add(() => { blade.rotation.y += 0.02; });

  return { root, blade, position: root.position, alive: true, triggered: false };
}

// Returns true if the saw was just triggered this frame.
export function tickSaw(saw, player) {
  if (!saw || !saw.alive || saw.triggered) return false;
  const pp = player.pos();
  if (Math.hypot(pp.x - saw.position.x, pp.z - saw.position.z) < 1.2 && pp.y < 1.4) {
    saw.triggered = true;
    return true;
  }
  return false;
}

// Spray a faceted "tree dust" cloud and float a white 20000pt orb above the saw.
// Returns the new collectible to be ticked normally.
export function fireSawSecret(scene, saw, dustTarget) {
  // Tree dust burst around the saw
  for (let i = 0; i < 20; i++) {
    const m = facetedSphere(scene, 'dust' + i, 0.18 + Math.random() * 0.18, 1);
    m.position.copyFrom(saw.position);
    m.material = mat(scene, 'dustMat' + i,
      C(0.85 + Math.random() * 0.1, 0.78, 0.6),
      { emissive: C(0.3, 0.25, 0.2) });
    const dir = new BABYLON.Vector3((Math.random() - 0.5) * 4, 1.4 + Math.random() * 2, (Math.random() - 0.5) * 4);
    let t = 0;
    const obs = scene.onBeforeRenderObservable.add(() => {
      t += 0.03;
      m.position.addInPlace(dir.scale(0.04));
      dir.y -= 0.06;       // gravity-ish
      m.rotation.y += 0.4;
      m.material.alpha = Math.max(0, 1 - t * 0.6);
      if (t >= 1.8) { scene.onBeforeRenderObservable.remove(obs); m.dispose(); }
    });
  }

  // Reveal the 20000pt orb floating above the saw.
  const inspRoot = new BABYLON.TransformNode('insp_sawSecret', scene);
  inspRoot.position.set(saw.position.x, saw.position.y + 1.6, saw.position.z);
  const orb = makeOrb(scene, 20000, 'sawSecret');
  orb.parent = inspRoot;
  const revealed = {
    id: 'sawSecret', kind: 'orb', value: 20000,
    position: inspRoot.position, root: inspRoot, orb, alive: true,
    label: 'smells so good',
  };
  const ph = Math.random() * Math.PI * 2;
  scene.onBeforeRenderObservable.add(() => {
    if (!revealed.alive || !orb) return;
    orb.rotation.y += 0.06;
    orb.position.y = Math.sin(performance.now() * 0.0018 + ph) * 0.22;
  });
  return revealed;
}
