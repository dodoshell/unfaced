---
type: regex
pattern: 'et al\.|doi\.org|\bdoi:|journal of'
flags: i
match: not_contains
target:
  source: file
  path: pages/curious-cats/videos/how-long-cats-sleep/script.md
weight: 2
---
