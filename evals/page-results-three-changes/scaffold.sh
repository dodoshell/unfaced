#!/usr/bin/env bash
# The sample cat page with a results.md for its two videos on TikTok and Instagram (overlay/).
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" curious-cats
