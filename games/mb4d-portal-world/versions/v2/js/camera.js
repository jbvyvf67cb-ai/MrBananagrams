// v2 camera: locked BEHIND MB, follows MB's yaw automatically (no mouse orbit).
// Spec: "camra is beihind mb". The camera no longer takes mouse input — turning
// is done with W/D, which rotates MB; this update slides the camera to sit a
// few units behind whatever direction MB is facing.

const FOLLOW_DIST = 8.5;
const HEIGHT = 4.0;
const LOOK_AHEAD = 1.4;
const POS_LERP = 0.18;   // smoothing — higher = snappier
const TGT_LERP = 0.30;

export function createCamera(scene, _canvas, target, player) {
  const cam = new BABYLON.UniversalCamera('cam', new BABYLON.Vector3(0, HEIGHT, FOLLOW_DIST), scene);
  cam.minZ = 0.1;
  cam.fov = 0.95;

  // No user input — controls are W/D + arrows.
  // (Intentionally NOT calling attachControl.)

  scene.onBeforeRenderObservable.add(() => {
    // Desired position: FOLLOW_DIST behind MB along the OPPOSITE of facing.
    const fx = Math.sin(player.yaw), fz = Math.cos(player.yaw);
    const tx = target.position.x - fx * FOLLOW_DIST;
    const tz = target.position.z - fz * FOLLOW_DIST;
    cam.position.x += (tx - cam.position.x) * POS_LERP;
    cam.position.z += (tz - cam.position.z) * POS_LERP;
    cam.position.y += (HEIGHT - cam.position.y) * POS_LERP;
    // Look slightly ahead of MB so the world reads forward-facing.
    const look = new BABYLON.Vector3(
      target.position.x + fx * LOOK_AHEAD,
      target.position.y + 1.2,
      target.position.z + fz * LOOK_AHEAD
    );
    cam.setTarget(BABYLON.Vector3.Lerp(cam.getTarget(), look, TGT_LERP));
  });

  return cam;
}
