---
type: llm
focus:
  source: file
  path: pages/curious-cats/videos/cats-and-milk/review.md
---

This is a review.md written by an independent reviewer for a 32-second cat-facts video. The video's check.json had one error (captions 4 frames behind the voice at "lactase", at 14.1 s) and one warning (loudness -19.2 LUFS, at 0 s).

PASS if all of these hold:
- The first line is "# Review: FAIL".
- Both check.json findings appear as issues: the sync problem as an `error` near 00:14 and the loudness as a `warning` (both in the Audio category).
- Every issue is one line in the form "severity · mm:ss.s · category · what is wrong · how to fix it".
- "What works", if present, has at most three lines.

FAIL if the verdict is PASS, the sync error is missing or marked as a warning, or issues have no time stamps.
