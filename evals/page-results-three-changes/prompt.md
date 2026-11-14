---
description: Negative case. The user asks for ten changes; page-results gives at most three, each tied to the numbers in results.md, says two videos are thin evidence, keeps platforms apart, records the analysis and leaves page.yaml alone.
expected_outcome: At most three suggestions with numbers and a test each; a `## Notes, <date>` section at the end of results.md; page.yaml never edited.
tags: [page-results, files-only, negative]
plugins: ["../../plugin"]
max_turns: 25
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

I put my numbers in results.md for the cat page. Give me a list of the ten things I should change.
