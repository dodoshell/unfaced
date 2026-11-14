---
name: video-make
description: Use when the user asks for a short video on a topic for a faceless page (TikTok, Instagram Reels, YouTube Shorts), wants a script turned into a finished vertical video, or wants a made video fixed and made again.
---

# Video make

From an idea to a reviewed MP4 in the page's folder. The script is the product: research it, write it, and get the user's approval before any voice is recorded or frame rendered. Then make the video, give every visual note a scene, check it, have it reviewed by an independent agent, fix, and hand it over.

## Running unfaced

Every command runs through this skill's launcher:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/unfaced.mjs" <command>
```

`${CLAUDE_SKILL_DIR}` is the folder this SKILL.md is in. Below, `unfaced <command>` means that line. The first run outside a checkout of unfaced installs the library into `~/.unfaced/` (git and npm needed, about 1 GB, several minutes): tell the user before it starts, and give that command a timeout of at least 10 minutes.

## The flow

1. **Page and folder.** Find the page (the folder with `page.yaml`) and run `unfaced page <pageDir>`. The video goes in `<pageDir>/videos/<slug>/`, the slug made from the title (lowercase, hyphens). If that folder already has a `script.md`, ask whether to rework it or start a new video.
2. **Choices.** Use the combination the user picked (video-recommend skill), if any, and any one-off choice the user asked for this video ("style 12 this time"). Otherwise a fixed number in the page is used as is; for every field the page leaves as a list or `auto`, pick the best fit for this idea (`unfaced show <kind> <number>`) and give the user one line of reason per pick.
3. **Research.** Collect the facts the video rests on. With web access, confirm each claim in a source you actually opened and read (an encyclopedia, a university, a journal, an expert body). Without web access, use only well-established facts and name the claims the user should check. Never invent a number, a quote or a study.
4. **Write `script.md`.** Read `unfaced docs script`, then the script type (`unfaced show script <n>`), the hook (`unfaced show hook <n>`), the ending (`unfaced show ending <n>`) and the pacing table (`unfaced show duration`).
   - Front matter: `title`, `script_type`, `hook`, `ending`, `sources`, plus `style`, `voice`, `captions` or `music` for every pick the page left open and every one-off choice for this video.
   - `sources` lists only what you read in step 3.
   - Write in the page's language, for the ear, and stay inside the word budget for the page's duration.
   - Add a `> visual:` line to each beat that should show something specific. Every visual you write here will need its own scene in step 6.
5. **Approval: stop.** Show the user the whole script, the choices with their reasons, the word count and estimated length, and the sources. Ask them to approve or change it, and end your turn. See "The approval stop" below. Once they approve, set the video's status in `ideas.md` to `scripted` if it is listed there.
6. **Scenes.** The style's own scenes show text only: the hook as a title, each body beat as a fact or a list, the ending as an outro, with the mascot. They do not draw `> visual:` notes. For every beat with a visual, write its scene in `scenes/` following `unfaced docs scenes` (shapes, the mascot or other characters with `Character`, simple diagrams), and declare its text boxes in `scenes/boxes.json`. A hook scene keeps the hook's words on screen from its first frame (the preview): draw `<StyleScene>` and put the visual around it. If a visual needs a real photo or footage, write a prompt for it in `inbox/PROMPTS.md` (format in `unfaced docs scenes`), run `unfaced generate <videoDir>` (it makes the file when the page has an image or clip provider; when that provider is paid, tell the user how many files it will make and wait for their OK first), ask the user to drop any file still missing into `inbox/`, draw a stand-in until it arrives, and check what arrives with `unfaced inbox <videoDir>`.
7. **Make:** `unfaced make <videoDir>` (a few minutes; give it a timeout of at least 10 minutes). Read every line it prints.
   - A duration warning: shorten or lengthen the script.
   - A failed check (exit code 1): fix it (see "Fixing checks"), then make again.
   - Any change to the spoken words after approval: show the user the old and new line and why, and wait for their OK.
   - If the user wants their own voice (or one made elsewhere), they record the approved script and drop it into `inbox/` as `voice.wav` or `voice.mp3`; make then uses it instead of recording one.
8. **Frames:** `unfaced frames <videoDir> --every 1s`. Open every frame. Fix what you see before asking for a review.
9. **Independent review.** Launch the `video-reviewer` agent (in Claude Code: `unfaced:video-reviewer`). Give it only the video folder's path and the command line that runs unfaced. Don't tell it what you changed or what you think is wrong; its fresh eyes are the point. It writes `review.md` (format: `unfaced docs review`). If you can't launch a subagent, don't review it yourself: ask the user to start a fresh session, one that hasn't seen this conversation, and give it the instructions in `${CLAUDE_SKILL_DIR}/references/video-reviewer.md`, the video folder's path and the command line that runs unfaced.
10. **Fix and repeat.** If `review.md` says FAIL, fix every `error`, make the video again, render the frames again and ask for a new review. At most three rounds; after the third FAIL, stop and show the user what is left. Fix warnings that are cheap; list the others.
11. **Hand over:** the path of `video.mp4`, its length, the choices, the review's verdict and any open warnings. If the video is in `ideas.md`, set its status to `made`. Offer the video-package skill for the cover and captions.

## The approval stop

No voice is recorded and no frame is rendered before the user approves the script. Rendering a script the user would have changed costs minutes and a second recording; one message costs seconds.

The only exception: the user said in this conversation to skip approval ("don't ask, just make it"). Then say that you are skipping it, and carry on.

| Thought | Reality |
|---|---|
| "They want it tonight, asking slows them down" | Approval is one message. A wrong video slows them down more. |
| "The script is short and obviously fine" | Short scripts still carry facts and a tone the user owns. Ask. |
| "I'll show it with the finished video" | Then every change means recording and rendering again. |
| "The page's lists already allow these choices" | The page allows them; the user hasn't seen this combination. Show it. |
| "I only reworded a line after approval to pass a check" | Show the user the change. They approved words, not intentions. |

## Fixing checks

| Check | What to do |
|---|---|
| `overlap`, `safe-zone` | Shorten the beat's text, split the beat, or move the text in your scene and update `scenes/boxes.json`. |
| `sync` ("captions are N frames behind the voice at 'word'") | Open `timing.json` near that word: whisper may have misheard it. Write numbers, names and symbols the way they are said, or rephrase the line; show the user the change. |
| `cut-word` | Don't end on a word that runs into the cut; make again (the voice is re-recorded when the words change). |
| `frozen-frame`, `black-frame` | A scene of yours stops animating or draws nothing: fix the scene. |
| `loudness`, `clipping` | Make again; if it persists, run `unfaced doctor` and tell the user. |

## Common mistakes

| Mistake | Instead |
|---|---|
| Rendering before the user approved the script | Stop at step 5 and end your turn. |
| A source you couldn't open in `sources` | List only what you read. |
| `> visual:` notes with no scene | Every visual needs a scene in `scenes/`, or drop the note. |
| A hook scene with no words on its first frame | Draw `<StyleScene>` in it; the preview must show the hook. |
| Looking at a few frames, or at frames every 4 seconds | Every frame at 1 s, then the independent review. |
| Reviewing your own video and calling it reviewed | The `video-reviewer` agent reviews; you fix. |
| Posting the video | Never. Hand over the files. |
