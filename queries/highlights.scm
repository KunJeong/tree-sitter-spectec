; highlights.scm

[ "syntax" "var" "relation" "rule" "dec" "def" "if" "hint" ] @keyword
"--" @keyword
(else_premise) @keyword
(if_premise "if" @keyword)

[ "(" "`(" "`{" "[" "`["] @punctuation.bracket.open
[ ")" "}" "]" ] @punctuation.bracket.close
(type_parameters ["<" ">"] @punctuation.bracket.angle)

[":" "," "." "|" "/"] @punctuation.delimiter
["?" "*"] @operator

(separator) @comment
(comment) @comment
[ "#" ] @comment

; Variables and parameters - non-conflicting approach
; --------

(variable_definition name: (syntax_id) @variable)

; ONLY function parameters are highlighted as parameters
(value_pattern (regular_id) @variable.parameter)

; ONLY variables in rule bodies that are NOT in premises or expressions are parameters
((regular_id) @variable.parameter
 (#has-ancestor? @variable.parameter rule_definition)
 (#not-has-ancestor? @variable.parameter rule_premise)
 (#not-has-ancestor? @variable.parameter expression))

; ONLY variables in rule premises are regular variables  
((regular_id) @variable
 (#has-ancestor? @variable rule_premise))

; ONLY variables in expressions are regular variables
((regular_id) @variable
 (#has-ancestor? @variable expression))

((regular_id) @variable.parameter
 (#has-ancestor? @variable.parameter constructor_pattern_arg))
; Functions
; --------

(call_expression (function_id) @function)
(function_declaration name: (function_id) @function)
(function_definition name: (function_id) @function)
(rule_definition rule_name: (rule_id) @function)
(relation_declaration name: (relation_id) @function)
(rule_definition relation_name: (relation_id) @function)
(rule_premise relation_name: (relation_id) @function)

; Types
; --------
; (constructor_pattern (regular_id) @type)
[ (bool_type) (text_type) (tuple_type) (iterated_type) ] @type
(plain_type) @type
(syntax_definition (syntax_id) @type)
(syntax_declaration (syntax_id) @type)
(notation_type_prim (syntax_id) @type)
(type_parameters (lowercase_id) @type)
(type) @type

; Operators from notation expressions
(atom) @operator
(atom_infix) @operator
(atom_relational) @operator
(atom_escape) @operator

; Notation expression components
(notation_rel operator: (_) @operator)
(notation_bin operator: (_) @operator)

(
  (hint_name) @function.builtin
  (#match? @function.builtin "^(show|macro|input|desc|name)$")
)

; Constants and Constructors
; --------
(boolean_literal) @constant
(number_literal) @number
(text_literal) @string
; (constant_notation) @constant
; (constant_id) @constant
(hint_text) @string
(hint_latex) @string.special
(hint_placeholder) @string.special
(hint_operator) @string         ; Operators in hints treated as hint text
(hint_function_id) @string      ; Function ids in hints treated as hint text
(epsilon_literal) @constant

; Constructors
; --------
(constructor_id) @constructor
(constructor_notation name: (constructor_id) @constructor)

