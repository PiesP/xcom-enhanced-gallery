/**
 * @name Hardcoded color values in styles
 * @description Detects hardcoded color values (hex, rgb, rgba) in CSS/style code.
 *              Design tokens (--xeg-* custom properties) should be used instead.
 * @kind problem
 * @problem.severity warning
 * @id javascript/xeg/hardcoded-color-values
 * @tags maintainability
 *       design-system
 *       theming
 */

import javascript

/**
 * Holds if the string looks like a hardcoded color value.
 */
predicate isHardcodedColor(StringLiteral lit) {
  exists(string value |
    value = lit.getValue() and
    (
      // Hex colors: #rgb, #rrggbb, #rrggbbaa
      value.regexpMatch("#[0-9a-fA-F]{3,8}")
      or
      // rgb/rgba functions
      value.regexpMatch("rgba?\\s*\\(.*\\)")
      or
      // hsl/hsla functions
      value.regexpMatch("hsla?\\s*\\(.*\\)")
    ) and
    // Exclude oklch() - the only allowed color format per CODING_GUIDELINES.md
    not value.regexpMatch(".*oklch\\s*\\(.*\\).*")
  )
}

/**
 * Holds if the file is allowed to contain color values.
 */
predicate isAllowedFile(File file) {
  // Design token definitions
  file.getRelativePath().matches("%design-tokens%") or
  file.getRelativePath().matches("%tokens.css") or
  file.getRelativePath().matches("%variables.css") or
  // Accessibility utilities (color detection/calculation requires hardcoded values)
  file.getRelativePath().matches("%shared/utils/accessibility%") or
  // Configuration/tooling files (dependency-cruiser color codes, analysis reports)
  file.getBaseName() = ".dependency-cruiser.cjs" or
  file.getBaseName() = "bundle-analysis.html" or
  // Test files
  file.getRelativePath().matches("%test/%") or
  file.getBaseName().matches("%.test.%") or
  file.getBaseName().matches("%.spec.%") or
  // Configuration files
  file.getBaseName() = "tailwind.config.js" or
  file.getBaseName() = "postcss.config.js"
}

/**
 * Holds if this is a design token reference (e.g., var(--xeg-...)).
 */
predicate isTokenReference(StringLiteral lit) {
  lit.getValue().regexpMatch(".*var\\s*\\(\\s*--xeg-.*\\).*")
}

from StringLiteral lit
where
  isHardcodedColor(lit) and
  not isAllowedFile(lit.getFile()) and
  not isTokenReference(lit) and
  // Exclude black/white/transparent (allowed exceptions per CODING_GUIDELINES.md)
  not lit.getValue().regexpMatch("(#0{6,8}|#[fF]{6,8}|transparent)")
select lit,
  "Hardcoded color value '" + lit.getValue() +
    "' detected. Use oklch() format or design tokens (--xeg-* custom properties) instead for consistent theming."
