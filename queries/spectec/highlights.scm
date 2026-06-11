; highlights.scm

[ "syntax" "var" "relation" "rule" "dec" "def" "if" "hint" "property" ] @keyword
"--" @keyword
(else_premise) @keyword
(if_premise "if" @keyword)
; `generator` is a keyword only in `builtin generator`; as a hint name it stays
; a hint name (see hint_name below).
(builtin_generator_declaration ["builtin" "generator"] @keyword)

; Meta grouping brackets are punctuation; backtick (target) brackets are
; concrete object syntax, so they highlight like keyword/operator atoms below.
[ "(" "[" ] @punctuation.bracket.open
[ ")" "]" ] @punctuation.bracket.close
[ "`(" "`)" "`[" "`]" "`{" "`}" "`<" "`>" ] @tag
(type_parameters ["<" ">"] @punctuation.bracket.angle)

[":" "," "." "|" "/"] @punctuation.delimiter
["?" "*"] @operator

(separator) @comment
(comment) @comment
[ "#" ] @comment

; Variables and parameters - non-conflicting approach
; --------

(variable_definition name: (syntax_id) @variable.parameter)

; ONLY function parameters are highlighted as parameters
(value_pattern (regular_id) @variable.parameter)

; ONLY variables in rule bodies that are NOT in premises or expressions are parameters
((regular_id) @variable.parameter
 (#has-ancestor? @variable.parameter rule_definition)
 (#not-has-ancestor? @variable.parameter rule_premise)
 (#not-has-ancestor? @variable.parameter expression))

; Variable USES (in premises and expressions) get their own color, distinct
; from the binding sites above.
((regular_id) @variable.member
 (#has-ancestor? @variable.member rule_premise))

((regular_id) @variable.member
 (#has-ancestor? @variable.member expression))

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
(builtin_generator_declaration name: (function_id) @function)
(property_definition name: (relation_id) @function)

; Types
; --------
; (constructor_pattern (regular_id) @type)
[ (bool_type) (text_type) (tuple_type) (iterated_type) ] @type
(plain_type) @type
(syntax_definition (syntax_id) @type)
(syntax_declaration (syntax_id) @type)
(type_parameters (lowercase_id) @type)
(type) @type

; Built-in notation atoms (arrow, turnstile, colon, ...) are meta operators.
(atom_infix) @operator
(atom_relational) @operator
(notation_rel operator: (_) @operator)
(notation_bin operator: (_) @operator)

; Single-quoted operators are concrete object syntax: render like the atoms below.
(operator) @tag

(hint_name) @function.builtin

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

; All object-syntax atoms -- keyword atoms (INT, IF), operators, brackets, and
; abstract tags (_NUM) -- share @tag. It is the group most reliably distinct
; from @type (non-terminals) across themes; @constructor collides with @type in
; some (e.g. Catppuccin), which would erase the constructor-vs-non-terminal
; split that matters most. tag is a child of constructor_id, so this covers it.
(constructor_id) @tag

