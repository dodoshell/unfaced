# Results format

`results.md` sits in the page folder. The user fills it in (or pastes numbers from the platforms' insights) after posting; the `page-results` skill reads it with the videos' scripts and plans and suggests what to change.

```markdown
# Results

| Video | Platform | Posted | Views | Avg watched | Likes | Comments | Shares | Saves | Follows | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| why-cats-purr | TikTok | 2026-11-14 | 12400 | 71% | 980 | 45 | 120 | 210 | 38 | trending sound added |
| why-cats-purr | Instagram | 2026-11-14 | 3100 | 9.8s | 240 | 6 | 15 | 40 | 4 | |
| cats-and-milk | TikTok | 2026-11-16 | 2100 | 38% | 90 | 3 | 4 | 10 | 1 | posted at 23:00 |
```

| Column | Meaning |
|---|---|
| `Video` | The video's folder name in `videos/`. Links the row to its script, choices and length. |
| `Platform` | `TikTok`, `Instagram`, `YouTube` or another name. |
| `Posted` | Date as `YYYY-MM-DD`, optionally with a time (`2026-11-14 18:30`). |
| `Views` | Plays or views as the platform counts them. |
| `Avg watched` | Average watch time as a share (`71%`), in seconds (`9.8s`) or as minutes and seconds (`0:09`). The most useful number: it says whether the hook and the pacing work. |
| `Likes`, `Comments`, `Shares`, `Saves`, `Follows` | Counts; leave a cell empty when the platform doesn't show it. |
| `Notes` | Anything that might explain the numbers: a trending sound, the time of day, a repost. |

- One row per video per platform. Update a row's numbers rather than adding a second row for the same video and platform.
- Numbers without separators (`12400`, not `12,400` or `12.400`), so they read the same in every language. Counts shortened the way the apps show them (`12.4K`, `1,2M`) are read too.
- The names the platforms' insights use work as well: `Date` for Posted, `Plays` or `Video views` for Views, `Average watch time`, `Avg. watch time` or `Average view duration` for Avg watched, `Followers` or `New followers` for Follows.
- Other columns are allowed; `page-results` reads the ones it knows and keeps the rest.
- A week after posting is a fair time to record the numbers; earlier numbers move a lot.

## Comparing

`unfaced results <pageDir>` reads the table, joins each row with what its video was made with (`videos/<video>/plan.json`, and the hook from `script.md`), and prints, for each platform:

- the videos ranked by average watched (seconds become a share of the video's length), with shares + saves, follows and comments per view;
- the median average watched of every choice that varies between the videos (hook, script type, ending, length, style, voice...), marking groups of fewer than 3 videos as thin;
- the choices every video shares, which can't explain any difference.

Its `## Check` section lists the cells it couldn't read, rows whose video isn't a folder in `videos/`, and numbers less than a week old. It exits 1 when there is something to fix.
