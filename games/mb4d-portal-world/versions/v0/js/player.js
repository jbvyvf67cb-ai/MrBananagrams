import { keys } from './input.js';

const MOVE_SPEED = 6.5;
const JUMP_VELOCITY = 7.5;
const GROUND_CHECK_DIST = 0.25;

export function createPlayer(scene) {
  const mesh = BABYLON.MeshBuilder.CreateCapsule('player',
    { radius: 0.45, height: 1.7, tessellation: 12 }, scene);
  mesh.position.set(0, 3, 0);

  const mat = new BABYLON.StandardMaterial('playerMat', scene);
  mat.diffuseColor = new BABYLON.Color3(0.97, 0.86, 0.20);
  mat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.05);
  mesh.material = mat;

  const aggregate = new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.CAPSULE,
    { mass: 1, restitution: 0, friction: 0.4 }, scene);
  // Lock rotation so the capsule never tips over from collisions.
  aggregate.body.setMassProperties({ inertia: BABYLON.Vector3.ZeroReadOnly });

  return { mesh, body: aggregate.body };
}

export function updatePlayer(player, camera, scene) {
  const forward = camera.getForwardRay().direction.clone();
  forward.y = 0;
  if (forward.lengthSquared() < 1e-6) forward.set(0, 0, 1);
  forward.normalize();
  const right = BABYLON.Vector3.Cross(forward, BABYLON.Axis.Y).normalize();

  const wish = BABYLON.Vector3.Zero();
  if (keys.has('KeyW') || keys.has('ArrowUp'))    wish.addInPlace(forward);
  if (keys.has('KeyS') || keys.has('ArrowDown'))  wish.subtractInPlace(forward);
  if (keys.has('KeyD') || keys.has('ArrowRight')) wish.addInPlace(right);
  if (keys.has('KeyA') || keys.has('ArrowLeft'))  wish.subtractInPlace(right);

  if (wish.lengthSquared() > 0) {
    wish.normalize().scaleInPlace(MOVE_SPEED);
  }

  const v = player.body.getLinearVelocity();
  const next = new BABYLON.Vector3(wish.x, v.y, wish.z);
  if (keys.has('Space') && isGrounded(player, scene)) {
    next.y = JUMP_VELOCITY;
  }
  player.body.setLinearVelocity(next);
}

function isGrounded(player, scene) {
  const origin = player.mesh.position.clone();
  origin.y -= 0.85;
  const ray = new BABYLON.Ray(origin, new BABYLON.Vector3(0, -1, 0), GROUND_CHECK_DIST);
  const hit = scene.pickWithRay(ray, (m) => m !== player.mesh);
  return !!(hit && hit.hit);
}
