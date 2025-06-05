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
    // token(seq(";;", /[^\r\n]*/)), // Fixed: line comments should not consume newlines
  ],

  rules: {
    source_file: $ => repeat($._definition),

    _definition: $ => choice(
      $.comment,
      $.syntax_name, // `syntax` id
      $.syntax_definition, // `syntax` list(id `<` list(tparam, `,`) `>`, `,`)
      $.variable_definition, // `var` id `:` plaintyp hint*
      $.relation_definition, //`relation` id `:` nottyp hint*
      $.rule_definition, // `rule` id`/`id `:` exp list(`--` prem, nl)
      $.function_signature_definition, // `dec` id `<` list(tparam, `,`) `>` list(param, `,`) `:` plaintyp hint*
      $.function_definition, // `def` id `<` list(tparam, `,`) `>` list(arg, `,`) `=` exp list(`--` prem, nl)
    ),

    // Definitions 
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
      // optional(seq(repeat($.hint), '=')),
      $.syntax_body
    ),

    variable_definition: $ => seq(
      'var',
      $.identifier,
      ':',
      $._plain_type,
      // repeat($.hint)
    ),

    relation_definition: $ => seq(
      'relation',
      field("name", $.identifier),
      ':',
      field("body", $.notation_type),
      field("hints", repeat($.hint)),
    ),
// `rule` id`/`id `:` exp list(`--` prem, nl)
    rule_definition: $ => seq(
      'rule',
      field("relation_name", $.identifier),
      '/',
      field("rule_name", $.identifier),
      ':',
      field("body", $._expression),
      field("premises", repeat(seq('--', $._premise, '\n'))),
    ),

    function_signature_definition: $ => seq(
      'dec',
      field("name", $.function_id),
      field("type_parameters", optional($.type_parameters)),
      field("parameters", optional($.pattern_parameter_list)),
      ':',
      field("return_type", $._type),
      // repeat($.hint),
    ),

    function_definition: $ => seq(
      'def',
      field("name", $.function_id),
      field("type_parameters", optional($.type_parameters)),
      field("parameters", optional($.pattern_parameter_list)),
      '=',
      field("return", $._expression),
      field("premises", repeat(seq('--', $._premise, '\n')))
    ),


    syntax_body: $ => choice( // El.deftyp
      // Named variants: | variant1 | variant2  (with leading |)
      repeat1(seq('|', $.syntax_variant)),
      // Named variants: variant1 | variant2 (without leading |)
      seq($.syntax_variant, repeat1(seq('|', $.syntax_variant))),
      // Unnamed variant (singleton): syntax paramtyp = id dir typ (multiple types)
      prec(2, $.unnamed_variant),
      // Simple assignment: syntax tid = id (single type)
      prec(1, $._plain_type),
    ),
    
    unnamed_variant: $ => seq($._type, repeat1($._type)), // At least 2 types like "id dir typ"
    
    syntax_variant: $ => choice( // El.typcase
      prec(1, $.constructor_id), // IntT, FIntT, etc.
      prec(2, seq($.constructor_id, repeat1($._type))), // IntT, FIntT nat, HeaderT id (member, typ)*
    ),

    type_parameters: $ => seq(
      '<',
      $.identifier,
      repeat(seq(',', $.identifier)),
      '>'
    ),

    pattern_parameter_list: $ => seq( // Parameters with pattern matching
      '(',
      optional(seq(
        $.pattern_parameter,
        repeat(seq(',', $.pattern_parameter))
      )),
      ')'
    ),

    pattern_parameter: $ => choice(
      prec(2, $.singleton_constructor_pattern), // Singleton pattern like IntT (higher precedence)
      prec(1, $.constructor_pattern), // Constructor pattern like IntV i, FIntV n bs
      $.regular_id, // Simple parameter like i, n, bs (lowest precedence)
    ),

    constructor_pattern: $ => seq(
      $.constructor_id, 
      repeat1(choice(
        $.dont_care_id,
        $.regular_id))
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
    
    _premise: $ => choice(
      $.if_premise, // `if` exp
      $.else_premise, // `otherwise`
    ),

    if_premise: $ => seq(
      'if',
      $._expression,
    ),

    else_premise: $ => 'otherwise',

    // Based on parser.mly: HINT_LPAREN hintid exp RPAREN
    hint: $ => seq(
      'hint(',
      $.identifier, // hintid  
      $._hint_expression, // Allow more flexible expressions in hints
      ')'
    ),

    // Expression specifically for hints - can be a sequence
    _hint_expression: $ => choice(
      $._expression,
      $.expression_sequence,
    ),

    expression_sequence: $ => seq(
      $._expression,
      repeat1($._expression), // Multiple expressions like "%0 %1"
    ),

    _expression: $ => choice(
      $.regular_id,
      $.constructor_expression,
      $.call_expression,
      $.percent_token, // Add support for %0, %1, etc. in hints
      // $.number,
      // $.string,
      // $.binary_expression,
      // $.parenthesized_expression,
      // '""',
      'eps',
    ),

    constructor_expression: $ => prec.right(seq(
      $.constructor_id,
      repeat1($._simple_expression), // Constructor arguments like IntV i
    )),

    _simple_expression: $ => choice(
      $.regular_id,
      $.constructor_id,
      // $.number,
    ),

    call_expression: $ => seq(
      $.function_id,
      // optional($.type_arguments),
      $.argument_list,
    ),

    // Identifier patterns for different contexts
    constructor_id: $ => choice(
      /[A-Z][a-zA-Z0-9]*/, // CamelCase constructors like IntV, FIntE
      /[A-Z][a-zA-Z0-9_]*/,
    ),
    constant_id: $ => /[A-Z][A-Z0-9_]*/, // ALL_CAPS constants like PLUS, MINUS  
    regular_id: $ => choice(
      /[a-z][a-z0-9_]*/, // lowercase snake_case like get_int, bitstr
      /[a-z][a-zA-Z0-9]*/, // camelCase starting with lowercase like annotIL, exprIL
    ),
    function_id: $ => seq('$', $.regular_id), // Function identifiers like $get_int

    dont_care_id: $ => '_', // Special case for don't care identifier
    
    percent_token: $ => /%[0-9]+/, // Support %0, %1, %2, etc. for hints

    identifier: $ => choice(
      $.regular_id, // Check regular_id first (includes camelCase)
      $.constructor_id,
      $.constant_id,
      $.function_id,
      $.dont_care_id, // Special case for don't care identifier
    ),

    _type: $ => choice(
      $._plain_type,
      // $.notation_type, // Add notation types to the main type choice
      // $.generic_type,
      // $.identifier,
      // $.sequence_type, // type*
      // $.optional_type, // type?
      // $.generic_type, // id<types>
    ),

    iterator: $ => choice('*', '?'),

    bool_type: $ => 'bool', // El.BoolT
    text_type: $ => 'text', // El.TextT

    iterator_type: $ => seq($._plain_type, $.iterator),
    _plain_type: $ => choice(
      $.bool_type,
      $.text_type,
      $.identifier, // Back to using general identifier
      $.tuple_type, // El.ParenT, TupleT
      $.iterator_type,
    ),

    // Based on parser.mly notation type hierarchy
    notation_type: $ => choice(
      $.nottyp_rel,
    ),

    // Implement the precedence hierarchy from parser.mly
    nottyp_post: $ => choice(
      $.nottyp_prim,
      seq($.nottyp_prim, $.iterator),
    ),

    nottyp_prim: $ => choice(
      $.identifier,
      $.atom,
      // Add other primitives as needed
    ),

    nottyp_seq: $ => choice(
      $.nottyp_post,
      seq($.nottyp_post, $.nottyp_seq), // Right-recursive: builds sequences properly
    ),

    nottyp_un: $ => choice(
      $.nottyp_seq,
      // seq($.infixop, $.nottyp_un), // prefix infix
    ),

    nottyp_bin: $ => choice(
      $.nottyp_un,
      // seq($.nottyp_bin, $.infixop, $.nottyp_bin), // infix
    ),

    nottyp_rel: $ => choice(
      $.nottyp_bin,
      // seq($.relop, $.nottyp_rel), // prefix relop
      // seq($.nottyp_rel, $.relop, $.nottyp_rel), // infix relop
    ),

    atom: $ => choice(
      "|-",
      "~>", 
      ":",
      //TODO
    ),

    tuple_type: $ => seq(
      '(', repeat(seq($._plain_type, ',')), $._plain_type, ')'
    ),

  }
}); 
