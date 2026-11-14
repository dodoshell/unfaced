# Voices

The narrator's voice type. The free voice is Kokoro, running locally (see `docs/decisions/0001-free-tts.md`); each voice type maps to a Kokoro speaker and speed per language (`engine/src/voice/kokoro.ts`). A paid provider (ElevenLabs) replaces it when the page asks for it and its key is in `.env`.

| Language | Support |
|---|---|
| English | First-class: a different speaker for every voice type. |
| Italian | First-class, with two speakers (Nicola and Sara): some voice types reuse a speaker at another speed, and `unfaced make` says so. |
| Spanish, French, Portuguese, Hindi | Best effort: Kokoro's own speakers for that language, reused at different speeds where there are too few. |
| Others | Not yet in the free voice. Use voice `08 None (text only)`, or ElevenLabs. |

When a language has no free speaker that fits a voice type, the closest one stands in and `unfaced make` prints a note. Changing the voice type, the speaker behind it or the language records the voice-over again; otherwise it is reused.

## 01 Calm documentary

**Status:** ready

Slow, low and clear, like a nature documentary. Lets facts land.

- English: `bm_george` at 0.95×. Italian: `im_nicola` at 0.95×.
- Good for: nature, history, science.
- Pairs well with: captions 01 or 06, music 03 lo-fi or 06 emotional.

## 02 Energetic

**Status:** ready

Fast and upbeat, with weight on every key word.

- English: `af_bella` at 1.12×. Italian: `if_sara` at 1.1×.
- Good for: lists, countdowns, sport, life hacks.
- Pairs well with: captions 02 bold centre or 05 outline pop, music 04 upbeat.

## 03 Storyteller

**Status:** ready

Warm, with pauses that build suspense. Write short sentences and let the full stops do the work.

- English: `bm_fable` at 0.95×. Italian: `im_nicola` at 0.9× (shared speaker).
- Good for: stories, history, mini stories with the mascot.

## 04 Whisper

**Status:** ready

Quiet and close, for mysteries and calm content.

- English: `af_nicole` at 0.9×, a soft, close-to-the-mic speaker. Italian: `if_sara` at 0.88× (shared speaker; softer pace, not a true whisper).
- Good for: mystery, deep sea, space, relaxing content.
- Pairs well with: music 07 mystery or 01 suspense, captions 03 typewriter.

## 05 Deadpan

**Status:** ready

Flat and dry, so the humour lands on the pause.

- English: `am_onyx` at 0.95×. Italian: `im_nicola` at 0.92× (shared speaker).
- Good for: absurd facts, humour, "you're doing it wrong".
- Tip: end on a short sentence on its own line; the pause before it is the joke.

## 06 Warm friendly

**Status:** ready

Like a friend explaining something over coffee.

- English: `af_heart` at 1.0×. Italian: `if_sara` at 1.0×.
- Good for: how it works, life hacks, explainers.

## 07 News anchor

**Status:** ready

Crisp and authoritative, like breaking news.

- English: `am_michael` at 1.05×. Italian: `im_nicola` at 1.05× (shared speaker).
- Good for: tech, business, current events, "nobody talks about this".

## 08 None (text only)

**Status:** ready

No voice-over. The captions carry the video, timed at a comfortable reading pace (about 160 words a minute, longer words held longer, pauses after commas and full stops), with music underneath if the page has a music mood.

- Good for: quotes, kinetic typography, videos watched muted, languages the free voice does not speak.
- Pairs well with: style 12 kinetic typography, captions 02 bold centre or 06 highlight keyword, any music mood but 08.
- The automatic checks skip the voice checks (sync, cut words) for these videos.
