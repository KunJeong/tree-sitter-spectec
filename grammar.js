/**
 * @file Spectec grammar for tree-sitter
 * @author KunJeong <kunjeong99@naver.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "spectec",

  extras: $ => [
    /\s/, // whitespace
    $.comment,
    $.separator, // separator line `----`
  ],
  rules: {
    source_file: $ => repeat($._definition),

    // ------------------------
    // Top-level definitions
    // ------------------------
    _definition: $ => choice(
      $.syntax_name, // `syntax` id
      $.syntax_definition, // `syntax` list(id `<` list(tparam, `,`) `>`, `,`)
      $.variable_definition, // `var` id `:` plaintyp hint*
      $.relation_definition, //`relation` id `:` notation_type hint*
      $.rule_definition, // `rule` id`/`id `:` exp list(`--` prem, nl)
      $.function_signature_definition, // `dec` id `<` list(tparam, `,`) `>` list(param, `,`) `:` plaintyp hint*
      $.function_definition, // `def` id `<` list(tparam, `,`) `>` list(arg, `,`) `=` exp list(`--` prem, nl)
    ),

    comment: $ => token(seq(';;', /[^\r\n]*/)), // Line comments starting with `;;`

    syntax_name: $ => seq(
      'syntax',
      field("name", $.identifier),
      field("type_parameters", optional($.type_parameters)),
    ),

    // syntax id = body OR syntax id<tparams> = body OR syntax id hint(...) = body
    syntax_definition: $ => seq(
      'syntax',
      $.identifier,
      optional($.type_parameters),
      optional($.hint),
      '=',
      $.syntax_body
    ),

    variable_definition: $ => seq(
      'var',
      field("name", $.identifier),
      ':',
      field("type", $.plain_type),
      field("hints", repeat($.hint))
    ),

    relation_definition: $ => seq(
      'relation',
      field("name", $.constructor_id),
      ':',
      field("body", $.notation_type),
      field("hints", repeat($.hint)),
    ),

    // Rule definitions use notation expressions
    rule_definition: $ => seq(
      'rule',
      field("relation_name", $.constructor_id),
      '/',
      field("rule_name", $.rule_id),
      ':',
      field("body", $.notation_expression),
      field("premises", repeat(seq('--', $.premise_expression, '\n'))),
    ),

    function_signature_definition: $ => seq(
      'dec', //TODO: support both `dec` and `def` keywords
      field("name", $.function_id),
      field("type_parameters", optional($.type_parameters)),
      field("parameters", optional($.type_parameter_list)),
      ':',
      field("return_type", $.type),
      field("hints", repeat($.hint)),
    ),

    // Function definitions use function expressions
    function_definition: $ => seq(
      'def',
      field("name", $.function_id),
      field("type_parameters", optional($.type_parameters)),
      field("parameters", optional($.pattern_parameter_list)),
      '=',
      field("return", $.function_expression),
      field("premises", repeat(seq('--', $.premise_expression)))
    ),

    separator: $ => '----',

    syntax_body: $ => choice( // El.deftyp
      // Named variants: | variant1 | variant2  (with leading |)
      repeat1(seq('|', $.syntax_variant)),
      // Named variants: variant1 | variant2 (without leading |)
      seq($.syntax_variant, repeat1(seq('|', $.syntax_variant))),
      // Single syntax variant (higher precedence than plain type)
      prec(3, $.syntax_variant),
      // Unnamed variant (singleton): syntax paramtyp = id dir typ (multiple types)
      prec(2, $.unnamed_variant),
      // Simple assignment: syntax tid = id (single type)
      prec(1, $.plain_type),
    ),

    unnamed_variant: $ => seq($.type, repeat1($.type)), // At least 2 types like "id dir typ"

    syntax_variant: $ => choice( // El.typcase
      // Constructor with types and optional hint (higher precedence)
      prec(3, seq($.constructor_id, repeat1($.type), optional($.hint))), 
      // Constructor with hint but no types
      prec(2, seq($.constructor_id, $.hint)), 
      // Constructor only (lowest precedence)
      prec(1, $.constructor_id), 
    ),

    type_parameters: $ => seq(
      '<',
      $.identifier,
      repeat(seq(',', $.identifier)),
      '>'
    ),

    type_parameter_list: $ => seq( // Parameters for function signatures (types only)
      '(',
      optional(seq(
        $.plain_type,
        repeat(seq(',', $.plain_type))
      )),
      ')'
    ),

    pattern_parameter_list: $ => seq(
      '(',
      optional(seq(
        $.pattern,
        repeat(seq(',', $.pattern))
      )),
      ')'
    ),

    // -------------------------
    // PATTERNS (currently only for function parameters)
    // -------------------------
    pattern: $ => choice(
      prec(3, $.bracket_pattern), // Bracket patterns like `{ K'* }
      prec(2, $.singleton_constructor_pattern), // Singleton pattern like IntT (higher precedence)
      prec(1, $.constructor_pattern), // Constructor pattern like IntV i, FIntV n bs
      $.list_constructor_pattern, // Pattern like t :: t'*
      $.arrow_pattern, // Pattern like K -> V
      $.iterator_pattern, // Pattern like t'*
      $.number_literal, // Number literals like 0, 1
      $.regular_id, // Simple parameter like i, n, bs (lowest precedence)
      $.epsilon_literal, // eps pattern
      $.wildcard_pattern, // _ pattern
    ),

    // List constructor pattern for function parameters
    list_constructor_pattern: $ => prec.right(4, seq(
      field("head", $.pattern),
      '::',
      field("tail", $.pattern)
    )),

    // Bracket patterns like `{ K'* }
    bracket_pattern: $ => choice(
      seq('`{', optional($.pattern), '}'),
      seq('`[', optional($.pattern), ']'),
      seq('`(', optional($.pattern), ')'),
    ),

    // Constructor patterns in function parameters
    constructor_pattern: $ => prec.right(seq(
      field("name", $.camelcase_constructor_id),
      field("arguments", repeat1($.pattern_argument))
    )),



    // ---------------------------
    // PREMISES
    // ----------------------------
    premise_expression: $ => choice(
      $.rule_premise,        // relid : notation_expression  
      $.if_premise,          // if function_expression (boolean condition)
      $.else_premise,        // otherwise
      $.variable_premise,    // var id : type
    ),

    // Rule premises use notation expressions (like relid : C_0 frame |- exp)
    rule_premise: $ => seq(
      field("relation", $.constructor_id),
      ':',
      field("body", $.notation_expression)
    ),

    // If premises use function expressions (boolean conditions) 
    if_premise: $ => seq(
      'if',
      field("condition", $.function_expression)
    ),

    // Else premises are just "otherwise"
    else_premise: $ => 'otherwise',

    // Variable premises for variable declarations
    variable_premise: $ => seq(
      'var',
      field("name", $.regular_id),
      ':',
      field("type", $.type)
    ),

    singleton_constructor_pattern: $ => $.camelcase_constructor_id,

    pattern_argument: $ => choice(
      $.regular_id,
      $.wildcard_pattern,
      $.number_literal,
      $.epsilon_literal,
      $.camelcase_constructor_id,
      seq('(', $.pattern, ')'), // Parenthesized patterns
    ),

    // Iterator patterns like t'*
    iterator_pattern: $ => seq($.regular_id, $.iterator),

    // Arrow patterns like K -> V
    arrow_pattern: $ => prec.left(3, seq(
      field("left", $.pattern),
      '->',
      field("right", $.pattern)
    )),

    wildcard_pattern: $ => '_',

    // -------------------------
    // FUNCTION EXPRESSIONS (for function bodies)
    // -------------------------
    function_expression: $ => choice(
      // Literals
      $.boolean_literal,
      $.number_literal,
      $.text_literal,
      $.epsilon_literal,

      // Variables and constructors
      $.variable_expression,
      $.constructor_expression,
      $.iterator_expression,

      // Function calls
      $.call_expression,

      // Arithmetic
      $.arithmetic_expression,

      // Collection operations
      $.list_constructor_expression,
      $.concatenation_expression,
      $.membership_expression,
      $.arrow_expression,

      // Structure
      $.parenthesized_function_expression,
      $.bracket_expression,
    ),

    variable_expression: $ => $.regular_id,

    constructor_expression: $ => prec.right(seq(
      $.constructor_id,
      repeat($.function_expression),
    )),

    iterator_expression: $ => prec(2, seq($.function_expression, $.iterator)),

    parenthesized_function_expression: $ => seq('(', $.function_expression, ')'),

    // List constructor (::)
    list_constructor_expression: $ => prec.right(6, seq(
      field("head", $.function_expression),
      '::',
      field("tail", $.function_expression)
    )),

    // List operators  
    concatenation_expression: $ => prec.left(5, seq(
      field("left", $.function_expression),
      '++',
      field("right", $.function_expression)
    )),

    membership_expression: $ => prec.left(4, seq(
      field("element", $.function_expression),
      '<-',
      field("collection", $.function_expression)
    )),

    arrow_expression: $ => prec.left(3, seq(
      field("left", $.function_expression),
      '->',
      field("right", $.function_expression)
    )),

    // Function calls
    call_expression: $ => choice(
      // Function call with arguments (and optional type parameters) - higher precedence
      prec(2, seq(
        $.function_id,
        optional($.type_parameters), // Support type parameters like <X>
        $.argument_list,
      )),
      // Function call with only type parameters (no arguments) - lower precedence
      prec(1, seq(
        $.function_id,
        $.type_parameters, // Type parameters are required for this variant
      )),
    ),

    argument_list: $ => seq(
      '(',
      optional(seq(
        $.function_expression,
        repeat(seq(',', $.function_expression))
      )),
      ')'
    ),

    arithmetic_expression: $ => seq('$', '(', $._arithmetic_expr, ')'),

    // Arithmetic expressions inside $(...) 
    _arithmetic_expr: $ => choice(
      $.binary_expression,
      $.comparison_expression,
      $.variable_expression,
      $.number_literal,
      $.call_expression,
      seq('(', $._arithmetic_expr, ')'),
    ),

    binary_expression: $ => prec.left(2, seq(
      field("left", $._arithmetic_expr),
      field("operator", choice('+', '-', '*', '/', '%')),
      field("right", $._arithmetic_expr)
    )),

    comparison_expression: $ => prec.left(1, seq(
      field("left", $._arithmetic_expr),
      field("operator", choice('=', '!=', '<', '>', '<=', '>=')),
      field("right", $._arithmetic_expr)
    )),

    // Bracket expressions - Spectec uses `{...}, `[...], `(...)
    bracket_expression: $ => choice(
      seq('`{', optional($.function_expression), '}'),
      seq('`[', optional($.function_expression), ']'),
      seq('`(', optional($.function_expression), ')'),
    ),

    // -------------------------
    // NOTATION EXPRESSIONS (for rule bodies and rule premises)
    // -------------------------
    // Notation expressions follow OCaml parser hierarchy
    notation_expression: $ => choice(
      $.notation_rel,           // Relational level (lowest precedence)
      $.notation_bin,           // Binary/infix level  
      $.notation_seq,           // Sequence level
      $.notation_atom,          // Atomic level (highest precedence)
    ),

    // relational atoms like |-, ~>, etc.
    notation_rel: $ => prec.left(1, seq(
      field("left", choice($.notation_rel, $.notation_bin, $.notation_seq, $.notation_atom)),
      field("operator", $.atom_relational),
      field("right", choice($.notation_bin, $.notation_seq, $.notation_atom))
    )),

    // infix atoms like ., .., etc.
    notation_bin: $ => prec.left(2, seq(
      field("left", choice($.notation_seq, $.notation_atom)),
      field("operator", $.atom_infix),
      field("right", choice($.notation_seq, $.notation_atom))
    )),

    // sequence atoms like p C frame fdenv
    notation_seq: $ => prec.right(3, seq(
      $.notation_atom,
      repeat1($.notation_atom),
    )),

    // atomic elements in notation expressions
    notation_atom: $ => choice(
      $.notation_constructor,     // ConstD id typ val
      $.constant_pattern,         // GLOBAL, LOCAL, LCTK
      $.atom,                     // atoms (infixops, relops, escape atoms)
      $.regular_id,               // variables like p, frame, fdenv
      $.number_literal,           // numbers
      $.text_literal,             // strings
      $.epsilon_literal,          // eps
      $.parenthesized_notation,   // (FuncD ...)
      $.iterated_notation,        // param*
      $.call_expression,          // function calls
      $.bracket_expression,       // `{ ... }

    ),

    // Constructor patterns in notation expressions
    notation_constructor: $ => prec.right(seq(
      field("name", $.camelcase_constructor_id),
      field("arguments", repeat1($.notation_argument))
    )),

    notation_argument: $ => choice(
      $.regular_id,               // variables
      $.constant_pattern,         // ALL_CAPS constants
      $.wildcard_pattern,         // _ 
      $.number_literal,           // numbers
      $.text_literal,             // strings
      $.epsilon_literal,          // eps
      $.parenthesized_notation,   // nested patterns
      $.camelcase_constructor_id, // standalone constructors
    ),

    parenthesized_notation: $ => seq('(', $.notation_expression, ')'),

    iterated_notation: $ => prec(3, seq(
      choice(
        $.regular_id,
        $.parenthesized_notation,
        $.notation_constructor,
        $.constant_pattern,
      ),
      $.iterator
    )),

    // All-caps constants that don't take arguments  
    constant_pattern: $ => $.constant_id,

    // -------------------------
    // HINTS : only allow a subset of expressions
    // -------------------------
    hint: $ => seq(
      'hint',
      '(',
      $.hint_name,
      repeat($._hint_element),
      ')'
    ),

    hint_name: $ => choice('input', 'show', 'macro', 'desc'),

    _hint_element: $ => choice(
      $.hint_text,
      $.hint_placeholder,
      $.hint_latex,
      $.hint_backtick,
      '.',
      '...',
      '@',
      ']',
      '?',
      '(',
      ')',
      '#',
    ),

    hint_text: $ => token(prec(-1, /[A-Za-z_][A-Za-z0-9_]*/)),

    hint_placeholder: $ => choice(
      token(seq('%', /\d+/)),
      token('%%'),
      prec(-1, token('%')),
    ),

    hint_latex: $ => seq(
      '%latex',
      '(',
      $.text_literal,
      ')'
    ),

    hint_backtick: $ => choice(
      prec(1, seq('%', '`[')),
      '`[',
    ),

    // -------------------------
    // LITERALS
    // -------------------------
    boolean_literal: $ => choice('true', 'false'),
    number_literal: $ => choice(
      /\d+/, // Natural numbers
      /-\d+/, // Negative integers
      /0x[0-9a-fA-F]+/, // Hex numbers
    ),
    text_literal: $ => choice(
      seq('"', repeat(choice(/[^"\\]/, seq('\\', /./))), '"'),
      '""', // Empty string
    ),
    epsilon_literal: $ => 'eps',

    // -------------------------
    // TYPES
    // -------------------------
    type: $ => $.plain_type,

    iterator: $ => choice('*', '?'),

    bool_type: $ => 'bool',
    text_type: $ => 'text',

    iterator_type: $ => seq($.base_type, $.iterator),

    base_type: $ => choice(
      $.bool_type,
      $.text_type,
      $.identifier,
      $.tuple_type,
      $.optional_type,
      $.generic_type,
    ),

    plain_type: $ => choice(
      $.base_type,
      $.iterator_type,
    ),

    optional_type: $ => prec(2, seq($.identifier, '?')),

    generic_type: $ => seq(
      $.identifier,
      '<',
      $.plain_type,
      repeat(seq(',', $.plain_type)),
      '>'
    ),

    tuple_type: $ => seq(
      '(',
      $.plain_type,
      repeat(seq(',', $.plain_type)),
      ')'
    ),

    // Notation types (for relations) - working well, keep as is
    notation_type: $ => choice(
      $._notation_type_rel,
    ),

    _notation_type_post: $ => choice(
      $.notation_type_prim,
      prec(2, seq($.notation_type_prim, $.iterator)),
    ),

    notation_type_prim: $ => choice(
      $.identifier,
      $.atom,
    ),

    _notation_type_seq: $ => choice(
      $._notation_type_post,
      seq($._notation_type_post, $._notation_type_seq),
    ),

    _notation_type_un: $ => choice(
      $._notation_type_seq,
    ),

    _notation_type_bin: $ => choice(
      $._notation_type_un,
    ),

    _notation_type_rel: $ => choice(
      $._notation_type_bin,
    ),

    // -------------------------
    // ATOMS AND IDENTIFIERS
    // -------------------------
    // Atoms are either infix, relational, or escaped
    atom: $ => choice(
      $.atom_infix,
      $.atom_relational, 
      $.atom_escape,
    ),

    atom_infix: $ => choice(
      ".",      // Atom.Dot
      "..",     // Atom.Dot2
      "...",    // Atom.Dot3
      ";",      // Atom.Semicolon
      "\\",     // Atom.Backslash
      "->",     // Atom.Arrow
      "->_",    // Atom.ArrowSub
      "=>_",    // Atom.Arrow2Sub
      "(/\\)",  // Atom.BigAnd
      "(\\/)",  // Atom.BigOr
      "(+)",    // Atom.BigAdd
      "(*)",    // Atom.BigMul
      "(++)",   // Atom.BigCat
    ),

    atom_relational: $ => choice(
      "=_",     // Atom.EqualSub
      ":",      // Atom.Colon
      ":_",     // Atom.ColonSub
      "<:",     // Atom.Sub
      ":>",     // Atom.Sup
      ":=",     // Atom.Assign
      "==",     // Atom.Equiv
      "==_",    // Atom.EquivSub
      "~~",     // Atom.Approx
      "~~_",    // Atom.ApproxSub
      "~>",     // Atom.SqArrow
      "~>_",    // Atom.SqArrowSub
      "~>*",    // Atom.SqArrowStar
      "~>*_",   // Atom.SqArrowStarSub
      "<<",     // Atom.Prec
      ">>",     // Atom.Succ
      "-|",     // Atom.Tilesturn
      "-|_",    // Atom.TilesturnSub
      "|-",     // Atom.Turnstile
      "|-_"     // Atom.TurnstileSub
    ),

    // Escape atoms - operators prefixed with backtick to use as literals
    atom_escape: $ => choice(
      token(prec(3, "`=")),       // Atom.Equal
      token(prec(3, "`=/=")),   // Atom.NotEqual
      token(prec(3, "`<")),       // Atom.Less
      token(prec(3, "`>")),       // Atom.Greater
      token(prec(3, "`<=")),      // Atom.LessEqual
      token(prec(3, "`>=")),      // Atom.GreaterEqual
      token(prec(3, "`<-")),      // Atom.Mem
      token(prec(3, "`?")),       // Atom.Quest
      token(prec(3, "`+")),       // Atom.Plus
      token(prec(3, "`*")),       // Atom.Star
      token(prec(3, "`|")),       // Atom.Bar
      token(prec(3, "`++")),      // Atom.Cat
      token(prec(3, "`,")),       // Atom.Comma
      token(prec(3, "`=>")),      // Atom.Arrow2
      "_|_",                      // Atom.Bot
      "^|^",                      // Atom.Top
      "infinity",                 // Atom.Infinity
    ),

    atom_expression: $ => $.atom,

    // -------------------------
    // IDENTIFIERS
    // ------------------------- 
    constructor_id: $ => choice(
      /[A-Z][a-zA-Z0-9']*/, // CamelCase constructors with apostrophes like IntV, FIntE, K'
      /[A-Z][a-zA-Z0-9_']*/, // With underscores and apostrophes
    ),
    constant_id: $ => /[A-Z][A-Z0-9_]*/, // ALL_CAPS constants like PLUS, MINUS  
    regular_id: $ => choice(
      /[a-z][a-z0-9_']*/, // lowercase snake_case with apostrophes like t', get_int, bitstr
      /[a-z][a-zA-Z0-9']*/, // camelCase starting with lowercase with apostrophes like annotIL, exprIL
    ),
    rule_id: $ => /[a-z][a-z0-9_'-]*/, // Rule IDs can have hyphens like "rets-none", "expracce-headert"
    function_id: $ => seq('$', $.regular_id), // Function identifiers like $get_int

    camelcase_constructor_id: $ => token(prec(2, /[A-Z][a-z][a-zA-Z0-9_']*/)),

    hint_identifier: $ => $.regular_id,

    identifier: $ => choice(
      $.regular_id,
      $.constructor_id,
      $.constant_id,
      $.function_id,
    ),
  }
}); 
