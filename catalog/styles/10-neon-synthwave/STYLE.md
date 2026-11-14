# 10 Neon synthwave

Glowing neon tubes on a dark grid under an 80s sunset. Retro, electric and night-time; good for tech, space and music.

## Look

- Every foreground shape is a neon tube: a coloured line with a white-hot core and two soft glow strokes around it, drawn as stacked SVG strokes (no blur filters). Text sits on dark glass panels framed by tubes.
- Background, always the same: a night sky glowing magenta towards the horizon at y 1180, twinkling stars, a striped 80s sun half sunk behind cyan wireframe mountains, a neon grid floor scrolling towards the viewer, faint scanlines and a brighter band rolling down like an old screen's refresh.
- Characters and the demo's park are neon signs: each part a dark glass shape inside a glowing tube of its own colour (same hue, full brightness), eyes and line work white-hot, the ground shadow a pool of pink light on the grid. Big ground pieces (the demo's lawn) are thin glass, so the floor shows through.
- Scene kinds:
  - **title**: the hook as a sign, in Monoton with a red/cyan fringe, on dark glass inside a double tube frame (magenta outside, cyan inside). The mascot stands on the horizon at the right.
  - **fact**: the fact's number in Monoton inside a neon ring, with a dashed ring turning inside and four sights turning the other way; a lightning bolt for script types that don't number their beats. Each fact turns the three tube colours round (ring, dashes and sights, number), so fact 1 is a cyan ring, magenta dashes and a gold number, fact 2 magenta, gold and cyan, and so on. The mascot stands in front of the sun. The words come from the captions.
  - **list**: the lead-in on a gold-framed glass panel, then one glass row per item framed in magenta and cyan in turn, with a glowing Orbitron number.
  - **outro**: a burst of neon rays turning round a glass disc that holds the ending's sign bent in neon (the engine's four signs redrawn as tubes), or a Monoton "!" for a punchline. The style draws the sign itself (`DRAW_ENDING_MARK`).

## Colour

Default palette (`style.json`): `#14062F` `#FF2A9D` `#22E1F0` `#FFC23D` `#08020F`.

A page palette maps onto five roles by position: 1 background (the sky), 2 accent (the grid, the title's frame, the sun's lower half), 3 secondary (mountains, every other list row), 4 highlight (the list header, the sun's top), 5 ink. The fact rings and numbers cycle through accent, secondary and highlight. Missing roles fall back to the default palette. Glass panels, the floor and the figures' bodies use the darker of background and ink (pushed towards black when a palette has no dark colour), and all lettering is a white-hot core with a coloured glow, so text reads with any palette. Character tubes keep the hue of the rig's own colours.

A light background turns the night into a pastel dawn: everything stays readable, but the glow barely shows against the sky. Dark backgrounds are what this style is for.

## Type

Monoton (the hook and the fact numbers) and Orbitron (list rows, the list header, the figures' marks), both SIL OFL 1.1, shipped in `fonts/` and recorded in `LICENSES/README.md`. Orbitron is a variable font (400–900): 800 for the header and a long hook, 600 for list items, 900 for the list numbers. Monoton's own space is a sliver, so the hook gets 0.28 em word spacing.

Font sizes come from `fitFontSize` with each font's measured letter width: the hook in Monoton at 76–120 px, or in Orbitron at 40–92 px when Monoton would have to go below 76 px (its inline strokes run together smaller); list header up to 60 px, list items 28–56 px.

## Layout

`components/layout.ts` exports a pure `layout(scene, palette)` that returns every text box of a scene. The components draw exactly those boxes, and the checks call it without rendering. All boxes sit inside the safe zone and above the captions (y < 1180):

| Kind | Boxes |
|---|---|
| title | `headline` 110,430 780×500 |
| fact | `badge` 290,370 420×420 |
| list | `header` 110,290 780×140, then `item1…n` stacked down to y 1120 with 24 px gaps, at most 150 px tall |
| outro | `mark` 340,420 400×400 |

The rays round the outro's sign, the fact ring's sights and the glow may leave the boxes; they carry no text. The mascot stands on the floor just above the horizon line (feet at y 1160, 1170 on the title), between the boxes and the captions.

## Motion

All durations at 30 fps.

- **Entrance**: tubes strike like real neon: on, off, a flutter, then steady, over eight frames (`useIgnite`), while the fact's ring grows from 0.85× and the outro's burst from 0.7× with a soft spring. List rows slide in from the right 6 frames apart after a 6-frame delay. The title is the exception: lit on frame 0, settling from 1.04× over 16 frames while its frame tubes flicker twice as they warm up.
- **Emphasis**: every lit tube hums (brightness 0.93–1, never the same two frames running, with a short dip now and then); the fact's inner ring turns 0.7° per frame and the sights 0.4° the other way; the outro's rays turn 0.5° per frame; badges float 10 px.
- **Background**: a grid row reaches the next every 22 frames; the sun's stripes slide down half a pixel per frame; stars twinkle; the scan band crosses the frame every 9 seconds.
- **Exit**: a hard cut. The motion lives in the floor and the tubes.

## Pitfalls

- Long hooks lose Monoton: past about 25 characters per line, or 5 lines, the hook switches to Orbitron. Keep hooks short to get the sign face.
- Light page backgrounds wash the glow out (see Colour); the style still reads, but it stops looking like neon.
- A fact scene has no words of its own on screen, only the numbered ring; the captions carry the sentence. Facts longer than about 8 seconds feel static; split them.
- More than 5 list items make rows short and the text small; split the list across two beats.
- The captions run over the grid floor: they are white with the palette's ink as outline, so keep the ink dark (the default is near-black violet).
