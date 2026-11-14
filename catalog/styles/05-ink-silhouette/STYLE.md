# 05 Ink silhouette

Solid black silhouettes against a banded sunset sky, with white serif type. High contrast, quiet and moody; good for history, stories and mystery.

## Look

- The sky is a stack of flat colour bands, thinner towards the horizon, like a screen print: deep night at the top, warming through the page's colours to a glow on the horizon. A big pale sun with a stepped halo sits low behind two ranges of distant ridges, each a mix of the sky and the ink.
- Everything in front is pure ink: no outlines, no shading, no shadows. The parts of a character are all filled with the ink, so they merge into one shape; the only light is a small glint in the eyes, the colour of the glow. Ground shadows and blush are left out.
- Background life: pairs of birds crossing the sky with their wings beating (one pair high up, two low against the glow, where they always show), stars twinkling in the top bands when the sky is dark, long cloud streaks drifting sideways, and the sun sinking a little over the whole video.
- The foreground is a hill of pure ink with grass along its crest and a lone acacia; the mascot stands on top of it, in front of the sun. The hill belongs to the scenes, not the background, so the dog demo's own park (painted as silhouettes) is not hidden behind it.
- Scene kinds:
  - **title**: the hook in white serif type straight on the sky, between two thin gold rules with a diamond in the middle.
  - **fact**: the fact's number as an ink Roman numeral on a pale moon with a stepped halo, thin clouds drifting across it; a four-pointed star for script types that don't number their beats. Consecutive facts keep the moon up across the cut.
  - **list**: the lead-in in gold small capitals over a gold rule, then the items like a film's credits: a gold Roman numeral, the item in white, a faint rule between rows.
  - **outro**: the same moon, with the ending's sign on it as an ink silhouette (the style draws the sign itself); endings without a sign get three birds flying across the moon.

## Colour

Default palette (`style.json`): `#F7C46C` `#D9573B` `#4E2753` `#FFC14D` `#120D16`.

The five roles by position: 1 background is the glow on the horizon, 2 accent the low sky, 3 secondary the high sky, 4 highlight the sun, the moon and the gold of rules and numerals, 5 ink the silhouettes. Missing roles fall back to the default palette.

The top of the sky is always darkened towards night, so the white type reads over any palette. The silhouettes must be dark (they also sit under the captions): a palette with a light ink, made for dark backgrounds, gets its darkest colour as the silhouettes instead, and the highlight lights the horizon when the background is too dark to glow. A highlight too dark to read on that night (under 3:1) is lifted towards white for the gold, keeping its hue. Very light secondary colours give a washed-out high sky; the darkening keeps type readable, but the mood is best with a deep secondary.

## Type

Cinzel (SIL OFL 1.1), shipped in `fonts/` and recorded in `LICENSES/README.md`. Its lower-case letters are small capitals, so ordinary sentences read like inscriptions. Bold (700) for the hook, the list's lead-in and numerals, semi-bold (600) for list items, black (900) for the numeral on the moon. White type has a soft halo the colour of the night sky.

Font sizes come from `fitFontSize` with Cinzel's wider letters (`CINZEL` in `layout.ts`): headline 50–124 px, list lead-in 32–60 px, list items 30–62 px. The moon's numeral is 110–250 px, by its length.

## Layout

`components/layout.ts` exports a pure `layout(scene, palette)` that returns every text box of a scene. The components draw exactly those boxes, and the checks call it without rendering. All boxes sit inside the safe zone and above the captions (y < 1180):

| Kind | Boxes |
|---|---|
| title | `headline` 110,300 780×620 (the rules sit inside it, above and below the words) |
| fact | `badge` 330,380 420×420 (the moon) |
| list | `header` 110,280 780×150, then `item1…n` stacked down to y 1080 with 16 px gaps, at most 128 px tall |
| outro | `mark` 330,380 420×420 (the same moon, with the ending's sign) |

The list stops at y 1080, in the darker part of the sky, clear of the hill. The hill's crest is at y 1166 under the mascot (x 540); the captions run over the ink below it.

## Motion

All durations at 30 fps. Nothing bounces: no springs, only eased fades and slow drifts.

- **Entrance**: the hook is complete on frame 0; its gold rules draw outwards from the centre over 40 frames and the block drifts up 14 px over 10 seconds. The moon rises 40 px while fading in over 30 frames; its numeral fades in from frame 14, over 20 frames. List rows fade in and rise 22 px over 22 frames, 10 frames apart. Signs on the moon fade in over 26 frames.
- **Emphasis**: the moon floats 6 px over 160 frames; clouds drift across it at about half a pixel a frame; birds cross the sky at about a pixel a frame, wings beating every 20 frames; the grass on the crest sways; the sun sinks 1.2 px a second. Something always moves against the glow, so the frozen-frame check never sees a still sky.
- **Exit**: words fade out over the last 9 frames of a scene, so each cut lands on a quiet sky; the hill, the sun and the mascot stay put.

## Pitfalls

- Silhouettes read by outline only: poses with a limb in front of the body (a point, a raised paw) lose that limb into the body. The style's own scenes never use the pointing pose, and show the mascot on the crest against the sun, where the outline reads best.
- Long hooks: past about 14 words the headline drops to its 50 px minimum. Keep hooks short; the small capitals already make long sentences dense.
- Keep the list's lead-in under about 30 characters, or it wraps to two small lines.
- A fact scene shows only the numeral; long facts (over about 8 seconds) feel still. Split them.
- A palette whose secondary and accent are both very light loses the dusk: the sky turns pastel and the stars disappear.
