// ============================================================
//  MB1 PLAY SCENE — main gameplay
//
//  Architecture mirrors MB3 (BootScene -> PlayScene), but
//  swaps the Yeats compose mechanic for MB1's quiz-gate +
//  multi-question boss-quiz mechanic.
//
//  Key differences vs MB3 PlayScene:
//   - Adds quiz-gate obstacles (impassable until answered).
//   - Boss "phases" are quiz questions, not poem-line chunks.
//   - HUD shows chapter (not poem progress).
//   - Player throws RUBBER BALLS (texture 'shovel' is reused
//     so we don't have to fork projectile/throw code).
// ============================================================
'use strict';

class PlayScene extends Phaser.Scene {
  constructor() { super('Play'); }

  init() {
    this.chapterIdx = GAME.chapterIdx;
    this.chapter = CHAPTERS[this.chapterIdx];
    this.theme = THEMES[this.chapter.theme];
    this.quizOpen = false;
    this.bossActive = false;
    this.bossDefeated = false;
    this.boss = null;
    this.bossPhase = 0; // which question of bossQuestions we're on
    this.gates = [];   // quiz gate sprites (with .data: { gateIdx, solved })
    this.levelReady = false;
  }

  create() {
    showChapterIntro(this.chapterIdx, () => this.startLevel());
  }

  startLevel() {
    this.levelReady = true;
    const w = this.levelWidth = 3400 + this.chapterIdx * 60;
    const h = GAME_H;

    this.physics.world.setBounds(0, 0, w, h);
    this.cameras.main.setBounds(0, 0, w, h);

    this.skyGfx = this.add.graphics();
    this.skyGfx.setScrollFactor(0);
    this.drawSky();

    this.hillsGfx = this.add.graphics();
    this.hillsGfx.setScrollFactor(0.3);
    this.drawHills();

    // physics groups
    this.platforms   = this.physics.add.staticGroup();
    this.oneWayGroup = this.physics.add.staticGroup();
    this.crumbles    = this.physics.add.group({ allowGravity: false, immovable: true });
    this.movers      = this.physics.add.group({ allowGravity: false, immovable: true });
    this.spikes      = this.physics.add.staticGroup();
    this.saws        = this.physics.add.group({ allowGravity: false });
    this.vines       = [];
    this.gateGroup   = this.physics.add.staticGroup();

    this.buildLevel();

    // player
    this.player = this.physics.add.sprite(80, h - 120, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(20, 32).setOffset(4, 4);
    this.player.facing = 1;
    this.player.canDoubleJump = true;   // enabled by default in MB1
    this.player.doubleJumpUsed = false;
    this.player.coyoteFrames = 0;       // counts down after leaving ground
    this.player.jumpBufferFrames = 0;   // counts down after press, before grounded
    this.player.vineCooldown = 0;
    this.player.onVine = false;
    this.player.attachedVine = null;
    this.player.setMaxVelocity(PHYS.MOVE_MAX, 1200);

    // enemies, projectiles
    this.enemies = this.physics.add.group();
    this.spawnEnemies();
    this.projectiles = this.physics.add.group({ allowGravity: false });

    // boss arena
    this.bossSpawnX = w - 380;
    this.bossSpawned = false;
    this.bossWall = null;

    // colliders
    this.physics.add.collider(this.player, this.platforms);
    this.physics.add.collider(this.player, this.oneWayGroup, null, this.oneWayCheck, this);
    this.physics.add.collider(this.player, this.crumbles, this.onCrumbleStep, null, this);
    this.physics.add.collider(this.player, this.movers);
    this.physics.add.collider(this.player, this.gateGroup, this.onGateBump, null, this);
    this.physics.add.overlap(this.player, this.spikes, this.onPlayerSpike, null, this);
    this.physics.add.overlap(this.player, this.saws,   this.onPlayerHazard, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerEnemy, null, this);

    this.physics.add.collider(this.enemies, this.platforms);
    this.physics.add.collider(this.enemies, this.oneWayGroup, null, this.oneWayCheck, this);
    this.physics.add.collider(this.enemies, this.movers);

    this.physics.add.overlap(this.projectiles, this.enemies, this.onProjEnemy, null, this);
    this.physics.add.collider(this.projectiles, this.platforms, this.onProjGround, null, this);

    this.cameras.main.startFollow(this.player, true, 0.18, 0.12);
    this.cameras.main.setDeadzone(80, 60);

    this.dustParticles = this.add.particles(0, 0, 'dot', {
      lifespan: 400,
      speed: { min: -60, max: 60 },
      gravityY: 200,
      scale: { start: 1.2, end: 0 },
      tint: this.theme.dust,
      emitting: false,
    });

    document.getElementById('hud').classList.remove('hidden');
    document.body.classList.add('hud-visible');
    this.updateHud();

    showToast(`Chapter ${this.chapter.num}: ${this.chapter.title}`, 2400);
  }

  // ----- level building -----
  buildLevel() {
    const w = this.levelWidth;
    const h = GAME_H;
    const groundY = h - 64;
    const bossArenaStart = w - 580;

    // ---- gaps for platforming ----
    const gaps = [];
    const gapCount = 3 + (this.chapterIdx % 3);
    const minGapX = 480;
    const maxGapX = bossArenaStart - 220;
    for (let i = 0; i < gapCount; i++) {
      const gx = minGapX + ((maxGapX - minGapX) * (i + 0.5) / gapCount) + (Math.random() * 80 - 40);
      const gw = 80 + Math.random() * 60;
      gaps.push({ x: gx, w: gw });
    }

    // ---- ground tiles ----
    const tileW = 32;
    const groundRows = Math.ceil((GAME_H - groundY) / tileW);
    for (let x = 0; x < w; x += tileW) {
      const inGap = gaps.some(g => x + tileW > g.x && x < g.x + g.w);
      if (inGap) continue;
      const t = this.platforms.create(x + tileW/2, groundY + tileW/2, 'ground_tile');
      t.setOrigin(0.5, 0.5);
      t.refreshBody();
      t.setTint(this.theme.ground);
      for (let r = 1; r < groundRows; r++) {
        const dec = this.add.image(x + tileW/2, groundY + tileW/2 + r * tileW, 'ground_tile');
        dec.setOrigin(0.5, 0.5);
        dec.setTint(this.theme.ground);
      }
      const stripe = this.add.rectangle(x + tileW/2, groundY + 2, tileW, 4, this.theme.groundTop);
      stripe.setDepth(1);
    }
    this.gaps = gaps;
    this.groundY = groundY;
    this.bossArenaStart = bossArenaStart;

    // ---- spike pits in gaps ----
    for (const g of gaps) Obstacles.spikePit(this, g.x, g.w, groundY);

    // ---- platform patterns over each gap ----
    for (const g of gaps) {
      const cx = g.x + g.w / 2;
      const pattern = (this.chapterIdx + Math.floor(cx / 200)) % 5;
      const platY = groundY - 100;
      switch (pattern) {
        case 0:
          Obstacles.platform(this, cx, platY, 96);
          break;
        case 1:
          Obstacles.crumble(this, cx - 60, platY, 80);
          Obstacles.crumble(this, cx + 60, platY - 40, 80);
          break;
        case 2:
          Obstacles.mover(this, cx, platY, 96, 'horizontal', 80);
          break;
        case 3:
          Obstacles.mover(this, cx - 50, platY + 30, 80, 'vertical', 60);
          Obstacles.oneWay(this, cx + 80, platY - 60, 96);
          break;
        case 4:
          Obstacles.saw(this, cx, platY + 80, 'horizontal', 60, g.w * 0.7);
          Obstacles.platform(this, cx, platY - 30, 96);
          break;
      }
    }

    // ---- vines (chapters 2+) ----
    if (this.chapterIdx >= 1) {
      const numVines = 1 + Math.min(this.chapterIdx, 3);
      for (let i = 0; i < numVines; i++) {
        const vx = 700 + (i + 1) * (bossArenaStart - 700) / (numVines + 1);
        Obstacles.vine(this, vx, 80, 200);
      }
    }

    // ---- QUIZ GATES — distinctive to MB1 ----
    // One gate per quizGate question, evenly spaced through the level.
    // Each gate has a static sprite + an invisible blocker collider.
    const gateData = this.chapter.quizGates || [];
    const gateXSpacing = (bossArenaStart - 600) / (gateData.length + 1);
    for (let i = 0; i < gateData.length; i++) {
      const gx = 600 + (i + 1) * gateXSpacing;
      this.makeGate(gx, groundY, i);
    }
  }

  makeGate(x, groundY, gateIdx) {
    // Visual sprite of the column/idol
    const sprite = this.gateGroup.create(x, groundY - 40, 'gate');
    sprite.setOrigin(0.5, 1);
    sprite.body.setSize(32, 80);
    sprite.refreshBody();
    sprite.setTint(this.theme.accent);
    sprite.gateIdx = gateIdx;
    sprite.solved = GAME.answeredCorrect.has(`${this.chapterIdx}-gate-${gateIdx}`);

    // Glowing aura behind the gate
    const aura = this.add.circle(x, groundY - 40, 36, 0xf5d870, 0.18);
    aura.setDepth(-1);
    sprite.aura = aura;

    if (sprite.solved) {
      // Already solved on a previous run — make it visually faded and
      // disable the collider entirely.
      sprite.body.enable = false;
      sprite.setAlpha(0.3);
      aura.setAlpha(0);
    }

    this.gates.push(sprite);
  }

  spawnEnemies() {
    const numEnemies = 4 + Math.min(this.chapterIdx, 5);
    const w = this.levelWidth;
    // Enemy mix varies by theme — picks species that fit
    const themeName = this.chapter.theme;
    const speciesMap = {
      rainforest_dawn: ['parrot', 'jaguar'],
      rainforest:      ['parrot', 'jaguar', 'spider'],
      deep_forest:     ['spider', 'jaguar'],
      ballcourt:       ['jaguar', 'parrot'],
      coast:           ['conquistador', 'parrot'],
      ruins:           ['specter', 'spider'],
      europe:          ['conquistador', 'specter'],
      amazon:          ['parrot', 'jaguar', 'spider'],
      modern:          ['specter', 'spider'],
    };
    const species = speciesMap[themeName] || ['jaguar', 'spider'];

    for (let i = 0; i < numEnemies; i++) {
      const ex = 400 + i * (w / (numEnemies + 2));
      // skip placement if inside a gap
      if (this.gaps.some(g => ex > g.x - 30 && ex < g.x + g.w + 30)) continue;
      const sp = species[i % species.length];
      this.spawnEnemy(ex, this.groundY - 40, sp);
    }
  }

  spawnEnemy(x, y, sp) {
    const e = this.physics.add.sprite(x, y, sp);
    e.setCollideWorldBounds(true);
    e.body.setSize(20, 20).setOffset(4, 4);
    e.species = sp;
    e.setVelocityX((Math.random() < 0.5 ? -1 : 1) * 60);
    // Specters and parrots float
    if (sp === 'specter' || sp === 'parrot') {
      e.body.allowGravity = false;
      e.floatPhase = Math.random() * Math.PI * 2;
      e.floatY = y;
      e.setVelocityX((Math.random() < 0.5 ? -1 : 1) * 80);
    }
    this.enemies.add(e);
    return e;
  }

  drawSky() {
    const g = this.skyGfx;
    g.clear();
    const sky = this.theme.sky;
    // 3-stop vertical gradient
    const steps = 60;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      let col;
      if (t < 0.5) col = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.HexStringToColor(sky[0]),
        Phaser.Display.Color.HexStringToColor(sky[1]),
        100, Math.floor(t * 200)
      );
      else col = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.HexStringToColor(sky[1]),
        Phaser.Display.Color.HexStringToColor(sky[2]),
        100, Math.floor((t - 0.5) * 200)
      );
      const hex = Phaser.Display.Color.GetColor(col.r, col.g, col.b);
      g.fillStyle(hex, 1);
      g.fillRect(0, i * (GAME_H / steps), GAME_W, GAME_H / steps + 1);
    }
    if (this.theme.stars) {
      g.fillStyle(0xffffff, 1);
      for (let i = 0; i < 70; i++) {
        const sx = Math.random() * GAME_W;
        const sy = Math.random() * GAME_H * 0.6;
        g.fillRect(sx, sy, 1.5, 1.5);
      }
    }
  }

  drawHills() {
    const g = this.hillsGfx;
    g.clear();
    g.fillStyle(this.theme.ground, 0.6);
    for (let i = 0; i < 6; i++) {
      const cx = i * 220 + 80;
      g.fillTriangle(cx - 100, GAME_H, cx, GAME_H - 120 - (i % 2) * 30, cx + 100, GAME_H);
    }
  }

  // ===== input handlers =====
  oneWayCheck(player, oneway) {
    // only collide when player is above and falling
    return player.body.velocity.y > 0 && player.body.bottom <= oneway.body.top + 8;
  }

  onCrumbleStep(player, c) {
    // ObstaclesUpdate.crumbles handles the actual crumble physics each frame.
    // Here we just mark it crumbling when stepped on from above.
    if (c.crumbling) return;
    if (player.body.bottom <= c.body.top + 6 && player.body.velocity.y >= 0) {
      c.crumbling = true;
      c.crumbleTimer = 0;
    }
  }

  onPlayerSpike() { this.damagePlayer(); }
  onPlayerHazard() { this.damagePlayer(); }

  onPlayerEnemy(player, e) {
    // stomp = kill enemy if player is falling onto it
    if (player.body.velocity.y > 0 && player.body.bottom <= e.body.top + 12) {
      this.killEnemy(e);
      player.setVelocityY(-360);
      Audio.stomp();
    } else {
      this.damagePlayer();
    }
  }

  onProjEnemy(proj, e) {
    this.killEnemy(e);
    proj.destroy();
    Audio.bossHit();
  }

  onProjGround(proj) {
    // A rubber ball bounces! Reverse Y and dampen.
    if (proj.body.velocity.y > 50) {
      proj.body.velocity.y = -proj.body.velocity.y * 0.55;
      proj.body.velocity.x *= 0.85;
      proj.bouncesLeft = (proj.bouncesLeft || 2) - 1;
      if (proj.bouncesLeft <= 0) proj.destroy();
    } else {
      proj.destroy();
    }
  }

  onGateBump(player, gate) {
    if (gate.solved || this.quizOpen) return;
    // Stop player at gate; show gate quiz
    this.quizOpen = true;
    player.setVelocity(0, 0);
    showQuizGate(this.chapterIdx, gate.gateIdx,
      /*onCorrect=*/ () => {
        gate.solved = true;
        GAME.answeredCorrect.add(`${this.chapterIdx}-gate-${gate.gateIdx}`);
        // open the gate visually + remove collision
        this.tweens.add({
          targets: gate, alpha: 0.3, duration: 400,
        });
        if (gate.aura) gate.aura.setAlpha(0);
        gate.body.enable = false;
        this.quizOpen = false;
        Audio.victory();
      },
      /*onWrong=*/ () => {
        // Bump player back so they don't immediately re-trigger
        player.setX(player.x - 30);
        this.quizOpen = false;
        this.damagePlayer();
      }
    );
  }

  killEnemy(e) {
    // particle burst
    if (this.dustParticles) {
      this.dustParticles.setPosition(e.x, e.y);
      this.dustParticles.explode(8);
    }
    e.destroy();
  }

  damagePlayer() {
    if (this.time.now < GAME.invincibleUntil) return;
    GAME.hp -= 1;
    GAME.invincibleUntil = this.time.now + 1200;
    Audio.damage();
    // flash player
    this.tweens.add({
      targets: this.player, alpha: 0.3, duration: 100,
      yoyo: true, repeat: 5,
      onComplete: () => { this.player.alpha = 1; }
    });
    this.updateHud();
    if (GAME.hp <= 0) this.gameOver();
  }

  gameOver() {
    this.scene.pause();
    document.getElementById('hud').classList.add('hidden');
    document.body.classList.remove('hud-visible');
    showGameOver(this.chapterIdx);
  }

  // ----- player update -----
  update(time, delta) {
    if (!this.levelReady || this.quizOpen) return;

    const p = this.player;
    Input.tick();

    const onGround = p.body.blocked.down || p.body.touching.down;

    // horizontal movement — accelerate toward target, gently decelerate when no input
    if (Input.left) {
      p.body.acceleration.x = -PHYS.MOVE_ACCEL;
      p.facing = -1;
      p.flipX = true;
    } else if (Input.right) {
      p.body.acceleration.x = PHYS.MOVE_ACCEL;
      p.facing = 1;
      p.flipX = false;
    } else {
      p.body.acceleration.x = 0;
      // Gentle damping per-frame; on ground it's noticeable, in air it barely matters.
      p.body.velocity.x *= (onGround ? PHYS.FRICTION_GROUND : PHYS.FRICTION_AIR);
      // Snap tiny residual to zero so the player actually stops
      if (Math.abs(p.body.velocity.x) < 4) p.body.velocity.x = 0;
    }
    // (max velocity is enforced by setMaxVelocity at spawn — no need to clamp here)

    // ----- jump with coyote time + jump buffer -----
    // Coyote: keep "can jump from ground" alive for a few frames after leaving a ledge
    if (onGround) {
      p.coyoteFrames = PHYS.COYOTE_FRAMES;
      p.doubleJumpUsed = false;
    } else if (p.coyoteFrames > 0) {
      p.coyoteFrames--;
    }
    // Jump buffer: if pressed shortly before landing, the press persists briefly
    if (Input.jumpPressed) {
      p.jumpBufferFrames = PHYS.JUMP_BUFFER_FRAMES;
    } else if (p.jumpBufferFrames > 0) {
      p.jumpBufferFrames--;
    }

    if (p.jumpBufferFrames > 0) {
      if (p.coyoteFrames > 0) {
        // ground jump (counts coyote-time as ground)
        p.setVelocityY(-PHYS.JUMP_POWER);
        p.coyoteFrames = 0;
        p.jumpBufferFrames = 0;
        p.doubleJumpUsed = false;
        Audio.jump();
      } else if (p.canDoubleJump && !p.doubleJumpUsed) {
        // air double-jump
        p.setVelocityY(-PHYS.DOUBLE_JUMP_POWER);
        p.doubleJumpUsed = true;
        p.jumpBufferFrames = 0;
        Audio.doubleJump();
      }
    }
    // variable-height jump: dampen velocity (don't hard-cut) when player releases jump
    if (!Input.jump && p.body.velocity.y < 0) {
      p.body.velocity.y *= PHYS.JUMP_RELEASE_DAMP;
    }

    // throw rubber ball
    if (Input.throwPressed && time > (p.throwCooldown || 0)) {
      this.throwBall();
      p.throwCooldown = time + 380;
    }

    // floating enemies
    this.enemies.children.iterate(e => {
      if (!e || !e.active) return;
      if (e.species === 'specter' || e.species === 'parrot') {
        e.floatPhase += 0.04;
        e.y = e.floatY + Math.sin(e.floatPhase) * 16;
      }
      // turn around at edges / walls
      if (e.body.blocked.left) e.setVelocityX(Math.abs(e.body.velocity.x) || 60);
      else if (e.body.blocked.right) e.setVelocityX(-Math.abs(e.body.velocity.x) || -60);
    });

    // boss spawn — when player crosses arena threshold AND all gates solved
    if (!this.bossSpawned && p.x > this.bossArenaStart && this.allGatesSolved()) {
      this.spawnBoss();
    }

    // boss behavior
    if (this.bossActive && this.boss && this.boss.active) this.bossUpdate(delta);

    // delegated obstacle animation/physics
    ObstaclesUpdate.crumbles(this);
    ObstaclesUpdate.movers(this);
    ObstaclesUpdate.carryPlayerOnMovers(this, this.player);
    ObstaclesUpdate.saws(this);
    ObstaclesUpdate.vines(this, this.player);
  }

  allGatesSolved() {
    return this.gates.every(g => g.solved);
  }

  throwBall() {
    const p = this.player;
    const proj = this.projectiles.create(p.x + p.facing * 18, p.y, 'shovel');
    proj.body.allowGravity = true;
    proj.body.gravity.y = PHYS.THROW_GRAVITY;
    proj.setVelocity(p.facing * PHYS.THROW_VEL_X, PHYS.THROW_VEL_Y);
    proj.bouncesLeft = 2;
    // life timeout
    this.time.delayedCall(2000, () => { if (proj.active) proj.destroy(); });
    Audio.throwShovel();
  }

  // ===== BOSS =====
  spawnBoss() {
    this.bossSpawned = true;
    this.bossActive = true;
    const groundY = this.groundY;
    // Invisible wall to keep player in arena
    this.bossWall = this.physics.add.staticImage(this.bossArenaStart - 60, GAME_H / 2, 'tile');
    this.bossWall.displayWidth = 8;
    this.bossWall.displayHeight = GAME_H + 200;
    this.bossWall.setVisible(false);
    this.bossWall.refreshBody();
    this.physics.add.collider(this.player, this.bossWall);

    const bx = this.bossSpawnX + 200;
    const by = groundY - 50;
    const b = this.physics.add.sprite(bx, by, 'boss' + this.chapterIdx);
    b.setOrigin(0.5, 1);
    b.body.allowGravity = false;
    b.body.setSize(72, 130).setOffset(12, 12);
    b.setDepth(5);
    b.center = { x: bx, y: by };
    b.dir = -1;
    b.range = 140;
    b.speed = 0.022 * (1 + this.chapterIdx * 0.05);
    b.phase = 0;
    b.shieldUp = true;
    b.shieldFrames = 240;
    b.vulnerableFrames = 120;
    b.invulnFrames = 0;
    b.throwTimer = 90 + Math.random() * 90;
    b.throwTelegraph = 0;
    b.tickCount = 0;

    // shield ring graphic
    b.shieldGfx = this.add.graphics();
    b.shieldGfx.setDepth(4);

    this.boss = b;
    this.physics.add.overlap(this.projectiles, b, this.onProjBoss, null, this);
    this.physics.add.overlap(this.player, b, this.onPlayerBoss, null, this);

    // boss banner
    showBossBanner(this.chapter.bossName);
  }

  bossUpdate(delta) {
    const b = this.boss;
    b.tickCount++;
    // sine motion around center
    const t = b.tickCount * b.speed;
    b.x = b.center.x + Math.sin(t) * b.range;

    // shield cycle
    if (b.invulnFrames > 0) b.invulnFrames--;
    if (b.shieldUp) {
      b.shieldFrames--;
      if (b.shieldFrames <= 0) {
        b.shieldUp = false;
        b.vulnerableFrames = 120;
      }
      // throw projectile periodically
      b.throwTimer--;
      if (b.throwTimer <= 0 && b.throwTelegraph === 0) {
        b.throwTelegraph = 25;
        b.setTint(0xff8a3a);
      } else if (b.throwTelegraph > 0) {
        b.throwTelegraph--;
        if (b.throwTelegraph === 0) {
          b.clearTint();
          this.bossThrow();
          b.throwTimer = 90 + Math.random() * 90;
        }
      }
    } else {
      b.vulnerableFrames--;
      if (b.vulnerableFrames <= 0) {
        b.shieldUp = true;
        b.shieldFrames = Math.max(180, 240 - b.phase * 10);
      }
    }

    // draw shield
    b.shieldGfx.clear();
    if (b.shieldUp && b.invulnFrames === 0) {
      b.shieldGfx.lineStyle(3, 0x88c4ff, 0.7);
      b.shieldGfx.strokeCircle(b.x, b.y - 50, 60);
      b.shieldGfx.fillStyle(0x88c4ff, 0.12);
      b.shieldGfx.fillCircle(b.x, b.y - 50, 60);
    }
  }

  bossThrow() {
    const b = this.boss;
    const target = this.player;
    const proj = this.physics.add.sprite(b.x, b.y - 60, 'boss_proj');
    proj.body.allowGravity = true;
    proj.body.gravity.y = 720;
    const dx = target.x - b.x;
    proj.setVelocity(Math.sign(dx) * 260, -340);
    this.physics.add.overlap(this.player, proj, () => {
      proj.destroy();
      this.damagePlayer();
    }, null, this);
    this.time.delayedCall(3000, () => { if (proj.active) proj.destroy(); });
  }

  onProjBoss(proj, b) {
    proj.destroy();
    if (b.shieldUp || b.invulnFrames > 0) {
      // bounce off shield
      Audio.bossHit();
      return;
    }
    // Hit while vulnerable -> open boss quiz question
    Audio.bossHit();
    b.invulnFrames = 36;
    b.shieldUp = true;
    b.shieldFrames = 240;
    this.physics.pause();
    this.quizOpen = true;
    showBossQuestion(this.chapterIdx, this.bossPhase,
      /*onCorrect=*/ () => {
        GAME.answeredCorrect.add(`${this.chapterIdx}-boss-${this.bossPhase}`);
        this.bossPhase++;
        this.physics.resume();
        this.quizOpen = false;
        // boss flash damaged
        this.tweens.add({ targets: b, alpha: 0.3, duration: 80, yoyo: true, repeat: 2 });
        if (this.bossPhase >= this.chapter.bossQuestions.length) {
          this.bossDefeat();
        }
      },
      /*onWrong=*/ () => {
        this.physics.resume();
        this.quizOpen = false;
        this.damagePlayer();
      }
    );
  }

  onPlayerBoss(p, b) {
    if (b.invulnFrames > 0) return;
    this.damagePlayer();
  }

  bossDefeat() {
    this.bossActive = false;
    this.bossDefeated = true;
    const b = this.boss;
    if (b && b.active) {
      this.tweens.add({
        targets: b, alpha: 0, scaleX: 0.5, scaleY: 0.5, angle: 360, duration: 800,
        onComplete: () => {
          if (b.shieldGfx) b.shieldGfx.destroy();
          b.destroy();
        }
      });
    }
    Audio.victory();
    // show chapter complete
    this.time.delayedCall(900, () => this.chapterComplete());
  }

  chapterComplete() {
    document.getElementById('hud').classList.add('hidden');
    document.body.classList.remove('hud-visible');
    if (GAME.chapterIdx >= CHAPTERS.length - 1) {
      // Final chapter -> victory
      showVictory();
    } else {
      showChapterComplete(this.chapterIdx, () => {
        GAME.chapterIdx++;
        this.scene.stop('Play');
        this.scene.start('Boot');
      });
    }
  }

  // ----- HUD -----
  updateHud() {
    document.getElementById('hud-hearts').textContent = '♥'.repeat(Math.max(0, GAME.hp));
    document.getElementById('hud-level').textContent = `Chapter ${GAME.chapterIdx + 1} / ${CHAPTERS.length}`;
    document.getElementById('hud-words').textContent = `📚 ${this.chapter.title}`;
  }
}
