# Captions

How the spoken words appear on screen. Every caption style keeps text inside the platform safe zone (see `engine/remotion/safeZone.ts`) and never covers the main subject of a scene.

## 01 Word-by-word karaoke

**Status:** ready

The current phrase (up to about 6 words) sits in the lower-middle of the screen. Each word lights up in the palette's accent colour at the moment it is spoken, using the word timings from Whisper. Words not yet spoken are white with a dark outline.

- Good for: any voiced video. The default.
- Avoid when: the voice is `08 None (text only)`; there are no word timings to follow.

## 02 Bold centre

**Status:** planned

Two or three words at a time, very large, in the centre of the screen.

## 03 Typewriter

**Status:** planned

Letters appear one by one as if typed, with a blinking cursor.

## 04 Minimal lower third

**Status:** planned

Small sentence-case subtitles near the bottom, no animation.

## 05 Outline pop

**Status:** planned

Thick outlined words that pop in with a small bounce.

## 06 Highlight keyword

**Status:** planned

The full line is shown; its key word gets a highlight marker behind it.
