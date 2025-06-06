; highlights.scm

[ "syntax" "var" "relation" "rule" "dec" "def" "eps" "if" "hint" ] @keyword
(else_premise) @keyword

[":" "," "/"] @punctuation.delimiter
["?" "*"] @operator

"--" @punctuation.special
(comment) @comment
; (_type) @type
; (int_literal) @number
(variable_definition (identifier) @variable)
(pattern (regular_id) @variable.parameter)
(pattern (constructor_pattern [(dont_care_id) (regular_id)] @variable.parameter))
(function_signature_definition name: (function_id) @function)
(function_definition name: (function_id) @function)
; (relation_definition name: (constructor_id) @function)
(rule_definition relation_name: (constructor_id) @function)
(rule_definition rule_name: (regular_id) @function)
(constructor_id) @constructor

; Types
;--------
; (constructor_pattern (regular_id) @type)
[ (bool_type) (text_type) (tuple_type) (iterator_type) ] @type
(plain_type) @type
(variable_definition name: (identifier) @variable)
(type) @type

(atom) @operator

(
  (hint_identifier) @function.builtin
  (#match? @function.builtin "^(show|macro|input|desc)$")
)

; Constants
;--------
(boolean_literal) @constant
