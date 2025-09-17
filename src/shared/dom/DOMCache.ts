/**
 * @fileoverview DOM 캐싱 유틸리티
 * @description 반복적인 DOM 쿼리 최적화를 위한 캐싱 시스템
 */

import { logger } from '@shared/logging/logger';
import { globalTimerManager } from '@shared/utils/timer-management';

/**
 * DOM 캐시 엔트리 타입
 */
interface DOMCacheEntry {
  element: Element | null;
  timestamp: number;
  selector: string;
  ttl?: number; // Time to live in milliseconds
}

/**
 * DOM 쿼리 결과 캐시 매니저
 *
 * 주요 기능:
 * - 선택자별 DOM 요소 캐싱
 * - TTL(Time to Live) 기반 자동 만료
 * - 메모리 사용량 제한
 * - 성능 메트릭 수집
 */
export class DOMCache {
  private readonly cache = new Map<string, DOMCacheEntry>();
  private readonly hitCount = new Map<string, number>();
  private defaultTTL: number;
  private readonly maxCacheSize: number;
  private cleanupInterval: number | null = null;

  constructor(
    options: {
      defaultTTL?: number;
      maxCacheSize?: number;
      cleanupIntervalMs?: number;
    } = {}
  ) {
    this.defaultTTL = options.defaultTTL ?? 20000; // 20초로 증가 (더 긴 캐시 유지)
    this.maxCacheSize = options.maxCacheSize ?? 300; // 더 큰 캐시 크기 (300개)

    // 주기적 정리 스케줄링 (성능 최적화: 적응형 정리)
    // 테스트 모드에서는 타이머 잔여를 방지하기 위해 interval을 생성하지 않는다
    if (options.cleanupIntervalMs !== 0 && import.meta.env.MODE !== 'test') {
      this.cleanupInterval = globalTimerManager.setInterval(
        () => this.adaptiveCleanup(),
        options.cleanupIntervalMs ?? 45000 // 45초마다 정리 (빈도 감소)
      );
    }
  }

  /**
   * 기본 TTL 업데이트 (런타임 설정 반영)
   */
  setDefaultTTL(ttl: number): void {
    if (typeof ttl === 'number' && Number.isFinite(ttl) && ttl > 0) {
      this.defaultTTL = ttl;
      logger.debug(`DOMCache: default TTL updated to ${ttl}ms`);
    } else {
      logger.warn('DOMCache: invalid TTL provided, ignoring', { ttl });
    }
  }

  /**
   * 캐시된 DOM 요소 조회
   *
   * @param selector CSS 선택자
   * @param container 검색 범위 (기본: document)
   * @param ttl 커스텀 TTL (기본: defaultTTL)
   * @returns 캐시된 또는 새로 조회된 요소
   */
  querySelector(
    selector: string,
    container: Document | Element = document,
    ttl?: number
  ): Element | null {
    const cacheKey = this.getCacheKey(selector, container);
    const now = Date.now();

    // 캐시 조회
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValid(cached, now)) {
      this.incrementHitCount(cacheKey);
      return cached.element;
    }

    // 캐시 미스 - 새로 조회
    const element = container.querySelector(selector);

    // 캐시 저장
    this.cache.set(cacheKey, {
      element,
      timestamp: now,
      selector,
      ttl: ttl ?? this.defaultTTL,
    });

    // 캐시 크기 제한
    this.enforceMaxSize();

    return element;
  }

  /**
   * 캐시된 DOM 요소 목록 조회
   *
   * @param selector CSS 선택자
   * @param container 검색 범위 (기본: document)
   * @param ttl 커스텀 TTL
   * @returns 캐시된 또는 새로 조회된 요소 목록
   */
  querySelectorAll(
    selector: string,
    container: Document | Element = document,
    ttl?: number
  ): NodeListOf<Element> {
    // 컨테이너 null 체크
    if (!container) {
      const emptyList = document.createElement('div').querySelectorAll(selector);
      return emptyList;
    }

    // 컨테이너가 querySelectorAll 메서드를 가지고 있는지 확인
    if (typeof container.querySelectorAll !== 'function') {
      const emptyList = document.createElement('div').querySelectorAll(selector);
      return emptyList;
    }

    const cacheKey = this.getCacheKey(`${selector}:all`, container);
    const now = Date.now();

    // 캐시 조회
    const cached = this.cache.get(cacheKey);
    if (cached && this.isValid(cached, now)) {
      this.incrementHitCount(cacheKey);
      return cached.element as unknown as NodeListOf<Element>;
    }

    // 캐시 미스 - 새로 조회
    const elements = container.querySelectorAll(selector);

    // 캐시 저장
    this.cache.set(cacheKey, {
      element: elements as unknown as Element, // NodeListOf를 Element로 안전하게 캐스팅
      timestamp: now,
      selector,
      ttl: ttl ?? this.defaultTTL,
    });

    this.enforceMaxSize();

    return elements;
  }

  /**
   * 특정 선택자의 캐시 무효화
   *
   * @param selector CSS 선택자 (전체 무효화: '*')
   * @param container 특정 컨테이너 (선택사항)
   */
  invalidate(selector: string, container?: Document | Element): void {
    if (selector === '*') {
      this.cache.clear();
      this.hitCount.clear();
      return;
    }

    if (container) {
      const cacheKey = this.getCacheKey(selector, container);
      this.cache.delete(cacheKey);
      this.hitCount.delete(cacheKey);
    } else {
      // 선택자와 매치되는 모든 캐시 엔트리 삭제
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(selector));

      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.hitCount.delete(key);
      });
    }
  }

  /**
   * 캐시 통계 조회
   */
  getStats(): {
    cacheSize: number;
    maxCacheSize: number;
    hitCounts: Record<string, number>;
    totalHits: number;
    hitRate: number;
  } {
    const totalHits = Array.from(this.hitCount.values()).reduce((sum, count) => sum + count, 0);
    const totalQueries = this.cache.size + totalHits;

    return {
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize,
      hitCounts: Object.fromEntries(this.hitCount),
      totalHits,
      hitRate: totalQueries > 0 ? totalHits / totalQueries : 0,
    };
  }

  /**
   * 리소스 정리
   */
  dispose(): void {
    if (this.cleanupInterval !== null) {
      globalTimerManager.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.cache.clear();
    this.hitCount.clear();
  }

  // Private methods

  private getCacheKey(selector: string, container: Document | Element): string {
    // 컨테이너가 null/undefined인 경우 안전 처리
    if (!container) {
      throw new Error('Container is null or undefined');
    }

    // 컨테이너 식별자 생성
    const containerId =
      container === document
        ? 'document'
        : (container as Element).id ||
          (container as Element).className ||
          (container as Element).tagName ||
          'anonymous';

    return `${containerId}::${selector}`;
  }

  private isValid(entry: DOMCacheEntry, now: number): boolean {
    const ttl = entry.ttl ?? this.defaultTTL;
    return now - entry.timestamp < ttl;
  }

  private incrementHitCount(cacheKey: string): void {
    const currentCount = this.hitCount.get(cacheKey) ?? 0;
    this.hitCount.set(cacheKey, currentCount + 1);
  }

  private enforceMaxSize(): void {
    if (this.cache.size <= this.maxCacheSize) {
      return;
    }

    // LRU 방식으로 오래된 엔트리 제거
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    const toRemove = entries.slice(0, this.cache.size - this.maxCacheSize);
    toRemove.forEach(([key]) => {
      this.cache.delete(key);
      this.hitCount.delete(key);
    });
  }

  /**
   * 적응형 정리 - 시스템 상태에 따라 정리 강도 조절
   */
  private adaptiveCleanup(): void {
    const now = Date.now();
    const cacheSize = this.cache.size;

    // 페이지가 숨겨진 상태면 적극적 정리
    const isPageHidden = document.hidden;

    // 캐시 사용률에 따른 정리 전략
    const usageRatio = cacheSize / this.maxCacheSize;

    let cleanupRatio = 0.1; // 기본 10% 정리

    if (isPageHidden) {
      cleanupRatio = 0.3; // 페이지 숨김 시 30% 정리
    } else if (usageRatio > 0.8) {
      cleanupRatio = 0.2; // 80% 이상 사용 시 20% 정리
    }

    const entriesToClean = Math.floor(cacheSize * cleanupRatio);

    // 오래된 엔트리부터 정리
    const sortedEntries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    let cleanedCount = 0;
    for (const [key, entry] of sortedEntries) {
      if (cleanedCount >= entriesToClean) break;

      if (!this.isValid(entry, now) || cleanedCount < entriesToClean) {
        this.cache.delete(key);
        this.hitCount.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`DOMCache: Adaptive cleanup removed ${cleanedCount} entries`);
    }

    // 추가 정리 수행
    this.cleanup();
  }

  private cleanup(): void {
    const now = Date.now();

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (!this.isValid(entry, now)) {
        this.cache.delete(key);
        this.hitCount.delete(key);
      }
    });
  }
}

/**
 * 전역 DOM 캐시 인스턴스
 * 애플리케이션 전반에서 사용할 수 있는 공유 캐시 (성능 최적화)
 */
export const globalDOMCache = new DOMCache({
  defaultTTL: 20000, // 20초 - 더 긴 TTL
  maxCacheSize: 150, // 더 큰 캐시 크기
  cleanupIntervalMs: 60000, // 1분마다 정리 (덜 빈번한 정리)
});

/**
 * 캐시가 적용된 querySelector 헬퍼
 *
 * @param selector CSS 선택자
 * @param container 검색 범위
 * @param ttl 캐시 유효 시간
 * @returns DOM 요소 또는 null
 */
export function cachedQuerySelector(
  selector: string,
  container?: Document | Element,
  ttl?: number
): Element | null {
  return globalDOMCache.querySelector(selector, container, ttl);
}

/**
 * 캐시가 적용된 querySelectorAll 헬퍼
 *
 * @param selector CSS 선택자
 * @param container 검색 범위
 * @param ttl 캐시 유효 시간
 * @returns DOM 요소 목록
 */
export function cachedQuerySelectorAll(
  selector: string,
  container?: Document | Element,
  ttl?: number
): NodeListOf<Element> {
  return globalDOMCache.querySelectorAll(selector, container, ttl);
}

/**
 * 안정적인 선택자를 사용한 캐시된 조회
 * STABLE_SELECTORS와 연동하여 fallback 전략 적용
 *
 * @param selectors 우선순위별 선택자 배열
 * @param container 검색 범위
 * @param ttl 캐시 유효 시간
 * @returns 첫 번째로 매치된 DOM 요소 또는 null
 */
export function cachedStableQuery(
  selectors: readonly string[],
  container?: Document | Element,
  ttl?: number
): Element | null {
  for (const selector of selectors) {
    const element = cachedQuerySelector(selector, container, ttl);
    if (element) {
      return element;
    }
  }
  return null;
}

/**
 * DOM 변경 감지 시 관련 캐시 무효화
 * MutationObserver와 함께 사용하여 DOM 변경 시 자동 캐시 정리
 *
 * @param mutations MutationRecord 배열
 * @param selectorPatterns 무효화할 선택자 패턴
 */
export function invalidateCacheOnMutation(
  mutations: MutationRecord[],
  selectorPatterns: string[] = ['*']
): void {
  for (const mutation of mutations) {
    if (mutation.type === 'childList' || mutation.type === 'attributes') {
      selectorPatterns.forEach(pattern => {
        globalDOMCache.invalidate(pattern);
      });
      break; // 한 번만 무효화하면 충분
    }
  }
}
