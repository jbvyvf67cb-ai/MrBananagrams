export function createThirdPersonCamera(scene, canvas, targetMesh) {
  const camera = new BABYLON.ArcRotateCamera(
    'cam',
    -Math.PI / 2,
    Math.PI / 2.6,
    9,
    targetMesh.position.clone(),
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerBetaLimit = 0.35;
  camera.upperBetaLimit = Math.PI / 2.15;
  camera.lowerRadiusLimit = 4;
  camera.upperRadiusLimit = 18;
  camera.wheelDeltaPercentage = 0.02;
  camera.angularSensibilityX = 1600;
  camera.angularSensibilityY = 1600;
  camera.inertia = 0.7;

  scene.onBeforeRenderObservable.add(() => {
    camera.target.copyFrom(targetMesh.position);
  });

  return camera;
}
