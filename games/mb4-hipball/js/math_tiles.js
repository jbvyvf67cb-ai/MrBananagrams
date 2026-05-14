// ============================================================
//  MATH TILES — decimal/fraction comparison tiles spawn on the
//  court mid-rally. Stepping on a correct one advances the
//  player's math streak; wrong = buzzer + reset.
// ============================================================
'use strict';

(function () {

// ---- Equation bank ----
// Each entry: { lhs, op, rhs, correct }
// op is '<', '>', or '='
// 'correct' is whether the statement as written is true.
// Three tiers: easy, normal, hard. The play scene picks from tiers based on
// rally number (easier early, harder late) — see MathTileManager.pickEquation.

const BANK_EASY = [
  // halves, quarters, simple decimals
  { lhs: '1/2',  op: '=', rhs: '0.5',  correct: true  },
  { lhs: '1/4',  op: '=', rhs: '0.25', correct: true  },
  { lhs: '3/4',  op: '=', rhs: '0.75', correct: true  },
  { lhs: '1/2',  op: '>', rhs: '0.3',  correct: true  },
  { lhs: '1/2',  op: '<', rhs: '0.6',  correct: true  },
  { lhs: '0.5',  op: '>', rhs: '1/4',  correct: true  },
  { lhs: '0.75', op: '<', rhs: '0.8',  correct: true  },
  // wrong easy ones
  { lhs: '1/2',  op: '=', rhs: '0.2',  correct: false },
  { lhs: '1/4',  op: '>', rhs: '1/2',  correct: false },
  { lhs: '0.5',  op: '<', rhs: '1/4',  correct: false },
  { lhs: '3/4',  op: '=', rhs: '0.34', correct: false },
  { lhs: '0.9',  op: '<', rhs: '0.5',  correct: false },
  { lhs: '1/2',  op: '=', rhs: '0.05', correct: false },
];

const BANK_NORMAL = [
  // tenths, hundredths
  { lhs: '0.7',  op: '=', rhs: '7/10', correct: true  },
  { lhs: '0.3',  op: '=', rhs: '3/10', correct: true  },
  { lhs: '0.05', op: '=', rhs: '1/20', correct: true  },
  { lhs: '0.6',  op: '>', rhs: '1/2',  correct: true  },
  { lhs: '2/5',  op: '<', rhs: '0.5',  correct: true  },
  { lhs: '0.4',  op: '=', rhs: '2/5',  correct: true  },
  { lhs: '0.8',  op: '>', rhs: '3/4',  correct: true  },
  { lhs: '1/5',  op: '<', rhs: '0.3',  correct: true  },
  // wrongs
  { lhs: '0.7',  op: '=', rhs: '7/100', correct: false },
  { lhs: '0.3',  op: '>', rhs: '0.5',   correct: false },
  { lhs: '2/5',  op: '=', rhs: '0.25',  correct: false },
  { lhs: '0.8',  op: '<', rhs: '3/4',   correct: false },
  { lhs: '1/5',  op: '=', rhs: '0.5',   correct: false },
  { lhs: '0.05', op: '>', rhs: '0.5',   correct: false },
];

const BANK_HARD = [
  // eighths, thirds-ish (rational approximations of decimals)
  { lhs: '0.625', op: '=', rhs: '5/8',  correct: true  },
  { lhs: '0.125', op: '=', rhs: '1/8',  correct: true  },
  { lhs: '0.375', op: '=', rhs: '3/8',  correct: true  },
  { lhs: '7/8',   op: '>', rhs: '0.8',  correct: true  },
  { lhs: '3/8',   op: '<', rhs: '1/2',  correct: true  },
  { lhs: '2/3',   op: '>', rhs: '0.6',  correct: true  },
  { lhs: '0.7',   op: '>', rhs: '2/3',  correct: true  },
  { lhs: '5/8',   op: '<', rhs: '0.7',  correct: true  },
  // wrongs (some tempting ones — like 1/3 = 0.3)
  { lhs: '1/3',   op: '=', rhs: '0.3',  correct: false },
  { lhs: '2/3',   op: '=', rhs: '0.6',  correct: false },
  { lhs: '0.625', op: '<', rhs: '5/8',  correct: false },
  { lhs: '5/8',   op: '=', rhs: '0.58', correct: false },
  { lhs: '7/8',   op: '<', rhs: '0.8',  correct: false },
  { lhs: '1/8',   op: '>', rhs: '0.2',  correct: false },
];

class MathTileManager {
  constructor(scene) {
    this.scene = scene;
    this.tiles = [];     // active tiles on the court
    this.nextSpawnAt = 0;
    this._nextId = 1;
  }

  // Picks an equation appropriate to the current rally state.
  // Early-match → easier; late-match → harder. Mix in a few wrongs always.
  pickEquation() {
    // Difficulty climbs based on combined match score
    const totalScore = (this.scene.match.score[0] + this.scene.match.score[1]);
    const r = Math.random();
    let bank;
    if (totalScore < 3)       bank = (r < 0.85) ? BANK_EASY   : BANK_NORMAL;
    else if (totalScore < 6)  bank = (r < 0.50) ? BANK_EASY   : (r < 0.85 ? BANK_NORMAL : BANK_HARD);
    else                      bank = (r < 0.25) ? BANK_NORMAL : BANK_HARD;
    return bank[Math.floor(Math.random() * bank.length)];
  }

  // Spawn a new tile at a random open spot on the court.
  spawnTile(now) {
    if (this.tiles.length >= MB4.MATH.MAX_TILES) return null;
    const eq = this.pickEquation();
    const x = 200 + Math.random() * (MB4.COURT_RIGHT - MB4.COURT_LEFT - 240);
    const depth = 0.15 + Math.random() * 0.7;   // anywhere on the floor
    const tile = {
      id: this._nextId++,
      eq, x, depth,
      bornAt: now,
      expiresAt: now + MB4.MATH.LIFESPAN_MS,
      resolved: false,
      // visual fields filled in below
    };
    tile.visual = this._makeVisual(tile);
    this.tiles.push(tile);
    return tile;
  }

  _makeVisual(tile) {
    const scene = this.scene;
    const screenX = scene._perspectiveX(tile.x, tile.depth);
    const floorY = MB4.FLOOR_FRONT_Y + (MB4.FLOOR_BACK_Y - MB4.FLOOR_FRONT_Y) * tile.depth;
    const w = MB4.MATH.TILE_W * (1 - 0.3 * tile.depth);
    const h = MB4.MATH.TILE_H * (1 - 0.3 * tile.depth);
    const container = scene.add.container(screenX, floorY - 8).setDepth(150 + tile.depth * 10);

    // tablet background
    const bg = scene.add.graphics();
    bg.fillStyle(0x1a0820, 0.85);
    bg.fillRoundedRect(-w/2, -h/2, w, h, 4);
    bg.lineStyle(2, 0xfde375, 1);
    bg.strokeRoundedRect(-w/2, -h/2, w, h, 4);
    container.add(bg);

    // glow pulse (subtle)
    const glow = scene.add.graphics();
    glow.fillStyle(0xfde375, 0.18);
    glow.fillRoundedRect(-w/2 - 6, -h/2 - 6, w + 12, h + 12, 8);
    container.addAt(glow, 0);
    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.3, to: 0.08 },
      duration: 800, yoyo: true, repeat: -1,
    });

    // equation text — render with mathematical operator
    const opChar = tile.eq.op === '=' ? '=' : (tile.eq.op === '<' ? '<' : '>');
    const text = `${tile.eq.lhs} ${opChar} ${tile.eq.rhs}`;
    const t = scene.add.text(0, 0, text, {
      fontFamily: '"Black Ops One", "Arial Black", sans-serif',
      fontSize: Math.max(14, Math.round(20 * (1 - 0.3 * tile.depth))) + 'px',
      color: '#fff4c8',
      stroke: '#1a0820', strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(t);

    return { container, bg, glow, text: t };
  }

  // Called each frame from PlayScene.update.
  tick(now) {
    // Spawn timer
    if (now >= this.nextSpawnAt) {
      this.spawnTile(now);
      const jitter = (Math.random() * 2 - 1) * MB4.MATH.SPAWN_JITTER_MS;
      this.nextSpawnAt = now + MB4.MATH.SPAWN_INTERVAL_MS + jitter;
    }

    // Expire tiles
    for (const tile of this.tiles) {
      if (tile.resolved) continue;
      // Reposition (in case court moved? — currently no, but safe)
      if (now >= tile.expiresAt) this._fadeOutTile(tile, /*resolved=*/false);
    }
    this.tiles = this.tiles.filter(t => !t._removed);

    // Player overlap test
    for (const p of this.scene.players) this._checkPlayerOverlap(p, now);
  }

  _checkPlayerOverlap(player, now) {
    if (!player.onGround) return;   // jumping players don't trigger tiles
    for (const tile of this.tiles) {
      if (tile.resolved) continue;
      const dx = player.x - tile.x;
      const dDepth = player.depth - tile.depth;
      // Tile collision in WORLD coords; convert tile dims to world-units roughly
      const halfW = MB4.MATH.TILE_W / 2;
      const halfDepth = MB4.MATH.TILE_H / 200;   // tile is shallow in depth-axis
      if (Math.abs(dx) < halfW && Math.abs(dDepth) < halfDepth + 0.06) {
        this._resolveTile(tile, player, now);
        return;   // one tile per player per frame
      }
    }
  }

  _resolveTile(tile, player, now) {
    tile.resolved = true;
    const correct = tile.eq.correct;
    if (correct) {
      player.mathStreak = (player.mathStreak || 0) + 1;
      Audio4.mathRight();
      this._flashTile(tile, 0x4ea886);
      this.scene._mathFloatText(tile, '\u2713', '#4ea886');
      // Check unlocks
      if (player.mathStreak === MB4.MATH.STREAK_MINOR) {
        this.scene._earnPowerUp(player, 'minor');
      } else if (player.mathStreak === MB4.MATH.STREAK_MAJOR) {
        this.scene._earnPowerUp(player, 'major');
        player.mathStreak = 0;   // reset after major
      }
    } else {
      player.mathStreak = 0;
      Audio4.mathWrong();
      this._flashTile(tile, 0xc0392b);
      this.scene._mathFloatText(tile, '\u2717', '#c0392b');
    }
    // Fade out the resolved tile
    setTimeout(() => this._fadeOutTile(tile, true), 300);
  }

  _flashTile(tile, color) {
    const v = tile.visual;
    v.bg.clear();
    const w = MB4.MATH.TILE_W * (1 - 0.3 * tile.depth);
    const h = MB4.MATH.TILE_H * (1 - 0.3 * tile.depth);
    v.bg.fillStyle(color, 0.8);
    v.bg.fillRoundedRect(-w/2, -h/2, w, h, 4);
    v.bg.lineStyle(3, 0xffffff, 1);
    v.bg.strokeRoundedRect(-w/2, -h/2, w, h, 4);
  }

  _fadeOutTile(tile, resolved) {
    if (tile._removed) return;
    tile._removed = true;
    this.scene.tweens.add({
      targets: tile.visual.container,
      alpha: 0,
      scale: resolved ? 1.4 : 0.8,
      duration: 280,
      onComplete: () => tile.visual.container.destroy(),
    });
  }

  destroyAll() {
    for (const t of this.tiles) {
      if (t.visual && t.visual.container) t.visual.container.destroy();
    }
    this.tiles = [];
  }
}

window.MathTileManager = MathTileManager;
})();
