/**
 * @fileoverview 통합 DOM 유틸리티 - TDD GREEN Phase
 * @description 모든 DOM 관련 기능을 하나로 통합한 최적화된 유틸리티
 * @version 1.0.0 - Phase GREEN: 중복 제거 및 통합
 */

import { logger } from '@shared/logging/logger';
import { DOMCache } from '@shared/dom/DOMCache';
import { DOMBatcher, type DOMUpdate } from '@shared/utils/dom/DOMBatcher';

/**
 * 성능 최적화 설정
 */
interface DOMOptimizationConfig {
  enableCaching: boolean;
  enableBatching: boolean;
  enableLazyLoading: boolean;
  enableMemoryOptimization: boolean;
  cacheMaxSize: number;
  cacheTTL: number;
}

/**
 * DOM 성능 메트릭
 */
interface DOMPerformanceMetrics {
  queriesExecuted: number;
  cacheHits: number;
  cacheHitRate: number;
  batchOperations: number;
  memoryUsage: number;
  averageQueryTime: number;
}

/**
 * 통합 DOM 유틸리티 클래스
 *
 * 기존의 중복된 DOM 관리자들을 통합:
 * - DOMBatcher (배치 처리)
 * - DOMCache (캐싱)
 * - CoreDOMManager (코어 기능)
 * - DOMManager (일반 기능)
 * - UIOptimizer (성능 최적화)
 */
export class UnifiedDOMUtils {
  private readonly domCache: DOMCache;
  private readonly domBatcher: DOMBatcher;
  private readonly config: DOMOptimizationConfig;
  private readonly metrics: DOMPerformanceMetrics;
  private readonly cleanupTasks: Set<() => void> = new Set();

  constructor(config: Partial<DOMOptimizationConfig> = {}) {
    this.config = {
      enableCaching: true,
      enableBatching: true,
      enableLazyLoading: true,
      enableMemoryOptimization: true,
      cacheMaxSize: 100,
      cacheTTL: 30000,
      ...config,
    };

    this.domCache = new DOMCache({
      maxCacheSize: this.config.cacheMaxSize,
      defaultTTL: this.config.cacheTTL,
    });

    this.domBatcher = new DOMBatcher();

    this.metrics = {
      queriesExecuted: 0,
      cacheHits: 0,
      cacheHitRate: 0,
      batchOperations: 0,
      memoryUsage: 0,
      averageQueryTime: 0,
    };
  }

  // ================================
  // 캐싱 기능 (DOMCache 통합)
  // ================================

  /**
   * 캐시된 요소 선택
   */
  queryCached<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T | null {
    if (!this.config.enableCaching) {
      return this.queryDirect<T>(selector, container);
    }

    const startTime = performance.now();

    try {
      const validContainer = container as Document | Element;
      const result = this.domCache.querySelector(selector, validContainer) as T | null;
      this.updateMetrics(startTime, result !== null);
      return result;
    } catch (error) {
      logger.error('UnifiedDOMUtils: 캐시된 쿼리 실패', { selector, error });
      return null;
    }
  }

  /**
   * 캐시된 여러 요소 선택
   */
  queryAllCached<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T[] {
    if (!this.config.enableCaching) {
      return Array.from(container.querySelectorAll<T>(selector));
    }

    const startTime = performance.now();

    try {
      const validContainer = container as Document | Element;
      const result = Array.from(this.domCache.querySelectorAll(selector, validContainer)) as T[];
      this.updateMetrics(startTime, result.length > 0);
      return result;
    } catch (error) {
      logger.error('UnifiedDOMUtils: 캐시된 다중 쿼리 실패', { selector, error });
      return [];
    }
  }

  // ================================
  // 배치 처리 기능 (DOMBatcher 통합)
  // ================================

  /**
   * 배치 업데이트 추가
   */
  batchUpdate(update: DOMUpdate): void {
    if (!this.config.enableBatching) {
      this.applyUpdateDirect(update);
      return;
    }

    try {
      this.domBatcher.add(update);
      this.metrics.batchOperations++;
    } catch (error) {
      logger.error('UnifiedDOMUtils: 배치 업데이트 추가 실패', { update, error });
    }
  }

  /**
   * 여러 배치 업데이트 추가
   */
  batchUpdateMany(updates: DOMUpdate[]): void {
    if (!this.config.enableBatching) {
      updates.forEach(update => this.applyUpdateDirect(update));
      return;
    }

    try {
      this.domBatcher.addMany(updates);
      this.metrics.batchOperations += updates.length;
    } catch (error) {
      logger.error('UnifiedDOMUtils: 다중 배치 업데이트 실패', { count: updates.length, error });
    }
  }

  /**
   * 배치 업데이트 즉시 실행
   */
  flushBatch(): void {
    try {
      this.domBatcher.flush();
    } catch (error) {
      logger.error('UnifiedDOMUtils: 배치 플러시 실패', error);
    }
  }

  // ================================
  // 성능 최적화 기능
  // ================================

  /**
   * 성능 최적화 실행
   */
  optimizePerformance(container: HTMLElement): void {
    if (!this.config.enableMemoryOptimization) return;

    try {
      // 지연 로딩 활성화
      if (this.config.enableLazyLoading) {
        this.enableLazyLoading(container);
      }

      // 이미지 최적화
      this.optimizeImages(container);

      // 스크롤 성능 최적화
      this.optimizeScrolling(container);

      logger.debug('UnifiedDOMUtils: 성능 최적화 완료');
    } catch (error) {
      logger.error('UnifiedDOMUtils: 성능 최적화 실패', error);
    }
  }

  /**
   * 지연 로딩 활성화
   */
  private enableLazyLoading(container: HTMLElement): void {
    if (!window.IntersectionObserver) return;

    const images = container.querySelectorAll('img[data-src], [data-lazy]');

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              delete img.dataset.src;
              img.classList.add('xeg-loaded');
            }
            observer.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    );

    images.forEach(img => observer.observe(img));

    this.cleanupTasks.add(() => observer.disconnect());
  }

  /**
   * 이미지 최적화
   */
  private optimizeImages(container: HTMLElement): void {
    const images = container.querySelectorAll('img');

    images.forEach(img => {
      // 레티나 디스플레이 고려
      const pixelRatio = window.devicePixelRatio || 1;
      const parent = img.parentElement;

      if (parent) {
        const containerWidth = parent.offsetWidth;
        const optimizedWidth = Math.ceil(containerWidth * pixelRatio);

        if (img.naturalWidth > optimizedWidth * 1.5) {
          img.style.maxWidth = '100%';
          img.style.height = 'auto';
        }
      }
    });
  }

  /**
   * 스크롤 성능 최적화
   */
  private optimizeScrolling(container: HTMLElement): void {
    let ticking = false;

    const scrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // 가시 영역 업데이트
          this.updateVisibleElements(container);
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', scrollHandler, { passive: true });

    this.cleanupTasks.add(() => {
      container.removeEventListener('scroll', scrollHandler);
    });
  }

  /**
   * 가시 영역 요소만 업데이트
   */
  private updateVisibleElements(container: HTMLElement): void {
    const rect = container.getBoundingClientRect();
    const elements = container.querySelectorAll('[data-virtual-item]');

    elements.forEach(element => {
      const elementRect = element.getBoundingClientRect();
      const isVisible = elementRect.bottom >= rect.top && elementRect.top <= rect.bottom;

      if (isVisible) {
        element.classList.add('xeg-visible');
        element.classList.remove('xeg-hidden');
      } else {
        element.classList.add('xeg-hidden');
        element.classList.remove('xeg-visible');
      }
    });
  }

  // ================================
  // 메모리 관리 및 정리
  // ================================

  /**
   * 메모리 정리 및 리소스 해제
   */
  cleanup(): void {
    try {
      // DOM 캐시 정리
      this.domCache.dispose();

      // 배치 업데이트 정리
      this.domBatcher.clear();

      // 등록된 정리 작업 실행
      this.cleanupTasks.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          logger.warn('UnifiedDOMUtils: 정리 작업 실패', error);
        }
      });

      this.cleanupTasks.clear();

      logger.debug('UnifiedDOMUtils: 메모리 정리 완료');
    } catch (error) {
      logger.error('UnifiedDOMUtils: 정리 실패', error);
    }
  }

  // ================================
  // 메트릭 및 유틸리티
  // ================================

  /**
   * 성능 메트릭 조회
   */
  getMetrics(): DOMPerformanceMetrics {
    const cacheStats = this.domCache.getStats();

    return {
      ...this.metrics,
      cacheHits: cacheStats.totalHits,
      cacheHitRate: cacheStats.hitRate,
    };
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<DOMOptimizationConfig>): void {
    Object.assign(this.config, newConfig);
  }

  // ================================
  // Private 헬퍼 메서드
  // ================================

  /**
   * 직접 요소 선택 (캐시 없음)
   */
  private queryDirect<T extends Element = Element>(
    selector: string,
    container: ParentNode = document
  ): T | null {
    const startTime = performance.now();

    try {
      const result = container.querySelector<T>(selector);
      this.updateMetrics(startTime, result !== null);
      return result;
    } catch (error) {
      logger.error('UnifiedDOMUtils: 직접 쿼리 실패', { selector, error });
      return null;
    }
  }

  /**
   * 직접 업데이트 적용 (배치 없음)
   */
  private applyUpdateDirect(update: DOMUpdate): void {
    try {
      const { element, styles, classes, attributes, textContent } = update;

      if (styles) {
        Object.assign(element.style, styles);
      }

      if (classes) {
        if (classes.add) {
          element.classList.add(...classes.add);
        }
        if (classes.remove) {
          element.classList.remove(...classes.remove);
        }
      }

      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          element.setAttribute(key, value);
        });
      }

      if (textContent !== undefined) {
        element.textContent = textContent;
      }
    } catch (error) {
      logger.error('UnifiedDOMUtils: 직접 업데이트 실패', { update, error });
    }
  }

  /**
   * 메트릭 업데이트
   */
  private updateMetrics(startTime: number, _wasSuccessful: boolean): void {
    const endTime = performance.now();
    const queryTime = endTime - startTime;

    this.metrics.queriesExecuted++;

    // 평균 쿼리 시간 계산
    this.metrics.averageQueryTime =
      (this.metrics.averageQueryTime * (this.metrics.queriesExecuted - 1) + queryTime) /
      this.metrics.queriesExecuted;

    // 메모리 사용량 추정 (가능한 경우)
    if ('memory' in performance) {
      const memInfo = (performance as { memory: { usedJSHeapSize: number } }).memory;
      this.metrics.memoryUsage = memInfo.usedJSHeapSize;
    }
  }
}

// ================================
// 전역 인스턴스 및 편의 함수
// ================================

/**
 * 전역 통합 DOM 유틸리티 인스턴스
 */
export const unifiedDOMUtils = new UnifiedDOMUtils();

// 편의 함수들 (하위 호환성)
export const queryCached = <T extends Element = Element>(
  selector: string,
  container?: ParentNode
): T | null => unifiedDOMUtils.queryCached<T>(selector, container);

export const queryAllCached = <T extends Element = Element>(
  selector: string,
  container?: ParentNode
): T[] => unifiedDOMUtils.queryAllCached<T>(selector, container);

export const batchUpdate = (update: DOMUpdate): void => unifiedDOMUtils.batchUpdate(update);

export const batchUpdateMany = (updates: DOMUpdate[]): void =>
  unifiedDOMUtils.batchUpdateMany(updates);

export const flushBatch = (): void => unifiedDOMUtils.flushBatch();

export const optimizePerformance = (container: HTMLElement): void =>
  unifiedDOMUtils.optimizePerformance(container);

export const cleanup = (): void => unifiedDOMUtils.cleanup();

// 타입 export
export type { DOMOptimizationConfig, DOMPerformanceMetrics, DOMUpdate };
