# Voices

The narrator's voice type. The free voice is Kokoro, running locally (see `docs/decisions/0001-free-tts.md`); each voice type maps to a Kokoro speaker and speed per language. A paid provider (ElevenLabs) can replace it when its key is set.

| Language | Support |
|---|---|
| English, Italian | First-class: chosen and tested speakers. |
| Spanish, French, Portuguese, Hindi | Best effort: Kokoro's own voice for that language. |
| Others | Not yet in the free voice. |

## 01 Calm documentary

**Status:** ready

Slow, low and clear, like a nature documentary. Lets facts land.

- English: `bm_george` at 0.95× speed.
- Italian: `im_nicola` at 0.95× speed.
- Good for: nature, history, science.

## 02 Energetic

**Status:** planned

Fast and upbeat, with weight on every key word.

## 03 Storyteller

**Status:** planned

Warm, with pauses that build suspense.

## 04 Whisper

**Status:** planned

Quiet and close, for mysteries and calm content.

## 05 Deadpan

**Status:** planned

Flat and dry, so the humour lands on the pause.

## 06 Warm friendly

**Status:** planned

Like a friend explaining something over coffee.

## 07 News anchor

**Status:** planned

Crisp and authoritative, like breaking news.

## 08 None (text only)

**Status:** planned

No voice: the captions and the music carry the video.
