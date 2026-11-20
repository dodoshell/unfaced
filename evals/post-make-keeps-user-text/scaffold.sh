#!/usr/bin/env bash
# The sample Studio Nord page, with an empty folder for the user's About us post.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" studio-nord
mkdir -p pages/studio-nord/posts/about-us
bash "$here/../fixtures/library.sh"
