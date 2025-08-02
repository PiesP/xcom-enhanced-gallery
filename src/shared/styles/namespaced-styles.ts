/**
 * @fileoverview 단순화된 네임스페이스 스타일 시스템
 * @description 복잡한 클래스 기반 NamespacedDesignSystem을 단순 함수로 대체
 * @version 2.0.0 - Phase 1 단순화
 */

import { logger } from '@shared/logging';

const NAMESPACE = 'xeg-gallery';
const STYLE_ID = 'xeg-namespaced-styles';

let isInitialized = false;

/**
 * 네임스페이스된 CSS 생성
 */
function generateNamespacedCSS(): string {
  return `
.${NAMESPACE} {
  /* Reset and Base Styles */
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.4;

  /* Color Tokens */
  --xeg-color-primary: #1d9bf0;
  --xeg-color-primary-hover: #1a8cd8;
  --xeg-color-secondary: #657786;
  --xeg-color-background: #000000;
  --xeg-color-surface: #16181c;
  --xeg-color-text-primary: #ffffff;
  --xeg-color-text-secondary: #8b98a5;
  --xeg-color-border: #2f3336;
  --xeg-color-hover: rgba(255, 255, 255, 0.03);
  --xeg-color-active: rgba(255, 255, 255, 0.06);

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

  /* Shadows */
  --xeg-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --xeg-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
  --xeg-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.3);

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
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.${NAMESPACE} .focus-visible {
  outline: 2px solid var(--xeg-color-primary);
  outline-offset: 2px;
}
`;
}

/**
 * 네임스페이스된 디자인 시스템 초기화
 */
export function initializeNamespacedStyles(): void {
  if (isInitialized) {
    logger.debug('[NamespacedStyles] Already initialized, skipping');
    return;
  }

  const existingStyle = document.getElementById(STYLE_ID);
  if (existingStyle) {
    logger.debug('[NamespacedStyles] Style already exists, removing existing');
    existingStyle.remove();
  }

  const styleElement = document.createElement('style');
  styleElement.id = STYLE_ID;
  styleElement.textContent = generateNamespacedCSS();

  document.head.appendChild(styleElement);
  isInitialized = true;

  logger.debug('[NamespacedStyles] Initialized successfully');
}

/**
 * 스타일 시스템 정리
 */
export function cleanupNamespacedStyles(): void {
  const styleElement = document.getElementById(STYLE_ID);
  if (styleElement) {
    styleElement.remove();
    logger.debug('[NamespacedStyles] Cleaned up');
  }
  isInitialized = false;
}

/**
 * 네임스페이스 클래스명 생성
 */
export function createNamespacedClass(className: string): string {
  return `${NAMESPACE}-${className}`;
}

/**
 * 네임스페이스 셀렉터 생성
 */
export function createNamespacedSelector(selector: string): string {
  return `.${NAMESPACE} ${selector}`;
}
