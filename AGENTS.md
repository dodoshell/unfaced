# unfaced: instructions for agents

unfaced helps a person create and run faceless social media pages (Reels, TikTok, Shorts). A page is a folder with a `page.yaml` profile and its videos. The engine turns a page and a `script.md` into a finished vertical video, free by default.

## Where to go

| The request | Go to |
|---|---|
| Make a video for a page | `npm run unfaced -- make <videoDir>` (skills coming in Phase 2) |
| List styles, scripts, hooks or other catalogs | `npm run unfaced -- list <kind>` |
| Create or edit a page profile | `schema/page.schema.json` (the `page-setup` skill is coming soon) |
| Add a style or a script type | `catalog/` (`CONTRIBUTING.md` is coming soon) |
| Design and plans | `docs/design/`, `docs/plans/` |

## Commands

- Install: `npm install`
- Tests: `npm test` (slow tests that synthesize voice or render video: `UNFACED_SLOW=1 npm test`)
- Types: `npm run typecheck`

## Rules

- Everything user-facing is in English.
- No feature may require a paid key. A paid provider without its key falls back to the free one and says so.
- Never store API keys in `page.yaml`; use `.env`.
- Video output is 1080×1920, 30 fps, H.264 + AAC.
- Code must work on Windows, macOS and Linux: use `node:path`, never hard-code separators.
- Never publish to social networks. unfaced only produces files.
