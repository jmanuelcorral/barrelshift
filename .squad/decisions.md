# Squad Decisions

## Active Decisions

### 1. Game Architecture & File Structure (Mikey, 2026-03-11)

**Status:** Accepted

Single global namespace (`DK`) approach with three core files:
- `index.html` — game loop bootstrap (Mikey)
- `js/config.js` — shared config, GameState contract, enums
- `js/engine.js` — physics, entities, levels (Data)
- `js/renderer.js` — sprites, UI, audio (Brand)

Key choices:
- **One-way data flow:** Engine → GameState → Renderer (no feedback)
- **Fixed-timestep physics:** 1/60s accumulator pattern
- **Programmatic pixel art:** No external sprite sheets, all `fillRect`
- **Frozen enums:** Prevent accidental mutations
- **No bundler/modules:** Plain script tags, config-first load order

### 2. Game Engine Architecture (Data, 2026-03-11)

**Status:** Implemented

Core engine decisions:
- **Sloped collision:** `platform.y + Math.tan(angle) * (x_offset)` for precise slope handling
- **Death check early:** DYING state handled before input processing
- **Barrel edge reversal:** Barrels reverse direction at edges rather than fall-through; 25% chance to take ladders downward
- **Jump scoring by ID:** Each barrel has unique ID, player tracks jumped barrels in map to prevent double-scoring
- **WIN→nextLevel():** Advances level preserving score/lives; TITLE/GAME_OVER call reset() for fresh start
- **Layout:** Classic 25m stage with 6 platforms (±0.04rad slopes), 8 ladders (3 broken), zig-zag path

### 3. Renderer Implementation (Brand, 2026-03-11)

**Status:** Implemented

Rendering & audio decisions:
- **Programmatic sprites:** All entities drawn with `fillRect` using DK.COLORS palette
- **Player pose dispatch:** State → Pose chain with bound `_block` helper; direction via `ctx.scale(-1,1)`
- **Girder art:** Red steel I-beams with rivet pattern every 8px, highlight top, shadow bottom; sloped via `ctx.rotate`
- **Ladder design:** 3px cyan rails + 2px rungs every 8px; broken ladders overlay-darkened
- **Audio synthesis:** Web Audio API oscillators (square/sawtooth/triangle), no audio files; AudioContext resume on first input
- **UI blink effect:** Internal frame counter toggling every 30 frames for "PRESS ENTER"
- **Z-order:** platforms → ladders → hammer → barrels → DK → Pauline → player (top)

### 4. Slope-Aware Ladder Positioning & Barrel Descent (Data, 2026-03-11)

**Status:** Implemented

Two critical gameplay bugs fixed with slope-aware ladder mathematics:

- **Ladder computation:** Y and height derived from `platform.y + tan(angle) * (x_offset)` at ladder center X, with 2px platform surface extension for AABB overlap. Replaces hardcoded positions.
- **Barrel ladder descent:** Uses `_ladderStartY` tracking to prevent re-landing on departing platform (30px threshold with snap-undo).
- **Ladder entry:** Midpoint directional check (UP from below, DOWN from above) prevents jitter at exits.
- **Platform snap:** `snapToNearestPlatform()` catches entities within 30px, preventing fall-through on slope mismatches.
- **Renderer data-driven:** Ladder visual positions now read from GameState, automatically matching physics calculations.

Result: Full bottom-to-top traversal enabled. Barrels descend through all 6 platforms. Win condition reachable.

### 5. Scale Toggle Button (Brand, 2026-03-11)

**Status:** Implemented

CSS-only canvas scaling toggle for improved player experience on modern screens:

- **Canvas scaling:** Button cycles 1x → 2x → 4x (default 2x). Native 448×512 buffer preserved; only CSS `style.width`/`style.height` change.
- **Input isolation:** Button uses `tabindex="-1"`, blocks keydown/keyup, auto-blurs on mousedown to prevent game input capture.
- **Centering:** Existing flexbox layout auto-centers when canvas dimensions change.
- **UI style:** Cyan border/text (#00d0ff) matches DK.COLORS.SCORE palette (retro aesthetic).
- **API:** `DK.scale.current()` available if other modules need the current factor.

Impact: Pure UI enhancement, no engine/config changes. Game coordinates and collision logic unaffected.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
