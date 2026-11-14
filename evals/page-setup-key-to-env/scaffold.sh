#!/usr/bin/env bash
# The sample cat page, with a (fake) ElevenLabs key pasted into its page.yaml (overlay/).
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" curious-cats
