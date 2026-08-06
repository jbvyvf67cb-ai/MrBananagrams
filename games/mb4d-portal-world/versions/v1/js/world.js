import { mat, C, manySidedCylinder, facetedSphere, decoPoly, goldberg } from './geometry.js';
import { CFG } from './config.js';

// Builds Level 1's arena: the Hipball stone court (callback to MB4) sitting in
// the strange new 40-sided world. Returns handles the game needs later.
export function buildWorld(scene) {
  scene.clearColor = new BABYLON.Color4(0.20, 0.11, 0.28, 1);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogColor = new BABYLON.Color3(0.20, 0.11, 0.28);
  scene.fogDensity = 0.018;

  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.7;
  hemi.groundColor = C(0.25, 0.14, 0.32);
  const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.4, -1, -0.35), scene);
  sun.intensity = 0.85;
  sun.position = new BABYLON.Vector3(20, 40, 20);

  const glow = new BABYLON.GlowLayer('glow', scene);
  glow.intensity = 0.6;

  // --- Sky dome (the ONLY object exempt from the 40-side rule) ---
  const sky = facetedSphere(scene, 'sky', 90, 2);
  sky.flipFaces(true);
  sky.material = mat(scene, 'skyMat', C(0.18, 0.10, 0.26), { emissive: C(0.16, 0.09, 0.24) });
  sky.material.disableLighting = true;
  sky.isPickable = false;

  const R = CFG.world.arenaRadius;

  // --- Court floor: 48-sided disc ---
  const floor = manySidedCylinder(scene, 'floor', { diameter: R * 2, height: 1, tess: 48 });
  floor.position.y = -0.5;
  floor.material = mat(scene, 'floorMat', C(0.62, 0.46, 0.30));
  floor.checkCollisions = true;

  // Inner court ring marking
  const ring = BABYLON.MeshBuilder.CreateTorus('courtRing', { diameter: R * 1.1, thickness: 0.25, tessellation: 48 }, scene);
  ring.position.y = 0.02;
  ring.material = mat(scene, 'ringMat', C(0.80, 0.66, 0.42), { emissive: C(0.15, 0.10, 0.05) });
  ring.isPickable = false;

  // --- Perimeter wall: ring of faceted pillars ---
  const pillarMat = mat(scene, 'pillarMat', C(0.45, 0.33, 0.22));
  const N = 20;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const p = manySidedCylinder(scene, 'pillar' + i, { diameter: 1.6, height: CFG.world.wallHeight, tess: 12 });
    p.position.set(Math.cos(a) * (R + 0.5), CFG.world.wallHeight / 2 - 0.5, Math.sin(a) * (R + 0.5));
    p.material = pillarMat;
    p.isPickable = false;
  }

  // --- Stone hoop at the back (Hipball nod) ---
  const hoop = BABYLON.MeshBuilder.CreateTorus('hoop', { diameter: 3.4, thickness: 0.5, tessellation: 40 }, scene);
  hoop.position.set(0, 4.2, -R + 1.5);
  hoop.rotation.x = Math.PI / 2;
  hoop.material = mat(scene, 'hoopMat', C(0.55, 0.42, 0.30));
  hoop.isPickable = false;

  // --- Floating geometric decor (the "40-sided world" flavour) ---
  const palette = [C(0.78, 0.42, 0.85), C(0.45, 0.78, 0.72), C(0.55, 0.50, 0.92), C(0.95, 0.72, 0.30)];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    const r = R + 6 + (i % 3) * 3;
    const m = (i % 2 === 0) ? decoPoly(scene, 'deco' + i, 1.3, i) : goldberg(scene, 'deco' + i, 1.3);
    m.position.set(Math.cos(a) * r, 3 + (i % 4), Math.sin(a) * r);
    m.rotation.y = i;
    m.material = mat(scene, 'decoMat' + i, palette[i % palette.length], { emissive: palette[i % palette.length].scale(0.12) });
    m.isPickable = false;
    const baseY = m.position.y, ph = i;
    scene.onBeforeRenderObservable.add(() => {
      m.rotation.y += 0.003;
      m.position.y = baseY + Math.sin(performance.now() * 0.0006 + ph) * 0.4;
    });
  }

  // --- Victory portal (hidden until the boss is beaten) ---
  const portal = BABYLON.MeshBuilder.CreateTorus('portal', { diameter: 4.2, thickness: 0.6, tessellation: 40 }, scene);
  portal.position.set(0, 2.6, -R + 4);
  portal.rotation.x = Math.PI / 2;
  portal.material = mat(scene, 'portalMat', C(0.62, 0.28, 0.98), { emissive: C(0.5, 0.2, 0.85) });
  const portalFill = facetedSphere(scene, 'portalFill', 1.9, 2);
  portalFill.parent = portal;
  portalFill.material = mat(scene, 'portalFillMat', C(0.40, 0.15, 0.7), { emissive: C(0.35, 0.12, 0.6) });
  portalFill.material.alpha = 0.55;
  portal.setEnabled(false);
  scene.onBeforeRenderObservable.add(() => { if (portal.isEnabled()) portal.rotation.y += 0.02; });

  return { R, floor, portal };
}
