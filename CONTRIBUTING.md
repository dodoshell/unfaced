# Contributing to unfaced

Thanks for helping. Most contributions are catalog entries: a new style, a script type, a post type, a hook. This page says where each one lives, what it must pass, and how to send it.

## Ground rules

- Everything user-facing is in English: the catalogs, the docs, the CLI's messages.
- No feature may require a paid key. A paid provider without its key falls back to the free one and says so.
- unfaced never posts anything. It makes files.
- Code runs on Windows, macOS and Linux: use `node:path`, never hard-code separators.
- Catalog numbers never change. Pages refer to entries by number, so a new entry takes the next free number, and a number is never reused or renumbered.
- Every third-party file (a font, a sound, a model) is listed in `LICENSES/README.md` with its source and licence. Only licences that allow redistribution (OFL, CC0, MIT and similar).

## Set up

You need Node 22 or newer and git.

```bash
npm run setup                    # npm install, then the voice model, whisper and the render browser into ~/.unfaced/
npm run unfaced -- doctor        # what is still missing
npm test                         # the fast tests
UNFACED_SLOW=1 npm test          # also the tests that synthesize voice or render video
npm run typecheck
```

`AGENTS.md` lists every CLI command and where each part of the repo lives.

## Adding a style

Follow `catalog/styles/_template/README.md`: copy the template, draw the look in `components/`, keep `layout.ts` pure, ship the fonts with their licence, register the style, and write `STYLE.md`. Before you open a pull request:

1. `npx vitest run tests/styles/contract.test.ts` passes: the safe zone, the captions, no overlapping text, every scene kind.
2. `npm run unfaced -- demo NN --frames` renders the dog demo's key moments; look at every frame. The dog keeps its proportions and poses; only the look changes.
3. A sample video made in your style (`npm run unfaced -- make`, then `frames`) reads well at phone size.
4. `npm run unfaced -- gallery` refreshes the gallery with your style's poster.

Attach a few frames to the pull request.

## Making a style draw posts

A style draws posts when it has a `components/slides/` folder, a **Slides** section in its `STYLE.md` and `"posts": "ready"` in `catalog/catalog.json` (styles 1 to 12 have no `posts` field, which means they make videos only; `status` stays about videos). Look at style 13 Night tech: one component per slide kind (cover, point, list, steps, compare, stat, quote, image, cta), a pure `layout.ts`, the drawn visuals (chips, a step flow, a phone, a notification, icons) and its fonts. Then:

1. `npx vitest run tests/styles/slides-contract.test.ts` passes: every kind in every format, the safe areas, no overlapping text.
2. `npm run unfaced -- demo NN --post` renders the sample carousel and story; look at every slide.

## Adding a slide kind

A kind is parsed in `engine/src/post/parseSlides.ts` (its fields), its limits live in `engine/src/post/limits.ts`, it is drawn by each style's `components/slides/` and `layout.ts`, and described in `docs/formats/slides.md`. Add it to every style that draws posts and extend the slides contract test, so a style without the kind fails.

## Adding a post type

1. Copy `catalog/posts/_template.md` to `catalog/posts/NN-slug.md`: what the post is for, its slide sequence, good covers, the writing rules and one complete example `slides.md`.
2. Add its entry to the `post-type` list in `catalog/catalog.json`, after the others.
3. `npx vitest run tests/catalog tests/post` checks the entry and that the example parses.

## Adding a script type

1. Copy `catalog/scripts/_template.md` to `catalog/scripts/NN-slug.md` and write its purpose, the beats with their timing, the rules, and two complete example scripts in different niches.
2. Add one more complete script to `examples/scripts/` (see its `README.md`).
3. Add its entry to `catalog/catalog.json`, after the others: `num`, `slug`, `name`, a one-line `summary`, `goodFor`, `path` and `"status": "ready"`.
4. `npx vitest run tests/script` checks that every example parses and names its script type.

## Hooks, endings and the other catalogs

Hooks are written entries in `catalog/hooks.md`: a rule set and three examples in different niches, plus an entry in `catalog/catalog.json` (its `path` is `hooks.md#NN-slug`). Copy the three examples to `examples/hooks/README.md` too; the hook reel and the gallery read them from `catalog/hooks.md`. Endings, voices, caption styles and music moods also need engine code (an end sign, a voice per provider, a caption renderer, a music generator): open an issue first so we can agree on the shape.

## Skills

The skills live in `plugin/skills/<name>/SKILL.md`. Their front matter uses only the portable keys (`name`, `description`, `license`, `compatibility`, `metadata`, `allowed-tools`), and the description starts with "Use when". The launcher in `plugin/launcher/unfaced.mjs` is copied into every skill's `scripts/`; after changing it, copy it again (a test checks the copies are identical). The same goes for each reviewer agent and its copy in a skill's `references/` (`video-reviewer`, `post-reviewer`). A change to a skill's behaviour comes with a scenario showing an agent getting it wrong before and right after.

## Tests

- Write the test first and watch it fail.
- Tests live in `tests/<area>/`. A test that synthesizes voice or renders video is named `*.slow.test.ts` and runs only with `UNFACED_SLOW=1`.
- `npm test` and `npm run typecheck` pass before every pull request.

## Commits and pull requests

- One change per pull request.
- Commit subjects are short imperative sentences in sentence case ("Add caption style 07", "Fix the list layout in style 04"), with a body that says why when it isn't obvious.
- Describe what you changed and how you checked it; for anything visual, attach frames.

By contributing you agree that your contribution is licensed under the MIT licence (`LICENSE`).
