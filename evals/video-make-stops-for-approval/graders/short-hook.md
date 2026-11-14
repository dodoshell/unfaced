---
type: regex
pattern: '^## Hook[ \t]*\r?\n(?:[ \t]*\r?\n)*[ \t]*(?:[^\s>#]\S*[ \t]+){0,10}[^\s>#]\S*[ \t]*(?:\r?\n(?:[ \t]*\r?$|>|#)|\r?\n?(?![\s\S]))'
flags: m
target:
  source: file
  path: pages/curious-cats/videos/why-cats-knead/script.md
---
