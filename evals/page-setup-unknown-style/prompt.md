---
description: Negative case. The user asks for a look the catalog doesn't have (claymation); page-setup must not invent a style or switch without asking, and should offer the closest catalog styles.
expected_outcome: 'page.yaml still has `style: 3`; the reply says there is no claymation style and offers the closest ones (such as 01 Soft 3D or 07 Paper cut-out) or keeping the current style.'
tags: [page-setup, shell, negative]
plugins: ["../../plugin"]
max_turns: 15
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit, Bash]
---

Switch my cat page over to the claymation style.
