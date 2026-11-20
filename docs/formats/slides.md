# Slides format

A post's text lives in `slides.md`, one file per post, in `<page>/posts/<post>/`. `unfaced post <postDir>` lays it out in the page's post style, checks it and renders one PNG per slide. The agent writes the file, or the user does; the text is used as written.

## The file

```markdown
---
title: Who we are
post_type: 3
format: [instagram-carousel]      # optional; the page's formats otherwise
label: ABOUT                      # optional small label on every slide
---

## cover
# This page is made by *our software*
No filming, no faces. Here is why.

## compare
# Why *no faces*
You have no time to film, and not everyone wants to be on camera.
- ✗ cameras
- ✗ filming
- ✓ graphics
- ✓ voice

## steps
# How *a post* is born
- Topic | us
- Text | software
- Voice | software
- Check | us

## cta
# Want your socials *like this*?
[Join the waiting list: link in bio]
```

Front matter:

| Key | Meaning |
|---|---|
| `title` | Required. What the post is about, for you; it is not drawn. |
| `post_type` | Required. The number of a post type (`unfaced list post-type`). |
| `format` | Optional. One format name or a list. Without it, the page's `formats`, else `instagram-carousel`. |
| `label` | Optional. A short word drawn at the top of every slide. |
| `style` | Optional. A style number for this post only; the page's post style otherwise. |
| `square` | Optional. `true` makes an `instagram-post` 1080×1080 instead of 1080×1350. |

Slides:

- `## <kind>` starts a slide. Attributes may follow in braces: `## image {photo: inbox/shop.jpg}`, `## custom {id: phone}`.
- `# ` is the slide's headline. Text wrapped in `*…*` is the accent; the style decides how it looks (another typeface, another colour). At most one accent span per headline.
- Plain lines are body text.
- `- ` lines are items. `a | b` gives an item a second, smaller line. `✓` or `✗` at the start marks an item good or bad.
- `[text]` on its own line is the button.

## Kinds

Every style that makes posts draws these kinds.

| Kind | What it shows | Keep it to |
|---|---|---|
| `cover` | headline, optional subtitle, optional visual | headline of 12 words or fewer |
| `point` | headline and body: one idea per slide | body of 45 words or fewer |
| `list` | headline and up to 5 numbered or ticked items | items of 8 words or fewer |
| `steps` | headline and 2 to 6 steps as a flow | 3 words per step, plus the second line |
| `compare` | ✗ against ✓, or before against after, in two groups | 4 items per side |
| `stat` | a big number or short figure with one line under it | figure of 8 characters or fewer |
| `quote` | a testimonial or quote with its author | 35 words or fewer |
| `image` | a photo from `inbox/` with a headline or caption | |
| `cta` | the closing invite, one button, a small line under it | |
| `custom` | the post's own code from `custom/` | |

Text is fitted to its box with the real fonts before anything renders: each line is broken and sized once, and drawn exactly so. A text that does not fit at the style's smallest size, a character the font cannot draw, an unknown kind or a slide count the format does not take stops `unfaced post` with the line and slide number and what to change.

## Formats

| Name | Size | Slides | Output |
|---|---|---|---|
| `instagram-carousel` | 1080×1350 | 2–10 | PNGs |
| `instagram-post` | 1080×1350 (`square: true`: 1080×1080) | 1 | PNG |
| `linkedin-carousel` | 1080×1350 | 2–12 | PDF and the PNGs |
| `story` | 1080×1920 | 1–10 | PNGs |

`unfaced post <postDir> --format <name>` makes one format only, whatever the file and the page say.

Safe areas, which the layouts keep to and the checks verify:

- 4:5 and square slides: a 60 px margin all round. On 4:5 formats the cover's headline also stays inside the central 1080×1012 area (from y 169 to y 1181), because Instagram's profile grid crops 4:5 posts to 3:4.
- Stories: a 60 px margin left and right, and nothing readable in the top 250 px or the bottom 340 px, where the platform draws its bars and the reply field.

## The frame

Every slide also gets the style's frame: the label and the counter (`2/8`) at the top; the handle (and the logo, when the brand has one) and "swipe →" at the bottom. "Swipe" is left off the last slide and off single posts. The frame's words are in the page's language (English, Italian, Spanish, French, Portuguese and Hindi; other languages use English, and `unfaced post` says so). The handle, logo and fonts come from the page's `brand` block (`unfaced docs brand`).

## Outputs

`unfaced post` writes into the post folder:

| File | What it is |
|---|---|
| `post-plan.json` | One entry per format: the style, size, palette, fonts and every slide with its boxes and fitted lines. |
| `check.json` | The automatic checks: every text box inside the safe area, no two boxes overlapping, readable text contrast, the cover's headline inside the grid crop. |
| `slide-01.png` … | One PNG per slide, at the format's size. |
| `grid.png` | Every slide side by side, five per row, for a quick look. |
| `post.pdf` | `linkedin-carousel` only: one page per slide, for LinkedIn's document post. |

With more than one format, each format's PNGs, `grid.png` and `post.pdf` go in a folder named after it (`<post>/instagram-carousel/`, `<post>/story/`); `post-plan.json` and `check.json` stay in the post folder. When a check fails, the slides are still rendered so you can see why, and the command exits with 1. `unfaced check <postDir>` runs the checks again from `post-plan.json`.

The agents add `review.md` (the independent review, `unfaced docs review`) and `post.md` (captions and hashtags, `unfaced docs post`).
