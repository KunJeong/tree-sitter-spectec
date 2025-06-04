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
    seq(";;", /[^\r\n]*/), // Fixed: line comments should not consume newlines
  ],

  rules: {
    source_file: $ => repeat($._definition),

    _definition: $ => choice(
      $.syntax_definition, // `syntax` list(id `<` list(tparam, `,`) `>`, `,`)
      $.variable_definition, // `var` id `:` plaintyp hint*
      $.relation_definition, //`relation` id `:` nottyp hint*
      $.rule_definition, // `rule` id`/`id `:` exp list(`--` prem, nl)
      $.function_signature_definition, // `dec` id `<` list(tparam, `,`) `>` list(param, `,`) `:` plaintyp hint*
      $.function_definition, // `def` id `<` list(tparam, `,`) `>` list(arg, `,`) `=` exp list(`--` prem, nl)
    ),

    // Handle syntax definitions: syntax id = body OR syntax id<params> = body  
    syntax_definition: $ => seq(
      'syntax',
      $.identifier,
      optional($.type_parameters),
      optional(seq(repeat($.hint), '=')),
      $.syntax_body
    ),

    syntax_body: $ => choice(
      // Simple assignment: syntax tid = id
      $.identifier,
      // Variant definition: | variant1 | variant2  
      seq(
        '|',
        $.syntax_variant,
        repeat(seq('|', $.syntax_variant))
      ),
    ),

    syntax_variant: $ => choice(
      $.identifier, // Simple variant like PLUS
      seq($.identifier, repeat1($.type_ref)), // Variant with types like FIntT expr
    ),

    variable_definition: $ => seq(
      'var',
      $.identifier,
      ':',
      $.type_ref,
      repeat($.hint)
    ),

    relation_definition: $ => seq(
      'relation',
      $.identifier,
      ':',
      $.type_ref,
      repeat($.hint)
    ),

    rule_definition: $ => seq(
      'rule',
      $.identifier,
      '/',
      $.identifier,
      ':',
      $._expression,
      repeat(seq('--', $._premise))
    ),

    function_signature_definition: $ => seq(
      'dec',
      $.identifier,
      optional($.type_parameters),
      $.parameter_list,
      ':',
      $.type_ref,
      repeat($.hint),
    ),

    function_definition: $ => seq(
      'def',
      $.identifier,
      optional($.type_parameters),
      optional($.parameter_list),
      '=',
      $._expression,
      repeat(seq('--', $._premise))
    ),

    type_parameters: $ => seq(
      '<',
      $.identifier,
      repeat(seq(',', $.identifier)),
      '>'
    ),

    parameter_list: $ => seq(
      '(',
      optional(seq(
        $.type_ref,
        repeat(seq(',', $.type_ref))
      )),
      ')'
    ),

    type_parameter: $ => $.identifier,

    _premise: $ => choice(
      $.if_premise, // `if` exp
      'otherwise',
    ),

    if_premise: $ => seq(
      'if',
      $._expression,
    ),

    hint: $ => seq(
      'hint',
      '(',
      $._expression,
      ')'
    ),

    _expression: $ => choice(
      $.identifier,
      $.number,
      $.string,
      $.binary_expression,
      $.parenthesized_expression,
      '""',
      'eps',
    ),

    binary_expression: $ => choice(
      prec.left(1, seq($._expression, '::', $._expression)),
      prec.left(2, seq($._expression, '++', $._expression)),
      prec.left(3, seq($._expression, '<-', $._expression)),
    ),

    parenthesized_expression: $ => seq(
      '(',
      $._expression,
      ')'
    ),

    identifier: $ => choice(
      /[a-zA-Z][a-zA-Z0-9_]*/, // regular identifiers
      /\$[a-zA-Z_][a-zA-Z0-9_]*/, // function identifiers with $
      /[A-Z]+/, // constants like PLUS, MINUS
    ),

    number: $ => /\d+/,

    string: $ => /"[^"]*"/,

    type_ref: $ => choice(
      $.plain_type,
      $.identifier,
      $.sequence_type, // type*
      $.optional_type, // type?
      $.generic_type, // id<types>
    ),

    sequence_type: $ => prec.right(seq($.base_type, '*')),
    
    optional_type: $ => prec.right(seq($.base_type, '?')),
    
    generic_type: $ => seq($.identifier, $.type_arguments),
    
    base_type: $ => choice(
      $.plain_type,
      $.identifier,
      $.generic_type,
    ),

    plain_type: $ => choice(
      'bool',
      'int',
      'nat', 
      'text',
    ),

    type_arguments: $ => seq(
      '<',
      $.type_ref,
      repeat(seq(',', $.type_ref)),
      '>'
    ),

    definition_type: $ => choice(
      $.plain_type,
      $.identifier,
    ),
  }
}); 