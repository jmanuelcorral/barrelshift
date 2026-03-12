# Project Context

- **Owner:** Jose Corral
- **Project:** Classic Donkey Kong game — 2D pixel art platformer in HTML5
- **Stack:** HTML5, Canvas API, JavaScript
- **Created:** 2026-03-11

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

- **renderer.js fully implemented (979 lines):** All sprites (Player 6 poses, DK 2 states, Barrel, Fire Barrel, Pauline, Hammer) drawn programmatically with fillRect pixel art. No external images.
- **Player sprite** uses a pose dispatch system (`_drawPlayerByState → _drawPlayerPose`) with bound `_block` helper. Direction flipping via `ctx.scale(-1,1)`. Walk cycle is 3-frame, climb is 2-frame, hammer alternates swing position, dying rotates.
- **Girders** rendered as red I-beam segments with highlight/shadow edges and rivet dots every 8px. Sloped platforms handled via canvas transforms.
- **Ladders** have 3px cyan rails + 2px rungs every 8px. Broken ladders get a semi-transparent dark overlay.
- **UI screens** (title, HUD, game over, win) all implemented with retro monospace fonts, blinking text via frame counter, zero-padded scores, and mini Mario head icons for lives.
- **Audio** uses Web Audio API oscillators — all 6 sound effects synthesised in real-time (jump=ascending sweep, death=3 descending tones, levelComplete=ascending arpeggio, etc). Autoplay policy handled with resume-on-interaction listeners.
- **Key constraint:** All coordinates use `Math.round()` and canvas has `imageSmoothingEnabled=false` for crisp pixel art.

### 2026-03-11 — Team Delivery Complete
Data (engine.js) delivered 735-line implementation with slope-aware physics and full 11-step game loop. Mikey scaffolded the one-way data architecture. Three-part team converged on fully playable Donkey Kong arcade game.

- **Scale toggle (DK.scale module):** Added CSS-only canvas scaling (1x/2x/4x) via `DK.scale` in renderer.js. Uses `tabindex="-1"` + keydown/keyup preventDefault + mousedown blur to keep keyboard input away from the button. Only CSS `width`/`height` changes — drawing buffer stays at 448×512. Body flexbox handles re-centering automatically. Button styled with monospace font and cyan DK.COLORS.SCORE accent to match retro palette.
