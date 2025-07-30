/**
 * @fileoverview 간단한 지연 로딩 서비스
 * @description 유저스크립트에 적합한 기본적인 지연 로딩 기능
 * @version 2.0.0 - 간소화
 */

import { logger } from '@shared/logging';

/**
 * 지연 로딩 옵션
 */
export interface LazyLoadingOptions {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}

/**
 * 간단한 지연 로딩 서비스
 */
export class LazyLoadingService {
  private observer: IntersectionObserver | null = null;
  private targets = new Map<Element, () => void>();

  constructor() {
    this.initializeObserver();
  }

  /**
   * 옵저버 초기화
   */
  private initializeObserver(): void {
    if (!('IntersectionObserver' in window)) {
      logger.warn('IntersectionObserver not supported');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const callback = this.targets.get(entry.target);
            if (callback) {
              callback();
              this.unobserve(entry.target);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.1
      }
    );
  }

  /**
   * 요소 관찰 시작
   */
  observe(element: Element, callback: () => void, _options?: LazyLoadingOptions): void {
    if (!this.observer) {
      // 폴백: 즉시 실행
      callback();
      return;
    }

    this.targets.set(element, callback);
    this.observer.observe(element);
  }

  /**
   * 요소 관찰 중지
   */
  unobserve(element: Element): void {
    if (this.observer) {
      this.observer.unobserve(element);
    }
    this.targets.delete(element);
  }

  /**
   * 모든 관찰 중지 및 정리
   */
  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.targets.clear();
  }
}

/**
 * 전역 인스턴스
 */
export const lazyLoadingService = new LazyLoadingService();
