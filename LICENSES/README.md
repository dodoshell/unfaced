# Third-party licences

unfaced's own code and the assets we create are MIT (see `../LICENSE`).
Every third-party file shipped in this repository (fonts, music, sound effects, models) is listed here with its source and licence.

| File | Source | Licence |
|---|---|---|
| `engine/remotion/fonts/Fredoka.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/fredoka), The Fredoka Project Authors | SIL OFL 1.1 (`engine/remotion/fonts/OFL-Fredoka.txt`) |
| `catalog/styles/01-soft-3d/fonts/Nunito.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/nunito), The Nunito Project Authors | SIL OFL 1.1 (`catalog/styles/01-soft-3d/fonts/OFL-Nunito.txt`) |
| `catalog/styles/02-90s-low-poly/fonts/PressStart2P.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/pressstart2p), The Press Start 2P Project Authors | SIL OFL 1.1 (`catalog/styles/02-90s-low-poly/fonts/OFL-PressStart2P.txt`) |
| `catalog/styles/02-90s-low-poly/fonts/Rubik.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/rubik), The Rubik Project Authors | SIL OFL 1.1 (`catalog/styles/02-90s-low-poly/fonts/OFL-Rubik.txt`) |
| `catalog/styles/04-line-art/fonts/Inter.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/inter), The Inter Project Authors | SIL OFL 1.1 (`catalog/styles/04-line-art/fonts/OFL-Inter.txt`) |
| `catalog/styles/05-ink-silhouette/fonts/Cinzel.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/cinzel), The Cinzel Project Authors | SIL OFL 1.1 (`catalog/styles/05-ink-silhouette/fonts/OFL-Cinzel.txt`) |
| `catalog/styles/06-chalkboard/fonts/Caveat.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/caveat), The Caveat Project Authors | SIL OFL 1.1 (`catalog/styles/06-chalkboard/fonts/OFL-Caveat.txt`) |
| `catalog/styles/07-paper-cut-out/fonts/PatrickHand.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/patrickhand), Patrick Wagesreiter | SIL OFL 1.1 (`catalog/styles/07-paper-cut-out/fonts/OFL-PatrickHand.txt`) |
| `catalog/styles/08-vintage-comic/fonts/Bangers.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/bangers), The Bangers Project Authors | SIL OFL 1.1 (`catalog/styles/08-vintage-comic/fonts/OFL-Bangers.txt`) |
| `catalog/styles/09-16-bit-pixel-art/fonts/PixelifySans.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/pixelifysans), The Pixelify Sans Project Authors | SIL OFL 1.1 (`catalog/styles/09-16-bit-pixel-art/fonts/OFL-PixelifySans.txt`) |
| `catalog/styles/10-neon-synthwave/fonts/Monoton.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/monoton), Vernon Adams | SIL OFL 1.1 (`catalog/styles/10-neon-synthwave/fonts/OFL-Monoton.txt`) |
| `catalog/styles/10-neon-synthwave/fonts/Orbitron.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/orbitron), The Orbitron Project Authors | SIL OFL 1.1 (`catalog/styles/10-neon-synthwave/fonts/OFL-Orbitron.txt`) |
| `catalog/styles/11-watercolour/fonts/ShadowsIntoLightTwo.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/shadowsintolighttwo), Kimberly Geswein | SIL OFL 1.1 (`catalog/styles/11-watercolour/fonts/OFL-ShadowsIntoLightTwo.txt`) |
| `catalog/styles/12-kinetic-typography/fonts/Anton.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/anton), The Anton Project Authors | SIL OFL 1.1 (`catalog/styles/12-kinetic-typography/fonts/OFL-Anton.txt`) |
| `tests/fixtures/fonts/Condensed-Anton.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/anton), The Anton Project Authors | SIL OFL 1.1 (`tests/fixtures/fonts/OFL-Anton.txt`) |
| `tests/fixtures/fonts/Wide-Orbitron.ttf` | [google/fonts](https://github.com/google/fonts/tree/main/ofl/orbitron), The Orbitron Project Authors | SIL OFL 1.1 (`tests/fixtures/fonts/OFL-Orbitron.txt`) |

## Downloaded at first use (not in this repository)

| What | Source | Licence |
|---|---|---|
| Kokoro-82M v1.0 int8 voice model (`~/.unfaced/models/kokoro-int8-multi-lang-v1_0/`) | [k2-fsa/sherpa-onnx tts-models](https://github.com/k2-fsa/sherpa-onnx/releases/tag/tts-models), from [hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) | Apache-2.0 |
| whisper.cpp 1.5.5 (`~/.unfaced/whisper/`) | [ggml-org/whisper.cpp](https://github.com/ggml-org/whisper.cpp), installed by `@remotion/install-whisper-cpp` | MIT |
| Whisper `base` and `base.en` models | [OpenAI Whisper](https://github.com/openai/whisper), ggml conversion | MIT |
| sherpa-onnx-node 1.13.8 (npm dependency) | [k2-fsa/sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx) | Apache-2.0; its native addon includes espeak-ng (GPL-3.0) |
