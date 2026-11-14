#!/usr/bin/env bash
# The sample cat page with an ideas.md from an earlier week (overlay/).
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" curious-cats
