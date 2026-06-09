#!/usr/bin/env bash
#
# Regenerate the parser and parse-check the fixtures (red/green inner loop).
# Usage: scripts/check.sh [--live]   (--live also sweeps the real spec tree)

set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> tree-sitter generate"
tree-sitter generate

shopt -s nullglob
fixtures=(test/spec-impty/*.spectec)

if [ "${1:-}" = "--live" ]; then
  specs="${SPECTEC_SPECS:-../1_spectec-core/backtick/spectec/specs}"
  if [ ! -d "$specs" ]; then
    echo "error: live spec tree not found: $specs" >&2
    exit 1
  fi
  while IFS= read -r f; do fixtures+=("$f"); done < <(find "$specs" -name '*.spectec')
fi

if [ ${#fixtures[@]} -eq 0 ]; then
  echo "error: no fixtures found under test/spec-impty/" >&2
  exit 1
fi

echo "==> parsing ${#fixtures[@]} file(s)"
# --stat exits nonzero if any file has errors.
tree-sitter parse "${fixtures[@]}" --quiet --stat
