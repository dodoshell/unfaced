# Brand format

A page's `brand` block says who the page speaks for: its handle, logo, fonts and the way it writes. It lives in `page.yaml` (see `unfaced docs page`); the files it names live in the page's `brand/` folder. Every field is optional, and a page without a `brand` block works as before.

## The block

```yaml
brand:
  handle: "@studionord"
  site: studionord.example          # optional
  logo: brand/logo.svg         # optional: .svg or .png
  fonts:                       # optional; the style's own fonts otherwise
    display: brand/fonts/Fraunces.ttf
    text: brand/fonts/Inter.ttf
    mono: brand/fonts/JetBrainsMono.ttf
  tone: "direct, warm, no jargon; we talk to shop owners, not developers"
  words:
    use: [su misura, preventivo]
    avoid: [sinergia, soluzioni innovative]
```

| Field | Meaning |
|---|---|
| `handle` | The account name, with the `@`. Posts show it in the frame at the bottom of each slide. |
| `site` | The website, written as people should read it. |
| `logo` | A `.svg` or `.png` file, relative to the page folder. Posts show it next to the handle. |
| `fonts` | Font files per role: `display` (headlines), `accent`, `text` (body) and `mono` (labels). Each is `.ttf`, `.otf` or `.woff`; `.woff2` is not accepted. A role left out uses the style's own font, except `accent`: a brand `display` font without an `accent` font also draws the accent words, so they are not set in the style's typeface next to the brand's. |
| `tone` | How the page sounds, in one sentence. |
| `words` | `use`: words and phrases the page likes. `avoid`: words it never uses. |

Paths are relative to the page folder and must stay inside it: an absolute path, or one that leads out with `..`, is an error naming the field. Any other key under `brand` is an error that names it.

## Where it applies

- Posts: the handle and the logo appear in the slides. The site is not drawn on the slides; it is used in the captions and the text of `post.md`. Brand fonts replace the style's fonts, role by role.
- Videos: brand fonts are used by posts only for now. The logo and handle stay out of videos.
- Writing: `tone` and `words` guide every text the agents write for the page: scripts, slides, captions.

`unfaced page <pageDir>` checks the files: a font or logo that is missing, or of another kind, is an error naming the field (`brand.fonts.display`, `brand.logo`).

## Fonts

Use fonts you are allowed to embed. The files stay in your page folder; unfaced never copies a brand font into its own repository, and never uploads one.

## Colours

The brand's colours go in `palette` (see `unfaced docs page`), not in `brand`. A palette is read by position, and each position is a role:

| Position | Role |
|---|---|
| 1 | background |
| 2 | accent |
| 3 | secondary |
| 4 | highlight |
| 5 | ink (text) |

A client rarely has five colours, so one to three brand colours are enough, but they go from position 2 on: the first position is always the background. Put the style's own background there (the first colour of its default palette, `unfaced show style <n>`), then the accent, then a secondary and a highlight if the brand has them. Positions left out take the style's default colours. For Studio Nord on Night tech (default palette `#0B1020 #2F6BFF #5B8CFF #2F9E6A #E8ECF7`), with a red accent and a warm yellow:

```yaml
palette: ["#0B1020", "#E2554F", "#F2B84B"]   # Night tech's background, then accent and secondary
```

Writing the brand colour first (`palette: ["#E2554F"]`) makes it the background, not the accent.

A post style keeps its own ground and texture: night navy with a glow, Swiss paper, blueprint blue with a grid, risograph paper with grain. The palette's colours drive the roles that carry identity (accent, highlight, secondary). The palette's background replaces the style's ground only when it is in the same lightness family: dark for styles 13 and 15, light for styles 14 and 16. Otherwise the style's ground stays and `unfaced page` says so. Text contrast on every ground is checked.
