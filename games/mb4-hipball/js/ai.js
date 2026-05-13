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
    inp.fwd = false; inp.back = false;

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

    // Stay on own side mostly (don't cross to opponent's half too far)
    const minX = me.side === 'left' ? MB4.COURT_LEFT + 30 : 480;
    const maxX = me.side === 'left' ? 480 : MB4.COURT_RIGHT - 30;
    bot.targetX = Math.max(minX, Math.min(maxX, bot.targetX));
  }

  window.AI4 = { freshBotState, tick };
})();
