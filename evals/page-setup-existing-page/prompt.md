---
description: The user shows a screenshot of their existing posts. page-setup reads the image, plays back a draft profile (colours, style, fonts, tone) and asks what it cannot settle, writing nothing until the user agrees.
expected_outcome: The image is read; the reply plays back the colours, a post style (13 Night tech), the fonts and the tone, asks at least one question, and no page.yaml exists yet.
tags: [page-setup, files-only]
plugins: ["../../plugin"]
max_turns: 15
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

We are Studio Nord, a small web studio (@studionord on Instagram). Here is a screenshot of our latest posts: screenshots/instagram-posts.png. Set our page up so new posts look like these.
