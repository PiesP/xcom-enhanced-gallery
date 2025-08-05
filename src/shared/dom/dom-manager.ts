/**
 * @fileoverview 통합 DOM 매니저
 * @description DOM 조작, 캐싱, 배치 처리를 하나로 통합한 관리자
 * @version 1.0.0 - TDD Phase 2-2: DOM Utilities Consolidation
 */

import { logger } from '@shared/logging/logger';
import { DOMCache } from './DOMCache';
import { DOMBatcher, type DOMUpdate } from '@shared/utils/dom/DOMBatcher';

/**
 * DOM 요소 생성 옵션
 */
export interface DOMElementCreationOptions {
  /** HTML 속성들 */
  attributes?: Record<string, string>;
  /** 텍스트 콘텐츠 */
  textContent?: string;
  /** CSS 클래스들 */
  classes?: string[];
  /** 스타일 속성들 */
  styles?: Record<string, string>;
}

/**
 * 통합 DOM 매니저
 *
 * 모든 DOM 관련 작업을 하나의 인터페이스로 통합:
 * - 요소 선택 (일반/캐시)
 * - 요소 생성/조작
 * - 배치 업데이트
 * - 성능 최적화
 */
export class DOMManager {
  private readonly domCache: DOMCache;
  private readonly domBatcher: DOMBatcher;

  constructor(
    options: {
      cacheOptions?: {
        defaultTTL?: number;
        maxCacheSize?: number;
        cleanupIntervalMs?: number;
      };
    } = {}
  ) {
    this.domCache = new DOMCache(options.cacheOptions);
    this.domBatcher = new DOMBatcher();
  }

  // ================================
  // 요소 선택 (일반)
  // ================================

  /**
   * 안전한 요소 선택
   */
  select<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T | null {
    try {
      return container.querySelector<T>(selector);
    } catch (error) {
      logger.warn(`[DOMManager] Invalid selector: ${selector}`, error);
      return null;
    }
  }

  /**
   * 안전한 모든 요소 선택
   */
  selectAll<T extends Element = Element>(selector: string, container: ParentNode = document): T[] {
    try {
      return Array.from(container.querySelectorAll<T>(selector));
    } catch (error) {
      logger.warn(`[DOMManager] Invalid selector: ${selector}`, error);
      return [];
    }
  }

  // ================================
  // 요소 선택 (캐시)
  // ================================

  /**
   * 캐시된 요소 선택
   */
  cachedSelect<T extends Element = Element>(
    selector: string,
    container: Document | Element = document,
    ttl?: number
  ): T | null {
    return this.domCache.querySelector(selector, container, ttl) as T | null;
  }

  /**
   * 캐시된 모든 요소 선택
   */
  cachedSelectAll<T extends Element = Element>(
    selector: string,
    container: Document | Element = document,
    ttl?: number
  ): T[] {
    const nodeList = this.domCache.querySelectorAll(selector, container, ttl);
    return Array.from(nodeList) as T[];
  }

  /**
   * 캐시 무효화
   */
  invalidateCache(selector: string, container?: Document | Element): void {
    this.domCache.invalidate(selector, container);
  }

  /**
   * 캐시 통계
   */
  getCacheStats() {
    return this.domCache.getStats();
  }

  // ================================
  // 요소 생성 및 조작
  // ================================

  /**
   * 안전한 요소 생성
   */
  create<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    options: DOMElementCreationOptions = {}
  ): HTMLElementTagNameMap[K] | null {
    try {
      const element = document.createElement(tagName);

      // 속성 설정
      if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }

      // 텍스트 콘텐츠 설정
      if (options.textContent) {
        element.textContent = options.textContent;
      }

      // CSS 클래스 추가
      if (options.classes) {
        element.classList.add(...options.classes);
      }

      // 스타일 설정
      if (options.styles) {
        Object.entries(options.styles).forEach(([property, value]) => {
          element.style.setProperty(property, value);
        });
      }

      return element;
    } catch (error) {
      logger.error(`[DOMManager] Failed to create element: ${tagName}`, error);
      return null;
    }
  }

  /**
   * 안전한 요소 제거
   */
  remove(element: Element | null): boolean {
    try {
      if (element?.parentNode) {
        element.parentNode.removeChild(element);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[DOMManager] Failed to remove element:', error);
      return false;
    }
  }

  /**
   * 요소 가시성 확인
   */
  isVisible(element: Element | null): boolean {
    if (!element) return false;

    try {
      const style = window.getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    } catch (error) {
      logger.warn('[DOMManager] Failed to check visibility:', error);
      return false;
    }
  }

  /**
   * 요소가 뷰포트 내에 있는지 확인
   */
  isInViewport(element: Element | null): boolean {
    if (!element) return false;

    try {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    } catch (error) {
      logger.warn('[DOMManager] Failed to check viewport:', error);
      return false;
    }
  }

  // ================================
  // 이벤트 관리
  // ================================

  /**
   * 안전한 이벤트 리스너 추가
   */
  addEventListener(
    element: Element | null,
    type: string,
    listener: EventListener,
    options?: AddEventListenerOptions
  ): boolean {
    try {
      if (element) {
        element.addEventListener(type, listener, options);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[DOMManager] Failed to add event listener:', error);
      return false;
    }
  }

  /**
   * 안전한 이벤트 리스너 제거
   */
  removeEventListener(
    element: Element | null,
    type: string,
    listener: EventListener,
    options?: EventListenerOptions
  ): boolean {
    try {
      if (element) {
        element.removeEventListener(type, listener, options);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('[DOMManager] Failed to remove event listener:', error);
      return false;
    }
  }

  // ================================
  // 배치 처리
  // ================================

  /**
   * 배치 업데이트 추가
   */
  batchAdd(update: DOMUpdate): void {
    this.domBatcher.add(update);
  }

  /**
   * 여러 배치 업데이트 추가
   */
  batchAddMany(updates: DOMUpdate[]): void {
    this.domBatcher.addMany(updates);
  }

  /**
   * 배치 업데이트 즉시 실행
   */
  batchFlush(): void {
    this.domBatcher.flush();
  }

  /**
   * 모든 대기 중인 업데이트 취소
   */
  batchClear(): void {
    this.domBatcher.clear();
  }

  // ================================
  // 유틸리티 메서드
  // ================================

  /**
   * Element 타입 가드
   */
  isElement(obj: unknown): obj is Element {
    return obj instanceof Element;
  }

  /**
   * HTMLElement 타입 가드
   */
  isHTMLElement(obj: unknown): obj is HTMLElement {
    return obj instanceof HTMLElement;
  }

  /**
   * 요소 존재 여부 확인
   */
  exists(selector: string, container: ParentNode = document): boolean {
    return this.select(selector, container) !== null;
  }

  // ================================
  // 리소스 정리
  // ================================

  /**
   * 모든 리소스 정리
   */
  dispose(): void {
    this.domCache.dispose();
    this.domBatcher.clear();
  }

  /**
   * 디버그 정보 반환
   */
  getDebugInfo(): Record<string, unknown> {
    return {
      cache: this.domCache.getStats(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      document: {
        readyState: document.readyState,
        URL: document.URL,
      },
      scroll: {
        x: window.scrollX,
        y: window.scrollY,
      },
    };
  }
}

// ================================
// 전역 인스턴스
// ================================

/**
 * 전역 통합 DOM 매니저 인스턴스
 */
export const globalDOMManager = new DOMManager({
  cacheOptions: {
    defaultTTL: 20000, // 20초
    maxCacheSize: 150,
    cleanupIntervalMs: 60000, // 1분
  },
});

// ================================
// 편의 함수들
// ================================

/**
 * 요소 선택 (캐시 없음)
 */
export function select<T extends Element = Element>(
  selector: string,
  container?: ParentNode
): T | null {
  return globalDOMManager.select<T>(selector, container);
}

/**
 * 모든 요소 선택 (캐시 없음)
 */
export function selectAll<T extends Element = Element>(
  selector: string,
  container?: ParentNode
): T[] {
  return globalDOMManager.selectAll<T>(selector, container);
}

/**
 * 캐시된 요소 선택
 */
export function cachedSelect<T extends Element = Element>(
  selector: string,
  container?: Document | Element,
  ttl?: number
): T | null {
  return globalDOMManager.cachedSelect<T>(selector, container, ttl);
}

/**
 * 캐시된 모든 요소 선택
 */
export function cachedSelectAll<T extends Element = Element>(
  selector: string,
  container?: Document | Element,
  ttl?: number
): T[] {
  return globalDOMManager.cachedSelectAll<T>(selector, container, ttl);
}

/**
 * 요소 생성
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  options?: DOMElementCreationOptions
): HTMLElementTagNameMap[K] | null {
  return globalDOMManager.create(tagName, options);
}

/**
 * 배치 업데이트
 */
export function batchUpdate(update: DOMUpdate): void {
  globalDOMManager.batchAdd(update);
}

/**
 * 여러 배치 업데이트
 */
export function batchUpdateMany(updates: DOMUpdate[]): void {
  globalDOMManager.batchAddMany(updates);
}

/**
 * 갤러리 내부 요소 확인 (특화 기능)
 */
const GALLERY_SELECTORS = [
  '[data-gallery-container]',
  '.gallery-container',
  '.xeg-gallery-container',
  '[data-gallery]',
  '.xeg-toolbar',
  '.xeg-button',
] as const;

export function isInsideGallery(element: Element | null): boolean {
  if (!element) return false;

  for (const selector of GALLERY_SELECTORS) {
    if (element.closest(selector)) {
      return true;
    }
  }

  return false;
}

// ================================
// 기본 export
// ================================

export default globalDOMManager;
