# 12 Kinetic typography

Huge condensed capitals that cut, slam and punch with the voice, on flat blocks of colour. Loud, fast and graphic; good for hot takes, myths, quotes and lists.

## Look

- The type is the picture: Anton capitals set as justified stacks, every line scaled to fill the column. No glow, no shadows, no texture; colour comes in flat blocks that run the full width of the frame.
- Background, always the same: the page's background colour, a faint baseline grid every 96 px and the safe zone's margins (x 60 and 940) ruled in, like a type specimen sheet. A progress bar in the accent colour fills along the top edge over the whole video.
- Characters and the demo's park are a two-colour screen print: flat fills, no outlines, angular shapes. Every colour moves to the palette colour nearest in hue (accent, secondary or highlight), darkened or lightened to keep its shade; greys become paper or ink. Parts on the far side are knocked back towards the background, the ground shadow is a flat bar, and big ground pieces (the demo's lawn) are a block of the secondary colour.
- Scene kinds:
  - **title**: the hook as a stack of up to 7 lines, centred in the column. The line holding the hook's key word sits on a full-width highlight band. The mascot stands small at the bottom right, where the captions would be (the title has none).
  - **fact**: the fact's number top left in outline capitals (a solid arrow pointing down at the stage for script types that don't number their beats), then the stage: a full-width block of colour holding the key word of the caption phrase being said, as big as it fits on one line, with a row of ticks under it counting the phrase's words. The mascot stands on top of the block at the right.
  - **list**: the lead-in in big capitals, then one row per item: a square number tag (accent and secondary in turn) and the item in capitals. Items land as the voice reaches them; the item being said sits on a highlight band running off the right edge.
  - **outro**: the stage again, starting on the accent block, with the ending's sign top left, drawn flat in the highlight colour through the engine's `EndingMark`. The style draws the sign itself (`DRAW_ENDING_MARK`), so the engine's centred sign stays away. Without a sign the mascot takes that corner.

## Colour

Default palette (`style.json`): `#0E0E0E` `#FF3B2F` `#2E5BFF` `#EEFF41` `#0A0A0A`.

A page palette maps onto five roles by position: 1 background (the ground and its grid), 2 accent (the progress bar, the arrow, list tags, a stage block), 3 secondary (list tags, the figures' ground, a stage block), 4 highlight (the title's band, the list item being said, the ending's sign, a stage block), 5 ink (type on light colours, the captions' outline). Missing roles fall back to the default palette.

The stage cuts through four blocks in turn: highlight, accent, paper, secondary. Each fact starts on the block for its place in the video, so facts in a row open on different colours. Paper is the colour type takes on the background: near white (`#F6F4EE`) on a dark background, the ink on a light one (`#111111` when the ink isn't dark either). Type on a block is white on dark blocks and the ink on light ones, chosen by brightness, so every word reads with light palettes too. In the figures, a palette colour close to the background's brightness only wins the hue match when no other colour is near, so a yellow cat doesn't vanish on a cream page.

## Type

Anton (SIL OFL 1.1) only, always in capitals, shipped in `fonts/` and recorded in `LICENSES/README.md`. Line widths come from Anton's own advance widths, measured from the TTF into `components/kinetic.ts`, and every line is drawn with SVG `textLength` to exactly that width, so a line fills its measure whatever the browser's text metrics do. Lines stack by cap height (0.86 em) with gaps of 0.12 em.

`fitLines` splits the words into lines of as even a width as possible, scales each line to fill the column (up to a maximum size), shrinks the stack to fit the box's height, and keeps the line count whose smallest line is biggest. Sizes: the hook up to 400 px over up to 7 lines at 96% of the column; the stage word up to 720 px on one line at 94%; the list's lead-in up to 170 px over 2 lines; list items up to 200 px over 2 lines; the fact number up to 260 px.

## Layout

`components/layout.ts` exports a pure `layout(scene, palette)` that returns every text box of a scene. The components draw exactly those boxes, and the checks call it without rendering. All boxes sit inside the safe zone and above the captions (y < 1180):

| Kind | Boxes |
|---|---|
| title | `headline` 60,250 880×900 |
| fact | `badge` 60,240 360×180, `stage` 60,470 880×620 |
| list | `header` 60,240 880×190, then `item1…n` from y 464 down to 1120 with 18 px gaps, at most 200 px tall |
| outro | `mark` 60,240 260×260, `stage` 60,560 880×540 |

The colour blocks reach 30 px above and below the stage box and run to the frame's edges, as do the title's band and the list's current-item band; they carry no text outside the boxes. The ticks sit in the stage block's lower edge. The mascot stands on the stage block's top edge, right of the badge.

## Motion

All durations at 30 fps.

- **Entrance**: a slam: type lands at 1.3× and settles over four frames (1.3, 1.12, 0.97, 1.01). The fact number, the list's lead-in and each list item slam in. The title is the exception: complete on frame 0, its key-word band punching when the voice says the word.
- **Beats**: the stage follows the captions. It cuts hard to the next block colour when a caption phrase starts (the same phrases the caption style shows, with its words per phrase), the phrase's key word slams in, and it punches again (1.09×, three frames) when the voice says it. The ticks fill as each word of the phrase is said. The key word is the phrase's longest word that isn't a small word ("the", "they're", "because"…), with a one-letter bonus for its last one, since a phrase's point tends to come at its end. It can differ from the word the caption style highlights; the captions carry the whole sentence underneath, so the key word appears twice on purpose.
- **List timing**: each item lands when the voice reaches its first word. Written words are matched to spoken ones by position, scaled when the voice says more or fewer words than are written, and every item lands at least 12 frames before the scene ends. Number tags of items still to come wait in their rows, dimmed.
- **Always moving**: the stage word pushes in 6% over each phrase and the title 3.5% over its scene, so the type never stands still between cuts; the progress bar grows every frame.
- **Exit**: a hard cut.

## Pitfalls

- The stage shows one word per caption phrase, not the sentence (see Motion). Write phrases that end on their point; a phrase with no strong word still puts its longest on stage.
- The stage word is sized to fill the width, so short words are huge and long ones smaller: a 4-letter word is set at about 450 px, a 13-letter one at about 140 px.
- Slams scale type past its box for a frame or two; a long stage word can touch the frame's edge on its first frame. The checks see the settled boxes.
- Scenes without a voice spread their written words evenly over the scene, so the stage and the list still move, but not on the beat.
- On a light background the type is set in the ink and stays readable, but a light highlight then barely stands out from the ground, so the title's band and the current list item lose their punch.
- More than 5 list items make rows short and the text small; split the list across two beats.
