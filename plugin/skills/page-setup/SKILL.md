---
name: page-setup
description: Use when the user wants to start a new faceless page or channel (TikTok, Instagram Reels, YouTube Shorts), change an existing page's style, voice, captions, music or other settings, or give a page a recurring mascot character.
---

# Page setup

A page is a folder with a `page.yaml` profile; every video of the page follows it, which is what makes the page recognisable. Turn what the user wants into a valid profile built from the numbered catalogs, explain each pick in a line, and, if they want one, a mascot that looks the same in every video.

## Running unfaced

Every command runs through this skill's launcher:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/unfaced.mjs" <command>
```

`${CLAUDE_SKILL_DIR}` is the folder this SKILL.md is in. Below, `unfaced <command>` means that line. The first run outside a checkout of unfaced installs the library into `~/.unfaced/` (git and npm needed, about 1 GB, several minutes): tell the user before it starts, and give that command a timeout of at least 10 minutes.

## New page

1. **Learn the page.** In one message, ask at most four things: the niche and who it is for, the language of the videos, the mood (calm, funny, dramatic, cosy...), and whether they want a recurring mascot. Add: "or say 'you choose'". If they say so, decide everything yourself and say what you decided.
2. **Read the format:** `unfaced docs page`. The folder is `pages/<slug>/` in the current project unless the user names another.
3. **Pick every choice** (style, script, hook, voice, captions, music, ending, duration). For each kind, run `unfaced list <kind>` and read the candidates with `unfaced show <kind> <number>` (its "Good for" and "Pairs well with" lines). Then:
   - Fixed numbers for what makes the page recognisable: `style`, `voice`, `captions`, usually `music`.
   - Lists of 2–4 numbers where variety helps: `script`, `hook`, `ending`. Use `auto` only if the user wants maximum variety.
   - Only `ready` entries can be fixed numbers or list items; never one marked `(planned)`.
   - A language other than English or Italian: check the support table in `unfaced show voice`, and say which voices are best effort.
4. **Show the picks** as a numbered table (field, number, name, one-line reason) and let the user change any of them before you write.
5. **Write `page.yaml`** with a comment naming each choice (`style: 3   # Flat cartoon`).
6. **Validate:** `unfaced page <pageDir>` must print the profile. Fix every error it reports.
7. **Mascot**, if wanted: see below.
8. **Finish** with the summary `unfaced page` printed and the next steps: video ideas (video-ideas skill) or a first video (video-make skill).

## Mascot

1. Read `unfaced docs mascot`.
2. Agree on name, species (cat, dog, fox, bear, bunny, bird, person, blob), colours, accessories and personality, or choose them to fit the niche and the style's palette (`unfaced show style <n>`).
3. Write `brand/mascot/mascot.json` and `brand/mascot/mascot.md`, and set `mascot:` in `page.yaml` to a one-line description.
4. Render the reference sheet: `unfaced mascot <pageDir>`. Open `brand/mascot/reference.png` and check it against `mascot.md`: the colours are the ones described, every accessory is visible, the character stands out from the style's background and still reads at a small size. Fix `mascot.json` and render again, up to three times.
5. Show the user the reference sheet's path and the name, look and personality in two lines.

## Changing a page

- Change only what the user asks. Run `unfaced page <pageDir>` before and after.
- New style or mascot colours: render the reference sheet again (`unfaced mascot <pageDir>`) and look at it.
- Videos already made keep their files; tell the user that making a video again applies the new profile to it.
- A one-off change for a single video ("style 12 this time") does not belong in `page.yaml`: it goes in that video's `script.md` (video-make skill).

## Rules

- Never put an API key in `page.yaml`. Paid providers read their keys from a `.env` file; `unfaced page` rejects a profile with a key in it.
- Everything is free by default: `providers` can be left out.
- Never post anything anywhere. unfaced makes files; the user posts.

## Common mistakes

| Mistake | Instead |
|---|---|
| Fixing a planned entry (`style: 7` while 07 is planned) | Pick a ready one; tell the user the planned one is coming. |
| `auto` everywhere | Fixed style, voice and captions; lists for script, hook and ending. |
| A list with one number (`style: [3]`) | Write the number (`style: 3`). |
| Writing the mascot only in `page.yaml` | The character is `brand/mascot/mascot.json`; `page.yaml` only describes it. |
| Not looking at `reference.png` | Open it and compare it with `mascot.md` before saying it's done. |
