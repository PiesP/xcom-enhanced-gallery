/**
 * @name Direct vendor library imports
 * @description Detects direct imports from vendor libraries (solid-js, solid-js/store, etc.)
 *              that should use vendor getter functions instead.
 * @kind problem
 * @problem.severity error
 * @id javascript/xeg/direct-vendor-imports
 * @tags maintainability
 *       testability
 *       architecture
 */

import javascript

/**
 * Holds if the import path is a forbidden direct vendor import.
 */
predicate isForbiddenVendorImport(string path) {
  path = "solid-js" or
  path = "solid-js/store" or
  path = "solid-js/web" or
  path = "solid-js/html"
}

/**
 * Holds if the file is an allowed exception (vendor getter implementation).
 */
predicate isAllowedException(File file) {
  file.getRelativePath().matches("%shared/external/vendors%")
}

from ImportDeclaration imp, string importPath
where
  importPath = imp.getImportedModule().getName() and
  isForbiddenVendorImport(importPath) and
  not isAllowedException(imp.getFile())
select imp,
  "Direct import from '" + importPath +
    "' is forbidden. Use vendor getter functions from @shared/external/vendors instead (e.g., getSolid(), getSolidStore())."
