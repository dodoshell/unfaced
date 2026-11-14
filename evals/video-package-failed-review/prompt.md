---
description: Negative case. The video's last review failed; video-package tells the user what is still open and asks before packaging.
expected_outcome: No post.md; the reply names the open layout error from review.md and asks whether to fix it first or package anyway.
tags: [video-package, files-only, negative]
plugins: ["../../plugin"]
max_turns: 15
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

Get the purr video on my cat page ready to post, please.
