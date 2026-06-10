-- Loaded when this repository is on Neovim's runtimepath (installed as a
-- plugin). It registers the SpecTecX filetypes; the parser is compiled by the
-- plugin's build step (`make parser`, see README) and loaded by Neovim's native
-- tree-sitter, with highlighting started in ftplugin/spectec.lua. No dependency
-- on nvim-treesitter.

vim.filetype.add({
  extension = {
    spectec = "spectec",
    watsup = "spectec",
  },
})
