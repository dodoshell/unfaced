#!/usr/bin/env bash
# The sample cat page; cats-and-milk has its frames (one per second), a passing check.json, and a
# script.md whose hook says "saucer" while the frames show "bowl" (overlay/).
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" curious-cats
cp -R "$here/../fixtures/frames/cats-and-milk" pages/curious-cats/videos/cats-and-milk/frames
