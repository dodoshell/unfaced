#!/usr/bin/env bash
# Installs this checkout's unfaced library where the skills' launcher looks for one,
# ~/.unfaced/lib/<version>; the cases tagged shell run it from their scaffold.sh.
#
# Usage: bash library.sh
#
# In an eval the OS sandbox shows the agent only plugin/, not the rest of this checkout, and
# keeps it from writing outside the workspace, so the launcher can neither find the library here
# nor install it on first use. HOME is the run's own temporary home, so nothing outside it changes.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
version="$(node -p 'require(process.argv[1]).version' "$root/package.json")"
lib="${UNFACED_HOME:-$HOME/.unfaced}/lib/$version"

mkdir -p "$lib"
for item in package.json tsconfig.json catalog docs engine schema node_modules; do
  cp -R "$root/$item" "$lib/"
done
