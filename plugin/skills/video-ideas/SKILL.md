---
name: video-ideas
description: Use when the user asks what to post next on a faceless page, wants video ideas or topics for a niche, a recurring series, or a weekly posting calendar.
---

# Video ideas

Ideas for a page come from its niche, what it has already posted and what worked. Give specific, true, filmable ideas that fit the page's catalog choices, group the good ones into recurring series, and lay them out on a calendar the user can follow. Everything is saved in the page's `ideas.md` so the next session continues from it.

## Running unfaced

Every command runs through this skill's launcher:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/unfaced.mjs" <command>
```

`${CLAUDE_SKILL_DIR}` is the folder this SKILL.md is in. Below, `unfaced <command>` means that line. The first run outside a checkout of unfaced installs the library into `~/.unfaced/` (git and npm needed, about 1 GB, several minutes): tell the user before it starts, and give that command a timeout of at least 10 minutes.

## Steps

1. **Read the page.** `unfaced page <pageDir>` for the niche, language and choices. List the titles already made (`title:` in `videos/*/script.md`) and the ideas already in `ideas.md`, so nothing repeats. If `results.md` exists, note which videos did best (highest average watched) and lean towards what they share.
2. **Write the ideas** (10 unless the user asks for another number). Each idea is:
   - a working title in the page's language;
   - the one surprising fact or angle that carries it, in a sentence;
   - a script type and a hook type the page allows, by number and name (`unfaced list script`, `unfaced list hook`; a page list or `auto` limits the choice);
   - why it should work, in a few words.
3. **Check the facts.** Every idea must rest on something true. If you can search the web, confirm the core fact of each idea and note one source. If you can't, mark the idea `check before scripting`. Drop ideas built on myths, unless the video is about busting the myth (script 03 myth or fact).
4. **Propose 2–3 series**: a name, the format (a script type and a fixed opening phrase), how often, and five episode titles. A series gives viewers a reason to follow.
5. **Lay out a calendar** for the next week from today's date: how often the user wants to post (ask once if you don't know; suggest 4–7 a week), mixing series episodes with one-off ideas, and not putting two videos of the same script type on consecutive days.
6. **Save to `<pageDir>/ideas.md`** in the format below, adding a dated section; keep earlier sections. Then reply with a short summary and offer to make the first one (video-make skill).

## ideas.md

```markdown
## 2026-11-14

### Ideas

| # | Title | Angle | Script | Hook | Status |
|---|---|---|---|---|---|
| 1 | Why cats knead blankets | Kittens knead to get milk flowing; adults keep the habit when they feel safe. | 06 Surprising answer | 01 Shocking question | idea |

Sources: 1. ASPCA, "Why does my cat knead?"

### Series

**Cat myths, busted** · myth or fact (03), opens with "Myth or fact:" · twice a week
1. Cats always land on their feet
2. ...

### Calendar

| Day | Date | Video |
|---|---|---|
| Mon | 2026-11-16 | Idea 1 |
```

`Status` moves through `idea`, `scripted`, `made`, `posted`: video-make sets `scripted` when the user approves the script and `made` when it hands the video over; `posted` follows when the user says the video is out, or when page-results gets numbers for it.

## Common mistakes

| Mistake | Instead |
|---|---|
| Vague topics ("cat facts") | One surprising fact or angle per idea. |
| A script or hook type the page doesn't allow | Use only the page's numbers, or ready ones when it says `auto`. |
| Unchecked "facts" | Confirm with a source, or mark `check before scripting`. |
| Repeating a video the page already has | Read `videos/` and `ideas.md` first. |
| Overwriting `ideas.md` | Add a dated section. |
