// Hipball mini-game — Level 1 opener, per Q2 (hybrid). MB4-style ballgame
// played in a side-view ortho camera, on the same 3D court we use for the boss
// fight. Simplified vs MB4: first to 3 rayas wins (vs MB4's 8), trainer AI is
// straightforward, ball physics are manual (no Havok).
//
// Court coords: long axis = Z. MB's half is z > 0; opponent's half is z < 0.
// "Forward" (toward opponent) = -Z; "back" = +Z.

import { CFG } from './config.js';
import { mat, C, facetedSphere } from './geometry.js';

const COURT_HALF = 11;       // distance from center to back wall along Z
const SIDELINE = 7;          // X clamp — keep play in front of the camera plane
const BALL_RADIUS = 0.55;
const GRAVITY = 22;
const BALL_FRICTION = 0.985;  // horizontal drag
const BALL_RESTITUTION = 0.78;
const STRIKE_RANGE = 1.9;
const STRIKE_COOLDOWN = 0.4;
const SCORE_COOLDOWN = 0.6;   // grace after a strike before a touchdown scores
const RAYAS_TO_WIN = 3;

const OPPONENT_SPEED = 5.5;
const MB_SPEED_HIPBALL = 7.5;
const JUMP_V = 7.2;

export function createHipballScene(scene) {
  // Opponent: ruddy faceted figure on the -Z side (the "trainer").
  const opp = makeFigure(scene, 'opp', C(0.78, 0.32, 0.30));
  opp.root.position.set(0, 0, -8);
  opp.root.rotation.y = 0;   // faces +Z (toward MB)

  // Ball: red bouncy icosphere, manual physics.
  const ball = facetedSphere(scene, 'hbBall', BALL_RADIUS, 2);
  ball.material = mat(scene, 'hbBallMat', C(0.92, 0.18, 0.14), { glossy: true });
  resetBall(ball);

  // Shadow under the ball (a black disc).
  const shadow = BABYLON.MeshBuilder.CreateDisc('hbBallShadow', { radius: 0.55, tessellation: 24 }, scene);
  shadow.rotation.x = Math.PI / 2;
  shadow.material = mat(scene, 'hbShadow', C(0, 0, 0));
  shadow.material.alpha = 0.45;

  const state = {
    scene,
    ball, shadow, opp,
    ballVel: new BABYLON.Vector3(0, 0, 0),
    rayas: [0, 0],          // [MB, opponent]
    strikeCd: 0,
    scoreCd: SCORE_COOLDOWN,
    opponentStrikeCd: 0,
    winner: null,
    serveSide: 1,           // +1 = MB serves, -1 = opponent serves
    paused: 0,              // pause timer between points
  };
  state.opp = opp;
  return state;
}

function makeFigure(scene, name, color) {
  const root = new BABYLON.TransformNode(name, scene);
  const m = mat(scene, name + 'Mat', color, { glossy: true });
  const body = facetedSphere(scene, name + 'Body', 0.6, 2);
  body.scaling.y = 1.25; body.position.y = 0.78; body.parent = root; body.material = m;
  const head = facetedSphere(scene, name + 'Head', 0.42, 2);
  head.position.y = 1.55; head.parent = root; head.material = m;
  return { root, body, height: 1.9 };
}

function resetBall(ball) {
  ball.position.set(0, 6, 0);
}

export function setEnabled(state, on) {
  state.ball.setEnabled(on);
  state.shadow.setEnabled(on);
  state.opp.root.setEnabled(on);
}

// Update Hipball for one frame. Returns winner string when match ends:
// 'mb' if MB wins, 'opponent' if opponent wins, null otherwise.
export function updateHipball(state, dt, player, input, hud) {
  // Clamp player to MB's half + sidelines and run hipball movement.
  movePlayerHipball(player, dt, input);

  // Opponent AI.
  updateOpponent(state, dt);

  // MB's strikes.
  state.strikeCd = Math.max(0, state.strikeCd - dt);
  if (state.paused <= 0 && state.strikeCd === 0) {
    if (input.pressed('hbHip'))   tryStrike(state, player, 'hip',   'mb');
    if (input.pressed('hbKnee'))  tryStrike(state, player, 'knee',  'mb');
    if (input.pressed('hbElbow')) tryStrike(state, player, 'elbow', 'mb');
  }

  // Ball physics.
  state.scoreCd = Math.max(0, state.scoreCd - dt);
  if (state.paused > 0) {
    state.paused -= dt;
    if (state.paused <= 0) {
      // Serve.
      const dir = state.serveSide;
      state.ball.position.set(0, 5, 6 * dir);
      state.ballVel.set(0, 2, -3 * dir);  // toss toward the server's facing
      state.scoreCd = SCORE_COOLDOWN;
    }
  } else {
    state.ballVel.y -= GRAVITY * dt;
    state.ball.position.addInPlace(state.ballVel.scale(dt));
    state.ballVel.x *= BALL_FRICTION;
    state.ballVel.z *= BALL_FRICTION;

    // Ground bounce.
    if (state.ball.position.y <= BALL_RADIUS) {
      state.ball.position.y = BALL_RADIUS;
      if (state.scoreCd === 0) {
        // First ground touch after grace period: score.
        scorePoint(state, hud);
      } else {
        state.ballVel.y = -state.ballVel.y * BALL_RESTITUTION;
        if (Math.abs(state.ballVel.y) < 1.5) state.ballVel.y = 0;
      }
    }

    // Bounce off back walls in Z.
    if (state.ball.position.z > COURT_HALF - BALL_RADIUS) {
      state.ball.position.z = COURT_HALF - BALL_RADIUS; state.ballVel.z = -Math.abs(state.ballVel.z) * BALL_RESTITUTION;
    }
    if (state.ball.position.z < -COURT_HALF + BALL_RADIUS) {
      state.ball.position.z = -COURT_HALF + BALL_RADIUS; state.ballVel.z = Math.abs(state.ballVel.z) * BALL_RESTITUTION;
    }
    if (Math.abs(state.ball.position.x) > SIDELINE) {
      state.ball.position.x = Math.sign(state.ball.position.x) * SIDELINE;
      state.ballVel.x = -state.ballVel.x * BALL_RESTITUTION;
    }
  }

  // Shadow follows ball x,z on the floor.
  state.shadow.position.set(state.ball.position.x, 0.04, state.ball.position.z);
  const shrink = Math.max(0.35, Math.min(1, 1 - state.ball.position.y * 0.05));
  state.shadow.scaling.set(shrink, shrink, shrink);

  // Spin the ball for character.
  state.ball.rotation.x += state.ballVel.length() * dt * 0.4;
  state.ball.rotation.y += state.ballVel.length() * dt * 0.4;

  hud.setRayas(state.rayas[0], state.rayas[1], RAYAS_TO_WIN);

  if (state.winner) return state.winner;
  return null;
}

function movePlayerHipball(player, dt, input) {
  // Hipball uses a fixed facing for MB (face -Z toward opponent).
  player.yaw = Math.PI;
  const vx = 0;  // no X movement in Hipball — court runs along Z, side view
  let vz = 0;
  if (input.down('hbLeft'))  vz =  MB_SPEED_HIPBALL;   // step back (+Z)
  if (input.down('hbRight')) vz = -MB_SPEED_HIPBALL;   // step forward (-Z)
  player.vel.x = vx;
  player.vel.z = vz;

  // Jump.
  if (input.pressed('hbJump') && player.grounded) {
    player.vel.y = JUMP_V; player.grounded = false;
  }
  player.vel.y -= 22 * dt;

  player.root.position.x = 0;   // pin to court midline
  player.root.position.y += player.vel.y * dt;
  player.root.position.z += vz * dt;
  if (player.root.position.y <= 0) { player.root.position.y = 0; player.vel.y = 0; player.grounded = true; }
  // Clamp MB to his half of the court.
  if (player.root.position.z < 1.0) player.root.position.z = 1.0;
  if (player.root.position.z > COURT_HALF - 1) player.root.position.z = COURT_HALF - 1;
  player.root.rotation.y = player.yaw;
}

function updateOpponent(state, dt) {
  const opp = state.opp;
  const ballZ = state.ball.position.z;
  const ballY = state.ball.position.y;

  // Drift toward ball Z, but stay on opponent's half.
  let targetZ = ballZ;
  if (targetZ > -1.0) targetZ = -1.0;
  if (targetZ < -COURT_HALF + 1) targetZ = -COURT_HALF + 1;
  const dz = targetZ - opp.root.position.z;
  if (Math.abs(dz) > 0.05) {
    opp.root.position.z += Math.sign(dz) * Math.min(Math.abs(dz), OPPONENT_SPEED * dt);
  }
  opp.root.position.x = 0;

  state.opponentStrikeCd = Math.max(0, state.opponentStrikeCd - dt);
  const dist = Math.hypot(ballZ - opp.root.position.z, ballY - 1.2);
  if (state.paused <= 0 && dist < STRIKE_RANGE && state.opponentStrikeCd === 0 && state.ballVel.z < 1) {
    // Choose a style based on ball height.
    let style;
    if (ballY > 2.6) style = 'elbow';
    else if (ballY < 1.4) style = 'knee';
    else style = 'hip';
    tryStrikeAt(state, opp.root.position, style, 'opponent');
    state.opponentStrikeCd = 0.6;
  }
}

function tryStrike(state, player, style, who) {
  const pos = player.root.position;
  const dist = Math.hypot(state.ball.position.z - pos.z, state.ball.position.y - 1.2);
  if (dist > STRIKE_RANGE) return false;
  tryStrikeAt(state, pos, style, who);
  state.strikeCd = STRIKE_COOLDOWN;
  return true;
}

function tryStrikeAt(state, pos, style, who) {
  // Direction: send ball toward the opposing half (sign of Z flips by who).
  const dirZ = (who === 'mb') ? -1 : 1;
  let vz, vy;
  if (style === 'hip')   { vz = 11 * dirZ; vy = 4.5; }
  if (style === 'knee')  { vz = 13 * dirZ; vy = -1.5; }
  if (style === 'elbow') { vz = 9  * dirZ; vy = 9; }
  state.ballVel.set(0, vy, vz);
  state.scoreCd = SCORE_COOLDOWN;
  state.ball.position.y = Math.max(state.ball.position.y, 1.0);
}

function scorePoint(state, hud) {
  // Ball just touched the ground past the grace period — whoever's half it
  // landed on loses the point.
  const landedOnMBSide = state.ball.position.z > 0;
  const scorer = landedOnMBSide ? 'opponent' : 'mb';
  if (scorer === 'mb') {
    state.rayas[0]++;
    state.serveSide = -1;   // opponent serves next
    hud.banner('RAYA! +1 for MB', 1200);
  } else {
    state.rayas[1]++;
    state.serveSide = 1;
    hud.banner('Opponent scored — ' + state.rayas[1] + ' / ' + RAYAS_TO_WIN, 1200);
  }
  if (state.rayas[0] >= RAYAS_TO_WIN) state.winner = 'mb';
  else if (state.rayas[1] >= RAYAS_TO_WIN) state.winner = 'opponent';
  state.paused = 1.0;
  state.ballVel.set(0, 0, 0);
}

export function disposeHipball(state) {
  state.ball.dispose();
  state.shadow.dispose();
  state.opp.root.dispose();
}
