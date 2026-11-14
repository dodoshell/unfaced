---
description: Negative case. The user is in a hurry but never says to skip approval; video-make still stops after the script.
expected_outcome: A script.md in a new folder under pages/curious-cats/videos/, the script shown with a request to approve; `unfaced make`, `frames` and `cover` never run.
tags: [video-make, shell, negative]
plugins: ["../../plugin"]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

I need a video about how cats see in the dark for my cat page, tonight. I'm in a hurry so please be quick about it.
