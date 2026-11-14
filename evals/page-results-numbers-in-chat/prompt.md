---
description: The user gives numbers in chat. page-results records them in results.md, one row per video and platform, with numbers written without separators, and shows what it added.
expected_outcome: pages/curious-cats/results.md created with 12400 and 2100 written without separators; the reply shows the rows and compares the two videos.
tags: [page-results, files-only]
plugins: ["../../plugin"]
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

Here are my TikTok numbers for the cat page, a week after posting. why-cats-purr: 12,400 views, 71% average watched, 980 likes, 45 comments, 120 shares, 210 saves, 38 follows. cats-and-milk: 2,100 views, 38% average watched, 90 likes, 3 comments, 4 shares, 10 saves, 1 follow. What's working?
