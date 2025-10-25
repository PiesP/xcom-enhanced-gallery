/**
 * @name Hardcoded size values (px)
 * @description Detects hardcoded px values in JavaScript/TypeScript style objects.
 *              Use rem (absolute sizing) or em (relative sizing) design tokens instead.
 * @kind problem
 * @id javascript/xeg/hardcoded-size-px
 * @problem.severity warning
 * @tags maintainability
 *       accessibility
 *       design-tokens
 */

import javascript

/**
 * Holds if the string looks like a hardcoded px value.
 */
predicate isHardcodedPxValue(StringLiteral lit) {
  exists(string value |
    value = lit.getValue() and
    // Match patterns like: "16px", "1.5px", ".5px" in style strings
    value.regexpMatch(".*\\d+(\\.\\d+)?px.*")
  )
}

/**
 * Holds if the file is allowed to contain px values.
 */
predicate isAllowedFile(File file) {
  // Design token definitions
  file.getRelativePath().matches("%design-tokens%") or
  file.getRelativePath().matches("%tokens.css") or
  file.getRelativePath().matches("%variables.css") or
  // Test files
  file.getRelativePath().matches("%test/%") or
  file.getBaseName().matches("%.test.%") or
  file.getBaseName().matches("%.spec.%") or
  // Configuration files
  file.getBaseName() = "tailwind.config.js" or
  file.getBaseName() = "postcss.config.js" or
  file.getBaseName() = "vite.config.ts"
}

/**
 * Holds if this is within a style object or CSS-in-JS.
 */
predicate isStyleContext(StringLiteral lit) {
  exists(Property prop |
    prop.getInit() = lit and
    (
      prop.getName()
          .regexpMatch("(padding|margin|width|height|fontSize|borderRadius|gap|top|left|right|bottom|size).*")
      or
      exists(Identifier id | id = prop.getNameExpr() and id.getName() = "style")
    )
  )
}

from StringLiteral lit
where
  isHardcodedPxValue(lit) and
  isStyleContext(lit) and
  not isAllowedFile(lit.getFile())
select lit,
  "Hardcoded px value '" + lit.getValue() +
    "' detected. Use rem (absolute sizing) or em (relative sizing) design tokens instead per CODING_GUIDELINES.md."
