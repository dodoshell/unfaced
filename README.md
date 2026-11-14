# unfaced

**Create and run faceless social media pages with your coding agent.**

Pick numbered styles, script types, hooks and voices, save them in a page profile, and turn one-line ideas into finished vertical videos for Reels, TikTok and Shorts. Free by default; paid services are optional.

> Work in progress. The video engine works today from the command line; the agent skills (page setup, ideas, recommendations, packaging) come next.

## What works today

- **A page profile** (`page.yaml`) with numbered choices: a fixed number, a list to pick from, or `auto`.
- **Catalogs** of styles, script types, hooks, voices, captions, music, endings and durations: `npm run unfaced -- list style`. Ready now: style 03 *Flat cartoon*, script types 06 *Surprising answer* and 09 *Did you know*, voice 01 *Calm documentary*, captions 01 *Word-by-word karaoke*. The rest are listed as planned.
- **A free, local pipeline**: `script.md` → voice (Kokoro, offline, English and Italian) → word timings (whisper.cpp) → frame-accurate scenes → a 1080×1920, 30 fps MP4 rendered with Remotion. No API key, no GPU.
- **Review tools**: `frames` renders stills to look at; `doctor` checks the install.

## Try the example

You need Node 22 or newer. Windows, macOS and Linux are supported (macOS and Linux build whisper.cpp from source, so they also need `git` and `make`).

```bash
npm run setup                     # dependencies, then the voice model, whisper and the render browser (~1 GB, once)
npm run unfaced -- make examples/pages/curious-cats/videos/why-cats-purr
```

The folder now holds `voice.wav`, `timing.json`, `plan.json` and `video.mp4`. Edit `script.md` and run `make` again; the voice is only recorded again when the spoken words change.

```bash
npm run unfaced -- frames examples/pages/curious-cats/videos/why-cats-purr --every 1s
npm run unfaced -- doctor
```

## How a page is laid out

```text
my-page/
  page.yaml            # the profile: language, niche, style, script types, voice, ...
  videos/
    why-cats-purr/
      script.md        # hook, body beats, ending; format in docs/formats/script.md
      video.mp4        # made by `unfaced make`
```

unfaced never posts anything. It produces files; you, or your own scheduling tool, publish them.

## License

MIT. Third-party assets keep their own licences, listed in [`LICENSES/`](LICENSES/README.md).
Rendering uses [Remotion](https://www.remotion.dev), which is free for individuals and companies of up to three people; larger companies need a [Remotion licence](https://www.remotion.dev/license).
