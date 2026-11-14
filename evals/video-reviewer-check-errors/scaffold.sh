#!/usr/bin/env bash
# The sample cat page; cats-and-milk has its frames (one per second) and a check.json with a
# caption sync error (overlay/). No video.mp4, so the reviewer works from the frames.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" curious-cats
cp -R "$here/../fixtures/frames/cats-and-milk" pages/curious-cats/videos/cats-and-milk/frames
