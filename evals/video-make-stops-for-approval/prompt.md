---
description: video-make writes script.md in the page's video folder, keeps the hook short and the choices inside the page's profile, then stops for the user's approval before any voice or render.
expected_outcome: pages/curious-cats/videos/why-cats-knead/script.md with script type 06 or 09, ending 05 and a hook of at most 12 words; the reply shows the script and asks for approval; `unfaced make`, `frames` and `cover` never run.
tags: [video-make, shell]
plugins: ["../../plugin"]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Make a video for my cat page about why cats knead blankets. I already made the folder for it: pages/curious-cats/videos/why-cats-knead
