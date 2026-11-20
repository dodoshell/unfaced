---
name: post-make
description: Use when the user asks for a carousel, a single image post, a LinkedIn carousel (PDF) or a story for a page, wants a text turned into slides, or wants a made post fixed and made again.
---

# Post make

From an idea to a reviewed post in the page's folder: PNG slides, plus a PDF for LinkedIn. The text is the product: research it, write it, and get the user's approval before any slide is rendered. Then make the post, check it, have it reviewed by an independent agent, fix, and hand it over with its captions.

## Running unfaced

Every command runs through this skill's launcher:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/unfaced.mjs" <command>
```

`${CLAUDE_SKILL_DIR}` is the folder this SKILL.md is in. Below, `unfaced <command>` means that line. The first run outside a checkout of unfaced installs the library into `~/.unfaced/` (git and npm needed, about 1 GB, several minutes): tell the user before it starts, and give that command a timeout of at least 10 minutes.

## The flow

1. **Page and folder.** Find the page (the folder with `page.yaml`) and run `unfaced page <pageDir>`. Note its language, its `brand` (handle, tone, words to avoid) and its formats. If it has no brand and the post is for a business, ask before writing, in one short message: the handle, the logo file (optional: `.svg` or `.png`, the post works without one) and the tone in a sentence; offer to propose a tone if they say "you choose", but never invent a handle or a logo. Save the answers in `brand` (page-setup skill, `unfaced docs brand`). The post goes in `<pageDir>/posts/<slug>/`, the slug made from the title (lowercase, hyphens). If that folder already has a `slides.md`, ask whether to rework it or start a new post.
2. **Choices.** Pick, with one line of reason each:
   - the post type (`unfaced list post-type`, then `unfaced show post-type <n>`), unless the page or the user fixed it;
   - the format, by what the post is for: `instagram-carousel` (a swipeable post), `instagram-post` (one image; `square: true` for 1:1), `linkedin-carousel` (a PDF for LinkedIn's document post), `story` (vertical, one idea per screen). Never ask for a size in pixels; if the user names a format that doesn't exist, suggest the four above. More than one is fine: `format: [instagram-carousel, linkedin-carousel]`;
   - the style, from the page (`style`, or `style.posts`) unless the user asked for another for this post.

   Styles 1 to 12 make no posts yet. If the page's post style is one of them, say so, tell the user that style makes videos only for now, and offer a style that can draw posts (`unfaced list style` shows `(posts)`; currently 13 Night tech). Use it for this post only after they agree, as `style:` in `slides.md`, and offer to set `style: { posts: 13, videos: <n> }` on the page.
3. **Research.** Collect the facts the post rests on. With web access, confirm each claim in a source you actually opened and read. Without web access, use only well-established facts and name the claims the user should check; don't name studies or papers from memory, not even as leads to look up. Never invent a number, a quote, a price, a customer or a source. A post about the user's own business uses what the user told you, nothing else.
4. **Write `slides.md`.** Read `unfaced docs slides` and the post type (`unfaced show post-type <n>`).
   - Front matter: `title`, `post_type`, plus `format`, `label`, `style` or `square` when this post needs them.
   - Write in the page's language and in `brand.tone`, and never use a word in `brand.words.avoid`; use `brand.words.use` where it fits.
   - One idea per slide; a cover that makes the reader swipe; respect each kind's limits (headline 12 words, point body 45 words, list items 8 words, a stat of 8 characters).
   - At most one `*accent*` span per headline, on the word that carries the idea.
   - **If the user gave you their own text**, lay it out without rewriting it: only split it into slides and choose the kind of each. Keep their words, order and punctuation. Where it doesn't fit (a headline too long, a slide with two ideas, too many items, a claim you can't back), don't change it: say which slide and why, and let the user decide.
5. **Approval: stop.** Save `slides.md` first, even when the rest can't run in this session. Show the user the whole text slide by slide, the choices with their reasons, the formats and the sources. Ask them to approve or change it, and end your turn. See "The approval stop" below. Once they approve, set the post's status in `ideas.md` to `scripted` if it is listed there.
6. **Custom slides and photos.** The style's kinds cover most posts. A slide that needs more is `## custom {id: <name>}` with its code in `custom/` (`unfaced docs slides`). A slide that needs a real photo is `## image {photo: inbox/<file>}`: write a prompt for it in `inbox/PROMPTS.md` (format in `unfaced docs scenes`), run `unfaced generate <postDir>` (it makes the file when the page has an image provider; when that provider is paid, tell the user how many images it will make and wait for their OK first), ask the user to drop any file still missing into `inbox/`, and check what arrives with `unfaced inbox <postDir>`. Use only photos the user owns or made; never one lifted from a site.
7. **Make:** `unfaced post <postDir>` (add `--format <name>` for one format). Read every line it prints. `unfaced check <postDir>` runs the checks again on the post as made, without rendering. A failed check (exit code 1) or a text that doesn't fit: see "Fixing checks", then make again. Any change to the words after approval: show the user the old and new text and why, and wait for their OK.
8. **Look.** Open every `slide-NN.png` (in each format's folder when there are several) and `grid.png`. Fix what you see before asking for a review: a clipped word, a wrong accent, a weak cover.
9. **Independent review.** Launch the `post-reviewer` agent (in Claude Code: `unfaced:post-reviewer`). Give it only the post folder's path and the command line that runs unfaced. Don't tell it what you changed or what you think is wrong; its fresh eyes are the point. It writes `review.md` (format: `unfaced docs review`). If you can't launch a subagent, don't review it yourself: ask the user to start a fresh session, one that hasn't seen this conversation, and give it the instructions in `${CLAUDE_SKILL_DIR}/references/post-reviewer.md`, the post folder's path and the command line that runs unfaced.
10. **Fix and repeat.** If `review.md` says FAIL, fix every `error`, make the post again, look again and ask for a new review. At most three rounds; after the third FAIL, stop and show the user what is left. Fix warnings that are cheap; list the others.
11. **Write `post.md`** (`unfaced docs post`): for Instagram, LinkedIn and Facebook, a caption, hashtags and one alt text per slide, in the page's language and tone. Include only the platforms the post's formats suit and the user uses. Don't repeat the slides in the caption, and don't promise what they don't show. The slides don't show the brand's site: put it in the caption where a link helps.
12. **Hand over:** the paths of the PNGs (and `post.pdf` for LinkedIn), the formats, the review's verdict and any open warnings. If the post is in `ideas.md`, set its status to `made`. Never post it: the user does.

## The approval stop

No slide is rendered before the user approves the text. Rendering text the user would have changed costs a review round; one message costs seconds.

The only exception: the user said in this conversation to skip approval ("don't ask, just make it"). Then say that you are skipping it, and carry on.

| Thought | Reality |
|---|---|
| "They want it tonight, asking slows them down" | Approval is one message. A wrong post slows them down more. |
| "The text is short and obviously fine" | Short text still carries claims and a tone the user owns. Ask. |
| "I'll show it with the finished slides" | Then every change means a new render and a new review. |
| "The page's brand already sets the tone" | The brand allows it; the user hasn't seen these words. Show them. |
| "I only shortened a line after approval to make it fit" | Show the user the change. They approved words, not intentions. |
| "It's their own text, I'll tighten it a little" | Their words stay. Say where it doesn't fit and let them choose. |

## Fixing checks

| Check or message | What to do |
|---|---|
| Text doesn't fit (names the slide and line) | Shorten that headline or body, split the slide, or use another kind; show the user the change. |
| Slide count not taken by the format | Merge or split slides, or pick the format the count fits. |
| `post-overlap`, `post-safe-area` | In a custom slide: move the text and update `custom/boxes.json`. Otherwise shorten the text or split the slide. |
| `contrast` | The palette's colours are too close to the ground: tell the user, and propose a palette change in `page.yaml` instead of editing the style. |
| Cover headline outside the grid crop | Shorten the cover's headline. |
| Unknown character | The font can't draw it: use another character, or a brand font that has it. |
| Missing font, logo or photo | Fix the path in `page.yaml` or `inbox/`; `unfaced page <pageDir>` names the field. |

## Common mistakes

| Mistake | Instead |
|---|---|
| Rendering before the user approved the text | Stop at step 5 and end your turn. |
| A source you couldn't open, or an invented figure or testimonial | Use only what you read or the user told you. |
| Rewriting the user's own text | Split it into slides and kinds only; flag what doesn't fit. |
| A format chosen by pixel size | Choose by purpose: carousel, single post, LinkedIn PDF, story. |
| Making a post on a page whose style can't draw posts | Say which styles can, and offer one. |
| A paid image provider used without telling the user | Say how many images and wait for the OK. |
| Looking at `grid.png` only | Every slide PNG, then the independent review. |
| Reviewing your own post and calling it reviewed | The `post-reviewer` agent reviews; you fix. |
| Editing unfaced's own files, wherever they are installed, to fix a post | Change only the page and the post. If unfaced itself is wrong, tell the user and suggest an issue at https://github.com/dodoshell/unfaced/issues. |
| Posting it to a social network | Never. Hand over the files. |
