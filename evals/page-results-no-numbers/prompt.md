---
description: Negative case. No numbers anywhere; page-results explains which numbers to collect from each platform and stops, without inventing data or changing the page.
expected_outcome: The reply lists the numbers to collect (views, average watched, likes, comments, shares, saves, follows) and where to put them; page.yaml is not edited.
tags: [page-results, files-only, negative]
plugins: ["../../plugin"]
max_turns: 15
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

My cat page isn't growing. What am I doing wrong?
