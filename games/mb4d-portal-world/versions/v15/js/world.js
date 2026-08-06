import { mat, C, manySidedCylinder, facetedSphere, decoPoly, goldberg } from './geometry.js';
import { CFG } from './config.js';

// v2: Level 1 = the MB4 Hipball stone court, exactly as the spreadsheet now
// directs ("level one needs to be exactly like mb 4"). Same warm-sand palette
// MB4 uses, glyph-carved back wall, brazier-lit hoop. The portal only appears
// after the boss is down — that's MB's entry into the truly 4D world (v3+).
export function buildWorld(scene) {
  // Warm sandstone sky, matching MB4 Hipball.
  scene.clearColor = new BABYLON.Color4(0.40, 0.27, 0.34, 1);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogColor = new BABYLON.Color3(0.40, 0.27, 0.34);
  scene.fogDensity = 0.010;

  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.85;
  hemi.groundColor = C(0.42, 0.30, 0.22);
  const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.4, -1, -0.35), scene);
  sun.intensity = 1.05;
  sun.diffuse = C(1.0, 0.92, 0.78);
  sun.position = new BABYLON.Vector3(20, 40, 20);

  const glow = new BABYLON.GlowLayer('glow', scene);
  glow.intensity = 0.6;

  // --- Sky dome (the ONLY object exempt from the 40-side rule) ---
  const sky = facetedSphere(scene, 'sky', 90, 2);
  sky.flipFaces(true);
  sky.material = mat(scene, 'skyMat', C(0.40, 0.27, 0.34), { emissive: C(0.36, 0.24, 0.30) });
  sky.material.disableLighting = true;
  sky.isPickable = false;

  const R = CFG.world.arenaRadius;

  // --- Court floor: 48-sided sandstone disc (Hipball palette) ---
  const floor = manySidedCylinder(scene, 'floor', { diameter: R * 2, height: 1, tess: 48 });
  floor.position.y = -0.5;
  floor.material = mat(scene, 'floorMat', C(0.86, 0.66, 0.42));
  floor.checkCollisions = true;

  // Center marker — Mesoamerican rosette
  const rose = BABYLON.MeshBuilder.CreateTorus('rosette', { diameter: 4.2, thickness: 0.22, tessellation: 40 }, scene);
  rose.position.y = 0.04;
  rose.material = mat(scene, 'roseMat', C(0.52, 0.32, 0.18), { emissive: C(0.12, 0.05, 0.02) });
  rose.isPickable = false;

  // Inner court ring marking
  const ring = BABYLON.MeshBuilder.CreateTorus('courtRing', { diameter: R * 1.65, thickness: 0.28, tessellation: 48 }, scene);
  ring.position.y = 0.02;
  ring.material = mat(scene, 'ringMat', C(0.62, 0.42, 0.22), { emissive: C(0.12, 0.06, 0.02) });
  ring.isPickable = false;

  // --- Sloped side walls (trapezoidal court hint, in 3D) ---
  for (const side of [-1, 1]) {
    const wall = BABYLON.MeshBuilder.CreateBox('sideWall' + side, { width: R * 1.6, height: 3.0, depth: 1.4 }, scene);
    wall.position.set(side * (R + 0.4), 1.0, 0);
    wall.rotation.z = side * 0.18;     // outward lean = "slope"
    wall.material = mat(scene, 'sideWallMat', C(0.55, 0.40, 0.26));
    wall.isPickable = false;
  }

  // --- Back wall with carved glyphs (the Hipball look) ---
  const backWall = BABYLON.MeshBuilder.CreateBox('backWall', { width: R * 1.4, height: 5.2, depth: 1.2 }, scene);
  backWall.position.set(0, 2.1, -R - 0.2);
  backWall.material = mat(scene, 'backWallMat', C(0.50, 0.36, 0.24));
  backWall.isPickable = false;
  const glyphMat = mat(scene, 'glyphMat', C(0.86, 0.66, 0.36), { emissive: C(0.18, 0.10, 0.04) });
  for (let i = 0; i < 7; i++) {
    const g = decoPoly(scene, 'glyph' + i, 0.55, i + 1);
    g.position.set(-R * 0.6 + i * (R * 1.2 / 6), 3.6, -R + 0.45);
    g.material = glyphMat; g.isPickable = false;
  }

  // --- Stone hoop on the back wall (Hipball signature) ---
  const hoop = BABYLON.MeshBuilder.CreateTorus('hoop', { diameter: 3.4, thickness: 0.5, tessellation: 40 }, scene);
  hoop.position.set(0, 4.2, -R + 0.6);
  hoop.rotation.x = Math.PI / 2;
  hoop.material = mat(scene, 'hoopMat', C(0.55, 0.42, 0.30));
  hoop.isPickable = false;

  // --- Braziers flanking the hoop (warm Hipball light) ---
  for (const side of [-1, 1]) {
    const post = BABYLON.MeshBuilder.CreateCylinder('brazPost' + side, { diameter: 0.4, height: 2.2, tessellation: 12 }, scene);
    post.position.set(side * 4, 0.6, -R + 1.2);
    post.material = mat(scene, 'brazPostMat', C(0.35, 0.25, 0.18));
    const bowl = facetedSphere(scene, 'brazBowl' + side, 0.6, 1);
    bowl.position.set(side * 4, 1.9, -R + 1.2);
    bowl.material = mat(scene, 'brazBowlMat', C(0.45, 0.32, 0.22));
    const flame = facetedSphere(scene, 'brazFlame' + side, 0.5, 1);
    flame.position.set(side * 4, 2.5, -R + 1.2);
    flame.material = mat(scene, 'brazFlameMat', C(1.0, 0.55, 0.15), { emissive: C(0.9, 0.45, 0.10) });
    scene.onBeforeRenderObservable.add(() => {
      const f = 0.85 + Math.sin(performance.now() * 0.012 + side) * 0.15;
      flame.scaling.set(f, f * 1.2, f);
    });
  }

  // --- Perimeter wall: ring of faceted pillars (audience benches in spirit) ---
  const pillarMat = mat(scene, 'pillarMat', C(0.50, 0.36, 0.24));
  const N = 20;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    // Skip the back arc where the back wall + hoop already are.
    if (Math.cos(a) < -0.35 && Math.abs(Math.sin(a)) < 0.6) continue;
    const p = manySidedCylinder(scene, 'pillar' + i, { diameter: 1.6, height: CFG.world.wallHeight, tess: 12 });
    p.position.set(Math.cos(a) * (R + 0.5), CFG.world.wallHeight / 2 - 0.5, Math.sin(a) * (R + 0.5));
    p.material = pillarMat;
    p.isPickable = false;
  }

  // --- A few 40-sided floating shapes far behind the wall (hint at the 4D
  //     world MB will jump into after the boss). Subtle for v2's MB4 feel. ---
  const palette = [C(0.78, 0.42, 0.85), C(0.55, 0.50, 0.92), C(0.95, 0.72, 0.30)];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const r = R + 10 + (i % 3) * 3;
    const m = (i % 2 === 0) ? decoPoly(scene, 'deco' + i, 1.5, i) : goldberg(scene, 'deco' + i, 1.5);
    m.position.set(Math.cos(a) * r, 6 + (i % 4), Math.sin(a) * r);
    m.rotation.y = i;
    m.material = mat(scene, 'decoMat' + i, palette[i % palette.length], { emissive: palette[i % palette.length].scale(0.10) });
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
