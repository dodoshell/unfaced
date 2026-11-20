---
name: video-ideas
description: Use when the user asks what to post next on a page, wants ideas for reels, carousels or other posts for a niche or brand, a recurring series, or a weekly posting calendar.
---

# Video and post ideas

Ideas for a page come from its niche, what it has already posted and what worked. Give specific, true ideas, each as a reel, a carousel or a story, that fit the page's catalog choices, group the good ones into recurring series, and lay them out on a calendar the user can follow. Everything is saved in the page's `ideas.md` so the next session continues from it.

## Running unfaced

Every command runs through this skill's launcher:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/unfaced.mjs" <command>
```

`${CLAUDE_SKILL_DIR}` is the folder this SKILL.md is in. Below, `unfaced <command>` means that line. The first run outside a checkout of unfaced installs the library into `~/.unfaced/` (git and npm needed, about 1 GB, several minutes): tell the user before it starts, and give that command a timeout of at least 10 minutes.

## Steps

1. **Read the page.** `unfaced page <pageDir>` for the niche, language, brand and choices. Check what the page can make: posts only in a style that can draw them (`unfaced list style` shows `(posts)`), reels only when the page has a video style that is ready. A page on style 13 alone has no ready video style: propose carousels and stories only, and offer to add a reel style (page-setup skill, `style: { posts, videos }`). A page on styles 1 to 12 gets reels only; offer a post style for carousels. List the titles already made (`title:` in `videos/*/script.md`) and the ideas already in `ideas.md`, so nothing repeats. If `results.md` exists, note which videos did best (highest average watched) and lean towards what they share.
2. **Write the ideas** (10 unless the user asks for another number). Each idea is:
   - a working title in the page's language;
   - the one surprising fact or angle that carries it, in a sentence;
   - a script type and a hook type the page allows, by number and name (`unfaced list script`, `unfaced list hook`; a page list or `auto` limits the choice);
   - the format: `reel`, `carousel` or `story`, with the reason it fits in the "Why" column (a process or a list of tips suits a carousel; a surprising fact told in motion suits a reel; a time-limited offer suits a story). For a carousel or story, name a post type instead of a script type (`unfaced list post-type`; the page's `post_type` limits the choice) and give no hook;
   - why it should work, in a few words.
3. **Check the facts.** Every idea must rest on something true. If you can search the web, confirm the core fact of each idea and note one source. If you can't, mark the idea `check before scripting`, and don't name studies or papers from memory, not even as leads to look up. Drop ideas built on myths, unless the video is about busting the myth (script 03 myth or fact).
4. **Propose 2–3 series**: a name, the format (a script type and a fixed opening phrase), how often, and five episode titles. A series gives viewers a reason to follow.
5. **Lay out a calendar** for the next week from today's date: how often the user wants to post (ask once if you don't know; suggest 4–7 a week), mixing reels, carousels and stories (only the formats the page can make) as well as series episodes and one-off ideas, and not putting two videos of the same script type, or two posts of the same type, on consecutive days.
6. **Save to `<pageDir>/ideas.md`** in the format below, adding a dated section; keep earlier sections. Then reply with a short summary and offer to make the first one (video-make skill for a reel; post-make skill for a carousel or story).

## ideas.md

```markdown
## 2026-11-14

### Ideas

| # | Title | Format | Angle | Script or post type | Hook | Why | Status |
|---|---|---|---|---|---|---|---|
| 1 | Why cats knead blankets | reel | Kittens knead to get milk flowing; adults keep the habit when they feel safe. | 06 Surprising answer | 01 Shocking question | Every cat owner has seen it, and the answer lands in seconds. | idea |
| 2 | 5 signs your cat trusts you | carousel | One sign per slide, each with what the cat does. | Post type 01 Tips and mistakes | n/a | A list people save and send to friends. | idea |

Sources: 1. ASPCA, "Why does my cat knead?"

### Series

**Cat myths, busted** · myth or fact (03), opens with "Myth or fact:" · twice a week
1. Cats always land on their feet
2. ...

### Calendar

| Day | Date | Format | Idea |
|---|---|---|---|
| Mon | 2026-11-16 | reel | Idea 1 |
| Wed | 2026-11-18 | carousel | Idea 2 |
```

`Status` moves through `idea`, `scripted`, `made`, `posted`: video-make sets `scripted` when the user approves the script and `made` when it hands the video over; `posted` follows when the user says the video is out, or when page-results gets numbers for it. Posts use the same statuses.

## Common mistakes

| Mistake | Instead |
|---|---|
| Vague topics ("cat facts") | One surprising fact or angle per idea. |
| A carousel in a style that only makes videos, or a reel on a page with no ready video style | Check what the page can make first; propose another style or only the formats it can do. |
| A script or hook type the page doesn't allow | Use only the page's numbers, or ready ones when it says `auto`. |
| Unchecked "facts" | Confirm with a source, or mark `check before scripting`. |
| Repeating a video the page already has | Read `videos/` and `ideas.md` first. |
| Reusing an earlier idea as an episode of a new series | Build new series from new ideas only. |
| Overwriting `ideas.md` | Add a dated section. |
