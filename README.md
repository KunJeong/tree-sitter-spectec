# tree-sitter-spectec

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for the [SpecTec](https://github.com/WebAssembly/spectec) specification language used in WebAssembly specifications.

## Disclaimer
This grammar is currently a minimal subset of the full SpecTec grammar, to support syntax highlighting in neovim. More comprehensive highlighting and language support might be added in the future.

## Installation

### Neovim (with nvim-treesitter)

Add the parser configuration to your Neovim setup. The exact method depends on your plugin manager:

#### Lazy.nvim

Add this to your `nvim-treesitter` configuration:

```lua
{
  "nvim-treesitter/nvim-treesitter",
  build = ":TSUpdate",
  config = function()
    local configs = require("nvim-treesitter.configs")
    
    configs.setup({
      ensure_installed = { 
        "c", "lua", "vim", "vimdoc", "query", 
        "spectec" -- Add spectec to the list
      },
      sync_install = false,
      highlight = { enable = true },
      indent = { enable = true },
    })

    -- Configure the spectec parser
    local parser_config = require("nvim-treesitter.parsers").get_parser_configs()
    parser_config.spectec = {
      install_info = {
        url = "https://github.com/KunJeong/tree-sitter-spectec", -- Replace with your repo
        files = { "src/parser.c" },
        branch = "main",
        generate_requires_npm = false,
        requires_generate_from_grammar = false,
      },
      filetype = "spectec",
    }

    -- Register file extensions
    vim.filetype.add({
      extension = {
        spectec = "spectec",
        watsup = "spectec",
      },
    })
  end
}
```

#### Packer.nvim

```lua
use {
  'nvim-treesitter/nvim-treesitter',
  run = ':TSUpdate',
  config = function()
    -- Same configuration as above
  end
}
```

#### Plug (vim-plug)

```vim
Plug 'nvim-treesitter/nvim-treesitter', {'do': ':TSUpdate'}

" Add this to your init.vim or init.lua
lua << EOF
-- Same Lua configuration as above
EOF
```

### Installing the Parser

After adding the configuration:

1. **Restart Neovim**
2. **Install the parser:**
   ```
   :TSInstall spectec
   ```
3. **Verify installation:**
   Open a `.spectec` or `.watsup` file, select a node and run `:InspectTree`

### Setting up Syntax Highlighting

The syntax highlighting queries are included in this repository. They will be automatically loaded when you install the parser. 

If you want to customize the highlighting, you can override the queries by creating files in your Neovim configuration:

```
~/.config/nvim/queries/spectec/highlights.scm
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (for tree-sitter CLI)
- [tree-sitter CLI](https://tree-sitter.github.io/tree-sitter/creating-parsers#installation)
- A C compiler (gcc, clang, etc.)

### Setting up for Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/tree-sitter-spectec
   cd tree-sitter-spectec
   ```

2. **Install tree-sitter CLI if you haven't:**
   ```bash
   npm install -g tree-sitter-cli
   ```

3. **Generate the parser:**
   ```bash
   tree-sitter generate
   ```

4. **Test the parser:**
   ```bash
   tree-sitter test
   tree-sitter parse examples/test.spectec
   ```

### Development Workflow

For active development with Neovim, you can use the makefile command:

```bash
# Regenerate and install parser in one command
make dev-install
```
This will:
- Regenerate the parser from `grammar.js`
- Compile the parser
- Install it to your Neovim treesitter directory

After running either command, restart Neovim or run `:TSBufToggle` to see your changes.

### Testing

Test your changes with:

```bash
# Test basic parsing
tree-sitter test

# Parse specific files
tree-sitter parse spec-mini/2c1-runtime-type.watsup

# Generate and inspect parse tree
tree-sitter parse --debug examples/test.spectec
```

## File Structure

```
├── grammar.js              # Tree-sitter grammar definition
├── src/
│   ├── parser.c            # Generated parser (don't edit manually)
│   ├── tree_sitter/        # Generated headers
├── queries/
│   └── highlights.scm      # Syntax highlighting queries
├── scripts/
│   └── dev-install.sh      # Development installation script
└── README.md               # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes to `grammar.js`
4. Test with `tree-sitter test` and `tree-sitter parse`
5. Update queries if needed
6. Submit a pull request

## License

[MIT License](LICENSE)

## Related Projects

- [Spectec](https://github.com/WebAssembly/spectec) - The specification language this parser supports
- [tree-sitter](https://tree-sitter.github.io/tree-sitter/) - The parsing framework
- [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter) - Neovim treesitter integration 