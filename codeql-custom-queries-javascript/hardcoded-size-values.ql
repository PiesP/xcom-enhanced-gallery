/**
 * @name Hardcoded size values (px)
 * @description Detects hardcoded px values outside design token definition files
 * @kind problem
 * @id xeg/hardcoded-size-px
 * @problem.severity warning
 * @tags maintainability
 *       accessibility
 *       design-tokens
 *
 * NOTE: This query is a placeholder for CSS linting.
 * Actual implementation is done via stylelint (.stylelintrc.json)
 * which provides better CSS-specific analysis.
 *
 * Stylelint rule: unit-disallowed-list: ["px"]
 * Ignores: design-tokens.*.css files
 */

import javascript

// Empty query that never matches - used as documentation placeholder
from File f
where none()
select f, "This query is a placeholder. Use stylelint for CSS linting."
