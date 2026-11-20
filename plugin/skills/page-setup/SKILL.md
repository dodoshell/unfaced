---
name: page-setup
description: Use when the user wants to start a new page or channel (faceless videos, or carousels and other posts for a brand), set up a brand (handle, logo, fonts, colours, tone), bring in an existing page from screenshots, change a page's style, voice, captions, music, formats or other settings, or give a page a recurring mascot character.
---

# Page setup

A page is a folder with a `page.yaml` profile; every video and post of the page follows it, which is what makes the page recognisable. Turn what the user wants into a valid profile built from the numbered catalogs, explain each pick in a line, and, if they want one, a mascot that looks the same in every video. A page can also make still posts (carousels, stories) in a brand's look. Talk in plain conversation, never a form.

## Running unfaced

Every command runs through this skill's launcher:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/unfaced.mjs" <command>
```

`${CLAUDE_SKILL_DIR}` is the folder this SKILL.md is in. Below, `unfaced <command>` means that line. The first run outside a checkout of unfaced installs the library into `~/.unfaced/` (git and npm needed, about 1 GB, several minutes): tell the user before it starts, and give that command a timeout of at least 10 minutes.

## Two ways in

- The user **describes** a page ("a studio that builds websites for shop owners, direct and warm"): follow New page.
- The user **shows** a page that already exists ("here are screenshots of our posts and reels"): follow Existing page.

Either way, ask one question at a time and only about what is still open; skip anything already said. Offer "or say 'you choose'" and, if they do, decide and say what you decided.

## New page

1. **Learn the page.** In one message, ask at most four short questions, one line each, and skip what the user already told you: the niche and who the page is for, the language, the mood (calm, funny, dramatic, cosy...), and whether they want a recurring mascot. Add: "or say 'you choose'". If they say so, decide everything yourself and say what you decided.
2. **Read the formats:** `unfaced docs page`, and `unfaced docs brand` for a brand. The folder is `pages/<slug>/` in the current project unless the user names another.
3. **Pick every choice** (style, script, hook, voice, captions, music, ending, duration). For each kind, run `unfaced list <kind>` and read the candidates with `unfaced show <kind> <number>` (its "Good for" and "Pairs well with" lines). Then:
   - Fixed numbers for what makes the page recognisable: `style`, `voice`, `captions`, usually `music`.
   - Lists of 2–4 numbers where variety helps: `script`, `hook`, `ending`. Use `auto` only if the user wants maximum variety.
   - Only `ready` entries can be fixed numbers or list items; never one marked `(planned)`.
   - A language other than English or Italian: check the support table in `unfaced show voice`, and say which voices are best effort.
   - For a brand that will post carousels, propose style 13 Night tech (`unfaced show style 13`): it is the only style that draws posts so far; 14 to 16 are coming. `unfaced list style` marks what each style makes: `(videos)`, `(posts)`, `(videos, posts)` or `(planned)`. Styles 1 to 12 make videos only.
   - If the page makes both and its post style has no video scenes yet (13 has none yet), write `style: { posts: 13, videos: <n> }` with a style that is ready for videos, and tell the user why: the reels use another look until 13 gets its own scenes. Use the same form when the page deliberately keeps two looks.
   - Kinds of post: `unfaced list post-type`, as a list of 2–4 numbers or `auto`, for a page that makes posts.
4. **Brand and formats**, only for what is still open:
   - handle and website;
   - a logo file (`.svg` or `.png`) and the fonts: ask for the real font files (`.ttf`, `.otf`, `.woff`) and put them with the logo in the page's `brand/` folder. Until they arrive, the style's own free fonts are used: say so;
   - one to three brand colours, not five. `palette` is read by position (1 background, 2 accent, 3 secondary, 4 highlight, 5 ink), so write `palette: [<the style's background>, <accent>, <secondary>, <highlight>]`: position 1 is the first colour of the style's default palette (`unfaced show style <n>`), then the brand colours, leaving out the ones the brand doesn't have. Never put a brand colour first: it would become the background. A style keeps its own ground, so a background of the other lightness is ignored: `unfaced page` says so;
   - the tone in one sentence, and words to use and to avoid;
   - default formats, asked by purpose, never as sizes: "Instagram carousel? LinkedIn carousel (a PDF)? A single post? Stories?" Map the answer to `formats` (`instagram-carousel`, `instagram-post`, `linkedin-carousel`, `story`).

   Never invent a handle, a logo or a font. One the user doesn't have yet is left out and asked for again later.
5. **Show the picks** as a numbered table (field, number or value, name, one-line reason) and let the user change any of them before you write. If they said "you choose", don't wait: write the profile and show the table with it.
6. **Write `page.yaml`** with a comment naming each choice (`style: 3   # Flat cartoon`).
7. **Validate:** `unfaced page <pageDir>` must print the profile. Fix every error it reports, and tell the user about its warnings.
8. **Mascot**, if wanted: see below.
9. **Finish** with the summary `unfaced page` printed and the next steps: ideas for posts and reels (video-ideas skill) or a first video (video-make skill).

## Existing page

The user shows you a page that already exists, as screenshots or files (posts, reels, stories, the profile, a logo, a brand guide). Never open the social network, never ask for a login and never fetch the profile yourself: work only from what they give you. If they only name the account, ask for screenshots.

1. **Look** at everything they gave you. Ask for more only if a medium is missing (a few posts, a few reels, the profile page).
2. **Draft the profile** from what you see, without writing anything yet:
   - colours: sample them from the images, the one to three that carry the identity, and say which is the accent. They go in `palette` after the style's background (see New page, step 4);
   - style per medium: the closest catalog entry for the posts and for the videos (`unfaced list style`, `unfaced show style <n>`). For posts that is 13 Night tech for now, the only post style; 14 to 16 are coming. Say how close it is and what it cannot match;
   - fonts: name the closest free families you can see, then ask for the real font files;
   - logo (ask for the file), handle, website, and the tone and recurring formats read from the captions and text on the posts;
   - formats: what the page already posts, by purpose (carousel, single post, story).
3. **Play it back** in a few plain lines, then ask only what you cannot settle:
   - posts and reels that look unlike each other: "your carousels are dark and editorial, your reels are bright cartoons: keep both looks, or bring the reels closer to the carousels?" Keeping both means `style: { posts, videos }`;
   - colours that change from post to post: which ones are the brand's;
   - a look no style matches well: say so, propose the closest with its number and what it keeps (colours, fonts, logo), and let the user pick.
4. **Write nothing until the user agrees** to the draft. Then continue New page from "Read the formats" with the agreed values, and validate with `unfaced page <pageDir>`.
5. Say what stayed approximate (the closest style, free fonts in place of the real ones) and what is still missing (font files, logo).

## Mascot

1. Read `unfaced docs mascot`.
2. Agree on name, species (cat, dog, fox, bear, bunny, bird, person, blob), colours, accessories and personality, or choose them to fit the niche and the style's palette (`unfaced show style <n>`).
3. Write `brand/mascot/mascot.json` and `brand/mascot/mascot.md`, and set `mascot:` in `page.yaml` to a one-line description.
4. Render the reference sheet: `unfaced mascot <pageDir>`. Open `brand/mascot/reference.png` and check it against `mascot.md`: the colours are the ones described, every accessory is visible, the character stands out from the style's background and still reads at a small size. Fix `mascot.json` and render again, up to three times.
5. Show the user the reference sheet's path and the name, look and personality in two lines.

## Changing a page

- Change only what the user asks. Run `unfaced page <pageDir>` before and after.
- Brand details (handle, fonts, colours, tone, formats) change like any other field: ask only what changed, show the new value.
- New style or mascot colours: render the reference sheet again (`unfaced mascot <pageDir>`) and look at it.
- Videos already made keep their files; tell the user that making a video again applies the new profile to it.
- A one-off change for a single video ("style 12 this time") does not belong in `page.yaml`: it goes in that video's `script.md` (video-make skill).
- A look, voice or anything else the catalogs don't have ("claymation", "anime"): say there is no such entry, offer the closest ones with their numbers, and change nothing until the user picks.

## Rules

- Never put an API key in `page.yaml`. Paid providers read their keys from a `.env` file; `unfaced page` rejects a profile with a key in it.
- A key the user pastes (in chat or into `page.yaml`) goes in `<pageDir>/.env` as `NAME=value`, with the name `unfaced docs page` gives for that provider (such as `ELEVENLABS_API_KEY`). Take it out of `page.yaml`, keep the provider setting, and tell the user to keep `.env` out of git (add it to `.gitignore`).
- Everything is free by default: `providers` can be left out.
- Never post anything anywhere. unfaced makes files; the user posts.

## Common mistakes

| Mistake | Instead |
|---|---|
| Asking for five colours, or for sizes in pixels | One to three colours; formats by purpose ("Instagram carousel"). |
| A brand colour first in `palette` | Position 1 is the background: the style's own, then accent, secondary, highlight. |
| Opening the social network, or asking for a login | Work from the screenshots and files the user gives you. |
| Writing the draft of an existing page before the user agrees | Play it back, ask about what differs, then write. |
| One style for a page whose post style has no video scenes yet | `style: { posts, videos }`, and say why. |
| Inventing a handle, logo or font | Leave it out and ask for the real one. |
| Fixing an entry marked `(planned)` | Pick a ready one; tell the user the planned one is coming. |
| Inventing an entry the catalog lacks, or switching to the nearest one unasked | Say it isn't in the catalog; offer the closest numbers and let the user pick. |
| `auto` everywhere | Fixed style, voice and captions; lists for script, hook and ending. |
| A list with one number (`style: [3]`) | Write the number (`style: 3`). |
| Writing the mascot only in `page.yaml` | The character is `brand/mascot/mascot.json`; `page.yaml` only describes it. |
| Not looking at `reference.png` | Open it and compare it with `mascot.md` before saying it's done. |
