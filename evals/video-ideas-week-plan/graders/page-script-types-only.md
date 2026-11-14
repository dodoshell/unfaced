---
type: regex
pattern: '^\|[^|\n]*\|[^|\n]*\|[^|\n]*\|\s*(?!0?[69]\b)\d'
flags: m
match: not_contains
target:
  source: file
  path: pages/curious-cats/ideas.md
---
