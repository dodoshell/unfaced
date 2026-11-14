# 02 90s low poly

Faceted, flat-shaded 3D like a 1997 console game: hard polygon facets, bevelled menu windows and chunky arcade numbers. Playful and a little nostalgic; good for games, tech, science and "top 5" countdowns.

## Look

- Characters are real 3D solids (three.js through `@remotion/three`) with flat shading and only six segments per curve, so every part shows its facets. See `engine/remotion/core/three/Figure3D.tsx`.
- Props (a cut gem, a star, crystals, a cursor prism) are low-poly meshes drawn as SVG by a small renderer in `components/poly.tsx`: each face one flat colour lit from the top left, with a dark outline. No WebGL canvas beyond the figures.
- Text sits on 90s menu windows: an octagon with cut corners, a thick bevelled frame whose eight faces are lit or shaded by their angle to the light, an ink outline, a hard drop shadow and a vertical gradient panel. No soft shadows, no blur.
- Background: a sky of jittered flat-shaded triangles darkening towards the top, a faceted sun low on the right, two ranges of two-tone polygon mountains, and three crystals floating and turning at the edges, clear of the text column.
- Scene kinds:
  - **title**: the hook in white on a menu window that hangs in 3D space and sways slowly, with a gem spinning on its top left corner.
  - **fact**: a big cut gem in the accent colour, spinning in and then rocking, with the fact's number in arcade type printed on its table (a star for script types that don't number their beats), and three flashing diamond glints.
  - **list**: the lead-in on an accent title bar, then one menu row per item with a bevelled number button, and a 3D cursor that moves to each row as it lands.
  - **outro**: a gold star spinning like a collectible, sending out octagonal rings. The engine draws the ending's sign above it.

## Colour

Default palette (`style.json`): `#6B4FC8` `#FF4F79` `#2F6BFF` `#FFC23D` `#120E2E`.

A page palette maps onto five roles by position: 1 background (sky and mountains), 2 accent (gem, odd number buttons, list title bar), 3 secondary (panels, even number buttons), 4 highlight (window frames, star, cursor), 5 ink (outlines and shadows). Missing roles fall back to the default palette. Every facet's shade is derived from its base colour, so any palette keeps the lighting.

Panels mix the secondary colour into the darker of background and ink and stay dark, so the white lettering reads on any palette, dark ones included. Saturated palettes suit the look best; pastels make the facets hard to see.

## Type

Two faces, both SIL OFL 1.1, shipped in `fonts/` and recorded in `LICENSES/README.md`:

- Rubik for the headline and list items: white, extra bold (800, list items 700), with a hard drop shadow straight down.
- Press Start 2P for numbers and short list lead-ins: white, extruded down and to the right in ink, with an ink outline from 48 px up.

Font sizes come from `fitFontSize` so each text fits its box: headline 50–104 px, list items 28–60 px (one size for all rows of a list, set by the longest), lead-in 30–44 px in Press Start 2P, or 32–64 px in Rubik when it would not fit above 28 px. Fact numbers are 150 px (one character) or 112 px.

## Layout

`components/layout.ts` exports a pure `layout(scene, palette)` that returns every text box of a scene. The components draw exactly those boxes, and the checks call it without rendering. All boxes sit inside the safe zone and above the captions (y < 1180):

| Kind | Boxes |
|---|---|
| title | `headline` 110,480 780×480 |
| fact | `badge` 290,400 420×420 |
| list | `header` 110,300 780×130, then `item1…n` from y 464 (y 300 without a lead-in) stacked down to y 1120 with 26 px gaps, at most 150 px tall. When rows would get shorter than 72 px (one line of 28 px text), the lead-in drops to 100 px and the gaps to 16 px |
| outro | `mark` 340,440 400×400 |

Decorations (the gem on the title window, the glints, the cursor, the rings, the background crystals) may leave the boxes; they carry no text.

## Motion

All durations at 30 fps.

- **Entrance**: gems and stars snap in with a stiff spring (about 12 frames, small overshoot); the fact gem spins one and a half turns on the way. List rows slide in from the right over 9 frames, 6 frames apart after a 6-frame delay; the lead-in drops in over 8 frames. The title is complete and square to the camera on frame 0.
- **Emphasis**: the title window sways (about 5° over 10 seconds); gems and stars turn so their facets catch the light; the fact gem bobs (12 px over 70 frames); glints flash; outro rings leave every 34 frames; the cursor jitters sideways; background crystals float and turn.
- **Exit**: a hard cut, like a menu screen changing.

## Pitfalls

- WebGL: every figure is its own small WebGL canvas. Chrome keeps about 16 at once, so a custom scene with more than about ten figures on screen at the same time starts losing the oldest ones. The style's own props are SVG and don't count.
- Press Start 2P is wide: a lead-in over about 15 characters drops to 32 px on two lines, and past about 50 it falls back to Rubik. Keep lead-ins short.
- More than 5 list items make the rows short: an item that does not fit its row at 28 px is cut after the lines that fit, with an ellipsis, and past 8 items the text shrinks below 28 px. Keep items short, and split a list of more than 5 across two beats.
- Cheek colours with transparency are drawn opaque on 3D figures, so blush reads stronger than in the 2D styles.
- Very light backgrounds wash out the sky's triangles and the mountain facets; keep the background mid to dark.
