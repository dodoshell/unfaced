# 03 Flat cartoon

Bold flat shapes, thick ink outlines and bright colours. Friendly and loud; reads well on a phone at a glance.

## Look

- Every foreground shape is a solid fill with an 8 px ink outline and a hard 14 px ink shadow down and to the right. No gradients, no blur, no soft shadows.
- Corners are round: cards 48 px, tags 28 px, list items fully rounded pills, badges are circles.
- Background: cream paper with two big flat shapes half off the frame (top right, bottom left) and a few small dots. Background shapes have no outline.
- Scene kinds:
  - **title**: the hook in ink on a white card tilted −3°, over a slowly turning starburst.
  - **fact**: a big numbered circle badge (the fact's position in the body) with three twinkling sparkles. The words come from the captions.
  - **list**: a highlight-coloured header tag, then one white pill per item with a numbered bullet.
  - **outro**: a "!" badge over a spinning starburst, with confetti.

## Colour

Default palette (`style.json`): `#FFF4E0` `#FF6B35` `#2EC4B6` `#FFD23F` `#1B1B3A`.

A page palette maps onto five roles by position: 1 background, 2 accent, 3 secondary, 4 highlight, 5 ink. Missing roles fall back to the default palette, so a page can override just the first two. Keep the ink dark and the background light, or outlines and text lose contrast.

## Type

Fredoka (SIL OFL 1.1), shipped in `engine/remotion/fonts/` and recorded in `LICENSES/README.md`. Bold (700) for headlines and numbers, semi-bold (600) for list items. White lettering on coloured shapes gets an ink outline (1/9 of the size, at most 16 px).

Font sizes are chosen by `fitFontSize` in `components/layout.ts` so each text fits its box: headline 52–104 px, list items 30–64 px, header 36–72 px.

## Layout

`components/layout.ts` exports a pure `layout(scene, palette)` that returns every text box of a scene. The components draw exactly those boxes, and the checks (`unfaced check`, the style test) call it without rendering. All boxes sit inside the safe zone and above the captions (y < 1180):

| Kind | Boxes |
|---|---|
| title | `headline` 110,500 780×460 |
| fact | `badge` 290,400 420×420 |
| list | `header` 110,300 780×130, then `item1…n` stacked down to y 1120 with 28 px gaps, at most 150 px tall |
| outro | `mark` 340,440 400×400 |

## Motion

All durations at 30 fps.

- **Entrance**: everything pops in with a spring (≈15 frames, small overshoot) from 0.6× scale. The title's starburst follows 4 frames later. List items slide in from the left, 6 frames apart, after a 6-frame delay.
- **Emphasis**: badges bob up and down (14 px over 70 frames); sparkles twinkle (scale 0.5–1, ≈44-frame cycle); starbursts turn 0.25–0.4° per frame; background shapes drift.
- **Exit**: a hard cut to the next scene. Flat cartoon is punchy; fades look soft and out of style.

## Pitfalls

- Long hooks: past about 14 words the headline drops to its 52 px minimum and gets dense. Keep hooks short.
- More than 5 list items make pills short and text small; split the list across two beats.
- A fact scene has no words of its own on screen, only the badge; the captions carry the sentence. This is on purpose (no duplicated text), but a fact longer than about 8 seconds feels static. Split long facts.
- Dark page backgrounds break the look: the ink outline disappears.
