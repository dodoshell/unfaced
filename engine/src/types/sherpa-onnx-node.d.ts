// Minimal typings for the parts of sherpa-onnx-node 1.x that unfaced uses (the package ships none).
declare module "sherpa-onnx-node" {
  export interface KokoroModelConfig {
    model: string;
    voices: string;
    tokens: string;
    dataDir: string;
    lexicon?: string;
    lang?: string;
  }

  export interface OfflineTtsConfig {
    model: { kokoro: KokoroModelConfig; numThreads?: number; provider?: "cpu"; debug?: boolean };
    maxNumSentences?: number;
  }

  export interface GeneratedAudio {
    samples: Float32Array;
    sampleRate: number;
  }

  export class OfflineTts {
    constructor(config: OfflineTtsConfig);
    readonly numSpeakers: number;
    readonly sampleRate: number;
    generate(request: { text: string; sid: number; speed: number }): GeneratedAudio;
  }

  export function writeWave(path: string, audio: GeneratedAudio): void;

  const sherpa: { OfflineTts: typeof OfflineTts; writeWave: typeof writeWave };
  export default sherpa;
}
