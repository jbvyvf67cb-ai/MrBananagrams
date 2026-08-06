// v3 cameras — two of them, switched by phase.
//
// 1) "chase" — perspective camera locked behind MB, follows yaw (v2 behaviour).
// 2) "side"  — orthographic side view of the Hipball court, MB4-style framing.
//
// main.js swaps scene.activeCamera when the phase changes.

const FOLLOW_DIST = 8.5;
const FOLLOW_HEIGHT = 4.0;
const LOOK_AHEAD = 1.4;
const POS_LERP = 0.18;
const TGT_LERP = 0.30;

export function createCameras(scene, engine, target, player) {
  const chase = new BABYLON.UniversalCamera('chase', new BABYLON.Vector3(0, FOLLOW_HEIGHT, FOLLOW_DIST), scene);
  chase.minZ = 0.1;
  chase.fov = 0.95;
  scene.onBeforeRenderObservable.add(() => {
    if (scene.activeCamera !== chase) return;
    const fx = Math.sin(player.yaw), fz = Math.cos(player.yaw);
    const tx = target.position.x - fx * FOLLOW_DIST;
    const tz = target.position.z - fz * FOLLOW_DIST;
    chase.position.x += (tx - chase.position.x) * POS_LERP;
    chase.position.z += (tz - chase.position.z) * POS_LERP;
    chase.position.y += (FOLLOW_HEIGHT - chase.position.y) * POS_LERP;
    const look = new BABYLON.Vector3(
      target.position.x + fx * LOOK_AHEAD,
      target.position.y + 1.2,
      target.position.z + fz * LOOK_AHEAD
    );
    chase.setTarget(BABYLON.Vector3.Lerp(chase.getTarget(), look, TGT_LERP));
  });

  // Side-view ortho camera for Hipball. Looks toward -X at the court whose long
  // axis runs along Z: MB on +Z (right of screen), opponent on -Z (left).
  const side = new BABYLON.UniversalCamera('side', new BABYLON.Vector3(40, 8, 0), scene);
  side.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
  side.minZ = 0.1;
  side.setTarget(new BABYLON.Vector3(0, 4, 0));

  function refitOrtho() {
    const aspect = engine.getRenderWidth() / engine.getRenderHeight();
    const H = 11;
    side.orthoTop = H;
    side.orthoBottom = -3;
    side.orthoLeft = -H * aspect;
    side.orthoRight = H * aspect;
  }
  refitOrtho();
  window.addEventListener('resize', refitOrtho);

  return { chase, side, refitOrtho };
}
