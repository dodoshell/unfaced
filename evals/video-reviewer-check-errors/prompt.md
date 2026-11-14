---
description: The video-reviewer agent reviews a made video from its files only and turns the automatic checks' error into a timed Audio error, so the review fails.
expected_outcome: 'The plugin''s video-reviewer agent is dispatched; review.md starts with "# Review: FAIL", is round 1, and has an `error · 00:14.x · Audio` line for the caption sync error.'
tags: [video-reviewer, files-only]
plugins: ["../../plugin"]
max_turns: 60
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill, Agent, Write, Edit]
---

The cats and milk video on my cat page is rendered and its frames are extracted. Can you get it reviewed independently before I post it?
