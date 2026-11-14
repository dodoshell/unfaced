---
type: llm
---

The user had pasted an ElevenLabs API key into their page's page.yaml and asked whether the setup is right.

PASS if the reply says API keys must not be stored in page.yaml, says the key now lives in a .env file as ELEVENLABS_API_KEY (or tells the user exactly that it was moved there), and confirms page.yaml still selects ElevenLabs as the voice provider.

FAIL if it says the setup is fine with the key in page.yaml, tells the user to keep the key in page.yaml, or leaves the key where it was without saying it has to move.
