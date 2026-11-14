#!/usr/bin/env bash
# The sample cat page, with an empty folder for the new video.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" curious-cats
mkdir -p pages/curious-cats/videos/why-cats-knead
bash "$here/../fixtures/library.sh"
