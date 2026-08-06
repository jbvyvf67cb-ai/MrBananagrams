// v7 camera — third-person chase that follows MB's yaw, with optional WASD
// pan around the player and Q to recenter. Per Gameplay B2:
//   "WASD controls camera. q resets camera to follow behind mb."
//
// We track two extra orbit offsets (yawOffset, pitchOffset) that the player
// can add via WASD. They decay toward 0 over a few seconds so the camera
// always drifts back behind MB even without Q.

const FOLLOW_DIST   = 9.0;
const FOLLOW_HEIGHT = 4.2;
const LOOK_AHEAD    = 1.4;
const POS_LERP      = 0.18;
const TGT_LERP      = 0.30;

const PAN_YAW_SPEED   = 1.6;    // rad / s while WASD held
const PAN_PITCH_SPEED = 0.9;
const PITCH_MIN = -0.45, PITCH_MAX = 0.85;
const DECAY = 0.45;             // per second drift back toward 0

export function createCameras(scene, engine, target, player, input) {
  const chase = new BABYLON.UniversalCamera('chase', new BABYLON.Vector3(0, FOLLOW_HEIGHT, FOLLOW_DIST), scene);
  chase.minZ = 0.1; chase.fov = 0.95;

  const state = { yawOff: 0, pitchOff: 0 };

  scene.onBeforeRenderObservable.add(() => {
    if (scene.activeCamera !== chase) return;
    const dt = engine.getDeltaTime() / 1000;

    if (input) {
      if (input.down('camLeft'))  state.yawOff   -= PAN_YAW_SPEED * dt;
      if (input.down('camRight')) state.yawOff   += PAN_YAW_SPEED * dt;
      if (input.down('camUp'))    state.pitchOff += PAN_PITCH_SPEED * dt;
      if (input.down('camDown'))  state.pitchOff -= PAN_PITCH_SPEED * dt;
      if (input.pressed('camReset')) { state.yawOff = 0; state.pitchOff = 0; }
      // Drift back toward 0 so the camera always settles behind MB.
      state.yawOff   *= Math.max(0, 1 - DECAY * dt);
      state.pitchOff *= Math.max(0, 1 - DECAY * dt);
    }
    state.pitchOff = Math.max(PITCH_MIN, Math.min(PITCH_MAX, state.pitchOff));

    const camYaw   = player.yaw + state.yawOff;
    const camPitch = state.pitchOff;
    const dist = FOLLOW_DIST;
    const fx = Math.sin(camYaw), fz = Math.cos(camYaw);
    const horiz = Math.cos(camPitch) * dist;
    const vert  = FOLLOW_HEIGHT + Math.sin(camPitch) * dist;
    const tx = target.position.x - fx * horiz;
    const tz = target.position.z - fz * horiz;

    chase.position.x += (tx - chase.position.x) * POS_LERP;
    chase.position.z += (tz - chase.position.z) * POS_LERP;
    chase.position.y += (vert - chase.position.y) * POS_LERP;

    const look = new BABYLON.Vector3(
      target.position.x + Math.sin(player.yaw) * LOOK_AHEAD,
      target.position.y + 1.2,
      target.position.z + Math.cos(player.yaw) * LOOK_AHEAD,
    );
    chase.setTarget(BABYLON.Vector3.Lerp(chase.getTarget(), look, TGT_LERP));
  });

  return { chase };
}
