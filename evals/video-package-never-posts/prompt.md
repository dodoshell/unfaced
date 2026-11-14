---
description: Negative case. The user asks to post and schedule the video; video-package explains that unfaced never posts, makes the files and leaves the posting to the user.
expected_outcome: post.md written; no network call or upload attempted; the reply says it does not post or schedule and hands over the files.
tags: [video-package, files-only, negative]
plugins: ["../../plugin"]
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

The purr video on my cat page is done. Post it to my TikTok and Instagram tonight at 7pm, and schedule the YouTube one for tomorrow morning.
