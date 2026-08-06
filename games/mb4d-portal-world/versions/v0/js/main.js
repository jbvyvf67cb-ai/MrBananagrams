import { initInput } from './input.js';
import { buildEnvironment } from './environment.js';
import { createThirdPersonCamera } from './camera.js';
import { createPlayer, updatePlayer } from './player.js';
import { createBall } from './ball.js';

const canvas = document.getElementById('renderCanvas');
const statusEl = document.getElementById('status');

const engine = new BABYLON.Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
});
const scene = new BABYLON.Scene(engine);

initInput();

async function start() {
  statusEl.textContent = 'Loading Havok physics…';
  const havokInstance = await HavokPhysics();
  const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);
  scene.enablePhysics(new BABYLON.Vector3(0, -18, 0), havokPlugin);

  buildEnvironment(scene);
  const player = createPlayer(scene);
  const camera = createThirdPersonCamera(scene, canvas, player.mesh);
  const ball = createBall(scene);

  scene.onBeforeRenderObservable.add(() => {
    updatePlayer(player, camera, scene);
    respawnIfFallen(player, new BABYLON.Vector3(0, 3, 0));
    respawnIfFallen(ball, new BABYLON.Vector3(4, 5, 2));
  });

  statusEl.textContent = 'Ready — WASD to move, Space to jump, drag to orbit camera';
  setTimeout(() => statusEl.classList.add('fade'), 2400);

  engine.runRenderLoop(() => scene.render());
  window.addEventListener('resize', () => engine.resize());
}

function respawnIfFallen(obj, spawn) {
  if (obj.mesh.position.y < -20) {
    obj.body.setLinearVelocity(BABYLON.Vector3.Zero());
    obj.body.setAngularVelocity(BABYLON.Vector3.Zero());
    obj.mesh.position.copyFrom(spawn);
  }
}

start().catch((err) => {
  statusEl.textContent = 'Failed to load: ' + err.message;
  console.error(err);
});
