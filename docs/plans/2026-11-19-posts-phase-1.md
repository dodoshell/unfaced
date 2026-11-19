# unfaced Posts, Phase 1 (engine + Night tech) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A page can make still posts (Instagram carousel, single post, LinkedIn PDF carousel, story) from a `slides.md`, in style 13 Night tech, with the page's brand, checked and reviewed, through a new `post-make` skill.

**Architecture:** `slides.md` + `page.yaml` → a pure `PostPlan` built in Node: the style's pure `slideLayout` places text boxes, and real font metrics (opentype.js) break every text into lines and pick its size, so overflow is found before rendering and checks run without a browser. Remotion renders each slide as a still from the plan (lines precomputed, no browser wrapping), plus a grid composition; the PDF is assembled from the PNGs with pdf-lib. Styles opt in to posts with an optional `slides` part of `StyleKit`; style 13 is the first and is posts-only until phase 3.

**Tech Stack:** TypeScript, Remotion 4.0.543 (stills), React 19, opentype.js 1.3.4 (MIT, font metrics), pdf-lib 1.17.1 (MIT, PDF), ajv, yaml, vitest.

**Spec:** `docs/design/2026-11-19-posts-design.md` (all of it; this plan is its step 1 in §7).

## Global Constraints

- Everything user-facing is in English; `README.md` and `docs/guide/getting-started.md` changes go to `docs/i18n/{it,es,fr,pt-BR}/` too. Post content and the frame's words are in the page's language.
- No feature may need a paid key; a paid provider without its key falls back to the free one and says so.
- Code works on Windows, macOS and Linux: `node:path`, no hard-coded separators.
- Formats, exactly: `instagram-carousel` 1080×1350, 2–10 slides; `instagram-post` 1080×1350 (`square: true` → 1080×1080), 1 slide; `linkedin-carousel` 1080×1350, 2–12 slides, PDF + PNGs; `story` 1080×1920, 1–10 slides.
- Safe areas: 4:5 and square: 60 px all round; the cover's headline inside the central 3:4 area (x 0–1080, y 169–1181 on 1080×1350); story: nothing readable in the top 250 px or bottom 340 px, 60 px left and right.
- Shipped fonts are OFL (or similar) and listed in `LICENSES/README.md`. Brand fonts are never shipped or copied into the repo.
- No real brand in the repository; the example brand is "Studio Nord" (`@studionord`, `studionord.example`). The owner's reference screenshot is never committed.
- No text copied from lemo-opuscar (CC BY-NC 4.0); its MIT code may be reused only with its notice recorded in `LICENSES/`.
- `plugin/launcher/unfaced.mjs` is copied into every skill's `scripts/`, reviewer agents into their skill's `references/`; tests check both copies.
- Exact dependency versions; Remotion stays at 4.0.543.
- Commit as dodoshell, with no AI attribution lines (owner's rule in the parent CLAUDE.md).

## Review Focus

1. A brand font that is missing, unreadable or a `.woff2` (opentype.js can't read WOFF2): `unfaced page` and `unfaced post` stop before rendering with the path and "use .ttf, .otf or .woff". Test in Task 3.
2. Text with a character the font lacks (an emoji, ✓ drawn as text, a Greek letter in a Latin-only font): fitting fails naming the character and the slide, instead of a tofu box. Test in Task 4.
3. One very long word (a URL, a German compound) wider than its box at the smallest size: an error for that slide, never text past the box. Test in Task 4.
4. `slides.md` saved on Windows (CRLF, UTF-8 BOM) or with Italian apostrophes and accents: parses the same as LF. Test in Task 1.
5. A light page palette on Night tech (a dark style): the style's ground stays, `unfaced page` warns, and text contrast still passes. Test in Task 9.

---

### Task 1: Formats and the slides.md parser

**Files:**
- Create: `engine/src/post/formats.ts`, `engine/src/post/parseSlides.ts`, `engine/src/post/types.ts`
- Test: `tests/post/formats.test.ts`, `tests/post/parseSlides.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  - `type FormatName = "instagram-carousel" | "instagram-post" | "linkedin-carousel" | "story"`
  - `interface PostFormat { name: FormatName; width: number; height: number; minSlides: number; maxSlides: number; pdf: boolean; safe: { top: number; right: number; bottom: number; left: number }; coverArea?: Rect }`
  - `type SlideKind = "cover" | "point" | "list" | "steps" | "compare" | "stat" | "quote" | "image" | "cta" | "custom"`
  - `interface Headline { text: string; accent?: { start: number; end: number } }` (indices into `text`, markers removed)
  - `interface Item { text: string; second?: string; mark?: "good" | "bad" }`
  - `interface Slide { index: number; kind: SlideKind; attrs: Record<string, string>; headline?: Headline; body: string[]; items: Item[]; button?: string; line: number }` (`line`: 1-based line of its `##` in the file, for errors)
  - `interface SlidesFile { title: string; postType: number; formats?: FormatName[]; label?: string; style?: number; square?: boolean; slides: Slide[] }`
- Produces (`formats.ts`): `FORMATS: Record<FormatName, PostFormat>`, `formatFor(name: string, square?: boolean): PostFormat` (throws listing the four names), `FORMAT_ALIASES` mapping plain words the skill may meet ("carousel", "linkedin", "post", "single", "story", "stories") to names, used only by docs and the skill.
- Produces (`parseSlides.ts`): `parseSlides(markdown: string): SlidesFile`, `class SlidesError extends Error { line: number }`.

- [ ] **Step 1: Write the failing tests**
  - `formats.test.ts`: sizes and slide limits exactly as in Global Constraints; `formatFor("instagram-post", true)` is 1080×1080; `formatFor("reel")` throws a message containing all four names; `instagram-carousel.coverArea` is `{ x: 0, y: 169, w: 1080, h: 1012 }`; `story.safe` is `{ top: 250, right: 60, bottom: 340, left: 60 }`.
  - `parseSlides.test.ts`: the spec's §5.4 example parses to 4 slides with kinds `cover, compare, steps, cta`; the cover headline is `"This page is made by our software"` with accent covering `"our software"`; compare items carry `mark: "bad"` ×2 and `"good"` ×2 with the ✓/✗ removed; steps items `{ text: "Topic", second: "us" }`; the cta `button` is `"Join the waiting list: link in bio"`; `## image {photo: inbox/shop.jpg}` gives `attrs.photo`; the same file with CRLF and a BOM gives an equal result; an Italian headline `L'*app* è pronta` keeps the apostrophe and accent; two accent spans, an unknown kind (`## banner`), a missing `title` or `post_type`, an unknown format name each throw `SlidesError` whose message names the line and the problem.

- [ ] **Step 2: Run** `npx vitest run tests/post` → FAIL (modules missing).
- [ ] **Step 3: Implement** the three files. Front matter with `yaml`; body split on lines starting `## `; inside a slide, the first `# ` line is the headline, `- ` lines are items (`a | b` splits on the first ` | `), a line that is exactly `[text]` is the button, other non-empty lines are body paragraphs.
- [ ] **Step 4: Run** `npx vitest run tests/post` → PASS; `npm run typecheck` → clean.
- [ ] **Step 5: Commit** `git commit -m "Parse slides.md and define the post formats"`

### Task 2: The post-type catalog

**Files:**
- Create: `catalog/posts/_template.md`, `catalog/posts/01-tips-and-mistakes.md`, `02-how-it-works.md`, `03-about-us.md`, `04-services-and-prices.md`, `05-before-and-after.md`, `06-announcement.md`
- Modify: `catalog/catalog.json` (new list `"post-type"`, all `ready`), `engine/src/page/types.ts` (`CATALOG_KINDS` gains `"post-type"`), `engine/src/cli/list.ts`, `engine/src/cli/show.ts` (no logic change expected beyond the kind), `engine/src/cli.ts` (usage line for list/show names `post-type`)
- Test: `tests/catalog/catalog.test.ts` (launch names), `tests/cli/show.test.ts`

**Interfaces:**
- Produces: catalog kind `"post-type"`; `unfaced list post-type`, `unfaced show post-type <n>`.

- [ ] **Step 1: Write the failing tests:** `catalog.list("post-type")` names are `["Tips and mistakes", "How it works", "About us", "Services and prices", "Before and after", "Announcement"]`; `showText(catalog, "post-type", 3)` contains the sections `## What it's for`, `## Slides`, `## Cover`, `## Writing rules`, `## Example`, and its example is a valid `slides.md` (`parseSlides` doesn't throw on the fenced block).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Write** the template and six entries (sections above; `## Slides` gives the kind sequence, e.g. About us: `cover → point → list|steps → compare → stat|quote → cta`; each example 5–8 slides, English, invented brands only).
- [ ] **Step 4: Run** `npx vitest run tests/catalog tests/cli/show.test.ts` → PASS.
- [ ] **Step 5: Commit** `git commit -m "Add the post-type catalog"`

### Task 3: Brand, post choices and two-look styles in page.yaml

**Files:**
- Modify: `schema/page.schema.json`, `engine/src/page/loadPage.ts`, `engine/src/page/types.ts`, `engine/src/cli/page.ts`, `engine/src/catalog/catalog.ts` (`CatalogEntry.posts?: "ready" | "planned"`), `engine/src/cli/make.ts` (uses the video style)
- Create: `engine/src/page/brand.ts`, `docs/formats/brand.md`; Modify `docs/formats/page.md`, `engine/src/cli/docs.ts` (`FORMATS` gains `"brand"` and `"slides"`; `slides.md` doc is written in Task 6)
- Test: `tests/page/loadPage.test.ts`, `tests/page/brand.test.ts`, `tests/cli/make.test.ts`

**Interfaces:**
- Produces (`types.ts`): `interface Brand { handle?: string; site?: string; logo?: string; fonts?: Partial<Record<"display" | "accent" | "text" | "mono", string>>; tone?: string; words?: { use?: string[]; avoid?: string[] } }` (paths relative to the page); `Page` gains `postStyle?: Choice`, `postType?: Choice`, `formats?: FormatName[]`, `brand?: Brand`; `Page.choices.style` is the **video** style.
- Produces (`brand.ts`): `checkBrandFiles(page: Page): string[]` (absolute paths of brand files that exist; throws `PageError("brand.fonts.<role>" | "brand.logo", …)` for a missing file, a font not `.ttf/.otf/.woff`, a logo not `.svg/.png`).
- Schema: `style` is `choice` **or** `{ posts?: choice, videos?: choice }` (at least one key); `post_type: choice`; `formats: array of the four names, unique, minItems 1`; `brand: object` (fields above, `additionalProperties: false`); `font` still accepted.

- [ ] **Step 1: Write the failing tests:**
  - `style: 13` → `choices.style === 13 && postStyle === 13`; `style: { posts: 13, videos: 3 }` → `choices.style === 3`, `postStyle === 13`; `style: { posts: 13 }` → no video style.
  - `post_type: [1, 3]`, `formats: [instagram-carousel, story]`, a full `brand` block load; `brand.colour` is rejected with the "Did you mean" hint machinery or the schema message naming `brand`.
  - `font: Inter` loads and `pageSummary` prints a warning line containing `"font" is ignored; use brand.fonts`.
  - `checkBrandFiles`: missing `brand/fonts/X.ttf` throws naming the path; `X.woff2` throws containing `use .ttf, .otf or .woff`; `logo.jpg` throws containing `.svg or .png`.
  - `make` on a page with `style: { posts: 13 }` fails before recording with `this page has no video style; set style.videos`.
  - `pageSummary` prints `Posts: style 13 Night tech · post types 1, 3 · formats instagram-carousel, story` and a `Brand:` line with handle, site, logo, fonts and tone.
  - `listLines(catalog, "style")` ends each line with what the style makes: `(videos)`, `(posts)`, `(videos, posts)`, or `(planned)` when neither is ready; other kinds unchanged.
- [ ] **Step 2: Run** `npx vitest run tests/page tests/cli/make.test.ts` → FAIL.
- [ ] **Step 3: Implement.** `loadPage` maps `post_type` → `postType`, splits `style`; validates catalog numbers for `postStyle` against kind `style` and `postType` against `post-type`; `KEY_LIKE` check still covers `brand`. `pageSummary` warns when the post style's catalog entry isn't `posts: "ready"`, naming the styles that are. Write `docs/formats/brand.md` (the `brand` block, fonts per role, logo, tone and words, how colours work: `palette` roles, style keeps its ground) and update `page.md` (the new fields, the `style` object form, `font` deprecated).
- [ ] **Step 4: Run** → PASS; `npm test` → PASS.
- [ ] **Step 5: Commit** `git commit -m "Add the brand, post types, formats and a separate post style to page.yaml"`

### Task 4: Text metrics and fitting

**Files:**
- Create: `engine/src/post/fonts.ts`, `engine/src/post/fitText.ts`
- Modify: `package.json` (dependency `opentype.js` 1.3.4, devDependency `@types/opentype.js` matching), `LICENSES/README.md` only if test fonts are added
- Create test fixtures: `tests/fixtures/fonts/` with two OFL faces of very different width (Oswald, condensed; Archivo with `wdth` 125 as a static instance, or another wide OFL face) and their OFL texts
- Test: `tests/post/fitText.test.ts`

**Interfaces:**
- Produces (`fonts.ts`): `interface FontFile { family: string; file: string }` (absolute path); `loadMetrics(file: string): Metrics` (cached; throws for unreadable files and `.woff2` with `use .ttf, .otf or .woff`); `interface Metrics { unitsPerEm: number; ascender: number; descender: number; advance(text: string): number /* in em */; missing(text: string): string[] /* characters with no glyph */ }`.
- Produces (`fitText.ts`):
  - `interface TextSpec { text: string; font: string /* file */; accentFont?: string; accent?: { start: number; end: number }; box: Rect; maxSize: number; minSize: number; lineHeight: number; maxLines?: number; tracking?: number /* em */; upper?: boolean }`
  - `interface FittedText { size: number; lines: { text: string; width: number; accent?: { start: number; end: number } }[]; height: number }`
  - `fitText(spec: TextSpec): FittedText` — largest size in 2 px steps from `maxSize` to `minSize` at which the greedy word wrap fits `box.w` per line, `maxLines`, and `lines × size × lineHeight ≤ box.h`; accent characters measured with `accentFont`.
  - `class FitError extends Error { kind: "overflow" | "glyph"; detail: string }` — `overflow` when nothing fits at `minSize` (message gives the box size, the text's first 40 characters and "shorten it or split the slide"); `glyph` naming each missing character.

- [ ] **Step 1: Write the failing tests:** a 3-word headline at max 120 in an 880×400 box returns size 120, 1 line; the same 20-word headline shrinks and wraps within the box (`height ≤ 400`, every `width ≤ 880`); Oswald fits more characters per line than the wide face at the same size; a 60-character unbroken word in an 880 box with `minSize: 40` throws `FitError` kind `overflow`; `"Fatto ✓ 🚀"` in a Latin-only face throws kind `glyph` naming `✓` and `🚀`; `accent` indices survive wrapping (the accent's line and offsets point at the same words); `.woff2` path throws the message from Review Focus 1.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -m "Fit slide text with real font metrics"`

### Task 5: The slide contract and the post plan

**Files:**
- Modify: `engine/remotion/styles/registry.ts` (add `SlideKit`, `StyleKit.slides?`)
- Modify: `engine/src/check/types.ts` (the four new `CheckName`s)
- Create: `engine/remotion/styles/slideLayouts.ts` (pure registry like `layouts.ts`: `getSlideLayout(style)`, `stylesWithSlides()`), `engine/src/post/buildPostPlan.ts`, `engine/src/post/frameWords.ts`, `engine/src/check/post.ts`
- Create test fixture style: `tests/fixtures/remotion/placeholderSlides.ts` (a pure layout for every kind using the fixture fonts)
- Test: `tests/post/buildPostPlan.test.ts`, `tests/check/post.test.ts`, `tests/post/frameWords.test.ts`

**Interfaces:**
- Consumes: Task 1 types, Task 3 `Page`/`Brand`, Task 4 `fitText`.
- Produces (`registry.ts`):
  - `type FontRole = "display" | "accent" | "text" | "mono"`
  - `interface SlideBox extends TextBox { role: FontRole; text: string; accent?: { start: number; end: number }; maxSize: number; minSize: number; lineHeight: number; maxLines?: number; tracking?: number; upper?: boolean; color: string; on: string /* colour under it */; readable: "body" | "large" /* 4.5:1 or 3:1 */ }`
  - `interface SlideContext { slide: Slide; total: number; format: PostFormat; palette: string[]; brand: Brand; label?: string; words: FrameWords }`
  - `interface SlideKit { fonts: Record<FontRole, string> /* files relative to the style folder */; layout(ctx: SlideContext): SlideBox[]; SlideView: React.FC<{ ctx: SlideContext; fitted: Record<string, FittedText> }> }`
- Produces (`frameWords.ts`): `interface FrameWords { swipe: string; of: string }`; `frameWords(language: string): { words: FrameWords; fallback: boolean }` for `en, it, es, fr, pt, pt-BR, hi`, English otherwise with `fallback: true`.
- Produces (`buildPostPlan.ts`):
  - `interface PostPlan { style: number; format: PostFormat; language: string; palette: string[]; brand: Brand; label?: string; fonts: Record<FontRole, string> /* absolute: brand file or style file */; slides: { slide: Slide; boxes: SlideBox[]; fitted: Record<string, FittedText> }[] }`
  - `buildPostPlans(postDir: string, page: Page, catalog: Catalog, opts?: { format?: FormatName }): { plans: PostPlan[]; warnings: string[] }` — one plan per format (front matter `format`, else the page's `formats`, else `instagram-carousel`); style from front matter, else the page's `postStyle` (a list/auto picks the first with `posts: "ready"`); throws when the slide count is outside the format's limits, when the style has no slides (`style 3 (Flat cartoon) makes videos only for now; styles that make posts: 13 Night tech`), and re-throws `FitError` as `slides.md line N (slide K, <kind>): …`. Custom slides take boxes from `custom/boxes.json` (Task 7).
- Produces (`check/post.ts`): `checkPost(plan: PostPlan): CheckIssue[]` with new `CheckName`s `"post-safe-area" | "post-overlap" | "contrast" | "cover-crop"`: every box inside `format.safe`; no two boxes of a slide overlap; `contrast(color, on) ≥ 4.5` (body) or `≥ 3` (large); on slide 1 of a 4:5 format the headline box inside `coverArea`. `atMs` is replaced by the slide number in the message (`atMs: 0`).

- [ ] **Step 1: Write the failing tests** with the placeholder style registered: the spec example builds one `instagram-carousel` plan with 4 slides, each box fitted; a front matter `format: [instagram-carousel, story]` gives two plans with different heights; 11 slides for `instagram-carousel` throws `instagram-carousel takes 2–10 slides; slides.md has 11`; a too-long headline throws with `slides.md line` and `slide 2`; brand `fonts.display` replaces the style's display font file in `plan.fonts`; `checkPost` flags a box at y 1300 on a 4:5 slide, two overlapping boxes, `#777777` text on `#888888`, and a cover headline at y 100; `frameWords("it").words.swipe === "scorri"`, `frameWords("de").fallback === true`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -m "Build post plans and check them without rendering"`

### Task 6: Rendering posts and `unfaced post`

**Files:**
- Create: `engine/remotion/post/PostSlide.tsx` (composition `post-slide`, props `{ plan: PostPlan; index: number }`, size from `calculateMetadata`), `engine/remotion/post/PostGrid.tsx` (composition `post-grid`: every slide at 0.3 scale, 5 per row, 24 px gaps, ground `#111111`), `engine/remotion/post/brandFonts.ts` (loads the plan's brand fonts with `loadFont` from `staticFile`), `engine/src/render/renderPost.ts`, `engine/src/post/pdf.ts`, `engine/src/cli/post.ts`, `docs/formats/slides.md`
- Modify: `engine/remotion/Root.tsx`, `engine/remotion/compositionId.ts`, `engine/remotion/kit/index.ts` (export `SlideKit`, `SlideBox`, `SlideContext`, `FittedText`, a `<FittedLines fitted color font accentColor accentFont />` component that draws precomputed lines with `white-space: pre`), `engine/src/cli.ts` (`post <postDir> [--format <name>]`; `check` detects `slides.md`), `engine/src/cli/check.ts`, `package.json` (`pdf-lib` 1.17.1)
- Test: `tests/post/pdf.test.ts`, `tests/cli/post.test.ts` (deps injected, no render), `tests/render/post.slow.test.ts`

**Interfaces:**
- Consumes: Task 5 `buildPostPlans`, `checkPost`, `SlideKit`.
- Produces: `renderPost(plan: PostPlan, outDir: string, pageDir: string): Promise<string[]>` (PNG paths `slide-01.png…`, plus `grid.png`; for more than one format, files go in `<postDir>/<format>/`); `writePdf(pngs: string[], out: string): Promise<void>`; `makePost(postDir: string, deps: PostDeps): Promise<{ pass: boolean; files: string[] }>` writing `post-plan.json` (one entry per format), `check.json` (same `CheckReport` shape), PNGs, `post.pdf` for `linkedin-carousel`, `grid.png`; exits 1 when a check fails, and still renders so the user can see why.
- The page folder is the render's `assetsDir`; staged files are the brand fonts, the logo and `posts/<post>/inbox/*` images, read with `staticFile()`.

- [ ] **Step 1: Write the failing tests:** `writePdf` of three 1080×1350 PNGs gives a PDF with 3 pages of 1080×1350 pt (read back with pdf-lib); `makePost` with fake render deps writes `post-plan.json` and `check.json`, returns `pass: false` and still calls render when a check fails, writes `post.pdf` only for `linkedin-carousel`, and puts files in per-format folders when two formats are made; `unfaced check <postDir>` re-runs `checkPost` from `post-plan.json`. Slow test: the placeholder style renders slide 1 of a carousel to exactly 1080×1350, a story to 1080×1920, a square post to 1080×1080, and `grid.png` is not one flat colour.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement**, and write `docs/formats/slides.md` (the file, the kinds with their limits, the formats table and safe areas, the frame, outputs; `unfaced docs slides`). **Step 4: Run** `npm test` and `UNFACED_SLOW=1 npx vitest run tests/render/post.slow.test.ts` → PASS.
- [ ] **Step 5: Commit** `git commit -m "Render posts: slides, grid and LinkedIn PDF"`

### Task 7: Custom slides

**Files:**
- Create: `engine/src/render/ownSlides.ts`, `engine/remotion/core/postSlides.ts` (`defineSlides`, `setPostSlides`, like `videoScenes.ts`)
- Modify: `engine/src/render/renderPost.ts` (bundles `custom/index.tsx` like `scenesEntry`), `engine/src/post/buildPostPlan.ts`, `engine/remotion/kit/index.ts` (export `defineSlides`, `type SlideComponent`), `docs/formats/slides.md` (Custom slides section)
- Test: `tests/post/ownSlides.test.ts`, extend `tests/render/post.slow.test.ts`

**Interfaces:**
- Produces: `custom/index.tsx` default-exports `defineSlides({ phone: PhoneSlide })`; `SlideComponent = React.FC<{ ctx: SlideContext }>`; `custom/boxes.json` is `{ "<id>": { "<format name>": [{ id, x, y, w, h }] } }`; `readOwnSlideBoxes(file): Record<string, Partial<Record<FormatName, TextBox[]>>>`; a `## custom {id: phone}` slide uses those boxes (checked for safe area and overlap, not fitted) and the component draws itself, with the style's frame around it.
- Errors: a `custom` slide without `id`, an id missing from `index.tsx` or from `boxes.json` for the format being made, each fail before rendering with the file and id.

- [ ] **Step 1: Failing tests** for the three errors and for boxes being checked; slow test renders a custom slide that draws a red square and finds red pixels.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `git commit -m "Let a post bring its own slide code"`

### Task 8: Style 13 Night tech — look checkpoint (cover and point)

**Files:**
- Create: `catalog/styles/13-night-tech/style.json` (`id 13`, slug `night-tech`, name `Night tech`, default palette `#0B1020 #2F6BFF #5B8CFF #2F9E6A #E8ECF7` for background, accent, secondary, highlight, ink; `fonts`), `fonts/` (Instrument Serif regular + italic, Inter, JetBrains Mono, with OFL texts), `components/slides/{index.tsx,layout.ts,Ground.tsx,Frame.tsx,Cover.tsx,Point.tsx,tokens.ts}`, `STYLE.md` (all standard sections; Motion says "posts only for now, video scenes come in a later phase"; new `## Slides` section)
- Modify: `catalog/catalog.json` (style 13: `status: "planned"`, `posts: "ready"` only after Task 9; here `posts: "planned"`), `engine/remotion/styles/installed.ts` / `slideLayouts.ts` (register slides only), `LICENSES/README.md`, `engine/src/cli/demo.ts` (`demo <style> --post` renders `examples/posts/<NN-slug>/` from a built-in sample `slides.md` per style kind available)
- Test: `tests/styles/night-tech.test.ts`

**Interfaces:**
- Consumes: `SlideKit`, `FittedLines`, `frameWords`.
- Look, from the reference (design §1): ground `#0B1020` with a radial blue glow (accent at ~35% opacity, lower right) and a dot grid (1 px dots every 24 px at ~6% ink); headline in the display serif, accent span in the italic serif and the secondary colour; mono labels 22 px, letter-spaced 0.08 em, uppercase, in `mix(ink, background, 0.45)`; frame: label top left, `n/N` top right, `● handle` bottom left (dot in accent), `swipe →` bottom right in the secondary colour (not on the last slide or single posts); logo, when the brand has one, replaces the dot at 28 px high.

- [ ] **Step 1: Failing test:** the slide layout for `cover` and `point` in all four formats returns boxes inside the safe area, cover headline inside `coverArea`, and contrast passing on the default palette.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** cover and point; render `unfaced demo 13 --post` (cover + one point slide, carousel and story).
- [ ] **Step 4: Owner checkpoint (stop).** Put the two PNGs side by side with the reference screenshot (path from the owner, outside the repo) and ask the owner to approve the look or say what to change. Do not start Task 9 until they approve; apply their changes here.
- [ ] **Step 5: Commit** `git commit -m "Start style 13 Night tech: ground, frame, cover and point slides"`

### Task 9: Style 13 — every kind, drawn visuals, palettes and fonts

**Files:**
- Create: `catalog/styles/13-night-tech/components/slides/{List,Steps,Compare,Stat,Quote,Image,Cta}.tsx`, `components/visuals/{Chip,Flow,Phone,Notification,Icon}.tsx`
- Modify: `components/slides/layout.ts`, `index.tsx`, `STYLE.md` (Slides section complete, Pitfalls), `catalog/catalog.json` (style 13 `posts: "ready"`), `engine/remotion/kit/index.ts` (no style code in the kit; visuals stay in the style and are exported from its `index.tsx` for custom slides as `nightTech.visuals`)
- Create: `tests/styles/slides-contract.test.ts` (runs for every style in `stylesWithSlides()`)

**Interfaces:**
- Produces: a cover may show visuals without custom code through attributes: `## cover {visual: chips}` (the body's ✓/✗ items as chips around a phone), `{visual: phone, screen: "..."}`, `{visual: notification, title: "...", text: "..."}`; `steps` draws `Flow` (pills: filled accent for software steps, outlined for the rest when items carry a `second` line, as in the reference).
- Colour rule (design §5.6): page palette roles 1–3 replace accent, secondary, highlight; role 0 replaces the ground only when `luminance(palette[0]) < 0.2`; otherwise the default ground stays and `buildPostPlans` adds the warning `Night tech keeps its dark ground; palette background #XXXXXX ignored`.

- [ ] **Step 1: Write the failing contract test**, for every slide style × every format × palettes `{ default, "two colours": ["#FFFFFF", "#FF0055"], dark, light: ["#F7F5F0", "#1F4FFF", "#E2554F", "#2F9E6A", "#111111"] }` × fonts `{ style's, condensed fixture, wide fixture }`: every kind with the longest allowed text (spec §5.4 limits) fits; boxes inside the safe area; no overlaps; contrast passes; the light palette on style 13 produces the warning (Review Focus 5); a headline one word over the limit fails with the slide named.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** the kinds and visuals. **Step 4: Run** `npm test` → PASS; render `unfaced demo 13 --post` with every kind and look at each PNG; fix what you see.
- [ ] **Step 5: Commit** `git commit -m "Finish style 13 Night tech for posts"`

### Task 10: Photos for posts (inbox and generate)

**Files:**
- Modify: `engine/src/generate/fit.ts` (size parameter), `engine/src/generate/generate.ts` (`fit(src, dest, size)`; aspect `"4:5"`, `"1:1"` or `"9:16"` from the post's first format; Pexels crop `w/h` from the size), `engine/src/inbox/inbox.ts` (a post folder accepts `For slide N` in prompts and only images), `engine/src/cli/generate.ts`, `engine/src/cli/inbox.ts`, `docs/formats/slides.md` (Photos section)
- Test: `tests/generate/generate.test.ts` additions, `tests/inbox/inbox.test.ts` additions

**Interfaces:**
- Produces: `generateReport(dir)` and `inboxReport(dir)` detect a post by `slides.md`; posts fit images to the format size (1080×1350 / 1080×1080 / 1080×1920); `.mp4` and voice files in a post's inbox are reported `ignored: posts use images only`.

- [ ] **Step 1: Failing tests:** a post folder with `instagram-carousel` asks the provider for `aspect_ratio: "4:5"` and fits to 1080×1350; a story post asks `9:16`; an `.mp4` in a post inbox is reported ignored.
- [ ] **Step 2–4:** Run → FAIL, implement, run → PASS.
- [ ] **Step 5: Commit** `git commit -m "Make and check photos for posts"`

### Task 11: The example page and the reference rebuild

**Files:**
- Create: `examples/pages/studio-nord/page.yaml` (English, niche "websites and custom software for small businesses", `style: { posts: 13, videos: 12 }`, `post_type: [1, 2, 3]`, `formats: [instagram-carousel, linkedin-carousel]`, brand handle `@studionord`, site `studionord.example`, tone), `examples/pages/studio-nord/posts/about-us/slides.md` (the reference's eight slides rewritten in English for Studio Nord: cover with phone and chips, the 9:40 pm notification slide, who we are with three service cards, how a post is born as a flow, why no faces as ✗/✓ chips, what you'll find here, in short as a numbered list, closing cta), `custom/` only if a slide can't be built from kinds and visuals
- Modify: `docs/media/` (commit `posts-grid.png` from the render, ≤ 1 MB), `tests/page/examplePages.test.ts` (the new page loads; its `slides.md` parses and builds a plan)

- [ ] **Step 1: Failing test** in `examplePages.test.ts`. **Step 2: Run** → FAIL.
- [ ] **Step 3: Write** the page and slides; `npm run unfaced -- post examples/pages/studio-nord/posts/about-us` → `Checks: PASS`.
- [ ] **Step 4: Owner acceptance (stop).** Show `grid.png` next to the reference; the owner judges it at least as good (design §8). Apply changes, re-render, ask again.
- [ ] **Step 5: Commit** (rendered PNGs and PDF of the example stay out of git; only `docs/media/posts-grid.png`) `git commit -m "Add the Studio Nord example page with its about-us carousel"`

### Task 12: The post-reviewer agent

**Files:**
- Create: `plugin/agents/post-reviewer.md`, its copy `plugin/skills/post-make/references/post-reviewer.md`
- Modify: `docs/formats/review.md` (a post's review: same header and verdict, issues by slide number instead of time), `tests/plugin/skills.test.ts` (generalise the reviewer copy test to both agents)

**Interfaces:**
- Produces: agent `post-reviewer` (tools `Read, Glob, Grep, Bash, Write`), given only the post folder and the command that runs unfaced; reads `slide-*.png`, `grid.png`, `slides.md`, `post-plan.json`, `check.json`, `page.yaml`, `unfaced show style <n>`; writes only `review.md`, starting `# Review: PASS` or `# Review: FAIL`; issue lines `error · slide 3 · Typo · …`. Categories: Typo, Readability, Layout, Style, Brand (handle, logo, fonts, tone, words to avoid), Cover (does slide 1 make you swipe, does it survive the 3:4 crop), Consistency, Facts, Checks.

- [ ] **Step 1: Failing test:** the copy is identical; the agent has name, description, tools and `# Review: PASS` in its body.
- [ ] **Step 2–4:** Run → FAIL, write, run → PASS.
- [ ] **Step 5: Commit** `git commit -m "Add the post reviewer"`

### Task 13: The post-make skill

**Files:**
- Create: `plugin/skills/post-make/SKILL.md`, `plugin/skills/post-make/scripts/unfaced.mjs` (copy of the launcher)
- Modify: `docs/formats/post.md` (a post's `post.md`: Instagram, LinkedIn, Facebook sections, each with caption, hashtags and alt text per slide; video sections unchanged), `tests/plugin/launcher.test.ts` (`SKILLS` gains `post-make`)

**Interfaces:**
- The flow (design §5.8), as numbered steps in the skill: page and folder (`<pageDir>/posts/<slug>/`, ask rework or new if `slides.md` exists) → choices (post type, format named by purpose, style; one line of reason each; a page whose post style can't draw posts gets the answer from design §7.4) → research (same rules as video-make: no invented facts or sources) → write `slides.md` in the page's language and `brand.tone`, avoiding `brand.words.avoid`; or lay out the user's own text **without rewriting it**, only splitting it into slides and kinds, and say where it doesn't fit → **approval stop** (same table of excuses as video-make) → custom slides and photos (`unfaced inbox`, `unfaced generate`; paid provider: say how many images and wait for OK) → `unfaced post` → look at every PNG and `grid.png` → `post-reviewer` (or the references copy when subagents aren't available) → fix up to three rounds → `post.md` → hand over (paths, formats, verdict) → set the idea's status in `ideas.md`.
- Description starts `Use when` and names carousels, single posts, LinkedIn carousels, stories, and turning a text into slides.

- [ ] **Step 1: Failing tests:** skills test sees `post-make` with portable front matter, only real commands (`post`, `check`, `inbox`, `generate`, `page`, `list`, `show`, `docs`) and formats (`slides`, `brand`, `post`, `review`), and only files it carries; launcher copy identical.
- [ ] **Step 2–4:** Run → FAIL, write, run → PASS.
- [ ] **Step 5: Commit** `git commit -m "Add the post-make skill"`

### Task 14: page-setup and video-ideas

**Files:**
- Modify: `plugin/skills/page-setup/SKILL.md`, `plugin/skills/video-ideas/SKILL.md`, `docs/formats/page.md` if wording changes

**Interfaces:**
- page-setup gains, per design §5.8: the brand questions (handle, site, logo file, fonts, 1–3 colours, tone, words) asked only for what's open; default formats asked by purpose; the **existing page** path (screenshots or files only, never opening the social network; draft the profile with sampled colours, closest style per medium, closest free fonts then ask for the real files, logo, handle, tone; play it back; ask about posts and reels that differ, varying colours, no matching style; write nothing until the user agrees); `style: { posts, videos }` when a page keeps two looks or its post style has no video scenes yet, saying why; styles 13 (and later 14–16) proposed for brands.
- video-ideas: each idea gets a `Format` column (`reel`, `carousel`, `story`) with the reason in "Why"; the calendar mixes them; posts only in styles that can draw them, reels only when the page has a ready video style; statuses unchanged.

- [ ] **Step 1:** Edit both skills. **Step 2:** `npx vitest run tests/plugin` → PASS (commands and formats they name exist).
- [ ] **Step 3: Commit** `git commit -m "Set up brands and existing pages, and plan posts with videos"`

### Task 15: Evals

**Files:**
- Create: `evals/post-make-stops-for-approval/`, `evals/post-make-keeps-user-text/`, `evals/post-make-asks-brand/`, `evals/post-make-unknown-format/`, `evals/page-setup-existing-page/` (scaffold copies `docs/media/posts-grid.png` as the "screenshot"), `evals/fixtures/pages/` additions as needed
- Modify: `evals/README.md` (cases table), `tests/evals/cases.test.ts` if it lists cases

**Interfaces (graders):**
- stops-for-approval: skill fired; `posts/*/slides.md` exists and parses (regex on `## cover`); no `unfaced post` run; judge.
- keeps-user-text: the user's five sentences appear verbatim in `slides.md`; judge.
- asks-brand: page without `brand`; asks for handle/logo/tone before writing slides, offers "you choose"; judge.
- unknown-format: "make it a Pinterest pin": says it isn't a format, offers the four by purpose; no file written; judge.
- page-setup-existing-page: reads the image, plays back a draft (colours, style 13, fonts, tone) and asks at least one question; no `page.yaml` yet; judge.
- Tag `files-only` where no CLI is needed.

- [ ] **Step 1:** Write the cases. **Step 2:** `claude plugin eval . --max-cost-usd 0 --scaffold --trust-plugin --allow-tools Bash Write Edit` → every case loads (exit 2, cost ceiling). **Step 3:** `npm test` → PASS.
- [ ] **Step 4: Commit** `git commit -m "Add evals for posts and existing pages"`

### Task 16: Docs, routing and release

**Files:**
- Modify: `AGENTS.md` (routing rows for posts, `post-make`, `post-reviewer`; commands `post`, `docs slides|brand`, `demo <style> --post`, `list post-type`), `README.md` (a Posts section with `docs/media/posts-grid.png`, formats by purpose, styles 13 Night tech), `docs/guide/getting-started.md` (making a first carousel), `docs/i18n/{it,es,fr,pt-BR}/README.md` and `getting-started.md` (same changes, translated), `CONTRIBUTING.md` (add a slide kind, a post type, a post-capable style; the slides contract test), `plugin/.claude-plugin/plugin.json` (description mentions posts; version 0.2.0), `package.json` version 0.2.0, `plugin/launcher/unfaced.mjs` `VERSION = "0.2.0"` and its copies in every skill
- Test: `tests/repo/manifests.test.ts`, `tests/plugin/launcher.test.ts`

- [ ] **Step 1:** Write the docs and bump versions; copy the launcher into all seven skills.
- [ ] **Step 2: Run** `npm test`, `npm run typecheck`, `UNFACED_SLOW=1 npm test` → PASS (on Windows).
- [ ] **Step 3: Commit** `git commit -m "Document posts and release 0.2.0"`
