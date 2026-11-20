---
description: The user brings their own text. post-make lays it out as slides without rewriting a word, and stops for approval.
expected_outcome: pages/studio-nord/posts/about-us/slides.md holds the user's five sentences verbatim; the reply flags anything that does not fit instead of changing it, and asks for approval; `unfaced post` never runs.
tags: [post-make, shell]
plugins: ["../../plugin"]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Turn this text into our About us carousel for Instagram. Use my words exactly, only split them into slides. The folder is ready: pages/studio-nord/posts/about-us

We build websites for shop owners who have no time to waste. Every project starts with a free call, never a long form. You get a fixed price before we write a single line. Most shops are online in three weeks. Tell us what you sell and we do the rest.
