// v7 Forest world. Two variants:
//   - 'juniper' (Level 2): tall narrow conical trees, soft green ground, mist
//                          at the far back-right corner (where an inspiration hides).
//   - 'pine'    (Level 3): wider pine trees, deeper green palette, with room
//                          for the hidden saw / leaf-tucked inspirations.
//
// Everything except the sky has at least 40 sides (faceted spheres at
// subdivisions=2 give 80 triangles; cones use tess≥40; trunks use 40-sided
// cylinders; leaves are stacks of 40-sided cones). The portal at the back
// of the arena is reused from the v6 court (hidden until the boss is down).

import { mat, C, manySidedCylinder, facetedSphere, decoPoly } from './geometry.js';

export function buildForest(scene, opts) {
  const variant = opts.variant || 'juniper';
  const arenaR = opts.arenaRadius || 36;

  // ---------------- Sky ----------------
  const skyTop  = variant === 'pine' ? C(0.32, 0.46, 0.55) : C(0.55, 0.74, 0.78);
  const skyHaze = variant === 'pine' ? C(0.18, 0.30, 0.36) : C(0.42, 0.62, 0.55);
  scene.clearColor = new BABYLON.Color4(skyHaze.r, skyHaze.g, skyHaze.b, 1);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogColor = skyHaze;
  scene.fogDensity = variant === 'pine' ? 0.018 : 0.012;

  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.9;
  hemi.groundColor = variant === 'pine' ? C(0.12, 0.22, 0.14) : C(0.16, 0.34, 0.18);
  const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.4, -1, -0.35), scene);
  sun.intensity = 1.1;
  sun.diffuse = C(1.0, 0.96, 0.82);
  sun.position = new BABYLON.Vector3(20, 40, 20);

  const glow = new BABYLON.GlowLayer('glow', scene);
  glow.intensity = 0.55;

  // Sky dome — the only object exempt from the 40-side rule (it's the
  // skybox, not a world object).
  const sky = facetedSphere(scene, 'sky', arenaR * 5, 2);
  sky.flipFaces(true);
  sky.material = mat(scene, 'skyMat', skyTop, { emissive: skyTop.scale(0.7) });
  sky.material.disableLighting = true; sky.isPickable = false;

  // ---------------- Ground ----------------
  const groundColor = variant === 'pine' ? C(0.18, 0.34, 0.18) : C(0.30, 0.52, 0.26);
  const floor = manySidedCylinder(scene, 'forestFloor', { diameter: arenaR * 2, height: 0.6, tess: 48 });
  floor.position.y = -0.3;
  floor.material = mat(scene, 'forestFloorMat', groundColor);
  floor.checkCollisions = true;

  // Faint trail ring
  const ring = BABYLON.MeshBuilder.CreateTorus('ringMark', { diameter: arenaR * 1.4, thickness: 0.16, tessellation: 48 }, scene);
  ring.position.y = 0.02;
  ring.material = mat(scene, 'ringMatF', C(0.12, 0.20, 0.10), { emissive: C(0.02, 0.04, 0.02) });
  ring.isPickable = false;

  // ---------------- Trees (juniper or pine) ----------------
  const trees = [];
  const trunkMat = mat(scene, 'trunkMat', variant === 'pine' ? C(0.28, 0.18, 0.10) : C(0.32, 0.22, 0.12));
  const foliageMat = mat(scene, 'foliageMat',
    variant === 'pine' ? C(0.10, 0.34, 0.20) : C(0.18, 0.46, 0.22),
    { emissive: variant === 'pine' ? C(0.02, 0.08, 0.04) : C(0.04, 0.10, 0.04) });

  // Pseudo-random placement that's deterministic per variant for reproducibility.
  let seed = variant === 'pine' ? 31 : 17;
  const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

  const treeCount = variant === 'pine' ? 28 : 22;
  // Reserve the centerlines for combat space; place trees out at r >= 8.
  for (let i = 0; i < treeCount; i++) {
    const a = rng() * Math.PI * 2;
    const r = 9 + rng() * (arenaR - 11);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const heightScale = 0.85 + rng() * 0.7;
    const isTallest = (i === 0 && opts.markTallest);    // optional anchor for the acorn
    const h = (variant === 'pine' ? 5 : 6.2) * heightScale * (isTallest ? 1.6 : 1);
    trees.push(makeTree(scene, x, z, h, trunkMat, foliageMat, variant, isTallest));
  }

  // ---------------- Mist (for Level 2's hidden inspiration corner) ----------------
  const mistRoot = new BABYLON.TransformNode('mist', scene);
  if (variant === 'juniper') {
    const mistMat = mat(scene, 'mistMat', C(0.85, 0.92, 0.95), { emissive: C(0.7, 0.78, 0.85) });
    mistMat.alpha = 0.35;
    for (let i = 0; i < 8; i++) {
      const b = facetedSphere(scene, 'mistBlob' + i, 1.6 + Math.random() * 1.4, 2);
      b.parent = mistRoot;
      b.position.set(20 + Math.random() * 4 - 2, 0.8 + Math.random() * 1.2, -15 + Math.random() * 4 - 2);
      b.material = mistMat; b.isPickable = false;
      const ph = Math.random() * Math.PI * 2;
      scene.onBeforeRenderObservable.add(() => {
        b.position.y = 0.8 + Math.sin(performance.now() * 0.0006 + ph) * 0.25;
      });
    }
  }

  // ---------------- Victory portal (hidden until boss is down) ----------------
  const portal = BABYLON.MeshBuilder.CreateTorus('portal', { diameter: 4.2, thickness: 0.6, tessellation: 40 }, scene);
  portal.position.set(0, 2.6, -arenaR + 4);
  portal.rotation.x = Math.PI / 2;
  portal.material = mat(scene, 'portalMatF', C(0.20, 0.45, 0.95), { emissive: C(0.15, 0.40, 0.85) });
  const portalFill = facetedSphere(scene, 'portalFillF', 1.9, 2);
  portalFill.parent = portal;
  portalFill.material = mat(scene, 'portalFillMatF', C(0.10, 0.30, 0.7), { emissive: C(0.08, 0.25, 0.6) });
  portalFill.material.alpha = 0.55;
  portal.setEnabled(false);
  scene.onBeforeRenderObservable.add(() => { if (portal.isEnabled()) portal.rotation.y += 0.02; });

  return { R: arenaR, floor, portal, trees, groundY: 0 };
}

// Build one tree. Juniper = tall conical stack; pine = wider tiered cones.
function makeTree(scene, x, z, h, trunkMat, foliageMat, variant, isTallest) {
  const root = new BABYLON.TransformNode('tree', scene);
  root.position.set(x, 0, z);

  const trunkH = h * 0.42, trunkD = 0.55 + (variant === 'pine' ? 0.2 : 0.1);
  const trunk = manySidedCylinder(scene, 'tTrunk', { diameter: trunkD, height: trunkH, tess: 40 });
  trunk.parent = root; trunk.position.y = trunkH / 2;
  trunk.material = trunkMat; trunk.isPickable = false;

  // Foliage cones (tess 40 → 40-sided per cone).
  const tiers = variant === 'pine' ? 3 : 4;
  for (let i = 0; i < tiers; i++) {
    const t = i / (tiers - 1);
    const dia = (variant === 'pine' ? 4.2 : 2.6) * (1 - t * 0.55);
    const ch  = (variant === 'pine' ? 1.6 : 1.4);
    const cone = BABYLON.MeshBuilder.CreateCylinder('foliage' + i, {
      diameterTop: dia * 0.18, diameterBottom: dia, height: ch, tessellation: 40,
    }, scene);
    cone.parent = root;
    cone.position.y = trunkH + ch * 0.5 + i * (ch * 0.7);
    cone.material = foliageMat; cone.isPickable = false;
  }

  if (isTallest) {
    // Mark the tallest tree visually (a tiny gold tag on the top tier).
    const tag = facetedSphere(scene, 'tag', 0.18, 1);
    tag.parent = root;
    tag.position.y = trunkH + tiers * 1.4;
    tag.material = mat(scene, 'tagMat', C(1.0, 0.85, 0.2), { emissive: C(0.9, 0.6, 0.05) });
  }

  return { root, x, z, h, isTallest };
}
