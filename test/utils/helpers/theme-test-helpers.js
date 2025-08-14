/**
 * 테스트 환경 전용 테마 헬퍼 (단순 구현)
 * - setTestTheme / resetTestTheme / ensureCSSVariablesForTesting
 * Vitest DOM 환경에서 data-theme 및 클래스 토글을 검증하기 위한 최소 기능
 */

/**
 * 지원 테마
 * @typedef {'light'|'dark'} BasicTheme
 */

/**
 * 테스트용 CSS 변수 스타일 태그 ID
 * @type {string}
 */
const STYLE_ID = 'test-theme-variables';

// vitest 환경 전역 선언 (document 존재 여부 체크)
const _doc = typeof globalThis !== 'undefined' && globalThis.document ? globalThis.document : null;

/**
 * 라이트/다크 공통으로 필요한 최소 변수 셋
 */
const LIGHT_VARS = `
:root {
  --xeg-color-primary: #2563eb;
  --xeg-color-success: #10b981;
  --xeg-color-error: #ef4444;
}`;

const DARK_VARS = `
:root[data-theme="dark"] {
  --xeg-color-primary: #3b82f6;
  --xeg-color-success: #34d399;
  --xeg-color-error: #f87171;
}`;

/**
 * CSS 변수 스타일 태그 보장
 */
export function ensureCSSVariablesForTesting() {
  if (!_doc || !_doc.head) return;
  let el = _doc.getElementById(STYLE_ID);
  if (el) return; // 중복 생성 금지
  el = _doc.createElement('style');
  el.id = STYLE_ID;
  el.setAttribute('data-testid', STYLE_ID);
  el.textContent = `${LIGHT_VARS}\n${DARK_VARS}`;
  _doc.head.appendChild(el);
}

/**
 * 지정 테마 적용
 * @param {BasicTheme} theme
 */
export function setTestTheme(theme) {
  if (!_doc || !_doc.documentElement) return;
  ensureCSSVariablesForTesting();
  const root = _doc.documentElement;
  root.setAttribute('data-theme', theme);
  root.classList.remove('xeg-theme-light', 'xeg-theme-dark');
  root.classList.add(`xeg-theme-${theme}`);
}

/**
 * 라이트 테마로 리셋
 */
export function resetTestTheme() {
  setTestTheme('light');
}

export default { setTestTheme, resetTestTheme, ensureCSSVariablesForTesting };
