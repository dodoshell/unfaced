# 04 Line art

Clean single-weight lines on plain paper, drawn as you watch. Calm and minimal, with one accent colour; good for explainers, productivity and minimal brands.

## Look

- One line weight everywhere: 5 px, round ends and joins. No fills, no shadows, no gradients, no textures. Figures, rules, boxes and signs are all the same pen.
- Characters and the demo's park are outlines only. Each part is drawn over a knock-out in the paper colour, so a line stops where a part in front of it begins (the head hides the body's outline behind it), as an illustrator would draw it. Eyes and noses are pen dots, blush is two short accent hatches, a shadow becomes a ground line in the secondary colour, and scenery shapes (tufts of grass) are open strokes.
- Background: plain paper in the background colour, nothing else.
- Scene kinds:
  - **title**: the hook in semi-bold type, left aligned inside an outlined box, with a short accent underline. While the hook is on screen the accent pen traces the box once round.
  - **fact**: one circle around the fact's number in thin type, and an accent arc outside it that grows from the top as the fact is told (a light bulb with an accent filament instead of a number for script types that don't number their beats). The words come from the captions.
  - **list**: the lead-in with a short accent underline, then each item on its own ruled line, numbered 01, 02... in the accent colour.
  - **outro**: the ending's sign drawn in a few strokes (an arrow with dots that run on, a question bubble, a circled 2 with a plus, an arrow turning back), or an accent heart for a punchline. The style draws the sign itself (`DRAW_ENDING_MARK`).

## Colour

Default palette (`style.json`): `#F4F2EC` `#E4572E` `#B7B2A6` `#F2C14E` `#1C1C1E`.

A page palette maps onto five roles by position: 1 background, 2 accent, 3 secondary, 4 highlight, 5 ink. Missing roles fall back to the default palette. Ink draws every line and word; the accent is the only colour (underlines, numbers, the fact's arc, the signs' details, blush); the secondary colour draws the list rules and ground lines. The highlight is not used: one accent colour is the look. A dark palette (dark background, light ink) works as it is, since nothing relies on a light paper.

## Type

Inter (SIL OFL 1.1), shipped in `fonts/` and recorded in `LICENSES/README.md`, loaded as a variable font (100–900). Semi-bold (600) for the headline and the list lead-in, medium (500) for list items, thin (200) for the fact numbers and the follow sign's 2, light (300) for the list numbers. Headlines get slightly tight letter spacing (−0.02em).

Font sizes come from `fitFontSize`: headline 52–132 px, list lead-in 34–66 px, list items 30–60 px (every item of a list takes the size of the one that fits smallest, so the rows match).

## Layout

`components/layout.ts` exports a pure `layout(scene, palette)` that returns every text box of a scene. The components draw exactly those boxes, and the checks call it without rendering. All boxes sit inside the safe zone and above the captions (y < 1180), on one left margin at x 120:

| Kind | Boxes |
|---|---|
| title | `headline` 120,440 780×520 (the outlined box) |
| fact | `badge` 290,400 420×420 |
| list | `header` 120,290 780×170, then `item1…n` stacked down to y 1120 with 16 px gaps, at most 140 px tall; each row's rule is its bottom edge |
| outro | `mark` 300,430 400×400 |

The mascot stands under the fact's circle and the outro's sign (x 500), and to the right under the title box.

## Motion

All durations at 30 fps. Every line is drawn on with `stroke-dashoffset`, eased in and out; nothing springs or bounces.

- **Entrance**: figures draw part by part, back to front, in about 30 frames, every time a scene starts. The title box and the hook are complete on frame 0; the underline draws over frames 4–26. The fact's circle draws in 28 frames from the top, then the number fades up. List rules draw left to right 7 frames apart, each row's words fading up 6 frames after its rule. Signs draw in 30 frames, their accent details from frame 22.
- **Emphasis**: something always moves, slowly: the accent pen traces the title box once round over the title scene; the fact's accent arc grows for the whole scene; the dots after the arrow light up one by one while the arrow nudges forward; the bubble and the follow sign float (6 px over about 2 seconds); the plus and the heart beat (7–8 %); the turn-back arrow turns the way it points (0.6° a frame). Without these, a title or the last seconds after the voice ends stand still long enough to fail the frozen-frame check.
- **Exit**: a hard cut. The calm is in the drawing, not in transitions.

## Pitfalls

- The figures redraw at every scene start, so the mascot is not visible on frame 0 of a scene; the title's preview frame shows the hook and its box, without the mascot.
- Long hooks: past about 16 words the headline drops to its 52 px minimum. Keep hooks short.
- The secondary colour must stay visible on the background (it draws the rules); a secondary close to the background hides them.
- Line art has no cards behind the words, so when the palette's ink reads below 3:1 on the background (a light ink on a light background, a dark ink on a dark one, or a short dark palette that falls back to the default slate ink) every line and word is drawn in white or near black instead, and the page's ink is not used.
- A fact scene shows no words of its own, only the circle; a fact longer than about 8 seconds rests on the slowly growing arc. Split long facts.
