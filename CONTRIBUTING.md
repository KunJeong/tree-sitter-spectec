# Contributing

The tree-sitter grammar for [SpecTecX](https://github.com/KunJeong/tree-sitter-spectec).
It tracks the SpecTecX surface syntax, which lives in a separate OCaml repo, so
the work is keeping the grammar aligned with that language.

## Development loop

1. `npm run sync-references` — populate `references/` (gitignored copies of the
   lexer, parser, atom, and AST sources) from `origin/main`. Run it once after
   cloning and whenever the frontend changes; override with `--ref`/`--repo`.
2. Edit `grammar.js`.
3. `npm run check` — regenerate the parser and parse-check `test/spec-impty/`;
   `--live` also sweeps the real spec tree. A clean run has no errors.
4. `npm test` — run the `test/corpus/` cases.

For one file, `tree-sitter parse <file>` shows the tree and errors, and
`tree-sitter highlight <file>` previews the queries.

## Tests

- `test/spec-impty/` — whole-file fixtures. `base` and `closure` are vendored
  verbatim from the SpecTecX specs; `quickcheck` is a hand-authored probe.
- `test/corpus/` — `tree-sitter test` cases locking individual constructs.
  Every file here is parsed as a test, so keep it to cases:

  ```
  ==================
  variable declaration
  ==================

  var x : nat

  ---

  (source_file
    (variable_definition ...))
  ```

  Add a case as each construct lands; regenerate expected trees with
  `tree-sitter parse`.

## Commits

Mirror the SpecTecX repository:

- Subjects are high-level, no inline code identifiers.
- Bodies are one to three sentences on why and what, not how.
- ASCII only; no em-dashes.
