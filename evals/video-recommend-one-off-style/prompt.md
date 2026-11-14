---
description: The user wants a different ready style for one video. video-recommend uses it in the options and says the choice goes in that video's script.md, leaving page.yaml as it is.
expected_outcome: Options with style 01 Soft 3D for this video; the reply says per-video choices go in script.md; page.yaml is never edited.
tags: [video-recommend, shell]
plugins: ["../../plugin"]
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

For the kneading video on my cat page I'd like to try the Soft 3D look instead of the usual one, just this once. What are my options?
