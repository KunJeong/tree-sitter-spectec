package tree_sitter_spectec_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_spectec "github.com/tree-sitter/tree-sitter-spectec/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_spectec.Language())
	if language == nil {
		t.Errorf("Error loading SpecTec grammar")
	}
}
