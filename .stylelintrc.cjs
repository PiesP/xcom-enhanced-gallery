/**
 * Stylelint configuration for X.com Enhanced Gallery
 * 목적: "중복 린팅"에 집중한 경고 중심 설정 (빌드 실패 방지)
 */
module.exports = {
  defaultSeverity: 'warning',
  ignoreFiles: ['dist/**', 'build/**', 'coverage/**', 'release/**', 'node_modules/**'],
  rules: {
    // 핵심: 중복 탐지
    'no-duplicate-selectors': true,
    'declaration-block-no-duplicate-properties': [
      true,
      { ignore: ['consecutive-duplicates-with-different-values'] },
    ],
    // 커스텀 프로퍼티 중복도 경고
    'declaration-block-no-duplicate-custom-properties': true,

    // 잡음 줄이기: 나머지 규칙은 비활성화
    'property-no-vendor-prefix': null,
    'selector-pseudo-class-no-unknown': null,
    'alpha-value-notation': null,
    'color-function-notation': null,
    'color-function-alias-notation': null,
    'hue-degree-notation': null,
    'lightness-notation': null,
    'media-feature-range-notation': null,
    'value-keyword-case': null,
    'rule-empty-line-before': null,
    'comment-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'declaration-empty-line-before': null,
    'declaration-block-no-shorthand-property-overrides': null,
    'property-no-unknown': null,
    'property-no-deprecated': null,
    'selector-not-notation': null,
    'shorthand-property-no-redundant-values': null,
    'no-descending-specificity': null,
  },
};
