/**
 * @fileoverview 네임스페이스 스타일 시스템 (Wave 2: CSS 레이어 지원)
 * @description CSS @layer 지시문을 활용한 스타일 우선순위 관리
 * @version 2.1.0 - Wave 2 CSS 레이어 시스템
 */

import { logger } from '@shared/logging';
import { STYLE_ID, NAMESPACE } from './constants';

/**
 * CSS 생성 관련 타입 정의
 */
type CSSString = string;

let isInitialized = false;

/**
 * CSS 레이어 순서 정의 (Wave 2 추가)
 */
const CSS_LAYERS = [
  'reset', // 0. 브라우저 기본 스타일 재설정
  'base', // 1. 기본 타이포그래피, 컬러 등
  'components', // 2. 컴포넌트별 스타일
  'utilities', // 3. 유틸리티 클래스
  'overrides', // 4. 특수 상황 오버라이드
] as const;

/**
 * CSS 레이어 선언 생성 (Wave 2 추가)
 */
function generateLayerDeclaration(): CSSString {
  return `@layer ${CSS_LAYERS.join(', ')};`;
}

/**
 * 기본 CSS 스타일 생성 (Wave 2: 레이어 적용)
 */
function generateBaseStyles(): CSSString {
  return `
@layer reset {
  .${NAMESPACE} {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  .${NAMESPACE} *,
  .${NAMESPACE} *::before,
  .${NAMESPACE} *::after {
    box-sizing: inherit;
  }
}

@layer base {
  .${NAMESPACE} {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.4;
    color: var(--xeg-color-text-primary, #0f1419);
    background: var(--xeg-color-bg-primary, #ffffff);
  }
}

@layer components {
  .${NAMESPACE} .xeg-gallery-container {
    overscroll-behavior: contain;
    touch-action: pan-y;
    position: relative;
    display: flex;
    flex-direction: column;
  }
}`;
}

/**
 * 컴포넌트별 CSS 변수 생성
 */
function generateComponentVariables(): CSSString {
  return `
@layer base {
  .${NAMESPACE} {
    --xeg-z-gallery: 1000;
    --xeg-z-modal: 1100;
    --xeg-z-tooltip: 1200;
    --xeg-z-notification: 1300;
    
    --xeg-transition-fast: 150ms ease-out;
    --xeg-transition-medium: 250ms ease-out;
    --xeg-transition-slow: 350ms ease-out;
  }
}`;
}

/**
 * 유틸리티 클래스 생성
 */
function generateUtilityStyles(): CSSString {
  return `
@layer utilities {
  .${NAMESPACE} .xeg-visually-hidden {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }
  
  .${NAMESPACE} .xeg-flex-center {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}`;
}

/**
 * 네임스페이스된 CSS 생성 (Wave 2: 레이어 지원)
 */
export function generateNamespacedCSS(): CSSString {
  const layerDeclaration = generateLayerDeclaration();
  const baseStyles = generateBaseStyles();
  const componentVars = generateComponentVariables();
  const utilityStyles = generateUtilityStyles();

  return `${layerDeclaration}\n${baseStyles}\n${componentVars}\n${utilityStyles}`;
}

/**
 * 네임스페이스된 클래스명 생성
 */
export function createNamespacedClass(className: string): string {
  return `${NAMESPACE}-${className}`;
}

/**
 * 네임스페이스된 CSS 셀렉터 생성 (Wave 2 추가)
 */
export function createNamespacedSelector(selector: string): string {
  return `.${NAMESPACE} ${selector}`;
}

/**
 * Shadow DOM에 스타일 주입 (Wave 2 추가)
 */
export function injectShadowDOMStyles(shadowRoot: ShadowRoot): void {
  const styleElement = shadowRoot.ownerDocument.createElement('style');
  styleElement.textContent = generateNamespacedCSS();
  shadowRoot.appendChild(styleElement);
}

/**
 * 네임스페이스된 디자인 시스템 초기화
 */
export function initializeNamespacedStyles(): void {
  if (isInitialized) {
    logger.debug('[NamespacedStyles] Already initialized, skipping');
    return;
  }

  const doc = globalThis.document;
  if (!doc) {
    logger.warn('[NamespacedStyles] Document not available');
    return;
  }

  const existingStyle = doc.getElementById(STYLE_ID);
  if (existingStyle) {
    const existingContent = existingStyle.textContent || '';
    if (existingContent.length > 10000 || existingContent.includes('-module__')) {
      logger.debug('[NamespacedStyles] Complete built styles already exist, skipping');
      isInitialized = true;
      return;
    }
    existingStyle.remove();
  }

  const styleElement = doc.createElement('style');
  styleElement.id = STYLE_ID;
  styleElement.textContent = generateNamespacedCSS();

  doc.head.appendChild(styleElement);
  isInitialized = true;

  logger.debug('[NamespacedStyles] Initialized successfully with CSS layers');
}

/**
 * 스타일 시스템 정리
 */
export function cleanupNamespacedStyles(): void {
  const doc = globalThis.document;
  if (!doc) return;

  const styleElement = doc.getElementById(STYLE_ID);
  if (styleElement) {
    styleElement.remove();
    isInitialized = false;
    logger.debug('[NamespacedStyles] Cleaned up');
  }
}

/**
 * 초기화 상태 확인
 */
export function isStylesInitialized(): boolean {
  return isInitialized;
}
