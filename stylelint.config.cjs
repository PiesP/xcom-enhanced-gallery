// Minimal Stylelint configuration used by CI and developers.
// We keep things simple and extend 'stylelint-config-standard' to match
// the project's expectations while keeping CI deterministic.
module.exports = {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['dist/**', 'build/**', 'node_modules/**', 'coverage/**'],
  rules: {
    // Allow CSS variables in selectors (common in our PostCSS pipeline)
    'selector-class-pattern': null,
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'variants', 'responsive', 'screen'],
      },
    ],
    // No automatic restrictions — keep the CI policy conservative
    'no-empty-source': null,
    // Relax rules that conflict with our current design token conventions,
    // PostCSS pipeline, and cross-browser vendor prefixes.
    'value-keyword-case': null,
    'property-no-vendor-prefix': null,
    'lightness-notation': null,
    'hue-degree-notation': null,
    'number-max-precision': null,
    'comment-empty-line-before': null,
    'rule-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'no-duplicate-selectors': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'keyframes-name-pattern': null,
    'property-no-deprecated': null,
  },
};
