# tree-sitter-spectec

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for the [SpecTec](https://github.com/WebAssembly/spectec) specification language used in WebAssembly specifications.

## Disclaimer
This grammar is currently a minimal subset of the full SpecTec grammar, to support syntax highlighting in neovim. More comprehensive highlighting and language support might be added in the future.

## Installation

### Neovim

This repository is a self-contained Neovim plugin: installing it registers the `.spectec` / `.watsup` filetypes, ships the highlight queries on the runtimepath, and compiles the parser in a one-time build step. It needs a **C compiler**, but **not** nvim-treesitter or the tree-sitter CLI - so it behaves the same on any Neovim 0.9+ (and on either nvim-treesitter branch, or none).

With **lazy.nvim**:

```lua
{ "KunJeong/tree-sitter-spectec", build = "make parser" }
```

With **packer.nvim**:

```lua
use { "KunJeong/tree-sitter-spectec", run = "make parser" }
```

`build`/`run` compiles `parser/spectec.so` from the committed `src/parser.c`. Open a `.spectec` or `.watsup` file and highlighting starts automatically; `:InspectTree` shows the parse tree.

#### Without a plugin manager

```bash
git clone https://github.com/KunJeong/tree-sitter-spectec
cd tree-sitter-spectec && make parser
```

Then add the checkout to your runtimepath, e.g. in `init.lua`:

```lua
vim.opt.runtimepath:append("/path/to/tree-sitter-spectec")
```

#### Alternative: let nvim-treesitter build the parser

If you already manage parsers with nvim-treesitter (the `master` branch), skip the `build` step and register the grammar instead:

```lua
require("nvim-treesitter.parsers").get_parser_configs().spectec = {
  install_info = {
    url = "https://github.com/KunJeong/tree-sitter-spectec",
    files = { "src/parser.c" },
    branch = "main",
    generate_requires_npm = false,
    requires_generate_from_grammar = false,
  },
  filetype = "spectec",
}
```

Then `:TSInstall spectec`. The plugin still supplies the filetypes and queries.

#### Customizing highlights

Highlighting works out of the box once the plugin is installed and the parser built. To override it, drop your own file at `~/.config/nvim/queries/spectec/highlights.scm`.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) — `npm install` provides the pinned tree-sitter CLI
- A C compiler (gcc, clang, etc.)

### Setting up for Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/tree-sitter-spectec
   cd tree-sitter-spectec
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   This installs the pinned `tree-sitter` CLI locally. Run it with `npx tree-sitter`, or use the `npm run` scripts below.

3. **Generate the parser:**
   ```bash
   npx tree-sitter generate
   ```

4. **Test the parser:**
   ```bash
   npm test
   npx tree-sitter parse test/spec-impty/base.spectec
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
# Run the corpus tests
npm test

# Parse the fixtures and report errors (add --live to sweep the real spec tree)
npm run check

# Verify the committed parser still matches grammar.js
npm run check-generated

# Parse and inspect a specific file
npx tree-sitter parse test/spec-impty/base.spectec
```

## File Structure

```
├── grammar.js              # Tree-sitter grammar definition
├── src/
│   ├── parser.c            # Generated parser (don't edit manually)
│   └── tree_sitter/        # Generated headers
├── queries/
│   └── spectec/
│       └── highlights.scm  # Syntax highlighting queries
├── plugin/
│   └── spectec.lua         # Neovim: filetype detection
├── ftplugin/
│   └── spectec.lua         # Neovim: start highlighting for spectec buffers
├── scripts/
│   ├── build-parser.sh     # Compile parser/spectec.so (the `make parser` step)
│   └── dev-install.sh      # Development installation script
└── README.md               # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes to `grammar.js`
4. Test with `npm test` and `npm run check-generated`
5. Update queries if needed
6. Submit a pull request

## License

[MIT License](LICENSE)

## Related Projects

- [Spectec](https://github.com/WebAssembly/spectec) - The specification language this parser supports
- [tree-sitter](https://tree-sitter.github.io/tree-sitter/) - The parsing framework
- [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter) - Neovim treesitter integration 
