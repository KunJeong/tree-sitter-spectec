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
  ],

  rules: {
    source_file: $ => repeat($._definition),

    //
    // Top-level definitions
    //
    _definition: $ => choice(
      $.comment,
      $.syntax_name, // `syntax` id
      $.syntax_definition, // `syntax` list(id `<` list(tparam, `,`) `>`, `,`)
      $.variable_definition, // `var` id `:` plaintyp hint*
      $.relation_definition, //`relation` id `:` notation_type hint*
      $.rule_definition, // `rule` id`/`id `:` exp list(`--` prem, nl)
      $.function_signature_definition, // `dec` id `<` list(tparam, `,`) `>` list(param, `,`) `:` plaintyp hint*
      $.function_definition, // `def` id `<` list(tparam, `,`) `>` list(arg, `,`) `=` exp list(`--` prem, nl)
      $.separator,
    ),

    comment: $ => token(seq(';;', /[^\r\n]*/)), // Line comments starting with `;;`

    syntax_name: $ => seq(
      'syntax',
      field("name", $.identifier),
      field("type_parameters", optional($.type_parameters)),
    ),

    // syntax id = body OR syntax id<tparams> = body  
    syntax_definition: $ => seq(
      'syntax',
      $.identifier,
      optional($.type_parameters),
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

    // `rule` id`/`id `:` exp list(`--` prem, nl)
    rule_definition: $ => seq(
      'rule',
      field("relation_name", $.constructor_id),
      '/',
      field("rule_name", $.regular_id),
      ':',
      field("body", $.notation_expression),
      field("premises", repeat(seq('--', $._premise, '\n'))),
    ),

    function_signature_definition: $ => seq(
      'dec',
      field("name", $.function_id),
      field("type_parameters", optional($.type_parameters)),
      field("parameters", optional($.type_parameter_list)),
      ':',
      field("return_type", $.type),
      field("hints", repeat($.hint)),
    ),

    function_definition: $ => seq(
      'def',
      field("name", $.function_id),
      field("type_parameters", optional($.type_parameters)),
      field("parameters", optional($.pattern_parameter_list)),
      '=',
      field("return", $._expression),
      field("premises", repeat(seq('--', $._premise)))
    ),

    separator: $ => '----',

    syntax_body: $ => choice( // El.deftyp
      // Named variants: | variant1 | variant2  (with leading |)
      repeat1(seq('|', $.syntax_variant)),
      // Named variants: variant1 | variant2 (without leading |)
      seq($.syntax_variant, repeat1(seq('|', $.syntax_variant))),
      // Unnamed variant (singleton): syntax paramtyp = id dir typ (multiple types)
      prec(2, $.unnamed_variant),
      // Simple assignment: syntax tid = id (single type)
      prec(1, $.plain_type),
    ),
    
    unnamed_variant: $ => seq($.type, repeat1($.type)), // At least 2 types like "id dir typ"
    
    syntax_variant: $ => choice( // El.typcase
      prec(1, $.constructor_id), // IntT, FIntT, etc.
      prec(2, seq($.constructor_id, repeat1($.type))), // IntT, FIntT nat, HeaderT id (member, typ)*
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

    pattern_parameter_list: $ => seq( // Parameters for function definitions (patterns only)
      '(',
      optional(seq(
        $.pattern,
        repeat(seq(',', $.pattern))
      )),
      ')'
    ),

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

    constructor_pattern: $ => seq(
      field("name", $.constructor_id), 
      field("body", repeat1(choice(
        $.dont_care_id,
        $.regular_id)))
    ), // IntV i, FIntV n bs

    // Singleton constructor pattern - just the constructor name
    singleton_constructor_pattern: $ => $.constructor_id, // IntT, FIntT, etc.

    argument_list: $ => seq(
      '(',
      optional(seq(
        $._expression,
        repeat(seq(',', $._expression))
      )),
      ')',
    ),
    
    //
    // Premises
    //
    _premise: $ => choice(
      $.if_premise, // `if` exp
      $.else_premise, // `otherwise`
      $.rule_premise, // id `:` exp
    ),

    if_premise: $ => seq(
      'if',
      $.notation_expression, // Use notation_expression for consistency
    ),

    else_premise: $ => 'otherwise',

    rule_premise: $ => seq(
      field("rule", $.constructor_id),
      ":",
      field("body", $.notation_expression)
    ),

    // Based on parser.mly: HINT_LPAREN hintid exp RPAREN
    hint: $ => seq(
      'hint',
      '(',
      field("name", $.hint_identifier), // hintid  
      $._hint_expression, // Allow more flexible expressions in hints
      ')'
    ),

    // Expression specifically for hints - can be a sequence
    _hint_expression: $ => choice(
      $._expression,
      $.hint_concatenation_expression,
      prec(1, $.regular_id), // Allow regular identifiers like 'input' - lower precedence
    ),

    // Hint concatenation with # operator
    hint_concatenation_expression: $ => prec.left(2, seq(
      $._hint_expression,
      '#',
      $._hint_expression
    )),

    //
    // EXPRESSIONS
    //
    _expression: $ => choice(
      // Literals
      $.boolean_literal,
      $.number_literal,
      $.text_literal,
      $.epsilon_literal, // eps
      
      // Variables and identifiers
      $.variable_expression,
      $.constructor_expression,
      $.iterator_expression, // exp*
      
      // Function calls
      $.call_expression,
      
      // Arithmetic expressions
      $.arithmetic_expression, // $(expr)
      
      // Collection expressions
      $.list_constructor_expression, // exp :: exp
      $.concatenation_expression, // exp ++ exp
      $.membership_expression, // exp <- exp
      $.arrow_expression, // exp -> exp
      
      // Structure expressions
      $.parenthesized_expression, // (exp)
      $.bracket_expression, // `{ ... }, `[ ... ], `( ... )
      
      // Notation expressions
      $.atom_expression, // atoms like |-
      
      // Hint expressions
      $.hole_expression, // %N, %, %%
      $.latex_expression, // %latex("...")
      $.hint_bracket_expression, // %2`[%1] or %3#`[%4]?
    ),

    // Iterator expressions like t'*
    iterator_expression: $ => seq($.variable_expression, $.iterator),

    // Literals
    boolean_literal: $ => choice('true', 'false'),
    number_literal: $ => choice(
      /\d+/, // Natural numbers
      /-\d+/, // Negative integers
      /0x[0-9a-fA-F]+/, // Hex numbers
    ),
    text_literal: $ => choice(
      seq('"', repeat(choice(/[^"\\]/, seq('\\', /./))), '"'),
      '""', // Empty string literal
    ),
    epsilon_literal: $ => 'eps',

    // Variables and constructors
    variable_expression: $ => $.regular_id,
    constructor_expression: $ => prec.right(seq(
      $.constructor_id,
      repeat($._simple_expression), // Constructor arguments like IntV i
    )),

    _simple_expression: $ => choice(
      $.regular_id,
      $.constructor_id,
      $.number_literal,
      $.parenthesized_expression,
    ),

    // Function calls
    call_expression: $ => seq(
      $.function_id,
      optional($.type_parameters), // Support type parameters like <X>
      $.argument_list,
    ),

    arithmetic_expression: $ => seq('$', '(', $._arithmetic_expr, ')'),

    // Arithmetic expressions inside $(...) 
    _arithmetic_expr: $ => choice(
      $.binary_expression,
      $.comparison_expression,
      $.variable_expression,
      $.number_literal,
      $.call_expression,
      $.parenthesized_arithmetic_expression,
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

    parenthesized_arithmetic_expression: $ => seq('(', $._arithmetic_expr, ')'),

    // List constructor (::)
    list_constructor_expression: $ => prec.right(6, seq(
      field("head", $._expression),
      '::',
      field("tail", $._expression)
    )),

    // List operators  
    concatenation_expression: $ => prec.left(5, seq(
      field("left", $._expression),
      '++',
      field("right", $._expression)
    )),

    membership_expression: $ => prec.left(4, seq(
      field("element", $._expression),
      '<-',
      field("collection", $._expression)
    )),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    // Bracket expressions - Spectec uses `{...}, `[...], `(...)
    bracket_expression: $ => choice(
      seq('`{', optional($._expression), '}'),
      seq('`[', optional($._expression), ']'),
      seq('`(', optional($._expression), ')'),
    ),

    // Notation expressions for rules - simplified hierarchy
    notation_expression: $ => choice(
      $._notation_expression_rel,
    ),

    _notation_expression_post: $ => choice(
      $.notation_expression_prim,
      seq($.notation_expression_prim, $.iterator),
    ),

    notation_expression_prim: $ => choice(
      $.variable_expression,
      $.constructor_expression,
      $.call_expression,
      $.number_literal,
      $.text_literal,
      $.epsilon_literal,
      $.bracket_expression,
      $.parenthesized_expression,
      $.atom_expression, // atoms like |-
    ),

    _notation_expression_seq: $ => choice(
      $._notation_expression_post,
      $.sequence_expression, // seq of notation expressions
    ),

    sequence_expression: $ => prec.right(1, seq(
      $._notation_expression_post,
      repeat1($._notation_expression_post), // Space-separated sequence
    )),

    _notation_expression_bin: $ => choice(
      $._notation_expression_seq,
      $.infix_expression, // infix expressions
    ),

    infix_expression: $ => prec.left(2, seq(
      field("left", $._notation_expression_bin),
      field("operator", $.atom), // infix operator like |-
      field("right", $._notation_expression_bin)
    )),

    _notation_expression_rel: $ => choice(
      $._notation_expression_bin,
      $.relational_expression, // relational operators
    ),

    relational_expression: $ => prec.left(1, seq(
      field("left", $._notation_expression_rel),
      field("operator", choice(':', ',', '->', '<-', '++', '=')), // relational operators
      field("right", $._notation_expression_rel)
    )),

    // Hint expressions
    hole_expression: $ => choice(
      /%\d+/, // %0, %1, %2, etc.
      /%/, // %
      /%%/, // %%
    ),

    // Latex expressions in hints
    latex_expression: $ => seq('%latex', '(', $.text_literal, ')'),

    // Hint bracket expressions like %2`[%1] or %3#`[%4]?
    hint_bracket_expression: $ => prec(3, seq(
      $.hole_expression,
      '`[',
      $._expression,
      ']',
      optional('?') // Optional ? suffix
    )),

    // Arrow expressions like K -> V
    arrow_expression: $ => prec.left(3, seq(
      field("left", $._expression),
      '->',
      field("right", $._expression)
    )),

    // Arrow patterns like K -> V
    arrow_pattern: $ => prec.left(3, seq(
      field("left", $.pattern),
      '->',
      field("right", $.pattern)
    )),

    // Identifier patterns for different contexts
    constructor_id: $ => choice(
      /[A-Z][a-zA-Z0-9']*/, // CamelCase constructors with apostrophes like IntV, FIntE, K'
      /[A-Z][a-zA-Z0-9_']*/, // With underscores and apostrophes
    ),
    constant_id: $ => /[A-Z][A-Z0-9_]*/, // ALL_CAPS constants like PLUS, MINUS  
    regular_id: $ => choice(
      /[a-z][a-z0-9_']*/, // lowercase snake_case with apostrophes like t', get_int, bitstr
      /[a-z][a-zA-Z0-9']*/, // camelCase starting with lowercase with apostrophes like annotIL, exprIL
    ),
    function_id: $ => seq('$', $.regular_id), // Function identifiers like $get_int

    dont_care_id: $ => '_', // Special case for don't care identifier

    hint_identifier: $ => $.regular_id,

    identifier: $ => choice(
      $.regular_id, // Check regular_id first (includes camelCase)
      $.constructor_id,
      $.constant_id,
      $.function_id,
      $.dont_care_id, // Special case for don't care identifier
    ),

    type: $ => $.plain_type,

    iterator: $ => choice('*', '?'),

    bool_type: $ => 'bool', // El.BoolT
    text_type: $ => 'text', // El.TextT

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

    // Optional types like V?
    optional_type: $ => prec(2, seq($.identifier, '?')),

    // Generic types like set<K> or map<K, V>
    generic_type: $ => seq(
      $.identifier,
      '<',
      $.plain_type,
      repeat(seq(',', $.plain_type)),
      '>'
    ),

    // Based on parser.mly notation type hierarchy
    notation_type: $ => choice(
      $._notation_type_rel,
    ),

    // Implement the precedence hierarchy from parser.mly
    _notation_type_post: $ => choice(
      $.notation_type_prim,
      seq($.notation_type_prim, $.iterator),
    ),

    notation_type_prim: $ => choice(
      $.identifier,
      $.atom,
      // Add other primitives as needed
    ),

    _notation_type_seq: $ => choice(
      $._notation_type_post,
      seq($._notation_type_post, $._notation_type_seq), // Right-recursive: builds sequences properly
    ),

    _notation_type_un: $ => choice(
      $._notation_type_seq,
      // seq($.infixop, $.notation_type_un), // prefix infix
    ),

    _notation_type_bin: $ => choice(
      $._notation_type_un,
      // seq($.notation_type_bin, $.infixop, $.notation_type_bin), // infix
    ),

    _notation_type_rel: $ => choice(
      $._notation_type_bin,
      // seq($.relop, $.notation_type_rel), // prefix relop
      // seq($.notation_type_rel, $.relop, $.notation_type_rel), // infix relop
    ),

    atom: $ => choice(
      "|-",
      "~>", 
      ":",
      "->",
      "++",
      "<-",
      /[a-zA-Z_][a-zA-Z0-9_]*/, // General atom pattern
    ),

    tuple_type: $ => seq(
      '(',
      $.type,
      repeat(seq(',', $.type)),
      ')'
    ),

    // Iterator patterns like t'*
    iterator_pattern: $ => seq($.regular_id, $.iterator),

    // Notation expressions (for relation definitions and rules)
    atom_expression: $ => $.atom,

  }
}); 
