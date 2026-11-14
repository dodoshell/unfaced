# unfaced

**Create and run faceless social media pages with your coding agent.**

Pick numbered styles, script types, hooks and voices, save them in a page profile, and turn one-line ideas into finished vertical videos for Reels, TikTok and Shorts. Free by default; paid services are optional.

> Work in progress. The engine, the agent skills and one visual style are ready; the other eleven styles and eight script types are being built.

## What you can do

Ask your agent, in your own words:

| You say | What happens |
|---|---|
| "Start a page about surprising cat facts, in English" | **page-setup** asks a few questions (or picks everything if you say "you choose"), writes `page.yaml` from the numbered catalogs, and can build a mascot that looks the same in every video. |
| "Give me ideas for next week" | **video-ideas** writes ten checked ideas, two or three recurring series and a calendar into `ideas.md`. |
| "How should I make the one about kneading?" | **video-recommend** offers 2–3 combinations (script type, hook, ending, length...) with a sample hook for each. |
| "Make it" | **video-make** researches and writes the script, **stops for your approval**, then records the voice, draws the scenes, renders, runs the automatic checks and has an independent reviewer agent look at every frame before handing you `video.mp4`. |
| "Get it ready to post" | **video-package** renders `cover.png` and writes `post.md`: captions, hashtags and a title for each platform. |
| "Here are my numbers, what should I change?" | **page-results** reads `results.md`, finds what your best videos share, and suggests at most three changes. |

unfaced never posts anything. It makes files; you, or your own scheduling tool, publish them.

## Install

**Claude Code** (first-class):

```text
/plugin marketplace add dodoshell/unfaced
/plugin install unfaced@unfaced
```

The first command that needs the engine installs it into `~/.unfaced/` (git, Node 22+ and about 1 GB for the voice model, whisper and the render browser).

**Other agents** (best effort): `npx skills add dodoshell/unfaced`. The skills are plain instructions and a Node launcher; where an agent has no subagents, the review runs in a fresh session instead.

**From a clone**: `npm run setup`, then use the CLI directly (below). The skills inside the clone use it; to point an installed plugin at your clone, set `UNFACED_LIB` to its folder.

## Catalogs

| Catalog | Ready | Entries |
|---|---|---|
| Styles | 1 of 12 | 03 *Flat cartoon* ready; soft 3D, low poly, line art, ink silhouette, chalkboard, paper cut-out, vintage comic, pixel art, neon synthwave, watercolour, kinetic typography coming |
| Script types | 2 of 10 | 06 *Surprising answer*, 09 *Did you know*; build it, countdown, myth or fact, what if, story, how it works, X vs Y, mini story coming |
| Hooks | 15 of 15 | shocking question, absurd number, "you're doing it wrong", POV, start at the climax... each with rules and three examples |
| Voices | 8 of 8 | calm documentary, energetic, storyteller, whisper, deadpan, warm friendly, news anchor, none (text only) |
| Captions | 6 of 6 | word-by-word karaoke, bold centre, typewriter, minimal lower third, outline pop, highlight keyword |
| Music | 8 of 8 | suspense, epic, lo-fi, upbeat, playful, emotional, mystery (all made in code, MIT), none |
| Endings | 6 of 6 | seamless loop, cliffhanger, comment question, follow for part 2, punchline, callback to the hook |
| Durations | 4 of 4 | 15, 30, 45 and 60 seconds, with pacing rules |

`unfaced list <kind>` lists a catalog; `unfaced show <kind> <number>` prints an entry's guide.

## How it works

- **Free and local**: `script.md` → voice (Kokoro, offline; English and Italian first-class) → word timings (whisper.cpp) → frame-accurate scenes → music mixed under the voice → a 1080×1920, 30 fps MP4 rendered with Remotion. No API key, no GPU.
- **A character system**: eight species and ten poses, the same motion in every style, so a page's mascot stays on-model.
- **A video's own scenes**: when a beat needs a diagram or a specific moment, the agent writes a small React scene for it (`docs/formats/scenes.md`); everything else uses the style's scenes.
- **Two reviews**: automatic checks (overlapping text, the platforms' safe zone, captions in sync with the voice within 2 frames, black or frozen frames, loudness, cut words) and an independent reviewer agent that sees only the files, never the conversation that made the video.

## The CLI

```bash
npm run unfaced -- page examples/pages/curious-cats            # check a page profile
npm run unfaced -- make examples/pages/curious-cats/videos/why-cats-purr
npm run unfaced -- frames examples/pages/curious-cats/videos/why-cats-purr --every 1s
npm run unfaced -- cover examples/pages/curious-cats/videos/why-cats-purr
npm run unfaced -- docs script                                 # file formats: page, script, mascot, scenes, review, post, results
npm run unfaced -- doctor                                      # what is missing from the install
```

## A page on disk

```text
my-page/
  page.yaml              the profile: language, niche, style, script types, voice, ...
  brand/mascot/          the mascot: mascot.json, mascot.md, reference.png
  ideas.md               ideas, series and the calendar
  results.md             how the posted videos did
  videos/
    why-cats-purr/
      script.md          hook, body beats, ending (docs/formats/script.md)
      scenes/            optional scene code for this video
      video.mp4          made by unfaced make
      check.json         the automatic checks
      review.md          the independent review
      cover.png, post.md ready to post
```

## License

MIT. Third-party assets keep their own licences, listed in [`LICENSES/`](LICENSES/README.md).
Rendering uses [Remotion](https://www.remotion.dev), which is free for individuals and companies of up to three people; larger companies need a [Remotion licence](https://www.remotion.dev/license).
