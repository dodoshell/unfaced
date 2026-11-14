# Page format

A page is a folder. Its profile, `page.yaml`, keeps every video consistent: the same look, voice, captions and pacing, chosen from the numbered catalogs. The schema is `schema/page.schema.json`; `unfaced page <pageDir>` checks a profile and prints it with every choice named.

## The folder

```text
<page>/
├── page.yaml              the profile (this document)
├── brand/mascot/          optional recurring character: mascot.json, mascot.md, reference.png (unfaced docs mascot)
├── ideas.md               ideas, series and the weekly calendar (video-ideas skill)
├── results.md             how the posted videos did (unfaced docs results)
└── videos/<video>/        one folder per video, named with a short slug
    ├── script.md          what the narrator says (unfaced docs script)
    ├── scenes/            optional: the video's own scene code (unfaced docs scenes)
    ├── inbox/             optional: images or clips made elsewhere, used by the scenes
    └── ...                made by unfaced: voice.wav, timing.json, soundtrack.wav, plan.json,
                           video.mp4, check.json, frames/, review.md, cover.png, post.md
```

## page.yaml

```yaml
name: Curious Cats
language: en              # language of the videos: en, it, es, fr, pt, hi (others: voice 8 or a paid voice)
niche: surprising cat facts and behaviour, explained simply

style: 3                  # fixed: every video
script: [6, 9]            # a list: the agent picks one per video
hook: auto                # auto: the agent picks any ready one and says why
voice: 1
captions: 1
music: 5
ending: [1, 5]
duration: 30-45           # seconds: one number or a range

palette: ["#FFF4E0", "#FF6B35", "#2EC4B6", "#FFD23F", "#1B1B3A"]   # optional; the style's own palette otherwise
mascot: "Miso, an orange cat with round glasses"                    # optional; the character itself is in brand/mascot/

providers:
  voice: free             # free (Kokoro, local) or elevenlabs (needs ELEVENLABS_API_KEY in .env)
  ai_clips: none          # none, or replicate for unfaced generate (see Providers below)
  images: none            # none, pexels (free stock photos) or replicate
```

| Field | Required | Meaning |
|---|---|---|
| `name` | yes | The page's name. |
| `language` | yes | Language code of the videos (`en`, `it`, `pt-BR`). Captions, the voice and `post.md` use it. |
| `niche` | yes | What the page is about, in one line. Ideas and recommendations start from it. |
| `style`, `script`, `hook`, `voice`, `captions`, `music`, `ending` | no | A catalog number, a list of numbers, or `auto` (the default). See `unfaced list <kind>`. |
| `duration` | no | Target length in seconds, `30` or `30-45`. `unfaced make` warns when a voice-over falls outside it. |
| `palette` | no | Colours as `#RRGGBB`. Styles map them to roles; style 03 reads background, accent, secondary, highlight, ink. |
| `font` | no | Reserved; styles use their own font for now. |
| `mascot` | no | A one-line description; the character is defined in `brand/mascot/mascot.json`. |
| `providers` | no | Which provider makes the voice, clips and images (see Providers below). Free by default; a paid one without its key falls back to the free one and says so. |

How choices work:

- A number is used for every video. Only `ready` entries can be made; `unfaced list <kind>` marks the planned ones.
- A list or `auto` leaves the pick to the agent, one video at a time. The agent writes its pick into the video's `script.md` front matter and says why.
- A video can override any choice for itself ("style 12 this time") in its `script.md`; `page.yaml` stays as it is.

## Providers

| Field | Values | Key |
|---|---|---|
| `voice` | `free` (Kokoro, local; `kokoro` works too), `elevenlabs` | `ELEVENLABS_API_KEY` |
| `images` | `none`; `pexels` (free stock photos, portrait); `replicate` (FLUX 2 Pro, `black-forest-labs/flux-2-pro`); `replicate:<owner>/<model>` (another image model on Replicate) | `PEXELS_API_KEY` (free), `REPLICATE_API_TOKEN` |
| `ai_clips` | `none`; `replicate` (same as `replicate:kling`); `replicate:kling` (`kwaivgi/kling-v3-video`), `replicate:veo` (`google/veo-3.1-fast`), `replicate:seedance` (`bytedance/seedance-2.0-fast`); `replicate:<owner>/<model>` | `REPLICATE_API_TOKEN` |

`unfaced make` uses `voice`. `unfaced generate <videoDir>` uses `images` and `ai_clips` to make the files a video's `inbox/PROMPTS.md` asks for (see `unfaced docs scenes`); with `none`, or without the key, those files are left for manual handoff. Clips are silent and 5 seconds long (Veo: 6). A model named as `<owner>/<model>` gets only the prompt, `aspect_ratio: "9:16"` and, for images, the file format. Replicate bills every image and clip to the account of the token.

## Keys for paid providers

Never put an API key in `page.yaml`; `unfaced` refuses a profile with something that looks like a key. Keys go in a `.env` file, one `NAME=value` per line; `.env.example` at the root of the unfaced repository lists every variable. `unfaced make` and `unfaced generate` read these files, nearest first, and never replace a variable already set in the environment:

1. `<page>/.env`: keys for this page only.
2. `.env` in the folder you run unfaced from.
3. `~/.unfaced/.env` (or `$UNFACED_HOME/.env`): keys shared by every page.

An empty value (`NAME=`) is skipped, so a copied `.env.example` does not hide a key set further away. `unfaced doctor` says which keys are set in the environment, the current folder's `.env` and `~/.unfaced/.env`, never their values.

| Variable | Used for |
|---|---|
| `ELEVENLABS_API_KEY` | `providers.voice: elevenlabs` |
| `REPLICATE_API_TOKEN` | `providers.images: replicate` and `providers.ai_clips: replicate` |
| `PEXELS_API_KEY` | `providers.images: pexels` (the key is free) |

Without its key a paid provider is skipped: the free path is used (the free voice, or the file left for manual handoff) and `unfaced` says so.
