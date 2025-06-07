; highlights.scm

[ "syntax" "var" "relation" "rule" "dec" "def" "if" "hint" ] @keyword
(else_premise) @keyword
(if_premise "if" @keyword)
(variable_premise "var" @keyword)

[":" "," "/"] @punctuation.delimiter
["?" "*"] @operator

"--" @keyword
(separator) @comment
(comment) @comment
(variable_definition (identifier) @variable)
(variable_definition name: (identifier) @variable)
(pattern (regular_id) @variable.parameter)
; Pattern parameters in function definitions
; (pattern (constructor_pattern [(wildcard_pattern) (regular_id)] @variable.parameter))
(pattern (iterator_pattern) @variable.parameter)
(notation_atom (notation_constructor (notation_argument) @variable.parameter))
(rule_definition body: (notation_expression (notation_atom (regular_id) @variable.parameter)))


; Functions
; --------

(call_expression (function_id) @function)
(function_signature_definition name: (function_id) @function)
(function_definition name: (function_id) @function)
; (relation_definition name: (constructor_id) @function)
(rule_definition relation_name: (constructor_id) @function)
(rule_definition rule_name: (rule_id) @function)
(constructor_id) @constructor
(camelcase_constructor_id) @constructor
(notation_constructor name: (camelcase_constructor_id) @constructor)

; Types
; --------
; (constructor_pattern (regular_id) @type)
[ (bool_type) (text_type) (tuple_type) (iterator_type) ] @type
(plain_type) @type
(syntax_definition (identifier) @type)
(notation_type_prim (identifier) @type)
(type) @type

; Operators from notation expressions
(atom) @operator

; Notation expression components
(notation_rel operator: (_) @operator)
(notation_bin operator: (_) @operator)

(
  (hint_name) @function.builtin
  (#match? @function.builtin "^(show|macro|input|desc)$")
)

; Constants
; --------
(boolean_literal) @constant
(number_literal) @number
(text_literal) @string
(constant_pattern) @constant
(constant_id) @constant
(hint_text) @string
(hint_latex) @string.special
(hint_placeholder) @string.special
(epsilon_literal) @constant
[ "#" ] @comment
