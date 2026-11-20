# 13 Night tech

A near-black navy ground with a soft blue glow and a faint dot grid, an elegant serif headline with one phrase in italic blue, and small monospace labels. Calm, premium and quiet; for software, services and agencies.

## Look

- The ground: the background colour, a soft glow of the accent colour low on the right (an ellipse centred at 80% across and 78% down, 35% strong at its heart and fading smoothly to nothing) and a faint dot grid, a 2 px round dot every 24 px in the ink at 8%, lined up with the 72 px margins. The dots show on the glow and all but vanish on the dark; they are texture, never pattern.
- Type does the work: a large serif headline, set tight, with the post's accent phrase (`*…*` in slides.md) in the italic of the same serif and the secondary colour. Body text in a plain sans, a soft grey-blue. Labels in a small monospace, letter-spaced.
- Lots of negative space: margins of 72 px, nothing in the corners but the frame, nothing decorative that does not carry meaning.
- No shadows, no outlines, no gradients on type. The only glow on an element is the faint halo of the handle's accent dot.

## Colour

Default palette (`style.json`): `#0B1020` `#2F6BFF` `#5B8CFF` `#2F9E6A` `#E8ECF7`.

A page palette maps onto five roles by position: 1 background (the ground), 2 accent (the glow, the handle's dot, the filled button and filled steps, the stat's bar), 3 secondary (the headline's accent phrase, "swipe →", the quote mark, outlined steps and list numbers), 4 highlight (the ✓ chips, rows and icons), 5 ink (headlines). Mixed from them: **muted**, the ink 45% of the way to the ground, for the frame's labels and second lines (`#858996` on the default palette, 5.3:1 on the ground); **body**, the ink 22% of the way, for body text and subtitles; **line**, the ink 84% of the way, for hairlines and rims; **surface**, the ground 5% towards the ink, the face of the phone and the notification card. The ✗ marks use one fixed soft red, `#E5605A`, on every palette: it means "no", not the brand.

**The ground stays dark.** Roles 2 to 4 always take the page's colours. The page's background replaces the ground only when it is dark (relative luminance under 0.2), and the page's ink comes with it; a light background is ignored, the default ground and ink stay, and `unfaced post` warns `Night tech keeps its dark ground; palette background #F7F5F0 ignored` (and that the ink was ignored too). So a brand with a light palette still gets its accent, secondary and highlight on the night ground. The rule lives in `engine/src/post/palette.ts`; the style declares `ground: "dark"` in its layout.

Every text box's contrast is checked against the ground *under it*, glow included: the layout measures the glow at the point of the box nearest its centre (`groundUnder` in `components/slides/tokens.ts`, the same numbers the ground is drawn with). On the default palette every colour passes as it is; with a brand palette a label or "swipe →" that would not reach 4.5:1 there is lifted towards white until it does, keeping its hue. The headline's accent phrase is lifted the same way (to 3:1), so a dark brand secondary still reads. Text on a filled shape (a step pill, the button) is white, or the ground when white does not reach 4.5:1 on the accent (as with an accent like `#FF0055`); text on chips, rows and cards is measured on their face.

## Type

Shipped in `fonts/`, all SIL OFL 1.1 and recorded in `LICENSES/README.md`:

| Role | Font | Used for |
|---|---|---|
| display | Instrument Serif Regular | headlines |
| accent | Instrument Serif Italic | the headline's accent phrase |
| text | Inter Regular (static 4.1) | subtitles and body |
| mono | JetBrains Mono Medium (static 2.304) | the frame: label, counter, handle, "swipe →" |

A brand's own fonts replace these by role (`brand.fonts` in page.yaml). Every text is fitted in advance from the font files' own metrics (`fitText`) and drawn line by line exactly as fitted, never wrapped by the browser. Headlines are fitted with `balance`: once the size and line count are found, the words are broken as evenly as that line count allows, so a headline never ends on a lone word.

Sizes at 1080 px wide: cover headline up to 150 px (down to 64) over at most 4 lines, line height 0.98, tracking −0.01 em; point headline up to 120 px (down to 56) over at most 3 lines, line height 1.0; subtitle up to 38 px over 3 lines at 1.42; body up to 40 px (down to 28) at 1.5; labels 22 px, letter-spaced 0.08 em. Neither serif has the glyphs ✓ ✗ ● →, so the handle's dot is drawn as a shape and "→" is set only in the mono's "swipe →". Everything else that is a mark is drawn, never set as text: ✓, ✗, the arrows, the bell, the quote mark and the list's numbers (monoline digits) are SVG in `components/visuals/Icon.tsx` and `Quote.tsx`, so no brand font needs those glyphs.

## Layout

This style draws posts only for now (see Slides); it has no video scenes, so `components/` holds `slides/` (the slide kinds, the ground and the frame) and `visuals/` (the drawn objects the slides are made of), and `index.tsx` exports them as `nightTech`.

## Motion

Posts only for now: still slides have no motion. Video scenes come in a later phase.

## Slides

`components/slides/layout.ts` exports a pure `compose(ctx)` that returns every text box of a slide and the shapes drawn with them (the icons' rows, the pills, the phone, the cards), and `layout(ctx)`, its boxes only; the views draw exactly those, and post plans and their checks call it without rendering. It is registered in `engine/remotion/styles/slideLayouts.ts`, the view (`components/slides/index.tsx`) in `engine/remotion/styles/installed.ts`. `components/index.tsx` exports `nightTech`, with `nightTech.visuals` (Badge, Chip, Flow, Icon, Notification, Phone) and `nightTech.colours`, for code inside this repository. `nightTechLayout` also gives the colours to the engine, which hands them to a post's own slides as their `colours` prop (`unfaced docs slides`, Custom slides).

**The frame**, on every slide, in the mono at 22 px, 4 px inside the format's safe area (y 64 and 1256 on 4:5, 254 and 1546 on a story), 72 px from the sides:

| Box | Where | Text |
|---|---|---|
| `label` | top left | the post's `label`, in capitals, muted; left out when the post has none |
| `counter` | top right | `n/N`, muted; left out on a single post |
| `handle` | bottom left, after a 10 px accent dot, or the brand's logo in its place: 28 px high at its own width (read from the PNG's header or the SVG's viewBox when the plan is built), up to 220 px | the brand's handle as written, muted |
| `swipe` | bottom right | the page language's word for "swipe" and "→", in the secondary colour; left out on the last slide and on single posts |

**Content.** Between the frame's rows, 96 px clear of each, the content uses a *seam*: the headline stands on it (its box is bottom-aligned, so the type grows upwards and what is under it always starts at the same place), the rest hangs 24 px below. On a 4:5 cover, and on any first slide, the content area is also held 40 px inside the profile grid's crop (y 169–1181). All sizes below are at 4:5; the other formats reflow from the same fractions.

| Kind | Seam | What it draws |
|---|---|---|
| `cover` | ⅔ down | `headline` (150 → 64 px, 4 lines), `subtitle` (the body, 86% wide, 3 lines) |
| `cover {visual: …}` | 36% down | headline (124 → 60, 3 lines), subtitle (2 lines), and under them, to the bottom of the content: a phone rising from the bottom, fading out at its foot. `chips`: the slide's `- ✓ …` / `- ✗ …` items (up to 4, 3 words each) as outlined chips alternating right and left of the phone, overlapping its rim, with a quiet web page on the screen. `phone`: the `screen: "…"` text (up to 8 words) in a message card on the screen. `notification`: a notification card up to 220 px tall (app icon: the brand's logo, else a bell on the accent; `title` up to 44 px, `text` up to 37 px over 2 lines), with a quieter card stacked behind |
| `point` | 42% | `headline` (120 → 56, 3 lines), `body` (90% wide, 40 → 24 px) |
| `list` | 30%, lowered | `headline` (104 → 52), then a row per item (up to 5, up to 170 px apart): a drawn number in a circle outlined in the secondary (a ✓ or ✗ in the highlight or red for a marked item), the item (42 → 22 px, 2 lines, centred in its row), its second line in muted under it; hairlines between rows |
| `steps` | 30%, lowered | `headline`, then the steps as a vertical flow (up to 156 px apart): pills as wide as their text (at most 56% of the width), joined by 3 px arrows; each step's second line in the mono at 28 px, capitals, at a column on the right (secondary on filled steps, body grey on outlined ones), joined by a dashed leader. Pills of the commonest second line are filled with the accent (on a tie, the one that first appears later; `{filled: software}` names it), the others are outlined in the secondary; without second lines every pill is filled |
| `compare` | 27%, lowered | `headline` (96 → 48), the body under it (2 lines, balanced), then two columns of rounded rows (up to 150 px apart, text up to 36 px): ✗ rows with a red rim and cross, ✓ rows with a green rim and tick, up to 34 px (up to 4 a side). Without marks, the first half against the second (before and after), an accent arrow between the first rows |
| `stat` | 56% | the figure as the headline in the serif (300 → 100 px, one line), a 72 × 4 px accent bar with a faint glow under the seam, and the line under it (44 → 26 px) |
| `quote` | 70% | the quote as the headline (80 → 34 px, up to 10 lines; quotation marks around it are dropped, the slide draws its own), a filled serif quote mark in the secondary riding 28 px above its first line, the author after a 40 px accent rule |
| `image` | | the photo (`{photo: inbox/…}`, inside the post folder) across the top in a 28 px rounded frame with a hairline rim, as tall as the text under it allows; the headline (76 → 40, 2 lines) standing under it and the caption (3 lines) below |
| `cta` | 54% | centred: the headline (120 → 56), the filled accent pill button with a drawn arrow and a soft accent glow, a small line under it |
| `custom` | | the frame only; the post's own component draws the content between the rows |

**Lowered**: list, steps and compare space their rows up to a cap, then lower the seam by half the room the rows leave empty, so the headline and the rows sit balanced in the content area instead of leaving its bottom third empty (most visibly with two or three rows, and on stories).

On a 4:5 carousel this puts the cover's headline in y 209–800 and its subtitle from 848; the point's headline in 190–573 and its body from 621.

Every text that sits on a drawn shape is checked on that shape's face. Texts that are short and often wrap (subtitles, list items, compare rows, the stat's line, captions, the cta's line) are balanced like headlines, so none ends on a lone word.

`unfaced demo 13 --post` renders the sample post (one slide of every kind, by the invented Studio Nord, with a drawn sample photo) and a second post with the three cover visuals, as a carousel and a story, into `examples/posts/13-night-tech/` and `examples/posts/13-night-tech/visuals/`.

## Pitfalls

- A logo is drawn 28 px high: a wide wordmark up to 220 px wide reads, a very wide one is capped and shrinks. A logo with lots of empty margin inside its file looks small; crop it.
- The headline grows upwards from the seam, so a one-line headline leaves space above it. That space is the style's calm, not a gap to fill.
- A very long headline shrinks to fit (down to 64 px on a cover, 56 on a point); past that, `unfaced post` stops and names the slide. Keep cover headlines to about 8 words for the big size; with a visual, to about 6.
- The glow sits low on the right, behind "swipe →" and the end of the body. A brand accent that is very bright makes the glow bright there too; the labels then get lifted towards white to stay readable, which shows as a paler "swipe →".
- The accent phrase must be words of the headline (`*…*`), not a whole sentence: one italic phrase is the style's signature, a fully italic headline loses it.
- A light brand palette does not make a light Night tech: the ground stays dark and the warning says so. Pick a dark background, or another style, for a light brand.
- Chips are for 1 to 3 words: "Fast on phones", not a sentence. The phone's screen is for one short message.
- The steps flow is filled by the second lines: give the steps a second line saying who does each (`- Design | us`) so the flow shows who does what, or every pill is filled.
- The square post (1080 × 1080) has a short content area: lists of five, six steps and visual covers fit at smaller sizes there. Prefer 4:5 for those.
