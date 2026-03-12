# Project Context

- **Owner:** Jose Corral
- **Project:** Classic Donkey Kong game — 2D pixel art platformer in HTML5
- **Stack:** HTML5, Canvas API, JavaScript
- **Created:** 2026-03-11

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

- **2026-03-11 — Architecture scaffolded.** Four files created: `index.html`, `js/config.js`, `js/engine.js`, `js/renderer.js`. config.js owns the DK namespace and all shared constants/enums. engine.js and renderer.js are fully stubbed with JSDoc contracts — they never import each other. Communication is one-way: engine produces GameState, renderer consumes it.
- **Game loop is real, not a stub.** index.html contains a working fixed-timestep loop (1/60s) with accumulator pattern and spiral-of-death clamping. It calls `DK.engine.update(dt)` and `DK.renderer.render(state)` correctly.
- **Parallel workstreams established.** Data (Game Dev) owns engine.js — physics, collisions, level data, entity logic. Brand (Frontend Dev) owns renderer.js — pixel art sprites, UI screens, audio. They share only the GameState shape defined in config.js.
- **No build tools.** Vanilla JS loaded via script tags. No modules, no bundlers. Keeps iteration fast and the project accessible.
- **2026-03-11 — Team delivery complete.** Data delivered full engine (735 lines): slope physics, 11-step loop, scoring, level progression. Brand delivered complete renderer (980 lines): pixel art for all entities, 4 UI screens, Web Audio synthesis. Game is fully playable.
