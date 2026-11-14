# Captions

How the spoken words appear on screen. Every caption style draws inside its own box in the lower part of the frame (`CAPTION_STYLES` in `engine/remotion/core/captionLayout.ts`), always inside the platform safe zone, and `unfaced check` tests the style's text boxes against that box. Captions follow the word timings of the voice-over, so they stay in sync with it.

Colours come from the page palette: the accent or highlight colour marks the spoken or key word, the ink colour outlines the text.

## 01 Word-by-word karaoke

**Status:** ready

The current phrase (up to 5 words) sits in the lower middle of the screen. Each word lights up in the highlight colour at the moment it is spoken. Words not yet spoken are white with a dark outline.

- Good for: any voiced video. The default.
- Avoid when: the visuals already have a lot of text.

## 02 Bold centre

**Status:** ready

Up to three words at a time, in very large capitals with a heavy outline, popping in at the start of each phrase.

- Good for: punchy edits, bold claims, countdowns.
- Avoid when: the voice is slow and calm; the big type fights it.

## 03 Typewriter

**Status:** ready

Up to six words on a dark card. Letters appear one by one while each word is spoken, with a blinking cursor in the accent colour.

- Good for: mystery, tech, history, "breaking" facts.
- Avoid when: the voice is very fast; the typing can't keep up visually.

## 04 Minimal lower third

**Status:** ready

Small sentence-case subtitles on a soft dark band near the bottom, up to eight words, no animation.

- Good for: busy visuals, calm content, kinetic typography styles where the scene already carries the words.
- Avoid when: viewers watch muted on small phones; the text is small.

## 05 Outline pop

**Status:** ready

Up to four thick outlined words. Each word pops in with a bounce as it is spoken; the word being spoken is in the highlight colour.

- Good for: kids, humour, cartoon styles.
- Avoid when: the tone is serious or emotional.

## 06 Highlight keyword

**Status:** ready

The full phrase (up to six words) is shown at once; its key word (the longest one) sits on a highlighter mark that sweeps in.

- Good for: explainers, education, how it works.
- Avoid when: phrases are very short; there is nothing to pick out.
