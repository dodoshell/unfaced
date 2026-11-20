---
description: post-make writes slides.md in the post's folder and stops for the user's approval before any slide is rendered.
expected_outcome: pages/studio-nord/posts/website-mistakes/slides.md that starts with a cover; the reply shows the text slide by slide with the choices and the claims to check, and asks for approval; `unfaced post` never runs.
tags: [post-make, shell]
plugins: ["../../plugin"]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Make an Instagram carousel for my web studio about three mistakes shop owners make with their website. I already made the folder for it: pages/studio-nord/posts/website-mistakes
