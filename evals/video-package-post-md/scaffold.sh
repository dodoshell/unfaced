#!/usr/bin/env bash
# The sample cat page with the purr video made (a small stand-in video.mp4) and reviewed (PASS).
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" curious-cats
cp "$here/../fixtures/video.mp4" pages/curious-cats/videos/why-cats-purr/
