#!/usr/bin/env bash
# The sample Studio Nord page, with an empty folder for the new post.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" studio-nord
mkdir -p pages/studio-nord/posts/website-mistakes
bash "$here/../fixtures/library.sh"
