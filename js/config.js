/**
 * config.js — Shared contract between engine and renderer.
 *
 * This file establishes the DK global namespace and defines every constant,
 * enum, and data-shape used across the game. Engine and renderer both depend
 * on this file but NEVER on each other.
 */

window.DK = {};

// ---------------------------------------------------------------------------
// Canvas & physics tuning
// ---------------------------------------------------------------------------
DK.CONFIG = {
  CANVAS_WIDTH:  448,
  CANVAS_HEIGHT: 512,
  TILE_SIZE:     16,

  // Physics
  GRAVITY:       980,    // pixels/s²
  MAX_FALL_SPEED: 400,   // pixels/s  (terminal velocity)
  PLAYER_SPEED:  120,    // pixels/s  (horizontal walk)
  PLAYER_JUMP:  -280,    // pixels/s  (initial vy on jump, negative = up)
  CLIMB_SPEED:   80,     // pixels/s  (ladder climb)

  // Barrel behaviour
  BARREL_SPEED:  100,    // pixels/s  (horizontal roll)
  BARREL_FALL:   200,    // pixels/s  (when dropping off edge)
  BARREL_LADDER_CHANCE: 0.25,  // probability barrel takes a ladder

  // Timers (seconds)
  DK_THROW_INTERVAL:  3.0,
  HAMMER_DURATION:     8.0,
  DEATH_ANIM_TIME:     1.5,

  // Scoring
  SCORE_BARREL_JUMP:   100,
  SCORE_BARREL_SMASH:  300,
  SCORE_LEVEL_CLEAR:  5000,
  STARTING_LIVES:      3,

  // Frame rate
  FIXED_DT: 1 / 60
};

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
DK.SCREENS = Object.freeze({
  TITLE:     'title',
  PLAYING:   'playing',
  GAME_OVER: 'gameOver',
  WIN:       'win'
});

DK.PLAYER_STATES = Object.freeze({
  IDLE:      'idle',
  WALKING:   'walking',
  JUMPING:   'jumping',
  CLIMBING:  'climbing',
  HAMMER:    'hammer',
  DYING:     'dying'
});

DK.ENTITY_TYPES = Object.freeze({
  PLAYER:        'player',
  BARREL:        'barrel',
  FIRE_BARREL:   'fireBarrel',
  DONKEY_KONG:   'donkeyKong',
  PAULINE:       'pauline',
  HAMMER_PICKUP: 'hammerPickup'
});

// ---------------------------------------------------------------------------
// Retro colour palette (NES-era Donkey Kong)
// ---------------------------------------------------------------------------
DK.COLORS = Object.freeze({
  BG:             '#000000',
  GIRDER:         '#D04040',   // red steel girders
  GIRDER_RIVET:   '#FF8080',
  LADDER:         '#00FFFF',   // cyan ladder rungs
  PLAYER_HAT:     '#D00000',
  PLAYER_SHIRT:   '#D00000',
  PLAYER_SKIN:    '#F0A060',
  PLAYER_OVERALLS:'#0050D0',
  DK_BROWN:       '#804000',
  DK_FACE:        '#C08040',
  BARREL:         '#805020',
  BARREL_BAND:    '#D0A060',
  PAULINE_DRESS:  '#FF60A0',
  PAULINE_HAIR:   '#401000',
  HAMMER:         '#808080',
  HAMMER_HEAD:    '#D0D0D0',
  TEXT:           '#FFFFFF',
  SCORE:          '#00D0FF',
  HUD_LABEL:      '#FF4040'
});

// ---------------------------------------------------------------------------
// Input key mappings
// ---------------------------------------------------------------------------
DK.KEYS = Object.freeze({
  LEFT:  'ArrowLeft',
  RIGHT: 'ArrowRight',
  UP:    'ArrowUp',
  DOWN:  'ArrowDown',
  JUMP:  ' ',          // spacebar
  START: 'Enter'
});

// ---------------------------------------------------------------------------
// GAME STATE SHAPE — This is the canonical contract.
// engine.js produces this object; renderer.js consumes it.
// ---------------------------------------------------------------------------
/**
 * @typedef {Object} GameState
 *
 * @property {string} screen
 *   One of DK.SCREENS values.
 *
 * @property {Object} player
 * @property {number} player.x
 * @property {number} player.y
 * @property {number} player.width
 * @property {number} player.height
 * @property {number} player.vx          — horizontal velocity (px/s)
 * @property {number} player.vy          — vertical velocity   (px/s)
 * @property {string} player.state       — one of DK.PLAYER_STATES
 * @property {number} player.direction   — -1 (left) or 1 (right)
 * @property {boolean} player.hasHammer
 * @property {number} player.hammerTimer — seconds remaining
 * @property {number} player.lives
 * @property {number} player.score
 * @property {number} player.animFrame   — current animation frame index
 *
 * @property {Object} donkeyKong
 * @property {number} donkeyKong.x
 * @property {number} donkeyKong.y
 * @property {number} donkeyKong.width
 * @property {number} donkeyKong.height
 * @property {string} donkeyKong.state   — e.g. 'idle', 'throwing'
 * @property {number} donkeyKong.throwTimer
 *
 * @property {Object} pauline
 * @property {number} pauline.x
 * @property {number} pauline.y
 * @property {number} pauline.width
 * @property {number} pauline.height
 *
 * @property {Array<Object>} barrels
 * @property {number} barrels[].x
 * @property {number} barrels[].y
 * @property {number} barrels[].width
 * @property {number} barrels[].height
 * @property {number} barrels[].vx
 * @property {number} barrels[].vy
 * @property {string} barrels[].type     — 'barrel' or 'fireBarrel'
 * @property {boolean} barrels[].onLadder
 *
 * @property {Array<Object>} platforms
 * @property {number} platforms[].x
 * @property {number} platforms[].y
 * @property {number} platforms[].width
 * @property {number} platforms[].height
 * @property {number} platforms[].angle  — slope in radians (0 = flat)
 *
 * @property {Array<Object>} ladders
 * @property {number} ladders[].x
 * @property {number} ladders[].y
 * @property {number} ladders[].width
 * @property {number} ladders[].height
 * @property {boolean} ladders[].climbable — false for broken ladders
 *
 * @property {Object|null} hammerPickup
 * @property {number} hammerPickup.x
 * @property {number} hammerPickup.y
 * @property {number} hammerPickup.width
 * @property {number} hammerPickup.height
 * @property {boolean} hammerPickup.active
 *
 * @property {number} level
 * @property {number} highScore
 */
