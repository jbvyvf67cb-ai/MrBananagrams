// v11 MMB world (Level 5). Builds three connected sub-worlds for L5's
// three phases:
//
//   1. arena    — a metallic spaceship interior where MB and MMB fight in
//                 phase 1 and (giant-form MMB) in phase 3.
//   2. corridor — a long forward-facing race track used in phase 2. Spikes
//                 along the path, a finish-line arch at the end, an Apple
//                 King visual at the very end, and a glowing red laser wall
//                 that mmbLevel.js animates forward from behind.
//   3. portal   — the cosmetic blue rescue portal, hidden until p3 is won.
//
// All three are built up-front so we don't have to dispose/re-create on
// phase transition. mmbLevel.js moves the player and shifts the active
// "stage" by enabling/disabling roots.

import { mat, C, manySidedCylinder, facetedSphere, decoPoly } from './geometry.js';

export function buildMmbWorld(scene, spec) {
  // --- shared sky / lights ---
  scene.clearColor = new BABYLON.Color4(0.06, 0.07, 0.12, 1);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogColor = new BABYLON.Color3(0.08, 0.09, 0.14);
  scene.fogDensity = 0.010;

  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.7;
  hemi.groundColor = C(0.10, 0.12, 0.18);
  const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.3, -1, -0.2), scene);
  sun.intensity = 1.05; sun.diffuse = C(0.85, 0.90, 1.0);
  const glow = new BABYLON.GlowLayer('glow', scene); glow.intensity = 0.9;

  // Sky dome (exempt).
  const sky = facetedSphere(scene, 'mmbSky', 200, 2);
  sky.flipFaces(true);
  sky.material = mat(scene, 'mmbSkyMat', C(0.06, 0.07, 0.12), { emissive: C(0.05, 0.06, 0.10) });
  sky.material.disableLighting = true; sky.isPickable = false;

  // --- arena (phase 1 + phase 3) ---
  const arenaRoot = new BABYLON.TransformNode('mmbArenaRoot', scene);
  const arenaR = spec.arenaRadius || 28;
  const arenaFloor = manySidedCylinder(scene, 'mmbArenaFloor', { diameter: arenaR * 2, height: 0.6, tess: 48 });
  arenaFloor.position.y = -0.3; arenaFloor.parent = arenaRoot;
  arenaFloor.material = mat(scene, 'mmbArenaFloorMat', C(0.14, 0.16, 0.22), { glossy: true });

  // Glowing trace rings on the floor.
  const traceMat = mat(scene, 'mmbTrace', C(0.85, 0.20, 0.30), { emissive: C(0.85, 0.18, 0.25) });
  for (let i = 1; i <= 3; i++) {
    const ring = BABYLON.MeshBuilder.CreateTorus('mmbRing' + i, {
      diameter: (i / 3) * arenaR * 1.6, thickness: 0.10, tessellation: 48,
    }, scene);
    ring.position.y = 0.04; ring.parent = arenaRoot;
    ring.material = traceMat; ring.isPickable = false;
  }

  // A ring of console pillars around the back half (it's a spaceship).
  const pillarMat = mat(scene, 'mmbPillar', C(0.30, 0.32, 0.40), { glossy: true });
  for (let i = -7; i <= 7; i++) {
    const a = (i / 16) * Math.PI - Math.PI / 2;
    const x = Math.cos(a) * (arenaR - 1.4);
    const z = Math.sin(a) * (arenaR - 1.4);
    const p = manySidedCylinder(scene, 'mmbPillar' + i, { diameter: 1.4, height: 3.0, tess: 40 });
    p.parent = arenaRoot; p.position.set(x, 1.5, z);
    p.material = pillarMat; p.isPickable = false;
  }

  // --- staircase (phase 3) ---
  // Data12 F6: "thers stairs that lead up to mmb you climb th stairs and stomp
  // on mb." A flight of 40-sided steps climbing to ~giant-MMB head height.
  // Visually it's stairs; functionally mmbLevel.js registers a ladder
  // climb-zone over it (player.js) so MB ascends and can stomp from the top.
  const st = spec.stairs || { pos: [0, 0, 0], height: 5.0, steps: 9, width: 3.2 };
  const stairsRoot = new BABYLON.TransformNode('mmbStairsRoot', scene);
  stairsRoot.position.set(st.pos[0], 0, st.pos[2]);
  const stepMat = mat(scene, 'mmbStepMat', C(0.34, 0.37, 0.46), { glossy: true });
  const stepRise = st.height / st.steps;
  const stepDepth = 0.7;
  for (let i = 0; i < st.steps; i++) {
    const step = manySidedCylinder(scene, 'mmbStep' + i, { diameter: st.width, height: stepRise + 0.04, tess: 40 });
    step.parent = stairsRoot;
    // Tier them upward and slightly back so they read as a climbable flight.
    step.position.set(0, stepRise * (i + 0.5), i * stepDepth);
    step.scaling.x = 1 - i * (0.5 / st.steps);   // taper toward a peak
    step.material = stepMat;
    step.isPickable = false;
  }
  // A glowing top landing so the player can see where to leap from.
  const landing = manySidedCylinder(scene, 'mmbStairTop', { diameter: st.width * 0.6, height: 0.18, tess: 40 });
  landing.parent = stairsRoot;
  landing.position.set(0, st.height + 0.1, (st.steps - 0.5) * stepDepth);
  landing.material = mat(scene, 'mmbStairTopMat', C(0.95, 0.80, 0.25), { emissive: C(0.85, 0.65, 0.12) });
  landing.isPickable = false;
  stairsRoot.setEnabled(false);   // revealed in phase 3

  // --- corridor (phase 2 race) ---
  const corridorRoot = new BABYLON.TransformNode('mmbCorridorRoot', scene);
  // Long rectangular floor, oriented forward along -Z (matches MB's natural
  // forward facing per yaw = π).
  const len = spec.raceLength || 80;
  const wid = (spec.raceWidth || 10) * 2;
  const trackFloor = BABYLON.MeshBuilder.CreateBox('mmbTrack', {
    width: wid, height: 0.4, depth: len,
  }, scene);
  trackFloor.position.set(0, -0.2, -(len / 2 + 4));   // pushed back from the arena
  trackFloor.parent = corridorRoot;
  trackFloor.material = mat(scene, 'mmbTrackMat', C(0.18, 0.20, 0.26), { glossy: true });

  // Side rails — two long boxes flanking the track.
  for (const sx of [-1, 1]) {
    const rail = BABYLON.MeshBuilder.CreateBox('mmbRail' + sx, {
      width: 0.4, height: 1.2, depth: len,
    }, scene);
    rail.position.set(sx * (wid / 2 + 0.2), 0.5, -(len / 2 + 4));
    rail.parent = corridorRoot;
    rail.material = mat(scene, 'mmbRailMat', C(0.32, 0.34, 0.42), { glossy: true });
  }

  // Finish-line arch at the far end of the corridor.
  const finishZ = -(len + 4);
  const archMat = mat(scene, 'mmbArch', C(0.85, 0.85, 0.95), { emissive: C(0.75, 0.78, 0.95), glossy: true });
  for (const sx of [-1, 1]) {
    const post = manySidedCylinder(scene, 'finishPost' + sx, { diameter: 0.5, height: 4.0, tess: 40 });
    post.parent = corridorRoot;
    post.position.set(sx * (wid / 2 - 0.5), 2.0, finishZ);
    post.material = archMat;
  }
  const beam = BABYLON.MeshBuilder.CreateBox('finishBeam', { width: wid - 1, height: 0.4, depth: 0.3 }, scene);
  beam.parent = corridorRoot; beam.position.set(0, 4.2, finishZ);
  beam.material = archMat;

  // Apple King — a faceted apple in a tiny spaceship visible past the finish.
  const appleKingRoot = new BABYLON.TransformNode('appleKing', scene);
  appleKingRoot.parent = corridorRoot;
  appleKingRoot.position.set(0, 3.5, finishZ - 7);
  const apple = facetedSphere(scene, 'appleBody', 1.4, 2);
  apple.scaling.y = 1.05; apple.parent = appleKingRoot;
  apple.material = mat(scene, 'appleMat', C(0.85, 0.18, 0.22), { glossy: true, emissive: C(0.35, 0.05, 0.08) });
  const crown = decoPoly(scene, 'appleCrown', 0.5, 2);
  crown.parent = appleKingRoot; crown.position.y = 1.4;
  crown.material = mat(scene, 'appleCrownMat', C(1.0, 0.85, 0.20), { emissive: C(0.85, 0.6, 0.10) });
  const stem = manySidedCylinder(scene, 'appleStem', { diameter: 0.12, height: 0.6, tess: 12 });
  stem.parent = appleKingRoot; stem.position.y = 1.0;
  stem.material = mat(scene, 'appleStemMat', C(0.30, 0.20, 0.10));
  // tiny spaceship saucer underneath
  const saucer = manySidedCylinder(scene, 'appleSaucer', { diameter: 4.2, height: 0.35, tess: 40 });
  saucer.parent = appleKingRoot; saucer.position.y = -1.0;
  saucer.material = mat(scene, 'appleSaucerMat', C(0.55, 0.58, 0.66), { glossy: true });
  scene.onBeforeRenderObservable.add(() => {
    if (!appleKingRoot.isEnabled()) return;
    appleKingRoot.rotation.y += 0.004;
    appleKingRoot.position.y = 3.5 + Math.sin(performance.now() * 0.0012) * 0.18;
  });

  // The death wall — a glowing red plane that spans the corridor width.
  // mmbLevel.js drives its z position during the race.
  const wall = BABYLON.MeshBuilder.CreateBox('mmbWall', { width: wid + 2, height: 6, depth: 0.3 }, scene);
  wall.parent = corridorRoot;
  wall.position.set(0, 3, 6);    // starts just behind the arena entrance
  const wallMat = mat(scene, 'mmbWallMat', C(1.0, 0.10, 0.18), { emissive: C(1.0, 0.10, 0.18) });
  wallMat.alpha = 0.85;
  wall.material = wallMat;

  // Corridor hidden by default; mmbLevel.js enables it for the race.
  corridorRoot.setEnabled(false);

  // --- portal (rescue) ---
  const portal = BABYLON.MeshBuilder.CreateTorus('mmbPortal', {
    diameter: 4.2, thickness: 0.6, tessellation: 40,
  }, scene);
  portal.position.set(0, 2.6, -arenaR + 4);
  portal.rotation.x = Math.PI / 2;
  portal.material = mat(scene, 'mmbPortalMat', C(0.20, 0.45, 0.95), { emissive: C(0.15, 0.40, 0.85) });
  portal.setEnabled(false);
  scene.onBeforeRenderObservable.add(() => { if (portal.isEnabled()) portal.rotation.y += 0.02; });

  return {
    R: arenaR,
    arenaRoot, corridorRoot, stairsRoot,
    floor: arenaFloor,
    trackFloor,
    appleKing: appleKingRoot,
    finishZ,
    laserWall: wall,
    portal,
    groundY: 0,
  };
}
