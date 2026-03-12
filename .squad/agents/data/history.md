# Project Context

- **Owner:** Jose Corral
- **Project:** Classic Donkey Kong game — 2D pixel art platformer in HTML5
- **Stack:** HTML5, Canvas API, JavaScript
- **Created:** 2026-03-11

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-03-11 — Full Engine Implementation
Implemented the complete game engine in `js/engine.js`:
- **Entity factories:** Player (16×16), Barrel (12×12, initial rightward velocity), DK (40×32 with throw timer), Pauline (16×22), Hammer (12×12).
- **Level 1 (25m):** 6 platforms with alternating ±0.04 rad slopes, 8 ladders (5 climbable, 3 broken), classic zig-zag layout on 448×512 canvas.
- **Physics:** Gravity (980 px/s²) with terminal velocity, slope-aware platform collision using `Math.tan(angle)`, AABB ladder/entity collision.
- **Full 11-step update loop:** Screen transitions, input handling (walk/jump/climb), DK barrel throwing on timer, barrel physics with edge reversal and random ladder descent, player↔barrel collision (death or hammer smash), hammer pickup with timed duration, win condition at Pauline's Y, death/respawn with lives, animation frame counter.
- **Key patterns:** Death checked early to lock out input, barrel IDs for jump-score deduplication, barrels reverse at platform edges instead of falling off.

### 2026-03-11 — Team Integration Complete
Brand (renderer.js) delivered 980-line pixel art implementation with full sprite animation and Web Audio synthesis. Game architecture proven: engine and renderer share only GameState contract, zero import coupling. Full game playable.

### 2026-03-11 — Critical Physics Bug Fixes (Ladders & Barrels)
Fixed two game-breaking bugs in `js/engine.js`:

**Bug 1 — Player couldn't reach upper platforms via ladders:**
- Root cause: Ladder Y positions were hardcoded without accounting for sloped platform surfaces. E.g., platform 2 at x=388 has surface Y≈386 due to -0.04 rad slope, but ladder top was at y=408 — a 22px gap. Player exiting the ladder fell through the platform collision tolerance window (only 16px).
- Fix: Recalculated all 8 ladder Y/height values from actual `tan(angle)` slope math at each ladder's center X, with 2px extension above/below platform surfaces.
- Added `snapToNearestPlatform()` helper that catches the player when exiting a ladder top, preventing fall-through.
- Added midpoint-based ladder entry: UP only enters from below ladder midpoint, DOWN only from above. Prevents jitter when player is at ladder top still holding UP.

**Bug 2 — Barrels didn't descend to lower platforms:**
- Root cause 1: `checkLadderCollision()` filtered out non-climbable (broken) ladders. Barrels couldn't use 3 of the 8 ladders.
- Root cause 2: Even on climbable ladders, misaligned positions meant barrels rarely overlapped ladders.
- Root cause 3: When a barrel entered a ladder, `checkPlatformCollision` immediately re-snapped it to the platform it just left.
- Fix: Added `allLadders` parameter to `checkLadderCollision()` — barrels pass `true` to use all ladders. Fixed ladder positions (same as Bug 1). Added `_ladderStartY` tracking so barrels skip re-landing within 30px of their departure platform, with snap-undo if the collision check catches the wrong platform.

**Key lesson:** When using sloped platforms, ALL position-dependent data (ladders, pickups, spawn points) must be computed from `platform.y + tan(angle) * (x - platform.x)` at the specific X coordinate. Hardcoding Y values from the platform's base Y ignores the slope offset entirely.
