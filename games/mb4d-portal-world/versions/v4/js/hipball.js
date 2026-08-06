// Hipball mini-game — Level 1 opener. MB4-style ballgame played in a side-view
// ortho camera on the same court used for the boss fight. Per Data5 spec, MB's
// strikes are renamed and tuned (no more peels):
//     Z = crunch  (horizontal smash; ball gains horizontal + arc)
//     X = slam    (downward drive)
//     C = hip     (upward lob — the only shot at the back hoop)
// First to 3 rayas wins.
//
// Note: trainer AI uses the same strike set. Court coords: long axis = Z;
// MB plays on +Z side, trainer on -Z side. "Forward" = -Z.

import { CFG } from './config.js';
import { mat, C, facetedSphere } from './geometry.js';

const COURT_HALF = 11;
const SIDELINE = 7;
const BALL_FRICTION = 0.985;

export function createHipballScene(scene) {
  const opp = makeFigure(scene, 'opp', C(0.78, 0.32, 0.30));
  opp.root.position.set(0, 0, -8);
  opp.root.rotation.y = 0;

  const ball = facetedSphere(scene, 'hbBall', CFG.hipball.ballRadius, 2);
  ball.material = mat(scene, 'hbBallMat', C(0.92, 0.18, 0.14), { glossy: true });
  ball.position.set(0, 6, 0);

  const shadow = BABYLON.MeshBuilder.CreateDisc('hbBallShadow', { radius: 0.55, tessellation: 24 }, scene);
  shadow.rotation.x = Math.PI / 2;
  shadow.material = mat(scene, 'hbShadow', C(0, 0, 0));
  shadow.material.alpha = 0.45;

  return {
    scene,
    ball, shadow, opp,
    ballVel: new BABYLON.Vector3(0, 0, 0),
    rayas: [0, 0],
    strikeCd: 0,
    scoreCd: CFG.hipball.scoreCooldown,
    opponentStrikeCd: 0,
    winner: null,
    serveSide: 1,
    paused: 0,
  };
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

export function setEnabled(state, on) {
  state.ball.setEnabled(on);
  state.shadow.setEnabled(on);
  state.opp.root.setEnabled(on);
}

// Returns 'mb' / 'opponent' / null on match end.
export function updateHipball(state, dt, player, input, hud) {
  movePlayerHipball(player, dt, input);
  updateOpponent(state, dt);

  state.strikeCd = Math.max(0, state.strikeCd - dt);
  if (state.paused <= 0 && state.strikeCd === 0) {
    if (input.pressed('hbCrunch')) tryStrike(state, player, 'crunch', 'mb');
    if (input.pressed('hbSlam'))   tryStrike(state, player, 'slam',   'mb');
    if (input.pressed('hbHip'))    tryStrike(state, player, 'hip',    'mb');
  }

  state.scoreCd = Math.max(0, state.scoreCd - dt);
  if (state.paused > 0) {
    state.paused -= dt;
    if (state.paused <= 0) {
      const dir = state.serveSide;
      state.ball.position.set(0, 5, 6 * dir);
      state.ballVel.set(0, 2, -3 * dir);
      state.scoreCd = CFG.hipball.scoreCooldown;
    }
  } else {
    state.ballVel.y -= CFG.hipball.gravity * dt;
    state.ball.position.addInPlace(state.ballVel.scale(dt));
    state.ballVel.x *= BALL_FRICTION;
    state.ballVel.z *= BALL_FRICTION;

    if (state.ball.position.y <= CFG.hipball.ballRadius) {
      state.ball.position.y = CFG.hipball.ballRadius;
      if (state.scoreCd === 0) {
        scorePoint(state, hud);
      } else {
        state.ballVel.y = -state.ballVel.y * CFG.hipball.ballRestitution;
        if (Math.abs(state.ballVel.y) < 1.5) state.ballVel.y = 0;
      }
    }
    if (state.ball.position.z > COURT_HALF - CFG.hipball.ballRadius) {
      state.ball.position.z = COURT_HALF - CFG.hipball.ballRadius;
      state.ballVel.z = -Math.abs(state.ballVel.z) * CFG.hipball.ballRestitution;
    }
    if (state.ball.position.z < -COURT_HALF + CFG.hipball.ballRadius) {
      state.ball.position.z = -COURT_HALF + CFG.hipball.ballRadius;
      state.ballVel.z = Math.abs(state.ballVel.z) * CFG.hipball.ballRestitution;
    }
    if (Math.abs(state.ball.position.x) > SIDELINE) {
      state.ball.position.x = Math.sign(state.ball.position.x) * SIDELINE;
      state.ballVel.x = -state.ballVel.x * CFG.hipball.ballRestitution;
    }
  }

  state.shadow.position.set(state.ball.position.x, 0.04, state.ball.position.z);
  const shrink = Math.max(0.35, Math.min(1, 1 - state.ball.position.y * 0.05));
  state.shadow.scaling.set(shrink, shrink, shrink);
  state.ball.rotation.x += state.ballVel.length() * dt * 0.4;
  state.ball.rotation.y += state.ballVel.length() * dt * 0.4;

  hud.setRayas(state.rayas[0], state.rayas[1], CFG.hipball.rayasToWin);
  if (state.winner) return state.winner;
  return null;
}

function movePlayerHipball(player, dt, input) {
  player.yaw = Math.PI;
  let vz = 0;
  if (input.down('hbLeft'))  vz =  CFG.hipball.mbSpeed;
  if (input.down('hbRight')) vz = -CFG.hipball.mbSpeed;
  player.vel.x = 0; player.vel.z = vz;

  if (input.pressed('hbJump') && player.grounded) {
    player.vel.y = CFG.hipball.jumpV; player.grounded = false;
  }
  player.vel.y -= 22 * dt;

  player.root.position.x = 0;
  player.root.position.y += player.vel.y * dt;
  player.root.position.z += vz * dt;
  if (player.root.position.y <= 0) { player.root.position.y = 0; player.vel.y = 0; player.grounded = true; }
  if (player.root.position.z < 1.0) player.root.position.z = 1.0;
  if (player.root.position.z > COURT_HALF - 1) player.root.position.z = COURT_HALF - 1;
  player.root.rotation.y = player.yaw;
}

function updateOpponent(state, dt) {
  const opp = state.opp;
  let targetZ = state.ball.position.z;
  if (targetZ > -1.0) targetZ = -1.0;
  if (targetZ < -COURT_HALF + 1) targetZ = -COURT_HALF + 1;
  const dz = targetZ - opp.root.position.z;
  if (Math.abs(dz) > 0.05) {
    opp.root.position.z += Math.sign(dz) * Math.min(Math.abs(dz), CFG.hipball.opponentSpeed * dt);
  }
  opp.root.position.x = 0;

  state.opponentStrikeCd = Math.max(0, state.opponentStrikeCd - dt);
  const dist = Math.hypot(state.ball.position.z - opp.root.position.z, state.ball.position.y - 1.2);
  if (state.paused <= 0 && dist < CFG.hipball.strikeRange && state.opponentStrikeCd === 0 && state.ballVel.z < 1) {
    let style;
    if (state.ball.position.y > 2.6) style = 'hip';        // lob
    else if (state.ball.position.y < 1.4) style = 'slam';  // downward
    else style = 'crunch';                                 // horizontal
    tryStrikeAt(state, opp.root.position, style, 'opponent');
    state.opponentStrikeCd = 0.6;
  }
}

function tryStrike(state, player, style, who) {
  const pos = player.root.position;
  const dist = Math.hypot(state.ball.position.z - pos.z, state.ball.position.y - 1.2);
  if (dist > CFG.hipball.strikeRange) return false;
  tryStrikeAt(state, pos, style, who);
  state.strikeCd = CFG.hipball.strikeCooldown;
  return true;
}

function tryStrikeAt(state, pos, style, who) {
  const dirZ = (who === 'mb') ? -1 : 1;
  const s = CFG.hipball.strikes[style];
  state.ballVel.set(0, s.vy, s.vz * dirZ);
  state.scoreCd = CFG.hipball.scoreCooldown;
  state.ball.position.y = Math.max(state.ball.position.y, 1.0);
}

function scorePoint(state, hud) {
  const landedOnMBSide = state.ball.position.z > 0;
  const scorer = landedOnMBSide ? 'opponent' : 'mb';
  if (scorer === 'mb') {
    state.rayas[0]++; state.serveSide = -1;
    hud.banner('RAYA! +1 MB', 1200);
  } else {
    state.rayas[1]++; state.serveSide = 1;
    hud.banner('Trainer scored — ' + state.rayas[1] + ' / ' + CFG.hipball.rayasToWin, 1200);
  }
  if (state.rayas[0] >= CFG.hipball.rayasToWin) state.winner = 'mb';
  else if (state.rayas[1] >= CFG.hipball.rayasToWin) state.winner = 'opponent';
  state.paused = 1.0;
  state.ballVel.set(0, 0, 0);
}

export function disposeHipball(state) {
  state.ball.dispose();
  state.shadow.dispose();
  state.opp.root.dispose();
}
