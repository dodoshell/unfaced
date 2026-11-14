#!/usr/bin/env bash
# No page yet: the agent writes it. Only the library, for `unfaced page`.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/library.sh"
