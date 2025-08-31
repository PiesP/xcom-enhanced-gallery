/**
 * @fileoverview UI 관련 상수
 * @description TDD Phase 3.2 - GREEN 단계: 최소 구현
 *
 * constants.ts에서 UI 관련 상수들을 분리
 */

/**
 * 갤러리 설정 상수
 */
export const GALLERY_CONFIG = Object.freeze({
  MAX_IMAGES: 100,
  PAGINATION_SIZE: 20,
  THUMBNAIL_SIZE: 150,
} as const);

/**
 * CSS 클래스 상수
 */
export const CSS_CLASSES = Object.freeze({
  GALLERY_CONTAINER: 'xeg-gallery-container',
  THUMBNAIL: 'xeg-thumbnail',
  MODAL_OVERLAY: 'xeg-modal-overlay',
  LOADING_SPINNER: 'xeg-loading-spinner',
} as const);

/**
 * Z-Index 상수
 */
export const Z_INDEX = Object.freeze({
  TOOLBAR: 999999,
  MODAL: 1000000,
  OVERLAY: 1000001,
  TOOLTIP: 1000002,
} as const);

/**
 * 애니메이션 설정
 */
export const ANIMATION_SETTINGS = Object.freeze({
  FADE_DURATION: 300,
  SLIDE_DURATION: 250,
  ZOOM_DURATION: 200,
} as const);

/**
 * 키보드 단축키
 */
export const KEYBOARD_SHORTCUTS = Object.freeze({
  CLOSE_GALLERY: 'Escape',
  NEXT_IMAGE: 'ArrowRight',
  PREV_IMAGE: 'ArrowLeft',
  DOWNLOAD_ALL: 'd',
} as const);

/**
 * 반응형 브레이크포인트
 */
export const BREAKPOINTS = Object.freeze({
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200,
} as const);

/**
 * CSS 클래스 이름 생성
 *
 * @param componentName 컴포넌트 이름
 * @returns xeg- 접두사가 붙은 클래스 이름
 */
export function createClassName(componentName: string): string {
  return `xeg-${componentName}`;
}

/**
 * 여러 CSS 클래스를 결합
 *
 * @param classes CSS 클래스들
 * @returns 결합된 클래스 문자열
 */
export function combineClasses(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Z-Index 값 계산
 *
 * @param layer 레이어 타입
 * @returns 해당 레이어의 Z-Index 값
 */
export function calculateZIndex(layer: keyof typeof Z_INDEX): number {
  return Z_INDEX[layer];
}

/**
 * 타입 정의
 */
export type GalleryConfigKey = keyof typeof GALLERY_CONFIG;
export type CSSClassName = (typeof CSS_CLASSES)[keyof typeof CSS_CLASSES];
export type ZIndexLayer = keyof typeof Z_INDEX;
export type AnimationSetting = keyof typeof ANIMATION_SETTINGS;
export type KeyboardShortcut = keyof typeof KEYBOARD_SHORTCUTS;
export type Breakpoint = keyof typeof BREAKPOINTS;
