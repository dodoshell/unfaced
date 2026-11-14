---
description: Without web access, video-ideas marks ideas it could not confirm with "check before scripting", and treats a popular myth the user asks for as a myth rather than a fact.
expected_outcome: ideas.md with ideas marked "check before scripting"; the landing-on-their-feet idea says cats don't always land on their feet.
tags: [video-ideas, files-only]
plugins: ["../../plugin"]
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

Give me 10 video ideas for my cat page and a calendar for next week, 4 posts. Put in one about how cats always land on their feet, my followers love that.
