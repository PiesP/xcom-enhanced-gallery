/**
 * @fileoverview 통합 유틸리티 - Phase 4 최종 결과물
 * @version 4.0.0 - 완전 통합 버전
 *
 * 기존에 분산되어 있던 모든 공통 유틸리티들을 하나의 파일로 통합
 * - 성능 유틸리티 (debounce, throttle, RAF)
 * - 스타일 유틸리티 (클래스 조작, CSS 변수)
 * - 스크롤 유틸리티 (핸들링, 컨테이너 검색)
 * - 디버그 유틸리티 (갤러리 진단)
 * - 중복 제거 유틸리티
 */

import { logger } from '@shared/logging/logger';
import { galleryState } from '@shared/state/signals/gallery.signals';
import { safeParseInt } from '@shared/utils/core/type-safety-helpers';
import type { MediaInfo } from '@shared/types/media.types';

// ================================
// Performance Utilities
// ================================

/**
 * 디바운서 클래스 - 중복 실행 방지
 */
export class Debouncer<T extends unknown[] = unknown[]> {
  private timerId: number | null = null;
  private lastArgs: T | null = null;

  constructor(
    private readonly fn: (...args: T) => void,
    private readonly delay: number
  ) {}

  execute(...args: T): void {
    this.lastArgs = args;
    this.clearTimer();
    this.timerId = window.setTimeout(() => {
      if (this.lastArgs) {
        this.fn(...this.lastArgs);
        this.lastArgs = null;
      }
    }, this.delay);
  }

  flush(): void {
    if (this.lastArgs) {
      this.clearTimer();
      this.fn(...this.lastArgs);
      this.lastArgs = null;
    }
  }

  cancel(): void {
    this.clearTimer();
    this.lastArgs = null;
  }

  isPending(): boolean {
    return this.timerId !== null;
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

/**
 * 디바운서 팩토리 함수
 */
export function createDebouncer<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): Debouncer<T> {
  return new Debouncer(fn, delay);
}

/**
 * RAF 기반 throttle (성능 최적화)
 */
export function rafThrottle<T extends (...args: unknown[]) => void>(
  fn: T,
  options: { leading?: boolean; trailing?: boolean } = {}
): T {
  const { leading = true, trailing = true } = options;
  let isThrottled = false;
  let pendingArgs: Parameters<T> | null = null;

  function throttled(...args: Parameters<T>): void {
    pendingArgs = args;

    if (!isThrottled) {
      if (leading) {
        try {
          fn(...args);
        } catch (error) {
          logger.warn('RAF throttle function error:', error);
        }
      }

      isThrottled = true;
      requestAnimationFrame(() => {
        isThrottled = false;
        if (trailing && pendingArgs) {
          try {
            fn(...pendingArgs);
          } catch (error) {
            logger.warn('RAF throttle trailing function error:', error);
          }
        }
        pendingArgs = null;
      });
    }
  }

  return throttled as T;
}

/**
 * 스크롤 전용 throttle
 */
export function throttleScroll<T extends (...args: unknown[]) => void>(func: T): T {
  return rafThrottle(func, { leading: true, trailing: true });
}

/**
 * 성능 측정 유틸리티
 */
export function measurePerformance<T>(label: string, fn: () => T): { result: T; duration: number } {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (duration > 10) {
    logger.debug(`Performance: ${label} took ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

/**
 * 비동기 성능 측정
 */
export async function measureAsyncPerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (duration > 10) {
    logger.debug(`Async Performance: ${label} took ${duration.toFixed(2)}ms`);
  }

  return { result, duration };
}

// ================================
// Style Utilities
// ================================

/**
 * 클래스명 결합 유틸리티
 */
export function combineClasses(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 클래스 토글 유틸리티
 */
export function toggleClass(element: HTMLElement, className: string, condition?: boolean): void {
  element.classList.toggle(className, condition);
}

/**
 * CSS 변수 설정
 */
export function setCSSVariable(element: HTMLElement, variable: string, value: string): void {
  const varName = variable.startsWith('--') ? variable : `--${variable}`;
  element.style.setProperty(varName, value);
}

/**
 * CSS 변수 일괄 설정
 */
export function setCSSVariables(element: HTMLElement, variables: Record<string, string>): void {
  Object.entries(variables).forEach(([variable, value]) => {
    setCSSVariable(element, variable, value);
  });
}

/**
 * 컴포넌트 상태 업데이트
 */
export function updateComponentState(
  element: HTMLElement,
  baseClass: string,
  states: Record<string, boolean>
): void {
  Object.entries(states).forEach(([state, active]) => {
    const stateClass = `${baseClass}--${state}`;
    toggleClass(element, stateClass, active);
  });
}

/**
 * 테마 클래스명 생성
 */
export function createThemedClassName(baseClass: string, theme: string = 'auto'): string {
  return `${baseClass} ${baseClass}--theme-${theme}`;
}

// ================================
// Scroll Utilities
// ================================

/**
 * 스크롤 핸들러 생성
 */
export function createScrollHandler(
  element: HTMLElement,
  callback: (deltaY: number, event: WheelEvent) => void,
  options: {
    threshold?: number;
    captureOnDocument?: boolean;
  } = {}
): () => void {
  const { threshold = 0, captureOnDocument = false } = options;

  const wheelHandler = (event: Event) => {
    const wheelEvent = event as WheelEvent;
    if (Math.abs(wheelEvent.deltaY) > threshold) {
      try {
        callback(wheelEvent.deltaY, wheelEvent);
      } catch (error) {
        logger.error('Scroll handler execution failed', error);
      }
    }
  };

  const targetElement = captureOnDocument ? document : element;

  try {
    targetElement.addEventListener('wheel', wheelHandler, { passive: false });
    logger.debug('Wheel event listener registered', {
      target: captureOnDocument ? 'document' : 'element',
      threshold,
    });

    return () => {
      try {
        targetElement.removeEventListener('wheel', wheelHandler);
        logger.debug('Wheel event listener removed');
      } catch (error) {
        logger.warn('Event listener removal failed', error);
      }
    };
  } catch (error) {
    logger.error('Event listener registration failed', error);
    return () => {}; // noop cleanup function
  }
}

/**
 * Twitter 스크롤 컨테이너 찾기
 */
export function findTwitterScrollContainer(): HTMLElement | null {
  const selectors = [
    '[data-testid="primaryColumn"]',
    'main[role="main"]',
    '.css-1dbjc4n[data-at-shortcutkeys]',
    'body',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      logger.debug('Twitter scroll container found:', selector);
      return element;
    }
  }

  logger.warn('No Twitter scroll container found, using body');
  return document.body;
}

/**
 * 갤러리 요소인지 확인
 */
export function isGalleryElement(element: HTMLElement | null): boolean {
  if (!element) {
    return false;
  }

  const gallerySelectors = [
    '.xeg-gallery-container',
    '[data-xeg-gallery]',
    '[data-xeg-role]',
    '.xeg-media-viewer',
    '.xeg-items-list',
  ];

  return gallerySelectors.some(selector => element.matches(selector) || element.closest(selector));
}

/**
 * 스크롤 디바운서 생성 (간편 함수)
 */
export function createScrollDebouncer(callback: () => void, delay: number = 150): Debouncer<[]> {
  return createDebouncer(callback, delay);
}

/**
 * 갤러리 스크롤 보장 함수 (단순화)
 */
export function ensureGalleryScrollAvailable(element: HTMLElement | null): void {
  if (!element) {
    return;
  }

  // 스크롤 가능한 요소들을 찾고 기본 스크롤 활성화
  const scrollableElements = element.querySelectorAll(
    '[data-xeg-role="items-list"], .itemsList, .content'
  ) as NodeListOf<HTMLElement>;

  scrollableElements.forEach(el => {
    if (el.style.overflowY !== 'auto' && el.style.overflowY !== 'scroll') {
      el.style.overflowY = 'auto';
    }
  });
}

/**
 * 스크롤 전파 방지
 */
export function preventScrollPropagation(
  element: HTMLElement,
  options: { disableBodyScroll?: boolean } = {}
): () => void {
  const { disableBodyScroll = false } = options;

  const handleWheel = (e: Event) => {
    e.stopPropagation();
    if (disableBodyScroll) {
      e.preventDefault();
    }
  };

  element.addEventListener('wheel', handleWheel, { passive: false });

  return () => {
    element.removeEventListener('wheel', handleWheel);
  };
}

// ================================
// Deduplication Utilities
// ================================

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
      logger.warn('Skipping item without key');
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

  // 성능 최적화를 위해 실제로 제거된 경우만 로깅
  const removedCount = mediaItems.length - result.length;
  if (removedCount > 0) {
    logger.debug('Removed duplicate media items:', {
      original: mediaItems.length,
      unique: result.length,
      removed: removedCount,
    });
  }

  return result;
}

// ================================
// Debug Utilities
// ================================

/**
 * 갤러리 디버깅 유틸리티 (단순화된 버전)
 */
export const galleryDebugUtils = {
  /**
   * 갤러리 컨테이너 상태 진단
   */
  diagnoseContainer(): void {
    const container = document.querySelector('.xeg-gallery-container');

    if (!container) {
      logger.info('❌ Gallery container not found');
      return;
    }

    const style = window.getComputedStyle(container);
    const rect = container.getBoundingClientRect();

    const diagnosis = {
      visible: style.display !== 'none' && style.visibility !== 'hidden',
      dimensions: `${rect.width}x${rect.height}`,
      position: `${rect.top}, ${rect.left}`,
      children: container.children.length,
      inViewport: rect.width > 0 && rect.height > 0,
    };

    logger.info('🔍 Gallery container status:', diagnosis);
  },

  /**
   * 갤러리 강제 표시 (단순화)
   */
  forceShow(): void {
    const container = document.querySelector('.xeg-gallery-container') as HTMLElement;

    if (!container) {
      logger.warn('Cannot force show: container not found');
      return;
    }

    // 기본적인 스타일 강제 적용
    container.style.display = 'block';
    container.style.visibility = 'visible';
    container.style.opacity = '1';

    logger.info('✅ Gallery forced to show');
  },
};

// ================================
// Gallery Utils (from gallery-utils.ts)
// ================================

/**
 * 갤러리 통합 유틸리티 클래스
 *
 * 이전의 GalleryStateGuard와 VideoControlBlocker를 통합하여
 * 갤러리 관련 모든 상태 확인과 이벤트 제어를 단일 지점에서 처리합니다.
 */
export class GalleryUtils {
  // 갤러리 요소 선택자들
  private static readonly GALLERY_SELECTORS = [
    '.xeg-gallery-container',
    '[data-gallery-element]',
    '#xeg-gallery-root',
    '.vertical-gallery-view',
    '[data-xeg-gallery-container]',
    '[data-xeg-gallery]',
    '.xeg-vertical-gallery',
    '[data-xeg-role="gallery"]',
    '.toolbar',
    '.toolbarButton',
    '.fitButton',
    '.xeg-toolbar',
    '.xeg-button',
    '.gallery-controls',
    '.gallery-toolbar',
    '.gallery-header',
    '.gallery-footer',
    '.gallery-content',
    '.gallery-item',
    '.media-viewer',
    '.xeg-toast-container',
    '.xeg-toast',
    '.toast-container',
    '.notification',
  ];

  // 비디오 제어 요소 선택자들 (구체적인 제어 요소만 차단)
  private static readonly VIDEO_CONTROL_SELECTORS = [
    // 플레이 버튼 (가장 구체적)
    '[data-testid="playButton"]',
    'button[aria-label*="재생"]',
    'button[aria-label*="Play"]',
    'button[aria-label*="일시정지"]',
    'button[aria-label*="Pause"]',
    'button[aria-label*="다시보기"]',
    'button[aria-label*="Replay"]',

    // 비디오 컨트롤 UI (구체적인 컨트롤만)
    '.video-controls button',
    '.player-controls button',
    '[role="slider"]', // 진행 바
    'video::-webkit-media-controls-play-button',
    'video::-webkit-media-controls-fullscreen-button',

    // 갤러리 내 컨트롤 (더 구체적으로)
    '.xeg-gallery-container .video-controls',
    '.xeg-gallery-container button[aria-label*="Play"]',
    '.xeg-gallery-container button[aria-label*="Pause"]',
    '[data-gallery-element] .video-controls',

    // 트위터 비디오 관련 (구체적인 컨트롤 요소만)
    '[data-testid="videoPlayer"] button',
    '[data-testid="videoComponent"] button',
    '.tweet-video-control button',
  ];

  /**
   * 갤러리 트리거 가능 여부 확인 (통합 메인 함수)
   * @param event 클릭 이벤트 (선택사항)
   * @returns 갤러리 트리거 가능 여부
   */
  static canTriggerGallery(event?: MouseEvent): boolean {
    try {
      // 1. 기본 갤러리 열림 상태 체크
      if (galleryState.value.isOpen) {
        logger.debug('GalleryUtils: Gallery already open, blocking trigger');
        return false;
      }

      // 2. 이벤트 유효성 체크
      if (event) {
        // 마우스 좌클릭만 허용
        if (event.button !== 0) {
          logger.debug('GalleryUtils: Non-left click, blocking trigger');
          return false;
        }

        const target = event.target as HTMLElement;

        // 3. 비디오 제어 요소 차단
        if (this.shouldBlockGalleryTrigger(target, event)) {
          logger.debug('GalleryUtils: Video control element, blocking trigger');
          return false;
        }

        // 4. 갤러리 내부 요소 체크
        if (this.isGalleryInternalElement(target)) {
          logger.debug('GalleryUtils: Gallery internal element, blocking trigger');
          return false;
        }
      }

      // 5. 모든 체크 통과
      logger.debug('GalleryUtils: All checks passed, allowing gallery trigger');
      return true;
    } catch (error) {
      logger.error('GalleryUtils: Error in canTriggerGallery:', error);
      return false; // 에러 시 안전하게 차단
    }
  }

  /**
   * 비디오 제어 요소 여부 확인 및 갤러리 트리거 차단 필요성 체크
   * @param element 확인할 요소
   * @param event 클릭 이벤트 (선택사항)
   * @returns 갤러리 트리거를 차단해야 하는지 여부
   */
  static shouldBlockGalleryTrigger(element: HTMLElement, _event?: MouseEvent): boolean {
    try {
      // null 체크
      if (!element) {
        logger.debug('VideoControlBlocker: No element provided');
        return false;
      }

      // 1. 비디오 제어 요소 직접 체크
      if (this.isVideoControlElement(element)) {
        logger.debug('VideoControlBlocker: Direct video control element detected');
        return true;
      }

      // 2. 부모 요소들 중 비디오 제어 요소 체크 (최대 5단계)
      let current = element.parentElement;
      let depth = 0;
      const maxDepth = 5;

      while (current && depth < maxDepth) {
        if (this.isVideoControlElement(current)) {
          logger.debug(
            `VideoControlBlocker: Parent video control element detected at depth ${depth}`
          );
          return true;
        }
        current = current.parentElement;
        depth++;
      }

      // 3. 갤러리가 열린 상태에서는 모든 갤러리 내부 요소 차단
      if (!this.canTriggerGallery() || this.isGalleryInternalElement(element)) {
        logger.debug('VideoControlBlocker: Gallery internal interaction, blocking');
        return true;
      }

      // 4. 모든 체크 통과 - 차단하지 않음
      return false;
    } catch (error) {
      logger.error('VideoControlBlocker: Error in shouldBlockGalleryTrigger:', error);
      return true; // 에러 시 안전하게 차단
    }
  }

  /**
   * 비디오 제어 요소인지 확인
   * @param element 확인할 요소
   * @returns 비디오 제어 요소 여부
   */
  static isVideoControlElement(element: HTMLElement): boolean {
    if (!element) return false;

    try {
      // 1. 선택자 기반 체크
      const isVideoControl = this.VIDEO_CONTROL_SELECTORS.some(selector => {
        try {
          return element.matches(selector);
        } catch {
          return false;
        }
      });

      if (isVideoControl) {
        logger.debug(`VideoControlBlocker: Video control element detected: ${element.tagName}`);
        return true;
      }

      // 2. 역할 기반 체크
      const role = element.getAttribute('role');
      if (role === 'slider' || role === 'button') {
        const ariaLabel = element.getAttribute('aria-label') || '';
        const isPlayControl = /재생|play|일시정지|pause|다시보기|replay/i.test(ariaLabel);
        if (isPlayControl) {
          logger.debug('VideoControlBlocker: Play control detected via aria-label');
          return true;
        }
      }

      // 3. 비디오 요소 직접 체크
      if (element.tagName === 'VIDEO') {
        logger.debug('VideoControlBlocker: Direct video element');
        return true;
      }

      return false;
    } catch (error) {
      logger.error('VideoControlBlocker: Error checking video control element:', error);
      return false;
    }
  }

  /**
   * 갤러리 내부 요소인지 확인
   * @param element 확인할 요소
   * @returns 갤러리 내부 요소 여부
   */
  static isGalleryInternalElement(element: HTMLElement): boolean {
    if (!element) return false;

    try {
      // 1. 자기 자신이 갤러리 요소인지 체크
      const isGalleryElement = this.GALLERY_SELECTORS.some(selector => {
        try {
          return element.matches(selector);
        } catch {
          return false;
        }
      });

      if (isGalleryElement) {
        return true;
      }

      // 2. 부모 요소 중 갤러리 컨테이너 체크
      return this.isGalleryContainer(element);
    } catch (error) {
      logger.error('GalleryUtils: Error checking gallery internal element:', error);
      return false;
    }
  }

  /**
   * 갤러리 컨테이너 내부에 있는지 확인
   * @param element 확인할 요소
   * @returns 갤러리 컨테이너 내부 여부
   */
  static isGalleryContainer(element: HTMLElement): boolean {
    if (!element) return false;

    try {
      let current: HTMLElement | null = element;
      const maxDepth = 10; // 무한 루프 방지
      let depth = 0;

      while (current && depth < maxDepth) {
        const isContainer = this.GALLERY_SELECTORS.some(selector => {
          try {
            return current!.matches(selector);
          } catch {
            return false;
          }
        });

        if (isContainer) {
          return true;
        }

        current = current.parentElement;
        depth++;
      }

      return false;
    } catch (error) {
      logger.error('GalleryUtils: Error checking gallery container:', error);
      return false;
    }
  }

  /**
   * 갤러리 내부 이벤트인지 확인
   * @param event 확인할 이벤트
   * @returns 갤러리 내부 이벤트 여부
   */
  static isGalleryInternalEvent(event: Event): boolean {
    if (!event?.target) return false;

    try {
      const target = event.target as HTMLElement;
      return this.isGalleryInternalElement(target);
    } catch (error) {
      logger.error('GalleryUtils: Error checking gallery internal event:', error);
      return false;
    }
  }

  /**
   * 갤러리 이벤트를 차단해야 하는지 확인
   * @param event 확인할 이벤트
   * @returns 이벤트 차단 필요 여부
   */
  static shouldBlockGalleryEvent(event: Event): boolean {
    if (!event) return false;

    try {
      // 갤러리가 열려있거나 갤러리 내부 이벤트인 경우 차단
      return galleryState.value.isOpen || this.isGalleryInternalEvent(event);
    } catch (error) {
      logger.error('GalleryUtils: Error checking if should block gallery event:', error);
      return true; // 에러 시 안전하게 차단
    }
  }
}

// 하위 호환성을 위한 별칭들
export const GalleryStateGuard = GalleryUtils;
export const VideoControlBlocker = {
  shouldBlockGalleryTrigger: GalleryUtils.shouldBlockGalleryTrigger.bind(GalleryUtils),
};

// 편의 함수들
export const {
  canTriggerGallery,
  shouldBlockGalleryTrigger,
  isGalleryInternalElement,
  isGalleryContainer,
  isVideoControlElement,
  isGalleryInternalEvent,
  shouldBlockGalleryEvent,
} = GalleryUtils;

// ================================
// Core Utils (from core-utils.ts)
// ================================

// 접근성 유틸리티 (WCAG 2.1 기준)

/**
 * RGB 색상을 상대 휘도(relative luminance)로 변환합니다.
 * WCAG 2.1 기준에 따라 계산됩니다.
 *
 * @param r - 빨강 채널 값 (0-255)
 * @param g - 초록 채널 값 (0-255)
 * @param b - 파랑 채널 값 (0-255)
 * @returns 상대 휘도 값 (0-1)
 *
 * @example
 * ```typescript
 * const luminance = getRelativeLuminance(255, 255, 255); // 1 (흰색)
 * const darkLuminance = getRelativeLuminance(0, 0, 0);   // 0 (검정색)
 * ```
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rNorm, gNorm, bNorm] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * (rNorm ?? 0) + 0.7152 * (gNorm ?? 0) + 0.0722 * (bNorm ?? 0);
}

/**
 * CSS 색상 문자열에서 RGB 값을 추출합니다.
 *
 * @param color - CSS 색상 문자열 (rgb, rgba, hex 형식 지원)
 * @returns RGB 값 배열 [r, g, b] 또는 null (파싱 실패 시)
 *
 * @example
 * ```typescript
 * const rgb1 = parseColor('rgb(255, 0, 0)');        // [255, 0, 0]
 * const rgb2 = parseColor('rgba(0, 255, 0, 0.5)');  // [0, 255, 0]
 * const rgb3 = parseColor('#0000ff');               // [0, 0, 255]
 * ```
 */
export function parseColor(color: string): [number, number, number] | null {
  // RGB/RGBA 형식
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [
      safeParseInt(rgbMatch[1], 10),
      safeParseInt(rgbMatch[2], 10),
      safeParseInt(rgbMatch[3], 10),
    ];
  }

  // HEX 형식
  const hexMatch = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return [
      safeParseInt(hexMatch[1], 16),
      safeParseInt(hexMatch[2], 16),
      safeParseInt(hexMatch[3], 16),
    ];
  }

  // 3자리 HEX 형식
  const shortHexMatch = color.match(/^#([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    return [
      safeParseInt((shortHexMatch[1] ?? '') + (shortHexMatch[1] ?? ''), 16),
      safeParseInt((shortHexMatch[2] ?? '') + (shortHexMatch[2] ?? ''), 16),
      safeParseInt((shortHexMatch[3] ?? '') + (shortHexMatch[3] ?? ''), 16),
    ];
  }

  // 기본 색상명
  const namedColors: Record<string, [number, number, number]> = {
    white: [255, 255, 255],
    black: [0, 0, 0],
    red: [255, 0, 0],
    green: [0, 128, 0],
    blue: [0, 0, 255],
    transparent: [255, 255, 255], // 투명은 흰색으로 처리
  };

  const lowerColor = color.toLowerCase();
  return namedColors[lowerColor] || null;
}

/**
 * 두 색상 간의 대비 비율을 계산합니다.
 * WCAG 2.1 기준을 따릅니다.
 *
 * @param foreground - 전경색 (CSS 색상 문자열)
 * @param background - 배경색 (CSS 색상 문자열)
 * @returns 대비 비율 (1:1 ~ 21:1)
 *
 * @example
 * ```typescript
 * const ratio1 = calculateContrastRatio('black', 'white');     // 21
 * const ratio2 = calculateContrastRatio('#000000', '#ffffff'); // 21
 * const ratio3 = calculateContrastRatio('rgb(0,0,0)', 'rgb(255,255,255)'); // 21
 * ```
 */
export function calculateContrastRatio(foreground: string, background: string): number {
  const fgRgb = parseColor(foreground);
  const bgRgb = parseColor(background);

  if (!fgRgb || !bgRgb) {
    return 1; // 파싱 실패 시 최소 대비
  }

  const fgLuminance = getRelativeLuminance(fgRgb[0], fgRgb[1], fgRgb[2]);
  const bgLuminance = getRelativeLuminance(bgRgb[0], bgRgb[1], bgRgb[2]);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * WCAG AA 기준 (4.5:1)을 만족하는지 확인합니다.
 *
 * @param foreground - 전경색
 * @param background - 배경색
 * @returns WCAG AA 기준 만족 여부
 *
 * @example
 * ```typescript
 * const isAccessible = meetsWCAGAA('black', 'white'); // true
 * const isNotAccessible = meetsWCAGAA('#ccc', 'white'); // false
 * ```
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return calculateContrastRatio(foreground, background) >= 4.5;
}

/**
 * WCAG AAA 기준 (7:1)을 만족하는지 확인합니다.
 *
 * @param foreground - 전경색
 * @param background - 배경색
 * @returns WCAG AAA 기준 만족 여부
 *
 * @example
 * ```typescript
 * const isAAA = meetsWCAGAAA('black', 'white'); // true
 * const isNotAAA = meetsWCAGAAA('#666', 'white'); // false
 * ```
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  return calculateContrastRatio(foreground, background) >= 7;
}

/**
 * 주어진 요소의 실제 배경색을 감지합니다.
 * 투명한 배경의 경우 부모 요소까지 검사합니다.
 *
 * @param element - 검사할 DOM 요소
 * @returns 실제 배경색 (CSS 색상 문자열)
 *
 * @example
 * ```typescript
 * const bgColor = detectActualBackgroundColor(document.querySelector('.toolbar'));
 * const ratio = calculateContrastRatio('white', bgColor);
 * ```
 */
export function detectActualBackgroundColor(element: Element): string {
  let currentElement: Element | null = element;

  while (currentElement) {
    const computedStyle = window.getComputedStyle(currentElement);
    const backgroundColor = computedStyle.backgroundColor;

    // 투명하지 않은 배경색을 찾으면 반환
    if (
      backgroundColor &&
      backgroundColor !== 'transparent' &&
      backgroundColor !== 'rgba(0, 0, 0, 0)'
    ) {
      return backgroundColor;
    }

    currentElement = currentElement.parentElement;
  }

  // 모든 부모가 투명하면 기본 배경색 반환
  return 'white';
}

/**
 * 요소 뒤의 배경이 밝은지 어두운지 감지합니다.
 * 툴바나 오버레이의 동적 대비 조정에 사용됩니다.
 *
 * @param element - 검사할 DOM 요소
 * @returns 배경이 밝으면 true, 어두우면 false
 *
 * @example
 * ```typescript
 * const toolbar = document.querySelector('.toolbar');
 * const needsHighContrast = detectLightBackground(toolbar);
 * toolbar.classList.toggle('high-contrast', needsHighContrast);
 * ```
 */
export function detectLightBackground(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // 요소 뒤의 요소들 확인
  const elementsBelow = document.elementsFromPoint(centerX, centerY);

  for (const el of elementsBelow) {
    if (el === element) {
      continue; // 자기 자신은 건너뛰기
    }

    const bgColor = detectActualBackgroundColor(el);
    const rgb = parseColor(bgColor);

    if (rgb) {
      const luminance = getRelativeLuminance(rgb[0], rgb[1], rgb[2]);
      // 휘도가 0.5 이상이면 밝은 배경으로 판단
      if (luminance > 0.5) {
        return true;
      }
    }
  }

  return false;
}

// 타입 안전성 헬퍼 함수들 (re-export)
export {
  safeParseInt,
  safeParseFloat,
  safeArrayGet,
  safeNodeListAccess,
  safeMatchExtract,
  safeCall,
  safeEventHandler,
  undefinedToNull,
  nullToUndefined,
  stringWithDefault,
  safeElementCheck,
  safeProp,
  safeTweetId,
  safeUsername,
  safeClickedIndex,
  assignOptionalProperty,
  conditionalAssign,
  mergeWithoutUndefined,
  createWithOptionalProperties,
  buildSafeObject,
  removeUndefinedProperties,
} from '@shared/utils/core/type-safety-helpers';

// 에러 처리 (위임)
export { safeAsync, safeSync, handleError } from '@shared/error/ErrorHandler';

/**
 * 안전한 비동기 작업 결과 인터페이스
 */
export interface SafeOperationResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

// ================================
// Unified Export Object
// ================================

/**
 * 모든 유틸리티를 포함하는 통합 객체
 */
export const unifiedUtils = {
  // Performance
  createDebouncer,
  rafThrottle,
  throttleScroll,
  measurePerformance,
  measureAsyncPerformance,

  // Style
  combineClasses,
  toggleClass,
  setCSSVariable,
  setCSSVariables,
  updateComponentState,
  createThemedClassName,

  // Scroll
  createScrollHandler,
  findTwitterScrollContainer,
  isGalleryElement,
  createScrollDebouncer,
  ensureGalleryScrollAvailable,
  preventScrollPropagation,

  // Deduplication
  removeDuplicates,
  removeDuplicateStrings,
  removeDuplicateMediaItems,

  // Debug
  galleryDebugUtils,

  // Gallery Utils
  GalleryUtils,
  GalleryStateGuard,
  VideoControlBlocker,
  canTriggerGallery,
  shouldBlockGalleryTrigger,
  isGalleryInternalElement,
  isGalleryContainer,
  isVideoControlElement,
  isGalleryInternalEvent,
  shouldBlockGalleryEvent,

  // Core Utils - Accessibility
  getRelativeLuminance,
  parseColor,
  calculateContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  detectActualBackgroundColor,
  detectLightBackground,
} as const;
