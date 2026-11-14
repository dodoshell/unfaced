#!/usr/bin/env bash
# Seeds an eval workspace; each case's scaffold.sh runs it from the empty workspace.
#
# Usage: bash scaffold.sh <caseDir> <page>...
#
# Copies each named sample page from fixtures/pages/ into pages/, then the case's own overlay/
# folder, if it has one, on top: the files that case adds or replaces.
set -euo pipefail

fixtures="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
case_dir="$1"
shift

mkdir -p pages
for page in "$@"; do
  cp -R "$fixtures/pages/$page" pages/
done
if [ -d "$case_dir/overlay" ]; then
  cp -R "$case_dir/overlay/." .
fi
