/**
 * @name Unsafe download pattern
 * @description Detects direct manipulation of anchor href/download attributes
 *              that should use getUserscript().download() for userscript compatibility.
 * @kind problem
 * @problem.severity warning
 * @id javascript/xeg/unsafe-download-pattern
 * @tags maintainability
 *       compatibility
 *       userscript
 */

import javascript

/**
 * Holds if the file is allowed to use direct download patterns.
 */
predicate isAllowedFile(File file) {
  // Download service/adapter implementations
  file.getRelativePath().matches("%shared/external/userscript%") or
  file.getRelativePath().matches("%shared/services/download%") or
  file.getRelativePath().matches("%BulkDownloadService%") or
  // Legacy fallback implementations (deprecated, prefer getUserscript().download())
  file.getRelativePath().matches("%shared/browser/browser-service%") or
  file.getRelativePath().matches("%shared/browser/browser-utils%") or
  file.getRelativePath().matches("%shared/external/vendors/vendor-manager-static%") or
  // Test files
  file.getRelativePath().matches("%test/%") or
  file.getBaseName().matches("%.test.%") or
  file.getBaseName().matches("%.spec.%")
}

from CallExpr call
where
  (
    // setAttribute with href or download
    call.getCalleeName() = "setAttribute" and
    exists(StringLiteral arg |
      arg = call.getArgument(0) and
      (arg.getValue() = "href" or arg.getValue() = "download")
    )
    or
    // createElement('a')
    call.getCalleeName() = "createElement" and
    exists(StringLiteral arg |
      arg = call.getArgument(0) and
      arg.getValue() = "a"
    )
  ) and
  not isAllowedFile(call.getFile()) and
  // Exclude if getUserscript() is used in the same function
  not exists(CallExpr userscriptCall |
    userscriptCall.getCalleeName() = "getUserscript" and
    userscriptCall.getEnclosingFunction() = call.getEnclosingFunction()
  )
select call,
  "Direct manipulation of download/href attributes detected. Use getUserscript().download() from @shared/external/userscript/adapter for userscript compatibility."
