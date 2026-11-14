---
description: Negative case. The user asks for a style that is still planned (09 16-bit pixel art); page-setup must not write it into page.yaml and should offer a ready one.
expected_outcome: 'page.yaml still has `style: 3`; the reply says pixel art is not ready yet and offers a ready alternative or keeping the current style.'
tags: [page-setup, shell, negative]
plugins: ["../../plugin"]
max_turns: 15
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Switch my cat page over to the pixel art style.
