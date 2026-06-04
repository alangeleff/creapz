# Creapz — Graveyard Run

2D side-scrolling platformer starring the Creaperz reapers. Pure HTML5 canvas, zero dependencies.

Live: https://alang.studio/games/creapz

## Structure
- `index.html` — shell (fullscreen mobile layout, touch controls)
- `src/engine.js` — game engine (physics, combat, enemies, rendering)
- `levels/stage1.js` — stage definition (ground segments, platforms, enemies, souls, checkpoints)
- `assets/sprites/` — sprite strips (built from source sheets)
- `assets/sprites.json` — sprite metadata (frame counts, anchors, weapon hitboxes)
- `tools/build_all.py` — asset pipeline (processes raw AI-generated sprite sheets into strips + metadata; source sheets not in repo)

## Adding a stage
Create `levels/stage2.js` defining the same shape as stage1 (`world`, `goal`, `seg`, `obst`, `plats`, `chk`, `souls`, `enemies`, `bats`) and load it from `index.html`.

## Controls
Touch: on-screen buttons (double-tap-hold to run). Keyboard: arrows, Shift run, Space jump, Z melee, X cast, R checkpoint/reset, C character select.
