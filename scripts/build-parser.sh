#!/usr/bin/env bash
#
# Compile the committed parser into parser/spectec.so -- the layout Neovim's
# native tree-sitter loads from the runtimepath (parser/<lang>.so). The only
# requirement is a C compiler; the tree-sitter CLI is not needed, since
# src/parser.c is committed. Run by the plugin's build step (see README).

set -euo pipefail
cd "$(dirname "$0")/.."

: "${CC:=cc}"
mkdir -p parser
sources=(src/parser.c)
[ -f src/scanner.c ] && sources+=(src/scanner.c)
"$CC" -o parser/spectec.so -I src "${sources[@]}" -shared -O2 -fPIC
echo "built parser/spectec.so with $CC"
