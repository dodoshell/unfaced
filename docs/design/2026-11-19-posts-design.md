# Posts and serious styles: design

Status: draft for approval · 2026-11-19

## 1. Intent

unfaced makes faceless short videos. A page also needs **still posts**: carousels, single images and stories, the kind a studio, a shop or a software company posts to explain what it does, give advice or announce something. Today a page that wants those has to make them somewhere else, and they don't look like its videos.

This design adds still posts to unfaced, made the same way as the videos: from a short text, in a style from the catalog, with the page's brand, checked automatically and reviewed before the user posts them. It also adds four **serious styles** (dark tech, Swiss editorial, blueprint, risograph) for brands that need a cleaner look than the twelve cartoon-leaning styles.

Who it is for, in order:
1. The owner's own pages, now.
2. The clients of a studio that runs social media for other businesses, later: every client is a page with its own colours, fonts, logo, handle and tone. The brand settings must be complete enough for that from the start.
3. Anyone using the public repository.

The reference for the look is a carousel the owner made earlier with code. The code was not kept; a screenshot of all eight slides was, outside the repository (it shows a real brand, so it must never be committed; the owner gives the builder its path). It shows eight 4:5 slides on a near-black navy ground with a soft blue glow, a serif headline with one word in italic accent blue, small monospace labels ("ABOUT 1/8" top left and right, "@handle" and "swipe →" at the bottom), outlined chips with ✓ and ✗, a step flow of pill nodes, a phone mock-up, a lock-screen notification, a numbered list and a closing slide with a single button.

## 2. Goals, non-goals, anti-goals

Goals
- One sentence ("a carousel about the 5 mistakes that make a site lose clients") gives finished slides, ready to upload, plus the caption and hashtags.
- The user names a **format by what it is for** ("Instagram carousel", "LinkedIn carousel", "story"), never by pixel size. The agent knows the sizes.
- Every format: Instagram carousel, single post, LinkedIn carousel (PDF), story.
- Posts and videos of a page look like the same brand: a style covers both.
- Brand per page: colours, fonts, logo, handle and site, tone of voice.
- Text from the agent (from a topic, the user approves) or from the user (laid out as written), both supported.
- Pictures: drawn in code by default; the client's own photos, free stock photos (Pexels) and, optionally, paid AI images.
- The ideas calendar plans posts and videos together and says which idea works better as which.
- Everything free by default; the paid image provider stays optional.

Non-goals
- Posting or scheduling. unfaced produces files only.
- Turning a carousel into a video automatically. Posts and videos are made separately (the owner's choice).
- A drag-and-drop editor. The text is a Markdown file; changes go through the agent.
- Making the twelve existing styles draw posts in this work. They get posts later; until then the catalog says so.

Anti-goals (a failure even if it works)
- Posts that look like a generic template: every style must look designed, at the level of the reference carousel.
- Any text cut off, overflowing its box or under a platform's interface.
- Real brands in the repository. The owner's studio and its clients never appear in it: examples use invented brands (for instance "Studio Nord").
- Copying lemo-opuscar's style texts or prompts. They are CC BY-NC 4.0 and unfaced is MIT. Its styles may inspire ideas only; its code is MIT and may be reused with its notice kept, recorded in `LICENSES/`.

## 3. Constraints

The rules in `AGENTS.md` apply. The ones that bite here:
- Everything user-facing in English; `README.md` and `docs/guide/getting-started.md` changes also go to `docs/i18n/<lang>/`. Post **content** is in the page's language (Italian included), with the frame's words ("swipe", "1/8") translated too.
- No feature may need a paid key; a paid provider without its key falls back to the free one and says so.
- Windows, macOS and Linux.
- The launcher copy rule and the reviewer copy rule (a new reviewer agent follows the same copy-and-test rule as `video-reviewer.md`).
- Rendering stays on Remotion (already used for the video cover), pinned at the version in use.
- Fonts shipped with styles must be free to redistribute (OFL or similar) and recorded in `LICENSES/`. Brand fonts are the user's files and their licence is the user's responsibility; unfaced never ships or uploads them.

## 4. Approaches

| Approach | Trade-off | Decision |
|---|---|---|
| A. **Inside the engine.** Each style gets slide kinds (cover, point, list…) as Remotion components with a pure layout, rendered as stills. A post can bring its own slide code for anything special, as videos already can with `scenes/`. | Same fonts, palette, brand and checks as the videos; costs components per style | **Chosen** |
| B. A separate HTML template pipeline screenshotted to PNG | Quicker to start; every style designed twice and the two drift apart | Rejected |
| C. The agent writes every post from scratch in code, as lemo-opuscar does for films | Freest look; inconsistent from post to post, many more tokens, hard to check; risky for a client service | Rejected as the default; kept as the custom-slide escape hatch of A |

The owner left the choice to the builder; A was recommended and taken.

## 5. What the user sees

### 5.1 Folder

```text
<page>/
├── page.yaml
├── brand/
│   ├── logo.svg | logo.png        optional
│   ├── fonts/                     optional: the brand's font files
│   └── mascot/                    as today
├── ideas.md                       now plans posts and videos
├── videos/<video>/                as today
└── posts/<post>/                  one folder per post, short slug
    ├── slides.md                  the text, slide by slide (written by the agent or the user)
    ├── custom/                    optional: this post's own slide code (index.tsx, boxes.json)
    ├── inbox/                     optional: photos to use; PROMPTS.md for generated ones
    └── made by unfaced: slide-01.png …, post.pdf, grid.png, check.json;
        written by the agents: review.md, post.md
```

### 5.2 page.yaml additions

```yaml
style: 13                     # one style for posts and videos, as today
# or, when a page deliberately keeps two looks:  style: { posts: 13, videos: 3 }
post_type: [1, 3]             # number, list or auto, like script
formats: [instagram-carousel, linkedin-carousel]   # what "make a post" makes by default

brand:
  handle: "@studionord"
  site: studionord.it         # optional
  logo: brand/logo.svg        # optional
  fonts:                      # optional; the style's own fonts otherwise
    display: brand/fonts/Fraunces.ttf
    text: brand/fonts/Inter.ttf
    mono: brand/fonts/JetBrainsMono.ttf
  tone: "direct, warm, no jargon; we talk to shop owners, not developers"
  words:
    use: [su misura, preventivo]
    avoid: [sinergia, soluzioni innovative]
```

`brand` replaces the reserved `font` field (keep accepting `font` and warn that it is ignored). Every `brand` field is optional. The handle, site and logo appear in posts. In videos, brand fonts apply to the four new styles, and logo and handle stay out of videos in this work. The tone and words guide every text the agents write: scripts, slides, captions.

### 5.3 Formats

Named presets; the agent maps what the user says to one of them. Sizes live in one table in the engine and in `unfaced docs slides`.

| Name | Size | Slides | Output |
|---|---|---|---|
| `instagram-carousel` | 1080×1350 | 2–10 | PNGs |
| `instagram-post` | 1080×1350 (`--square`: 1080×1080) | 1 | PNG |
| `linkedin-carousel` | 1080×1350 | 2–12 | PDF (and the PNGs) |
| `story` | 1080×1920 | 1–10 | PNGs |

Safe areas, which the layouts and the checks respect:
- 4:5 slides: 60 px margin all round. The cover keeps its headline inside the central 1080×1012 area (3:4), because Instagram's profile grid crops 4:5 posts to it.
- Stories: nothing readable in the top 250 px or the bottom 340 px (the platform's bars and reply field).

One `slides.md` can be made in several formats: the layouts reflow, the text stays. `grid.png` puts all slides of a format side by side for a quick look (like the reference screenshot).

### 5.4 slides.md

```markdown
---
title: Who we are
post_type: 3
format: [instagram-carousel]      # optional; page's formats otherwise
label: ABOUT                      # optional small label on every slide
---

## cover
# This page is made by *our software*
No filming, no faces. Here is why.

## compare
# Why *no faces*
You have no time to film, and not everyone wants to be on camera.
- ✗ cameras
- ✗ filming
- ✓ graphics
- ✓ voice

## steps
# How *a post* is born
- Topic | us
- Text | software
- Voice | software
- Check | us

## cta
# Want your socials *like this*?
[Join the waiting list: link in bio]
```

Rules:
- `## <kind>` starts a slide. Optional attributes after the kind, in braces, e.g. `## image {photo: inbox/shop.jpg}`, `## custom {id: phone}`.
- `# ` is the slide's headline; text wrapped in `*…*` is the accent (each style decides how: italic serif in accent colour, red, outlined…). At most one accent span per headline.
- Plain paragraphs are body text. `- ` lines are items; `a | b` gives an item a second, smaller line. `✓` and `✗` at the start of an item mark it good or bad. `[text]` on its own line is the button.
- Unknown kinds, too many items or too long text fail `unfaced post` with a message saying which slide and what limit, before anything renders.

Slide kinds every post-capable style must draw:

| Kind | What it shows | Limits (builder may tune) |
|---|---|---|
| `cover` | headline, optional subtitle, optional visual (chips, a custom slide, a photo) | headline ≤ 12 words |
| `point` | headline and body: one idea per slide | body ≤ 45 words |
| `list` | headline and up to 5 numbered or ticked items | items ≤ 8 words |
| `steps` | headline and 2–6 steps as a flow | step ≤ 3 words + second line |
| `compare` | ✗ vs ✓ or before vs after, in two groups | ≤ 4 per side |
| `stat` | a big number or short figure with one line under it | figure ≤ 8 characters |
| `quote` | a testimonial or quote with its author | ≤ 35 words |
| `image` | a photo from `inbox/` with headline or caption | |
| `cta` | the closing invite, one button, a small line under it | |
| `custom` | the post's own code from `custom/` | |

Every slide also gets the style's **frame**: the label and the counter (`n/N`) at the top, the handle (and logo when there is one) and "swipe →" at the bottom, except on the last slide and on single posts. The frame's words are in the page's language.

### 5.5 Post types (new catalog)

`catalog/posts/NN-slug.md`, like the script types: what the post is for, its slide sequence, good covers, writing rules, a full example. At launch:

1. **Tips and mistakes**: "5 mistakes that…", one slide per point, a stat or a fact where it helps.
2. **How it works**: a process or a concept in steps.
3. **About us**: who, what, why, the proof, how to start.
4. **Services and prices**: what is offered, for whom, from what price, how to ask.
5. **Before and after / case study**: the problem, what was done, the result in numbers, a quote.
6. **Announcement or offer**: what is new, why it matters, the condition or deadline, the call to action.

`unfaced list post-type` and `unfaced show post-type <n>` work like the other catalogs.

### 5.6 Styles

Four new styles, numbered after the existing twelve. Each has `STYLE.md` (Look, Colour, Type, Layout, Motion, Pitfalls, and a new **Slides** section), `style.json`, components, shipped fonts. Names are working names.

| # | Style | Look | Good for |
|---|---|---|---|
| 13 | Night tech | near-black navy with a soft blue glow and a faint dot grid; serif display with the accent word in italic blue; monospace labels; outlined chips, pill buttons, simple UI mock-ups (phone, notification, card) | software, services, agencies |
| 14 | Swiss editorial | warm off-white paper, huge tight black grotesque, one strong red, strict grid with rules, giant numerals | advice, data, consultants |
| 15 | Blueprint | blueprint-blue paper with a fine white grid, thin white line drawings, dimension lines, monospace notes | processes, "how it works", technical trades |
| 16 | Risograph | warm grainy paper, two overprinting inks (pink and teal) with slight misregistration, heavy display type | shops, food, events, announcements |

Fonts (free, shipped): the builder picks OFL families that match, e.g. Instrument Serif + Inter + JetBrains Mono (13), Inter Tight or a similar grotesque (14), Space Grotesk + JetBrains Mono (15), Archivo Black + a text face (16).

**Colour (builder's call, marked as such).** A style keeps its ground and texture: night navy with glow, Swiss paper, blueprint blue with grid, riso paper with grain. The brand's colours drive the roles that carry identity (accent, highlight, secondary). The page palette's background colour replaces the style's ground only when it is in the same lightness family (dark for 13 and 15, light for 14 and 16); otherwise the style's ground stays and `unfaced page` says so. So page-setup asks a client for one to three brand colours, not a full five-colour palette; the existing `palette` field keeps its five roles by position. Contrast of text on every ground is checked.

The catalog gets per-medium status: `status` stays for videos, a new `posts` field says `ready` or `planned`. Styles 1–12 are `posts: planned`; 13–16 are `posts: ready` and, until their video scenes exist, `status: planned` for video. `unfaced list style` shows both. A page whose style can't draw posts gets a clear message naming the styles that can.

Each style also provides a small set of **drawn visuals** the slides can use without custom code, at least: chips, a step flow, a phone mock-up with a short text on screen, a notification card, a simple icon set for ✓ ✗ → and numbers. Style 13 must be able to rebuild the reference carousel's eight slides with these (that is its acceptance test; see §8).

### 5.7 Commands

- `unfaced post <postDir> [--format <name>]`: parse, lay out, check, render the slides of each format, write the PDF for `linkedin-carousel` and `grid.png`, write `check.json`. Exits 1 when a check fails, like `make`.
- `unfaced check <postDir>`: re-runs the checks (the command detects a post folder by `slides.md`).
- `unfaced generate <postDir>`: as for videos; images are asked at the format's aspect.
- `unfaced inbox <postDir>`: as for videos.
- `unfaced docs slides` and `unfaced docs brand`: the formats.
- `unfaced demo <style> --post`: the same sample post in a style (for the gallery and the README).

### 5.8 Skills and agents

- **New skill `post-make`**: idea → read the page → pick post type, format and style (say why) → write `slides.md` in the page's tone, or lay out the user's own text unchanged except for fitting it to the kinds → **stop for the user's approval of the text** → custom slides and images if needed → `unfaced post` → independent review → fix and re-render (up to three rounds) → `post.md` (caption, hashtags and alt text per platform: Instagram, LinkedIn, Facebook) → summary with the files.
- **New agent `post-reviewer`** (and its copy in `post-make/references/`, under the same copy test): looks at every slide PNG and `grid.png` against `slides.md`, the style and the brand, and at `check.json`; writes `review.md` with PASS or FAIL and concrete fixes. It checks what the automatic checks can't: hierarchy, contrast, whether the cover makes you swipe, consistency across slides, typos, the accent word on the right word.
- **page-setup**: asks for and saves the brand (handle, site, logo, fonts, tone, words) and the default formats; points new pages for brands to styles 13–16. Two ways in, both in plain conversation, never a form:
  - **New page, described.** The user says what the page is and how it should feel, in their own words. The skill asks one question at a time only about what is still open, proposes the rest with reasons, and writes the profile.
  - **Existing page, shown.** The user shares screenshots or files of their profile, posts, reels and stories (unfaced never opens or reads the social network itself). The skill reads them and drafts the profile from what it sees: palette (sampled colours), closest catalog style per medium, fonts (named as the closest free families, then asks for the real files), logo, handle, tone and recurring formats from the captions and text on the posts. It then plays the draft back and asks about what it can't settle: posts and reels that look unlike each other ("your carousels are dark and editorial, your reels are bright cartoons: keep both, or bring the reels closer to the carousels?"), colours that vary from post to post, a look no style matches well. Nothing is saved until the user agrees to the draft.
- **video-ideas**: the calendar mixes posts and videos, and each idea says `reel` or `carousel` (or `story`) and why; `ideas.md` gets a Format column.
- **video-package**: unchanged for videos; its `post.md` format is reused for posts (documented once in `docs/formats/post.md`).
- `AGENTS.md` routing table, `README.md` (with a carousel grid image) and translations, `CONTRIBUTING.md` (add a slide kind, a post type, a post-capable style), evals for `post-make` and `post-reviewer`.

## 6. How it works inside (decided parts)

- A **post plan** (like `VideoPlan`): format, size, the list of slides with their kind, text and attributes, the resolved palette and brand. Built from `slides.md` and `page.yaml`, validated, written as `post-plan.json`.
- `StyleKit` gains optional `slideLayout(slide, format, palette, brand)` (pure, returns `TextBox[]`) and `SlideView`. A style draws posts when it has both. Checks call `slideLayout` without rendering, as they do for scenes.
- Rendering uses the existing still path (`renderStill`) on a new still composition sized by the format; one browser session for all slides of a post.
- **Text fit**: brand fonts change the metrics, so fitting can't rely only on numbers measured from the style's shipped fonts. The checks must also measure the rendered text in the browser and fail on any overflow or clipping. How (DOM measurement during render, metrics read from the font file, or both) is left to the builder.
- Brand fonts load from the page folder at render time; a missing or unreadable font file fails with the path, before rendering.
- PDF: from the PNGs with a free library (e.g. `pdf-lib`, MIT), one page per slide at the slide's size.
- Custom slides: `custom/index.tsx` exports components by id, `custom/boxes.json` declares their text boxes, exactly like `scenes/` for videos, with the same kit (`@unfaced/kit`), plus the style's drawn visuals.

## 7. Order of work

1. **Posts engine + style 13 (Night tech)**, all formats, all slide kinds, brand, post types, `post-make`, `post-reviewer`, `page-setup` and `video-ideas` changes, docs. Early in this step, a checkpoint: render the cover and one inner slide of style 13 and get the owner's OK on the look before the other kinds and visuals are built. Done when §8 passes.
   Until step 3, a page on styles 13–16 makes its reels with another style through `style: { posts: 13, videos: <n> }`; page-setup sets this up and says why, and video-ideas only proposes reels for a page that has a video style that is ready (builder's call).
2. **Styles 14, 15, 16** for posts.
3. **Video scenes for styles 13–16** (title, fact, list, outro, motion), so a page's reels match its carousels.
4. Later, separate designs: better motion, transitions and synced sound effects for all videos; more styles inspired by lemo-opuscar's range; posts for styles 1–12, starting with the three that read best as stills (12 kinetic typography, 8 vintage comic, 7 paper cut-out; builder's call, the owner left it open). Until then a post request on a page with an old style gets a clear answer: that style makes videos only for now, and one of 13–16 is offered for the post.
5. Later, a separate design: **a page's own style**, made from the screenshots of an existing page whose look no catalog style matches (the owner wants it, after the four styles). Until then page-setup uses the closest style with the brand's colours, fonts and logo, and says what it can't match.

unfaced keeps running inside Claude Code (the desktop app's Code tab or the terminal), as today: it installs local tools for voice and rendering, so a plain chat can't run it. The owner confirmed this.

Each step ships on its own branch and PR.

## 8. Acceptance

- The reference carousel, rewritten in English for an invented brand, rebuilt in style 13 as `examples/pages/studio-nord/posts/about-us/`, looks at least as good as the reference (owner's judgement on `grid.png`).
- Each format renders at its exact size; the LinkedIn PDF opens with one page per slide.
- A page with a dark palette, a light palette, a two-colour palette and brand fonts with very different widths (a condensed and a wide face) renders every slide kind with no overflow, and the checks catch a deliberately too-long headline.
- `post-make` evals: makes a carousel from a one-line topic and stops for approval; lays out user-written text without rewriting it; asks for the brand when the page has none; refuses an unknown format by suggesting the named ones.
- Tests, typecheck and the copy tests pass on Windows.

## 9. Left to the builder

- Exact component structure, file names inside styles, and how the engine is split.
- Text-fit mechanism (§6), exact word limits per kind, and how to show limits in error messages.
- The fonts for styles 13–16, within §5.6.
- The shapes of the drawn visuals and icons.
- Whether `grid.png` is one row or wraps for long carousels.
- Test fixtures and which tests are slow.
