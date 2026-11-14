---
description: Negative case. The user wants a style that is still planned (10 Neon synthwave); video-recommend says so and builds its options from ready styles only.
expected_outcome: The reply says neon synthwave is not ready; every combination uses a ready style (03, the page's, or 01); no file changed.
tags: [video-recommend, shell, negative]
plugins: ["../../plugin"]
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

For my cat page's next video, about why cats knead, I'd love the neon synthwave look. What would you suggest?
