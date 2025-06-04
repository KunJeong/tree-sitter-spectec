module.exports = grammar({
  name: "spectec",

  extras: $ => [
    /\s/,
    seq(";;", /[^\r\n]*/),
  ],

  rules: {
    source_file: $ => repeat($._definition),

    _definition: $ => choice(
      $.syntax_definition,
    ),

    syntax_definition: $ => seq(
      'syntax',
      $.identifier,
      '=',
      $.identifier
    ),

    identifier: $ => /[a-zA-Z][a-zA-Z0-9_]*/,
  }
}); 