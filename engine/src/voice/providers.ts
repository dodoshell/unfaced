/** The voice providers a page can name in `providers.voice`; "kokoro" is another name for the free voice. */
export const VOICE_PROVIDERS = ["free", "kokoro", "elevenlabs"] as const;

export const voiceProviderId = (name: string): string => (name === "kokoro" ? "free" : name);
