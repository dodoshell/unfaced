# Making a new style

This folder is a working minimal style: plain cards, one font, flat figures. Copy it and make it yours.

1. Copy `_template/` to `NN-slug/` (the number and slug from `catalog/catalog.json`).
2. In `style.json` set `id`, `slug`, `name` (as in the catalog) and a five-colour `defaultPalette`.
3. Draw the look in `components/`: `Background`, the four scene kinds (`Title`, `Fact`, `List`, `Outro`) and `Figure`, the painter for characters and the demo's park.
4. Keep `components/layout.ts` pure (no React): it returns every text box of a scene, the components draw exactly those boxes, and `unfaced check` tests them without rendering.
5. Put the style's fonts in `fonts/` with their licence (OFL or similar), load them with `loadFont`, and add a row to `LICENSES/README.md`.
6. Register it: one import and one `registerStyle` line in `engine/remotion/styles/installed.ts`, one line in `engine/remotion/styles/layouts.ts` (and `DRAW_ENDING_MARK` if the outro draws the ending's sign), and `"status": "ready"` in `catalog/catalog.json`.
7. Write `STYLE.md` (the sections below are required) and run:
   - `npx vitest run tests/styles/contract.test.ts`: the rules every style follows (safe zone, captions, no overlaps, every scene kind, short palettes);
   - `npm run unfaced -- demo NN`: the dog demo in your style, then look at its frames;
   - `npm run unfaced -- make` on a sample video in your style, then `frames` and look at every frame.

## Rules every style follows

- Text stays inside the safe zone (220 px from the top, 380 px from the bottom, 60 px from the left, 140 px from the right) and above the captions (y < 1180).
- The title shows the hook's words from its first frame (the captions leave the hook out).
- A palette maps onto five roles by position: 1 background, 2 accent, 3 secondary, 4 highlight, 5 ink. Missing roles fall back to the default palette.
- Characters come from the shared character system: the style paints parts, never changes poses or proportions.
- Use `factBadge`, `factNumber` and `listParts` from the kit, so every style numbers facts and splits lists the same way.
