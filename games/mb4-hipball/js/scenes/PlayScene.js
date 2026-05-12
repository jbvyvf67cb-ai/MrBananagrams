// ============================================================
//  PLAY SCENE — the match. 2.5D court, two players, one ball.
//  Single-player: AI drives p2. Local: numpad drives p2.
//  Multiplayer: inputs relayed via PartyKit; clients run identical sim.
// ============================================================
'use strict';

class PlayScene extends Phaser.Scene {
  constructor() { super('Play'); }

  init(data) {
    this.mode = data.mode || 'sp';
    this.difficulty = data.difficulty || 'normal';
    this.role = data.role || 'host';
    this.roomCode = data.roomCode || '';
  }

  create() {
    const C = MB4.COLOR;
    this._drawBackdrop();
    this._drawFloor();

    this.match = {
      score: [0, 0],
      streak: [0, 0],
      onFire: [false, false],
      pointInProgress: true,
      ended: false,
    };

    this.players = [
      this._makePlayer(0, MB4.COURT_LEFT + 180, 1),
      this._makePlayer(1, MB4.COURT_RIGHT - 180, -1),
    ];
    this.players[0].side = 'left';
    this.players[1].side = 'right';

    this.ball = this._makeBall(480, 0.5);

    if (this.mode === 'sp') this.bot = AI4.freshBotState();
    if (this.mode === 'mp') this._wireNetForMatch();

    this._buildHud();

    this.scoreFX = this.add.container(0, 0);
    this.shake = { until: 0, mag: 0 };
    this.hitstop = { until: 0 };
    this.announcerText = this.add.text(MB4.GAME_W / 2, 100, '', {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '64px',
      color: '#fff4c8',
      stroke: '#8a1a1a',
      strokeThickness: 10,
    }).setOrigin(0.5).setAlpha(0).setDepth(1000);

    Input4.setupTouch();
    Audio4.resume();

    this._showRallyStart();
  }

  // ---------------- BACKDROP ----------------
  _drawBackdrop() {
    const W = MB4.GAME_W, H = MB4.GAME_H, C = MB4.COLOR;
    const sky = this.add.graphics();
    sky.fillGradientStyle(C.skyTop, C.skyTop, C.skyMid, C.skyMid, 1, 1, 1, 1);
    sky.fillRect(0, 0, W, 200);
    sky.fillGradientStyle(C.skyMid, C.skyMid, C.skyBot, C.skyBot, 1, 1, 1, 1);
    sky.fillRect(0, 200, W, 110);

    const sun = this.add.graphics();
    sun.fillStyle(C.sun, 0.85); sun.fillCircle(480, 200, 50);
    sun.fillStyle(C.sun, 0.15); sun.fillCircle(480, 200, 90);

    const wall = this.add.graphics();
    const backLeft  = MB4.COURT_LEFT  + MB4.FLOOR_PERSPECTIVE_INSET;
    const backRight = MB4.COURT_RIGHT - MB4.FLOOR_PERSPECTIVE_INSET;
    const wallTop = 200;
    const wallBot = MB4.FLOOR_BACK_Y;
    wall.fillStyle(C.stoneMid, 1);
    wall.fillRect(backLeft, wallTop, backRight - backLeft, wallBot - wallTop);
    wall.fillStyle(C.stoneDk, 1);
    wall.fillRect(backLeft, wallTop, backRight - backLeft, 4);
    for (let i = 0; i < 14; i++) {
      const x = backLeft + 30 + i * 50;
      if (x > backRight - 30) break;
      this.add.image(x, wallTop + 22, 'glyph_' + (i % 4)).setOrigin(0.5).setScale(0.7);
    }

    // One stone hoop, mounted at center of the back wall, ring vertical and
    // facing the camera. Players shoot the ball horizontally THROUGH the ring.
    {
      const hx = MB4.HOOP_X;
      const hy = MB4.HOOP_Y;
      // Backing disc — colored like the sky so the "hole" reads as a real opening
      const skyDisc = this.add.graphics();
      skyDisc.fillStyle(C.skyTop, 1);
      skyDisc.fillEllipse(hx, hy, 18, 38);
      // The ring sprite itself
      this.hoopSprite = this.add.image(hx, hy, 'hoop').setOrigin(0.5).setScale(1.0).setDepth(5);
      // Subtle accent: shadow under the hoop on the wall
      const hoopShadow = this.add.graphics();
      hoopShadow.fillStyle(0x000000, 0.25);
      hoopShadow.fillEllipse(hx + 4, hy + 4, 38, 62);
      hoopShadow.setDepth(4);
    }

    const sides = this.add.graphics();
    sides.fillStyle(C.stoneMid, 1);
    sides.fillRect(0, 200, MB4.COURT_LEFT, MB4.FLOOR_FRONT_Y - 200);
    sides.fillRect(MB4.COURT_RIGHT, 200, MB4.GAME_W - MB4.COURT_RIGHT, MB4.FLOOR_FRONT_Y - 200);
    sides.fillStyle(C.stoneDk, 1);
    sides.fillRect(0, 200, MB4.COURT_LEFT, 4);
    sides.fillRect(MB4.COURT_RIGHT, 200, MB4.GAME_W - MB4.COURT_RIGHT, 4);
  }

  _drawFloor() {
    const C = MB4.COLOR;
    const g = this.add.graphics();
    const frontL = MB4.COURT_LEFT;
    const frontR = MB4.COURT_RIGHT;
    const backL  = MB4.COURT_LEFT  + MB4.FLOOR_PERSPECTIVE_INSET;
    const backR  = MB4.COURT_RIGHT - MB4.FLOOR_PERSPECTIVE_INSET;
    g.fillStyle(C.stoneLt, 1);
    g.beginPath();
    g.moveTo(frontL, MB4.FLOOR_FRONT_Y);
    g.lineTo(frontR, MB4.FLOOR_FRONT_Y);
    g.lineTo(backR,  MB4.FLOOR_BACK_Y);
    g.lineTo(backL,  MB4.FLOOR_BACK_Y);
    g.closePath();
    g.fillPath();

    g.lineStyle(2, C.stoneDk, 0.45);
    for (let d = 0; d <= 1; d += 0.2) {
      const y = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * d;
      const lx = frontL + (backL - frontL) * d;
      const rx = frontR + (backR - frontR) * d;
      g.beginPath(); g.moveTo(lx, y); g.lineTo(rx, y); g.strokePath();
    }
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      const fx = frontL + (frontR - frontL) * t;
      const bx = backL  + (backR  - backL ) * t;
      g.beginPath(); g.moveTo(fx, MB4.FLOOR_FRONT_Y); g.lineTo(bx, MB4.FLOOR_BACK_Y); g.strokePath();
    }
    g.lineStyle(3, C.glyphAccent, 0.7);
    const cFx = (frontL + frontR) / 2;
    const cBx = (backL + backR) / 2;
    g.beginPath(); g.moveTo(cFx, MB4.FLOOR_FRONT_Y); g.lineTo(cBx, MB4.FLOOR_BACK_Y); g.strokePath();
  }

  _makePlayer(idx, x, facing) {
    const key = idx === 0 ? 'p1_idle' : 'p2_idle';
    const sprite = this.add.image(x, MB4.FLOOR_FRONT_Y - 24, key).setOrigin(0.5, 1);
    sprite.setDepth(100);
    const shadow = this.add.image(x, MB4.FLOOR_FRONT_Y, 'shadow').setOrigin(0.5).setDepth(50);
    return {
      idx, x, y: MB4.FLOOR_FRONT_Y - 24,
      vx: 0, vy: 0,
      depth: 0.3, vDepth: 0,
      height: 0, vHeight: 0,
      facing, onGround: true,
      sprite, shadow,
      strikeCooldownUntil: 0,
      currentPose: 'idle',
      poseUntil: 0,
    };
  }

  _makeBall(x, depth) {
    const sprite = this.add.image(x, MB4.FLOOR_FRONT_Y, 'ball').setOrigin(0.5).setDepth(80);
    const shadow = this.add.image(x, MB4.FLOOR_FRONT_Y, 'shadow').setOrigin(0.5).setDepth(40);
    return {
      x, prevX: x, y: MB4.FLOOR_FRONT_Y,
      vx: 0, vy: 0, depth, vDepth: 0,
      height: 0, vHeight: 0,
      sprite, shadow,
      lastTouchedBy: null, airborne: false,
    };
  }

  _buildHud() {
    const W = MB4.GAME_W;
    const ss = {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '48px', color: '#fff4c8',
      stroke: '#4a1c2a', strokeThickness: 6,
    };
    this.hud = {};
    this.hud.scoreP1 = this.add.text(20, 12, '0', ss).setDepth(900);
    this.hud.scoreP2 = this.add.text(W - 60, 12, '0', ss).setDepth(900);
    this.hud.toGo = this.add.text(W / 2, 16, 'FIRST TO ' + MB4.WIN_SCORE, {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '20px', color: '#fde375',
      stroke: '#4a1c2a', strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(900);
    this.hud.fireP1 = this.add.text(90, 30, '', { fontSize: '28px' }).setDepth(900);
    this.hud.fireP2 = this.add.text(W - 110, 30, '', { fontSize: '28px' }).setDepth(900).setOrigin(1, 0);
  }

  _updateHud() {
    const FIRE3 = '\u{1F525}\u{1F525}\u{1F525}';
    const FIRE1 = '\u{1F525}';
    this.hud.scoreP1.setText(String(this.match.score[0]));
    this.hud.scoreP2.setText(String(this.match.score[1]));
    this.hud.fireP1.setText(this.match.onFire[0] ? FIRE3 : (this.match.streak[0] >= MB4.STREAK_TO_TRAIL ? FIRE1 : ''));
    this.hud.fireP2.setText(this.match.onFire[1] ? FIRE3 : (this.match.streak[1] >= MB4.STREAK_TO_TRAIL ? FIRE1 : ''));
  }

  _showRallyStart() {
    this.match.pointInProgress = false;
    this._resetPositions();
    const W = MB4.GAME_W;
    const t = this.add.text(W / 2, 240, 'READY?', {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '88px',
      color: '#fff4c8',
      stroke: '#8a1a1a',
      strokeThickness: 10,
    }).setOrigin(0.5).setDepth(1000);
    this.tweens.add({
      targets: t,
      scale: { from: 0.6, to: 1.2 },
      alpha: { from: 1, to: 0 },
      duration: 700,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        t.setText('PLAY!').setScale(0.6).setAlpha(1);
        this.tweens.add({
          targets: t,
          scale: 1.4, alpha: 0,
          duration: 500, ease: 'Cubic.easeOut',
          onComplete: () => { t.destroy(); this.match.pointInProgress = true; },
        });
      },
    });
    Audio4.announceStab(0.8);
  }

  _resetPositions() {
    this.players[0].x = MB4.COURT_LEFT + 180;
    this.players[0].depth = 0.3;
    this.players[0].height = 0; this.players[0].vHeight = 0;
    this.players[0].vx = 0; this.players[0].facing = 1; this.players[0].onGround = true;
    this.players[1].x = MB4.COURT_RIGHT - 180;
    this.players[1].depth = 0.3;
    this.players[1].height = 0; this.players[1].vHeight = 0;
    this.players[1].vx = 0; this.players[1].facing = -1; this.players[1].onGround = true;
    this.ball.x = 480;
    this.ball.prevX = 480;
    this.ball.depth = 0.5; this.ball.height = 80; this.ball.vHeight = 0;
    this.ball.vx = (Math.random() < 0.5 ? -1 : 1) * 60;
    this.ball.vDepth = 0;
    this.ball.lastTouchedBy = null; this.ball.airborne = true;
  }

  update(time, delta) {
    const dt = Math.min(delta, 32) / 1000;

    Input4.tick();
    const inHitstop = time < this.hitstop.until;

    if (this.mode === 'sp') {
      AI4.tick(this.bot, {
        now: time,
        ball: this.ball,
        player: this.players[1],
        opponent: this.players[0],
        difficulty: this.difficulty,
      });
    }

    if (!this.match.ended && this.match.pointInProgress && !inHitstop) {
      this._updatePlayer(this.players[0], this._inputForPlayer(0), dt, time);
      this._updatePlayer(this.players[1], this._inputForPlayer(1), dt, time);
      this._updateBall(dt, time);
      this._checkStrikes(time);
      this._checkScoring(time);
    }

    this._syncSprites();

    if (time < this.shake.until) {
      const m = this.shake.mag;
      this.cameras.main.setScroll(
        (Math.random() - 0.5) * m,
        (Math.random() - 0.5) * m,
      );
    } else {
      this.cameras.main.setScroll(0, 0);
    }

    this._updateHud();

    // Clear one-shot remote edge flags (consume after this frame)
    if (this._remoteInput) {
      this._remoteInput.jumpPressed = false;
      this._remoteInput.hipPressed = false;
      this._remoteInput.kneePressed = false;
      this._remoteInput.elbowPressed = false;
    }
  }

  _inputForPlayer(idx) {
    if (this.mode === 'sp')    return idx === 0 ? Input4.p1 : this.bot.input;
    if (this.mode === 'local') return idx === 0 ? Input4.p1 : Input4.p2;
    // mp: host sends from p1, guest sends from p2. Locally we drive p1 with
    // own input; remote peer's input controls p2.
    if (this.role === 'host')
      return idx === 0 ? Input4.p1 : (this._remoteInput || Input4.freshInput());
    else
      return idx === 0 ? (this._remoteInput || Input4.freshInput()) : Input4.p1;
  }

  _updatePlayer(p, inp, dt, time) {
    let ax = 0;
    if (inp.left)  ax -= MB4.MOVE_ACCEL;
    if (inp.right) ax += MB4.MOVE_ACCEL;
    p.vx += ax * dt;
    if (Math.abs(ax) < 1)
      p.vx *= (p.onGround ? MB4.MOVE_FRICTION_GROUND : MB4.MOVE_FRICTION_AIR);
    p.vx = Math.max(-MB4.MOVE_MAX, Math.min(MB4.MOVE_MAX, p.vx));
    p.x += p.vx * dt;

    if (inp.left && !inp.right) p.facing = -1;
    else if (inp.right && !inp.left) p.facing = 1;
    else if (Math.abs(p.vx) < 10) p.facing = this.ball.x >= p.x ? 1 : -1;

    let aDepth = 0;
    if (inp.back) aDepth -= MB4.DEPTH_SPEED;
    if (inp.fwd)  aDepth += MB4.DEPTH_SPEED;
    p.depth = Math.max(0, Math.min(1, p.depth + aDepth * dt));

    if (inp.jumpPressed && p.onGround) {
      p.vHeight = MB4.JUMP_POWER;
      p.onGround = false;
      Audio4.jump();
    }
    p.vHeight -= MB4.GRAVITY * dt;
    p.height += p.vHeight * dt;
    if (p.height <= 0) {
      if (!p.onGround && p.vHeight < -100) Audio4.land();
      p.height = 0; p.vHeight = 0; p.onGround = true;
    }

    p.x = Math.max(MB4.COURT_LEFT + 20, Math.min(MB4.COURT_RIGHT - 20, p.x));

    let pose = 'idle';
    if (!p.onGround) pose = 'jump';
    else if (Math.abs(p.vx) > 20) pose = 'run';
    if (time < p.poseUntil) pose = p.currentPose;
    p.currentPose = pose;
    const prefix = p.idx === 0 ? 'p1_' : 'p2_';
    p.sprite.setTexture(prefix + pose);
    p.sprite.setFlipX(p.facing < 0);
  }

  _updateBall(dt, time) {
    const b = this.ball;
    // Remember last-frame X so _checkScoring can detect hoop pass-through.
    b.prevX = b.x;
    if (b.height <= 1) {
      b.vx *= MB4.BALL.groundFriction;
      b.vDepth *= MB4.BALL.groundFriction;
    } else {
      b.vx *= MB4.BALL.airFriction;
      b.vDepth *= MB4.BALL.airFriction;
    }
    const sp = Math.hypot(b.vx, b.vDepth * 500);
    if (sp > MB4.BALL.maxSpeed) {
      const k = MB4.BALL.maxSpeed / sp;
      b.vx *= k; b.vDepth *= k;
    }
    b.vHeight -= MB4.BALL.gravity * dt;
    b.height += b.vHeight * dt;
    b.x += b.vx * dt;
    b.depth = Math.max(0, Math.min(1, b.depth + b.vDepth * dt));
    if (b.height <= 0) {
      b.height = 0;
      if (b.vHeight < -MB4.BALL.minBounceVHeight) {
        b.vHeight = -b.vHeight * MB4.BALL.bounceDamp;
      } else {
        b.vHeight = 0;
        b.airborne = false;
      }
    }
  }

  _syncSprites() {
    for (const p of this.players) this._syncPlayerSprite(p);
    this._syncBallSprite();
  }

  _syncPlayerSprite(p) {
    const floorY = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * p.depth;
    const screenY = floorY - p.height;
    const screenX = this._perspectiveX(p.x, p.depth);
    const scale = 1 - 0.3 * p.depth;
    p.sprite.setPosition(screenX, screenY).setScale(scale);
    p.sprite.setDepth(200 + Math.floor(p.depth * 10));
    p.shadow.setPosition(screenX, floorY).setScale(scale, scale * 0.6);
    p.shadow.setAlpha(0.6 - 0.4 * (p.height / 200));
  }

  _syncBallSprite() {
    const b = this.ball;
    const floorY = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * b.depth;
    const screenY = floorY - b.height;
    const screenX = this._perspectiveX(b.x, b.depth);
    const scale = (1 - 0.3 * b.depth) * (1 + 0.05 * (b.height / 200));
    b.sprite.setPosition(screenX, screenY).setScale(scale);
    b.shadow.setPosition(screenX, floorY).setScale(scale * 0.7, scale * 0.5);
    b.shadow.setAlpha(0.7 - 0.5 * (b.height / 250));
    b.sprite.setRotation(b.sprite.rotation + 0.04 * Math.sign(b.vx) * Math.max(0.5, Math.min(3, Math.abs(b.vx) / 200)));
  }

  _perspectiveX(x, depth) {
    const inset = MB4.FLOOR_PERSPECTIVE_INSET * depth;
    const t = (x - MB4.COURT_LEFT) / (MB4.COURT_RIGHT - MB4.COURT_LEFT);
    return (MB4.COURT_LEFT + inset) + t * ((MB4.COURT_RIGHT - inset) - (MB4.COURT_LEFT + inset));
  }

  _checkStrikes(time) {
    for (const p of this.players) {
      const inp = this._inputForPlayer(p.idx);
      if (time < p.strikeCooldownUntil) continue;
      let strikeType = null;
      if (inp.hipPressed)        strikeType = 'hip';
      else if (inp.kneePressed)  strikeType = 'knee';
      else if (inp.elbowPressed) strikeType = 'elbow';
      if (!strikeType) continue;
      const cfg = MB4.STRIKES[strikeType];
      p.strikeCooldownUntil = time + cfg.cooldownMs;
      p.currentPose = strikeType;
      p.poseUntil = time + 220;
      const hbX = p.x + p.facing * cfg.hitboxOffsetX;
      const hbY = -cfg.hitboxOffsetY + p.height;
      const hbDepth = p.depth;
      const dx = this.ball.x - hbX;
      const dDepth = this.ball.depth - hbDepth;
      const dHeight = this.ball.height - hbY;
      const inX = Math.abs(dx) < cfg.hitboxW;
      const inDepth = Math.abs(dDepth) < 0.22;
      const inHeight = Math.abs(dHeight) < cfg.hitboxH + 14;
      const facingMatches = (this.ball.x - p.x) * p.facing >= -10;
      if (inX && inDepth && inHeight && facingMatches) {
        this._connectStrike(p, strikeType, cfg, time);
      } else {
        Audio4.miss();
      }
    }
  }

  _connectStrike(p, strikeType, cfg, time) {
    const b = this.ball;
    b.vx = p.facing * cfg.ballVX;
    b.vHeight = cfg.ballVHeight;
    b.vDepth = (Math.random() - 0.5) * 0.4;
    if (cfg.ballVY) b.vHeight += -cfg.ballVY * 0.3;
    b.lastTouchedBy = p.idx;
    b.airborne = true;

    // ---- Aim assist (elbow only) ----
    // Elbow is your hoop shot. We blend the raw launch velocity toward a
    // velocity that would carry the ball through the hoop on a sensible arc.
    // The assist is strongest when the player is roughly facing the hoop and
    // not point-blank under it.
    if (strikeType === 'elbow' && cfg.aimAssistStrength > 0) {
      const launchX = p.x;
      const launchHeight = p.height + 30;
      // Convert HOOP_Y (screen-Y at back wall) to a "world height above floor"
      // for the back-wall depth. We want: floorY_atBack - distHy = HOOP_Y.
      const floorYatBack = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * MB4.HOOP_DEPTH;
      const distHy = floorYatBack - MB4.HOOP_Y;   // how high above the back-wall floor the hoop sits
      const distX = MB4.HOOP_X - launchX;
      const facingRight = p.facing > 0;
      const hoopIsToRight = distX > 0;
      const aimedAtHoop = facingRight === hoopIsToRight;
      const farEnough = Math.abs(distX) > cfg.aimAssistMinDist;
      if (aimedAtHoop && farEnough) {
        const T = 0.85;
        const g = MB4.BALL.gravity;
        const ideal_vx = distX / T;
        const ideal_vHeight = (distHy - launchHeight + 0.5 * g * T * T) / T;
        const k = cfg.aimAssistStrength;
        b.vx       = b.vx       * (1 - k) + ideal_vx       * k;
        b.vHeight  = b.vHeight  * (1 - k) + ideal_vHeight  * k;
        const idealVDepth = (MB4.HOOP_DEPTH - b.depth) / T;
        b.vDepth = b.vDepth * (1 - k) + idealVDepth * k;
      }
    }

    this.match.streak[p.idx]++;
    this.match.streak[1 - p.idx] = 0;
    if (this.match.streak[p.idx] >= MB4.STREAK_TO_FIRE && !this.match.onFire[p.idx]) {
      this.match.onFire[p.idx] = true;
      this.match.onFire[1 - p.idx] = false;
      Audio4.onFire();
      this._announce('ON FIRE!', 1.3);
    }
    if (this.match.onFire[p.idx]) {
      b.vx *= 1.25;
      b.vHeight *= 1.10;
    }

    if (strikeType === 'hip')   Audio4.hip();
    if (strikeType === 'knee')  Audio4.knee();
    if (strikeType === 'elbow') Audio4.elbow();

    const intensity = strikeType === 'elbow' ? 1.0 : strikeType === 'hip' ? 0.7 : 0.55;
    this.hitstop.until = time + 80 * intensity;
    this.shake.until = time + 220;
    this.shake.mag = 8 * intensity;

    const phrases = cfg.announce;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    if (Math.random() < 0.55 || strikeType === 'elbow') this._announce(phrase, intensity);

    this._spawnStrikeFlash(p, strikeType);
    if (this.match.onFire[p.idx]) this._spawnFlameBurst(p);

    // Power-up architecture stub — wire applyPowerUp() here later.
    // TODO: educational unlock spawns
  }

  _spawnStrikeFlash(p, strikeType) {
    const cfg = MB4.STRIKES[strikeType];
    const floorY = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * p.depth;
    const screenY = floorY - p.height + cfg.hitboxOffsetY;
    const screenX = this._perspectiveX(p.x + p.facing * cfg.hitboxOffsetX, p.depth);
    const flash = this.add.image(screenX, screenY, 'strike_flash')
      .setOrigin(0.5).setTint(0xfde375).setDepth(500);
    this.tweens.add({
      targets: flash,
      scaleX: 2.4, scaleY: 1.6,
      alpha: 0, duration: 180,
      onComplete: () => flash.destroy(),
    });
  }

  _spawnFlameBurst(p) {
    const floorY = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * p.depth;
    const screenY = floorY - p.height - 16;
    const screenX = this._perspectiveX(p.x, p.depth);
    for (let i = 0; i < 12; i++) {
      const angle = (Math.random() - 0.5) * Math.PI;
      const sp = 80 + Math.random() * 160;
      const fl = this.add.image(screenX, screenY, 'flame').setDepth(600);
      this.tweens.add({
        targets: fl,
        x: screenX + Math.cos(angle) * sp * 0.6,
        y: screenY + Math.sin(angle) * sp * 0.6 - 40,
        scale: { from: 1.2, to: 0.2 },
        alpha: { from: 1, to: 0 },
        duration: 380 + Math.random() * 200,
        onComplete: () => fl.destroy(),
      });
    }
  }

  _announce(text, intensity) {
    intensity = intensity || 1;
    this.announcerText.setText(text);
    this.announcerText.setScale(0.4 + 0.6 * intensity).setAlpha(1);
    this.tweens.killTweensOf(this.announcerText);
    this.tweens.add({
      targets: this.announcerText,
      scale: 1.2 + 0.3 * intensity,
      duration: 220,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: this.announcerText,
          alpha: 0, duration: 480, delay: 320,
        });
      },
    });
    Audio4.announceStab(intensity);
  }

  _checkScoring(time) {
    const b = this.ball;
    // Hoop pass-through: the ball must be at the back-wall depth, near the
    // hoop's Y on screen, and have actually CROSSED the ring's X plane in
    // this frame (not just be lingering near it). prevX is tracked in
    // _updateBall so we have last-frame ball.x to compare against.
    if (MB4.HOOP_INSTAWIN && b.lastTouchedBy !== null && b.depth > 0.85) {
      const floorY = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * b.depth;
      const screenY = floorY - b.height;
      const dy = screenY - MB4.HOOP_Y;
      // dy must fit within the vertical opening of the ring
      if (Math.abs(dy) < MB4.HOOP_RADIUS_V - 2) {
        // crossed the hoop's X this frame?
        const prevSide = (b.prevX - MB4.HOOP_X);
        const currSide = (b.x - MB4.HOOP_X);
        if (prevSide * currSide < 0) {
          return this._hoopWin(b.lastTouchedBy);
        }
        // Also catch slow balls that paused inside the ring
        if (Math.abs(currSide) < MB4.HOOP_PASS_THICKNESS && Math.abs(b.vx) < 60) {
          return this._hoopWin(b.lastTouchedBy);
        }
      }
    }
    if (b.x < MB4.COURT_LEFT + 8)  return this._scoreRaya(1, b.x);
    if (b.x > MB4.COURT_RIGHT - 8) return this._scoreRaya(0, b.x);
  }

  _scoreRaya(scorerIdx, hitX) {
    this.match.pointInProgress = false;
    this.match.score[scorerIdx]++;
    this.match.streak[1 - scorerIdx] = 0;
    this.match.onFire[1 - scorerIdx] = false;
    Audio4.score();
    this._announce('RAYA!', 1.0);
    for (let i = 0; i < 14; i++) {
      const sp = this.add.image(hitX, MB4.FLOOR_FRONT_Y - 10 - Math.random() * 80, 'spark').setDepth(700);
      this.tweens.add({
        targets: sp,
        x: sp.x + (Math.random() - 0.5) * 160,
        y: sp.y + (Math.random() - 0.5) * 120 - 40,
        alpha: 0, scale: 0.2, duration: 600,
        onComplete: () => sp.destroy(),
      });
    }
    if (this.match.score[scorerIdx] >= MB4.WIN_SCORE) {
      this._endMatch(scorerIdx, 'rayas');
      return;
    }
    this.time.delayedCall(1200, () => this._showRallyStart());
  }

  _hoopWin(scorerIdx) {
    this.match.pointInProgress = false;
    Audio4.hoopWin();
    this._announce('HOOP! INSTANT WIN!', 1.5);
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sp = this.add.image(this._perspectiveX(this.ball.x, this.ball.depth), MB4.HOOP_Y, 'flame').setDepth(800);
      this.tweens.add({
        targets: sp,
        x: sp.x + Math.cos(angle) * 220,
        y: sp.y + Math.sin(angle) * 220,
        alpha: 0, scale: 0.3, duration: 1000,
        onComplete: () => sp.destroy(),
      });
    }
    this.shake.mag = 16;
    this.shake.until = this.scene.systems.game.loop.time + 700;
    this.time.delayedCall(1800, () => this._endMatch(scorerIdx, 'hoop'));
  }

  _endMatch(winnerIdx, how) {
    this.match.ended = true;
    this.time.delayedCall(800, () => {
      this.scene.start('MatchOver', {
        winner: winnerIdx,
        score: this.match.score.slice(),
        how, mode: this.mode, difficulty: this.difficulty,
      });
    });
  }

  _wireNetForMatch() {
    this._remoteInput = Input4.freshInput();
    Net4.on('input', (m) => this._receivePeerInput(m));
    Net4.on('state', (m) => this._applyServerState(m));
    Net4.on('close', () => {
      this._announce('PEER DISCONNECTED', 1.0);
    });
    this._inputSendTimer = this.time.addEvent({
      delay: 1000 / MB4.MP.TICK_HZ,
      callback: () => Net4.sendInput(Input4.p1),
      loop: true,
    });
  }

  _applyServerState(m) {
    // Reserved for future server-authoritative ball physics.
    // v1 uses peer-relay: both clients run the identical deterministic sim;
    // server just shuffles input frames between them. Drift over a 60s match
    // is well under a hitbox so we accept it. Rollback netcode is future work.
  }

  _receivePeerInput(m) {
    const r = this._remoteInput;
    r.left = !!m.l; r.right = !!m.r; r.fwd = !!m.f; r.back = !!m.b;
    if (m.j) r.jumpPressed = true;
    if (m.h) r.hipPressed  = true;
    if (m.k) r.kneePressed = true;
    if (m.e) r.elbowPressed = true;
  }

  shutdown() {
    if (this._inputSendTimer) this._inputSendTimer.remove(false);
  }
}

window.PlayScene = PlayScene;
