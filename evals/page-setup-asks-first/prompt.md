---
description: A new page with only the niche given. page-setup asks the few things it can't decide, in one message, before writing anything.
expected_outcome: One message with at most four questions (who it is for, language, mood, mascot) and the offer to say "you choose"; no page.yaml yet.
tags: [page-setup, files-only]
plugins: ["../../plugin"]
max_turns: 10
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

I want to start a faceless TikTok page about space facts. Can you set it up for me?
