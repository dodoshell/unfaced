---
description: The user leaves every choice to the agent. page-setup decides without asking, picks only ready catalog entries, writes page.yaml and validates it with the CLI.
expected_outcome: pages/deep-weird/page.yaml with a fixed ready style, fixed voice and captions, validated with `unfaced page`; the reply names each pick with a reason.
tags: [page-setup, shell]
plugins: ["../../plugin"]
max_turns: 30
timeout_seconds: 600
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Start a new faceless page about weird deep-sea animals for teenagers, in English. Put it in pages/deep-weird. You choose everything, I trust you, just write it.
