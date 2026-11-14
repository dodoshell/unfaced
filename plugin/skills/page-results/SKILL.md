---
name: page-results
description: Use when the user shares views, watch time, likes or other numbers for posted short videos, asks why a faceless page is not growing, or wants to know what to change in its videos.
---

# Page results

Numbers only help when they are tied to what each video did differently. Join the page's `results.md` with each video's choices (script type, hook, ending, length, style, voice...), find what the better videos share, and suggest at most three changes, each with its evidence and a way to test it.

## Running unfaced

Every command runs through this skill's launcher:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/unfaced.mjs" <command>
```

`${CLAUDE_SKILL_DIR}` is the folder this SKILL.md is in. Below, `unfaced <command>` means that line. The first run outside a checkout of unfaced installs the library into `~/.unfaced/`: tell the user before it starts.

## Steps

1. **Get the numbers.** Read `<pageDir>/results.md` (format: `unfaced docs results`). If the user gives numbers in chat, add them as rows (one per video and platform, numbers without separators) and show what you added. If there are none, explain which numbers to collect from each platform's insights and stop.
2. **Join and compare.** Run `unfaced results <pageDir>`. It joins every row with what its video was made with (`plan.json`, and the hook from `script.md`), ranks each platform's videos by average watched (seconds converted with the video's length) with shares + saves, follows and comments per view, and gives the median watched of every choice that varies (hook, script type, ending, length, style...). It exits 1 when a row can't be read or names a folder that isn't in `videos/`: fix what its `## Check` section lists and run it again.
3. **Read past the ranking.** Average watched says whether the hook and pacing work; the rates per view say different things (table below). Keep platforms apart.
4. **Judge the signal honestly.** With fewer than 3 videos in a group, or one video far ahead of the rest, say the evidence is thin. Early numbers (less than a week after posting) move a lot. Don't explain differences with choices that didn't vary.
5. **Suggest at most three changes.** For each: what to change (a `page.yaml` field, a writing habit, the posting time), the numbers behind it, what it should improve, and how to test it (for example, "the next 6 videos alternate hook 02 and 04; compare their average watched").
6. **Apply only with consent.** Ask before editing `page.yaml`; after editing, run `unfaced page <pageDir>`. Changes to how scripts are written go to the user as advice, and to `ideas.md` as notes if they agree.
7. **Record** the analysis at the end of `results.md` under `## Notes, <date>`: the changes suggested and which were applied.

## Reading the numbers

| Signal | Usually means |
|---|---|
| Low average watched, normal views | The hook or the first seconds lose people: look at hook type and the first frame. |
| Good watched, few follows | No reason to come back: try series, ending 04 follow for part 2 or 02 cliffhanger. |
| Many comments, few shares | The question works, the content less: keep ending 03, sharpen the facts. |
| Saves high | Useful content: lean into how it works (07) and lists (02). |
| Long videos watched less | Try a shorter duration before changing anything else. |

## Common mistakes

| Mistake | Instead |
|---|---|
| Ten suggestions | At most three, strongest evidence first. |
| Calling a winner from two videos | Say the signal is thin and propose a test. |
| Comparing views across platforms | Keep platforms apart. |
| Editing `page.yaml` without asking | Ask, then validate with `unfaced page`. |
