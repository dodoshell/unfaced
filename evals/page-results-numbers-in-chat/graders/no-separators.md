---
type: regex
pattern: '^\|[^\n]*\b\d{1,3}[,.]\d{3}\b'
flags: m
match: not_contains
target:
  source: file
  path: pages/curious-cats/results.md
---
