---
name: video-recommend
description: Use when the user has an idea for a short video and asks how to make it, which style, script type, hook, voice, captions, music, ending or length to use, or wants options to choose from before the video is made.
---

# Video recommend

For one idea, offer 2–3 complete combinations from the catalogs that the page allows, each with a sample hook and ending written for this idea, and recommend one. The user picks (or says "you choose"); the pick goes to the video-make skill.

## Running unfaced

Every command runs through this skill's launcher:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/unfaced.mjs" <command>
```

`${CLAUDE_SKILL_DIR}` is the folder this SKILL.md is in. Below, `unfaced <command>` means that line. The first run outside a checkout of unfaced installs the library into `~/.unfaced/` (git and npm needed, about 1 GB, several minutes): tell the user before it starts, and give that command a timeout of at least 10 minutes.

## Steps

1. **Read the page:** `unfaced page <pageDir>`. For each field it shows what is allowed: a fixed number stays as it is, `one of ...` is the list to pick from, `auto` means any ready entry (`unfaced list <kind>`, skipping those marked `(planned)`).
2. **Read the candidates** with `unfaced show <kind> <number>`: script types (what structure fits the idea), hooks (their rules and examples), endings, and the duration presets (`unfaced show duration`, words per length).
3. **Build 2–3 combinations that really differ**, for example one proven and one bolder, or one short loop and one longer story. Each combination has:
   - script type, hook and ending, by number and name;
   - a sample hook line and a sample ending line written for this idea, following that hook's and ending's rules;
   - style, voice, captions and music: the user's one-off choice for this video if they made one, else the page's number when it is fixed (say "page"), otherwise your pick;
   - the target length and its word budget;
   - one line on why it fits this idea.
4. **Recommend one** (mark it ★) and say why in one sentence. Ask the user to pick, change a part, or say "you choose".
5. **Hand over** the chosen combination to the video-make skill. Choices the page leaves open go in the video's `script.md` front matter; the page itself is not changed.

## Output

```markdown
**1 ★ Surprising answer, 30 s**
- Script 06 Surprising answer · Hook 01 Shocking question · Ending 06 Callback to the hook
- Hook: "Why does your cat knead you like bread dough?"
- Ending: "So when your cat kneads you, it's back in the safest place it knows."
- Style 03 (page) · Voice 01 (page) · Captions 01 (page) · Music 05 Playful
- 30 s, about 75 words
- Why: one clear question with a warm, true answer; the callback closes the loop.

**2 Myth or fact, 45 s** ...
```

## Common mistakes

| Mistake | Instead |
|---|---|
| Combinations that differ only in music | Change the structure: script type, hook, ending or length. |
| A planned entry, or one outside the page's list | Only ready entries the page allows, or the user's one-off choice. |
| A look the catalog doesn't have ("anime") | Say there is no such style and build the options from the closest ready ones. |
| Generic sample lines ("Did you know...?") | Write the real hook for this idea, under 12 words. |
| Changing `page.yaml` for this video | Per-video choices go in `script.md`. |
