export function createBall(scene) {
  const mesh = BABYLON.MeshBuilder.CreateIcoSphere('ball',
    { radius: 0.6, subdivisions: 2 }, scene);
  mesh.position.set(4, 4, 2);

  const mat = new BABYLON.StandardMaterial('ballMat', scene);
  mat.diffuseColor = new BABYLON.Color3(0.85, 0.22, 0.18);
  mat.specularColor = new BABYLON.Color3(0.25, 0.1, 0.1);
  mesh.material = mat;

  const aggregate = new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.SPHERE,
    { mass: 0.5, restitution: 0.85, friction: 0.35 }, scene);

  return { mesh, body: aggregate.body };
}
