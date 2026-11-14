# Voices

The narrator's voice type. The free voice is Kokoro, running locally (see `docs/decisions/0001-free-tts.md`); each voice type maps to a Kokoro speaker and speed per language (`engine/src/voice/kokoro.ts`). A paid provider (ElevenLabs) replaces it when the page asks for it and its key is in `.env`.

With `providers.voice: elevenlabs` and `ELEVENLABS_API_KEY` set, each voice type is one ElevenLabs voice at a set speed, listed under it below (`engine/src/voice/elevenlabs.ts`). Its multilingual model (`eleven_multilingual_v2`) reads the script in any language it supports with that same voice, so the language table below is for the free voice only. When an ElevenLabs call fails (the key refused, the quota used up, no connection), the free voice reads the script instead and `unfaced make` says why; the next `make` tries ElevenLabs again.

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
- ElevenLabs: Eldrin - Crisp British Baritone (`6WwXjDDEMyNmFG95zycZ`) at 0.95×.
- Good for: nature, history, science.
- Pairs well with: captions 01 or 06, music 03 lo-fi or 06 emotional.

## 02 Energetic

**Status:** ready

Fast and upbeat, with weight on every key word.

- English: `af_bella` at 1.12×. Italian: `if_sara` at 1.1×.
- ElevenLabs: Jade - Upbeat and Natural (`g7LVvkPWALzPxOQbF6OE`) at 1.1×.
- Good for: lists, countdowns, sport, life hacks.
- Pairs well with: captions 02 bold centre or 05 outline pop, music 04 upbeat.

## 03 Storyteller

**Status:** ready

Warm, with pauses that build suspense. Write short sentences and let the full stops do the work.

- English: `bm_fable` at 0.95×. Italian: `im_nicola` at 0.9× (shared speaker).
- ElevenLabs: Darian - Warm Grounded Storyteller (`gOupLcAkjEnguROwi4oS`) at 0.95×.
- Good for: stories, history, mini stories with the mascot.

## 04 Whisper

**Status:** ready

Quiet and close, for mysteries and calm content.

- English: `af_nicole` at 0.9×, a soft, close-to-the-mic speaker. Italian: `if_sara` at 0.88× (shared speaker; softer pace, not a true whisper).
- ElevenLabs: Talia - Warm Soft Guide (`OZ0L6eISlOejga3XjDFt`) at 0.9×.
- Good for: mystery, deep sea, space, relaxing content.
- Pairs well with: music 07 mystery or 01 suspense, captions 03 typewriter.

## 05 Deadpan

**Status:** ready

Flat and dry, so the humour lands on the pause.

- English: `am_onyx` at 0.95×. Italian: `im_nicola` at 0.92× (shared speaker).
- ElevenLabs: Baxter - Dry Calm Aussie (`jSuBIjxMKhqIfb0wCK1F`) at 0.95×.
- Good for: absurd facts, humour, "you're doing it wrong".
- Tip: end on a short sentence on its own line; the pause before it is the joke.

## 06 Warm friendly

**Status:** ready

Like a friend explaining something over coffee.

- English: `af_heart` at 1.0×. Italian: `if_sara` at 1.0×.
- ElevenLabs: Maisie - Friendly Casual Neighbor (`QtY3JBOUKEB5xzrRfOKc`) at 1.0×.
- Good for: how it works, life hacks, explainers.

## 07 News anchor

**Status:** ready

Crisp and authoritative, like breaking news.

- English: `am_michael` at 1.05×. Italian: `im_nicola` at 1.05× (shared speaker).
- ElevenLabs: Finley - Articulate Anchor (`fnYMz3F5gMEDGMWcH1ex`) at 1.05×.
- Good for: tech, business, current events, "nobody talks about this".

## 08 None (text only)

**Status:** ready

No voice-over. The captions carry the video, timed at a comfortable reading pace (about 160 words a minute, longer words held longer, pauses after commas and full stops), with music underneath if the page has a music mood.

- Good for: quotes, kinetic typography, videos watched muted, languages the free voice does not speak.
- Pairs well with: style 12 kinetic typography, captions 02 bold centre or 06 highlight keyword, any music mood but 08.
- The automatic checks skip the voice checks (sync, cut words) for these videos.
