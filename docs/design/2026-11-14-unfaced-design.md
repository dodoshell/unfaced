# unfaced — design

Status: draft for approval · 2026-11-14

## 1. Intent

unfaced is a set of agent skills that lets one person create and run **faceless social media pages** (Reels, TikTok, YouTube Shorts) with a coding agent such as Claude Code or Codex. It covers the page, not just one video: choosing a consistent look and voice, planning ideas and series, writing scripts, producing the video, and packaging it for posting.

Why it exists: the owner wants a public repo that gets GitHub stars. The space of "agents that make videos" is crowded (about 500 repos). Style libraries (lemo-opuscar, 99 styles) and single-video generators exist. Nobody does the **page layer** well: consistency across dozens of videos, recurring series, and a loop from results back to the next video. That is the differentiator.

## 2. Goals, non-goals, anti-goals

Goals
- A person installs the plugin, creates a page, and gets a finished vertical video from a one-line idea.
- Everything has a **free path**: no paid API is required for any feature.
- Paid services plug in optionally and the free path stays the fallback.
- Numbered catalogs that people can pick from by number, or let the agent recommend.
- A page profile that keeps every video of a page consistent.
- Works in any language for the video content (Italian included).

Non-goals
- **Posting or scheduling.** unfaced never publishes to a social network and calls no publishing API. Posting is handled by a separate tool (Regia, built by the owner and a partner). unfaced only produces the files.
- A rendering engine. Remotion does the rendering.
- A video editor for existing footage (talking heads, clips the user filmed).

Anti-goals (would make it a failure even if it works)
- Automating third-party websites (driving ChatGPT, Gemini etc. through a browser to use someone's subscription). It breaks those services' terms and puts users' accounts at risk.
- A feature that only works with a paid key.
- Styles that look alike, or a README without a visible demo.

## 3. Constraints

- Everything user-facing is in **English**: README, skills, AGENTS.md, catalogs, demo videos.
- Follows current standards (Nov 2026):
  - Skills in the open Agent Skills format (agentskills.io): `skill-name/SKILL.md` with `name` (kebab-case, equal to the folder, no "claude"/"anthropic") and a third-person `description` saying what it does and when to use it (≤1024 chars). Body under 500 lines; details in `references/` one level deep; runnable code in `scripts/`.
  - `AGENTS.md` is the single instruction file for every agent, under 200 lines, built around a routing table. `CLAUDE.md` contains only `@AGENTS.md` (no symlink: breaks on Windows).
  - Claude Code plugin: `.claude-plugin/marketplace.json` at the repo root, the plugin in `plugin/` with `.claude-plugin/plugin.json`. Install with `claude plugin marketplace add` + `claude plugin install`. Other agents via `npx skills add`. No CLAUDE.md inside the plugin folder (not loaded).
  - Few skills, knowledge in data: catalogs are read on demand.
- License: **MIT** for code and for assets we create (demos included). Third-party assets (CC0 audio, OFL fonts) keep their license, tracked per file in `LICENSES/`.
- Git identity: dodoshell noreply. Repo private on the dodoshell account for now; nothing pushed until the owner says so.
- Built from scratch. No code or rules are taken from the owner's other video project.
- Remotion licence: free for individuals and companies up to 3 people; larger companies need a Remotion licence. The README says so.

## 4. Approaches considered

| Approach | Trade-off | Decision |
|---|---|---|
| A. Skills + catalogs on top of **Remotion**, free local voice, optional paid providers | Mature, React-based, big ecosystem; Remotion licence limit for big companies | **Chosen** (owner asked for Remotion as the base) |
| B. Same, on top of HyperFrames (HTML + GSAP, Apache-2.0) | Fully free licence; less mature, slower renders in public tests | Rejected for now |
| C. Build our own renderer | Months of work, no distribution advantage, small renderers stay small | Rejected |
| D. One generic "make a video" skill without page layer | Simpler; no differentiation from 500 existing repos | Rejected |

## 5. What the user sees

### 5.1 The page profile
Each page is a folder the user owns, separate from the plugin:

```text
my-pages/
└── curious-cats/
    ├── page.yaml          the profile
    ├── brand/             mascot.md, logo.png, fonts/
    ├── ideas.md           ideas, series, calendar
    ├── results.md         numbers the user pastes from the platforms
    └── videos/
        └── 2026-11-14-why-cats-purr/
            ├── brief.md       facts and sources
            ├── script.md
            ├── scenes/        code written for this video
            ├── inbox/         images or clips the user drops in (manual handoff)
            ├── voice.wav  timing.json
            ├── video.mp4  cover.png
            └── post.md        captions and hashtags per platform (not posted)
```

`page.yaml` example:

```yaml
name: Curious Cats
language: en            # language of the videos
niche: science facts about cats

style: 7                # fixed: always style 7
script: [2, 6, 9]       # list: the agent picks one per video
hook: auto              # free: the agent picks and explains why
voice: 3
captions: 1
music: auto
ending: 1
duration: 30-45
palette: ["#1B1B1F", "#F5C542", "#FFFFFF"]
font: auto
mascot: "Miso, an orange cat with round glasses"

providers:
  voice: kokoro         # kokoro | piper | elevenlabs
  ai_clips: none        # none | veo | seedance | kling
  images: none          # none | <image api> ; manual handoff always available
```

Every catalog field takes a **number** (fixed), a **list of numbers** (agent chooses within it) or **`auto`** (agent chooses and says why). A per-video override never changes the profile ("style 12 this time").

### 5.2 How it is used
1. Install the plugin once.
2. "New page" → the agent asks a few questions (niche, language, mood) or fills everything itself ("you choose"), showing numbered options and its recommendations.
3. "Video: why cats purr" → script → **user approves the script** → voice → scenes → render → frame review → cover → `post.md`.
4. Shortcuts: "recommend" (2–3 combinations for an idea), "ideas" (ideas and series for the niche), one-off overrides.

### 5.3 Skills (plugin/skills/)
| Skill | Job |
|---|---|
| `page-setup` | create or edit a page profile |
| `video-ideas` | ideas, recurring series, a weekly calendar for the page |
| `video-recommend` | for an idea, 2–3 catalog combinations with reasons |
| `video-make` | the pipeline from idea to finished video, including fact-check, approval stop and frame review |
| `video-package` | cover image and `post.md` (captions and hashtags per platform). Never posts |
| `page-results` | reads `results.md`, suggests what to change (hooks, durations, styles) |

### 5.4 Catalogs at launch, then about one or two additions a week
| Catalog | Launch count | Entries |
|---|---|---|
| Visual styles | 12 | 01 soft 3D (toy/clay) · 02 90s low poly · 03 flat cartoon · 04 line art · 05 ink silhouette · 06 chalkboard · 07 paper cut-out · 08 vintage comic (halftone) · 09 16-bit pixel art · 10 neon synthwave · 11 watercolour · 12 kinetic typography |
| Script types | 10 | 01 build it (naive version → real thing) · 02 top N countdown · 03 myth or fact · 04 what if · 05 story in 60 seconds (timeline) · 06 surprising answer · 07 how it works · 08 X vs Y · 09 did you know · 10 mini story (character, problem, twist) |
| Hooks | 15 | shocking question · absurd number · "you're doing it wrong" · impossible image · unfinished sentence · bold claim · countdown tease · POV · "nobody talks about this" · before/after flash · insider secret · challenge ("bet you can't") · start at the climax · relatable pain · contrarian take |
| Voices | 8 | calm documentary · energetic · storyteller · whisper · deadpan · warm friendly · news anchor · none (text only). Each maps to concrete voices per provider and language |
| Captions | 6 | word-by-word karaoke · bold centre · typewriter · minimal lower third · outline pop · highlight keyword |
| Music moods | 8 | suspense · epic · lo-fi · upbeat · playful · emotional · mystery · none |
| Endings | 6 | seamless loop · cliffhanger · comment question · "follow for part 2" · punchline · callback to the hook |
| Durations | 4 | 15 · 30 · 45 · 60 seconds, each with pacing rules |

Styles are picked to be as far apart as possible; similar ones (8-bit vs 16-bit, line art vs whiteboard) are kept apart in time.

### 5.5 Examples (examples/)
- `styles/`: **the same 5–10 second scene in all 12 styles**: a dog runs across a park, jumps to catch a ball and lands. Same motion, timing and framing; only the look changes. Also one "all styles" video and a GIF grid for the README.
- `hooks/`: every hook with 3 written examples in different niches, plus a "hook reel" video of opening lines (2–3 s each).
- `scripts/`: one complete written script per script type.
- `pages/`: 2–3 sample pages with very different profiles.
- `combos/`: **5 finished videos of about 30 seconds**, each a different combination of style, script, hook, voice and ending.

All demo videos are in English.

## 6. How it is built (decided parts)

### 6.1 Repository layout
```text
unfaced/
├── README.md  AGENTS.md  CLAUDE.md (@AGENTS.md)  CONTRIBUTING.md  LICENSE  LICENSES/
├── .claude-plugin/marketplace.json
├── plugin/
│   ├── .claude-plugin/plugin.json
│   └── skills/<six skills>/SKILL.md (+ references/, scripts/)
├── catalog/
│   ├── catalog.json            machine index of every numbered entry
│   ├── styles/_template/ + NN-<slug>/ (STYLE.md, style.json, components/, demo/)
│   ├── scripts/_template.md + NN-<slug>.md
│   └── hooks.md voices.md captions.md music.md endings.md durations.md
├── engine/                     shared Remotion project + CLI tools
├── schema/page.schema.json
├── examples/
├── gallery/                    static site built from catalog.json (GitHub Pages, later)
└── evals/                      3+ scenarios per skill
```

### 6.2 Free baseline
- Video: Remotion; 3D styles through three.js inside Remotion.
- Voice: local TTS (Kokoro or Piper), multilingual. Which one is the default is decided after testing Italian and English quality.
- Word timing: local Whisper.
- Music and sound effects: CC0 files shipped in the repo, or music generated in code.
- Fonts: Google Fonts (OFL).
- Images: drawn in code by the style; optional free stock (Pexels/Pixabay free key); manual handoff.

### 6.3 Providers
Voice, AI clips and images each sit behind one interface with several providers. Paid ones: ElevenLabs (voice), Veo / Seedance / Kling (clips), image APIs. Keys live in `.env` or in the plugin's sensitive `userConfig`, never in `page.yaml`. Missing key → fall back to the free provider and say so.

### 6.4 Manual handoff
The agent writes ready prompts (consistent with the style and mascot) into a list; the user generates images or clips with any service or subscription they have and drops the files into the video's `inbox/`; the agent validates format and consistency and uses them. Works for images, clips and voice.

### 6.5 Packaging
`post.md` per video: captions and hashtags for each platform, plain Markdown. An import format for Regia is out of scope until Regia is ready.

### 6.6 Install and runtime (builder's calls, recorded here)
- **Install**: the plugin carries the skills and a small setup script. On first use the setup script downloads the library (engine + catalog) matching the plugin version into `~/.unfaced/`, runs `npm install` there (Remotion and its headless browser), and reuses it for every page. Cloning the repo also works: the skills detect a local checkout and use it. A video's `scenes/` code is bundled by the engine from the video folder.
- **Platforms**: Windows, macOS and Linux are all first-class (the owner works on Windows). No GPU is assumed. Node-only is the goal (for example kokoro-js and whisper.cpp through Remotion's installer); Python is used only if a free tool has no workable Node route, and setup checks it. A `doctor` command reports what is missing.
- **Visual assets**: styles may ship assets we make ourselves or take under CC0 (3D models, sprite sheets, SVG character parts, textures), with licences recorded. The free code-made path must look good enough to publish; manual handoff and paid providers are upgrades, not the main path.
- **Languages**: English and Italian are first-class and tested at launch. Other languages are best effort: if no free voice fits a voice type in that language, the closest generic voice is used and the agent says so. The default free TTS engine may differ by language. Captions support Latin scripts at launch; non-Latin and right-to-left scripts come later.
- **Agents**: Claude Code is first-class and tested (evals run there). Other agents through `npx skills add` are best effort: skills avoid Claude-only features where they can, and fall back to plain instructions (for example "stop and ask the user to approve the script") where they can't. The README promises only that.

### 6.7 Recurring mascot (owner's decision)
A page may have a mascot that looks **the same in every video**.
- `page-setup` builds it once, in the page's style, and saves it in `brand/mascot/`: `mascot.md` (name, look, personality, do/don't), the reusable component and its assets, and a reference sheet image (front, side, expressions) that the review step compares frames against.
- Every style provides a **character system**: a parametric rig (body shape, head, ears or hair, colours, accessories) with a shared set of poses and expressions: idle, walk, run, jump, point, talk, surprised, happy, sad, thinking. The dog in the style demo is built with the same system, so the demo proves it.
- Changing the page's style means rebuilding the mascot in the new style from the same `mascot.md`.
- A page without a mascot is fine; the field is optional.
- With manual handoff or paid image providers, the reference sheet is the prompt anchor so that generated images stay on-model.

### 6.8 Independent review (owner's request)
Every finished video gets two checks before it is handed over:
- **Automatic checks** (`unfaced check <videoDir>`, code, no judgement): text boxes overlapping each other, text outside the safe zone, captions out of sync with the voice (more than 2 frames), black or frozen frames, audio loudness outside −16…−12 LUFS integrated or clipping, words cut at the start or end. Output: `check.json`.
- **Independent reviewer agent** (`video-reviewer`, a plugin subagent): starts with a fresh context and sees only `video.mp4`, extracted frames, `script.md`, `page.yaml`, `brand/mascot/` and `check.json`, never the conversation that made the video. It judges what code can't: readability, typos against the script, style consistency, mascot on-model, pacing, whether the hook lands. It writes `review.md` with PASS / FAIL and a list of issues, each with timestamp and severity.
- `video-make` fixes the issues and re-renders until the reviewer passes the video, at most 3 rounds; after that it shows the user what is left. On agents without subagents, the review runs as a separate skill in a fresh session.

## 7. Phases
1. **Foundation**: repo skeleton, manifests, `page.yaml` schema, engine (captions, safe zones, audio), free voice, Whisper, render, automatic checks. Exit: one complete video from a sample page with 1 style and 2 script types.
2. **Core skills**: `page-setup` (with mascot building), `video-make`, the `video-reviewer` agent, `video-recommend`, `video-ideas`; hooks, endings, voices catalogs; the character system in the first style.
3. **Content**: 12 styles with the dog scene, 10 script types, 15 hooks, examples (`hooks/`, `scripts/`, `pages/`, `combos/`), `video-package`, manual handoff.
4. **Paid providers, `page-results`, gallery, evals, launch.**

## 8. Left to the builder
- Choosing between Kokoro and Piper as the default free voice after a quality test.
- How style components are organised internally, and the exact `catalog.json` / `page.schema.json` fields.
- Topics for the combo videos and sample pages.
- CC0 audio sources, provided each file's licence is recorded.
