/**
 * renderer.js — Rendering, sprite drawing, UI, and audio.
 *
 * OWNER: Brand (Frontend Dev)
 *
 * All sprites are drawn programmatically with fillRect (no external images).
 * This file reads the GameState produced by engine.js but NEVER writes to it.
 * All visuals use the DK.COLORS palette and DK.CONFIG dimensions from config.js.
 */

// ===========================================================================
// SPRITE DRAWING
// ===========================================================================

/**
 * Pixel-art sprite renderer.
 * Each entity type gets its own draw routine using fillRect calls.
 */
DK.sprites = {
  /**
   * Draw a sprite for the given entity type at (x, y).
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} type      — one of DK.ENTITY_TYPES values
   * @param {number} x         — top-left x in canvas pixels
   * @param {number} y         — top-left y in canvas pixels
   * @param {string} [state]   — entity state (e.g. PLAYER_STATES value)
   * @param {number} [direction] — -1 for left, 1 for right
   * @param {number} [frame]   — animation frame index
   */
  draw: function (ctx, type, x, y, state, direction, frame) {
    x = Math.round(x);
    y = Math.round(y);
    direction = direction || 1;
    frame = frame || 0;
    state = state || 'idle';

    switch (type) {
      case DK.ENTITY_TYPES.PLAYER:
        this._drawPlayer(ctx, x, y, state, direction, frame);
        break;
      case DK.ENTITY_TYPES.DONKEY_KONG:
        this._drawDK(ctx, x, y, state, frame);
        break;
      case DK.ENTITY_TYPES.BARREL:
        this._drawBarrel(ctx, x, y, frame);
        break;
      case DK.ENTITY_TYPES.FIRE_BARREL:
        this._drawFireBarrel(ctx, x, y, frame);
        break;
      case DK.ENTITY_TYPES.PAULINE:
        this._drawPauline(ctx, x, y, frame);
        break;
      case DK.ENTITY_TYPES.HAMMER_PICKUP:
        this._drawHammerPickup(ctx, x, y);
        break;
    }
  },

  /**
   * Fill an array of pixel positions at a given colour.
   * @private
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} ox - origin x
   * @param {number} oy - origin y
   * @param {string} color
   * @param {number[][]} pixels - array of [px, py] pairs
   * @param {number} [scale] - pixel size (default 1)
   */
  _px: function (ctx, ox, oy, color, pixels, scale) {
    scale = scale || 1;
    ctx.fillStyle = color;
    for (var i = 0; i < pixels.length; i++) {
      ctx.fillRect(ox + pixels[i][0] * scale, oy + pixels[i][1] * scale, scale, scale);
    }
  },

  /**
   * Fill a rectangular block of pixels.
   * @private
   */
  _block: function (ctx, ox, oy, color, bx, by, bw, bh) {
    ctx.fillStyle = color;
    ctx.fillRect(ox + bx, oy + by, bw, bh);
  },

  // -------------------------------------------------------------------------
  // PLAYER (Mario) — 16×16 pixels
  // -------------------------------------------------------------------------
  _drawPlayer: function (ctx, x, y, state, direction, frame) {
    var C = DK.COLORS;

    // Dying state: spin the sprite
    if (state === DK.PLAYER_STATES.DYING) {
      var angle = (frame * 0.5) % (Math.PI * 2);
      ctx.save();
      ctx.translate(x + 8, y + 8);
      ctx.rotate(angle);
      this._drawPlayerPose(ctx, -8, -8, 'idle', 1, C);
      ctx.restore();
      return;
    }

    // Direction flipping
    if (direction === -1) {
      ctx.save();
      ctx.translate(x + 16, y);
      ctx.scale(-1, 1);
      this._drawPlayerByState(ctx, 0, 0, state, frame, C);
      ctx.restore();
    } else {
      this._drawPlayerByState(ctx, x, y, state, frame, C);
    }
  },

  _drawPlayerByState: function (ctx, x, y, state, frame, C) {
    switch (state) {
      case DK.PLAYER_STATES.WALKING:
        var walkFrame = frame % 3;
        if (walkFrame === 1) {
          this._drawPlayerPose(ctx, x, y, 'idle', 0, C);
        } else {
          this._drawPlayerPose(ctx, x, y, 'walk' + walkFrame, 0, C);
        }
        break;
      case DK.PLAYER_STATES.JUMPING:
        this._drawPlayerPose(ctx, x, y, 'jump', 0, C);
        break;
      case DK.PLAYER_STATES.CLIMBING:
        this._drawPlayerPose(ctx, x, y, 'climb' + (frame % 2), 0, C);
        break;
      case DK.PLAYER_STATES.HAMMER:
        this._drawPlayerPose(ctx, x, y, 'hammer' + (frame % 2), 0, C);
        break;
      default:
        this._drawPlayerPose(ctx, x, y, 'idle', 0, C);
    }
  },

  _drawPlayerPose: function (ctx, x, y, pose, f, C) {
    var b = this._block.bind(this, ctx, x, y);

    // --- Hat (rows 0-3) ---
    b(C.PLAYER_HAT, 4, 0, 8, 1);   // top brim
    b(C.PLAYER_HAT, 3, 1, 11, 1);  // hat wide
    b(C.PLAYER_HAT, 2, 2, 12, 1);  // hat brim
    b(C.PLAYER_HAT, 3, 3, 10, 1);

    // --- Face (rows 4-6) ---
    b(C.PLAYER_SKIN, 3, 4, 3, 1);  // face left
    b(C.PLAYER_SKIN, 8, 4, 5, 1);  // face right
    b('#000000', 6, 4, 2, 1);      // eyes
    b(C.PLAYER_SKIN, 3, 5, 10, 1); // face middle
    b(C.PLAYER_SKIN, 3, 6, 10, 1);
    b('#401000', 7, 6, 4, 1);      // mustache

    // --- Shirt (rows 7-9) ---
    b(C.PLAYER_SHIRT, 3, 7, 10, 1);
    b(C.PLAYER_SHIRT, 2, 8, 12, 1);
    b(C.PLAYER_SHIRT, 4, 9, 8, 1);

    // --- Arms + Overalls (rows 10-11) ---
    if (pose === 'jump') {
      // Arms up
      b(C.PLAYER_SKIN, 1, 7, 2, 1);
      b(C.PLAYER_SKIN, 13, 7, 2, 1);
      b(C.PLAYER_SKIN, 0, 6, 2, 1);
      b(C.PLAYER_SKIN, 14, 6, 2, 1);
      b(C.PLAYER_OVERALLS, 4, 10, 8, 1);
      b(C.PLAYER_OVERALLS, 4, 11, 8, 1);
      // Tucked legs
      b(C.PLAYER_OVERALLS, 4, 12, 3, 2);
      b(C.PLAYER_OVERALLS, 9, 12, 3, 2);
      b(C.PLAYER_SKIN, 4, 14, 3, 1);
      b(C.PLAYER_SKIN, 9, 14, 3, 1);
      b('#401000', 4, 15, 3, 1);
      b('#401000', 9, 15, 3, 1);
    } else if (pose === 'climb0') {
      // Left arm up, right arm down
      b(C.PLAYER_SKIN, 1, 5, 2, 2);   // left arm up
      b(C.PLAYER_SKIN, 13, 9, 2, 2);  // right arm down
      b(C.PLAYER_OVERALLS, 4, 10, 8, 2);
      b(C.PLAYER_OVERALLS, 5, 12, 2, 2);
      b(C.PLAYER_OVERALLS, 9, 12, 2, 2);
      b('#401000', 5, 14, 2, 2);
      b('#401000', 9, 14, 2, 2);
    } else if (pose === 'climb1') {
      // Right arm up, left arm down
      b(C.PLAYER_SKIN, 13, 5, 2, 2);  // right arm up
      b(C.PLAYER_SKIN, 1, 9, 2, 2);   // left arm down
      b(C.PLAYER_OVERALLS, 4, 10, 8, 2);
      b(C.PLAYER_OVERALLS, 5, 12, 2, 2);
      b(C.PLAYER_OVERALLS, 9, 12, 2, 2);
      b('#401000', 5, 14, 2, 2);
      b('#401000', 9, 14, 2, 2);
    } else if (pose === 'hammer0' || pose === 'hammer1') {
      // Arms with hammer
      b(C.PLAYER_SKIN, 1, 8, 2, 2);
      b(C.PLAYER_SKIN, 13, 8, 2, 2);
      b(C.PLAYER_OVERALLS, 4, 10, 8, 2);
      // Legs like idle
      b(C.PLAYER_OVERALLS, 4, 12, 3, 2);
      b(C.PLAYER_OVERALLS, 9, 12, 3, 2);
      b('#401000', 4, 14, 3, 2);
      b('#401000', 9, 14, 3, 2);
      // Hammer above head
      if (pose === 'hammer0') {
        b(C.HAMMER, 6, -6, 2, 6);       // handle
        b(C.HAMMER_HEAD, 3, -8, 10, 3);  // head
      } else {
        b(C.HAMMER, 12, -2, 6, 2);       // handle horizontal
        b(C.HAMMER_HEAD, 16, -5, 3, 10); // head
      }
    } else if (pose === 'walk0') {
      // Left leg forward
      b(C.PLAYER_SKIN, 1, 8, 2, 2);
      b(C.PLAYER_SKIN, 13, 8, 2, 2);
      b(C.PLAYER_OVERALLS, 4, 10, 8, 2);
      b(C.PLAYER_OVERALLS, 3, 12, 3, 2);  // left leg forward
      b(C.PLAYER_OVERALLS, 10, 12, 3, 2); // right leg back
      b('#401000', 2, 14, 4, 2);
      b('#401000', 10, 14, 3, 2);
    } else if (pose === 'walk2') {
      // Right leg forward
      b(C.PLAYER_SKIN, 1, 8, 2, 2);
      b(C.PLAYER_SKIN, 13, 8, 2, 2);
      b(C.PLAYER_OVERALLS, 4, 10, 8, 2);
      b(C.PLAYER_OVERALLS, 3, 12, 3, 2);  // left leg back
      b(C.PLAYER_OVERALLS, 10, 12, 3, 2); // right leg forward
      b('#401000', 3, 14, 3, 2);
      b('#401000', 10, 14, 4, 2);
    } else {
      // Idle standing
      b(C.PLAYER_SKIN, 1, 8, 2, 2);   // left arm
      b(C.PLAYER_SKIN, 13, 8, 2, 2);  // right arm
      b(C.PLAYER_OVERALLS, 4, 10, 8, 2);
      b(C.PLAYER_OVERALLS, 4, 12, 3, 2);
      b(C.PLAYER_OVERALLS, 9, 12, 3, 2);
      b('#401000', 4, 14, 3, 2);      // left shoe
      b('#401000', 9, 14, 3, 2);      // right shoe
    }
  },

  // -------------------------------------------------------------------------
  // DONKEY KONG — 40×32 pixels
  // -------------------------------------------------------------------------
  _drawDK: function (ctx, x, y, state, frame) {
    var C = DK.COLORS;
    var b = this._block.bind(this, ctx, x, y);
    var s = 2; // pixel scale for DK (drawn at 2x for chunky look)

    // Head/Face area (rows 0-12 at 2x scale = rows 0-6 logical)
    b(C.DK_BROWN, 8, 0, 24, 4);      // top of head
    b(C.DK_BROWN, 4, 4, 32, 4);      // head wider
    b(C.DK_FACE, 10, 4, 20, 4);      // face oval upper
    b(C.DK_BROWN, 2, 8, 36, 4);      // head widest
    b(C.DK_FACE, 10, 8, 20, 4);      // face middle
    b('#000000', 14, 6, 3, 2);        // left eye
    b('#000000', 23, 6, 3, 2);        // right eye
    b('#FFFFFF', 14, 6, 1, 1);        // eye glint left
    b('#FFFFFF', 23, 6, 1, 1);        // eye glint right
    b(C.DK_FACE, 16, 10, 8, 2);      // snout
    b('#000000', 17, 10, 2, 1);       // nostril left
    b('#000000', 21, 10, 2, 1);       // nostril right
    b('#401000', 15, 12, 10, 1);      // mouth

    // Body (rows 13-24 at original scale)
    b(C.DK_BROWN, 6, 13, 28, 3);
    b(C.DK_FACE, 12, 13, 16, 2);     // chest lighter
    b(C.DK_BROWN, 4, 16, 32, 4);     // torso
    b(C.DK_FACE, 14, 16, 12, 2);     // belly

    if (state === 'throwing') {
      // Arms raised holding barrel
      b(C.DK_BROWN, 0, 4, 6, 6);     // left arm up
      b(C.DK_BROWN, 34, 4, 6, 6);    // right arm up
      b(C.DK_BROWN, 2, 2, 4, 4);     // left hand up
      b(C.DK_BROWN, 34, 2, 4, 4);    // right hand up
    } else {
      // Arms at sides (idle / chest beat)
      b(C.DK_BROWN, 0, 10, 6, 8);    // left arm
      b(C.DK_BROWN, 34, 10, 6, 8);   // right arm
      b(C.DK_FACE, 0, 16, 4, 3);     // left fist
      b(C.DK_FACE, 36, 16, 4, 3);    // right fist
    }

    // Legs (rows 20-31)
    b(C.DK_BROWN, 6, 20, 10, 6);     // left leg
    b(C.DK_BROWN, 24, 20, 10, 6);    // right leg
    // Feet
    b(C.DK_BROWN, 4, 26, 12, 4);     // left foot
    b(C.DK_BROWN, 24, 26, 12, 4);    // right foot
    b(C.DK_BROWN, 2, 28, 14, 4);     // left foot wider
    b(C.DK_BROWN, 24, 28, 14, 4);    // right foot wider
  },

  // -------------------------------------------------------------------------
  // BARREL — 12×12 pixels
  // -------------------------------------------------------------------------
  _drawBarrel: function (ctx, x, y, frame) {
    var C = DK.COLORS;
    var b = this._block.bind(this, ctx, x, y);
    var rot = (frame || 0) % 4;

    // Barrel body
    b(C.BARREL, 2, 0, 8, 1);
    b(C.BARREL, 1, 1, 10, 1);
    b(C.BARREL, 0, 2, 12, 8);
    b(C.BARREL, 1, 10, 10, 1);
    b(C.BARREL, 2, 11, 8, 1);

    // Bands (rotate based on frame)
    if (rot === 0) {
      b(C.BARREL_BAND, 0, 3, 12, 1);
      b(C.BARREL_BAND, 0, 8, 12, 1);
    } else if (rot === 1) {
      b(C.BARREL_BAND, 0, 4, 12, 1);
      b(C.BARREL_BAND, 0, 9, 12, 1);
    } else if (rot === 2) {
      b(C.BARREL_BAND, 0, 5, 12, 1);
      b(C.BARREL_BAND, 0, 7, 12, 1);
    } else {
      b(C.BARREL_BAND, 0, 2, 12, 1);
      b(C.BARREL_BAND, 0, 6, 12, 1);
    }

    // Center mark
    b(C.BARREL_BAND, 5, 5, 2, 2);
  },

  // -------------------------------------------------------------------------
  // FIRE BARREL — 12×12 pixels
  // -------------------------------------------------------------------------
  _drawFireBarrel: function (ctx, x, y, frame) {
    var b = this._block.bind(this, ctx, x, y);
    var flicker = (frame || 0) % 2;

    // Base shape (same as barrel but in fire colors)
    b('#802000', 2, 0, 8, 1);
    b('#802000', 1, 1, 10, 1);
    b('#A03000', 0, 2, 12, 8);
    b('#802000', 1, 10, 10, 1);
    b('#802000', 2, 11, 8, 1);

    // Fire bands
    b('#FF6000', 0, 3, 12, 1);
    b('#FF6000', 0, 8, 12, 1);

    // Flame on top
    if (flicker === 0) {
      b('#FF4000', 3, -1, 2, 2);
      b('#FFFF00', 4, -2, 2, 2);
      b('#FF4000', 7, -1, 2, 2);
      b('#FFFF00', 6, -3, 2, 1);
    } else {
      b('#FF4000', 4, -1, 2, 2);
      b('#FFFF00', 5, -3, 2, 2);
      b('#FF4000', 6, -2, 2, 2);
      b('#FFFF00', 3, -2, 2, 1);
    }
  },

  // -------------------------------------------------------------------------
  // PAULINE — 16×22 pixels
  // -------------------------------------------------------------------------
  _drawPauline: function (ctx, x, y, frame) {
    var C = DK.COLORS;
    var b = this._block.bind(this, ctx, x, y);

    // Hair (rows 0-4)
    b(C.PAULINE_HAIR, 4, 0, 8, 1);
    b(C.PAULINE_HAIR, 3, 1, 10, 1);
    b(C.PAULINE_HAIR, 2, 2, 12, 2);
    b(C.PAULINE_HAIR, 3, 4, 10, 1);

    // Face (rows 3-6)
    b(C.PLAYER_SKIN, 4, 3, 8, 1);
    b(C.PLAYER_SKIN, 4, 4, 8, 1);
    b('#000000', 5, 3, 2, 1);        // left eye
    b('#000000', 9, 3, 2, 1);        // right eye
    b(C.PLAYER_SKIN, 4, 5, 8, 1);
    b('#D00000', 6, 5, 4, 1);        // lips
    b(C.PLAYER_SKIN, 5, 6, 6, 1);

    // Dress (rows 7-19)
    b(C.PAULINE_DRESS, 4, 7, 8, 1);
    b(C.PAULINE_DRESS, 3, 8, 10, 1);
    b(C.PAULINE_DRESS, 3, 9, 10, 1);
    b(C.PAULINE_DRESS, 2, 10, 12, 2);
    b(C.PAULINE_DRESS, 2, 12, 12, 2);
    b(C.PAULINE_DRESS, 1, 14, 14, 2);
    b(C.PAULINE_DRESS, 1, 16, 14, 2);
    b(C.PAULINE_DRESS, 0, 18, 16, 2);

    // Feet
    b(C.PAULINE_HAIR, 2, 20, 4, 2);
    b(C.PAULINE_HAIR, 10, 20, 4, 2);

    // Arms
    b(C.PLAYER_SKIN, 1, 8, 2, 3);
    b(C.PLAYER_SKIN, 13, 8, 2, 3);

    // "HELP!" text above Pauline (blinks)
    if ((frame || 0) % 60 < 30) {
      ctx.fillStyle = DK.COLORS.TEXT;
      ctx.font = '7px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HELP!', x + 8, y - 4);
      ctx.textAlign = 'left';
    }
  },

  // -------------------------------------------------------------------------
  // HAMMER PICKUP — 12×12 pixels
  // -------------------------------------------------------------------------
  _drawHammerPickup: function (ctx, x, y) {
    var C = DK.COLORS;
    var b = this._block.bind(this, ctx, x, y);

    // T-shape hammer
    // Head (horizontal bar)
    b(C.HAMMER_HEAD, 1, 0, 10, 4);
    b(C.HAMMER, 2, 1, 8, 2);
    // Handle (vertical bar)
    b(C.HAMMER, 5, 4, 2, 8);
    // Grip at bottom
    b('#606060', 4, 10, 4, 2);
  }
};

// ===========================================================================
// UI DRAWING
// ===========================================================================

/**
 * Screen-level UI drawing: title screen, HUD, game over, and win screens.
 */
DK.ui = {
  /** @type {number} Internal frame counter for blinking effects */
  _frameCount: 0,

  /**
   * Draw the title / start screen.
   * @param {CanvasRenderingContext2D} ctx
   * @param {GameState} [state]
   */
  drawTitle: function (ctx, state) {
    var W = DK.CONFIG.CANVAS_WIDTH;
    var H = DK.CONFIG.CANVAS_HEIGHT;
    this._frameCount++;

    // Title text
    ctx.fillStyle = DK.COLORS.HUD_LABEL;
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BARREL', W / 2, 140);
    ctx.fillStyle = DK.COLORS.TEXT;
    ctx.fillText('SHIFT', W / 2, 185);

    // Draw a small DK sprite in the center
    DK.sprites.draw(ctx, DK.ENTITY_TYPES.DONKEY_KONG,
      W / 2 - 20, 210, 'idle');

    // High score
    var hs = (state && state.highScore) ? state.highScore : 0;
    if (hs > 0) {
      ctx.fillStyle = DK.COLORS.SCORE;
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('HIGH SCORE: ' + hs, W / 2, 280);
    }

    // Blinking instruction
    if (Math.floor(this._frameCount / 30) % 2 === 0) {
      ctx.fillStyle = DK.COLORS.TEXT;
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PRESS ENTER TO START', W / 2, 340);
    }

    ctx.textAlign = 'left';
  },

  /**
   * Draw the in-game HUD overlay.
   * @param {CanvasRenderingContext2D} ctx
   * @param {GameState} state
   */
  drawHUD: function (ctx, state) {
    this._frameCount++;
    var W = DK.CONFIG.CANVAS_WIDTH;
    var score = state.player ? state.player.score : 0;
    var high = state.highScore || 0;
    var level = state.level || 1;
    var lives = state.player ? state.player.lives : 0;

    // "1UP" label + score (left)
    ctx.fillStyle = DK.COLORS.HUD_LABEL;
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('1UP', 16, 14);
    ctx.fillStyle = DK.COLORS.SCORE;
    ctx.fillText(this._padScore(score), 16, 26);

    // "HIGH SCORE" + value (center)
    ctx.fillStyle = DK.COLORS.HUD_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('HIGH SCORE', W / 2, 14);
    ctx.fillStyle = DK.COLORS.SCORE;
    ctx.fillText(this._padScore(high), W / 2, 26);

    // Level indicator (right)
    ctx.fillStyle = DK.COLORS.HUD_LABEL;
    ctx.textAlign = 'right';
    ctx.fillText('L=' + level, W - 16, 14);

    // Lives display: small Mario head icons
    ctx.textAlign = 'left';
    for (var i = 0; i < lives; i++) {
      var lx = W - 60 + i * 14;
      var ly = 20;
      // Mini Mario head (8×8)
      ctx.fillStyle = DK.COLORS.PLAYER_HAT;
      ctx.fillRect(lx + 1, ly, 6, 2);
      ctx.fillRect(lx, ly + 2, 8, 2);
      ctx.fillStyle = DK.COLORS.PLAYER_SKIN;
      ctx.fillRect(lx + 1, ly + 4, 6, 2);
      ctx.fillStyle = '#000000';
      ctx.fillRect(lx + 2, ly + 4, 1, 1);
      ctx.fillRect(lx + 5, ly + 4, 1, 1);
    }
  },

  /**
   * Draw the game-over screen.
   * @param {CanvasRenderingContext2D} ctx
   * @param {GameState} state
   */
  drawGameOver: function (ctx, state) {
    var W = DK.CONFIG.CANVAS_WIDTH;
    this._frameCount++;

    ctx.fillStyle = DK.COLORS.HUD_LABEL;
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME', W / 2, 180);
    ctx.fillText('OVER', W / 2, 230);

    var score = state.player ? state.player.score : 0;
    ctx.fillStyle = DK.COLORS.SCORE;
    ctx.font = '16px monospace';
    ctx.fillText('FINAL SCORE', W / 2, 280);
    ctx.fillStyle = DK.COLORS.TEXT;
    ctx.font = 'bold 24px monospace';
    ctx.fillText(this._padScore(score), W / 2, 310);

    if (Math.floor(this._frameCount / 30) % 2 === 0) {
      ctx.fillStyle = DK.COLORS.TEXT;
      ctx.font = '14px monospace';
      ctx.fillText('PRESS ENTER TO RESTART', W / 2, 380);
    }

    ctx.textAlign = 'left';
  },

  /**
   * Draw the level-complete / win screen.
   * @param {CanvasRenderingContext2D} ctx
   * @param {GameState} state
   */
  drawWin: function (ctx, state) {
    var W = DK.CONFIG.CANVAS_WIDTH;
    this._frameCount++;

    ctx.fillStyle = DK.COLORS.SCORE;
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STAGE', W / 2, 160);
    ctx.fillText('CLEAR!', W / 2, 200);

    var score = state.player ? state.player.score : 0;
    var bonus = DK.CONFIG.SCORE_LEVEL_CLEAR;

    ctx.fillStyle = DK.COLORS.TEXT;
    ctx.font = '16px monospace';
    ctx.fillText('SCORE: ' + this._padScore(score), W / 2, 260);
    ctx.fillStyle = DK.COLORS.HUD_LABEL;
    ctx.fillText('BONUS: ' + bonus, W / 2, 290);

    // Draw Pauline + Mario reunited
    DK.sprites.draw(ctx, DK.ENTITY_TYPES.PLAYER, W / 2 - 24, 310, 'idle', 1, 0);
    DK.sprites.draw(ctx, DK.ENTITY_TYPES.PAULINE, W / 2 + 8, 304, 'idle', 1, 999);

    if (Math.floor(this._frameCount / 30) % 2 === 0) {
      ctx.fillStyle = DK.COLORS.TEXT;
      ctx.font = '14px monospace';
      ctx.fillText('PRESS ENTER TO CONTINUE', W / 2, 400);
    }

    ctx.textAlign = 'left';
  },

  /**
   * Zero-pad a score to 6 digits.
   * @private
   */
  _padScore: function (n) {
    var s = String(n);
    while (s.length < 6) { s = '0' + s; }
    return s;
  }
};

// ===========================================================================
// RENDERER
// ===========================================================================

/**
 * Main renderer — owns the canvas context and orchestrates drawing each frame.
 */
// ===========================================================================
// CANVAS SCALE TOGGLE
// ===========================================================================

/**
 * Manages CSS scaling of the canvas (1x, 2x, 4x).
 * Only changes CSS dimensions — the drawing buffer stays at native resolution.
 */
DK.scale = {
  _scales: [1, 2, 4],
  _index: 1,  // default 2x
  _btn: null,
  _canvas: null,

  init: function (canvas) {
    this._canvas = canvas;
    this._btn = document.getElementById('scaleToggle');
    if (!this._btn) return;

    var self = this;
    this._btn.addEventListener('click', function () {
      self._index = (self._index + 1) % self._scales.length;
      self.apply();
    });

    // Prevent the button from capturing keyboard events used by the game
    this._btn.addEventListener('keydown', function (e) { e.preventDefault(); });
    this._btn.addEventListener('keyup', function (e) { e.preventDefault(); });
    this._btn.addEventListener('mousedown', function () { this.blur(); });

    this.apply();
  },

  apply: function () {
    var s = this._scales[this._index];
    var w = DK.CONFIG.CANVAS_WIDTH * s;
    var h = DK.CONFIG.CANVAS_HEIGHT * s;
    this._canvas.style.width  = w + 'px';
    this._canvas.style.height = h + 'px';
    if (this._btn) this._btn.textContent = s + 'x';
  },

  current: function () {
    return this._scales[this._index];
  }
};

DK.renderer = {
  /** @type {HTMLCanvasElement|null} */
  canvas: null,
  /** @type {CanvasRenderingContext2D|null} */
  ctx: null,

  /**
   * Initialise the renderer.
   * @param {string} canvasId — the DOM id of the <canvas> element
   */
  init: function (canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error('Canvas element "' + canvasId + '" not found.');
      return;
    }
    this.canvas.width  = DK.CONFIG.CANVAS_WIDTH;
    this.canvas.height = DK.CONFIG.CANVAS_HEIGHT;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
  },

  /**
   * Render one frame based on the current GameState.
   * @param {GameState} state
   */
  render: function (state) {
    if (!this.ctx || !state) return;
    this.clear();

    switch (state.screen) {
      case DK.SCREENS.TITLE:
        DK.ui.drawTitle(this.ctx, state);
        break;

      case DK.SCREENS.PLAYING:
        this._drawLevel(state);
        DK.ui.drawHUD(this.ctx, state);
        break;

      case DK.SCREENS.GAME_OVER:
        DK.ui.drawGameOver(this.ctx, state);
        break;

      case DK.SCREENS.WIN:
        DK.ui.drawWin(this.ctx, state);
        break;
    }
  },

  /**
   * Clear the entire canvas to the background colour.
   */
  clear: function () {
    if (!this.ctx) return;
    this.ctx.fillStyle = DK.COLORS.BG;
    this.ctx.fillRect(0, 0, DK.CONFIG.CANVAS_WIDTH, DK.CONFIG.CANVAS_HEIGHT);
  },

  /**
   * Draw all in-game elements for the PLAYING screen.
   * Z-order: platforms → ladders → hammer → barrels → DK → Pauline → player
   * @private
   * @param {GameState} state
   */
  _drawLevel: function (state) {
    var ctx = this.ctx;

    // --- Platforms (girders with rivet pattern) ---
    this._drawPlatforms(ctx, state.platforms);

    // --- Ladders ---
    this._drawLadders(ctx, state.ladders);

    // --- Hammer pickup ---
    if (state.hammerPickup && state.hammerPickup.active) {
      DK.sprites.draw(ctx, DK.ENTITY_TYPES.HAMMER_PICKUP,
        state.hammerPickup.x, state.hammerPickup.y);
    }

    // --- Barrels ---
    for (var b = 0; b < state.barrels.length; b++) {
      var barrel = state.barrels[b];
      DK.sprites.draw(ctx, barrel.type, barrel.x, barrel.y,
        null, null, barrel.animFrame || 0);
    }

    // --- Donkey Kong ---
    DK.sprites.draw(ctx, DK.ENTITY_TYPES.DONKEY_KONG,
      state.donkeyKong.x, state.donkeyKong.y,
      state.donkeyKong.state);

    // --- Pauline ---
    DK.sprites.draw(ctx, DK.ENTITY_TYPES.PAULINE,
      state.pauline.x, state.pauline.y,
      null, null, DK.ui._frameCount);

    // --- Player (always on top) ---
    DK.sprites.draw(ctx, DK.ENTITY_TYPES.PLAYER,
      state.player.x, state.player.y,
      state.player.state,
      state.player.direction,
      state.player.animFrame);
  },

  /**
   * Draw platforms as red steel I-beam segments with rivet patterns.
   * @private
   */
  _drawPlatforms: function (ctx, platforms) {
    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      ctx.save();

      if (p.angle) {
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        this._drawGirder(ctx, 0, 0, p.width, p.height);
      } else {
        this._drawGirder(ctx, p.x, p.y, p.width, p.height);
      }

      ctx.restore();
    }
  },

  /**
   * Draw a girder section with 8px segments and rivet details.
   * @private
   */
  _drawGirder: function (ctx, x, y, w, h) {
    // Base girder
    ctx.fillStyle = DK.COLORS.GIRDER;
    ctx.fillRect(x, y, w, h);

    // Top edge highlight
    ctx.fillStyle = DK.COLORS.GIRDER_RIVET;
    ctx.fillRect(x, y, w, 1);

    // Rivet pattern: one rivet dot every 8px along the girder
    var segments = Math.floor(w / 8);
    for (var s = 0; s < segments; s++) {
      var rx = x + s * 8 + 3;
      var ry = y + Math.floor(h / 2) - 1;
      ctx.fillStyle = DK.COLORS.GIRDER_RIVET;
      ctx.fillRect(rx, ry, 2, 2);
    }

    // Bottom shadow
    ctx.fillStyle = '#801010';
    ctx.fillRect(x, y + h - 1, w, 1);
  },

  /**
   * Draw ladders with two cyan rails and horizontal rungs every 8px.
   * @private
   */
  _drawLadders: function (ctx, ladders) {
    for (var j = 0; j < ladders.length; j++) {
      var l = ladders[j];
      ctx.fillStyle = DK.COLORS.LADDER;

      // Two vertical rails (3px wide each)
      ctx.fillRect(l.x, l.y, 3, l.height);
      ctx.fillRect(l.x + l.width - 3, l.y, 3, l.height);

      // Horizontal rungs every 8px
      var rungCount = Math.floor(l.height / 8);
      for (var r = 0; r <= rungCount; r++) {
        var ry = l.y + r * 8;
        ctx.fillRect(l.x, ry, l.width, 2);
      }

      // Dim broken ladders
      if (l.climbable === false) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(l.x, l.y, l.width, l.height);
      }
    }
  }
};

// ===========================================================================
// AUDIO
// ===========================================================================

/**
 * Audio manager using Web Audio API oscillators for retro 8-bit sounds.
 */
DK.audio = {
  /** @type {AudioContext|null} */
  _ctx: null,
  /** @type {OscillatorNode[]} */
  _activeOscillators: [],
  /** @type {boolean} */
  _initialized: false,

  /**
   * Initialise the audio system.
   * Creates AudioContext and sets up autoplay policy handling.
   */
  init: function () {
    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this._ctx = new AudioCtx();
        this._initialized = true;

        // Handle browser autoplay policy: resume on first user interaction
        var self = this;
        var resume = function () {
          if (self._ctx && self._ctx.state === 'suspended') {
            self._ctx.resume();
          }
          document.removeEventListener('keydown', resume);
          document.removeEventListener('click', resume);
          document.removeEventListener('touchstart', resume);
        };
        document.addEventListener('keydown', resume);
        document.addEventListener('click', resume);
        document.addEventListener('touchstart', resume);
      }
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  },

  /**
   * Play a named sound effect using oscillators.
   * @param {string} soundName
   */
  play: function (soundName) {
    if (!this._initialized || !this._ctx) return;
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }

    switch (soundName) {
      case 'jump':
        this._playJump();
        break;
      case 'hammer':
        this._playHammer();
        break;
      case 'barrelSmash':
        this._playBarrelSmash();
        break;
      case 'death':
        this._playDeath();
        break;
      case 'levelComplete':
        this._playLevelComplete();
        break;
      case 'walk':
        this._playWalk();
        break;
    }
  },

  /**
   * Stop all currently playing oscillators.
   */
  stopAll: function () {
    for (var i = 0; i < this._activeOscillators.length; i++) {
      try { this._activeOscillators[i].stop(); } catch (e) { /* already stopped */ }
    }
    this._activeOscillators = [];
  },

  /**
   * Create an oscillator with gain envelope.
   * @private
   */
  _createOsc: function (type, startFreq, endFreq, duration, startTime, vol) {
    var ctx = this._ctx;
    var now = startTime || ctx.currentTime;
    vol = vol !== undefined ? vol : 0.15;

    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, now);
    if (endFreq !== startFreq) {
      osc.frequency.linearRampToValueAtTime(endFreq, now + duration);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.linearRampToValueAtTime(0, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);

    this._activeOscillators.push(osc);
    var self = this;
    osc.onended = function () {
      var idx = self._activeOscillators.indexOf(osc);
      if (idx > -1) self._activeOscillators.splice(idx, 1);
    };

    return osc;
  },

  /** Quick ascending frequency sweep */
  _playJump: function () {
    this._createOsc('square', 200, 600, 0.1);
  },

  /** Power-up sound: low→high sweep */
  _playHammer: function () {
    this._createOsc('square', 150, 800, 0.3);
  },

  /** Explosion-like: white noise burst + low frequency */
  _playBarrelSmash: function () {
    var ctx = this._ctx;
    var now = ctx.currentTime;

    // Low thud
    this._createOsc('sawtooth', 80, 30, 0.2, now, 0.2);

    // Noise-like burst using detuned oscillators
    this._createOsc('square', 300, 50, 0.15, now, 0.1);
    this._createOsc('sawtooth', 500, 80, 0.1, now, 0.1);
    this._createOsc('triangle', 200, 40, 0.2, now, 0.08);
  },

  /** Descending sad melody: 3 descending tones */
  _playDeath: function () {
    var now = this._ctx.currentTime;
    this._createOsc('square', 440, 440, 0.15, now, 0.15);
    this._createOsc('square', 350, 350, 0.15, now + 0.15, 0.15);
    this._createOsc('square', 260, 260, 0.2, now + 0.3, 0.15);
  },

  /** Victory jingle: ascending arpeggio */
  _playLevelComplete: function () {
    var now = this._ctx.currentTime;
    var notes = [262, 330, 392, 523, 659, 784];
    var dur = 0.12;
    for (var i = 0; i < notes.length; i++) {
      this._createOsc('square', notes[i], notes[i], dur, now + i * dur, 0.12);
    }
    // Final sustained note
    this._createOsc('square', 784, 784, 0.3, now + notes.length * dur, 0.1);
  },

  /** Quick tick sound for footsteps */
  _playWalk: function () {
    this._createOsc('square', 100, 80, 0.05, undefined, 0.06);
  }
};
