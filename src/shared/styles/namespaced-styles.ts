/**
 * @fileoverview 단순화된 네임스페이스 스타일 시스템
 * @description Light DOM 격리를 위한 네임스페이싱 유틸리티
 * @version 2.1.0 (현대화: JSDoc, 에러 처리)
 *
 * ⚠️ **참고**: 현재 이 파일의 함수들은 직접 호출되지 않습니다.
 * 향후 Light DOM 격리가 필요한 경우 재활성화될 가능성이 있습니다.
 * CSS Modules와 Shadow DOM이 현재 주요 격리 방식입니다.
 */

import { logger } from '../logging';

const NAMESPACE = 'xeg-gallery';
const STYLE_ID = 'xeg-namespaced-styles';

let isInitialized = false;

/**
 * 네임스페이스된 CSS 생성
 * @internal
 * @returns 생성된 CSS 문자열
 */
function generateNamespacedCSS(): string {
  return `
.${NAMESPACE} {
  /* Reset and Base Styles */
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.4;

  /* Color Tokens - Design Token 시스템 사용 */
  --xeg-color-primary: var(--xeg-color-primary-500);
  --xeg-color-primary-hover: var(--xeg-color-primary-600);
  --xeg-color-secondary: var(--xeg-color-neutral-500);
  --xeg-color-background: var(--xeg-color-surface-dark);
  --xeg-color-surface: var(--xeg-color-surface-elevated);
  --xeg-color-surface-primary: var(--xeg-color-surface-light);
  --xeg-color-text-primary: var(--xeg-color-text-primary);
  --xeg-color-text-secondary: var(--xeg-color-text-secondary);
  --xeg-color-border: var(--xeg-color-border-primary);
  --xeg-color-border-primary: var(--xeg-color-border-primary);
  --xeg-color-hover: var(--xeg-color-overlay-light);
  --xeg-color-active: var(--xeg-color-overlay-medium);

  /* Spacing */
  --xeg-spacing-xs: 4px;
  --xeg-spacing-sm: 8px;
  --xeg-spacing-md: 16px;
  --xeg-spacing-lg: 24px;
  --xeg-spacing-xl: 32px;

  /* Border Radius */
  --xeg-radius-sm: 4px;
  --xeg-radius-md: 8px;
  --xeg-radius-lg: 16px;

  /* Shadows - Using oklch for consistent theming */
  --xeg-shadow-sm: 0 1px 3px oklch(0 0 0 / 0.3);
  --xeg-shadow-md: 0 4px 6px oklch(0 0 0 / 0.3);
  --xeg-shadow-lg: 0 10px 15px oklch(0 0 0 / 0.3);

  /* Z-index Scale */
  --xeg-z-dropdown: 1000;
  --xeg-z-sticky: 1020;
  --xeg-z-fixed: 1030;
  --xeg-z-modal-backdrop: 1040;
  --xeg-z-modal: 1050;
  --xeg-z-popover: 1060;
  --xeg-z-tooltip: 1070;
  --xeg-z-toast: 1080;
}

/* Global styles within namespace */
.${NAMESPACE} *,
.${NAMESPACE} *::before,
.${NAMESPACE} *::after {
  box-sizing: inherit;
}

.${NAMESPACE} button {
  border: none;
  background: none;
  padding: 0;
  margin: 0;
  cursor: pointer;
  font: inherit;
  color: inherit;
}

.${NAMESPACE} input,
.${NAMESPACE} textarea {
  font: inherit;
  border: none;
  outline: none;
  background: none;
  padding: 0;
  margin: 0;
}

.${NAMESPACE} img {
  max-width: 100%;
  height: auto;
}

/* Utility Classes */
.${NAMESPACE} .sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: clip;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.${NAMESPACE} .focus-visible {
  outline: var(--xeg-focus-outline);
  outline-offset: var(--xeg-focus-ring-offset);
}
`;
}

/**
 * 네임스페이스된 디자인 시스템 초기화
 *
 * ⚠️ **현재 미사용**: 향후 Light DOM 격리가 필요한 경우 활성화
 * @example
 * ```ts
 * // Light DOM 격리가 필요한 경우만 호출
 * initializeNamespacedStyles();
 * ```
 */
export function initializeNamespacedStyles(): void {
  if (isInitialized) {
    logger.debug('[NamespacedStyles] Already initialized, skipping');
    return;
  }

  try {
    const existingStyle = document.getElementById(STYLE_ID);
    if (existingStyle) {
      logger.debug('[NamespacedStyles] Style already exists, removing old');
      existingStyle.remove();
    }

    const styleElement = document.createElement('style');
    styleElement.id = STYLE_ID;
    styleElement.textContent = generateNamespacedCSS();

    document.head.appendChild(styleElement);
    isInitialized = true;

    logger.debug('[NamespacedStyles] Initialized successfully');
  } catch (error) {
    logger.error('[NamespacedStyles] Initialization failed:', error);
  }
}

/**
 * 스타일 시스템 정리
 *
 * ⚠️ **현재 미사용**: initializeNamespacedStyles 미사용에 따른 쌍 함수
 * @example
 * ```ts
 * // 컴포넌트 언마운트 시
 * cleanupNamespacedStyles();
 * ```
 */
export function cleanupNamespacedStyles(): void {
  try {
    const styleElement = document.getElementById(STYLE_ID);
    if (styleElement) {
      styleElement.remove();
      logger.debug('[NamespacedStyles] Cleaned up');
    }
  } catch (error) {
    logger.error('[NamespacedStyles] Cleanup failed:', error);
  }
  isInitialized = false;
}

/**
 * 네임스페이스 클래스명 생성
 *
 * ⚠️ **현재 미사용**: CSS Modules 권장
 * @param className - 클래스명
 * @returns 네임스페이스가 추가된 클래스명
 * @example
 * ```ts
 * const cls = createNamespacedClass('button');
 * // 반환: 'xeg-gallery-button'
 * ```
 */
export function createNamespacedClass(className: string): string {
  return `${NAMESPACE}-${className}`;
}

/**
 * 네임스페이스 셀렉터 생성
 *
 * ⚠️ **현재 미사용**: CSS Modules 권장
 * @param selector - CSS 셀렉터
 * @returns 네임스페이스가 추가된 셀렉터
 * @example
 * ```ts
 * const sel = createNamespacedSelector('button:hover');
 * // 반환: '.xeg-gallery button:hover'
 * ```
 */
export function createNamespacedSelector(selector: string): string {
  return `.${NAMESPACE} ${selector}`;
}
