// ============================================================
//  BATTLE SCENE  (MB4D v6 — Level 1, per MB4d_Dog_Data6 spec)
//
//  "after you win the ball game then you fight 2 waves of enemys STILL IN
//   THE MB4 GAME then a portal appers a boss jumps out. the boss fight is
//   still 2d in the mb4 game. mb fights the boss on the ball court. mb
//   jumps in to the blue portal ..."
//
//  So this scene runs RIGHT AFTER a won Hipball match, on the same 2.5D
//  stone court. MB fights 2 waves of fruit enemies, then portalprotector,
//  all in 2D using the spec's melee moves:
//      Z = crunch 30   X = slam 32   C = hip 26   stomp (land on head) 20
//      Space = jump, Space+Space = double jump
//  After the boss dies a blue portal opens; walking into it posts
//  {type:'mb4-portal'} to the parent page, which takes over with the 3D
//  arrival + Ford rescue.
// ============================================================
'use strict';

const BATTLE = {
  MB_MAX_HP: 50,                       // "mb has 50hp"
  // v8 (Data7): peel is back, R = "shot peel" 30 damage. The other moves
  // are unchanged from Data6 (crunch / slam / hip / stomp).
  DMG: { crunch: 30, slam: 32, hip: 26, stomp: 20, peel: 30 },
  INVULN_MS: 900,
  PEEL: { speed: 480, life: 1.1, cooldown: 280, range: 28 },
  ENEMY: {
    orange:     { tex: 'fruit_orange',     hp: 100, r: 22, speed: 78, contact: 6, kind: 'chase' },
    grapefruit: { tex: 'fruit_grapefruit', hp: 125, r: 28, speed: 52, contact: 8, kind: 'shooter',
                  shootMs: 2200, fireballDmg: 10, fireballSpeed: 240 },
  },
  // v13 (Data13 Levels F2): the boss is no longer fully silent — once his HP
  // drops "low enough for phase 2" he "shots purpleiepinkie balls at you".
  // ballShootMs/ballSpeed/ballDmg drive that phase-2-only ranged attack; phase
  // 1 is still a pure melee chase (the v9 "cant shot anything" behaviour holds
  // until phase 2 begins).
  BOSS: { tex: 'boss_pp', hp: 1000, r: 60, speed: 46, contact: 10, phase2At: 0.5,
          chargeSpeed: 150, fireballDmg: 12,
          ballShootMs: 1900, ballSpeed: 250, ballDmg: 12, ballSpread: 0.22 },
  STRIKE_RANGE_X: 78,
  STRIKE_RANGE_DEPTH: 0.26,
  CONTACT_X: 46,
  CONTACT_DEPTH: 0.20,
};

class BattleScene extends Phaser.Scene {
  constructor() { super('Battle'); }

  init(data) {
    this.difficulty = data.difficulty || 'normal';
    this.carryScore = data.score || 0;
  }

  create() {
    this._genTextures();
    this._drawBackdrop();
    this._drawFloor();

    this.mb = this._makeMB();
    this.enemies = [];
    this.fireballs = [];
    this.peels = [];          // v8: R = "shot peel" projectiles (Data7 spec)
    this.boss = null;
    this.portal = null;
    this.score = this.carryScore;
    this.waveIdx = 0;
    this.phase = 'intro';     // intro | wave | boss | cleared | portal | dead
    this.contactClock = 0;

    this._buildHud();

    Input4.setupTouch();
    Audio4.resume();
    if (window.Music4) { Music4.init().then(() => Music4.play('match')); }

    this._banner('THEY ATTACK!  Z crunch · X slam · C hip', 2600);
    Audio4.speak('fight', 1.2);
    // Brief beat before wave 1 so the player reads the banner.
    this.time.delayedCall(1400, () => { this.phase = 'wave'; this._spawnWave(0); });
  }

  // ---------------- runtime textures (fruit / boss / fx / portal) ----------------
  _genTextures() {
    const mk = (key, w, h, draw) => {
      if (this.textures.exists(key)) return;
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      draw(g);
      g.generateTexture(key, w, h);
      g.destroy();
    };

    // Fire orange — faceted orange ball with a flame crown.
    mk('fruit_orange', 48, 48, (g) => {
      g.fillStyle(0x7a2a08, 1); g.fillCircle(24, 26, 21);
      g.fillStyle(0xff7a1a, 1); g.fillCircle(24, 26, 18);
      g.fillStyle(0xffae3a, 1); g.fillCircle(19, 21, 7);
      g.fillStyle(0x8a1a1a, 1); g.fillRect(16, 22, 4, 4); g.fillRect(28, 22, 4, 4);  // eyes
      g.fillStyle(0x4a1000, 1); g.fillRect(19, 31, 10, 3);                            // scowl
      g.fillStyle(0xff4a1a, 1);  // flame tuft
      g.fillTriangle(20, 6, 24, 0, 28, 6); g.fillTriangle(15, 9, 18, 3, 22, 9);
    });

    // Blazing grapefruit — bigger, redder, angrier.
    mk('fruit_grapefruit', 60, 60, (g) => {
      g.fillStyle(0x5a0a12, 1); g.fillCircle(30, 32, 27);
      g.fillStyle(0xff3a4a, 1); g.fillCircle(30, 32, 23);
      g.fillStyle(0xff8a6a, 1); g.fillCircle(23, 25, 8);
      g.fillStyle(0x2a0008, 1); g.fillRect(20, 28, 5, 5); g.fillRect(35, 28, 5, 5);
      g.fillStyle(0x2a0008, 1); g.fillRect(24, 40, 12, 3);
      g.fillStyle(0xffae3a, 1);
      g.fillTriangle(24, 8, 30, 0, 36, 8); g.fillTriangle(16, 12, 20, 4, 25, 12);
    });

    // Portalprotector — big purple guardian blob with a glowing core.
    mk('boss_pp', 150, 150, (g) => {
      g.fillStyle(0x2a0a4a, 1); g.fillCircle(75, 78, 66);
      g.fillStyle(0x6a28b0, 1); g.fillCircle(75, 78, 58);
      g.fillStyle(0x9a4ae0, 1); g.fillCircle(75, 70, 40);
      g.fillStyle(0xd8a6ff, 0.9); g.fillCircle(62, 58, 16);            // core glow
      g.fillStyle(0x10001a, 1); g.fillRect(52, 64, 14, 14); g.fillRect(88, 64, 14, 14); // eyes
      g.fillStyle(0xff4ae0, 1); g.fillRect(55, 67, 6, 6); g.fillRect(91, 67, 6, 6);
      g.fillStyle(0x10001a, 1); g.fillRoundedRect(54, 96, 42, 10, 4);  // grimace
      // crown spikes
      g.fillStyle(0x9a4ae0, 1);
      for (let i = 0; i < 5; i++) { const x = 35 + i * 20; g.fillTriangle(x, 22, x + 10, 0, x + 20, 22); }
    });

    // Fireball projectile.
    mk('fireball', 22, 22, (g) => {
      g.fillStyle(0x8a1a1a, 1); g.fillCircle(11, 11, 10);
      g.fillStyle(0xff4a1a, 1); g.fillCircle(11, 11, 7);
      g.fillStyle(0xffae3a, 1); g.fillCircle(9, 9, 3);
    });

    // v13 (Data13 Levels F2): portalprotector's phase-2 "purpleiepinkie balls".
    // A purple-and-pink orb the boss lobs once he drops into phase 2.
    mk('purpleball', 26, 26, (g) => {
      g.fillStyle(0x5a14a0, 1); g.fillCircle(13, 13, 12);
      g.fillStyle(0xb83adf, 1); g.fillCircle(13, 13, 9);
      g.fillStyle(0xff7ad0, 1); g.fillCircle(13, 13, 5);
      g.fillStyle(0xffd0ee, 1); g.fillCircle(10, 10, 2);
    });

    // Peel projectile (v8). A yellow banana arc with a dark inner stripe.
    mk('peel', 24, 14, (g) => {
      g.fillStyle(0x6a3a08, 1); g.fillRoundedRect(0, 5, 24, 4, 3);
      g.fillStyle(0xfde375, 1); g.fillRoundedRect(0, 2, 24, 8, 4);
      g.fillStyle(0xfff19a, 1); g.fillRoundedRect(2, 3, 20, 3, 2);
    });

    // Blue portal ring (the gateway to the 3D world).
    mk('portal_ring', 120, 150, (g) => {
      g.fillStyle(0x123a8a, 1); g.fillEllipse(60, 75, 80, 130);
      g.fillStyle(0x2a6aff, 1); g.fillEllipse(60, 75, 64, 112);
      g.fillStyle(0x0a1838, 1); g.fillEllipse(60, 75, 44, 92);
      g.fillStyle(0x6aa8ff, 0.5); g.fillEllipse(60, 75, 30, 70);
    });
  }

  // ---------------- court (reused look from PlayScene) ----------------
  _drawBackdrop() {
    const W = MB4.GAME_W, C = MB4.COLOR;
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
    wall.fillStyle(C.stoneMid, 1);
    wall.fillRect(backLeft, 200, backRight - backLeft, MB4.FLOOR_BACK_Y - 200);
    wall.fillStyle(C.stoneDk, 1);
    wall.fillRect(backLeft, 200, backRight - backLeft, 4);
    for (let i = 0; i < 14; i++) {
      const x = backLeft + 30 + i * 50;
      if (x > backRight - 30) break;
      this.add.image(x, 222, 'glyph_' + (i % 4)).setOrigin(0.5).setScale(0.7);
    }
    // The signature stone hoop, center back wall.
    this.add.image(MB4.HOOP_X, MB4.HOOP_Y, 'hoop').setOrigin(0.5).setDepth(5);

    const sides = this.add.graphics();
    sides.fillStyle(C.stoneMid, 1);
    sides.fillRect(0, 200, MB4.COURT_LEFT, MB4.FLOOR_FRONT_Y - 200);
    sides.fillRect(MB4.COURT_RIGHT, 200, MB4.GAME_W - MB4.COURT_RIGHT, MB4.FLOOR_FRONT_Y - 200);
  }

  _drawFloor() {
    const C = MB4.COLOR;
    const g = this.add.graphics();
    const fL = MB4.COURT_LEFT, fR = MB4.COURT_RIGHT;
    const bL = MB4.COURT_LEFT + MB4.FLOOR_PERSPECTIVE_INSET;
    const bR = MB4.COURT_RIGHT - MB4.FLOOR_PERSPECTIVE_INSET;
    g.fillStyle(C.stoneLt, 1);
    g.beginPath();
    g.moveTo(fL, MB4.FLOOR_FRONT_Y); g.lineTo(fR, MB4.FLOOR_FRONT_Y);
    g.lineTo(bR, MB4.FLOOR_BACK_Y);  g.lineTo(bL, MB4.FLOOR_BACK_Y);
    g.closePath(); g.fillPath();
    g.lineStyle(2, C.stoneDk, 0.45);
    for (let d = 0; d <= 1; d += 0.2) {
      const y = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * d;
      const lx = fL + (bL - fL) * d, rx = fR + (bR - fR) * d;
      g.beginPath(); g.moveTo(lx, y); g.lineTo(rx, y); g.strokePath();
    }
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      g.beginPath();
      g.moveTo(fL + (fR - fL) * t, MB4.FLOOR_FRONT_Y);
      g.lineTo(bL + (bR - bL) * t, MB4.FLOOR_BACK_Y);
      g.strokePath();
    }
  }

  // ---------------- actors ----------------
  _makeMB() {
    const x = MB4.COURT_LEFT + 160;
    const sprite = this.add.image(x, MB4.FLOOR_FRONT_Y - 24, 'p1_idle').setOrigin(0.5, 1).setDepth(200);
    const shadow = this.add.image(x, MB4.FLOOR_FRONT_Y, 'shadow').setOrigin(0.5).setDepth(50);
    return {
      x, depth: 0.3, height: 0,
      vx: 0, vHeight: 0, facing: 1, growth: 1, shadowScale: 1,
      onGround: true, jumpsUsed: 0,
      hp: BATTLE.MB_MAX_HP, invulnUntil: 0,
      strikeCdUntil: 0, currentPose: 'idle', poseUntil: 0,
      sprite, shadow,
    };
  }

  _spawnWave(idx) {
    // Wave 0: three fire oranges. Wave 1: two oranges + two grapefruits.
    const layout = idx === 0
      ? [['orange', 760, 0.25], ['orange', 700, 0.6], ['orange', 820, 0.45]]
      : [['orange', 740, 0.3], ['orange', 820, 0.7],
         ['grapefruit', 700, 0.5], ['grapefruit', 800, 0.2]];
    for (const [kind, x, depth] of layout) this._spawnEnemy(kind, x, depth);
    this._banner('WAVE ' + (idx + 1) + '  /  2', 1600);
  }

  _spawnEnemy(kind, x, depth) {
    const def = BATTLE.ENEMY[kind];
    const sprite = this.add.image(x, 0, def.tex).setOrigin(0.5, 1).setDepth(180);
    const shadow = this.add.image(x, 0, 'shadow').setOrigin(0.5).setDepth(45);
    this.enemies.push({
      kind, def, x, depth, height: 0, vHeight: 0,
      facing: -1, growth: 1, shadowScale: kind === 'grapefruit' ? 1.35 : 1.05,
      hp: def.hp, maxHp: def.hp, alive: true,
      hitFlashUntil: 0, nextShotAt: this.time.now + (def.shootMs || 2000) * (0.6 + Math.random() * 0.6),
      sprite, shadow,
    });
  }

  _spawnBoss() {
    this.phase = 'boss';
    const x = MB4.HOOP_X, depth = 0.55;
    const sprite = this.add.image(x, 0, 'boss_pp').setOrigin(0.5, 1).setDepth(190);
    const shadow = this.add.image(x, 0, 'shadow').setOrigin(0.5).setDepth(46);
    this.boss = {
      x, depth, height: 0, vHeight: 0,
      facing: -1, growth: 0.05, shadowScale: 2.4, emerging: true,
      hp: BATTLE.BOSS.hp, maxHp: BATTLE.BOSS.hp, alive: true,
      phase2: false, hitFlashUntil: 0, nextShotAt: this.time.now + 2600,
      nextBallAt: this.time.now + 2600,   // v13: first purple-ball lob (phase 2 only)
      sprite, shadow,
    };
    this._banner('⚔  PORTALPROTECTOR  ⚔', 2400);
    Audio4.speak('fight', 1.4);
    this.bossHpWrap.setVisible(true);
  }

  // ---------------- HUD ----------------
  _buildHud() {
    const C = MB4.COLOR;
    this.hpBack = this.add.graphics().setDepth(1200);
    this.hpFill = this.add.graphics().setDepth(1201);
    this.add.text(20, 16, 'MB', {
      fontFamily: '"Black Ops One", sans-serif', fontSize: '18px', color: '#fde375',
      stroke: '#1a0820', strokeThickness: 4,
    }).setDepth(1202);

    this.waveText = this.add.text(MB4.GAME_W - 20, 18, '', {
      fontFamily: '"Black Ops One", sans-serif', fontSize: '18px', color: '#fff4c8',
      stroke: '#1a0820', strokeThickness: 4,
    }).setOrigin(1, 0).setDepth(1202);

    // Boss HP bar (hidden until boss spawns)
    this.bossHpWrap = this.add.container(MB4.GAME_W / 2, 30).setDepth(1202).setVisible(false);
    const bw = 360, bh = 16;
    const bb = this.add.graphics();
    bb.fillStyle(0x1a0820, 0.85); bb.fillRoundedRect(-bw / 2 - 3, -bh / 2 - 3, bw + 6, bh + 6, 4);
    this.bossHpFill = this.add.graphics();
    const bn = this.add.text(0, -22, 'PORTALPROTECTOR', {
      fontFamily: '"Black Ops One", sans-serif', fontSize: '14px', color: '#d8a6ff',
      stroke: '#1a0820', strokeThickness: 4,
    }).setOrigin(0.5);
    this.bossHpWrap.add([bb, this.bossHpFill, bn]);
    this._bossBarW = bw; this._bossBarH = bh;

    this.banner = this.add.text(MB4.GAME_W / 2, 130, '', {
      fontFamily: '"Black Ops One", sans-serif', fontSize: '34px', color: '#fff4c8',
      stroke: '#8a1a1a', strokeThickness: 8, align: 'center',
    }).setOrigin(0.5).setAlpha(0).setDepth(1300);

    this._drawHpBars();
  }

  _drawHpBars() {
    const x = 52, y = 18, w = 180, h = 18;
    this.hpBack.clear();
    this.hpBack.fillStyle(0x1a0820, 0.85);
    this.hpBack.fillRoundedRect(x - 2, y - 2, w + 4, h + 4, 4);
    const frac = Math.max(0, this.mb.hp / BATTLE.MB_MAX_HP);
    this.hpFill.clear();
    this.hpFill.fillStyle(frac > 0.3 ? 0x4ea886 : 0xff4a1a, 1);
    this.hpFill.fillRoundedRect(x, y, w * frac, h, 3);
  }

  _drawBossBar() {
    if (!this.boss) return;
    const frac = Math.max(0, this.boss.hp / this.boss.maxHp);
    const bw = this._bossBarW, bh = this._bossBarH;
    this.bossHpFill.clear();
    this.bossHpFill.fillStyle(this.boss.phase2 ? 0xff4ae0 : 0x9a4ae0, 1);
    this.bossHpFill.fillRoundedRect(-bw / 2, -bh / 2, bw * frac, bh, 3);
  }

  _banner(text, ms) {
    this.banner.setText(text).setAlpha(1).setScale(0.6);
    this.tweens.killTweensOf(this.banner);
    this.tweens.add({ targets: this.banner, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.banner, alpha: 0, delay: ms, duration: 400 });
  }

  // ---------------- projection ----------------
  _perspectiveX(x, depth) {
    const inset = MB4.FLOOR_PERSPECTIVE_INSET * depth;
    const t = (x - MB4.COURT_LEFT) / (MB4.COURT_RIGHT - MB4.COURT_LEFT);
    return (MB4.COURT_LEFT + inset) + t * ((MB4.COURT_RIGHT - inset) - (MB4.COURT_LEFT + inset));
  }
  _floorY(depth) { return MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * depth; }

  _syncActor(a, baseScale) {
    const floorY = this._floorY(a.depth);
    const sx = this._perspectiveX(a.x, a.depth);
    const scale = baseScale * (1 - 0.3 * a.depth) * (a.growth != null ? a.growth : 1);
    const ss = a.shadowScale || 1;
    a.sprite.setPosition(sx, floorY - a.height).setScale((a.facing < 0 ? -1 : 1) * scale, scale);
    a.sprite.setDepth(170 + Math.floor(a.depth * 12));
    a.shadow.setPosition(sx, floorY).setScale(scale * ss, scale * 0.55 * ss);
    a.shadow.setAlpha(0.6 - 0.4 * (a.height / 200));
  }

  // ---------------- main loop ----------------
  update(time, delta) {
    const dt = Math.min(delta, 32) / 1000;
    Input4.tick();

    // 'dead' is paused; 'done' hands control to the portal-fly tweens (we must
    // NOT keep re-syncing MB's sprite or it fights the tween).
    if (this.phase === 'dead' || this.phase === 'done') return;

    this._updateMB(dt, time);
    for (const e of this.enemies) if (e.alive) this._updateEnemy(e, dt, time);
    if (this.boss && this.boss.alive) this._updateBoss(dt, time);
    this._updateFireballs(dt);
    this._updatePeels(dt);

    if (this.phase === 'wave' || this.phase === 'boss') {
      this._mbStrike(time);
      this._mbThrowPeel(time);
      this._stompCheck();
    }

    // Wave / boss progression.
    if (this.phase === 'wave' && this.enemies.every((e) => !e.alive)) {
      if (this.waveIdx === 0) {
        this.waveIdx = 1;
        this.phase = 'intro';
        this.time.delayedCall(900, () => { this.phase = 'wave'; this._spawnWave(1); });
      } else {
        this.phase = 'intro';
        this.time.delayedCall(900, () => this._spawnBoss());
      }
    }

    if (this.phase === 'portal' && this.portal) this._checkPortalEntry();

    this._drawHpBars();
    this._drawBossBar();
    this._syncAll();
    this.waveText.setText(this.phase === 'boss' ? 'BOSS' :
                          this.phase === 'wave' ? 'WAVE ' + (this.waveIdx + 1) + '/2' : '');
  }

  _syncAll() {
    this._syncActor(this.mb, 1);
    for (const e of this.enemies) if (e.sprite.active) this._syncActor(e, 1);
    if (this.boss && this.boss.sprite.active) this._syncActor(this.boss, 1);
    for (const f of this.fireballs) {
      const sx = this._perspectiveX(f.x, f.depth);
      f.sprite.setPosition(sx, this._floorY(f.depth) - f.height).setDepth(210);
    }
    for (const p of this.peels) {
      const sx = this._perspectiveX(p.x, p.depth);
      p.sprite.setPosition(sx, this._floorY(p.depth) - p.height).setDepth(212);
      p.sprite.rotation += 0.4;
    }
  }

  // ---------------- MB ----------------
  _updateMB(dt, time) {
    const mb = this.mb, inp = Input4.p1;
    // Movable during the fight AND the portal phase (so MB can walk into it).
    // Only the brief 'cleared' beat freezes input.
    const frozen = this.phase === 'cleared';

    let ax = 0;
    if (!frozen && inp.left)  ax -= MB4.MOVE_ACCEL;
    if (!frozen && inp.right) ax += MB4.MOVE_ACCEL;
    mb.vx += ax * dt;
    if (Math.abs(ax) < 1) mb.vx *= (mb.onGround ? MB4.MOVE_FRICTION_GROUND : MB4.MOVE_FRICTION_AIR);
    mb.vx = Math.max(-MB4.MOVE_MAX, Math.min(MB4.MOVE_MAX, mb.vx));
    mb.x += mb.vx * dt;

    if (!frozen) {
      if (inp.left && !inp.right) mb.facing = -1;
      else if (inp.right && !inp.left) mb.facing = 1;
      let ad = 0;
      if (inp.back) ad -= MB4.DEPTH_SPEED;
      if (inp.fwd)  ad += MB4.DEPTH_SPEED;
      mb.depth = Math.max(0, Math.min(1, mb.depth + ad * dt));
    }

    if (!frozen && inp.jumpPressed) {
      if (mb.onGround) { mb.vHeight = MB4.JUMP_POWER; mb.onGround = false; mb.jumpsUsed = 1; Audio4.jump(); }
      else if (mb.jumpsUsed < 2) { mb.vHeight = MB4.JUMP_POWER * 0.85; mb.jumpsUsed++; Audio4.jump(); }
    }
    mb.vHeight -= MB4.GRAVITY * dt;
    mb.height += mb.vHeight * dt;
    if (mb.height <= 0) { mb.height = 0; mb.vHeight = 0; mb.onGround = true; mb.jumpsUsed = 0; }
    mb.x = Math.max(MB4.COURT_LEFT + 20, Math.min(MB4.COURT_RIGHT - 20, mb.x));

    // Pose
    let pose = 'idle';
    if (!mb.onGround) pose = 'jump';
    else if (Math.abs(mb.vx) > 20) pose = 'run';
    if (time < mb.poseUntil) pose = mb.currentPose;
    mb.sprite.setTexture('p1_' + pose);
    // (facing is applied in _syncActor via mb.facing)

    // i-frame blink
    mb.sprite.setAlpha(time < mb.invulnUntil ? (Math.floor(time / 80) % 2 ? 0.35 : 1) : 1);
  }

  _mbStrike(time) {
    const mb = this.mb, inp = Input4.p1;
    if (time < mb.strikeCdUntil) return;
    let move = null, pose = null, cd = 0;
    if (inp.hipPressed)        { move = 'crunch'; pose = 'hip';   cd = 380; }
    else if (inp.kneePressed)  { move = 'slam';   pose = 'knee';  cd = 440; }
    else if (inp.elbowPressed) { move = 'hip';    pose = 'elbow'; cd = 360; }
    if (!move) return;

    mb.strikeCdUntil = time + cd;
    mb.currentPose = pose; mb.poseUntil = time + 220;
    const dmg = BATTLE.DMG[move];

    // Hitbox: in front of MB, within range in x and depth.
    let hit = false;
    const apply = (t) => {
      const dx = t.x - mb.x, dd = t.depth - mb.depth;
      if (Math.sign(dx) !== mb.facing && Math.abs(dx) > 18) return;
      if (Math.abs(dx) <= BATTLE.STRIKE_RANGE_X + (t.def ? t.def.r : BATTLE.BOSS.r) * 0.4 &&
          Math.abs(dd) <= BATTLE.STRIKE_RANGE_DEPTH) {
        this._damageTarget(t, dmg, mb.facing);
        hit = true;
      }
    };
    for (const e of this.enemies) if (e.alive) apply(e);
    if (this.boss && this.boss.alive) apply(this.boss);

    this._strikeFx(mb, move);
    if (move === 'crunch') Audio4.hip();
    else if (move === 'slam') Audio4.knee();
    else Audio4.elbow();
    if (hit) this._announceHit(move, dmg);
  }

  // v8: throw a peel forward (R key). Travels along x at MB's height, hits
  // the first enemy/boss in its path, consumed on hit or after BATTLE.PEEL.life.
  _mbThrowPeel(time) {
    const mb = this.mb, inp = Input4.p1;
    if (!inp.peelPressed) return;
    if (time < (mb.peelCdUntil || 0)) return;
    mb.peelCdUntil = time + BATTLE.PEEL.cooldown;

    const sx = this._perspectiveX(mb.x + mb.facing * 20, mb.depth);
    const sy = this._floorY(mb.depth) - mb.height - 28;
    const sprite = this.add.image(sx, sy, 'peel').setOrigin(0.5).setDepth(212);
    this.peels.push({
      x: mb.x + mb.facing * 20,
      depth: mb.depth,
      height: mb.height + 28,
      vx: mb.facing * BATTLE.PEEL.speed,
      life: BATTLE.PEEL.life,
      sprite,
    });
    Audio4.knee();
  }

  _updatePeels(dt) {
    for (let i = this.peels.length - 1; i >= 0; i--) {
      const p = this.peels[i];
      p.x += p.vx * dt;
      p.life -= dt;
      // Hit test against every alive enemy + boss.
      let hit = false;
      const apply = (t) => {
        if (hit || !t || !t.alive) return;
        if (Math.abs(t.x - p.x) <= BATTLE.PEEL.range + (t.def ? t.def.r : BATTLE.BOSS.r) * 0.3
            && Math.abs(t.depth - p.depth) <= 0.28) {
          this._damageTarget(t, BATTLE.DMG.peel, Math.sign(p.vx));
          hit = true;
        }
      };
      for (const e of this.enemies) apply(e);
      if (!hit && this.boss && this.boss.alive) apply(this.boss);

      if (hit) this._announceHit('peel', BATTLE.DMG.peel);

      if (hit || p.life <= 0 || p.x < MB4.COURT_LEFT - 40 || p.x > MB4.COURT_RIGHT + 40) {
        p.sprite.destroy();
        this.peels.splice(i, 1);
      }
    }
  }

  _strikeFx(mb, move) {
    const color = move === 'crunch' ? 0xffd166 : move === 'slam' ? 0xff8a3a : 0x9adfff;
    const sx = this._perspectiveX(mb.x + mb.facing * 40, mb.depth);
    const sy = this._floorY(mb.depth) - mb.height - 36;
    for (let i = 0; i < 6; i++) {
      const sp = this.add.image(sx, sy, 'spark').setTint(color).setDepth(750);
      this.tweens.add({
        targets: sp, x: sx + mb.facing * (20 + Math.random() * 40),
        y: sy + (Math.random() - 0.5) * 50, alpha: 0, scale: 0.3,
        duration: 320, onComplete: () => sp.destroy(),
      });
    }
  }

  _announceHit(move, dmg) {
    const label = move.toUpperCase() + ' −' + dmg;
    this.banner.setText(label).setAlpha(1).setScale(0.8);
    this.tweens.killTweensOf(this.banner);
    this.tweens.add({ targets: this.banner, alpha: 0, delay: 350, duration: 300 });
  }

  _stompCheck() {
    const mb = this.mb;
    if (mb.vHeight >= 0 || mb.height < 20) return;
    const tryStomp = (t, r) => {
      if (Math.abs(t.x - mb.x) < BATTLE.CONTACT_X + r * 0.3 && Math.abs(t.depth - mb.depth) < BATTLE.CONTACT_DEPTH) {
        this._damageTarget(t, BATTLE.DMG.stomp, 0);
        mb.vHeight = MB4.JUMP_POWER * 0.6; mb.jumpsUsed = 1; mb.onGround = false;
        this._announceHit('stomp', BATTLE.DMG.stomp);
        return true;
      }
      return false;
    };
    for (const e of this.enemies) if (e.alive && tryStomp(e, e.def.r)) return;
    if (this.boss && this.boss.alive) tryStomp(this.boss, BATTLE.BOSS.r);
  }

  _damageTarget(t, dmg, knockDir) {
    t.hp -= dmg;
    t.hitFlashUntil = this.time.now + 120;
    t.sprite.setTint(0xffffff);
    this.time.delayedCall(110, () => t.sprite && t.sprite.active && t.sprite.clearTint());
    if (knockDir) t.x += knockDir * 16;

    if (t === this.boss) {
      if (!t.phase2 && t.hp <= t.maxHp * BATTLE.BOSS.phase2At) {
        // v13 (Data13): phase 2 unlocks the purple-pinkie ball barrage. Stagger
        // the first lob slightly so it doesn't fire the instant the bar flips.
        t.phase2 = true; t.nextBallAt = this.time.now + 700;
        this._banner('PHASE 2!  PURPLE BALLS!', 1400);
      }
      if (t.hp <= 0) { t.hp = 0; this._onBossDead(); }
      return;
    }
    if (t.hp <= 0 && t.alive) this._killEnemy(t);
  }

  _killEnemy(e) {
    e.alive = false;
    this.score += e.kind === 'grapefruit' ? 130 : 100;
    const sx = this._perspectiveX(e.x, e.depth), sy = this._floorY(e.depth) - 20;
    for (let i = 0; i < 10; i++) {
      const sp = this.add.image(sx, sy, 'flame').setDepth(760);
      this.tweens.add({
        targets: sp, x: sx + (Math.random() - 0.5) * 80, y: sy - Math.random() * 60,
        alpha: 0, scale: 0.2, duration: 500, onComplete: () => sp.destroy(),
      });
    }
    e.sprite.destroy(); e.shadow.destroy();
    Audio4.score();
  }

  // ---------------- enemies ----------------
  _updateEnemy(e, dt, time) {
    const mb = this.mb;
    const dx = mb.x - e.x, dd = mb.depth - e.depth;
    // Chase MB.
    const sp = e.def.speed;
    if (Math.abs(dx) > 4) e.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt);
    if (Math.abs(dd) > 0.02) e.depth += Math.sign(dd) * Math.min(Math.abs(dd), 0.35 * dt);
    e.x = Math.max(MB4.COURT_LEFT + 10, Math.min(MB4.COURT_RIGHT - 10, e.x));
    e.facing = dx < 0 ? -1 : 1;

    // Contact damage.
    if (Math.abs(dx) < BATTLE.CONTACT_X && Math.abs(dd) < BATTLE.CONTACT_DEPTH && mb.height < 40) {
      this._hitMB(e.def.contact);
    }

    // Shooter: lob a fireball at MB.
    if (e.def.kind === 'shooter' && time > e.nextShotAt) {
      e.nextShotAt = time + e.def.shootMs;
      this._spawnFireball(e.x, e.depth, mb.x, mb.depth, e.def.fireballSpeed, e.def.fireballDmg);
    }
  }

  // ---------------- boss ----------------
  _updateBoss(dt, time) {
    const b = this.boss, mb = this.mb;
    // Emerge: grow from a speck near the hoop before it can act.
    if (b.emerging) {
      b.growth = Math.min(1, b.growth + dt * 0.9);
      if (b.growth >= 1) b.emerging = false;
      return;
    }
    const dx = mb.x - b.x, dd = mb.depth - b.depth;
    const sp = BATTLE.BOSS.speed * (b.phase2 ? 1.5 : 1);
    if (Math.abs(dx) > 6) b.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt);
    if (Math.abs(dd) > 0.02) b.depth += Math.sign(dd) * Math.min(Math.abs(dd), 0.3 * dt);
    b.x = Math.max(MB4.COURT_LEFT + 40, Math.min(MB4.COURT_RIGHT - 40, b.x));
    b.facing = dx < 0 ? -1 : 1;

    if (Math.abs(dx) < BATTLE.CONTACT_X + BATTLE.BOSS.r * 0.4 && Math.abs(dd) < BATTLE.CONTACT_DEPTH + 0.05 && mb.height < 60) {
      this._hitMB(BATTLE.BOSS.contact);
    }
    // v13 (Data13 Levels F2): "the boss shots purpleiepinkie balls at you when
    // the hp gets low enough for phase 2." Phase 1 stays melee-only (the v9
    // "cant shot anything" feel); once phase 2 begins he lobs purple-pink orbs.
    if (b.phase2 && time > b.nextBallAt) {
      b.nextBallAt = time + BATTLE.BOSS.ballShootMs;
      // A small fan of three purple-pinkie balls aimed at MB.
      const baseAng = Math.atan2((mb.depth - b.depth) * 300, mb.x - b.x);
      for (const off of [-BATTLE.BOSS.ballSpread, 0, BATTLE.BOSS.ballSpread]) {
        const tx = b.x + Math.cos(baseAng + off) * 400;
        const td = b.depth + Math.sin(baseAng + off) * 400 / 300;
        this._spawnFireball(b.x, b.depth, tx, td, BATTLE.BOSS.ballSpeed, BATTLE.BOSS.ballDmg, 'purpleball');
      }
    }
  }

  _onBossDead() {
    this.boss.alive = false;
    this.bossHpWrap.setVisible(false);
    const sx = this._perspectiveX(this.boss.x, this.boss.depth), sy = this._floorY(this.boss.depth) - 60;
    for (let i = 0; i < 40; i++) {
      const sp = this.add.image(sx, sy, 'spark').setTint([0x9a4ae0, 0xff4ae0, 0xffffff][i % 3]).setDepth(770);
      this.tweens.add({
        targets: sp, x: sx + (Math.random() - 0.5) * 220, y: sy + (Math.random() - 0.5) * 180,
        alpha: 0, duration: 900 + Math.random() * 500, onComplete: () => sp.destroy(),
      });
    }
    this.boss.sprite.destroy(); this.boss.shadow.destroy();
    this.phase = 'cleared';
    Audio4.hoopWin && Audio4.hoopWin();
    this._banner('PORTALPROTECTOR DOWN!', 2000);
    this.time.delayedCall(1400, () => this._spawnPortal());
  }

  // ---------------- fireballs ----------------
  _spawnFireball(x, depth, tx, tdepth, speed, dmg, tex = 'fireball') {
    const ang = Math.atan2((tdepth - depth) * 300, tx - x);
    const sprite = this.add.image(this._perspectiveX(x, depth), this._floorY(depth) - 60, tex).setDepth(210);
    this.fireballs.push({
      x, depth, height: 50,
      vx: Math.cos(ang) * speed, vDepth: Math.sin(ang) * speed / 300,
      dmg, sprite, life: 3.2,
    });
  }

  _updateFireballs(dt) {
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const f = this.fireballs[i];
      f.x += f.vx * dt; f.depth += f.vDepth * dt; f.life -= dt;
      const mb = this.mb;
      const hit = Math.abs(f.x - mb.x) < 34 && Math.abs(f.depth - mb.depth) < 0.18 && mb.height < 60;
      if (hit) { this._hitMB(f.dmg); f.life = 0; }
      if (f.life <= 0 || f.x < MB4.COURT_LEFT - 40 || f.x > MB4.COURT_RIGHT + 40 || f.depth < -0.1 || f.depth > 1.1) {
        f.sprite.destroy(); this.fireballs.splice(i, 1);
      }
    }
  }

  // ---------------- MB taking damage ----------------
  _hitMB(dmg) {
    const mb = this.mb;
    if (this.time.now < mb.invulnUntil || this.phase === 'dead' || this.phase === 'portal') return;
    mb.hp = Math.max(0, mb.hp - dmg);
    mb.invulnUntil = this.time.now + BATTLE.INVULN_MS;
    this.cameras.main.shake(120, 0.008);
    Audio4.land();
    if (mb.hp <= 0) this._mbFaint();
  }

  _mbFaint() {
    this.phase = 'dead';
    this._banner('MB FAINTED…  restarting', 0);
    this.time.delayedCall(2000, () => this.scene.restart({ difficulty: this.difficulty, score: this.carryScore }));
  }

  // ---------------- portal → 3D handoff ----------------
  _spawnPortal() {
    this.phase = 'portal';
    const x = MB4.HOOP_X, depth = 0.5;
    const sx = this._perspectiveX(x, depth), sy = this._floorY(depth) - 60;
    this.portal = this.add.image(sx, sy, 'portal_ring').setDepth(160).setScale(0);
    this.portal._x = x; this.portal._depth = depth;
    this.tweens.add({ targets: this.portal, scale: 1, duration: 600, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.portal, angle: 360, duration: 4000, repeat: -1 });
    this._banner('A BLUE PORTAL OPENS!  Walk in →', 3200);
  }

  _checkPortalEntry() {
    const mb = this.mb;
    if (Math.abs(mb.x - this.portal._x) < 40 && Math.abs(mb.depth - this.portal._depth) < 0.22) {
      this.phase = 'done';
      this._enterPortal();
    }
  }

  _enterPortal() {
    // MB flies into the portal: tween toward portal center, shrink + spin.
    const sx = this.portal.x, sy = this.portal.y;
    this.tweens.add({
      targets: this.mb.sprite, x: sx, y: sy, scale: 0.05, angle: 720,
      duration: 900, ease: 'Cubic.easeIn',
    });
    this.tweens.add({ targets: this.mb.shadow, alpha: 0, duration: 600 });
    // Blue flash, then hand off to the parent (Babylon) for the 3D arrival.
    const flash = this.add.graphics().setDepth(2000);
    flash.fillStyle(0x2a6aff, 0).fillRect(0, 0, MB4.GAME_W, MB4.GAME_H);
    this.tweens.add({
      targets: flash, alpha: { from: 0, to: 1 }, duration: 700, delay: 700,
      onUpdate: () => { flash.clear(); flash.fillStyle(0x2a6aff, flash.alpha).fillRect(0, 0, MB4.GAME_W, MB4.GAME_H); },
      onComplete: () => {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'mb4-portal', score: this.score }, '*');
        }
      },
    });
  }
}

window.BattleScene = BattleScene;
