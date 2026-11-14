---
type: regex
pattern: '^voice:\s*\d+\s*(#.*)?$[\s\S]*^captions:\s*\d+\s*(#.*)?$|^captions:\s*\d+\s*(#.*)?$[\s\S]*^voice:\s*\d+\s*(#.*)?$'
flags: m
target:
  source: file
  path: pages/deep-weird/page.yaml
---
