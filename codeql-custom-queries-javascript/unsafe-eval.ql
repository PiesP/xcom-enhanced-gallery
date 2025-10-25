/**
 * @name Unsafe eval or Function constructor
 * @description Detects use of eval() or Function constructor which can execute arbitrary code.
 * @kind problem
 * @problem.severity error
 * @id javascript/xeg/unsafe-eval
 * @tags security
 *       injection
 */

import javascript

from CallExpr call
where
  (
    // eval() calls
    call.getCallee().(GlobalVarAccess).getName() = "eval"
    or
    // new Function() calls
    call.getCallee().(GlobalVarAccess).getName() = "Function"
  )
select call,
  "Avoid using eval() or Function constructor as they can execute arbitrary code and pose security risks."
