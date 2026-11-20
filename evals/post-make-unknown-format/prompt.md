---
description: Negative case. The user asks for a Pinterest pin, which is not a format; post-make says so and offers the four formats by purpose instead of making one up.
expected_outcome: No file written; the reply says a Pinterest pin is not a format and offers the Instagram carousel, the single post, the LinkedIn carousel (a PDF) and the story, each by what it is for.
tags: [post-make, files-only, negative]
plugins: ["../../plugin"]
max_turns: 12
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

Make a Pinterest pin for my studio's summer offer: 20% off the first website until the end of August. The page is pages/studio-nord.
