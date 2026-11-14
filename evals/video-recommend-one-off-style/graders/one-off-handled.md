---
type: llm
---

The user's cat page uses style 03 (Flat cartoon). For one video, on why cats knead, they want to try style 01 (Soft 3D), "just this once", and asked for options.

PASS if the reply offers 2 or 3 combinations that use Soft 3D (style 01) for this video, recommends one, and explains that a one-off choice like this goes in the video's own script.md front matter while the page's profile (page.yaml) keeps style 03.

FAIL if it changes or offers to change page.yaml's style for this request, ignores the Soft 3D request, or gives no options.
