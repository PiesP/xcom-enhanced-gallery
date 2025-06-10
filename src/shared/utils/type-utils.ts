/**
 * 공통 타입 유틸리티 및 타입 가드 함수들
 *
 * @description 프로젝트 전반에서 사용되는 타입 가드와 유틸리티 함수들을 제공합니다.
 * @module TypeUtils
 */

/**
 * HTML 요소 타입 가드
 */
export function isElementOfType<T extends HTMLElement>(
  element: Element | null | undefined,
  constructor: new (...args: unknown[]) => T
): element is T {
  return element instanceof constructor;
}

/**
 * DOM 환경 확인
 */
export function isDOMAvailable(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined' && document.body !== null;
}

/**
 * 유효한 이미지 요소 확인
 */
export function isValidImageElement(element: Element | null): element is HTMLImageElement {
  return element instanceof HTMLImageElement && element.src.length > 0;
}

/**
 * 유효한 비디오 요소 확인
 */
export function isValidVideoElement(element: Element | null): element is HTMLVideoElement {
  return element instanceof HTMLVideoElement && element.src.length > 0;
}

/**
 * 미디어 요소 확인 (이미지 또는 비디오)
 */
export function isMediaElement(
  element: Element | null
): element is HTMLImageElement | HTMLVideoElement {
  return isValidImageElement(element) || isValidVideoElement(element);
}

/**
 * 클릭 가능한 요소 확인
 */
export function isClickableElement(element: Element | null): element is HTMLElement {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();
  const clickableTagNames = ['button', 'a', 'input', 'select', 'textarea'];

  return (
    clickableTagNames.includes(tagName) ||
    element.hasAttribute('onclick') ||
    (element.hasAttribute('role') && element.getAttribute('role') === 'button') ||
    element.style.cursor === 'pointer'
  );
}

/**
 * 폼 요소 확인
 */
export function isFormElement(element: Element | null): element is HTMLFormElement {
  return element instanceof HTMLFormElement;
}

/**
 * 입력 요소 확인
 */
export function isInputElement(element: Element | null): element is HTMLInputElement {
  return element instanceof HTMLInputElement;
}

/**
 * 버튼 요소 확인
 */
export function isButtonElement(element: Element | null): element is HTMLButtonElement {
  return element instanceof HTMLButtonElement;
}

/**
 * 링크 요소 확인
 */
export function isLinkElement(element: Element | null): element is HTMLAnchorElement {
  return element instanceof HTMLAnchorElement;
}

/**
 * 숫자 타입 가드
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !Number.isNaN(value);
}

/**
 * 문자열 타입 가드
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 비어있지 않은 문자열 확인
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

/**
 * 객체 타입 가드
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 배열 타입 가드
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * 함수 타입 가드
 */
export function isFunction(value: unknown): value is (...args: unknown[]) => unknown {
  return typeof value === 'function';
}

/**
 * null 또는 undefined 확인
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * 정의된 값 확인 (null, undefined가 아님)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return !isNullish(value);
}

/**
 * Promise 타입 가드
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return isDefined(value) && isObject(value) && isFunction((value as { then?: unknown }).then);
}

/**
 * Error 객체 타입 가드
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * 유효한 URL 문자열 확인
 */
export function isValidUrl(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * 유효한 이메일 주소 확인
 */
export function isValidEmail(value: unknown): value is string {
  if (!isString(value)) {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * 이벤트 객체 타입 가드
 */
export function isMouseEvent(event: Event): event is MouseEvent {
  return event instanceof MouseEvent;
}

export function isKeyboardEvent(event: Event): event is KeyboardEvent {
  return event instanceof KeyboardEvent;
}

export function isTouchEvent(event: Event): event is TouchEvent {
  return event instanceof TouchEvent;
}

/**
 * 파일 확장자 확인
 */
export function hasImageExtension(filename: string): boolean {
  if (!isString(filename)) {
    return false;
  }

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
  const lowercaseFilename = filename.toLowerCase();

  return imageExtensions.some(ext => lowercaseFilename.endsWith(ext));
}

export function hasVideoExtension(filename: string): boolean {
  if (!isString(filename)) {
    return false;
  }

  const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.mkv'];
  const lowercaseFilename = filename.toLowerCase();

  return videoExtensions.some(ext => lowercaseFilename.endsWith(ext));
}

/**
 * 갤러리 관련 요소 확인
 */
export function hasGalleryDataAttribute(element: Element | null): boolean {
  if (!element) {
    return false;
  }

  return Array.from(element.attributes).some(attr => attr.name.startsWith('data-xeg-'));
}

/**
 * 스크롤 가능한 요소 확인
 */
export function isScrollableElement(element: Element | null): element is HTMLElement {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }

  const computedStyle = window.getComputedStyle(element);
  const overflowY = computedStyle.overflowY;
  const overflowX = computedStyle.overflowX;

  return (
    overflowY === 'scroll' || overflowY === 'auto' || overflowX === 'scroll' || overflowX === 'auto'
  );
}

/**
 * 숨겨진 요소 확인
 */
export function isHiddenElement(element: Element | null): boolean {
  if (!element || !(element instanceof HTMLElement)) {
    return true;
  }

  const computedStyle = window.getComputedStyle(element);

  return (
    computedStyle.display === 'none' ||
    computedStyle.visibility === 'hidden' ||
    computedStyle.opacity === '0' ||
    element.hidden
  );
}

/**
 * 요소가 뷰포트 내에 있는지 확인
 */
export function isElementInViewport(element: Element | null): boolean {
  if (!element) {
    return false;
  }

  const rect = element.getBoundingClientRect();

  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T = unknown>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return null;
  }
}

/**
 * 안전한 localStorage 접근
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__xeg_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}
