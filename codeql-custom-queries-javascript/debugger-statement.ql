/**
 * @name Debugger statements in production code
 * @description Detects debugger statements that should not be committed.
 * @kind problem
 * @problem.severity error
 * @id javascript/xeg/debugger-statement
 * @tags maintainability
 *       debugging
 *       security
 */

import javascript

/**
 * Holds if the file is a test file.
 */
predicate isTestFile(File file) {
  file.getRelativePath().matches("%test%") or
  file.getRelativePath().matches("%setup%") or
  file.getRelativePath().matches("%mock%")
}

from DebuggerStmt stmt
where not isTestFile(stmt.getFile())
select stmt, "Debugger statement should not be committed to production code."
