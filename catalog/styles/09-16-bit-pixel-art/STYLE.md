# 09 16-bit pixel art

Chunky pixels, a limited palette and RPG text boxes, like a 16-bit console game. Retro and cheerful; good for games, trivia, history and anything with a "level up" feel.

## Look

- Everything sits on a 6 px grid, with no antialiasing. `components/pixels.ts` rasterises the shared character parts into 6 px cells: each cell takes the colour of the frontmost part over its centre, in 15-bit colour.
- Sprites get a one-cell ink outline, a lit top row and a shaded bottom row, and checkerboard shadows. Eyes, mouths and other features are never shaded and never smaller than one cell.
- Big sprites (the fact coin, the ending signs) use 12 px cells.
- Text sits in RPG text boxes: stair-stepped corners, an ink edge, a colour band lit along the top and left and shaded along the bottom and right, an inner ink line, a flat fill and a checkerboard drop shadow.
- Background: a platformer stage. A sky in flat bands joined by checkerboard dither, a pixel sun (a moon and stars on dark backgrounds), two drifting clouds, stepped mountains and hills, and a grass ledge at y 1170 over checkered dirt, where the mascot stands.
- Scene kinds:
  - **title**: the hook in an RPG text box with the box's "next page" arrow blinking in the corner, and three twinkles.
  - **fact**: a big gold coin that spins in (narrow to full width in three steps) and bobs, with the fact's number struck into it (a star for script types that don't number their beats).
  - **list**: the lead-in on a highlight box, then one text box per item with a pixel number button; each row slides in from the left in three steps and types its text out, and a pixel cursor points at the newest row.
  - **outro**: the ending's sign as a pixel sprite (a speech bubble with "?", an arrow with stepping dots, a badge with a plus, a curling arrow; a star when the ending has no sign), with twinkles. The style draws the sign itself (it is in `DRAW_ENDING_MARK`).

## Colour

Default palette (`style.json`): `#41A6F6` `#B13E53` `#38B764` `#FFCD75` `#1A1C2C` (from the Sweetie 16 palette).

A page palette maps onto five roles by position: 1 background (sky), 2 accent (title frame, odd number buttons), 3 secondary (grass, list frames, even number buttons), 4 highlight (coin, sun, twinkles, lead-in), 5 ink (outlines and text). Missing roles fall back to the default palette. Every shade is a step of its base colour in 15-bit colour, so any palette stays limited.

Text boxes are near white with ink lettering, or dark with light lettering when the ink is the light colour, so dark palettes stay readable. A background under 30% brightness turns the sun into a moon and adds stars.

## Type

Pixelify Sans (SIL OFL 1.1), shipped in `fonts/` and recorded in `LICENSES/README.md`. Bold (700) for the headline, the lead-in and numbers, semi-bold (600) for list items. Lettering has a hard shadow down and to the right, never an outline all round: that would close the font's narrow counters and turn a 2 into an 8.

Font sizes come from `fitFontSize` so each text fits its box: headline 48–100 px, lead-in 30–64 px, list items 28–60 px (one size for all rows of a list, set by the longest). Coin numbers are 220 px (one character) or 180 px.

## Layout

`components/layout.ts` exports a pure `layout(scene, palette)` that returns every text box of a scene. The components draw exactly those boxes, and the checks call it without rendering. Every edge is on the 6 px grid. All boxes sit inside the safe zone and above the captions (y < 1180):

| Kind | Boxes |
|---|---|
| title | `headline` 108,474 792×486 |
| fact | `badge` 288,396 420×420 |
| list | `header` 108,300 792×132, then `item1…n` from y 462 (y 300 without a lead-in) stacked down to y 1122 with 24 px gaps, at most 150 px tall |
| outro | `mark` 342,438 396×396 |

Decorations (twinkles, the next-page arrow, the cursor) may leave the boxes; they carry no text.

## Motion

All durations at 30 fps. Everything moves at 10 fps, like a sprite: each value holds for 3 frames, and positions snap to the 6 px grid. The mascot is held the same way.

- **Entrance**: no tweens. The coin turns to face us in three steps; the ending sign grows in three steps with a one-step overshoot. List rows start 9 frames apart after a 6-frame delay, slide in from the left in three steps, then type out at about 48 letters a second. The title is complete on frame 0.
- **Emphasis**: two-pose bobs, one big cell for half the period (coin 40 frames, sign 36); twinkles cycle dot, cross, star, cross, 6 frames a pose; the next-page arrow and the cursor blink; clouds drift one cell every 14 or 22 frames.
- **Exit**: a hard cut, like a screen change in a game.

## Pitfalls

- More than 5 list items make the rows short and the shared item size small; split the list across two beats.
- Long list items type out for longer: a 60-letter item takes about 40 frames from the moment its row appears. Keep items short so the list is complete while the voice reads it.
- Fine detail disappears in 6 px cells: thin mascot parts (whiskers, small marks) become one-cell lines or single cells. Mascots with big simple shapes read best.
- The ledge is part of the background: in custom scenes with their own ground (a park, a room) it shows behind them as a terrace.
- Smooth gradients don't exist here: a palette whose roles are very close in brightness makes the banded sky and the box bevels hard to see.
