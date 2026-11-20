#!/usr/bin/env bash
# The sample Studio Nord page, with its brand.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" studio-nord
