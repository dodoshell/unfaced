---
name: video-package
description: Use when a short video is finished and the user wants it ready to post, or asks for a cover or thumbnail, a caption, hashtags or a title for TikTok, Instagram Reels or YouTube Shorts.
---

# Video package

A finished video still needs what the user pastes when posting. Make the cover (`cover.png`) and the captions, hashtags and title for each platform (`post.md`), in the page's language, next to `video.mp4`. Never post, upload or schedule anything: the user does that.

## Running unfaced

Every command runs through this skill's launcher:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/unfaced.mjs" <command>
```

`${CLAUDE_SKILL_DIR}` is the folder this SKILL.md is in. Below, `unfaced <command>` means that line. The first run outside a checkout of unfaced installs the library into `~/.unfaced/`: tell the user before it starts.

## Steps

1. **Check the video is finished.** The video folder needs `video.mp4` and `plan.json`; if not, make it first (video-make skill). If `review.md` starts with `# Review: FAIL`, tell the user what is open and ask before packaging.
2. **Make the cover:** `unfaced cover <videoDir>` renders one frame without captions, one second into the hook. Open `cover.png` and check it: the hook's text is complete and readable, nothing important sits in the top 220 px or bottom 380 px (the platforms cover them), the mascot is on-model. If not, try another moment with `--at <seconds>` (look at `frames/` to find one), up to three times.
3. **Write `post.md`** following `unfaced docs post`:
   - Read `script.md` (title, hook, sources) and `plan.json` (length: `durationInFrames / fps`) and the page's language from `unfaced page <pageDir>`.
   - One section per platform: TikTok, Instagram Reels, YouTube Shorts, unless the user posts only to some.
   - The first line of every caption is a hook of its own; 3 to 5 hashtags; sources for factual claims.
   - Under `Notes`: which cover to use, and for music 08 (none) a reminder to add a trending sound in the app.
4. **Update `ideas.md`** if the video is listed there: status `made`.
5. **Reply** with the paths of `video.mp4`, `cover.png` and `post.md`, and the TikTok caption so the user can see the tone. Remind them that unfaced doesn't post.

## Common mistakes

| Mistake | Instead |
|---|---|
| Packaging a video whose review failed, silently | Say what is open and ask first. |
| A cover with half the title still animating in | Pick a later moment with `--at`. |
| Captions in English for an Italian page | Write in the page's language; only the platform names and labels stay in English. |
| 20 hashtags | 3 to 5 that fit the niche. |
| Uploading or scheduling the post | Never. Hand over the files. |
