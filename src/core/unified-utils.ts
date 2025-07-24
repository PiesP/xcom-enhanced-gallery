/**
 * @fileoverview 통합 유틸리티 모듈
 * @description 분산된 유틸리티 함수들을 하나로 통합
 *
 * 변경사항:
 * - 여러 개의 작은 유틸리티 파일들을 하나로 통합
 * - 기능별로 섹션 분리
 * - 불필요한 복잡성 제거
 * - 유저스크립트에 필요한 핵심 기능만 유지
 */

import { logger } from '@core/logging/logger';

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
 * 요소가 갤러리 내부에 있는지 확인
 */
export function isInsideGallery(element: Element): boolean {
  return element.closest('[data-xeg-gallery]') !== null;
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
 * CSS 선택자 유효성 검증
 */
export function isValidSelector(selector: string): boolean {
  try {
    document.querySelector(selector);
    return true;
  } catch {
    return false;
  }
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
