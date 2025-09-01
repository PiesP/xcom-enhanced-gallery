/**
 * @fileoverview 단순화된 네임스페이스 스타일 시스템
 * @description 복잡한 클래스 기반 NamespacedDesignSystem을 단순 함수로 대체
 * @version 2.0.0 - Phase 1 단순화
 */

import { logger } from '@shared/logging';
import { STYLE_ID, NAMESPACE } from './constants';

/**
 * CSS 생성 관련 타입 정의
 */
type CSSString = string;
type CSSSelector = string;
type ClassName = string;

let isInitialized = false;

/**
 * 기본 CSS 스타일 생성
 */
function generateBaseStyles(): CSSString {
  return `
.${NAMESPACE} {
  /* Reset and Base Styles */
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  line-height: 1.4;
  /* Note: overscroll-behavior removed from global namespace to prevent unintended effects.
     Specific overscroll containment is now handled by individual gallery components. */
}

/* Gallery container: contain overscroll to avoid page bounce when interacting with gallery.
   Use the namespaced utility class .xeg-gallery-container (or create via createNamespacedClass('gallery-container')).
   Note: IE / 오래된 Safari 등에서는 동작하지 않을 수 있으며 폴백이 필요할 수 있습니다. */
.${NAMESPACE} .xeg-gallery-container {
  overscroll-behavior: contain;  // 추가: 오버스크롤 차단 (스크롤이 컨테이너 밖으로 넘기지 않음)
  /* 권장 touch-action: allow natural vertical panning while preventing undesirable propagation.
     조정이 필요하면 pan-x / pan-y 등으로 변경하세요. */
  touch-action: pan-y;
}`;
}

/**
 * 컴포넌트별 CSS 변수 생성 (design-tokens.css 글로벌 변수 참조)
 */
function generateComponentVariables(): CSSString {
  return `
.${NAMESPACE} {
  /* Component-level Custom Properties */
  /* 참고: 이 변수들은 design-tokens.css의 글로벌 변수를 참조합니다 */

  /* Primary Colors */
  --xeg-color-primary: var(--xeg-color-primary-500);
  --xeg-color-primary-hover: var(--xeg-color-primary-600);
  --xeg-color-secondary: var(--xeg-color-neutral-500);

  /* Surface Colors */
  --xeg-color-background: var(--xeg-color-surface-dark);
  --xeg-color-surface: var(--xeg-color-surface-elevated);
  --xeg-color-surface-primary: var(--xeg-color-surface-light);

  /* Text Colors */
  --xeg-color-text-primary: var(--xeg-color-neutral-900);
  --xeg-color-text-secondary: var(--xeg-color-neutral-600);

  /* Interactive Colors */
  --xeg-color-border: var(--xeg-color-border-primary);
  --xeg-color-hover: var(--xeg-color-overlay-light);
  --xeg-color-active: var(--xeg-color-overlay-medium);
}`;
}

/**
 * 네임스페이스된 CSS 생성
 */
export function generateNamespacedCSS(): CSSString {
  const baseStyles = generateBaseStyles();
  const componentVars = generateComponentVariables();

  const globalStyles = `
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
}`;

  const utilityClasses = `
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
  outline: var(--xeg-focus-outline);
  outline-offset: var(--xeg-focus-ring-offset);
}`;

  return `${baseStyles}${componentVars}${globalStyles}${utilityClasses}`;
}

/**
 * 네임스페이스된 디자인 시스템 초기화
 */
export function initializeNamespacedStyles(): void {
  if (isInitialized) {
    logger.debug('[NamespacedStyles] Already initialized, skipping');
    return;
  }

  // 테스트 환경에서 document 안전하게 접근
  const doc = globalThis.document;
  if (!doc) {
    logger.warn('[NamespacedStyles] Document not available');
    return;
  }

  const existingStyle = doc.getElementById(STYLE_ID);

  // 빌드된 완전한 CSS가 이미 존재하는 경우 추가 초기화 생략
  if (existingStyle) {
    const existingContent = existingStyle.textContent || '';
    // 빌드된 CSS는 일반적으로 64KB 이상, 네임스페이스 CSS는 1KB 미만
    // CSS 모듈 클래스명이 포함되어 있으면 빌드된 완전한 스타일로 판단
    if (existingContent.length > 10000 || existingContent.includes('-module__')) {
      logger.debug(
        '[NamespacedStyles] Complete built styles already exist, skipping initialization'
      );
      isInitialized = true;
      return;
    }

    logger.debug('[NamespacedStyles] Incomplete style exists, replacing with namespaced version');
    existingStyle.remove();
  }

  const styleElement = doc.createElement('style');
  styleElement.id = STYLE_ID;
  styleElement.textContent = generateNamespacedCSS();

  doc.head.appendChild(styleElement);
  isInitialized = true;

  logger.debug('[NamespacedStyles] Initialized successfully');
}

/**
 * 스타일 시스템 정리
 */
export function cleanupNamespacedStyles(): void {
  const doc = globalThis.document;
  if (!doc) {
    return;
  }

  const styleElement = doc.getElementById(STYLE_ID);
  if (styleElement) {
    styleElement.remove();
    logger.debug('[NamespacedStyles] Cleaned up');
  }
  isInitialized = false;
}

/**
 * 네임스페이스 클래스명 생성
 */
export function createNamespacedClass(className: string): ClassName {
  return `${NAMESPACE}-${className}`;
}

/**
 * 네임스페이스 셀렉터 생성
 */
export function createNamespacedSelector(selector: string): CSSSelector {
  return `.${NAMESPACE} ${selector}`;
}

/**
 * Shadow DOM용 스타일 주입 (Phase 4)
 * Shadow DOM 내부에 갤러리 전용 스타일을 주입합니다.
 */
export function injectShadowDOMStyles(shadowRoot: ShadowRoot): void {
  if (!shadowRoot) {
    logger.warn('[NamespacedStyles] Invalid shadow root provided');
    return;
  }

  // 기존에 주입된 스타일이 있는지 확인
  const existingStyle = shadowRoot.querySelector(`#${STYLE_ID}`);
  if (existingStyle) {
    logger.debug('[NamespacedStyles] Shadow DOM styles already injected');
    return;
  }

  const styleElement = globalThis.document?.createElement('style');
  if (!styleElement) {
    logger.warn('[NamespacedStyles] Cannot create style element');
    return;
  }

  styleElement.id = STYLE_ID;
  styleElement.textContent = generateNamespacedCSS();

  shadowRoot.appendChild(styleElement);
  logger.debug('[NamespacedStyles] Shadow DOM styles injected successfully');
}
