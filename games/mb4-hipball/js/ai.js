// ============================================================
//  AI BOT — generates inputs for player 2 in single-player.
//  Reads the scene's ball + player state, returns an input object
//  in the same shape as Input4.p1.
// ============================================================
'use strict';

(function () {
  function freshBotState() {
    return {
      input: window.Input4.freshInput(),
      nextDecisionAt: 0,
      targetX: 0,
      desperationJump: false,
      lastStrikeType: null,
    };
  }

  // Decide bot inputs. Called every frame; the bot only "rethinks" every
  // reactionMs to mimic human reflex.
  function tick(bot, ctx) {
    const now = ctx.now;
    const ball = ctx.ball;
    const me = ctx.player;     // bot's own player (player 2)
    const opp = ctx.opponent;  // human (player 1)
    const aggr = MB4.AI.aggressionByDifficulty[ctx.difficulty] || 0.78;

    // edge-trigger reset
    const inp = bot.input;
    // capture pre-state for edge detection
    const prevHip = inp.hip, prevKnee = inp.knee, prevElbow = inp.elbow, prevJump = inp.jump;

    if (now >= bot.nextDecisionAt) {
      bot.nextDecisionAt = now + MB4.AI.reactionMs * (1 + (1 - aggr) * 0.5);
      decide(bot, ctx, aggr);
    }

    // Steer toward targetX
    const dx = bot.targetX - me.x;
    inp.left  = dx < -8;
    inp.right = dx > 8;
    // Depth steering (only when bot has a depth target — e.g. chasing a tile)
    inp.fwd = false; inp.back = false;
    if (bot.targetDepth !== null && bot.targetDepth !== undefined) {
      const dDepth = bot.targetDepth - me.depth;
      if (dDepth > 0.05) inp.fwd = true;
      else if (dDepth < -0.05) inp.back = true;
    }

    // strikes — only fire if the ball is close enough horizontally
    const ballDx = ball.x - me.x;
    const ballDy = (ball.y - ball.height) - me.y;   // ball world Y minus ball height
    const facing = ball.x >= me.x ? 1 : -1;
    me.facing = facing;
    const closeX = Math.abs(ballDx) < 60;
    const ballOnMyHalf = (ball.x > 480 && me.side === 'right') || (ball.x <= 480 && me.side === 'left');

    // jump if ball is overhead+coming, or if elbow shot is the play
    inp.jump = false;
    if (closeX && ballDy < -10 && me.onGround && Math.random() < 0.6 * aggr) {
      inp.jump = true;
      bot.desperationJump = false;
    } else if (ballOnMyHalf && !me.onGround && Math.random() < 0.05) {
      // already in the air, do nothing extra
    }

    // strike if close. choose type by ball height relative to player.
    inp.hip = false; inp.knee = false; inp.elbow = false;
    if (closeX && ball.height < 50 && Math.abs(ballDy) < 60) {
      // ground-level — knee or hip
      if (Math.random() < 0.4) inp.knee = true; else inp.hip = true;
    } else if (closeX && ball.height >= 50 && ball.height < 120) {
      // mid — hip default
      inp.hip = true;
    } else if (closeX && ball.height >= 120 && !me.onGround) {
      // high in the air — elbow!
      inp.elbow = true;
    } else if (closeX && Math.random() < 0.15 * aggr) {
      // occasional aggressive strike anyway
      inp.hip = true;
    }

    // Easy-mode flubs: sometimes the bot just doesn't strike
    if (ctx.difficulty === 'easy' && Math.random() < 0.3) {
      inp.hip = inp.knee = inp.elbow = false;
    }

    // edge-trigger flags
    inp.hipPressed   = inp.hip   && !prevHip;
    inp.kneePressed  = inp.knee  && !prevKnee;
    inp.elbowPressed = inp.elbow && !prevElbow;
    inp.jumpPressed  = inp.jump  && !prevJump;
  }

  function decide(bot, ctx, aggr) {
    const ball = ctx.ball;
    const me = ctx.player;

    // Default: shadow the ball's X with some error.
    const err = (Math.random() * 2 - 1) * MB4.AI.aimErrorPx * (1 - aggr * 0.5);
    bot.targetX = ball.x + err;
    bot.targetDepth = null;   // ignored if null

    // Stay on own side mostly (don't cross to opponent's half too far)
    const minX = me.side === 'left' ? MB4.COURT_LEFT + 30 : 480;
    const maxX = me.side === 'left' ? 480 : MB4.COURT_RIGHT - 30;
    bot.targetX = Math.max(minX, Math.min(maxX, bot.targetX));

    // ---- Tile beliefs ----
    // For each visible tile, the bot has a STABLE belief about whether it's
    // correct (cached on the bot so it doesn't flip-flop between decisions).
    // mathSkill is the probability the bot's belief matches reality.
    if (!bot.tileBeliefs) bot.tileBeliefs = new Map();
    const mathSkill = MB4.MATH.BOT_SKILL_BY_DIFFICULTY[ctx.difficulty] || 0.75;
    const tiles = (ctx.mathTiles || []).filter(t => !t.resolved);
    const liveIds = new Set();
    for (const t of tiles) {
      liveIds.add(t.id);
      if (!bot.tileBeliefs.has(t.id)) {
        const trueCorrect = t.eq.correct;
        const flip = Math.random() > mathSkill;
        bot.tileBeliefs.set(t.id, flip ? !trueCorrect : trueCorrect);
      }
    }
    // GC: drop beliefs for tiles no longer on court
    for (const id of bot.tileBeliefs.keys()) {
      if (!liveIds.has(id)) bot.tileBeliefs.delete(id);
    }

    // ---- Math tile chasing (correct tiles) ----
    if (tiles.length > 0 && Math.random() < MB4.MATH.BOT_CHASE_PROBABILITY) {
      const candidates = tiles.filter(t => bot.tileBeliefs.get(t.id));
      if (candidates.length > 0) {
        let best = candidates[0];
        let bestDist = Math.abs(candidates[0].x - me.x) + Math.abs(candidates[0].depth - me.depth) * 100;
        for (let i = 1; i < candidates.length; i++) {
          const d = Math.abs(candidates[i].x - me.x) + Math.abs(candidates[i].depth - me.depth) * 100;
          if (d < bestDist) { best = candidates[i]; bestDist = d; }
        }
        bot.targetX = best.x;
        bot.targetDepth = best.depth;
      }
    }

    // ---- Tile avoidance (wrong tiles) ----
    // Whatever the bot's target is, if there's a tile the bot believes is
    // wrong in the path between me.x and targetX (at roughly my current depth),
    // nudge the target around it. We use a simple heuristic: if a "bad" tile
    // sits between me and targetX in the X direction, AND its depth is close
    // to mine, displace the target by enough X to walk around the tile.
    const TILE_HALF_W = MB4.MATH.TILE_W / 2;
    for (const t of tiles) {
      if (bot.tileBeliefs.get(t.id)) continue;   // believed-correct, fine to step on
      // depth proximity: tile is in the lane I'm walking in
      if (Math.abs(t.depth - me.depth) > 0.10) continue;
      const between = (t.x - me.x) * (bot.targetX - me.x) > 0
                    && Math.abs(t.x - me.x) < Math.abs(bot.targetX - me.x);
      const tooClose = Math.abs(t.x - bot.targetX) < TILE_HALF_W + 12;
      if (between || tooClose) {
        // Push target X away from the tile
        const push = TILE_HALF_W + 18;
        bot.targetX = (bot.targetX < t.x) ? t.x - push : t.x + push;
      }
    }
    // Re-clamp to own side
    bot.targetX = Math.max(minX, Math.min(maxX, bot.targetX));
  }

  window.AI4 = { freshBotState, tick };
})();
