#!/usr/bin/env bash
# The sample Studio Nord page without a brand block: no handle, logo or tone yet.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" studio-nord-plain
