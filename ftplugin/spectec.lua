-- Start tree-sitter highlighting for SpecTecX buffers. Harmless if the parser
-- is not built yet (run `:TSInstall spectec`) or if another plugin already
-- started it.
pcall(vim.treesitter.start)
