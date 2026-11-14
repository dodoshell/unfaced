# 06 Chalkboard

A green school board in a wooden frame, with everything written and drawn in rough chalk as you watch. Friendly and a little nostalgic; good for lessons, "did you know" facts and study tips.

## Look

- The board: the background colour with one static dust image over it (faint eraser smears, rows of half-erased handwriting, a fine grain) and a soft vignette. A wooden frame runs round the edges (22 px on the top and sides) with a 64 px chalk tray at the bottom holding two sticks of chalk and an eraser. The dust image is an SVG rendered once, not a filter run on every frame.
- Chalk: every line is drawn in three passes of the same path: a faint wide halo, the main stroke broken into long dashes with short gaps where the chalk skipped, and a thin stipple of dots. A grain mask (a static noise tile) eats into everything drawn in chalk, words included, so nothing is solid. Lines are never straight: they wobble along their length and loops don't quite close.
- Characters and the demo's park: each part is an outline in chalk over the board colour (so parts in front hide the lines behind them), lightly rubbed in with a pastel of its own colour. Eyes and noses are chalk dots, blush is a soft patch of the secondary colour, a shadow becomes two short strokes on the ground, and scenery shapes (the lawn, tufts of grass) are open strokes with no fill, so they never cover the frame or the tray.
- Scene kinds:
  - **title**: the hook in bold handwriting, centred, underlined twice in the accent colour.
  - **fact**: a hand-drawn circle around the fact's number, written large in the accent colour, with three strokes of the secondary colour at the circle's top right for emphasis (an accent chalk star instead of a number for script types that don't number their beats). The words come from the captions.
  - **list**: the lead-in in bold handwriting with a wavy accent underline, then the items one per row, numbered 1, 2, 3... in the accent colour.
  - **outro**: the ending's sign drawn in a few chalk strokes (an arrow with dots that run on, a question bubble, a circled 2 with a plus, an arrow turning back), or a smiley for a punchline. The style draws the sign itself (`DRAW_ENDING_MARK`).

## Colour

Default palette (`style.json`): `#26392F` `#F4D774` `#F2A6B0` `#9DD1E3` `#F1EEE4`.

A page palette maps onto five roles by position: 1 background (the board), 2 accent (yellow chalk), 3 secondary (pink chalk), 4 highlight, 5 ink (white chalk). Missing roles fall back to the default palette. Ink writes every word and draws the outlines; the accent underlines, numbers, the star and the signs' details; the secondary draws the fact's emphasis strokes, blush and the smiley's mouth. The highlight is not used: a board holds two coloured chalks at most.

Chalk colours are guarded against the board (`components/colours.ts`): if the ink has a contrast below 3:1 with the background it becomes the default white chalk or a dark chalk, whichever reads better, and an accent or secondary below 1.8:1 is mixed 55 % of the way towards the ink. Figure fills are pastels (the part's colour mixed 45 % of the way towards the ink), so the mascot's own colours read as coloured chalk.

## Type

Caveat (SIL OFL 1.1), shipped in `fonts/` and recorded in `LICENSES/README.md`, loaded as a variable font (400–700). Bold (700) for the headline, the list lead-in, the list numbers and the fact numbers; semi-bold (600) for list items. Every line of text gets a soft chalk-dust text shadow.

Font sizes come from `fitFontSize`: headline 64–172 px, list lead-in 44–92 px, list items 40–96 px (every item of a list takes the size of the one that fits smallest, so the rows match). Fact numbers are 300 px, 240 px for two digits.

## Layout

`components/layout.ts` exports a pure `layout(scene, palette)` that returns every text box of a scene. The components draw exactly those boxes, and the checks call it without rendering. All boxes sit inside the safe zone and above the captions (y < 1180):

| Kind | Boxes |
|---|---|
| title | `headline` 100,420 800×560 |
| fact | `badge` 280,390 440×440 |
| list | `header` 110,280 790×170, then `item1…n` stacked down to y 1120 with 18 px gaps, at most 150 px tall |
| outro | `mark` 300,430 400×400 |

The mascot stands under the fact's circle and the outro's sign (x 500), and at the lower right of the title (x 800).

## Motion

All durations at 30 fps.

- **Entrance**: chalk lines draw on from their start, eased out; words are written on with a left-to-right wipe. Figures draw part by part, back to front, in about 24 frames, every time a scene starts. The hook is complete on frame 0; its underlines draw over frames 6–20 and 16–28. The fact's circle draws in 20 frames, the number is written over frames 6–16 (the star over 10–32) and the emphasis strokes over 22–32. The list lead-in is written in 14 frames with its underline over frames 10–26; items follow 10 frames apart from frame 8, each in 14 frames. Signs draw in 20 frames, their details from frame 16.
- **Emphasis**: the chalk boils: every line is drawn again every 4 frames with a slightly different wobble, and words tremble by a fraction of a degree, as in hand-drawn animation. The boil never stops, so no title or tail after the voice stands still long enough to fail the frozen-frame check. The dots after the arrow light up one by one.
- **Exit**: a hard cut, like a new board.

## Pitfalls

- A light background turns the board into a whiteboard in a wooden frame: the ink guard keeps the words readable and the vignette turns warm, but the chalk dust is made for a dark board. Keep the background dark (a green, a slate, a dark blue).
- The figures redraw at every scene start, so the mascot is not visible on frame 0 of a scene; the title's preview frame shows the hook without the mascot.
- Long hooks: past about 20 words the headline falls to about 70 px, and small handwriting reads poorly. Keep hooks short.
- A fact scene shows no words of its own, only the circled number; a fact longer than about 8 seconds rests on the boil alone. Split long facts.
- Accent and secondary colours close to the ink lose their meaning once the contrast guard mixes them; pick chalk colours that differ from the ink and from each other.
