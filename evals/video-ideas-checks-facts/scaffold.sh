#!/usr/bin/env bash
# The sample cat page with its two videos, and no ideas.md yet.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" curious-cats
