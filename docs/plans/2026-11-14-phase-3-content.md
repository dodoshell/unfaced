# unfaced Phase 3 (Content) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** All 12 visual styles (each proven by the same dog scene), all 10 script types, the example pages, scripts, hook reel and combo videos, and manual handoff through `inbox/`.

**Architecture:** Every style is a folder `catalog/styles/NN-slug/` exporting a `StyleKit` (layout, scenes, background, figure painter), registered in `engine/remotion/styles/installed.ts` and `layouts.ts`. A shared contract test holds every registered style to the same rules. The dog demo is one engine composition whose motion and framing are fixed; only the style's `Background` and `Figure` change. 3D styles paint the same character parts as three.js meshes through `@remotion/three`.

**Tech Stack:** as Phase 1 and 2, plus `@remotion/three` 4.0.543, `three`, `@react-three/fiber` (3D styles only), fonts from google/fonts (OFL).

**Spec:** `docs/design/2026-11-14-unfaced-design.md` (sections 5.4, 5.5, 6.2, 6.4, 6.7, 7).

## Global Constraints

- Everything user-facing is in English. Demo videos are in English.
- Video: 1080×1920, 30 fps, H.264 + AAC. Free and offline: no paid key, no network at render time.
- Every shipped font or asset is OFL, CC0 or made by us, and listed in `LICENSES/README.md`.
- Styles are "as far apart as possible": each has its own font, palette, textures and motion rules.
- Every style keeps all text boxes inside the safe zone and above the captions (y < 1180), with no two boxes overlapping, for every scene kind and for lists of up to 5 items.
- The character system is shared: a style only paints parts; it never changes poses or proportions.
- Example MP4s are not committed (`.gitignore`); they are reproducible with one command and attached to the release. The README GIF grid is committed (≤ 6 MB).
- Commit as dodoshell, no AI attribution.

## Review Focus

1. A page palette with fewer than five colours, or a dark background, in every style: missing roles fall back to the default palette and text stays readable. Contract test (Task 1).
2. A hook of 20 words or a list of 5 long items: font fitting keeps text inside its box in every style. Contract test (Task 1).
3. A style whose `Figure` is rendered many times in one frame (the demo's trees, ball and dog; the mascot in every scene): 3D styles must not exceed the browser's WebGL context limit. Task 3 renders the demo with all figures.
4. A script type whose body needs a scene kind the style lacks (a countdown, X vs Y): the plan still maps every beat to title/fact/list/outro, and badges count correctly. Task 6 tests the badges per type.
5. A file in `inbox/` with the wrong shape, an unknown type or a hidden name: `unfaced inbox` reports it and `make` ignores it. Task 8.

---

### Task 1: Style template and the style contract test

**Files:** Create `catalog/styles/_template/` (STYLE.md, style.json, components/index.tsx, layout.ts, README of the five components), `tests/styles/contract.test.ts`, `engine/remotion/styles/registeredStyles.ts` (list of ids with a layout).

- Contract, for every style with a layout: boxes inside `SAFE_ZONE` and with `y + h <= 1180`; ids unique; no two boxes of one scene overlap; title with a 20-word hook, list with 1–5 items of 40 characters, fact, outro all lay out; `style.json` id/name/slug match `catalog.json`; `STYLE.md` has the sections Look, Colour, Type, Layout, Motion, Pitfalls; a 2-colour palette and a dark palette still lay out.
- Style 03 must pass unchanged.

### Task 2: The dog demo

**Files:** Create `engine/remotion/demo/dogDemo.ts` (pure timeline), `engine/remotion/demo/scenery.ts` (park parts: ground, two trees, bush, ball, as `Part[]` with role `prop`), `engine/remotion/demo/DogDemo.tsx` (composition `dog-demo`, props `{ style, palette? }`, 180 frames), `engine/src/cli/demo.ts` (`unfaced demo <style|all> [--out <dir>]`, default `examples/styles/`), tests `tests/demo/dogDemo.test.ts`, `tests/cli/demo.test.ts`.

- `dogDemoAt(frame)` returns `{ dogX, dogLift, pose, poseFrame, ballX, ballY, caught }`. Tests: the dog starts off the left edge and ends near the centre; the ball meets the dog's mouth at the catch frame (within 12 px); `caught` is false before it and true after; the dog is on the ground at frames 0 and 179; poses run → jump → happy → idle in that order.
- The render uses the style's `Background` and paints scenery and the dog with the style's `Figure`. No audio, no captions.
- Render style 03 and look at frames 0, 45, 90, 120, 179.

### Task 3: 3D figure painting

**Files:** add `@remotion/three`, `three`, `@react-three/fiber` (exact versions, Remotion pinned to 4.0.543); create `engine/remotion/core/three/Figure3D.tsx` (parts → meshes: ellipse → scaled sphere, capsule → capsule between the points, shape → extruded and bevelled, stroke → tube, mark → HTML text), `engine/src/render/renderVideo.ts` passes `chromiumOptions.gl = "angle"`; test `tests/render/three.test.ts` (slow: renders one still with a 3D figure and checks it is not blank).

- One `ThreeCanvas` per figure placement, orthographic camera, same placement maths as `FigureFrame`, so 2D and 3D figures stand in the same spot.
- Spike first; if headless WebGL fails on this machine, rule on SVG shading instead and ledger it.

### Tasks 4a–4k: Styles 01, 02, 04, 05, 06, 07, 08, 09, 10, 11, 12

One task per style, each in its own worktree, each with the same deliverables:

- `catalog/styles/NN-slug/` with `STYLE.md` (the six sections), `style.json`, `components/` (layout.ts, Background, Title, Fact, List, Outro, Figure, index.tsx) and its fonts in `engine/remotion/fonts/` with OFL texts.
- Registration (installed.ts, layouts.ts, `DRAW_ENDING_MARK` if the outro draws the sign), `catalog.json` status `ready`, `LICENSES/README.md` rows.
- Passes the contract test; a style test for anything the style computes (fit sizes, pixel grid, glow); renders the dog demo and a 30 s sample video with `unfaced make`, frames looked at.

| # | Look in one line | Font (OFL) |
|---|---|---|
| 01 soft 3D | pastel clay toys, soft light, rounded cards with soft shadows; figures through Figure3D, smooth shading | Nunito |
| 02 90s low poly | faceted flat-shaded meshes, low segment counts, triangle-mesh sky, chunky UI frames | Press Start 2P for labels, Rubik for text |
| 04 line art | one ink weight on off-white, strokes drawn on as you watch, one accent colour, no fills | Inter |
| 05 ink silhouette | black silhouettes on a graded sunset sky, white text, slow fades | Cinzel |
| 06 chalkboard | dark green board, chalk texture and smudges, strokes drawn on, handwriting | Caveat |
| 07 paper cut-out | layered paper with drop shadows, torn edges, 12 fps stop-motion jitter | Patrick Hand |
| 08 vintage comic | halftone dots, thick ink, panels and speech bubbles, off-register print | Bangers |
| 09 16-bit pixel art | figures rasterised to a 6 px grid, 16-colour palette, pixel UI boxes, stepped motion | Pixelify Sans |
| 10 neon synthwave | dark purple, glowing outlines, perspective grid, striped sun | Monoton for titles, Orbitron for text |
| 11 watercolour | soft washes with wet edges, paper grain, colour bleeding | Shadows Into Light Two |
| 12 kinetic typography | the words are the visual: huge type cut and moved on the word timings; the figure is small | Anton |

### Task 5: Script types 01–05, 07, 08, 10

**Files:** `catalog/scripts/NN-slug.md` for each (Purpose, Structure table with 30 s targets, Rules, two examples in `script.md` format), `examples/scripts/NN-slug.md` (one complete script per type, all ten), `catalog.json` status `ready`; `tests/script/parseScript.test.ts` already parses every ready file's examples.

### Task 6: Badges and scene kinds per script type

- Badges count up for 01 (steps), 07 and 09, down for 02, and show no number (the style's own mark) for 03, 04, 05, 06, 08 and 10. Move `factBadge` to `engine/remotion/core/badges.ts` so every style shares it; test every type there.

### Task 7: Example pages, combos, hook reel, all-styles video and GIF grid

- `examples/pages/`: curious-cats (exists, en), `space-in-60` (en, style 10, mascot bird), `piccola-storia` (it, style 11, mascot fox). Each with page.yaml, brand/mascot, ideas.md.
- `examples/combos/`: 5 scripts of ~30 s, each a different style, script type, hook, voice and ending, made with `unfaced make` (plan/timing/check tracked, MP4 ignored).
- `unfaced reel hooks` renders the hook reel (the first example of each hook, 2–3 s, kinetic typography over each style in turn); `unfaced demo all` renders all styles and `docs/media/styles-grid.gif` (4×3 grid, 270×480 cells, 12 fps, palette-optimised with ffmpeg).

### Task 8: Manual handoff

- `unfaced inbox <videoDir>`: lists `inbox/PROMPTS.md` entries without a file yet, checks every file (PNG/JPEG/WebP images at 9:16 and ≥ 1080 wide, MP4 H.264 clips at 9:16, WAV/MP3 voice), and prints one line each. Tests with fixture files.
- video-make and the format docs point at it.

### Task 9: Docs, README, ledger, review, PR

- README catalogs table, AGENTS.md, CONTRIBUTING.md stub for styles (full in Phase 4), whole-branch review, PR and merge.
