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
      // $.function_signature_definition, // `dec` id `<` list(tparam, `,`) `>` list(param, `,`) `:` plaintyp hint*
      // $.function_definition, // `def` id `<` list(tparam, `,`) `>` list(arg, `,`) `=` exp list(`--` prem, nl)
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
      $.plain_type,
      // Variant definition: | variant1 | variant2  
      repeat1(seq('|', $.syntax_variant)),
    ),
    
    syntax_variant: $ => choice( // El.typcase
      $.identifier, // PLUS
      seq($.identifier, repeat($._type)), // NameE id
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
  //   function_signature_definition: $ => seq(
  //     'dec',
  //     $.identifier,
  //     optional($.type_parameters),
  //     $.parameter_list,
  //     ':',
  //     $.type,
  //     repeat($.hint),
  //   ),
  //
  //   function_definition: $ => seq(
  //     'def',
  //     $.identifier,
  //     optional($.type_parameters),
  //     optional($.parameter_list),
  //     '=',
  //     $._expression,
  //     repeat(seq('--', $._premise))
  //   ),
  //
    type_parameters: $ => seq(
      '<',
      $.identifier,
      repeat(seq(',', $.identifier)),
      '>'
    ),
  //
  //   parameter_list: $ => seq(
  //     '(',
  //     optional(seq(
  //       $.type,
  //       repeat(seq(',', $.type))
  //     )),
  //     ')'
  //   ),
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
  //   _expression: $ => choice(
  //     $.identifier,
  //     $.number,
  //     $.string,
  //     $.binary_expression,
  //     $.parenthesized_expression,
  //     '""',
  //     'eps',
  //   ),
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
    identifier: $ => choice(
      /[a-zA-Z][a-zA-Z0-9_]*/, // regular identifiers
      // /\$[a-zA-Z_][a-zA-Z0-9_]*/, // function identifiers with $
      // /[A-Z]+/, // constants like PLUS, MINUS
    ),
  //
  //   number: $ => /\d+/,
  //
  //   string: $ => /"[^"]*"/,
  //
    _type: $ => choice(
      $.plain_type,
      // $.generic_type,
      // $.identifier,
      // $.sequence_type, // type*
      // $.optional_type, // type?
      // $.generic_type, // id<types>
    ),

    iterator: $ => choice('*', '?'),

    bool_type: $ => 'bool', // El.BoolT
    text_type: $ => 'text', // El.TextT

    iterator_type: $ => seq($.plain_type, $.iterator),
    plain_type: $ => choice(
      $.bool_type,
      $.text_type,
      $.identifier,
      $.tuple_type, // El.ParenT, TupleT
      $.iterator_type,
    ),

    tuple_type: $ => seq(
      '(', repeat(seq($.plain_type, ',')), $.plain_type, ')'
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
