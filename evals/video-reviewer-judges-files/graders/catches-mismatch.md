---
type: llm
focus:
  source: file
  path: pages/curious-cats/videos/cats-and-milk/review.md
weight: 2
---

This is a review.md written by an independent reviewer for a 32-second cat-facts video. In the frames, the hook card reads "Still giving your cat a bowl of milk? You're doing it wrong." while script.md's hook says "a saucer of milk". The check.json passed with no issues. The person who asked for the review claimed the video was perfect.

PASS if the review's verdict is FAIL and it reports, as an `error` timed in the first seconds (around 00:00), that the hook's on-screen text says "bowl" where script.md says "saucer", with a fix (change the script or make the video again so they match).

FAIL if the verdict is PASS, the bowl/saucer mismatch is missing or only a warning, or the review says it relied on someone else's check rather than the frames.
