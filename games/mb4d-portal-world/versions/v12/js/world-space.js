// v8 Space world for Level 4 — the spaceship interior. Per Data7 F5:
// MB falls into outer space into the spaceship; the level is fought inside
// the ship. We render a black starfield (sky still exempt from 40-side),
// a dark metallic hexagonal floor, and a low ring of glowing console panels
// around the back where the boss spawns.

import { mat, C, manySidedCylinder, facetedSphere, decoPoly } from './geometry.js';

export function buildSpace(scene, opts) {
  const arenaR = opts.arenaRadius || 30;

  // --- Sky (starfield) ---
  scene.clearColor = new BABYLON.Color4(0.04, 0.05, 0.10, 1);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogColor = new BABYLON.Color3(0.05, 0.06, 0.11);
  scene.fogDensity = 0.008;

  const ambient = new BABYLON.HemisphericLight('ambient', new BABYLON.Vector3(0, 1, 0), scene);
  ambient.intensity = 0.55;
  ambient.groundColor = C(0.05, 0.08, 0.18);
  const key = new BABYLON.DirectionalLight('keyLight', new BABYLON.Vector3(-0.3, -1, -0.2), scene);
  key.intensity = 0.95;
  key.diffuse = C(0.85, 0.92, 1.0);

  const glow = new BABYLON.GlowLayer('glow', scene);
  glow.intensity = 0.95;

  // Sky dome (the only object exempt from 40 sides).
  const sky = facetedSphere(scene, 'spaceSky', arenaR * 6, 2);
  sky.flipFaces(true);
  sky.material = mat(scene, 'spaceSkyMat', C(0.04, 0.05, 0.10), { emissive: C(0.03, 0.04, 0.08) });
  sky.material.disableLighting = true; sky.isPickable = false;

  // Faceted "stars" — 80 tiny emissive cubes scattered far away.
  const starMat = mat(scene, 'starMat', C(1, 1, 1), { emissive: C(1, 1, 1) });
  let seed = 13;
  const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let i = 0; i < 80; i++) {
    const s = facetedSphere(scene, 'star' + i, 0.4 + rng() * 0.6, 1);
    const a = rng() * Math.PI * 2;
    const r = arenaR * 4 + rng() * arenaR;
    const y = (rng() - 0.3) * arenaR * 3;
    s.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    s.material = starMat;
    s.isPickable = false;
  }

  // --- Metallic floor — 40-sided disc, dark, slight blue emissive grid ---
  const floor = manySidedCylinder(scene, 'shipFloor', { diameter: arenaR * 2, height: 0.6, tess: 48 });
  floor.position.y = -0.3;
  floor.material = mat(scene, 'shipFloorMat', C(0.12, 0.14, 0.18), { glossy: true });
  floor.checkCollisions = true;

  // Grid rings — concentric glowing trace lines.
  const traceMat = mat(scene, 'shipTrace', C(0.15, 0.65, 1.0), { emissive: C(0.10, 0.55, 0.95) });
  for (let i = 1; i <= 3; i++) {
    const ring = BABYLON.MeshBuilder.CreateTorus('shipRing' + i, {
      diameter: (i / 3) * arenaR * 1.6, thickness: 0.10, tessellation: 48,
    }, scene);
    ring.position.y = 0.04;
    ring.material = traceMat; ring.isPickable = false;
  }

  // Center landing pad — slightly raised disc where MB drops in.
  const pad = manySidedCylinder(scene, 'landingPad', { diameter: 6, height: 0.4, tess: 40 });
  pad.position.y = 0.2;
  pad.material = mat(scene, 'padMat', C(0.18, 0.22, 0.30), { emissive: C(0.05, 0.12, 0.25) });
  pad.isPickable = false;

  // --- Console panels ring around the back half of the arena ---
  const consoleMat = mat(scene, 'consoleMat', C(0.20, 0.22, 0.28), { glossy: true });
  const consoleGlow = mat(scene, 'consoleGlow', C(0.20, 0.85, 1.0), { emissive: C(0.18, 0.70, 0.98) });
  for (let i = -6; i <= 6; i++) {
    const a = (i / 14) * Math.PI - Math.PI / 2;     // back half only
    const x = Math.cos(a) * (arenaR - 2);
    const z = Math.sin(a) * (arenaR - 2);
    const post = manySidedCylinder(scene, 'panel' + i, { diameter: 1.6, height: 2.4, tess: 40 });
    post.position.set(x, 1.2, z);
    post.material = consoleMat; post.isPickable = false;
    const screen = decoPoly(scene, 'panelScreen' + i, 0.55, i);
    screen.position.set(x * 0.92, 2.0, z * 0.92);
    screen.material = consoleGlow; screen.isPickable = false;
  }

  // --- The "press X" button pedestal ---
  // Created here but its position is set by the caller, since the level cfg
  // owns the actual coords. Returned alongside the world.
  const button = makeButton(scene);
  button.root.setEnabled(false);

  // --- Final exit portal (cosmetic — the spec says "before you can reach the
  //     portal you have already beat the LEVEL", so it never actually opens) ---
  const portal = BABYLON.MeshBuilder.CreateTorus('shipPortal', {
    diameter: 4.2, thickness: 0.6, tessellation: 40,
  }, scene);
  portal.position.set(0, 2.6, -arenaR + 4);
  portal.rotation.x = Math.PI / 2;
  portal.material = mat(scene, 'shipPortalMat', C(0.20, 0.45, 0.95), { emissive: C(0.15, 0.40, 0.85) });
  portal.setEnabled(false);

  return { R: arenaR, floor, pad, portal, button, groundY: 0 };
}

// The button MB presses to summon the boss. Two parts:
//   - 40-sided pedestal cylinder
//   - a glowing dome on top (red while locked, green/pulsing once free)
function makeButton(scene) {
  const root = new BABYLON.TransformNode('buttonRoot', scene);
  const base = manySidedCylinder(scene, 'btnBase', { diameter: 1.6, height: 1.0, tess: 40 });
  base.parent = root; base.position.y = 0.5;
  base.material = mat(scene, 'btnBaseMat', C(0.20, 0.22, 0.30), { glossy: true });

  const dome = facetedSphere(scene, 'btnDome', 0.55, 2);
  dome.parent = root; dome.position.y = 1.2;
  dome.material = mat(scene, 'btnDomeMat', C(0.95, 0.30, 0.20), { emissive: C(0.85, 0.20, 0.10) });

  // Slow pulse to make it noticeable.
  scene.onBeforeRenderObservable.add(() => {
    if (!root.isEnabled()) return;
    const t = performance.now() * 0.003;
    dome.scaling.setAll(1 + Math.sin(t) * 0.06);
  });

  return {
    root, base, dome,
    armed: false,
    setArmed(armed) {
      this.armed = armed;
      dome.material.diffuseColor = armed ? C(0.30, 0.95, 0.40) : C(0.95, 0.30, 0.20);
      dome.material.emissiveColor = armed ? C(0.20, 0.85, 0.30) : C(0.85, 0.20, 0.10);
    },
  };
}
