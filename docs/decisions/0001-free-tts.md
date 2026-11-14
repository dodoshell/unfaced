# 0001: Free text-to-speech engine

- Status: accepted
- Date: 2026-11-14

## Context

The free baseline needs a local, offline voice that runs on Windows, macOS and Linux without a GPU, from Node, in English and Italian at launch (design §6.2, §6.6). The videos it voices may be used commercially, so the model weights and the voice's training data must allow that.

## What we tried

The same two sentences on each candidate, on a Windows 11 laptop CPU (no GPU):

- EN: "Why do cats purr? Scientists still argue about it, but the answer may surprise you."
- IT: "Perché i gatti fanno le fusa? È una domanda più difficile di quanto sembri."

Quality was checked by ear and by a round trip: each WAV was transcribed with Whisper base and compared with the input text.

| Candidate | Install on Windows | Download | Load | Synthesis (one sentence) | EN round trip | IT round trip | Weights / data licence |
|---|---|---|---|---|---|---|---|
| kokoro-js 1.2.1 (Kokoro-82M, q8) | `npm i kokoro-js`; pulls onnxruntime-node, sharp, transformers.js | 89 MB | 12 s first run | 3.4 s | exact | unusable: English phonemes only ("Per se hai gatti fano la fusa...") | Apache-2.0 |
| Piper `it_IT-paola-medium` / `en_US-lessac-medium` via sherpa-onnx-node 1.13.8 | `npm i sherpa-onnx-node@1.13.8` (prebuilt native addon) | 65 MB per voice | 0.5 s | 0.2 s | exact | one slip ("Per che gatti...") | paola: CC0 data but fine-tuned from lessac; lessac: Blizzard 2013 licence, restricted |
| Kokoro-82M v1.0 int8 multi-language via sherpa-onnx-node 1.13.8 | same package as above | 127 MB once | 0.7–1 s per language | 4 s | exact | exact, with both Italian voices | Apache-2.0 |

Notes:

- sherpa-onnx-node 2.x removed the bundled espeak-ng phonemizer, so Piper and Kokoro voices need an external phonemizer there. 1.13.8 is the last 1.x release and still bundles it.
- Kokoro's language is fixed when the model loads (`lang`); English reads best with no `lang` and the English lexicon, Italian with `lang: "it"`. One loaded instance per language.
- Piper voices with clean commercial licences exist for English (`en_US-ljspeech`, public domain; `en_GB-alba`, CC BY 4.0) but not at good quality for Italian (`it_IT-riccardo-x_low` is low quality).

## Decision

The free voice is **Kokoro-82M v1.0 (int8, multi-language) running on sherpa-onnx-node 1.13.8**, for every language. The model is downloaded once into `~/.unfaced/models/` (or `$UNFACED_HOME/models/`) and checked against a SHA-256.

- English and Italian are first-class: each catalog voice type maps to a chosen Kokoro speaker and speed.
- Spanish, French, Portuguese and Hindi are best effort: Kokoro has native voices for them, used as the generic voice, untested at launch.
- Other languages are not supported by the free voice yet; the error says so and names the supported ones.

## Why

- One engine and one model cover both launch languages with exact round trips.
- Apache-2.0 weights trained on permissively licensed data: safe for commercial pages.
- Pure Node install with a prebuilt addon; no Python.
- kokoro-js is ruled out by Italian; Piper is faster but its good Italian voice has unclear licensing.

## Costs and follow-ups

- Synthesis runs at roughly real time on a laptop CPU (a 30-second voice-over takes about 25–30 seconds). Acceptable for a video pipeline; cache by text hash (Task 10).
- We pin a 1.x release that will not get new features. If it stops installing on a new Node version, the way out is sherpa-onnx 2.x with an external phonemizer.
- espeak-ng (GPL-3.0) is compiled into the sherpa-onnx 1.x addon. unfaced does not ship it; npm installs it as a dependency. Recorded in `LICENSES/README.md`.
- Piper stays the planned route for languages Kokoro lacks, through the same runtime.
