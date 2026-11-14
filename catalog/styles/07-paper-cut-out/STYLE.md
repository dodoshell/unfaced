# 07 Paper cut-out

Layered coloured paper with soft shadows, shot like a stop-motion collage: every piece is cut by hand and nudged a little on every exposure. Warm and crafty; good for stories, kids and crafts.

## Look

- Everything is a piece of paper: a flat colour with a faint grain, soft blotches and pale fibres, lifted off the layer below by a soft drop shadow (light from the top left). No outlines, no gradients.
- Edges are cut, never drawn: cards and discs have short straight scissor snips that wander a few pixels in; the hills, the list header and the lawn of the demo are torn, with the paper's white core showing along the tear. All edges come from seeded random numbers, so a piece keeps its shape from frame to frame.
- Characters and the demo's park are cut paper too: every part of the shared character system becomes a paper piece with scissor-cut edges, a soft shadow on the parts behind it and the same grain. Eyes, mouths and brows are drawn on in ink. Poses and proportions are the character system's own.
- Background: a sheet of coloured paper with a cut paper sun and cloud at the top, a few paper stars and dots at the edges and three torn hills at the bottom, each lifted off the one behind.
- Scene kinds:
  - **title**: the hook written on a white card, taped with masking tape over a tilted sheet of accent paper.
  - **fact**: the fact's number cut from white paper and glued on an accent disc, over a scalloped rosette, with three paper stars. A star for script types that don't number their beats. The words come from the captions.
  - **list**: the lead-in on a torn strip of highlight paper taped down, then one white strip per item, pinned a little unevenly, with its number on a paper disc.
  - **outro**: a paper heart on a white disc, over a ring of paper rays, with paper confetti falling. The engine draws the ending's sign above it.

## Colour

Default palette (`style.json`): `#CFE3D4` `#E76F51` `#2A6F77` `#F2C14E` `#2B2D42`: mint paper, coral, deep teal, saffron and a navy ink.

A page palette maps onto five roles by position: 1 background (the sheet), 2 accent (the title's backing sheet, fact discs, the heart, odd list numbers), 3 secondary (the back hills, even list numbers), 4 highlight (the sun, the front hill, the rosette, the list header), 5 ink (lettering on white paper). Missing roles fall back to the default palette.

Cards are white card stock under a dark ink and a slightly lifted sheet of the background colour under a light ink, so dark palettes stay readable. Lettering on coloured paper is white, or on pale paper (the highlight strip) the darkest of the ink, the background and near black.

## Type

Patrick Hand (SIL OFL 1.1), shipped in `fonts/` and recorded in `LICENSES/README.md`. It has one weight; the big numerals get a stroke of their own colour to look like a sturdier cut-out.

Font sizes come from `fitFontSize` with a letter width of 0.44 of the size (Patrick Hand is narrow): headline 56–132 px, list header 40–84 px, list items 30–62 px. Numerals are 290 px (210 px for two characters).

## Layout

`components/layout.ts` exports a pure `layout(scene, palette)` that returns every text box of a scene. The components draw exactly those boxes, and the checks call it without rendering. All boxes sit inside the safe zone and above the captions (y < 1180):

| Kind | Boxes |
|---|---|
| title | `headline` 120,470 760×500 |
| fact | `badge` 300,410 400×400 |
| list | `header` 130,290 740×150, then `item1…n` 740 wide at x 110 and 150 in turn, stacked down to y 1120 with 26 px gaps, at most 140 px tall |
| outro | `mark` 340,440 400×400 |

Pieces are tilted by up to 3.5° and nudged by a couple of pixels, so their corners can leave a box by a few pixels; the text inside never does. Decorations (the backing sheet, the tape, the rosette, the stars, the rays, the confetti) carry no text and may leave the boxes.

## Motion

All durations at 30 fps.

- **Stop motion**: the scenes are shot at 12 exposures a second, so every pose holds for two or three frames (`floor(frame / 2.5)`). On each exposure every piece of paper is nudged by hand: 1–2 px and 0.3–1° (stars and confetti up to 8°), from a seed and the exposure number, so any frame renders the same on its own. The mascot holds its pose for the same exposures; figures in the demo, whose poses come from the engine, are nudged the same way.
- **Entrance**: a spring sampled on the held frames, so pieces land in visible steps with a small overshoot, settling in about half a second. Discs grow from 0.55×; list items slide in from the left 6 frames apart after a 6-frame delay; the list header drops in from above. The title is complete on frame 0 (the platforms' preview) and only gets nudged.
- **Emphasis**: the fact disc bobs 10 px; the rosette turns 2.5° and the outro rays 2° per exposure; the heart beats on two exposures out of ten; confetti falls 9 px per exposure.
- **Exit**: a hard cut, like the next shot of an animation stand.

## Pitfalls

- The jitter is the look. A video's own `scenes/` code that moves smoothly at 30 fps will look out of step; step its animations the same way (animate with `Math.floor(frame / 2.5) * 2.5`).
- Paper textures and shadows are drawn once into images and only moved afterwards, but figure shadows are blurred on every frame: many figures on screen at once slow the render.
- Long hooks: past about 16 words the headline drops towards its 56 px minimum. Keep hooks short.
- A long list lead-in (over about 30 characters) drops to about 56 px and reads smaller than the items; keep it short.
- A background as pale as the cards (white or near white) leaves the cards separated only by their shadows; give the page a tinted background.
