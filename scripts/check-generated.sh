#!/usr/bin/env bash
#
# Fail if the committed parser has drifted from grammar.js.
#
# src/ is generated but tracked (the README install reads committed sources
# without an npm build), so it must be regenerated and committed alongside any
# grammar.js change. Run before committing a grammar edit; CI runs the same.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> tree-sitter generate"
tree-sitter generate

if ! git diff --quiet -- src/; then
  echo "error: src/ is out of date with grammar.js" >&2
  echo "       run 'tree-sitter generate' and commit the result:" >&2
  git --no-pager diff --stat -- src/ >&2
  exit 1
fi

echo "src/ is up to date with grammar.js"
