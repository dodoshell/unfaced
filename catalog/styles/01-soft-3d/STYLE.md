# 01 Soft 3D

Rounded toy-like shapes with soft light, like clay figures on a pastel table. Calm, cute and tactile; good for kids, animals and products.

## Look

- Characters and the demo's park are real 3D solids (three.js through `@remotion/three`): each part of the shared character system becomes a smooth, matte solid lit from the top left. See `engine/remotion/core/three/Figure3D.tsx`.
- Cards and badges are CSS clay: a light-to-dark gradient from the top, an inner highlight along the top edge, an inner shade along the bottom and a soft contact shadow under them. No outlines, no hard shadows.
- Corners are very round: cards 64 px, list rows fully rounded pills, badges are balls.
- Background: a pale glow behind the middle of the frame over the background colour, and six clay toys (spheres, rings, a capsule, a cube) drifting and turning slowly at the edges, clear of the text column.
- Scene kinds:
  - **title**: the hook in heavy ink type on a clay card, with two clay balls tucked behind its corners. The card is complete on the first frame, then wobbles once like soft clay.
  - **fact**: a big clay ball with the fact's number (a star for script types that don't number their beats), bobbing, with two small balls orbiting it on a tilted path, passing in front and behind.
  - **list**: the lead-in on a highlight pill, then one pill per item with a numbered clay ball as its bullet.
  - **outro**: a clay ball with a puffy white heart that beats. The engine draws the ending's sign above it.

## Colour

Default palette (`style.json`): `#F6E7DA` `#F28C8C` `#7FC8C2` `#FFD37A` `#3D3550`.

A page palette maps onto five roles by position: 1 background, 2 accent, 3 secondary, 4 highlight, 5 ink. Missing roles fall back to the default palette. Every clay colour is derived from its base colour (lighter on top, darker below), so any palette keeps the lighting. Cards are near-white under dark ink and a lifted background colour under light ink, so dark palettes stay readable. Pastels look best; saturated palettes read as plastic rather than clay.

## Type

Nunito (SIL OFL 1.1), shipped in `fonts/` and recorded in `LICENSES/README.md`. Black (900) for the headline, numbers and the list header, extra bold (800) for list items. White lettering on clay gets a soft drop shadow.

Font sizes come from `fitFontSize` so each text fits its box: headline 50–104 px, list header up to 74 px, list items 28–62 px.

## Layout

`components/layout.ts` exports a pure `layout(scene, palette)` that returns every text box of a scene. The components draw exactly those boxes, and the checks call it without rendering. All boxes sit inside the safe zone and above the captions (y < 1180):

| Kind | Boxes |
|---|---|
| title | `headline` 110,480 780×480 |
| fact | `badge` 290,420 420×420 |
| list | `header` 110,300 780×130, then `item1…n` stacked down to y 1120 with 24 px gaps, at most 150 px tall |
| outro | `mark` 340,440 400×400 |

Decorations (the balls behind the title card, the orbiting balls, the background toys) may leave the boxes; they carry no text.

## Motion

All durations at 30 fps.

- **Entrance**: shapes land with squash and stretch (a spring with a soft overshoot, wider and flatter while overshooting, settling in about a second). List pills land 6 frames apart after a 6-frame delay. The title is the exception: complete on frame 0, then a single wobble that settles in about a second.
- **Emphasis**: badges bob (14 px over 70 frames); orbiting balls circle about once every 6 seconds; the heart beats twice a second, then rests; the background toys float (14 px over 90 frames) and turn slowly.
- **Exit**: a hard cut. The softness is in the shapes, not in the cuts.

## Pitfalls

- WebGL: every figure is its own small WebGL canvas, and the background is one more. Chrome keeps about 16 at once, so a custom scene with more than about ten figures on screen at the same time starts losing the oldest ones. Group props into one figure where you can.
- Renders are slower than the 2D styles (each figure is lit and antialiased); the demo and the frames commands take noticeably longer.
- Long list headers drop to about 40 px to fit one 130 px pill. Keep the lead-in under about 25 characters.
- Very dark backgrounds lose the soft shadows that make the clay read as 3D; keep the background light.
