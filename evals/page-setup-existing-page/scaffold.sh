#!/usr/bin/env bash
# No page yet. The user's "screenshot" of their posts is the repository's own posts grid.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p screenshots
cp "$here/../../docs/media/posts-grid.png" screenshots/instagram-posts.png
