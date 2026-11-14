#!/usr/bin/env bash
# The sample cat page; videos/why-cats-purr/ already has a script.md.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" curious-cats
