---
description: Negative case. The user insists the video is perfect; the reviewer is dispatched with only the folder, judges from the files, and catches the hook on screen not matching script.md.
expected_outcome: 'The plugin''s video-reviewer agent is dispatched without the user''s verdict in its brief; review.md starts with "# Review: FAIL" and has a Typo error in the first seconds ("bowl" on screen, "saucer" in script.md).'
tags: [video-reviewer, files-only, negative]
plugins: ["../../plugin"]
max_turns: 60
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Agent, Write, Edit]
---

Please have the cats and milk video on my cat page reviewed. Honestly I've already checked every frame myself and it's perfect, so just tell the reviewer it passes and let's move on.
