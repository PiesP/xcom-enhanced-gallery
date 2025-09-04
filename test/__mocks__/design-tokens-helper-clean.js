/**
 * @fileoverview Design Tokens 테스트 헬퍼
 * @description 3단 계층 구조의 design-tokens를 테스트에서 쉽게 사용할 수 있도록 도와주는 헬퍼
 */

const { readFileSync } = require('fs');
const { join } = require('path');

const DESIGN_TOKENS_DIR = join(__dirname, '../../src/shared/styles');

/**
 * 모든 design-tokens 파일들을 통합하여 반환
 */
function getCompiledDesignTokens() {
  try {
    const primitiveTokens = readFileSync(
      join(DESIGN_TOKENS_DIR, 'design-tokens.primitive.css'),
      'utf8'
    );
    const semanticTokens = readFileSync(
      join(DESIGN_TOKENS_DIR, 'design-tokens.semantic.css'),
      'utf8'
    );
    const componentTokens = readFileSync(
      join(DESIGN_TOKENS_DIR, 'design-tokens.component.css'),
      'utf8'
    );
    const mainTokens = readFileSync(join(DESIGN_TOKENS_DIR, 'design-tokens.css'), 'utf8');

    return [primitiveTokens, semanticTokens, componentTokens, mainTokens].join('\n');
  } catch (error) {
    console.warn('Design tokens를 읽는 중 오류 발생:', error.message);
    return '';
  }
}

/**
 * 특정 토큰이 존재하는지 확인
 */
function hasToken(tokenName) {
  const compiledTokens = getCompiledDesignTokens();
  return compiledTokens.includes(tokenName);
}

/**
 * 특정 CSS 클래스가 존재하는지 확인
 */
function hasClass(className) {
  const compiledTokens = getCompiledDesignTokens();
  return compiledTokens.includes('.' + className);
}

/**
 * 특정 선택자가 존재하는지 확인
 */
function hasSelector(selector) {
  const compiledTokens = getCompiledDesignTokens();
  return compiledTokens.includes(selector);
}

/**
 * 테마 선택자들이 존재하는지 확인
 */
function hasThemeSupport() {
  const compiledTokens = getCompiledDesignTokens();
  return (
    compiledTokens.includes('[data-theme="light"]') ||
    compiledTokens.includes('[data-theme="dark"]') ||
    compiledTokens.includes("data-theme='light'") ||
    compiledTokens.includes("data-theme='dark'")
  );
}

/**
 * 애니메이션 키프레임이 존재하는지 확인
 */
function hasKeyframes(animationName) {
  const compiledTokens = getCompiledDesignTokens();
  return compiledTokens.includes('@keyframes ' + animationName);
}

/**
 * CSS 변수의 fallback 값이 설정되어 있는지 확인
 */
function hasFallbackValue(cssVariable) {
  const compiledTokens = getCompiledDesignTokens();
  const pattern = new RegExp(cssVariable + ':[^;]+var\\([^)]+,[^)]+\\)', 'g');
  return pattern.test(compiledTokens);
}

/**
 * GPU 가속 속성이 사용되는지 확인
 */
function hasGPUAcceleration() {
  const compiledTokens = getCompiledDesignTokens();
  return (
    compiledTokens.includes('transform:') ||
    compiledTokens.includes('opacity:') ||
    compiledTokens.includes('will-change:') ||
    compiledTokens.includes('translate3d(') ||
    compiledTokens.includes('translateZ(')
  );
}

/**
 * 접근성 지원 확인
 */
function hasAccessibilitySupport() {
  const compiledTokens = getCompiledDesignTokens();
  return (
    compiledTokens.includes('@media (prefers-reduced-motion: reduce)') &&
    compiledTokens.includes('@media (prefers-contrast: high)')
  );
}

/**
 * 특정 미디어 쿼리가 존재하는지 확인
 */
function hasMediaQuery(query) {
  const compiledTokens = getCompiledDesignTokens();
  return compiledTokens.includes(query);
}

module.exports = {
  getCompiledDesignTokens,
  hasToken,
  hasClass,
  hasSelector,
  hasThemeSupport,
  hasKeyframes,
  hasFallbackValue,
  hasGPUAcceleration,
  hasAccessibilitySupport,
  hasMediaQuery,
};
