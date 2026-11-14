---
description: Negative case. The user pasted an API key into page.yaml; page-setup moves it to .env and keeps only the provider choice in the profile.
expected_outcome: 'page.yaml keeps `voice: elevenlabs` under providers and no key; the key is in a .env file as ELEVENLABS_API_KEY; the reply says why.'
tags: [page-setup, files-only, negative]
plugins: ["../../plugin"]
max_turns: 15
timeout_seconds: 300
allowed_tools: [Read, Glob, Grep, Skill, Write, Edit]
---

I switched the voice of my cat page to ElevenLabs and pasted my API key into its page.yaml. Can you check the setup is right?
