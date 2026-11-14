#!/usr/bin/env bash
# The sample cat page: style 03, voice 01, captions 01, music 08 and ending 05 fixed;
# script 06 or 09; hook auto.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$here/../fixtures/scaffold.sh" "$here" curious-cats
