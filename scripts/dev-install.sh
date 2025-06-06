#!/bin/bash

# Development script for tree-sitter-spectec
# This script regenerates the parser and installs it for Neovim

set -e

echo "🔧 Regenerating parser from grammar.js..."
tree-sitter generate

echo "🔨 Compiling parser..."
cc -o parser.so -I./src src/parser.c -shared -Os -fPIC

echo "📁 Installing parser to Neovim..."
NVIM_PARSER_DIR="$HOME/.local/share/nvim/lazy/nvim-treesitter/parser"
mkdir -p "$NVIM_PARSER_DIR"
cp parser.so "$NVIM_PARSER_DIR/spectec.so"

echo "✅ Parser updated! Restart Neovim or run :TSBufToggle to see changes."
echo "💡 You can also run :InspectTree to see the parse tree." 