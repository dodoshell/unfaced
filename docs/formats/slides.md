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

- `## <kind>` starts a slide. Attributes may follow in braces: `## image {photo: inbox/shop.jpg}`, `## custom {id: phone}`. A value with commas goes in double quotes: `{visual: notification, title: "New booking", text: "Anna, Friday at 10:00"}`.
- `# ` is the slide's headline. Text wrapped in `*…*` is the accent; the style decides how it looks (another typeface, another colour). At most one accent span per headline.
- Plain lines are body text.
- `- ` lines are items. `a | b` gives an item a second, smaller line. `✓` or `✗` at the start marks an item good or bad.
- `[text]` on its own line is the button.

## Kinds

Every style that makes posts draws these kinds.

| Kind | What it shows | Write it as | Keep it to |
|---|---|---|---|
| `cover` | headline, optional subtitle, optional visual | `# headline`, the subtitle as a plain line | headline of 12 words or fewer |
| `point` | headline and body: one idea per slide | `# headline`, the body as plain lines | body of 45 words or fewer |
| `list` | headline and up to 5 numbered or ticked items | `- item` lines, `✓`/`✗` to tick them, `\| second line` | 5 items of 8 words or fewer |
| `steps` | headline and 2 to 6 steps as a flow | `- Step \| who does it` | 2 to 6 steps of 3 words or fewer, plus the second line |
| `compare` | ✗ against ✓, or before against after, in two groups | `- ✗ …` and `- ✓ …`; without marks the first half is "before", the second "after" | 4 items per side, 6 words each |
| `stat` | a big number or short figure with one line under it | `# +40%` as the headline, the line as a plain line | figure of 8 characters or fewer |
| `quote` | a testimonial or quote with its author | `# "the quote"` as the headline, the author as a plain line | 35 words or fewer |
| `image` | a photo from the post with a headline or caption | `## image {photo: inbox/shop.jpg}`, `# headline` and/or a caption line | a PNG, JPEG or WebP inside the post folder |
| `cta` | the closing invite, one button, a small line under it | `# headline`, `[button]`, the small line as a plain line | one button, which it needs |
| `custom` | the post's own code from `custom/` | `## custom {id: phone}` | |

**Cover visuals.** A cover can draw a visual under its headline without any code, with the `visual` attribute:

- `## cover {visual: chips}`: the slide's `- ✓ …` / `- ✗ …` items as chips around a phone (up to 4 chips, 3 words each).
- `## cover {visual: phone, screen: "Booked: Anna, Friday at 10:00"}`: a phone with a short text on its screen (8 words or fewer).
- `## cover {visual: notification, title: "New enquiry", text: "Do you also build online shops?"}`: a notification card (a title of up to 6 words, a text of up to 14; at least one of them). The brand's logo is its app icon.

**Steps.** When the steps carry second lines, the style may set the steps of one second line apart (style 13 fills them with the accent): the commonest one, or the one named with `## steps {filled: software}`, which must be one of the steps' second lines (a name that matches none stops `unfaced post`, naming the slide).

A slide past these limits stops `unfaced post` before anything is laid out, with the slides.md line, the slide's number and kind, and the limit: `slides.md line 21 (slide 3, list): a list takes up to 5 items; this one has 6`. So does an image slide whose photo is missing or outside the post folder.

Text is fitted to its box with the real fonts before anything renders: each line is broken and sized once, and drawn exactly so. A text that does not fit at the style's smallest size, a character the font cannot draw, an unknown kind or a slide count the format does not take stops `unfaced post` with the line and slide number and what to change.

## Custom slides

A post can draw a slide with its own code, the way a video draws its own scenes. Write `## custom {id: phone}` in `slides.md` and put two files in the post folder:

- `custom/index.tsx` exports the slides by id: `export default defineSlides({ phone: PhoneSlide })`, with `import { defineSlides, type SlideComponent } from "@unfaced/kit"`. A `SlideComponent` is a React component that receives `{ ctx }` (the `SlideContext`: the slide, the palette, the brand, the format, the logo path) and draws the content only; the style draws its frame (label, counter, handle, swipe) around it.
- `custom/boxes.json` declares the text the component draws, by id and then by format: `{ "phone": { "instagram-carousel": [{ "id": "label", "x": 120, "y": 880, "w": 340, "h": 90 }] } }`. Give an empty list for a format whose slide draws no text. The boxes are checked for the safe area and for overlap, and are not fitted: the component sizes its own text. They carry no colours, so the contrast check does not cover them.

`unfaced post` stops before rendering, naming the file and the id, when a `custom` slide has no `id`, when `custom/index.tsx` is missing or does not export the id, or when `boxes.json` has nothing for the id in a format being made.

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

## Photos

A slide's photo is named in its attributes: `## image {photo: inbox/shop.jpg}`. The files live in the post's `inbox/`, like a video's. A prompt in `inbox/PROMPTS.md` can say which slide it is for (`## shop.jpg`, then `For slide 2. A shop front at dusk.`).

- `unfaced inbox <postDir>` checks what arrived. Photos must be the post's shape and at least as wide as the format: 1080×1350 (`instagram-carousel`, `instagram-post`, `linkedin-carousel`), 1080×1080 (a `square` post) or 1080×1920 (`story`). The post's first format counts: `format` in `slides.md`, else the page's first `formats`, else `instagram-carousel`.
- `unfaced generate <postDir>` makes the missing images with the page's image provider, asked for 4:5, 1:1 or 9:16 and cropped to the format's size. Without a provider or its key a file is left for you, as for videos.
- Posts use images only. An `.mp4` or a voice file in a post's `inbox/` is reported `ignored: posts use images only`, and `generate` makes no clips or voice for a post.

## The frame

Every slide also gets the style's frame: the label and the counter (`2/8`) at the top; the handle (and the logo, when the brand has one, drawn at the style's height and its own width) and "swipe →" at the bottom. "Swipe" is left off the last slide and off single posts. The frame's words are in the page's language (English, Italian, Spanish, French, Portuguese and Hindi; other languages use English, and `unfaced post` says so). The handle, logo and fonts come from the page's `brand` block (`unfaced docs brand`).

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
