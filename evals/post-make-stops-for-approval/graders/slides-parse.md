---
type: regex
pattern: '(?<![\s\S])(?:-{3}\r?\n[\s\S]*?\r?\n-{3}\r?\n)?\s*^## cover\b[\s\S]*^## \w+'
flags: m
target:
  source: file
  path: pages/studio-nord/posts/website-mistakes/slides.md
---
