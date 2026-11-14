---
description: Negative case. The page already has a video on the topic; video-make asks whether to rework it or start a new one instead of overwriting its script.md.
expected_outcome: videos/why-cats-purr/script.md is untouched; the reply asks rework or new video.
tags: [video-make, files-only, negative]
plugins: ["../../plugin"]
max_turns: 15
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

Make a video about why cats purr for my cat page.
