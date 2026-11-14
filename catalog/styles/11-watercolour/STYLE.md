# 11 Watercolour

Soft transparent washes on cold-press paper, with darker edges where the pigment dried, colours bleeding into each other and a few spattered drops. Calm and gentle; good for nature, emotional stories and travel.

## Look

- Everything is a wash: a transparent colour with a darker, slightly blurred rim where the pigment pooled, uneven density inside (flow marks and fine granulation) and edges that wander. Washes overlap and glaze into a third colour where they cross. No hard outlines, no flat fills, no shadows.
- The sheet is warm cold-press paper with a raised tooth lit from the top left. Spattered drops of the accent and highlight colours sit around the bigger washes.
- Lettering is handwritten in ink on top of the washes, never inside a box.
- Characters and the demo's park are painted too: every part of the shared character system becomes a wash of its colour, a little lighter than the flat colour, with a darker rim, a slightly wobbly, softened edge and granulating pigment inside. White parts (clouds, a belly) are the paper left bare with a pale blue rim. Eyes, mouths, noses and brows are painted on afterwards with a fine brush. Poses and proportions are the character system's own.
- Background: the paper sheet with two loose groups of overlapping washes, one in the top left corner and one in the bottom right, with spatter.
- Scene kinds:
  - **title**: the hook handwritten over three overlapping washes (accent, with highlight and secondary bleeding in at the corners).
  - **fact**: the fact's number handwritten on a round accent wash with the secondary bleeding into its edge, inside a loose pen ring that doesn't quite close. A star drawn freehand with the same pen for script types that don't number their beats. The words come from the captions.
  - **list**: the lead-in over a brush stroke of the highlight colour, then one faint brush stroke per item with its number on a small round wash.
  - **outro**: a heart painted wet in wet over a pale round wash, with spatter. The engine draws the ending's sign above it.

## Colour

Default palette (`style.json`): `#FAF6EC` `#4F82B3` `#D98B7E` `#E6B866` `#2F3A4C`: warm white paper, cobalt blue, rose, yellow ochre and a slate ink.

A page palette maps onto five roles by position: 1 background (the paper), 2 accent (the title's main wash, the fact disc, odd list items, spatter), 3 secondary (the colour bleeding into the title and the fact disc, even list items, the heart), 4 highlight (the title's warm corner, the list header stroke, the outro's ground wash), 5 ink (all lettering, the pen ring). The background washes use 2, 3 and 4. Missing roles fall back to the default palette.

On a light sheet the washes glaze (`mix-blend-mode: multiply`), like real transparent paint, so they only ever darken the paper and the ink stays readable over them. On a dark sheet (background luma under 128) multiply would make them vanish, so they are laid on normally; they read less like watercolour, but the light ink stays readable. When the ink would read below 3:1 on the paper, as when a short dark palette falls back to the slate ink, the lettering and the pen ring are white or near black instead.

## Type

Shadows Into Light Two (SIL OFL 1.1), shipped in `fonts/` and recorded in `LICENSES/README.md`. It is thin, so every line gets a stroke of its own colour about a 55th of its size thick to hold up on a phone; lines are balanced (`text-wrap: balance`) so no word is left alone on a line.

Font sizes come from `fitFontSize` with a letter width of 0.46 of the size: headline 60–140 px, list header 40–86 px, list items 30–66 px. Numerals are 300 px (230 px for two characters).

## Layout

`components/layout.ts` exports a pure `layout(scene, palette)` that returns every text box of a scene. The components draw exactly those boxes, and the checks call it without rendering. All boxes sit inside the safe zone and above the captions (y < 1180):

| Kind | Boxes |
|---|---|
| title | `headline` 110,440 780×560 |
| fact | `badge` 290,400 420×420 |
| list | `header` 110,300 780×150, then `item1…n` 780 wide at x 110, stacked down to y 1120 with 22 px gaps, at most 140 px tall |
| outro | `mark` 340,440 400×400 |

Washes bleed past their boxes by up to 130 px, as wet paint does; they carry no text. Everything drifts (see Motion), the ink by up to 12 px, so a box's contents can sit that far off it. Text is inset within its box by more than that sideways and stays clear of the next row and of the captions.

## Motion

All durations at 30 fps. Everything eases in and out (cubic); nothing springs, bounces or overshoots.

- **Entrance**: washes bloom: they fade in while growing from 0.9–0.97× over about a second. Ink comes after the paint: the fact's ring and number fade in from frame 8; the list header's stroke is painted in from the left over 18 frames and its words fade in from frame 4; each item's stroke is painted in over 16 frames, with its words fading in and rising 10 px 6 frames later, starting at frame 8, 8 frames apart. The title is complete on frame 0 (the platforms' preview): its text is there in full and its washes are already more than half visible.
- **Emphasis**: a drift; nothing ever stands still, but nothing hurries. Ink drifts round a small oval (12 px, one turn every 3 s, at an even speed) and the washes under it drift the other way (10–18 px), so paint and ink slide gently against each other; each list row runs a little behind the one above, like a ripple. The background washes wander 18 px over 8 s and their strength breathes by 7% over 10 s; the outro heart also swells by 2% every 4 s.
- **Exit**: a hard cut; the calm is in the paint, not in the transitions.

## Pitfalls

- The drift is what keeps the picture moving between caption words when no mascot is on screen. Ink has to move about 0.7 px a frame for the frozen-frame check to see it, so the drift runs at an even speed; slowing it down, or swapping it for a float that rests at each end, makes `make` fail its checks.
- The washes, the paper and the pigment texture are drawn once into images and only moved or faded afterwards, so they cost little. Figures are not: each one is warped and blurred on every frame, so many figures on screen at once slow the render.
- Palettes with a very pale highlight or secondary nearly vanish on pale paper (that is what glazing does); keep the colours at least as strong as the defaults.
- A dark background loses the watercolour look (see Colour). The style is meant for light paper.
- Long hooks: past about 14 words the headline drops towards its 60 px minimum, where the thin hand gets hard to read. Keep hooks short.
- A long list lead-in (over about 30 characters) wraps to two lines at about 60 px; keep it short.
- A video's own `scenes/` code with fast or springy motion will feel out of place; keep it slow and eased.
