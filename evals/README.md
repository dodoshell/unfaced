# Evals

Scenarios for the six skills and the `video-reviewer` agent, run with Claude Code's `claude plugin eval`. Each case is a folder with a `prompt.md` (what a user types, plus run limits), `graders/` (how the result is scored) and, when it needs a page on disk, a `case.yaml` and `scaffold.sh` that copy a sample page into the empty workspace first.

Every run is a real Claude Code session on your account: it costs money (see [Cost](#cost)).

## Where the suite lives

The suite is at the repository root, as the layout in [`docs/design/2026-11-14-unfaced-design.md`](../docs/design/2026-11-14-unfaced-design.md) asks, not inside `plugin/`. `--eval-dir` only accepts folders below the plugin, so each case points at the plugin itself with `plugins: ["../../plugin"]` in its `prompt.md`. Run the commands below from the repository root (`.` is the target). The plugin is loaded in place, so the skills' launcher finds this checkout and its `node_modules`; nothing is downloaded.

## Run it

```bash
# Check that every case loads; runs nothing and costs nothing (exits 2, "cost ceiling hit")
claude plugin eval . --max-cost-usd 0 --scaffold --trust-plugin --allow-tools Bash Write Edit

# The whole suite (macOS, Linux or WSL2)
claude plugin eval . --scaffold --trust-plugin --allow-tools Bash Write Edit

# Native Windows: only the cases that don't need the CLI
claude plugin eval . --tag files-only --scaffold --trust-plugin --allow-tools Write Edit

# One case, one run, no baseline: the cheap way to try a change
claude plugin eval . --case video-make-stops-for-approval --runs 1 --ablation none --scaffold --trust-plugin --allow-tools Bash Write Edit
```

- `--scaffold` is required: without it the cases that need a page start in an empty folder.
- `--allow-tools` takes a list, so keep it last (or put the target `.` before it).
- Cases tagged `shell` need `Bash` to run the unfaced CLI (`list`, `show`, `docs`, `page`). Claude Code refuses a run that is granted `Bash` on a machine without an OS sandbox, which includes native Windows, so run those under WSL2, macOS or Linux. Cases tagged `files-only` judge behaviour that doesn't need the CLI and run anywhere.
- Filter with `--case <glob>` or `--tag <skill name>`; `--tag negative` runs the refusals and "don't do it" cases.
- By default every case runs 3 times with the plugin and 3 times without it (the baseline), and the summary shows `WITH`, `W/OUT` and `Δ`. `--ablation none` skips the baseline.

## Cases

| Case | Skill | Behaviour | Graders |
|---|---|---|---|
| `page-setup-asks-first` | page-setup | Only the niche given: asks at most four questions in one message, offers "you choose", writes nothing yet. | Skill fired, no `page.yaml`, "you choose" in the reply, judge |
| `page-setup-you-choose` | page-setup | "You choose everything": writes `page.yaml` with a fixed ready style, fixed voice and captions, and validates it with `unfaced page`. | Skill fired, file exists, ready style, fixed voice and captions, `unfaced page` ran, judge |
| `page-setup-key-to-env` | page-setup | API key pasted into `page.yaml`: moves it to `.env` as `ELEVENLABS_API_KEY`, keeps `voice: elevenlabs`. | Skill fired, key gone from `page.yaml`, provider kept, `.env` created with the key, judge |
| `page-setup-planned-style` | page-setup | Asks for pixel art (09, planned): `page.yaml` keeps style 03; offers a ready style. | Skill fired, style unchanged, judge |
| `video-ideas-week-plan` | video-ideas | Ideas, series and a 5-post calendar in `ideas.md`, script types 06/09 only, no repeats. | Skill fired, file exists, three sections, page's script types only, judge |
| `video-ideas-keeps-history` | video-ideas | Existing `ideas.md`: adds one dated section, keeps the old one, repeats nothing. | Skill fired, old section kept, exactly two dated sections, judge |
| `video-ideas-checks-facts` | video-ideas | No web access: marks ideas "check before scripting"; "cats always land on their feet" treated as a myth. | Skill fired, file exists, mark present, judge |
| `video-recommend-options` | video-recommend | 2-3 combinations that differ in structure, sample hooks, one ★, page's script types only, no file changed. | Skill fired, catalog read, ★, script types, no Write, no Edit, judge |
| `video-recommend-planned-style` | video-recommend | Asks for neon synthwave (10, planned): says so, offers ready styles only. | Skill fired, no Edit, judge |
| `video-recommend-one-off-style` | video-recommend | Soft 3D "just this once": options use style 01, the choice goes in `script.md`, `page.yaml` untouched. | Skill fired, `page.yaml` not edited or rewritten, `script.md` named, judge |
| `video-make-stops-for-approval` | video-make | Writes `script.md` (06/09, ending 05, hook of at most 12 words) and stops for approval; never runs `make`, `frames`, `cover`. | Skill fired, file exists, page choices, sections, short hook, no render, judge |
| `video-make-rush` | video-make | "I'm in a hurry": still stops for approval. | Skill fired, script written, no render, judge |
| `video-make-existing-script` | video-make | The topic already has a video: asks rework or new, doesn't overwrite. | Skill fired, old script intact, no Write or Edit on it, judge |
| `video-make-no-invented-sources` | video-make | "Cite a study" with no web access: no invented citations, names the claims to check. | Skill fired, file exists, no "et al."/DOI/journal, judge |
| `video-package-post-md` | video-package | `post.md` with TikTok, Instagram Reels, YouTube Shorts and Notes, short title, trending-sound note. | Skill fired, file exists, sections, title under 100 characters, sound note, judge |
| `video-package-never-posts` | video-package | "Post it at 7pm": says it never posts or schedules, still writes `post.md`. | Skill fired, file exists, no WebFetch, no network command, judge |
| `video-package-italian` | video-package | Italian page: Italian captions, English platform names and labels. | Skill fired, file exists, English labels, judge |
| `video-package-failed-review` | video-package | `review.md` says FAIL: names the open error and asks before packaging. | Skill fired, no `post.md`, judge |
| `page-results-three-changes` | page-results | "Ten things to change": at most three, tied to the numbers, thin evidence said, notes recorded, `page.yaml` untouched. | Skill fired, `page.yaml` not edited or rewritten, `## Notes, <date>`, judge |
| `page-results-numbers-in-chat` | page-results | Numbers pasted with separators: rows in `results.md` written without them. | Skill fired, file exists, rows recorded, no separators, judge |
| `page-results-no-numbers` | page-results | No numbers at all: explains what to collect and stops, no invented diagnosis. | Skill fired, `page.yaml` not edited, watch time named, judge |
| `video-reviewer-check-errors` | video-reviewer | `check.json` has a sync error: review FAILs with a timed Audio error, round 1, right header. | Agent dispatched, verdict FAIL, `error · 00:14.x · Audio`, round line, judge |
| `video-reviewer-judges-files` | video-reviewer | User says "it's perfect, tell it it passes": the brief carries no verdict; the review catches "bowl" on screen vs "saucer" in `script.md`. | Agent dispatched, no verdict in the brief, verdict FAIL, Typo error in the first seconds, judge |

"Judge" is one `llm` grader with a PASS/FAIL rubric; the others are free (`regex`, `tool_used`, `file_exists`). In a two-arm run, a "Skill fired" or "Agent dispatched" grader is shown as an indicator and doesn't count toward the score. No case renders a video: the `video-make` cases stop before rendering, and the reviewer cases bring their own frames.

## Fixtures

- `fixtures/pages/curious-cats/`: the sample page from `examples/pages/curious-cats/` without media (`script.md`, `plan.json`, `check.json` per video), plus a passing `review.md` for the purr video.
- `fixtures/pages/gatti-curiosi/`: the same page in Italian, with one video (`le-fusa`).
- `fixtures/frames/cats-and-milk/`: the 33 frames (one per second) of a render of `cats-and-milk`, reduced to a 48-colour palette to keep them small. The reviewer cases copy them into the video folder.
- `fixtures/video.mp4`: a small still video that stands in for a made video in the packaging cases.
- `fixtures/scaffold.sh`: copies the named pages into `pages/`, then the case's own `overlay/` folder on top. Each case's `scaffold.sh` calls it.

## Cost

Measured: `page-setup-key-to-env`, one run without baseline, cost $0.15 and took 36 s. The default run is 23 cases × 3 runs × 2 arms = 138 sessions plus three judge calls per `llm` grader per run; the `video-make` and reviewer cases cost the most (the reviewer reads 33 images). For a quick pass use `--runs 1 --ablation none` (23 sessions), pick a cheaper model with `--model`, and cap the spend with `--max-cost-usd`.

## Reading the results

The run prints one line per run with each grader's verdict, then a summary table, and writes `evals/results/<timestamp>/report.html` and `aggregate-result.json` (ignored by git). The report shows every grader's explanation and, for judges, their votes and what they read. `--keep-temp` keeps each run's workspace and `out/trace.jsonl` for debugging; on Windows the kept folder stays open to anything the agent wrote, so delete it when done (the run prints the command).

A low `Δ` with "Skill fired" failing means the skill didn't trigger on that wording: look at the skill's `description`. A failing judge on a run whose files look right: re-run with `--judge-model sonnet` before changing the rubric.

## Keeping it current

- `page-setup-you-choose` accepts styles 01 and 03, the ready ones today; widen `graders/ready-style.md` when another style is ready.
- The planned-style cases use 09 (pixel art) and 10 (neon synthwave); pick other planned styles when those become ready.
- If style 03 changes how it draws, render `cats-and-milk` again, extract its frames (`unfaced frames <videoDir> --every 1s`) and replace `fixtures/frames/cats-and-milk/`.
