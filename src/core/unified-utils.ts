/**
 * @fileoverview 통합 유틸리티 모듈 (확장 버전)
 * @description 분산된 유틸리티 함수들을 하나로 통합
 *
 * 변경사항:
 * - 여러 개의 작은 유틸리티 파일들을 하나로 통합
 * - 기능별로 섹션 분리
 * - 불필요한 복잡성 제거
 * - 유저스크립트에 필요한 핵심 기능만 유지
 */

import { logger } from '@core/logging/logger';
import type { MediaInfo } from '@core/types/media.types';
import { galleryState } from '@core/state/signals/gallery.signals';

// ===========================
// 중복 제거 유틸리티
// ===========================

/**
 * 범용 중복 제거 함수
 */
export function removeDuplicates<T>(items: readonly T[], keyExtractor: (item: T) => string): T[] {
  if (!items?.length) {
    return [];
  }

  const seen = new Set<string>();
  const uniqueItems: T[] = [];

  for (const item of items) {
    if (!item) {
      continue;
    }

    const key = keyExtractor(item);
    if (!key) {
      logger.warn('[deduplication] Skipping item without key');
      continue;
    }

    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(item);
    }
  }

  return uniqueItems;
}

/**
 * 문자열 배열 중복 제거
 */
export function removeDuplicateStrings(items: readonly string[]): string[] {
  return removeDuplicates(items, item => item);
}

/**
 * 미디어 아이템 중복 제거
 */
export function removeDuplicateMediaItems(mediaItems: readonly MediaInfo[]): MediaInfo[] {
  const result = removeDuplicates(mediaItems, item => item.url);

  // 로깅 (성능 최적화를 위해 실제로 제거된 경우만)
  const removedCount = mediaItems.length - result.length;
  if (removedCount > 0) {
    logger.debug('[deduplication] Removed duplicates:', {
      original: mediaItems.length,
      unique: result.length,
      removed: removedCount,
    });
  }

  return result;
}

// ===========================
// CSS 선택자 유틸리티
// ===========================

/**
 * CSS 선택자의 문법적 유효성을 검증합니다
 */
export function isValidCSSSelector(selector: string): boolean {
  if (!selector || typeof selector !== 'string') {
    return false;
  }

  try {
    const testElement = document.createElement('div');
    testElement.querySelector(selector);
    return true;
  } catch {
    return false;
  }
}

/**
 * CSS 선택자의 복잡도를 측정합니다
 */
export function calculateSelectorComplexity(selector: string): number {
  let complexity = 0;

  // 기본 요소 선택자
  if (selector.match(/^[a-zA-Z]+/)) complexity += 1;

  // ID 선택자
  const idMatches = selector.match(/#[a-zA-Z0-9-_]+/g);
  if (idMatches) complexity += idMatches.length * 10;

  // 클래스 선택자
  const classMatches = selector.match(/\.[a-zA-Z0-9-_]+/g);
  if (classMatches) complexity += classMatches.length * 5;

  // 속성 선택자
  const attributeMatches = selector.match(/\[[^\]]+\]/g);
  if (attributeMatches) complexity += attributeMatches.length * 2;

  // 자식/후손 선택자
  const descendantMatches = selector.match(/[>\s+~]/g);
  if (descendantMatches) complexity += descendantMatches.length * 1;

  return complexity;
}

// ===========================
// 갤러리 유틸리티
// ===========================

/**
 * 갤러리 관련 선택자들
 */
const GALLERY_SELECTORS = [
  '.xeg-gallery-container',
  '[data-gallery-element]',
  '#xeg-gallery-root',
  '.vertical-gallery-view',
  '[data-xeg-gallery-container]',
  '[data-xeg-gallery]',
  '.xeg-vertical-gallery',
  '[data-xeg-role="gallery"]',
  '.toolbar',
  '.xeg-toolbar',
  '.xeg-button',
  '.gallery-controls',
  '.media-viewer',
  '.xeg-toast-container',
  '.xeg-toast',
];

/**
 * 비디오 제어 요소 선택자들
 */
const VIDEO_CONTROL_SELECTORS = [
  '[data-testid="playButton"]',
  'button[aria-label*="재생"]',
  'button[aria-label*="Play"]',
  'button[aria-label*="일시정지"]',
  'button[aria-label*="Pause"]',
  '.video-controls button',
  '.player-controls button',
  '[role="slider"]',
  '[data-testid="videoPlayer"] button',
  '[data-testid="videoComponent"] button',
];

/**
 * 갤러리 트리거 가능 여부 확인
 */
export function canTriggerGallery(event?: MouseEvent): boolean {
  try {
    // 갤러리가 이미 열려있으면 차단
    if (galleryState.value.isOpen) {
      return false;
    }

    if (event) {
      // 좌클릭만 허용
      if (event.button !== 0) {
        return false;
      }

      const target = event.target as HTMLElement;

      // 갤러리 내부 요소나 비디오 제어 요소 클릭 차단
      if (isGalleryInternalElement(target) || isVideoControlElement(target)) {
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('Error checking gallery trigger capability:', error);
    return false;
  }
}

/**
 * 갤러리 내부 요소인지 확인
 */
export function isGalleryInternalElement(element: HTMLElement): boolean {
  if (!element) return false;

  try {
    for (const selector of GALLERY_SELECTORS) {
      if (element.matches(selector) || element.closest(selector)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    logger.warn('Error checking gallery internal element:', error);
    return false;
  }
}

/**
 * 비디오 제어 요소인지 확인
 */
export function isVideoControlElement(element: HTMLElement): boolean {
  if (!element) return false;

  try {
    for (const selector of VIDEO_CONTROL_SELECTORS) {
      if (element.matches(selector) || element.closest(selector)) {
        return true;
      }
    }

    // 비디오 요소의 자식이거나 controls 속성이 있으면 제어 요소로 간주
    if (element.closest('video') || element.hasAttribute('controls') || element.tagName.toLowerCase() === 'video') {
      return true;
    }

    return false;
  } catch (error) {
    logger.warn('Error checking video control element:', error);
    return false;
  }
}

// ===========================
// DOM 유틸리티
// ===========================

/**
 * 안전한 DOM 요소 선택
 */
export function safeQuerySelector<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): T | null {
  try {
    return parent.querySelector<T>(selector);
  } catch (error) {
    logger.warn(`Invalid selector: ${selector}`, error);
    return null;
  }
}

/**
 * 안전한 DOM 요소 다중 선택
 */
export function safeQuerySelectorAll<T extends Element = Element>(
  selector: string,
  parent: Document | Element = document
): T[] {
  try {
    return Array.from(parent.querySelectorAll<T>(selector));
  } catch (error) {
    logger.warn(`Invalid selector: ${selector}`, error);
    return [];
  }
}

/**
 * 요소가 갤러리 내부에 있는지 확인 (isGalleryInternalElement의 별칭)
 */
export function isInsideGallery(element: Element): boolean {
  return isGalleryInternalElement(element as HTMLElement);
}

/**
 * 요소가 뷰포트에 보이는지 확인
 */
export function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= window.innerHeight &&
    rect.right <= window.innerWidth
  );
}

// ===========================
// 미디어 유틸리티
// ===========================

/**
 * 미디어 타입 감지
 */
export function detectMediaType(url: string): 'image' | 'video' | 'unknown' {
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i;
  const videoExtensions = /\.(mp4|webm|ogv|avi|mov)$/i;

  if (imageExtensions.test(url)) return 'image';
  if (videoExtensions.test(url)) return 'video';

  // URL 패턴으로 추가 감지
  if (url.includes('video.twimg.com')) return 'video';
  if (url.includes('pbs.twimg.com')) return 'image';

  return 'unknown';
}

/**
 * 트위터 미디어 URL 정리
 */
export function cleanTwitterMediaUrl(url: string): string {
  // 트위터 이미지 URL에서 크기 제한 제거
  if (url.includes('pbs.twimg.com')) {
    return `${url.split('?')[0]}?format=jpg&name=orig`;
  }

  // 트위터 비디오 URL 정리
  if (url.includes('video.twimg.com')) {
    return url.split('?')[0];
  }

  return url;
}

/**
 * 파일명 생성
 */
export function generateFileName(url: string, username?: string, index?: number): string {
  const extension = getFileExtension(url);
  const timestamp = new Date().toISOString().slice(0, 10);
  const userPart = username ? `${username}_` : '';
  const indexPart = typeof index === 'number' ? `_${index + 1}` : '';

  return `${userPart}${timestamp}${indexPart}.${extension}`;
}

/**
 * 파일 확장자 추출
 */
export function getFileExtension(url: string): string {
  const cleanUrl = url.split('?')[0];
  const match = cleanUrl.match(/\.([^.]+)$/);

  if (match) {
    return match[1].toLowerCase();
  }

  // 미디어 타입에 따른 기본 확장자
  const mediaType = detectMediaType(url);
  return mediaType === 'video' ? 'mp4' : 'jpg';
}

/**
 * 이미지 로드 프로미스
 */
export function loadImage(src: string, timeout = 10000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    const timeoutId = setTimeout(() => {
      reject(new Error(`Image load timeout: ${src}`));
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to load image: ${src}`));
    };

    img.src = src;
  });
}

// ===========================
// 성능 유틸리티
// ===========================

/**
 * 디바운스 함수
 */
export function debounce<T extends (...args: never[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
}

/**
 * 스로틀 함수
 */
export function throttle<T extends (...args: never[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * RAF 기반 스로틀
 */
export function rafThrottle<T extends (...args: never[]) => void>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return (...args: Parameters<T>) => {
    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        func(...args);
        rafId = null;
      });
    }
  };
}

/**
 * 성능 측정
 */
export async function measurePerformance<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.debug(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
}

// ===========================
// 이벤트 유틸리티
// ===========================

/**
 * 안전한 이벤트 리스너 추가
 */
export function addEventListenerSafe(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions
): () => void {
  try {
    target.addEventListener(type, listener, options);
    return () => {
      try {
        target.removeEventListener(type, listener, options);
      } catch (error) {
        logger.warn(`Failed to remove event listener: ${type}`, error);
      }
    };
  } catch (error) {
    logger.warn(`Failed to add event listener: ${type}`, error);
    return () => {}; // 빈 정리 함수 반환
  }
}

/**
 * 키보드 이벤트 헬퍼
 */
export function isKeyPressed(event: KeyboardEvent, key: string): boolean {
  return event.key === key || event.code === key;
}

export function isModifierPressed(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
}

// ===========================
// 유틸리티 타입 및 검증
// ===========================

/**
 * 값이 null이나 undefined가 아닌지 확인
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * 숫자 범위 제한
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 배열 중복 제거
 */
export function uniqueArray<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * 안전한 JSON 파싱
 */
export function safeJsonParse<T>(json: string): T | null {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/**
 * CSS 선택자 유효성 검증 (isValidCSSSelector의 별칭)
 */
export function isValidSelector(selector: string): boolean {
  return isValidCSSSelector(selector);
}

// ===========================
// 에러 처리 유틸리티
// ===========================

/**
 * 안전한 함수 실행
 */
export async function safeExecute<T>(
  fn: () => T | Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    logger.error('Safe execution failed:', error);
    return fallback;
  }
}

/**
 * 재시도 실행
 */
export async function retryExecution<T>(
  fn: () => T | Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // 지수 백오프
      }
    }
  }

  throw lastError!;
}
