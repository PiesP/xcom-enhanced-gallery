/**
 * @fileoverview CSS Validation Utilities
 * @description CSS selector validation and performance analysis functions
 */

/**
 * Validates if a CSS selector is valid.
 */
export function isValidCSSSelector(selector: string): boolean {
  if (!selector || typeof selector !== 'string') {
    return false;
  }

  try {
    // Use browser's querySelector for validation
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculates the complexity score of a CSS selector.
 */
export function calculateSelectorComplexity(selector: string): number {
  if (!selector || typeof selector !== 'string') {
    return 0;
  }

  let complexity = 0;

  // Base complexity weights
  const weights = {
    id: 1, // #id
    class: 2, // .class
    attribute: 3, // [attr]
    type: 1, // div
    pseudo: 2, // :hover
    descendant: 1, // space
    child: 2, // >
    sibling: 2, // +, ~
    universal: 1, // *
  };

  // ID selectors
  complexity += (selector.match(/#[\w-]+/g) || []).length * weights.id;

  // Class selectors
  complexity += (selector.match(/\.[\w-]+/g) || []).length * weights.class;

  // Attribute selectors
  complexity += (selector.match(/\[[^\]]+\]/g) || []).length * weights.attribute;

  // Type selectors (tag names)
  complexity += (selector.match(/\b[a-z][a-z0-9]*\b/gi) || []).length * weights.type;

  // Pseudo-classes and pseudo-elements
  complexity += (selector.match(/:[\w-]+(\([^)]*\))?/g) || []).length * weights.pseudo;

  // Combinators
  complexity += (selector.match(/\s+/g) || []).length * weights.descendant;
  complexity += (selector.match(/>/g) || []).length * weights.child;
  complexity += (selector.match(/[+~]/g) || []).length * weights.sibling;

  // Universal selector
  complexity += (selector.match(/\*/g) || []).length * weights.universal;

  return complexity;
}

/**
 * Checks if a CSS selector has performance issues.
 */
export function hasPerformanceIssues(selector: string): boolean {
  if (!selector || typeof selector !== 'string') {
    return true;
  }

  // Check only for severe performance issues
  const severePerformanceIssues = [
    // Universal selector at the beginning
    /^\s*\*/,
    // Excessive descendant combinators (8 or more)
    /(\s+[^>+~\s]+){8,}/,
  ];

  // Consider only very high complexity as problematic (150+)
  if (calculateSelectorComplexity(selector) > 150) {
    return true;
  }

  // Check for severe performance issue patterns only
  return severePerformanceIssues.some(pattern => pattern.test(selector));
}
