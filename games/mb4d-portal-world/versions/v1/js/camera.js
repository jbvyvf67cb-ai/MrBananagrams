// Third-person orbit-follow camera (same family as v0). Tracks the player;
// the player can drag to orbit and wheel to zoom. Movement is camera-relative.
export function createCamera(scene, canvas, target) {
  const cam = new BABYLON.ArcRotateCamera('cam', -Math.PI / 2, Math.PI / 2.7, 13, target.position.clone(), scene);
  cam.attachControl(canvas, true);
  cam.lowerBetaLimit = 0.4;
  cam.upperBetaLimit = Math.PI / 2.15;
  cam.lowerRadiusLimit = 7;
  cam.upperRadiusLimit = 24;
  cam.wheelDeltaPercentage = 0.02;
  cam.angularSensibilityX = 1800;
  cam.angularSensibilityY = 1800;
  cam.inertia = 0.7;
  cam.fov = 0.95;

  scene.onBeforeRenderObservable.add(() => {
    // Smoothly chase the player's position without fighting user orbit input.
    BABYLON.Vector3.LerpToRef(cam.target, target.position, 0.18, cam.target);
  });
  return cam;
}
