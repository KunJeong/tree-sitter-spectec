/**
 * @file Spectec grammar for tree-sitter
 * @author KunJeong <kunjeong99@naver.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "spectec",

  // extras: $ => [
  //   /\s/, // whitespace
  //   token(seq(";;", /[^\r\n]*/)), // Fixed: line comments should not consume newlines
  // ],

  rules: {
    source_file: $ => repeat($._definition),

    _definition: $ => choice(
      $.syntax_definition, // `syntax` list(id `<` list(tparam, `,`) `>`, `,`)
      $.syntax_name, // `syntax` id
      $._line_comment,
      // $.variable_definition, // `var` id `:` plaintyp hint*
      // $.relation_definition, //`relation` id `:` nottyp hint*
      // $.rule_definition, // `rule` id`/`id `:` exp list(`--` prem, nl)
      $.function_signature_definition, // `dec` id `<` list(tparam, `,`) `>` list(param, `,`) `:` plaintyp hint*
      $.function_definition, // `def` id `<` list(tparam, `,`) `>` list(arg, `,`) `=` exp list(`--` prem, nl)
    ),

    syntax_name: $ => seq(
      'syntax',
      $.identifier,
      optional($.type_parameters),
    ),

    // Handle syntax definitions: syntax id = body OR syntax id<params> = body  
    syntax_definition: $ => seq(
      'syntax',
      $.identifier,
      optional($.type_parameters),
      '=',
      // optional(seq(repeat($.hint), '=')),
      $.syntax_body
    ),

    syntax_body: $ => choice( // El.deftyp
      // Simple assignment: syntax tid = id
      $._plain_type,
      // Variant definition: | variant1 | variant2  
      repeat1(seq('|', $.syntax_variant)),
    ),
    
    syntax_variant: $ => choice( // El.typcase
      $.constructor_id, // IntV, FIntV, etc.
      seq($.constructor_id, repeat($._type)), // IntV int, HeaderV id (member, val)*
    ),

    _line_comment: $ => token(seq(';;', /[^\r\n]*/)), // Line comments starting with `;;`
    // variable_definition: $ => seq(
    //   'var',
    //   $.identifier,
    //   ':',
    //   $.type,
    //   repeat($.hint)
    // ),
    //
    // relation_definition: $ => seq(
    //   'relation',
    //   $.identifier,
    //   ':',
    //   $.type,
    //   repeat($.hint)
    // ),

  //   rule_definition: $ => seq(
  //     'rule',
  //     $.identifier,
  //     '/',
  //     $.identifier,
  //     ':',
  //     $._expression,
  //     repeat(seq('--', $._premise))
  //   ),
  //
    function_signature_definition: $ => seq(
      'dec',
      $.function_id,
      optional($.type_parameters),
      $.type_parameter_list, // For function signatures, use types
      ':',
      $._type,
      // repeat($.hint),
    ),

    function_definition: $ => seq(
      'def',
      $.function_id,
      optional($.type_parameters),
      optional($.pattern_parameter_list), // For function definitions, use patterns
      '=',
      $._expression,
      // repeat(seq('--', $._premise))
    ),

    type_parameters: $ => seq(
      '<',
      $.identifier,
      repeat(seq(',', $.identifier)),
      '>'
    ),
  //
    type_parameter_list: $ => seq(
      '(',
      optional(seq(
        $._type,
        repeat(seq(',', $._type))
      )),
      ')'
    ),

    pattern_parameter_list: $ => seq(
      '(',
      optional(seq(
        $.pattern_parameter,
        repeat(seq(',', $.pattern_parameter))
      )),
      ')'
    ),

    pattern_parameter: $ => choice(
      $.regular_id, // Simple parameter like i, n, bs
      $.constructor_pattern, // Constructor pattern like IntV i, FIntV n bs
    ),

    constructor_pattern: $ => seq(
      $.constructor_id, 
      repeat1($.regular_id)
    ), // IntV i, FIntV n bs

    argument_list: $ => seq(
      '(',
      optional(seq(
        $._expression,
        repeat(seq(',', $._expression))
      )),
      ')',
    ),
    
  //
  //   type_parameter: $ => $.identifier,
  //
  //   _premise: $ => choice(
  //     $.if_premise, // `if` exp
  //     'otherwise',
  //   ),
  //
  //   if_premise: $ => seq(
  //     'if',
  //     $._expression,
  //   ),
  //
  //   hint: $ => seq(
  //     'hint',
  //     '(',
  //     $._expression,
  //     ')'
  //   ),
  //

    _expression: $ => choice(
      $.regular_id,
      $.constructor_expression,
      $.call_expression,
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


  //
  //   binary_expression: $ => choice(
  //     prec.left(1, seq($._expression, '::', $._expression)),
  //     prec.left(2, seq($._expression, '++', $._expression)),
  //     prec.left(3, seq($._expression, '<-', $._expression)),
  //   ),
  //
  //   parenthesized_expression: $ => seq(
  //     '(',
  //     $._expression,
  //     ')'
  //   ),
  //
    // Identifier patterns for different contexts
    constructor_id: $ => /[A-Z][a-zA-Z0-9]*/, // CamelCase constructors like IntV, FIntV
    constant_id: $ => /[A-Z][A-Z0-9_]*/, // ALL_CAPS constants like PLUS, MINUS  
    regular_id: $ => /[a-z][a-z0-9_]*/, // lowercase identifiers with snake_case like get_int, bitstr
    function_id: $ => seq('$', $.regular_id), // Function identifiers like $get_int
    
    identifier: $ => choice(
      $.regular_id, 
      $.constructor_id,
      $.constant_id,
      $.function_id,
    ),
  //
  //   number: $ => /\d+/,
  //
  //   string: $ => /"[^"]*"/,
  //
    _type: $ => choice(
      $._plain_type,
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
      $.identifier,
      $.tuple_type, // El.ParenT, TupleT
      $.iterator_type,
    ),

    tuple_type: $ => seq(
      '(', repeat(seq($._plain_type, ',')), $._plain_type, ')'
    ),

  //   type_arguments: $ => seq(
  //     '<',
  //     $.type,
  //     repeat(seq(',', $.type)),
  //     '>'
  //   ),
  //
  }
}); 
