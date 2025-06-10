/**
 * Commitlint configuration for X.com Enhanced Gallery project
 *
 * This configuration enforces conventional commit message format
 * to maintain consistent commit history and enable automated changelog generation.
 *
 * @see {@link https://commitlint.js.org/} - Commitlint documentation
 * @see {@link https://www.conventionalcommits.org/} - Conventional Commits specification
 */
export default {
  /**
   * Extends the conventional commit configuration
   * Provides base rules for conventional commit format: type(scope): subject
   */
  extends: ['@commitlint/config-conventional'],

  /**
   * Custom rules to override or extend the base configuration
   */
  rules: {
    /**
     * Allowed commit types for this project
     *
     * @rule type-enum - Enforces specific commit types
     * @param {number} 2 - Error level (2 = error, 1 = warning, 0 = disabled)
     * @param {string} 'always' - When to apply the rule
     * @param {string[]} types - Array of allowed commit types
     *
     * Types:
     * - feat: New feature implementation
     * - fix: Bug fixes
     * - docs: Documentation changes
     * - style: Code formatting changes (no logic changes)
     * - refactor: Code restructuring without changing functionality
     * - perf: Performance improvements
     * - test: Adding or updating tests
     * - chore: Maintenance tasks, build process updates
     * - revert: Reverting previous commits
     * - build: Build system or dependency changes
     * - ci: Continuous integration configuration changes
     * - i18n: Internationalization and localization changes
     */
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert',
        'build',
        'ci',
        'i18n',
      ],
    ],

    /**
     * Subject case validation
     *
     * @rule subject-case - Controls the case format of commit subject
     * @param {number} 2 - Error level
     * @param {string} 'never' - Disallow the specified cases
     * @param {string[]} cases - Forbidden case formats
     *
     * Disallows:
     * - pascal-case: PascalCase (e.g., "AddNewFeature")
     * - upper-case: UPPER CASE (e.g., "ADD NEW FEATURE")
     *
     * Preferred format: lowercase with spaces (e.g., "add new feature")
     */
    'subject-case': [2, 'never', ['pascal-case', 'upper-case']],

    /**
     * Maximum length for commit subject line
     *
     * @rule subject-max-length - Limits the subject line length
     * @param {number} 2 - Error level
     * @param {string} 'always' - Always apply this rule
     * @param {number} 100 - Maximum allowed characters
     *
     * Ensures commit subjects are concise and readable in git logs
     */
    'subject-max-length': [2, 'always', 100],

    /**
     * Maximum line length for commit body
     *
     * @rule body-max-line-length - Limits each line in the commit body
     * @param {number} 2 - Error level
     * @param {string} 'always' - Always apply this rule
     * @param {number} 100 - Maximum characters per line
     *
     * Ensures commit body text wraps properly in various git tools
     */
    'body-max-line-length': [2, 'always', 100],
  },
};
