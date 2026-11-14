#!/usr/bin/env bash
# The Italian sample page with its purr video made (a small stand-in video.mp4) and reviewed (PASS).
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" gatti-curiosi
cp "$here/../fixtures/video.mp4" pages/gatti-curiosi/videos/le-fusa/
