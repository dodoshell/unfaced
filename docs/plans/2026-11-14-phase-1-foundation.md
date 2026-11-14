# unfaced Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From a sample page folder and a written script, produce a finished 1080×1920 video (free local voice, word-timed captions, one visual style) with one CLI command.

**Architecture:** One TypeScript package at the repo root. `engine/src/` holds pure modules (page profile, catalog, script parsing, video plan) plus thin adapters (voice, timing, render). `engine/remotion/` holds the Remotion composition that turns a `VideoPlan` JSON into frames. Styles live in `catalog/styles/NN-slug/components/` and export the same `StyleKit` interface. The plugin skills come in Phase 2; Phase 1 ships the manifests and the CLI they will call.

**Tech Stack:** Node ≥ 22, TypeScript (strict), tsx, vitest, Remotion 4 (`remotion`, `@remotion/bundler`, `@remotion/renderer`, `@remotion/captions`, `@remotion/install-whisper-cpp`), `yaml`, `ajv`. Free TTS chosen in Task 4 (kokoro-js or Piper).

**Spec:** `docs/design/2026-11-14-unfaced-design.md`

## Global Constraints

- Everything user-facing is in English (README, AGENTS.md, skills, catalogs, CLI output, errors).
- License MIT; third-party assets recorded in `LICENSES/`.
- No feature may require a paid key; a paid provider without its key falls back to the free one and prints a warning.
- Secrets never live in `page.yaml`; keys come from `.env` / environment only.
- Windows, macOS and Linux all supported; no GPU assumed; Node-only unless a free tool has no Node route.
- Paths in docs and catalog files use forward slashes; code uses `node:path` and never assumes a separator.
- Output video: 1080×1920, 30 fps, H.264 MP4, AAC audio.
- `CLAUDE.md` contains exactly `@AGENTS.md`; `AGENTS.md` stays under 200 lines.
- Plugin name `unfaced`; no name contains "claude" or "anthropic".
- Commit identity: dodoshell noreply (already set by the folder's includeIf). No AI attribution lines in commits.

## Review Focus

1. Paths with spaces and Windows separators (e.g. `C:\Users\A B\my pages\curious cats`): every CLI command must work. Test lives in Task 11.
2. Non-ASCII script text (Italian accents, apostrophes, emoji): parsing, TTS input and captions keep characters intact. Tests in Tasks 6 and 8.
3. Audio longer than the page's `duration` range: the plan builder warns with the measured length and the allowed range, and still renders. Test in Task 7.
4. Invalid `page.yaml` (number outside the catalog, typo in a field name, a key-like value): the error names the field and the valid options. Test in Task 2.
5. Re-running `make` on the same video: unchanged script text reuses `voice.wav` and `timing.json` (paid voices cost money). Test in Task 11.

---

### Task 1: Repository scaffold, manifests and agent files

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `.gitattributes`, `LICENSE`, `LICENSES/README.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `.claude-plugin/marketplace.json`, `plugin/.claude-plugin/plugin.json`
- Test: `tests/repo/manifests.test.ts`

**Interfaces:**
- Produces: npm scripts `test`, `typecheck`, `unfaced` (`tsx engine/src/cli.ts`); plugin id `unfaced@unfaced`.

- [ ] **Step 1: Write the failing test** `manifests.test.ts`:
  - `marketplace.json` has `name: "unfaced"` and one plugin `{ name: "unfaced", source: "./plugin" }`.
  - `plugin.json` has `name: "unfaced"`, `license: "MIT"`, a `description`, an `author.name`.
  - `CLAUDE.md` trimmed equals `@AGENTS.md`.
  - `AGENTS.md` has fewer than 200 lines and contains a Markdown table (routing table).
  - No file under `plugin/` is named `CLAUDE.md`.
- [ ] **Step 2: Run** `npm test -- tests/repo` → FAIL (files missing).
- [ ] **Step 3: Create the files.** `.gitignore` covers `node_modules/`, `.env`, `**/out/`, `examples/**/videos/**/*.mp4`, `examples/**/videos/**/*.wav`. `.gitattributes` sets `* text=auto eol=lf`. README is a stub: one-sentence pitch, "work in progress", MIT. AGENTS.md: project overview, commands (`npm test`, `npm run typecheck`, `npm run unfaced -- <cmd>`), routing table rows for "make a video", "edit a page", "add a style" pointing to paths that will exist (mark Phase 2 rows "coming soon").
- [ ] **Step 4: Run** `npm test -- tests/repo` → PASS; run `claude plugin validate ./plugin` → "Validation passed" (warnings about no skills are acceptable in Phase 1).
- [ ] **Step 5: Commit** `chore: scaffold repo, plugin manifests and agent files`

### Task 2: Page profile schema and loader

**Files:**
- Create: `schema/page.schema.json`, `engine/src/page/types.ts`, `engine/src/page/loadPage.ts`, `engine/src/page/resolveChoice.ts`
- Test: `tests/page/loadPage.test.ts`, `tests/page/resolveChoice.test.ts`, fixtures in `tests/fixtures/pages/`

**Interfaces:**
- Consumes: nothing yet. Declare `interface CatalogLike { ids(kind: CatalogKind): number[] }` in `page/types.ts`; `loadPage` and `resolveChoice` take a `CatalogLike` (tests pass a stub; Task 3's `Catalog` satisfies it).
- Produces:
  - `type CatalogKind = "style" | "script" | "hook" | "voice" | "captions" | "music" | "ending" | "duration"`
  - `type Choice = number | number[] | "auto"`
  - `interface Page { dir: string; name: string; language: string; niche: string; choices: Partial<Record<CatalogKind, Choice>>; palette?: string[]; font?: string | "auto"; mascot?: string; providers: { voice: string; ai_clips: string; images: string } }`
  - `loadPage(dir: string, catalog: CatalogLike): Promise<Page>` — throws `PageError` with `field` and `message`.
  - `resolveChoice(kind: CatalogKind, choice: Choice | undefined, catalog: CatalogLike, pick: (options: number[]) => number): number`

- [ ] **Step 1: Write failing tests**
  - valid fixture `curious-cats/page.yaml` (the spec's example) loads; `choices.style === 7`, `choices.script` equals `[2, 6, 9]`, `choices.hook === "auto"`.
  - missing `providers` defaults to `{ voice: "free", ai_clips: "none", images: "none" }`.
  - `style: 99` → `PageError` whose message contains `style` and `1–12`.
  - unknown field `stlye: 3` → `PageError` mentioning `stlye` and suggesting `style`.
  - a value matching `/^(sk-|xi-|AIza)/` anywhere → `PageError` "API keys must not be stored in page.yaml; use .env".
  - `resolveChoice("style", 7, …)` → 7; `[2,6,9]` → result of `pick([2,6,9])`; `"auto"` → `pick(allIds)`; `undefined` → `pick(allIds)`.
- [ ] **Step 2: Run** `npm test -- tests/page` → FAIL.
- [ ] **Step 3: Implement** with `yaml` + `ajv` against `schema/page.schema.json`; range checks against `catalog.ids(kind)`; nearest-field suggestion by Levenshtein distance ≤ 2.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(page): page.yaml schema, loader and choice resolution`

### Task 3: Catalog index and `list` command

**Files:**
- Create: `catalog/catalog.json`, `catalog/styles/03-flat-cartoon/style.json`, `catalog/scripts/06-surprising-answer.md`, `catalog/scripts/09-did-you-know.md`, `catalog/captions.md`, `catalog/durations.md`, `catalog/music.md`, `catalog/endings.md`, `engine/src/catalog/catalog.ts`, `engine/src/cli/list.ts`
- Test: `tests/catalog/catalog.test.ts`

**Interfaces:**
- Produces:
  - `interface CatalogEntry { kind: CatalogKind; num: number; slug: string; name: string; summary: string; goodFor: string[]; path: string; status: "ready" | "planned" }`
  - `class Catalog { static load(root: string): Catalog; ids(kind: CatalogKind): number[]; get(kind: CatalogKind, num: number): CatalogEntry; list(kind: CatalogKind): CatalogEntry[] }`
  - CLI `unfaced list <kind>` prints `NN  Name — summary` for every entry, `(planned)` after planned ones.

- [ ] **Step 1: Write failing tests**
  - numbers per kind are unique and start at 1 with no gaps.
  - every `ready` entry's `path` exists on disk.
  - `catalog.json` lists all launch entries from spec §5.4 (12 styles, 10 scripts, 15 hooks, 8 voices, 6 captions, 8 music, 6 endings, 4 durations) with names exactly as in the spec; only style 03, scripts 06 and 09, captions 01, durations 1–4, music 08 ("none") and ending 05 ("punchline") are `ready`.
  - `unfaced list style` output has 12 lines, line 3 starts with `03  Flat cartoon`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** the loader and write the ready catalog files. Script-type files follow one template: Purpose, Structure (beats with target seconds), Rules, Two full examples (English).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(catalog): catalog index, launch entries and list command`

### Task 4: Free voice: bake-off, provider interface and fallback

**Files:**
- Create: `docs/decisions/0001-free-tts.md`, `engine/src/voice/types.ts`, `engine/src/voice/registry.ts`, `engine/src/voice/<chosen>.ts`, `catalog/voices.md` (voice 1 "calm documentary" ready, others planned)
- Test: `tests/voice/registry.test.ts`, `tests/voice/<chosen>.slow.test.ts`

**Interfaces:**
- Produces:
  - `interface VoiceResult { wavPath: string; durationSec: number; provider: string }`
  - `interface VoiceProvider { id: string; isFree: boolean; available(env: NodeJS.ProcessEnv): boolean; synthesize(text: string, opts: { language: string; voiceType: number; outPath: string }): Promise<VoiceResult> }`
  - `getVoiceProvider(requested: string, env: NodeJS.ProcessEnv, warn: (msg: string) => void): VoiceProvider`

- [ ] **Step 1: Bake-off spike (no tests).** In a scratch folder outside the repo, synthesize the same two sentences (one English, one Italian with accents) with kokoro-js and with Piper (Node route if one exists, otherwise the Piper binary). Record for each: install steps on Windows, model size, seconds to synthesize, whether Italian works, and listen-quality notes. Write the decision and its reasons in `docs/decisions/0001-free-tts.md`. The default may differ per language (spec §6.6).
- [ ] **Step 2: Write failing tests**
  - `getVoiceProvider("elevenlabs", {}, warn)` returns the free provider and calls `warn` with a message containing `ELEVENLABS_API_KEY`.
  - `getVoiceProvider("free", …)` returns the chosen free provider.
  - slow test (skipped unless `UNFACED_SLOW=1`): synthesizing "Why do cats purr?" in `en` and "Perché i gatti fanno le fusa?" in `it` writes WAV files with `durationSec` between 1 and 6.
- [ ] **Step 3: Run** → FAIL.
- [ ] **Step 4: Implement** the registry and the chosen free provider. Model files are downloaded once into `~/.unfaced/models/` (respect `UNFACED_HOME` if set).
- [ ] **Step 5: Run** `npm test -- tests/voice` and `UNFACED_SLOW=1 npm test -- tests/voice` → PASS.
- [ ] **Step 6: Commit** `feat(voice): free local TTS provider with paid fallback rules`

### Task 5: Word timing with local Whisper

**Files:**
- Create: `engine/src/timing/align.ts`, `tests/fixtures/audio/hello.wav` (generated by the Task 4 provider, committed, under 200 KB)
- Test: `tests/timing/align.slow.test.ts`

**Interfaces:**
- Produces:
  - `interface WordTiming { text: string; startMs: number; endMs: number }`
  - `alignWords(wavPath: string, language: string): Promise<WordTiming[]>` — installs whisper.cpp and the model into `~/.unfaced/whisper/` on first use via `@remotion/install-whisper-cpp`.

- [ ] **Step 1: Write failing slow test:** for the fixture saying "hello world this is a test", words come back in that order (case-insensitive, punctuation stripped), `startMs` strictly increasing, last `endMs` ≤ audio duration + 100.
- [ ] **Step 2: Run** with `UNFACED_SLOW=1` → FAIL.
- [ ] **Step 3: Implement** using token-level timestamps and `toCaptions`; model `base` for `en`, multilingual `base` for other languages. Convert input to 16 kHz mono WAV first if needed.
- [ ] **Step 4: Run** → PASS on Windows (record in the commit body if macOS/Linux are not yet verified).
- [ ] **Step 5: Commit** `feat(timing): word timestamps with local whisper.cpp`

### Task 6: Script format and parser

**Files:**
- Create: `engine/src/script/parseScript.ts`, `docs/formats/script.md` (format reference)
- Test: `tests/script/parseScript.test.ts`

**Interfaces:**
- Produces:
  - `interface Beat { id: string; kind: "hook" | "body" | "ending"; text: string; visual?: string }`
  - `interface Script { title: string; scriptType: number; hook: number; ending: number; beats: Beat[]; spokenText: string }`
  - `parseScript(markdown: string): Script`
- Format: front matter (`title`, `script_type`, `hook`, `ending`), then `## Hook`, `## Body` (one beat per paragraph, optional line `> visual: …`), `## Ending`.

- [ ] **Step 1: Write failing tests**
  - a two-paragraph body yields 4 beats in order hook, body, body, ending, ids `hook`, `b1`, `b2`, `ending`.
  - `> visual:` lines go to `visual` and are excluded from `spokenText`.
  - Italian text `Perché è così? L'acqua…` and an emoji survive unchanged in `text`; `spokenText` drops the emoji.
  - missing `## Hook` → error "script.md needs a ## Hook section".
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(script): script.md format and parser`

### Task 7: Video plan builder

**Files:**
- Create: `engine/src/plan/types.ts`, `engine/src/plan/buildPlan.ts`
- Test: `tests/plan/buildPlan.test.ts`

**Interfaces:**
- Consumes: `Script` (Task 6), `WordTiming[]` (Task 5), `Page` (Task 2).
- Produces:
  - `type SceneKind = "title" | "fact" | "list" | "outro"`
  - `interface Scene { beatId: string; kind: SceneKind; text: string; fromFrame: number; durationInFrames: number; words: WordTiming[] }`
  - `interface VideoPlan { fps: 30; width: 1080; height: 1920; durationInFrames: number; style: number; captions: number; palette: string[]; audioSrc: string; scenes: Scene[] }`
  - `buildPlan(input: { script: Script; words: WordTiming[]; audioDurationSec: number; page: Page; style: number; captions: number; warn: (m: string) => void }): VideoPlan`
- Rules: each beat's words are matched in order to the timings; a scene starts at its first word and ends where the next starts; the hook beat is `title`, the ending is `outro`, body beats are `fact` unless the text has 3+ lines starting with `-` (then `list`); total length = audio + 15 frames tail.

- [ ] **Step 1: Write failing tests**
  - scenes are contiguous, start at frame 0 and end at `durationInFrames`.
  - `durationInFrames === ceil(audioDurationSec × 30) + 15`.
  - a 70 s audio with `duration: 30-45` calls `warn` with "70s" and "30–45s" and still returns a plan.
  - palette falls back to the style's default palette when the page has none.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(plan): build a frame-accurate video plan from script and timings`

### Task 8: Remotion composition, captions and safe zones

**Files:**
- Create: `engine/remotion/index.ts`, `engine/remotion/Root.tsx`, `engine/remotion/UnfacedVideo.tsx`, `engine/remotion/core/Captions.tsx`, `engine/remotion/core/safeZone.ts`, `engine/remotion/styles/registry.ts`, `engine/src/render/renderVideo.ts`
- Test: `tests/render/safeZone.test.ts`, `tests/render/stills.slow.test.ts`

**Interfaces:**
- Consumes: `VideoPlan` (Task 7).
- Produces:
  - `interface StyleKit { id: number; defaultPalette: string[]; SceneView: React.FC<{ scene: Scene; palette: string[] }>; Background: React.FC<{ palette: string[] }> }`
  - `registerStyle(kit: StyleKit): void`, `getStyle(id: number): StyleKit`
  - `SAFE_ZONE = { top: 220, bottom: 380, left: 60, right: 140 }` (pixels at 1080×1920; covers Reels, TikTok and Shorts UI)
  - `isInsideSafeZone(rect: { x: number; y: number; w: number; h: number }): boolean`
  - `renderVideo(plan: VideoPlan, outPath: string): Promise<void>`, `renderStillAt(plan: VideoPlan, frame: number, outPath: string): Promise<void>`
- Captions style 01 (word-by-word karaoke): built on `@remotion/captions` `createTikTokStyleCaptions`, current word highlighted, always inside the safe zone.

- [ ] **Step 1: Write failing tests**
  - `isInsideSafeZone` true for `{x:100,y:400,w:800,h:200}`, false for a box touching the bottom 380 px or the right 140 px.
  - slow: rendering stills at frames 0, middle and last of a fixture plan writes three PNGs of 1080×1920; a caption with `è` and `’` renders (no tofu): compare against a committed reference still with a pixel-diff tolerance of 2%.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (style registry starts empty; a test-only placeholder style is registered in the test). **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(render): remotion composition, karaoke captions and safe zones`

### Task 9: Style 03 "Flat cartoon"

**Files:**
- Create: `catalog/styles/03-flat-cartoon/STYLE.md`, `catalog/styles/03-flat-cartoon/components/index.tsx` (+ one file per scene kind), update `catalog/styles/03-flat-cartoon/style.json` (`status: "ready"`), register in `engine/remotion/styles/registry.ts`
- Test: `tests/styles/flat-cartoon.slow.test.ts`

**Interfaces:**
- Consumes: `StyleKit`, `Scene` (Tasks 7–8).
- Produces: a `StyleKit` with `id: 3` covering `title`, `fact`, `list`, `outro`.
- `STYLE.md` sections: Look (shapes, outlines, shadows), Colour (default palette of 4–5 hex values and how page palettes map onto it), Type (Google Font, OFL, recorded in `LICENSES/`), Motion (entrance, emphasis, exit; durations in frames), Pitfalls (what breaks the style).

- [ ] **Step 1: Write failing slow test:** for each scene kind, a still renders, is not a single flat colour (pixel variance above a threshold), and keeps all text inside the safe zone (components expose text boxes via a `data-text-box` attribute that the test reads from a debug render, or via a pure `layout(scene)` function the test calls; pick one and document it in `STYLE.md`).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS, and look at the four stills yourself; adjust until they look publishable.
- [ ] **Step 5: Commit** `feat(styles): style 03 flat cartoon`

### Task 10: Setup, doctor and the `make` command

**Files:**
- Create: `engine/src/cli.ts`, `engine/src/cli/make.ts`, `engine/src/cli/doctor.ts`, `engine/src/cli/frames.ts`, `plugin/skills/.gitkeep`, `scripts/setup.mjs`
- Test: `tests/cli/doctor.test.ts`, `tests/cli/make.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `unfaced make <videoDir>`: reads `<videoDir>/../../page.yaml` and `<videoDir>/script.md`; runs voice → align → plan → render; writes `voice.wav`, `timing.json`, `plan.json`, `video.mp4` into `<videoDir>`.
  - `unfaced frames <videoDir> --every 1s`: writes PNGs to `<videoDir>/frames/` for review.
  - `unfaced doctor`: checks Node ≥ 22, free voice model present, whisper present, Remotion browser present, disk space ≥ 2 GB; prints one line per check with `ok` / `missing` and the fix command.
  - `scripts/setup.mjs`: installs dependencies and downloads models into `~/.unfaced/` (or `UNFACED_HOME`).
  - Cache: `voice.wav` and `timing.json` are reused when `sha256(spokenText + voiceProvider + voiceType + language)` equals the hash stored in `timing.json`.

- [ ] **Step 1: Write failing tests**
  - doctor with injected checks (all fail) prints 5 `missing` lines and exits with code 1; all pass → exit 0.
  - make with stubbed voice/align/render: second run with the same script does not call voice or align; editing one word calls both again.
  - make on a folder whose path contains spaces and (on Windows) backslashes completes with the stubs.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(cli): make, frames, doctor and setup`

### Task 11: End-to-end sample page

**Files:**
- Create: `examples/pages/curious-cats/page.yaml` (style 3, script `[6, 9]`, captions 1, duration `30-45`, music 8, ending 5, language `en`), `examples/pages/curious-cats/videos/why-cats-purr/script.md` (type 6), `examples/pages/curious-cats/videos/cats-and-milk/script.md` (type 9)
- Test: `tests/e2e/curious-cats.slow.test.ts`

- [ ] **Step 1: Write the failing slow test:** `unfaced make` on both videos produces `video.mp4` that `ffprobe` (bundled with Remotion) reports as 1080×1920, 30 fps, H.264 + AAC, duration within ±0.2 s of `plan.json`; a second run finishes without re-synthesizing (cache hit logged).
- [ ] **Step 2: Run** → FAIL. **Step 3: Write the two scripts** following their script-type files. **Step 4: Run** → PASS.
- [ ] **Step 5: Review:** run `unfaced frames` on both, look at every frame; fix style or plan issues until captions are in sync, nothing leaves the safe zone, and the videos are publishable.
- [ ] **Step 6: Update README** (what works today, how to run the example) and **AGENTS.md** routing rows; commit `feat(examples): curious-cats sample page with two finished videos`.

### Task 12: Automatic checks (`unfaced check`)

**Files:**
- Create: `engine/src/check/types.ts`, `engine/src/check/overlap.ts`, `engine/src/check/sync.ts`, `engine/src/check/frames.ts`, `engine/src/check/audio.ts`, `engine/src/cli/check.ts`
- Test: `tests/check/*.test.ts`, `tests/check/e2e.slow.test.ts`

**Interfaces:**
- Consumes: `VideoPlan`, `WordTiming[]`, the style's text-box layout from Task 9.
- Produces:
  - `interface CheckIssue { check: "overlap" | "safe-zone" | "sync" | "black-frame" | "frozen-frame" | "loudness" | "clipping" | "cut-word"; atMs: number; severity: "error" | "warning"; message: string }`
  - `interface CheckReport { pass: boolean; issues: CheckIssue[] }` written to `<videoDir>/check.json`; `pass` is false when any issue is an `error`.
  - `unfaced check <videoDir>` exits 1 when `pass` is false. `make` runs it at the end and prints the summary.
- Thresholds (spec §6.8): caption sync drift > 2 frames = error; integrated loudness outside −16…−12 LUFS = warning, true peak > −1 dBTP = error; a run of ≥ 15 identical or near-black frames = error; first or last word starting < 80 ms from the video edge = error.

- [ ] **Step 1: Write failing tests** with synthetic inputs: two overlapping text boxes in the same frame range → one `overlap` error; caption frames shifted by 3 frames against word timings → `sync` error, by 2 → none; a fixture video with 1 s of black → `black-frame` error at ~that time; a −6 LUFS fixture → `loudness` warning.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** (loudness and frame stats via the ffmpeg binary bundled with Remotion). **Step 4: Run** → PASS; run `unfaced check` on both Task 11 videos → `pass: true`.
- [ ] **Step 5: Commit** `feat(check): automatic video checks`

---

Phase 1 exit: Task 11 and Task 12 pass on Windows; `npm test` and `npm run typecheck` are green. Phase 2 (skills, mascot, more catalogs) gets its own plan.
