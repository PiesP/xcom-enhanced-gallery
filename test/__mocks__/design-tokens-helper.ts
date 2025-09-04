/**
 * @fileoverview Design Tokens 테스트 헬퍼
 * @description 3단 계층 구조의 design-tokens를 테스트에서 쉽게 사용할 수 있도록 도와주는 헬퍼
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DESIGN_TOKENS_DIR = join(__dirname, '../../src/shared/styles');

/**
 * 모든 design-tokens 파일들을 통합하여 반환
 */
export function getCompiledDesignTokens(): string {
  const primitiveTokens = readFileSync(join(DESIGN_TOKENS_DIR, 'design-tokens-helper.js'), 'utf8');
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
}

/**
 * 특정 토큰이 존재하는지 확인
 */
export function hasToken(tokenName: string): boolean {
  const compiledTokens = getCompiledDesignTokens();
  return compiledTokens.includes(tokenName);
}

/**
 * 특정 CSS 클래스가 존재하는지 확인
 */
export function hasClass(className: string): boolean {
  const compiledTokens = getCompiledDesignTokens();
  return compiledTokens.includes(`.${className}`);
}

/**
 * 특정 선택자가 존재하는지 확인
 */
export function hasSelector(selector: string): boolean {
  const compiledTokens = getCompiledDesignTokens();
  return compiledTokens.includes(selector);
}

/**
 * 테마 선택자들이 존재하는지 확인
 */
export function hasThemeSupport(): boolean {
  const compiledTokens = getCompiledDesignTokens();
  return (
    compiledTokens.includes("[data-theme='light']") ||
    compiledTokens.includes('[data-theme="light"]') ||
    compiledTokens.includes("[data-theme='dark']") ||
    compiledTokens.includes('[data-theme="dark"]')
  );
}

/**
 * 애니메이션 키프레임이 존재하는지 확인
 */
export function hasKeyframes(animationName: string): boolean {
  const compiledTokens = getCompiledDesignTokens();
  return compiledTokens.includes(`@keyframes ${animationName}`);
}

/**
 * CSS 변수의 fallback 값이 설정되어 있는지 확인
 */
export function hasFallbackValue(cssVariable: string): boolean {
  const compiledTokens = getCompiledDesignTokens();
  const pattern = new RegExp(`${cssVariable}:[^;]+var\\([^)]+,[^)]+\\)`, 'g');
  return pattern.test(compiledTokens);
}

/**
 * GPU 가속 속성이 사용되는지 확인
 */
export function hasGPUAcceleration(): boolean {
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
export function hasAccessibilitySupport(): boolean {
  const compiledTokens = getCompiledDesignTokens();
  return (
    compiledTokens.includes('@media (prefers-reduced-motion: reduce)') &&
    compiledTokens.includes('@media (prefers-contrast: high)')
  );
}

/**
 * 특정 미디어 쿼리가 존재하는지 확인
 */
export function hasMediaQuery(query: string): boolean {
  const compiledTokens = getCompiledDesignTokens();
  return compiledTokens.includes(query);
}
