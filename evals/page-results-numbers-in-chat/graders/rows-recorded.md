---
type: regex
pattern: '^\|\s*why-cats-purr\s*\|\s*TikTok\s*\|[^\n]*\|\s*12400\s*\|[\s\S]*^\|\s*cats-and-milk\s*\|\s*TikTok\s*\|[^\n]*\|\s*2100\s*\||^\|\s*cats-and-milk\s*\|\s*TikTok\s*\|[^\n]*\|\s*2100\s*\|[\s\S]*^\|\s*why-cats-purr\s*\|\s*TikTok\s*\|[^\n]*\|\s*12400\s*\|'
flags: m
target:
  source: file
  path: pages/curious-cats/results.md
---
