# unfaced: instructions for agents

unfaced helps a person create and run faceless social media pages (Reels, TikTok, Shorts). A page is a folder with a `page.yaml` profile and its videos. The engine turns a page and a `script.md` into a finished vertical video, free by default.

## Where to go

| The request | Go to |
|---|---|
| Start or change a page, or give it a mascot | `plugin/skills/page-setup/SKILL.md` |
| Ideas, series or a posting calendar | `plugin/skills/video-ideas/SKILL.md` |
| Options for how to make one idea | `plugin/skills/video-recommend/SKILL.md` |
| Make a video, from idea to reviewed MP4 | `plugin/skills/video-make/SKILL.md` |
| Cover, captions and hashtags for posting | `plugin/skills/video-package/SKILL.md` |
| What the numbers say, what to change | `plugin/skills/page-results/SKILL.md` |
| Review a made video independently | `plugin/agents/video-reviewer.md` |
| A file format (page, script, mascot, scenes, review, post, results) | `npm run unfaced -- docs <format>`, or `docs/formats/` |
| One catalog entry and its rules | `npm run unfaced -- show <kind> <number>` |
| See a complete page to copy | `examples/pages/curious-cats/` |
| Add a style, a script type or a hook | `CONTRIBUTING.md`; a style's look and layout rules live in its `STYLE.md` |
| Design and plans | `docs/design/`, `docs/plans/` |

Inside this repository the skills' launcher (`node plugin/launcher/unfaced.mjs <command>`) and `npm run unfaced -- <command>` run the same CLI.

## Commands

- Install: `npm run setup` (npm install, then the voice model, whisper and the render browser into `~/.unfaced/`)
- Check the install: `npm run unfaced -- doctor`
- Catalogs: `npm run unfaced -- list <kind>`, `npm run unfaced -- show <kind> [number]`
- Check a page profile: `npm run unfaced -- page <pageDir>`
- Make a video (exits 1 when an automatic check fails): `npm run unfaced -- make <videoDir>`
- Run the automatic checks again: `npm run unfaced -- check <videoDir>` (writes `check.json`)
- Review frames: `npm run unfaced -- frames <videoDir> --every 1s`, then look at `<videoDir>/frames/`
- Cover image: `npm run unfaced -- cover <videoDir> [--at 1.5]`
- Files handed off into a video's `inbox/`: `npm run unfaced -- inbox <videoDir>`
- Images and clips for `inbox/PROMPTS.md` from the page's providers: `npm run unfaced -- generate <videoDir>`
- Compare a page's numbers (`results.md`) by platform and by choice: `npm run unfaced -- results <pageDir>`
- Catalog gallery (static page with every entry and a poster per style): `npm run unfaced -- gallery`
- Style demo (the same dog scene in every style): `npm run unfaced -- demo <style|all> [--frames]`; `all` also writes `docs/media/styles-grid.gif`
- Hook reel (every hook's first example, spoken, each in the next style): `npm run unfaced -- reel hooks`
- Mascot reference sheet: `npm run unfaced -- mascot <pageDir>`
- Tests: `npm test` (slow tests that synthesize voice or render video: `UNFACED_SLOW=1 npm test`)
- Types: `npm run typecheck`
- Evals for the skills and the reviewer (real model calls, counted against your plan or API bill): `claude plugin eval . --scaffold --trust-plugin --allow-tools Bash Write Edit`, or on native Windows `--tag files-only` without `Bash`; see `evals/README.md`

## Rules

- Everything user-facing is in English.
- No feature may require a paid key. A paid provider without its key falls back to the free one and says so.
- Never store API keys in `page.yaml`; use `.env`.
- Video output is 1080×1920, 30 fps, H.264 + AAC.
- Code must work on Windows, macOS and Linux: use `node:path`, never hard-code separators.
- Never publish to social networks. unfaced only produces files.
- `plugin/launcher/unfaced.mjs` is copied into every skill's `scripts/`; after changing it, copy it again (a test checks the copies are identical).
- `plugin/agents/video-reviewer.md` is copied into `plugin/skills/video-make/references/` for agents without subagents; after changing it, copy it again (a test checks the copy is identical).
