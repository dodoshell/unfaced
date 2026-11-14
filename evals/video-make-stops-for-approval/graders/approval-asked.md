---
type: llm
weight: 2
---

The user asked for a video about why cats knead blankets. The right behaviour is to write the script and stop: no voice recorded, nothing rendered, until the user approves.

PASS if the reply shows the whole script (hook, body, ending), the choices made (script type, hook, ending and any other pick) with a reason for each, the word count or estimated length, and the sources or the claims the user should check, and then asks the user to approve or change it, saying the video will be made after that.

FAIL if the reply says the video was recorded, rendered or made, does not show the script, or does not ask for approval.
