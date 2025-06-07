/**
 * @file Spectec grammar for tree-sitter
 * @author KunJeong <kunjeong99@naver.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "spectec",

  supertypes: $ => [
    $.pattern,
    $.premise,
    $.notation,
    $.identifier,
  ],

  conflicts: $ => [
    [ $.syntax_id, $.regular_id ],
    [ $.syntax_id, $.constructor_id ],
  ],

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
      $.syntax_declaration, // `syntax` id
      $.syntax_definition, // `syntax` list(id `<` list(tparam, `,`) `>`, `,`)
      $.variable_definition, // `var` id `:` plaintyp hint*
      $.relation_declaration, //`relation` id `:` notation_type hint*
      $.rule_definition, // `rule` id`/`id `:` exp list(`--` prem, nl)
      $.function_declaration, // `dec` id `<` list(tparam, `,`) `>` list(param, `,`) `:` plaintyp hint*
      $.function_definition, // `def` id `<` list(tparam, `,`) `>` list(arg, `,`) `=` exp list(`--` prem, nl)
    ),

    comment: $ => token(seq(';;', /[^\r\n]*/)), // Line comments starting with `;;`

    syntax_declaration: $ => seq(
      'syntax',
      field("name", $.syntax_id),
      field("type_parameters", optional($.type_parameters)),
      repeat(
        seq(
          ",",
          field("name", $.syntax_id),
          field("type_parameters", optional($.type_parameters)),
      )),
      field("hints", repeat($.hint)),
    ),

    // syntax id = body OR syntax id<tparams> = body OR syntax id hint(...) = body
    syntax_definition: $ => seq(
      'syntax',
      $.syntax_id,
      optional($.type_parameters),
      optional($.hint),
      '=',
      $.syntax_body
    ),

    variable_definition: $ => seq(
      'var',
      field("name", $.syntax_id),
      ':',
      field("type", $.plain_type),
      field("hints", repeat($.hint))
    ),

    relation_declaration: $ => seq(
      'relation',
      field("name", $.relation_id),
      ':',
      field("body", $.notation_type),
      field("hints", repeat($.hint)),
    ),

    // Rule definitions use notations
    rule_definition: $ => seq(
      'rule',
      field("relation_name", $.relation_id),
      optional(seq('/', field("rule_name", $.rule_id))),
      ':',
      field("body", $.notation),
      field("premises", repeat(seq('--', $.premise, '\n'))),
    ),

    function_declaration: $ => seq(
      choice('dec', 'def'), //TODO: support both `dec` and `def` keywords
      field("name", $.function_id),
      field("type_parameters", optional($.type_parameters)),
      field("parameters", optional($.parameter_list)),
      ':',
      field("return_type", $.type),
      field("hints", repeat($.hint)),
    ),

    // Function definitions use expressions
    function_definition: $ => seq(
      'def',
      field("name", $.function_id),
      field("type_parameters", optional($.type_parameters)),
      field("parameters", optional($.pattern_parameter_list)),
      '=',
      field("return", $.expression),
      field("premises", repeat(seq('--', $.premise)))
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
      choice($.uppercase_id, $.lowercase_id),
      repeat(seq(',', choice($.uppercase_id, $.lowercase_id))),
      '>'
    ),

    parameter_list: $ => seq(
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
      $.value_pattern
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
      field("name", $.constructor_id),
      field("arguments", repeat1($.value_pattern))
    )),

    singleton_constructor_pattern: $ => $.constructor_id,

    value_pattern: $ => choice(
      $.regular_id,
      $.number_literal,
      $.epsilon_literal,
      $.wildcard_pattern,
      parenthesize($.pattern), // Parenthesized patterns
    ),

    // Iterator patterns like t'*
    iterator_pattern: $ => iterate($.regular_id),

    // Arrow patterns like K -> V
    arrow_pattern: $ => prec.left(3, seq(
      field("left", $.pattern),
      '->',
      field("right", $.pattern)
    )),

    wildcard_pattern: $ => '_',

    // ---------------------------
    // PREMISES
    // ----------------------------
    premise: $ => choice(
      $.rule_premise,        // relid : notation
      $.if_premise,          // if expression (boolean condition)
      $.else_premise,        // otherwise
      $.iterated_premise,
    ),

    // Rule premises use notation (like relid : C_0 frame |- exp)
    rule_premise: $ => seq(
      field("relation_name", $.relation_id),
      ':',
      field("body", $.notation)
    ),

    // If premises use expressions (boolean conditions) or assignment expressions
    if_premise: $ => seq(
      'if',
      field("condition", $.expression,)
    ),

    else_premise: $ => 'otherwise',

    // Allow iterating over both rule premises and if premises with ()*
    iterated_premise: $ => choice(
      iterate(parenthesize($.rule_premise)),  // (rule_premise)*
      iterate(parenthesize($.if_premise)),    // (if_premise)*
    ),

    // -------------------------
    // EXPRESSIONS (for function bodies and if conditions)
    // -------------------------
    expression: $ => choice(
      // Literals
      $.boolean_literal,
      $.number_literal,
      $.text_literal,
      $.epsilon_literal,

      // Variables and constructors
      $.variable_expression,
      $.constructor_expression,
      $.optional_expression,      // var? for optional variables

      // Function calls
      $.call_expression,

      // Arithmetic
      $.arithmetic_expression,

      // Collection operations
      $.list_constructor_expression,
      $.concatenation_expression,
      $.membership_expression,
      $.arrow_expression,
      $.assignment_expression,

      // Structure
      // $.sequence_expression,
      $.bracket_expression,
      $.tuple_expression,         // (a, b)
      $.list_expression,          // [exp]
      iterate($.expression),
      parenthesize($.expression),
    ),

    variable_expression: $ => $.regular_id,

    optional_expression: $ => seq($.regular_id, '?'),  // var? for optional variables

    constructor_expression: $ => prec.right(seq(
      $.constructor_id,                       // CamelCase constructors like FuncD
      repeat($.constructor_argument) // Arguments like IntV i, FIntV n bs
    )),
    
    constructor_argument: $ => choice(
      $.regular_id,
      $.wildcard_pattern,
      $.number_literal,
      $.epsilon_literal,
      $.uppercase_id,
      seq('(', $.expression, ')'), // Parenthesized patterns
    ),

    // List constructor (::)
    list_constructor_expression: $ => prec.right(6, seq(
      field("head", $.expression),
      '::',
      field("tail", $.expression)
    )),

    // List operators  
    concatenation_expression: $ => prec.left(5, seq(
      field("left", $.expression),
      '++',
      field("right", $.expression)
    )),

    membership_expression: $ => prec.left(4, seq(
      field("element", $.expression),
      '<-',
      field("collection", $.expression)
    )),

    arrow_expression: $ => prec.left(3, seq(
      field("left", $.expression),
      '->',
      field("right", $.expression)
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
        $.argument,
        repeat(seq(',', $.argument))
      )),
      ')'
    ),

    argument: $ => choice(
      $.expression,
      $.sequence_expression
    ),

    assignment_expression: $ => prec.left(1, seq(
      field("left", $.expression),
      '=',
      field("right", $.expression)
    )),

    // Backtick tuple patterns like `(typ_e; LCTK) for annot
    backtick_tuple_pattern: $ => seq(
      '`(',
      choice(
        seq($.regular_id, ';', $.regular_id),   // `(typ_e; LCTK)
        seq('_', ';', $.regular_id),            // `(_; LCTK)
      ),
      ')'
    ),

    tuple_expression: $ => parenthesize(seq(
      $.expression,
      repeat1(seq(',', $.expression))
    )),

    sequence_expression: $ => prec.left(1, seq(
      $.expression,
      repeat1(seq(' ', $.expression))
    )),

    // List expressions [exp, exp, ...]
    list_expression: $ => seq(
      '[',
      optional(seq(
        $.expression,
        repeat(seq(',', $.expression))
      )),
      ']'
    ),

    // Bracket expressions - Spectec uses `{...}, `[...], `(...)
    bracket_expression: $ => choice(
      seq('`{', optional($.expression), '}'),
      seq('`[', optional($.expression), ']'),
      seq('`(', optional($.expression), ')'),
    ),

    arithmetic_expression: $ => seq('$', '(', $._arithmetic_expr, ')'),

    // Inner arithmetic expressions
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

    // -------------------------
    // NOTATIONS (for rule bodies and rule premises)
    // -------------------------
    notation: $ => choice(
      $.notation_rel,           // Relational operators (outermost)
      $.notation_bin,           // Infix operators over sequences
      $.notation_seq,           // Sequence of atoms
      $.notation_atom,          // Atomic level (innermost)
    ),

    // relational atoms like |-, ~>, etc.
    notation_rel: $ => prec.left(1, seq(
      field("left", choice($.notation_rel, $.notation_bin, $.notation_seq)),
      field("operator", $.atom_relational),
      field("right", choice($.notation_bin, $.notation_seq))
    )),

    // infix atoms like ., .., etc.
    notation_bin: $ => prec.left(2, seq(
      field("left", $.notation_seq),
      field("operator", $.atom_infix),
      field("right", $.notation_seq)
    )),

    // sequence atoms like p C frame fdenv
    notation_seq: $ => prec.right(3, seq(
      $.notation_atom,
      repeat($.notation_atom),
    )),

    // atomic elements in notation expressions
    notation_atom: $ => choice(
      $.constructor_notation,     // ConstD id typ val
      $.constant_notation,         // GLOBAL, LOCAL, LCTK
      $.atom,                     // atoms (infixops, relops, escape atoms)
      $.regular_id,               // variables like p, frame, fdenv
      $.number_literal,           // numbers
      $.text_literal,             // strings
      $.epsilon_literal,          // eps
      // $.call_notation,          // function calls
      // $.bracket_expression,       // `{ ... }
      parenthesize($.notation),   // (expr) - simple parentheses (higher precedence)
      $.tuple_notation,           // (a, b) - tuples with commas
      iterate($.notation_atom),
    ),

    tuple_notation: $ => parenthesize(seq(
      $.notation, 
      repeat1(seq(',', $.notation)))),

    // Constructor patterns in notation expressions  
    constructor_notation: $ => prec.right(2, seq(
      field("name", choice(
        $.constructor_id,    // CamelCase constructors like FuncD, IntV
        // Use ambiguous_caps_id directly to avoid early resolution
        prec.dynamic(3, alias($.all_caps_id, "constructor_caps")), // All-caps constructors like CONST, LABEL_, BLOCK
      )),
      field("fields", repeat($.value_notation))  // Allow zero or more fields
    )),

    value_notation: $ => choice(
      $.regular_id,               // variables
      $.number_literal,           // numbers
      $.text_literal,             // strings
      $.epsilon_literal,          // eps
      parenthesize($.notation),   // Parenthesized notation
      $.uppercase_id,             // standalone constructors
      $.wildcard_pattern,         // wildcard _
      seq($.regular_id, '?'),     // optional variable
      $.call_expression,          // function calls
    ),


    // All-caps constants that don't take arguments  
    constant_notation: $ => $.constant_id,

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

    hint_name: $ => choice('input', 'show', 'macro', 'desc', 'name'),

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
    natural_type: $ => 'nat',

    iterated_type: $ => iterate($.base_type),

    base_type: $ => choice(
      $.syntax_id,
      $.bool_type,
      $.text_type,
      $.natural_type,
      $.tuple_type,
      $.optional_type,
      $.generic_type,
    ),

    plain_type: $ => choice(
      $.base_type,
      $.iterated_type,
    ),

    optional_type: $ => prec(2, seq($.syntax_id, '?')),

    generic_type: $ => seq(
      $.syntax_id,
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

    // -------------------------
    // NOTATION TYPES (for relations)
    // -------------------------
    notation_type: $ => choice(
      $._notation_type_rel,
    ),

    _notation_type_post: $ => choice(
      $.notation_type_prim,
      prec(3, iterate($.notation_type_prim)),  // Higher precedence for iterators
    ),

    notation_type_prim: $ => choice(
      $.syntax_id,
      $.atom,
      iterate($.notation_type),
      parenthesize($.notation_type), // Allow parenthesized notation types
      seq('(', $.notation_type, repeat(seq(',', $.notation_type)), ')'), // Allow tuples
    ),

    _notation_type_seq: $ => choice(
      $._notation_type_post,
      prec.left(1, seq($._notation_type_post, $._notation_type_seq)),  // Lower precedence for sequences
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
      token(prec(3, "`=/=")),     // Atom.NotEqual
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
    // Unambiguous identifiers
    uppercase_id: $ => /[A-Z][a-zA-Z0-9_']*/, // Starting with uppercase, hyphens not allowed
    lowercase_id: $ => /[a-z][a-zA-Z0-9_']*/, // Starting with lowercase, hyphens not allowed

    // Ambiguous all-caps identifiers - can be variables or constants depending on context
    all_caps_id: $ => /[A-Z][A-Z0-9_]*/, // All-caps like C, GLOBAL, C_0

    rule_id: $ => /[a-z][a-z0-9_'-]*/, // Rule IDs can have hyphens like "rets-none", "expracce-headert"
    relation_id: $ => $.uppercase_id,
    function_id: $ => seq('$', choice($.lowercase_id, $.uppercase_id)), // Function identifiers like $get_int
    constructor_id: $ => $.uppercase_id,
    syntax_id: $ => choice($.lowercase_id, $.uppercase_id),

    hint_identifier: $ => $.regular_id,

    // Context-sensitive disambiguation of all-caps identifiers
    regular_id: $ => choice(
      $.lowercase_id,
      // Dynamic precedence: prefer as variable in most contexts
      prec.dynamic(2, alias($.all_caps_id, "variable_caps")),
    ),

    constant_id: $ => choice(
      // Dynamic precedence: lower preference, used when variable doesn't fit
      prec.dynamic(1, alias($.all_caps_id, "constant_caps")),
    ),

    // only for supertype querying
    identifier: $ => choice(
      $.syntax_id,
      $.constructor_id,
      $.hint_identifier,
      $.uppercase_id,
      $.constant_id,
      $.function_id,
    ),
  }
}); 

function parenthesize(rule) {
  return seq('(', rule, ')');
}

function iterate(rule) {
  return seq(rule, '*');
}
