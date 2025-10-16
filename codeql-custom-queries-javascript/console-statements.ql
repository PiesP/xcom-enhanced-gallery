/**
 * @name Console statements in production code
 * @description Detects console.log, console.warn, console.error left in non-test files.
 *              These should use the project's logger service instead.
 * @kind problem
 * @problem.severity warning
 * @id javascript/xeg/console-statements
 * @tags maintainability
 *       debugging
 */

import javascript

/**
 * Holds if the file is a test file or setup file.
 */
predicate isTestFile(File file) {
  file.getRelativePath().matches("%test%") or
  file.getRelativePath().matches("%setup%") or
  file.getRelativePath().matches("%mock%")
}

/**
 * Holds if the file is allowed to use console (scripts, config files).
 */
predicate isAllowedFile(File file) {
  file.getRelativePath().matches("%scripts%") or
  file.getRelativePath().matches("%.config.%") or
  file.getRelativePath().matches("%vite.config.%") or
  file.getRelativePath().matches("%vitest.config.%")
}

from MethodCallExpr call, string method
where
  method in ["log", "warn", "error", "debug", "info", "trace"] and
  call.getMethodName() = method and
  call.getReceiver().(GlobalVarAccess).getName() = "console" and
  not isTestFile(call.getFile()) and
  not isAllowedFile(call.getFile())
select call,
  "Use '@shared/logging/logger' instead of console." + method + "() in production code."
