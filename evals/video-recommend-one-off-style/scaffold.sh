#!/usr/bin/env bash
# The sample cat page (style 03, Flat cartoon).
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" curious-cats
