/**
 * engine.js — Game logic, physics, and state management.
 *
 * OWNER: Data (Game Dev)
 *
 * This file is a scaffold. Every function signature and its contract are
 * defined. Replace the stub bodies with real implementations.
 * The renderer never imports this file — communication happens only through
 * the GameState object described in config.js.
 */

// ===========================================================================
// INPUT SYSTEM
// ===========================================================================

/**
 * Keyboard input tracker.
 * Listens for keydown/keyup and exposes simple pressed-state queries.
 */
DK.input = {
  /** Currently held keys — maps key string → boolean */
  keys: {},

  /**
   * Attach keyboard event listeners to the document.
   * Call once at startup.
   */
  init: function () {
    var self = this;
    document.addEventListener('keydown', function (e) {
      self.keys[e.key] = true;
      // Prevent default for game keys so page doesn't scroll
      if ([DK.KEYS.LEFT, DK.KEYS.RIGHT, DK.KEYS.UP, DK.KEYS.DOWN, DK.KEYS.JUMP].indexOf(e.key) !== -1) {
        e.preventDefault();
      }
    });
    document.addEventListener('keyup', function (e) {
      self.keys[e.key] = false;
    });
  },

  /**
   * Check whether a key is currently pressed.
   * @param {string} key — one of DK.KEYS values
   * @returns {boolean}
   */
  isDown: function (key) {
    return !!this.keys[key];
  }
};

// ===========================================================================
// ENTITY FACTORIES
// ===========================================================================

/**
 * Factory functions that return fresh entity objects conforming to the
 * GameState shape defined in config.js.
 */
DK.entities = {
  /**
   * Create a new player entity at the given (or default) position.
   * @returns {Object} player conforming to GameState.player
   */
  createPlayer: function () {
    return {
      x: 0, y: 0,
      width: 16, height: 16,
      vx: 0, vy: 0,
      state: DK.PLAYER_STATES.IDLE,
      direction: 1,
      hasHammer: false,
      hammerTimer: 0,
      lives: DK.CONFIG.STARTING_LIVES,
      score: 0,
      animFrame: 0,
      onGround: false,
      deathTimer: 0,
      jumpScored: {}  // track which barrels we already scored for jumping over
    };
  },

  /**
   * Create a barrel entity at (x, y).
   * @param {number} x
   * @param {number} y
   * @returns {Object} barrel conforming to GameState.barrels[]
   */
  createBarrel: function (x, y) {
    return {
      x: x || 0, y: y || 0,
      width: 12, height: 12,
      vx: DK.CONFIG.BARREL_SPEED,
      vy: 0,
      type: DK.ENTITY_TYPES.BARREL,
      onLadder: false,
      onGround: false,
      id: ++DK.entities._barrelId
    };
  },

  /** @private auto-incrementing barrel id for jump-score tracking */
  _barrelId: 0,

  /**
   * Create Donkey Kong at (x, y).
   * @param {number} x
   * @param {number} y
   * @returns {Object} donkeyKong conforming to GameState.donkeyKong
   */
  createDonkeyKong: function (x, y) {
    return {
      x: x || 0, y: y || 0,
      width: 40, height: 32,
      state: 'idle',
      throwTimer: DK.CONFIG.DK_THROW_INTERVAL,
      throwAnimTimer: 0
    };
  },

  /**
   * Create Pauline at (x, y).
   * @param {number} x
   * @param {number} y
   * @returns {Object} pauline conforming to GameState.pauline
   */
  createPauline: function (x, y) {
    return {
      x: x || 0, y: y || 0,
      width: 16, height: 22
    };
  },

  /**
   * Create a hammer power-up at (x, y).
   * @param {number} x
   * @param {number} y
   * @returns {Object} hammerPickup conforming to GameState.hammerPickup
   */
  createHammer: function (x, y) {
    return {
      x: x || 0, y: y || 0,
      width: 12, height: 12,
      active: true
    };
  }
};

// ===========================================================================
// LEVEL DATA
// ===========================================================================

/**
 * Level definitions.
 * Each level returns arrays of platforms, ladders, and positions for
 * the player, DK, Pauline, and hammer pickup.
 */
DK.levels = {
  /**
   * Return layout data for the given level number.
   * Level 1 is the classic 25m stage.
   *
   * @param {number} levelNum — 1-based level index
   * @returns {Object} levelData
   * @returns {Array<Object>}  levelData.platforms  — {x, y, width, height, angle}
   * @returns {Array<Object>}  levelData.ladders    — {x, y, width, height, climbable}
   * @returns {{x:number, y:number}} levelData.playerStart
   * @returns {{x:number, y:number}} levelData.dkPosition
   * @returns {{x:number, y:number}} levelData.paulinePosition
   * @returns {{x:number, y:number}|null} levelData.hammerPosition
   */
  getData: function (levelNum) {
    // Classic 25m stage — 6 platforms with alternating slopes, zig-zag ladders
    var W = DK.CONFIG.CANVAS_WIDTH;   // 448
    var pH = 8;                        // platform height

    // Platform definitions: bottom to top
    // Each slopes slightly in alternating directions to mimic the arcade original
    var platforms = [
      // Platform 1 (bottom) — nearly flat, full width
      { x: 0,  y: 480, width: W,   height: pH, angle: 0 },
      // Platform 2 — slopes right-to-left (right side higher)
      { x: 32, y: 400, width: 384, height: pH, angle: -0.04 },
      // Platform 3 — slopes left-to-right (left side higher)
      { x: 32, y: 330, width: 384, height: pH, angle: 0.04 },
      // Platform 4 — slopes right-to-left
      { x: 32, y: 260, width: 384, height: pH, angle: -0.04 },
      // Platform 5 — slopes left-to-right
      { x: 32, y: 190, width: 384, height: pH, angle: 0.04 },
      // Platform 6 (top / DK platform) — short, left side
      { x: 16, y: 120, width: 200, height: pH, angle: 0 }
    ];

    // Ladders connecting platforms — Y/height computed from sloped platform
    // surfaces at each ladder's center X, with 2px extension above/below
    var ladders = [
      // From platform 1 to platform 2
      { x: 380, y: 384, width: 16, height: 98, climbable: true },
      { x: 100, y: 395, width: 16, height: 87, climbable: false },  // broken
      // From platform 2 to platform 3
      { x: 64,  y: 330, width: 16, height: 70, climbable: true },
      { x: 300, y: 339, width: 16, height: 52, climbable: false },  // broken
      // From platform 3 to platform 4
      { x: 360, y: 245, width: 16, height: 100, climbable: true },
      // From platform 4 to platform 5
      { x: 80,  y: 190, width: 16, height: 70, climbable: true },
      { x: 260, y: 197, width: 16, height: 56, climbable: false },  // broken
      // From platform 5 to platform 6 (top)
      { x: 170, y: 118, width: 16, height: 80, climbable: true }
    ];

    return {
      platforms: platforms,
      ladders: ladders,
      playerStart:     { x: 32,  y: 464 },
      dkPosition:      { x: 32,  y: 88  },
      paulinePosition: { x: 120, y: 98  },
      hammerPosition:  { x: 340, y: 248 }
    };
  }
};

// ===========================================================================
// PHYSICS SYSTEM
// ===========================================================================

/**
 * Low-level physics helpers.
 * These are pure functions — they read and mutate the entity objects they
 * receive but have no side-effects on global state.
 */
DK.physics = {
  /**
   * Apply gravity to an entity's vertical velocity, clamped to MAX_FALL_SPEED.
   * @param {Object} entity — must have vy
   * @param {number} dt     — delta time in seconds
   */
  applyGravity: function (entity, dt) {
    entity.vy += DK.CONFIG.GRAVITY * dt;
    if (entity.vy > DK.CONFIG.MAX_FALL_SPEED) {
      entity.vy = DK.CONFIG.MAX_FALL_SPEED;
    }
  },

  /**
   * Resolve entity vs platform collisions.
   * If the entity is falling and overlaps a platform, snap it on top and
   * zero vy. Must account for slanted platforms (angle).
   *
   * @param {Object} entity           — must have x, y, width, height, vy
   * @param {Array<Object>} platforms — array of platform objects
   * @returns {boolean} true if entity is standing on a platform
   */
  checkPlatformCollision: function (entity, platforms) {
    var standing = false;
    var entityCenterX = entity.x + entity.width / 2;
    var entityBottom = entity.y + entity.height;

    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];

      // Check horizontal overlap
      if (entity.x + entity.width <= p.x || entity.x >= p.x + p.width) {
        continue;
      }

      // Calculate platform surface Y at the entity's center X
      var platformYAtEntity = p.y + Math.tan(p.angle) * (entityCenterX - p.x);

      // Entity must be falling (or standing) and close to platform surface
      // Allow a small tolerance window for detection
      if (entity.vy >= 0 && entityBottom >= platformYAtEntity && entityBottom <= platformYAtEntity + p.height + 8) {
        entity.y = platformYAtEntity - entity.height;
        entity.vy = 0;
        standing = true;
      }
    }

    entity.onGround = standing;
    return standing;
  },

  /**
   * Determine whether an entity overlaps any ladder.
   * Used to decide if the player can climb.
   *
   * @param {Object} entity         — must have x, y, width, height
   * @param {Array<Object>} ladders — array of ladder objects
   * @param {boolean} [allLadders]  — if true, ignore climbable flag (for barrels)
   * @returns {Object|null} the overlapping ladder, or null
   */
  checkLadderCollision: function (entity, ladders, allLadders) {
    for (var i = 0; i < ladders.length; i++) {
      var l = ladders[i];
      if (!allLadders && !l.climbable) continue;

      // AABB overlap
      if (entity.x + entity.width > l.x &&
          entity.x < l.x + l.width &&
          entity.y + entity.height > l.y &&
          entity.y < l.y + l.height) {
        return l;
      }
    }
    return null;
  },

  /**
   * Simple AABB overlap test between two entities.
   * @param {Object} a — {x, y, width, height}
   * @param {Object} b — {x, y, width, height}
   * @returns {boolean}
   */
  checkEntityCollision: function (a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  },

  /**
   * Move an entity by its velocity × dt.
   * @param {Object} entity — must have x, y, vx, vy
   * @param {number} dt
   */
  moveEntity: function (entity, dt) {
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;
  },

  /**
   * Get the platform surface Y at a given x position.
   * @param {Object} platform
   * @param {number} x
   * @returns {number}
   */
  getPlatformY: function (platform, x) {
    return platform.y + Math.tan(platform.angle) * (x - platform.x);
  },

  /**
   * Snap an entity to the nearest platform within range.
   * Used when exiting a ladder to ensure the entity lands on the platform.
   * @param {Object} entity           — must have x, y, width, height, vy, onGround
   * @param {Array<Object>} platforms
   */
  snapToNearestPlatform: function (entity, platforms) {
    var entityCenterX = entity.x + entity.width / 2;
    var entityBottom = entity.y + entity.height;
    var bestDist = 30;
    var bestY = null;

    for (var i = 0; i < platforms.length; i++) {
      var p = platforms[i];
      if (entityCenterX < p.x || entityCenterX > p.x + p.width) continue;
      var surfaceY = p.y + Math.tan(p.angle) * (entityCenterX - p.x);
      var dist = Math.abs(entityBottom - surfaceY);
      if (dist < bestDist) {
        bestDist = dist;
        bestY = surfaceY;
      }
    }

    if (bestY !== null) {
      entity.y = bestY - entity.height;
      entity.vy = 0;
      entity.onGround = true;
    }
  }
};

// ===========================================================================
// GAME ENGINE
// ===========================================================================

/**
 * Core game engine.
 * Owns the authoritative GameState and advances it each tick.
 */
DK.engine = {
  /** @type {GameState|null} */
  state: null,

  /**
   * Initialise a new game.
   * Creates the initial GameState from level 1 data, sets screen to TITLE.
   */
  init: function () {
    var lvl = DK.levels.getData(1);
    this.state = {
      screen: DK.SCREENS.TITLE,
      player:       DK.entities.createPlayer(),
      donkeyKong:   DK.entities.createDonkeyKong(lvl.dkPosition.x, lvl.dkPosition.y),
      pauline:      DK.entities.createPauline(lvl.paulinePosition.x, lvl.paulinePosition.y),
      barrels:      [],
      platforms:    lvl.platforms,
      ladders:      lvl.ladders,
      hammerPickup: lvl.hammerPosition
                        ? DK.entities.createHammer(lvl.hammerPosition.x, lvl.hammerPosition.y)
                        : null,
      level:        1,
      highScore:    0
    };
    // Set player start position from level data
    this.state.player.x = lvl.playerStart.x;
    this.state.player.y = lvl.playerStart.y;
  },

  /**
   * Advance the game state by dt seconds.
   * Called once per fixed timestep from the game loop.
   *
   * @param {number} dt — fixed delta time in seconds
   */
  update: function (dt) {
    if (!this.state) return;

    var s = this.state;
    var p = s.player;
    var C = DK.CONFIG;

    // ── Step 1: Screen transitions ──
    if (s.screen === DK.SCREENS.TITLE ||
        s.screen === DK.SCREENS.GAME_OVER) {
      if (DK.input.isDown(DK.KEYS.START)) {
        this.reset();
        this.state.screen = DK.SCREENS.PLAYING;
      }
      return;
    }
    if (s.screen === DK.SCREENS.WIN) {
      if (DK.input.isDown(DK.KEYS.START)) {
        this.nextLevel();
      }
      return;
    }

    if (s.screen !== DK.SCREENS.PLAYING) return;

    // ── Step 9: Handle death state (check early so dying player can't act) ──
    if (p.state === DK.PLAYER_STATES.DYING) {
      p.deathTimer -= dt;
      if (p.deathTimer <= 0) {
        p.lives--;
        if (p.score > s.highScore) s.highScore = p.score;
        if (p.lives <= 0) {
          s.screen = DK.SCREENS.GAME_OVER;
        } else {
          // Respawn player
          var lvl = DK.levels.getData(s.level);
          p.x = lvl.playerStart.x;
          p.y = lvl.playerStart.y;
          p.vx = 0;
          p.vy = 0;
          p.state = DK.PLAYER_STATES.IDLE;
          p.hasHammer = false;
          p.hammerTimer = 0;
          p.jumpScored = {};
          s.barrels = [];
          s.donkeyKong.throwTimer = C.DK_THROW_INTERVAL;
          if (s.hammerPickup) s.hammerPickup.active = true;
        }
      }
      return;
    }

    // ── Step 2: Player input ──
    var nearLadder = DK.physics.checkLadderCollision(p, s.ladders);

    if (p.state === DK.PLAYER_STATES.CLIMBING) {
      // While climbing: handle up/down, exit at top/bottom
      p.vx = 0;
      if (DK.input.isDown(DK.KEYS.UP)) {
        p.vy = -C.CLIMB_SPEED;
      } else if (DK.input.isDown(DK.KEYS.DOWN)) {
        p.vy = C.CLIMB_SPEED;
      } else {
        p.vy = 0;
      }

      // Snap x to ladder center
      if (nearLadder) {
        p.x = nearLadder.x + nearLadder.width / 2 - p.width / 2;
      }

      // Move on ladder
      DK.physics.moveEntity(p, dt);

      // Exit climbing if moved past ladder bounds
      if (!nearLadder || p.y + p.height <= nearLadder.y || p.y >= nearLadder.y + nearLadder.height) {
        p.state = DK.PLAYER_STATES.IDLE;
        p.vy = 0;
        // Snap to nearest platform so the player doesn't fall through
        if (!DK.physics.checkPlatformCollision(p, s.platforms)) {
          DK.physics.snapToNearestPlatform(p, s.platforms);
        }
      }
    } else {
      // Normal (non-climbing) movement
      // Horizontal
      if (DK.input.isDown(DK.KEYS.LEFT)) {
        p.vx = -C.PLAYER_SPEED;
        p.direction = -1;
        if (p.onGround && p.state !== DK.PLAYER_STATES.HAMMER) {
          p.state = DK.PLAYER_STATES.WALKING;
        }
      } else if (DK.input.isDown(DK.KEYS.RIGHT)) {
        p.vx = C.PLAYER_SPEED;
        p.direction = 1;
        if (p.onGround && p.state !== DK.PLAYER_STATES.HAMMER) {
          p.state = DK.PLAYER_STATES.WALKING;
        }
      } else {
        p.vx = 0;
        if (p.onGround && p.state === DK.PLAYER_STATES.WALKING) {
          p.state = p.hasHammer ? DK.PLAYER_STATES.HAMMER : DK.PLAYER_STATES.IDLE;
        }
      }

      // Ladder entry — UP from below midpoint, DOWN from above midpoint
      var ladderMid = nearLadder ? nearLadder.y + nearLadder.height / 2 : 0;
      if (DK.input.isDown(DK.KEYS.UP) && nearLadder && (p.y + p.height) >= ladderMid) {
        p.state = DK.PLAYER_STATES.CLIMBING;
        p.vy = -C.CLIMB_SPEED;
        p.vx = 0;
        p.x = nearLadder.x + nearLadder.width / 2 - p.width / 2;
      } else if (DK.input.isDown(DK.KEYS.DOWN) && nearLadder && (p.y + p.height) <= ladderMid) {
        p.state = DK.PLAYER_STATES.CLIMBING;
        p.vy = C.CLIMB_SPEED;
        p.vx = 0;
        p.x = nearLadder.x + nearLadder.width / 2 - p.width / 2;
      }

      // Jump
      if (DK.input.isDown(DK.KEYS.JUMP) && p.onGround && p.state !== DK.PLAYER_STATES.CLIMBING) {
        p.vy = C.PLAYER_JUMP;
        p.state = p.hasHammer ? DK.PLAYER_STATES.HAMMER : DK.PLAYER_STATES.JUMPING;
        p.onGround = false;
      }

      // ── Step 4: Player physics ──
      if (p.state !== DK.PLAYER_STATES.CLIMBING) {
        DK.physics.applyGravity(p, dt);
      }
      DK.physics.moveEntity(p, dt);

      // Clamp player to canvas bounds
      if (p.x < 0) p.x = 0;
      if (p.x + p.width > C.CANVAS_WIDTH) p.x = C.CANVAS_WIDTH - p.width;

      // Platform collision
      var wasOnGround = p.onGround;
      DK.physics.checkPlatformCollision(p, s.platforms);

      // Landed — transition from jumping/falling to idle
      if (p.onGround && !wasOnGround) {
        if (p.state === DK.PLAYER_STATES.JUMPING) {
          p.state = p.hasHammer ? DK.PLAYER_STATES.HAMMER : DK.PLAYER_STATES.IDLE;
        }
      }

      // Fell off screen
      if (p.y > C.CANVAS_HEIGHT + 32) {
        p.state = DK.PLAYER_STATES.DYING;
        p.deathTimer = C.DEATH_ANIM_TIME;
        p.vx = 0;
        p.vy = 0;
      }
    }

    // ── Step 3: DK barrel throwing ──
    var dk = s.donkeyKong;
    dk.throwTimer -= dt;

    if (dk.throwAnimTimer > 0) {
      dk.throwAnimTimer -= dt;
      if (dk.throwAnimTimer <= 0) {
        dk.state = 'idle';
      }
    }

    if (dk.throwTimer <= 0) {
      // Spawn barrel at DK's position
      var barrel = DK.entities.createBarrel(dk.x + dk.width, dk.y + dk.height - 12);
      s.barrels.push(barrel);
      dk.throwTimer = C.DK_THROW_INTERVAL;
      dk.state = 'throwing';
      dk.throwAnimTimer = 0.4;
    }

    // ── Step 5: Barrel physics ──
    for (var bi = s.barrels.length - 1; bi >= 0; bi--) {
      var b = s.barrels[bi];

      if (b.onLadder) {
        // Barrel going down a ladder
        b.vy = C.BARREL_FALL;
        b.vx = 0;
        DK.physics.moveEntity(b, dt);

        // Save position before collision check
        var preSnapY = b.y;
        var preSnapVy = b.vy;

        // Check if barrel reached a platform below (must be well below start)
        var hitPlat = DK.physics.checkPlatformCollision(b, s.platforms);
        if (hitPlat && b.onGround && (b.y + b.height) > (b._ladderStartY || 0) + 30) {
          b.onLadder = false;
          delete b._ladderStartY;
          // Roll direction based on platform slope — roll downhill
          b.vx = C.BARREL_SPEED;
          // Find which platform we're on and determine slope direction
          for (var pi = 0; pi < s.platforms.length; pi++) {
            var plat = s.platforms[pi];
            var entityCx = b.x + b.width / 2;
            if (entityCx >= plat.x && entityCx <= plat.x + plat.width) {
              var platYAtB = plat.y + Math.tan(plat.angle) * (entityCx - plat.x);
              if (Math.abs((b.y + b.height) - platYAtB) < 10) {
                // Roll in downhill direction: positive angle = slopes right = roll right
                b.vx = plat.angle >= 0 ? C.BARREL_SPEED : -C.BARREL_SPEED;
                break;
              }
            }
          }
        } else if (hitPlat) {
          // Too close to starting platform — undo the snap, keep falling
          b.y = preSnapY;
          b.vy = preSnapVy;
          b.onGround = false;
        }
      } else {
        // Normal barrel physics
        DK.physics.applyGravity(b, dt);
        DK.physics.moveEntity(b, dt);

        var onPlat = DK.physics.checkPlatformCollision(b, s.platforms);

        if (onPlat) {
          // Random chance to go down a ladder (barrels use all ladders)
          var ladderBelow = DK.physics.checkLadderCollision(b, s.ladders, true);
          if (ladderBelow && Math.random() < C.BARREL_LADDER_CHANCE * dt * 60) {
            b.onLadder = true;
            b._ladderStartY = b.y + b.height;  // remember starting surface
            b.x = ladderBelow.x + ladderBelow.width / 2 - b.width / 2;
            b.vx = 0;
            b.vy = C.BARREL_FALL;
          } else {
            // Check if barrel is about to roll off platform edge
            var futureX = b.x + b.vx * dt;
            var stillOnPlatform = false;
            for (var pj = 0; pj < s.platforms.length; pj++) {
              var plt = s.platforms[pj];
              if (futureX + b.width > plt.x && futureX < plt.x + plt.width) {
                var platY = plt.y + Math.tan(plt.angle) * (futureX + b.width / 2 - plt.x);
                if (Math.abs((b.y + b.height) - platY) < 10) {
                  stillOnPlatform = true;
                  break;
                }
              }
            }
            if (!stillOnPlatform) {
              // Reverse direction at platform edge
              b.vx = -b.vx;
            }
          }
        }
      }

      // Remove barrels that fall off screen
      if (b.y > C.CANVAS_HEIGHT + 20) {
        s.barrels.splice(bi, 1);
        continue;
      }

      // Clamp barrel to screen sides
      if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx); }
      if (b.x + b.width > C.CANVAS_WIDTH) { b.x = C.CANVAS_WIDTH - b.width; b.vx = -Math.abs(b.vx); }
    }

    // ── Step 6: Player↔Barrel collision ──
    for (var ci = s.barrels.length - 1; ci >= 0; ci--) {
      var cb = s.barrels[ci];

      if (DK.physics.checkEntityCollision(p, cb)) {
        if (p.hasHammer) {
          // Smash barrel
          s.barrels.splice(ci, 1);
          p.score += C.SCORE_BARREL_SMASH;
          continue;
        } else {
          // Player dies
          p.state = DK.PLAYER_STATES.DYING;
          p.deathTimer = C.DEATH_ANIM_TIME;
          p.vx = 0;
          p.vy = 0;
          break;
        }
      }

      // Jump-over scoring: player is above barrel and horizontally close
      if (!p.jumpScored[cb.id] &&
          p.state === DK.PLAYER_STATES.JUMPING &&
          p.y + p.height < cb.y &&
          Math.abs((p.x + p.width / 2) - (cb.x + cb.width / 2)) < 24) {
        p.score += C.SCORE_BARREL_JUMP;
        p.jumpScored[cb.id] = true;
      }
    }

    // ── Step 7: Player↔Hammer pickup ──
    if (s.hammerPickup && s.hammerPickup.active && !p.hasHammer) {
      if (DK.physics.checkEntityCollision(p, s.hammerPickup)) {
        p.hasHammer = true;
        p.hammerTimer = C.HAMMER_DURATION;
        p.state = DK.PLAYER_STATES.HAMMER;
        s.hammerPickup.active = false;
      }
    }

    // ── Step 8: Win condition ──
    if (p.y <= s.pauline.y + s.pauline.height && p.state !== DK.PLAYER_STATES.DYING) {
      p.score += C.SCORE_LEVEL_CLEAR;
      if (p.score > s.highScore) s.highScore = p.score;
      s.screen = DK.SCREENS.WIN;
      return;
    }

    // ── Step 10: Hammer timer ──
    if (p.hasHammer) {
      p.hammerTimer -= dt;
      if (p.hammerTimer <= 0) {
        p.hasHammer = false;
        p.hammerTimer = 0;
        if (p.state === DK.PLAYER_STATES.HAMMER) {
          p.state = DK.PLAYER_STATES.IDLE;
        }
      }
    }

    // ── Step 11: Animation ──
    p.animFrame++;
  },

  /**
   * Reset game state for a fresh game (lives, score, level 1).
   */
  reset: function () {
    DK.entities._barrelId = 0;
    this.init();
    this.state.screen = DK.SCREENS.PLAYING;
  },

  /**
   * Advance to the next level.
   * Preserve score and lives, load new level data, reposition entities.
   */
  nextLevel: function () {
    if (!this.state) return;
    var score = this.state.player.score;
    var lives = this.state.player.lives;
    var hi    = this.state.highScore;
    var next  = this.state.level + 1;

    var lvl = DK.levels.getData(next);
    this.init();
    this.state.level           = next;
    this.state.player.score    = score;
    this.state.player.lives    = lives;
    this.state.highScore       = hi;
    this.state.screen          = DK.SCREENS.PLAYING;

    // Reposition entities from level data
    this.state.player.x = lvl.playerStart.x;
    this.state.player.y = lvl.playerStart.y;
    this.state.donkeyKong.x = lvl.dkPosition.x;
    this.state.donkeyKong.y = lvl.dkPosition.y;
    this.state.pauline.x = lvl.paulinePosition.x;
    this.state.pauline.y = lvl.paulinePosition.y;
    this.state.barrels = [];
    DK.entities._barrelId = 0;
  }
};
