# Review format

Every finished video gets two checks before it is handed over:

1. **Automatic checks**: `unfaced check <videoDir>` (also run by `unfaced make`) writes `check.json`: text boxes that overlap or leave the safe zone, captions out of sync with the voice, black or frozen frames, loudness and clipping, words cut at the start or end. Code, no judgement.
2. **Independent review**: the `video-reviewer` agent starts with a fresh context and sees only the video folder's files and the page's profile and mascot, never the conversation that made the video. It judges what code can't and writes `review.md` in the video folder.

## review.md

```markdown
# Review: FAIL

Round 1 · video.mp4 (00:34.2) · reviewed 2026-11-14

## Issues

- error · 00:03.0 · Typo · The title reads "purrr" but script.md says "purr". Fix the hook text in script.md.
- error · 00:12.5 · Mascot · Miso has no glasses in this scene; reference.png always shows them. Add "glasses" back in mascot.json or use the mascot's rig in scenes/b2.
- warning · 00:20.0 · Pacing · Nothing changes on screen from 00:14 to 00:22. Split b3 into two beats or add a visual.

## What works

- The hook is on screen in the first frame and reads in under a second.
```

- The first line is `# Review: PASS` or `# Review: FAIL`. A video fails when it has at least one `error`.
- Every issue is one line: severity (`error` or `warning`), the time as `mm:ss.s`, a category, what is wrong, and how to fix it.
- Categories: `Typo` (on-screen text differs from script.md), `Readability` (too small, too fast, low contrast, covered), `Layout` (overlap, cropped, inside the platform's buttons), `Style` (a frame that breaks the style's STYLE.md), `Mascot` (off-model against reference.png), `Pacing` (dead spots, a beat too long, the ending dragging), `Hook` (the opening doesn't land or isn't on the first frame), `Audio` (from check.json: loudness, sync, cut words), `Facts` (a claim on screen that the script's sources don't support).
- `What works` is optional and short; it keeps a fix from undoing something good.

## The loop

The `video-make` skill fixes the issues, makes the video again and asks for a new review, at most three rounds. After the third FAIL it shows the user what is left instead of trying again. On an agent without subagents, the review runs in a fresh session with the reviewer's instructions.

## A post's review

A made post (`slide-NN.png`, `grid.png`, `post-plan.json`, `check.json`) is reviewed the same way by the `post-reviewer` agent, which writes `review.md` in the post folder. The header and verdict work as above (`# Review: PASS` or `# Review: FAIL`, a failure being at least one `error`). Issues are placed by slide number instead of time, and the round line gives the slide count instead of a length:

```markdown
# Review: FAIL

Round 1 · 7 slides · reviewed 2026-11-14

## Issues

- error · slide 3 · Typo · The title reads "purrr" but slides.md says "purr". Fix the title in slides.md.
- warning · slide 1 · Cover · The hook sits close to the bottom edge of the 3:4 crop. Move it up or shorten it in slides.md.
```

Categories: `Typo`, `Readability`, `Layout`, `Style` (as above, against the style's STYLE.md), `Brand` (handle, logo, fonts, tone, words to avoid), `Cover` (does slide 1 make you swipe, does it survive the 3:4 crop), `Consistency` (the slides match each other), `Facts`, `Checks` (from check.json).
