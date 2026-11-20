/** The words a slide's frame shows: "swipe →" and the counter's "of". */
export interface FrameWords {
  swipe: string;
  of: string;
}

const WORDS: Record<string, FrameWords> = {
  en: { swipe: "swipe", of: "of" },
  it: { swipe: "scorri", of: "di" },
  es: { swipe: "desliza", of: "de" },
  fr: { swipe: "glisse", of: "sur" },
  pt: { swipe: "deslize", of: "de" },
  "pt-BR": { swipe: "arraste", of: "de" },
  hi: { swipe: "स्वाइप करें", of: "में से" },
};

/** The frame's words in `language` (a code such as it or pt-BR); English, with `fallback`, for a language without them. */
export function frameWords(language: string): { words: FrameWords; fallback: boolean } {
  const words = WORDS[language] ?? WORDS[language.split("-")[0]!];
  return words ? { words, fallback: false } : { words: WORDS.en!, fallback: true };
}
