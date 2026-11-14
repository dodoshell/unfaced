export interface VoiceResult {
  wavPath: string;
  durationSec: number;
  /** Id of the provider that actually spoke, after any fallback. */
  provider: string;
}

export interface VoiceProvider {
  id: string;
  isFree: boolean;
  available(env: NodeJS.ProcessEnv): boolean;
  /** `voiceType` is a number from the voice catalog; `language` a code such as "en" or "it". */
  synthesize(text: string, opts: { language: string; voiceType: number; outPath: string }): Promise<VoiceResult>;
}
