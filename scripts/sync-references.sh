#!/usr/bin/env bash
#
# Refresh references/ from the canonical SpecTecX sources.
#
# references/ vendors read-only copies of the surface-syntax sources (lexer,
# parser, atom definitions) so grammar work can track the real language. The
# copies are read from a committed git ref rather than a working tree, so a
# sync is reproducible and records the exact source commit.
#
# Usage: scripts/sync-references.sh [--ref REF] [--repo DIR] [--no-fetch]
#   --ref REF   git ref to vendor from (default: origin/main, the canonical
#               source of truth). While backtick-unify is unmerged, vendor it
#               with: --ref feat/backtick-unify
#   --repo DIR  a SpecTecX clone or worktree to resolve the ref through
#               (default: $SPECTEC, else ../1_spectec-core/main).
#   --no-fetch  skip refreshing the remote before reading a remote ref.

set -euo pipefail
cd "$(dirname "$0")/.."

ref="origin/main"
repo="${SPECTEC:-../1_spectec-core/main}"
fetch=1
while [ $# -gt 0 ]; do
  case "$1" in
    --ref) ref="$2"; shift 2 ;;
    --repo) repo="$2"; shift 2 ;;
    --no-fetch) fetch=0; shift ;;
    *) echo "error: unknown argument: $1" >&2; exit 2 ;;
  esac
done

if ! git -C "$repo" rev-parse --git-dir >/dev/null 2>&1; then
  echo "error: not a SpecTecX git worktree: $repo" >&2
  echo "       pass --repo DIR or set \$SPECTEC" >&2
  exit 1
fi

# When the ref names a remote (e.g. origin/main), refresh that remote first so
# the canonical source is current. A local branch leaves this a no-op.
remote="${ref%%/*}"
if [ "$fetch" -eq 1 ] && git -C "$repo" remote | grep -qx "$remote"; then
  echo "==> fetching $remote"
  git -C "$repo" fetch --quiet "$remote" || echo "warning: fetch failed; using local objects" >&2
fi

if ! git -C "$repo" rev-parse --verify --quiet "$ref^{commit}" >/dev/null; then
  echo "error: ref not found in $repo: $ref" >&2
  exit 1
fi

# Source path (relative to the SpecTecX repo root) -> reference filename.
sources=(
  "spectec/lib/pass/parse/lexer.mll:lexer.mll"
  "spectec/lib/pass/parse/parser.mly:parser.mly"
  "spectec/lib/lang/xl/atom.ml:atom.ml"
  "spectec/lib/lang/el/types.ml:types.ml"
)

mkdir -p references
for entry in "${sources[@]}"; do
  src="${entry%%:*}"
  dst="${entry##*:}"
  git -C "$repo" show "$ref:$src" > "references/$dst"
  echo "  $src -> references/$dst"
done

commit="$(git -C "$repo" rev-parse --short "$ref^{commit}")"
{
  echo "Vendored read-only copies of the SpecTecX surface-syntax sources, kept"
  echo "as a reference while editing grammar.js. Do not edit by hand."
  echo
  echo "synced-from: $ref"
  echo "commit:      $commit"
  echo "refresh:     scripts/sync-references.sh [--ref REF] [--repo DIR]"
} > references/SOURCE

echo "synced references/ from $ref @ $commit"
