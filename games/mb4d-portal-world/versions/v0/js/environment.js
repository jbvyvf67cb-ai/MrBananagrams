export function buildEnvironment(scene) {
  scene.clearColor = new BABYLON.Color4(0.32, 0.18, 0.42, 1);
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogColor = new BABYLON.Color3(0.32, 0.18, 0.42);
  scene.fogDensity = 0.012;

  const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
  hemi.intensity = 0.55;
  hemi.groundColor = new BABYLON.Color3(0.2, 0.1, 0.3);

  const sun = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.4, -1, -0.3), scene);
  sun.intensity = 0.9;
  sun.position = new BABYLON.Vector3(30, 40, 20);

  const ground = BABYLON.MeshBuilder.CreateBox('ground', { width: 100, depth: 100, height: 1 }, scene);
  ground.position.y = -0.5;
  const groundMat = new BABYLON.StandardMaterial('groundMat', scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.38, 0.55, 0.32);
  groundMat.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
  ground.material = groundMat;
  new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.BOX, { mass: 0, friction: 0.6 }, scene);

  scatterDecorations(scene);
  buildPortalMarker(scene);
}

function scatterDecorations(scene) {
  const factories = [
    () => BABYLON.MeshBuilder.CreateGoldberg('deco', { m: 2, n: 1, size: 1.4 }, scene),
    () => BABYLON.MeshBuilder.CreateIcoSphere('deco', { radius: 1.4, subdivisions: 2 }, scene),
    () => BABYLON.MeshBuilder.CreatePolyhedron('deco', { type: 6, size: 1.4 }, scene),
    () => BABYLON.MeshBuilder.CreatePolyhedron('deco', { type: 10, size: 1.6 }, scene),
  ];
  const palette = [
    new BABYLON.Color3(0.78, 0.42, 0.85),
    new BABYLON.Color3(0.45, 0.78, 0.72),
    new BABYLON.Color3(0.95, 0.72, 0.30),
    new BABYLON.Color3(0.55, 0.50, 0.92),
  ];
  for (let i = 0; i < 16; i++) {
    const mesh = factories[i % factories.length]();
    mesh.name = 'deco-' + i;
    const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.4;
    const r = 8 + Math.random() * 26;
    mesh.position.set(Math.cos(angle) * r, 1.4 + Math.random() * 1.2, Math.sin(angle) * r);
    mesh.rotation.y = Math.random() * Math.PI;

    const mat = new BABYLON.StandardMaterial('decoMat-' + i, scene);
    mat.diffuseColor = palette[i % palette.length];
    mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    mesh.material = mat;

    new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.CONVEX_HULL,
      { mass: 0, friction: 0.5, restitution: 0.4 }, scene);
  }
}

function buildPortalMarker(scene) {
  // Visual nod to the purple portal MB jumps through. Not interactive yet.
  const torus = BABYLON.MeshBuilder.CreateTorus('portal', { diameter: 4, thickness: 0.55, tessellation: 40 }, scene);
  torus.position.set(0, 2.2, -14);
  torus.rotation.x = Math.PI / 2;
  const mat = new BABYLON.StandardMaterial('portalMat', scene);
  mat.diffuseColor = new BABYLON.Color3(0.55, 0.25, 0.95);
  mat.emissiveColor = new BABYLON.Color3(0.4, 0.15, 0.75);
  torus.material = mat;
  new BABYLON.PhysicsAggregate(torus, BABYLON.PhysicsShapeType.MESH,
    { mass: 0, friction: 0.4 }, scene);
}
