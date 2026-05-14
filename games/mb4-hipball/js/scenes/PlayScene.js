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
    this.extraBalls = [];   // Twin Sun spawns push to this array

    if (this.mode === 'sp') this.bot = AI4.freshBotState();
    if (this.mode === 'mp') this._wireNetForMatch();

    this._buildHud();

    // Math-tile manager (decimal/fraction comparison tiles on the court)
    this.mathTiles = new MathTileManager(this);

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
    if (window.Music4) {
      Music4.init().then(() => Music4.play('match'));
    }

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
      // Powerup + slip state
      powerUps: [],     // [{ kind, expiresAt, mods }]
      slipUntil: 0,     // ms timestamp until player can move again
      slipFx: null,     // container of stars/visual when slipped
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
    const C = MB4.COLOR;
    this.hud = {};

    // Score backing card — centered, large, unambiguous
    const cardW = 280, cardH = 64;
    const cardX = W / 2 - cardW / 2;
    const cardY = 6;
    const g = this.add.graphics().setDepth(890);
    g.fillStyle(0x1a0820, 0.85);
    g.fillRoundedRect(cardX, cardY, cardW, cardH, 8);
    g.lineStyle(3, C.glyphAccent, 1);
    g.strokeRoundedRect(cardX, cardY, cardW, cardH, 8);
    // Divider in the middle
    g.lineStyle(2, C.stoneDk, 0.8);
    g.beginPath(); g.moveTo(W / 2, cardY + 10); g.lineTo(W / 2, cardY + cardH - 10); g.strokePath();

    // Score numbers — BIG, with player tint
    const scoreStyle = {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '44px',
      stroke: '#1a0820', strokeThickness: 6,
    };
    this.hud.scoreP1 = this.add.text(W / 2 - 60, cardY + cardH / 2, '0',
      { ...scoreStyle, color: '#fde375' }).setOrigin(0.5).setDepth(900);
    this.hud.scoreP2 = this.add.text(W / 2 + 60, cardY + cardH / 2, '0',
      { ...scoreStyle, color: '#9adfff' }).setOrigin(0.5).setDepth(900);

    // P1/P2 labels above scores
    this.add.text(W / 2 - 60, cardY + 12, 'P1', {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '12px', color: '#fde375',
    }).setOrigin(0.5).setDepth(900);
    this.add.text(W / 2 + 60, cardY + 12, this.mode === 'sp' ? 'CPU' : 'P2', {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '12px', color: '#9adfff',
    }).setOrigin(0.5).setDepth(900);

    // "FIRST TO N" below the card
    this.add.text(W / 2, cardY + cardH + 4, 'FIRST TO ' + MB4.WIN_SCORE, {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '14px', color: '#fde375', stroke: '#1a0820', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(900);

    // BETA badge — top-left corner
    this.add.text(16, 14, 'BETA', {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '18px', color: '#ff4a1a',
      stroke: '#1a0820', strokeThickness: 4,
      backgroundColor: '#fde375', padding: { x: 8, y: 2 },
    }).setDepth(910);

    // Streak fire — to the left/right of the score card
    this.hud.fireP1 = this.add.text(W / 2 - 150, cardY + cardH / 2, '', {
      fontSize: '28px',
    }).setOrigin(1, 0.5).setDepth(900);
    this.hud.fireP2 = this.add.text(W / 2 + 150, cardY + cardH / 2, '', {
      fontSize: '28px',
    }).setOrigin(0, 0.5).setDepth(900);

    // Hoop indicator — arrow above the hoop telling players THAT'S the target
    const hoopHint = this.add.text(MB4.HOOP_X, MB4.HOOP_Y - 72, '\u{2193} SHOOT THROUGH HERE', {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '14px', color: '#fde375',
      stroke: '#1a0820', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(900);
    this.tweens.add({
      targets: hoopHint,
      alpha: { from: 0.6, to: 1 },
      duration: 800,
      yoyo: true, repeat: -1,
    });
    this.hud.hoopHint = hoopHint;

    // Active powerups for each player. We draw a list of cards under each
    // player's score, with name + description + time-remaining bar.
    // The cards are rebuilt every frame by _updateHud (cheap; rare).
    this.hud.puCardsP1 = [];   // [{ container, bg, name, desc, bar, kind }]
    this.hud.puCardsP2 = [];
  }

  _updateHud() {
    const FIRE3 = '\u{1F525}\u{1F525}\u{1F525}';
    const FIRE1 = '\u{1F525}';
    this.hud.scoreP1.setText(String(this.match.score[0]));
    this.hud.scoreP2.setText(String(this.match.score[1]));
    this.hud.fireP1.setText(this.match.onFire[0] ? FIRE3 : (this.match.streak[0] >= MB4.STREAK_TO_TRAIL ? FIRE1 : ''));
    this.hud.fireP2.setText(this.match.onFire[1] ? FIRE3 : (this.match.streak[1] >= MB4.STREAK_TO_TRAIL ? FIRE1 : ''));

    // Powerup cards per player
    const now = this.time.now;
    this._updatePuCards(0, now);
    this._updatePuCards(1, now);
  }

  _updatePuCards(playerIdx, now) {
    const pups = this.players[playerIdx].powerUps || [];
    const slot = playerIdx === 0 ? 'puCardsP1' : 'puCardsP2';
    const cards = this.hud[slot];

    // Reconcile: keep cards whose kind is still active; create new for added powerups;
    // destroy ones whose powerup expired.
    const activeKinds = new Set(pups.map(p => p.kind));
    for (let i = cards.length - 1; i >= 0; i--) {
      if (!activeKinds.has(cards[i].kind)) {
        cards[i].container.destroy();
        cards.splice(i, 1);
      }
    }

    // Add new cards for any active powerup not yet shown
    const shown = new Set(cards.map(c => c.kind));
    for (const pu of pups) {
      if (!shown.has(pu.kind)) {
        cards.push(this._makePuCard(playerIdx, pu));
      }
    }

    // Layout + update progress for each card
    const cardH = 44;
    const gap = 6;
    const isLeft = playerIdx === 0;
    const xAnchor = isLeft ? 16 : MB4.GAME_W - 16;
    let y = 80;
    for (const card of cards) {
      const pu = pups.find(p => p.kind === card.kind);
      if (!pu) continue;
      card.container.setPosition(xAnchor, y);
      const remainingMs = Math.max(0, pu.expiresAt - now);
      const frac = pu.durationMs > 0 ? remainingMs / pu.durationMs : 0;
      // Redraw the inner bar with the current width (Graphics has no scale anchor)
      const innerW = (card.W - 16) * frac;
      const barX = card.isLeft ? 8 : -card.W + 8;
      const barY = card.H - 8;
      card.bar.clear();
      const def = MB4.POWERUPS[card.kind];
      card.bar.fillStyle(def.color, 1);
      card.bar.fillRect(barX, barY, innerW, 4);
      y += cardH + gap;
    }
  }

  _makePuCard(playerIdx, pu) {
    const def = MB4.POWERUPS[pu.kind];
    const isLeft = playerIdx === 0;
    const C = MB4.COLOR;
    const W = 180, H = 44;
    // Container origin is the anchored corner — top-left for P1, top-right for P2
    const container = this.add.container(0, 0).setDepth(890);

    // Background card
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0820, 0.85);
    if (isLeft) {
      bg.fillRoundedRect(0, 0, W, H, 4);
      bg.lineStyle(2, def.color, 1);
      bg.strokeRoundedRect(0, 0, W, H, 4);
    } else {
      bg.fillRoundedRect(-W, 0, W, H, 4);
      bg.lineStyle(2, def.color, 1);
      bg.strokeRoundedRect(-W, 0, W, H, 4);
    }
    container.add(bg);

    // Powerup name
    const nameStyle = {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '12px', color: '#fde375',
      stroke: '#1a0820', strokeThickness: 2,
    };
    const name = this.add.text(isLeft ? 8 : -8, 5, def.label, nameStyle)
      .setOrigin(isLeft ? 0 : 1, 0);
    container.add(name);

    // Description
    const descStyle = {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '10px', color: '#c4a572',
      stroke: '#1a0820', strokeThickness: 1,
    };
    const desc = this.add.text(isLeft ? 8 : -8, 21, def.description || '', descStyle)
      .setOrigin(isLeft ? 0 : 1, 0);
    container.add(desc);

    // Time bar — a thin rectangle whose width shrinks via scaleX over time
    const barOuterY = H - 8;
    const barOuter = this.add.graphics();
    barOuter.fillStyle(0x3a2030, 1);
    barOuter.fillRect(isLeft ? 8 : -W + 8, barOuterY, W - 16, 4);
    container.add(barOuter);
    // Inner bar (the part that shrinks). We position its origin at the left
    // so setScale(frac, 1) shrinks it from the right.
    const bar = this.add.graphics();
    bar.fillStyle(def.color, 1);
    bar.fillRect(isLeft ? 8 : -W + 8, barOuterY, W - 16, 4);
    container.add(bar);
    // For scaling: the bar needs an origin anchor. Phaser graphics don't have origin,
    // so we wrap by setting the container's bar reference and pinning the bar to
    // its native position; scale via the bar's transform with x set appropriately.
    // Simpler: redraw the bar each frame.

    return { container, bg, name, desc, bar, kind: pu.kind, W, H, isLeft };
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
    Audio4.speak('fight', 0.9);    // Plays voice/fight.mp3 if present, else stab+roar

    // First rally only: show a help card with controls
    if (!this._helpShown) {
      this._helpShown = true;
      const helpLines = [
        'MOVE: WASD     JUMP: SPACE',
        'STRIKE:  Z=hip   X=knee   C=elbow',
        'JUMP + C to LOB at the hoop (+3 rayas)',
        'STEP on a math tile if it\'s TRUE \u2192 POWER UP!',
        'Step on a FALSE one \u2192 you slip and fall',
      ];
      const help = this.add.text(W / 2, 380, helpLines.join('\n'), {
        fontFamily: '"Black Ops One", "Arial Black", sans-serif',
        fontSize: '15px', color: '#fde375',
        stroke: '#1a0820', strokeThickness: 4,
        align: 'center', lineSpacing: 4,
        backgroundColor: 'rgba(26,8,32,0.7)',
        padding: { x: 16, y: 10 },
      }).setOrigin(0.5).setDepth(1000);
      this.tweens.add({
        targets: help,
        alpha: 0,
        delay: 5500, duration: 800,
        onComplete: () => help.destroy(),
      });
    }
  }

  _resetPositions() {
    this.players[0].x = MB4.COURT_LEFT + 180;
    this.players[0].depth = 0.3;
    this.players[0].height = 0; this.players[0].vHeight = 0;
    this.players[0].vx = 0; this.players[0].facing = 1; this.players[0].onGround = true;
    this.players[0].slipUntil = 0;
    this.players[1].x = MB4.COURT_RIGHT - 180;
    this.players[1].depth = 0.3;
    this.players[1].height = 0; this.players[1].vHeight = 0;
    this.players[1].vx = 0; this.players[1].facing = -1; this.players[1].onGround = true;
    this.players[1].slipUntil = 0;
    // Clean up any lingering slip FX
    for (const p of this.players) {
      if (p.slipFx) { p.slipFx.destroy(); p.slipFx = null; }
    }
    this.ball.x = 480;
    this.ball.prevX = 480;
    this.ball.depth = 0.5; this.ball.height = 80; this.ball.vHeight = 0;
    this.ball.vx = (Math.random() < 0.5 ? -1 : 1) * 60;
    this.ball.vDepth = 0;
    this.ball.lastTouchedBy = null; this.ball.airborne = true;
    // Cull any twin balls — fresh rally starts with primary only
    for (const eb of (this.extraBalls || [])) {
      if (eb.sprite) eb.sprite.destroy();
      if (eb.shadow) eb.shadow.destroy();
    }
    this.extraBalls = [];
    // Clear stale tiles from the floor for visual freshness
    if (this.mathTiles) this.mathTiles.destroyAll();
  }


  // ---- Math/powerup/slip helpers ----

  // Grant a specific powerup to a player. Called by MathTileManager on a
  // correct tile, or could be called by future content (boss-fight unlocks etc.)
  _applyPowerUp(player, kind) {
    const def = MB4.POWERUPS[kind];
    if (!def) { console.warn('Unknown powerup:', kind); return; }
    const now = this.time.now;
    player.powerUps.push({
      kind, expiresAt: now + def.durationMs,
      durationMs: def.durationMs,
      mods: def.mods,
    });
    Audio4.powerUpEarned('major');   // big sting
    // Announcer "speaks" the powerup name. Tries audio/voice/<kind_snake>.mp3 first;
    // falls back to the synth stinger (announce + crowd roar) if missing.
    const voiceKey = kind.replace(/([A-Z])/g, '_$1').toLowerCase();
    Audio4.speak(voiceKey, 1.3);

    // Big screen-flash banner showing who got it + what.
    this._showPowerUpFlash(player, def);

    // Small in-game pop just above the player's head
    const floorY = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * player.depth;
    const screenY = floorY - player.height - 64;
    const screenX = this._perspectiveX(player.x, player.depth);
    const banner = this.add.text(screenX, screenY, def.shortLabel || def.label, {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '18px', color: '#fde375',
      stroke: '#1a0820', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(900);
    this.tweens.add({
      targets: banner,
      y: screenY - 30, alpha: 0,
      duration: 1200, ease: 'Cubic.easeOut',
      onComplete: () => banner.destroy(),
    });
  }

  // Big NBA-Jam-style screen flash naming the powerup + who got it.
  // Stripe across the middle of the screen with the player's color.
  _showPowerUpFlash(player, def) {
    const W = MB4.GAME_W, H = MB4.GAME_H;
    const playerColor = player.idx === 0 ? '#fde375' : '#9adfff';
    const playerName = player.idx === 0 ? 'P1' : (this.mode === 'sp' ? 'CPU' : 'P2');

    // Colored stripe with diagonal slant on either side
    const stripe = this.add.graphics().setDepth(1100);
    stripe.fillStyle(0x1a0820, 0.9);
    stripe.fillRect(0, H / 2 - 60, W, 120);
    // accent line
    stripe.lineStyle(4, def.color, 1);
    stripe.beginPath();
    stripe.moveTo(0, H / 2 - 60); stripe.lineTo(W, H / 2 - 60);
    stripe.moveTo(0, H / 2 + 60); stripe.lineTo(W, H / 2 + 60);
    stripe.strokePath();

    // Player tag
    const tag = this.add.text(W / 2, H / 2 - 26, `${playerName}  GETS`, {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '20px', color: playerColor,
      stroke: '#1a0820', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1102);

    // Big powerup name
    const name = this.add.text(W / 2, H / 2 + 8, def.label, {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '52px', color: '#fff4c8',
      stroke: '#8a1a1a', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(1102);

    // Description subtitle
    const sub = this.add.text(W / 2, H / 2 + 42, def.description || '', {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '14px', color: '#fde375',
      stroke: '#1a0820', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1102);

    // Slide in from off-screen, hold, slide out
    [stripe, tag, name, sub].forEach(el => { el.x -= W; });
    this.tweens.add({
      targets: [stripe, tag, name, sub],
      x: '+=' + W,
      duration: 320,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: [stripe, tag, name, sub],
          x: '+=' + W,
          delay: 800,
          duration: 280,
          ease: 'Cubic.easeIn',
          onComplete: () => {
            stripe.destroy(); tag.destroy(); name.destroy(); sub.destroy();
          },
        });
      },
    });

    // Pulse the name once for emphasis
    this.tweens.add({
      targets: name,
      scale: { from: 1.0, to: 1.15 },
      duration: 280, delay: 320,
      yoyo: true, ease: 'Sine.easeInOut',
    });
  }

  // Slip the player — they fall down, can't move/strike for SLIP_MS,
  // then automatically get back up.
  _slipPlayer(player) {
    const now = this.time.now;
    player.slipUntil = now + MB4.MATH.SLIP_MS;
    // Kill velocity so they don't keep sliding
    player.vx = 0;
    // Comedic descending tone + thud — use existing audio primitives
    Audio4.miss();
    Audio4.land();
    // Spinning star ring above their head
    if (player.slipFx) { player.slipFx.destroy(); player.slipFx = null; }
    const floorY = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * player.depth;
    const screenX = this._perspectiveX(player.x, player.depth);
    const container = this.add.container(screenX, floorY - 50).setDepth(700);
    for (let i = 0; i < 3; i++) {
      const star = this.add.text(0, 0, '\u2733', {
        fontSize: '20px', color: '#fde375',
        stroke: '#1a0820', strokeThickness: 3,
      }).setOrigin(0.5);
      container.add(star);
      this.tweens.add({
        targets: star,
        angle: 360, duration: 1500,
        ease: 'Linear', repeat: 0,
      });
    }
    // Spin the whole ring
    this.tweens.add({
      targets: container,
      angle: 360, duration: 1200,
      ease: 'Linear', repeat: -1,
    });
    // Lay the children out in a small circle each frame via update? Simpler:
    // just place them at static positions around the center.
    container.list.forEach((star, i) => {
      const a = (i / 3) * Math.PI * 2;
      star.x = Math.cos(a) * 18;
      star.y = Math.sin(a) * 8;
    });
    player.slipFx = container;
    // Auto-clean when recovered
    this.time.delayedCall(MB4.MATH.SLIP_MS, () => {
      if (player.slipFx) { player.slipFx.destroy(); player.slipFx = null; }
    });
  }

  _expirePowerUps(player, now) {
    const before = player.powerUps.length;
    player.powerUps = player.powerUps.filter(p => p.expiresAt > now);
    if (player.powerUps.length !== before) {
      // visual: tiny notification someone just lost a powerup (optional, skip for now)
    }
  }

  // Aggregate active powerup modifiers for a player. Returns an object with
  // sensible defaults so callers don't have to null-check.
  _aggregateMods(player) {
    let moveMaxMult = 1, moveAccelMult = 1, bodyBounceMult = 1;
    let strikeKnockbackMult = 1, incomingKnockbackMult = 1, jumpPowerMult = 1;
    let incomingHitstopImmune = false, doubleJump = false, aiUntrackable = false;
    let spawnTwinOnStrike = false;
    let alphaOverride = null;
    const strikeBoost = {};
    for (const pu of player.powerUps) {
      const m = pu.mods || {};
      if (m.moveMaxMult)   moveMaxMult   *= m.moveMaxMult;
      if (m.moveAccelMult) moveAccelMult *= m.moveAccelMult;
      if (m.bodyBounceMult) bodyBounceMult *= m.bodyBounceMult;
      if (m.strikeKnockbackMult) strikeKnockbackMult *= m.strikeKnockbackMult;
      if (m.incomingKnockbackMult) incomingKnockbackMult *= m.incomingKnockbackMult;
      if (m.jumpPowerMult) jumpPowerMult *= m.jumpPowerMult;
      if (m.incomingHitstopImmune) incomingHitstopImmune = true;
      if (m.doubleJump) doubleJump = true;
      if (m.aiUntrackable) aiUntrackable = true;
      if (m.spawnTwinOnStrike) spawnTwinOnStrike = true;
      if (m.alphaOverride !== undefined) alphaOverride = m.alphaOverride;
      if (m.strikeBoost) {
        for (const k of Object.keys(m.strikeBoost)) {
          strikeBoost[k] = Object.assign(strikeBoost[k] || {}, m.strikeBoost[k]);
        }
      }
    }
    return {
      moveMaxMult, moveAccelMult, bodyBounceMult,
      strikeKnockbackMult, incomingKnockbackMult, jumpPowerMult,
      incomingHitstopImmune, doubleJump, aiUntrackable,
      spawnTwinOnStrike, alphaOverride,
      strikeBoost,
    };
  }

  // Math tile callback — float a small ✓ or ✗ above the tile
  _mathFloatText(tile, text, color) {
    const screenX = this._perspectiveX(tile.x, tile.depth);
    const floorY = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * tile.depth;
    const t = this.add.text(screenX, floorY - 30, text, {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '32px', color,
      stroke: '#1a0820', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(950);
    this.tweens.add({
      targets: t,
      y: t.y - 50, alpha: 0, scale: 1.5,
      duration: 700,
      onComplete: () => t.destroy(),
    });
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
        mathTiles: this.mathTiles ? this.mathTiles.tiles : [],
      });
    }

    if (!this.match.ended && this.match.pointInProgress && !inHitstop) {
      this._updatePlayer(this.players[0], this._inputForPlayer(0), dt, time);
      this._updatePlayer(this.players[1], this._inputForPlayer(1), dt, time);
      this._updateBall(dt, time);
      this._checkStrikes(time);
      this._checkScoring(time);

      // Math tiles + powerup expiry only run during active play
      this.mathTiles.tick(time);
      for (const p of this.players) this._expirePowerUps(p, time);
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
    const mods = this._aggregateMods(p);

    // Slipped: no movement input, no strikes; show fallen pose.
    const slipped = time < p.slipUntil;
    if (slipped) {
      // Friction-decay any residual velocity
      p.vx *= 0.85;
      p.x += p.vx * dt;
      // Gravity still applies if airborne
      p.vHeight -= MB4.GRAVITY * dt;
      p.height += p.vHeight * dt;
      if (p.height <= 0) { p.height = 0; p.vHeight = 0; p.onGround = true; }
      p.x = Math.max(MB4.COURT_LEFT + 20, Math.min(MB4.COURT_RIGHT - 20, p.x));
      // Force fallen pose
      const prefix = p.idx === 0 ? 'p1_' : 'p2_';
      p.sprite.setTexture(prefix + 'fallen');
      p.sprite.setFlipX(p.facing < 0);
      // Reposition star FX over their head each frame
      if (p.slipFx) {
        const floorY = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * p.depth;
        const screenX = this._perspectiveX(p.x, p.depth);
        p.slipFx.setPosition(screenX, floorY - 36);
      }
      // Alpha is whatever the powerup wants (Smoke might still be active)
      p.sprite.setAlpha(mods.alphaOverride !== null ? mods.alphaOverride : 1);
      return;
    }

    let ax = 0;
    if (inp.left)  ax -= MB4.MOVE_ACCEL * mods.moveAccelMult;
    if (inp.right) ax += MB4.MOVE_ACCEL * mods.moveAccelMult;
    p.vx += ax * dt;
    if (Math.abs(ax) < 1)
      p.vx *= (p.onGround ? MB4.MOVE_FRICTION_GROUND : MB4.MOVE_FRICTION_AIR);
    const maxV = MB4.MOVE_MAX * mods.moveMaxMult;
    p.vx = Math.max(-maxV, Math.min(maxV, p.vx));
    p.x += p.vx * dt;

    if (inp.left && !inp.right) p.facing = -1;
    else if (inp.right && !inp.left) p.facing = 1;
    else if (Math.abs(p.vx) < 10) p.facing = this.ball.x >= p.x ? 1 : -1;

    let aDepth = 0;
    if (inp.back) aDepth -= MB4.DEPTH_SPEED;
    if (inp.fwd)  aDepth += MB4.DEPTH_SPEED;
    p.depth = Math.max(0, Math.min(1, p.depth + aDepth * dt));

    // Jump (with optional double-jump via Hummingbird Wings)
    if (inp.jumpPressed) {
      if (p.onGround) {
        p.vHeight = MB4.JUMP_POWER * mods.jumpPowerMult;
        p.onGround = false;
        p.jumpsUsed = 1;
        Audio4.jump();
      } else if (mods.doubleJump && (p.jumpsUsed || 0) < 2) {
        p.vHeight = MB4.JUMP_POWER * mods.jumpPowerMult * 0.85;   // second hop is slightly weaker
        p.jumpsUsed = (p.jumpsUsed || 1) + 1;
        Audio4.jump();
      }
    }
    p.vHeight -= MB4.GRAVITY * dt;
    p.height += p.vHeight * dt;
    if (p.height <= 0) {
      if (!p.onGround && p.vHeight < -100) Audio4.land();
      p.height = 0; p.vHeight = 0; p.onGround = true;
      p.jumpsUsed = 0;
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
    // Alpha (Copal Smoke)
    p.sprite.setAlpha(mods.alphaOverride !== null ? mods.alphaOverride : 1);
  }

  _updateBall(dt, time) {
    // Primary ball
    this._updateOneBall(this.ball, dt, time);
    // Twin Sun extras
    for (let i = this.extraBalls.length - 1; i >= 0; i--) {
      const eb = this.extraBalls[i];
      this._updateOneBall(eb, dt, time);
      // Cull twins that fall off-screen or expired
      if (eb._expired || eb.x < MB4.COURT_LEFT - 60 || eb.x > MB4.COURT_RIGHT + 60) {
        if (eb.sprite) eb.sprite.destroy();
        if (eb.shadow) eb.shadow.destroy();
        this.extraBalls.splice(i, 1);
      }
    }
  }

  _updateOneBall(b, dt, time) {
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

    // Body collisions (every ball checks every player)
    for (const p of this.players) {
      this._maybeBodyCollide(b, p, time);
    }

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

  // Body collision: treat the player as a vertical cylinder. Ball reflects
  // off it like a wall.
  _maybeBodyCollide(b, p, time) {
    // Skip if the ball is well above the player's head
    const playerHeadHeight = p.height + 48;       // sprite is ~48 tall
    if (b.height > playerHeadHeight + 6) return;
    if (b.height < p.height - 4) return;          // ball below feet, unlikely but safe

    // Horizontal & depth distance (cylinder radius)
    const dx = b.x - p.x;
    const dDepth = b.depth - p.depth;
    // Convert depth to an effective screen-distance for collision purposes
    const dDepthPx = dDepth * 100;                // rough
    const dist2 = dx * dx + dDepthPx * dDepthPx;
    const radius = 22;                             // collision cylinder radius
    if (dist2 > radius * radius) return;

    // Only count as a "block" if the ball was moving toward the player.
    // (Otherwise the ball would re-collide as we push it out — endless loop.)
    const distToward = (b.x - p.x) * b.vx + (b.depth - p.depth) * b.vDepth * 100;
    if (distToward > 0) {
      // Ball is moving away from the player already. Push it clear without
      // changing velocity (positional resolve only).
      const d = Math.max(1, Math.sqrt(dist2));
      const overlap = radius - d + 0.5;
      if (overlap > 0) {
        b.x += (dx / d) * overlap;
        b.depth += (dDepthPx / d) * overlap / 100;
      }
      return;
    }

    // Reflect — treat the player as a vertical cylinder, normal = direction from player to ball.
    const d = Math.max(1, Math.sqrt(dist2));
    const nx = dx / d;
    const nDepthPx = dDepthPx / d;
    // Reflect velocity around (nx, nDepth)
    // vNormalComponent = v · n
    const vNormalComponent = b.vx * nx + b.vDepth * 100 * nDepthPx;
    const bodyMods = this._aggregateMods(p);
    const bounce = 0.7 * bodyMods.bodyBounceMult;
    // Subtract twice the normal component, then scale by bounce factor
    b.vx       -= 2 * vNormalComponent * nx;
    b.vDepth   -= 2 * vNormalComponent * nDepthPx / 100;
    b.vx     *= bounce;
    b.vDepth *= bounce;
    // Add a small upward kick so the ball pops, doesn't pin to the player's belly
    if (b.height < 30 && b.vHeight < 80) b.vHeight = 200;

    // Position-resolve so we don't re-collide next frame
    const overlap = radius - d + 0.5;
    b.x += nx * overlap;
    b.depth += nDepthPx * overlap / 100;

    // Body bounce clears scoring claim (so you can't hoop-shot via passive blocks)
    b.lastTouchedBy = null;
    // Reset whichever player just got bumped — they didn't "strike," they got hit
    this.match.streak[p.idx] = 0;
    this.match.onFire[p.idx] = false;
    Audio4.land();   // soft thud (we don't have a dedicated "thunk" SFX; land works)
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
    this._syncOneBallSprite(this.ball);
    for (const eb of this.extraBalls) this._syncOneBallSprite(eb);
  }

  _syncOneBallSprite(b) {
    const floorY = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * b.depth;
    const screenY = floorY - b.height;
    const screenX = this._perspectiveX(b.x, b.depth);
    const scale = (1 - 0.3 * b.depth) * (1 + 0.05 * (b.height / 200));
    b.sprite.setPosition(screenX, screenY).setScale(scale);
    b.shadow.setPosition(screenX, floorY).setScale(scale * 0.7, scale * 0.5);
    b.shadow.setAlpha(0.7 - 0.5 * (b.height / 250));
    b.sprite.setRotation(b.sprite.rotation + 0.04 * Math.sign(b.vx) * Math.max(0.5, Math.min(3, Math.abs(b.vx) / 200)));
  }

  // Spawn a Twin-Sun extra ball at the strike location. The twin gets a
  // slight velocity offset so it doesn't perfectly clone the primary's path.
  _spawnTwinBall(strikerIdx, x, depth, height, vx, vHeight, vDepth) {
    const sprite = this.add.image(x, MB4.FLOOR_FRONT_Y, 'ball').setOrigin(0.5).setDepth(80);
    sprite.setTint(0xffd166);   // golden tint to distinguish from primary
    const shadow = this.add.image(x, MB4.FLOOR_FRONT_Y, 'shadow').setOrigin(0.5).setDepth(40);
    const ball = {
      x, prevX: x, y: MB4.FLOOR_FRONT_Y,
      vx: vx * (0.85 + Math.random() * 0.3),
      vHeight: vHeight * (0.85 + Math.random() * 0.3),
      vDepth: vDepth + (Math.random() - 0.5) * 0.2,
      depth, height,
      sprite, shadow,
      lastTouchedBy: strikerIdx,
      airborne: true,
      _isTwin: true,
      _expired: false,
    };
    this.extraBalls.push(ball);
    // Twin expires when its scoring claim is consumed or after 4 seconds, whichever first
    this.time.delayedCall(4000, () => { ball._expired = true; });
  }

  _perspectiveX(x, depth) {
    const inset = MB4.FLOOR_PERSPECTIVE_INSET * depth;
    const t = (x - MB4.COURT_LEFT) / (MB4.COURT_RIGHT - MB4.COURT_LEFT);
    return (MB4.COURT_LEFT + inset) + t * ((MB4.COURT_RIGHT - inset) - (MB4.COURT_LEFT + inset));
  }

  _checkStrikes(time) {
    for (const p of this.players) {
      if (time < p.slipUntil) continue;   // can't strike while fallen
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
    const mods = this._aggregateMods(p);
    const sb = (mods.strikeBoost && mods.strikeBoost[strikeType]) || {};
    const ballVXMult = sb.ballVXMult || 1;
    const ballVHeightOverride = sb.ballVHeightOverride;
    b.vx = p.facing * cfg.ballVX * ballVXMult;
    b.vHeight = (ballVHeightOverride !== undefined) ? ballVHeightOverride : cfg.ballVHeight;
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
    // Hitstop is global but Quetzal Cloak on the OPPONENT means we skip the
    // hitstop visual disruption (so they can keep playing through it)
    const oppMods = this._aggregateMods(this.players[1 - p.idx]);
    if (!oppMods.incomingHitstopImmune) {
      this.hitstop.until = time + 80 * intensity;
      this.shake.until = time + 220;
      this.shake.mag = 8 * intensity;
    } else {
      // Lesser feedback for self
      this.shake.until = time + 80;
      this.shake.mag = 3 * intensity;
    }

    // Obsidian Edge: shove the opponent back along X. Knockback magnitude
    // scales with strikeKnockbackMult AND the base cfg.knockbackOpponent.
    // The opponent's Quetzal Cloak reduces the impact via incomingKnockbackMult.
    const opp = this.players[1 - p.idx];
    if (cfg.knockbackOpponent) {
      const kbBase = cfg.knockbackOpponent * mods.strikeKnockbackMult * oppMods.incomingKnockbackMult;
      opp.vx += p.facing * kbBase;
    }

    const phrases = cfg.announce;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    if (Math.random() < 0.55 || strikeType === 'elbow') this._announce(phrase, intensity);

    this._spawnStrikeFlash(p, strikeType);
    if (this.match.onFire[p.idx]) this._spawnFlameBurst(p);

    // Twin Sun: spawn a SECOND ball traveling along the same trajectory.
    // It exists alongside the primary ball; either can score.
    if (mods.spawnTwinOnStrike) {
      this._spawnTwinBall(p.idx, b.x, b.depth, b.height, b.vx, b.vHeight, b.vDepth);
    }
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
    // Primary ball
    if (this._checkOneBallScoring(this.ball, false)) return;
    // Extra balls (Twin Sun spawns). If a twin scores, just remove it; don't
    // end the rally — the primary ball is still in play.
    for (let i = this.extraBalls.length - 1; i >= 0; i--) {
      const eb = this.extraBalls[i];
      if (this._checkOneBallScoring(eb, true)) {
        // Twin claimed a point; cull it
        if (eb.sprite) eb.sprite.destroy();
        if (eb.shadow) eb.shadow.destroy();
        this.extraBalls.splice(i, 1);
      }
    }
  }

  // Returns true if this ball scored. If `isTwin`, scoring credits the same
  // player but does NOT pause the rally (rally pauses only on primary ball).
  _checkOneBallScoring(b, isTwin) {
    if (b.lastTouchedBy !== null && b.depth > 0.70 && !this._hoopJustScored) {
      const floorY = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * b.depth;
      const screenY = floorY - b.height;
      const dy = screenY - MB4.HOOP_Y;
      if (Math.abs(dy) < MB4.HOOP_RADIUS_V) {
        const prevSide = (b.prevX - MB4.HOOP_X);
        const currSide = (b.x - MB4.HOOP_X);
        if ((prevSide * currSide <= 0 && Math.abs(b.vx) > 10) ||
            Math.abs(currSide) < MB4.HOOP_PASS_THICKNESS) {
          this._hoopScore(b.lastTouchedBy, isTwin);
          return true;
        }
      }
    }
    if (b.x < MB4.COURT_LEFT + 8)  { this._scoreRaya(1, b.x, isTwin); return true; }
    if (b.x > MB4.COURT_RIGHT - 8) { this._scoreRaya(0, b.x, isTwin); return true; }
    return false;
  }

  _scoreRaya(scorerIdx, hitX, isTwin) {
    this.match.score[scorerIdx]++;
    if (!isTwin) {
      this.match.pointInProgress = false;
      this.match.streak[1 - scorerIdx] = 0;
      this.match.onFire[1 - scorerIdx] = false;
    }
    Audio4.score();
    this._announce(isTwin ? 'TWIN RAYA!' : 'RAYA!', isTwin ? 1.2 : 1.0);
    Audio4.speak('raya', 1.0);
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
      this.match.pointInProgress = false;
      this._endMatch(scorerIdx, 'rayas');
      return;
    }
    if (!isTwin) this.time.delayedCall(1200, () => this._showRallyStart());
  }

  // Hoop = +3 rayas. With Twin Sun, a twin can also score a hoop —
  // doesn't end the rally if so.
  _hoopScore(scorerIdx, isTwin) {
    this._hoopJustScored = true;
    this.time.delayedCall(1500, () => { this._hoopJustScored = false; });

    this.match.score[scorerIdx] += MB4.HOOP_RAYAS;
    Audio4.hoopWin();
    Audio4.speak('hoop', 1.5);
    this._announce(isTwin ? `TWIN HOOP! +${MB4.HOOP_RAYAS}` : `HOOP! +${MB4.HOOP_RAYAS}`, 1.5);

    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const sp = this.add.image(MB4.HOOP_X, MB4.HOOP_Y, 'flame').setDepth(800);
      this.tweens.add({
        targets: sp,
        x: sp.x + Math.cos(angle) * 220,
        y: sp.y + Math.sin(angle) * 220,
        alpha: 0, scale: 0.3, duration: 1000,
        onComplete: () => sp.destroy(),
      });
    }
    this.shake.mag = 14;
    this.shake.until = this.time.now + 500;

    const floater = this.add.text(MB4.HOOP_X, MB4.HOOP_Y - 40, `+${MB4.HOOP_RAYAS}`, {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: '64px', color: '#fde375',
      stroke: '#8a1a1a', strokeThickness: 8,
    }).setOrigin(0.5).setDepth(950);
    this.tweens.add({
      targets: floater,
      y: floater.y - 100, alpha: 0, scale: 1.6,
      duration: 1400, ease: 'Cubic.easeOut',
      onComplete: () => floater.destroy(),
    });

    // Reset PRIMARY ball off the hoop. Only the primary needs a hard reset;
    // twins are culled by the caller.
    if (!isTwin) {
      this.ball.vx = (scorerIdx === 0 ? -1 : 1) * 240;
      this.ball.vHeight = 200;
      this.ball.depth = 0.85;
      this.ball.lastTouchedBy = null;
    }

    if (this.match.score[scorerIdx] >= MB4.WIN_SCORE) {
      this.match.pointInProgress = false;
      this._endMatch(scorerIdx, 'hoop');
    }
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
