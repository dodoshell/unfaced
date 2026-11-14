# 08 Vintage comic

An old comic book page: Ben-Day dots, thick ink lines, panels with gutters, speech balloons and caption boxes, printed slightly off-register on yellowed paper. Loud and punchy; good for history, myths and bold claims.

## Look

- The page: yellowed newsprint with specks and soft stains, a darker edge, and a heavy ink border inset from the frame. A halftone screen of the secondary colour fills the sky, its dots shrinking to nothing by mid-page; a finer screen of the accent rises from the bottom edge under the captions. The screens are SVG dot fields built once, not per-frame filters.
- Printing: every colour plate sits a few pixels off the ink plate (6 px right, 4 px down), so a sliver of paper shows inside the outline on one side and the colour spills past it on the other. Lettering on bursts gets the same treatment, plus a hard extrusion in the secondary colour.
- Characters and the demo's park: flat colour plates set off the thick ink lines (4.5–9 px), dot-screen shading in a crescent on the side away from the light, an even light tint on ground planes, and dotted ground shadows. Eyes, noses and line work print with the ink plate. The ink plate is a mask, so a part in front hides the lines behind it.
- Scene kinds:
  - **title**: a two-panel page. The hook in a big speech balloon over a tilted yellow panel with red Ben-Day dots; across a gutter, the mascot reacting in a blue-tinted panel with focus lines, the balloon's tail reaching down to it. Without a mascot there is one panel and the tail points off-panel.
  - **fact**: the fact's number in big off-register lettering on a jagged yellow explosion with red dots, over focus lines; the mascot in a small inset panel. A star for script types that don't number their beats.
  - **list**: the lead-in on a yellow caption box, then one white panel per item with gutters between them, each number on a small burst over the panel's left edge.
  - **outro**: a red explosion with yellow dots over focus lines, holding the ending's sign (the style draws it) or, for a punchline, a big "!".

## Colour

Default palette (`style.json`): `#F1E2BF` `#D7312A` `#2C78BA` `#F6C833` `#1D1712`.

The five roles by position: 1 background is the paper, 2 accent the red plate (fact dots, outro burst, floor screen), 3 secondary the blue plate (sky screen, extrusions, the mascot's panels), 4 highlight the yellow plate (title panel, caption box, fact burst), 5 ink the page's own marks (the border, focus lines). Missing roles fall back to the default palette.

Balloons and panels are always near white, and their outlines and lettering always dark, so text reads on any paper. A palette with a light ink and a dark paper prints as a night-time comic: light border and focus lines on dark paper, with the same white balloons. The focus lines fade out above the captions so the words stay clear in both.

## Type

Bangers (SIL OFL 1.1), shipped in `fonts/` and recorded in `LICENSES/README.md`: condensed, slanted comic capitals, set in upper case with a little letter spacing. One weight (400).

Font sizes come from `fitFontSize` with Bangers' narrow letters (`BANGERS` in `layout.ts`): headline 58–150 px, list lead-in 38–76 px, list items 34–84 px. Fact numbers are 320 px (250 px for two digits), the outro's "!" 330 px.

## Layout

`components/layout.ts` exports a pure `layout(scene, palette)` that returns every text box of a scene. The components draw exactly those boxes, and the checks call it without rendering. All boxes sit inside the safe zone and above the captions (y < 1180):

| Kind | Boxes |
|---|---|
| title | `headline` 140,385 720×500 (the words; the balloon around them reaches x 70–930) |
| fact | `badge` 290,400 420×420 |
| list | `header` 110,290 780×128, then `item1…n` stacked down to y 1110 with 22 px gaps, at most 140 px tall |
| outro | `mark` 340,410 400×400 |

Decorations leave the boxes: the title's panels (the lower one reaches y 1510, under where captions would be, but the title has no captions), the bursts, the focus lines and the mascot's inset panel at 600,905 330×250.

## Motion

All durations at 30 fps. Scenes are drawn on twos (every other frame, like limited animation); the captions stay smooth.

- **Entrance**: shapes slam in from 1.3× in 4 frames with no bounce, then shake for 8 frames from the impact. List panels land 8 frames apart after a 6-frame delay. The title is complete on frame 0 and only shakes.
- **Emphasis**: bursts, number badges and the balloon "boil" (a new hand-inked outline every 4 frames); focus lines flicker between two sets every 6 frames.
- **Exit**: a hard cut, like turning to the next panel.

## Pitfalls

- Long hooks shrink the lettering to 58 px inside the balloon; past about 20 words the balloon gets crowded. Keep hooks short.
- Keep list items short (one line of about 25 letters): Bangers is narrow, but two-line items drop to small sizes.
- Bangers has capitals only, so everything is shouted and names lose their case.
- The boiling outlines and flickering focus lines are busy by design; scenes over about 10 seconds feel restless. Split long beats.
- Pastel accent or highlight colours make weak plates: the dots and bursts lose their punch. Strong primaries work best.
- A dark highlight makes a dark caption box: its lead-in is then lettered in white instead of the line colour, which reads but looks less like print.
