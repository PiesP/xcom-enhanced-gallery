/**
 * @fileoverview Performance Utilities
 * @version 1.0.0
 *
 * 성능 최적화를 위한 유틸리티 함수들 (RAF, lazy loading, measurement)
 */

import { logger } from '../../../infrastructure/logging/logger';

/**
 * RAF을 사용한 애니메이션 최적화
 * @param callback 실행할 콜백 함수
 * @returns 요청 ID
 */
export function scheduleWork(callback: () => void): number {
  if (typeof requestAnimationFrame !== 'undefined') {
    return requestAnimationFrame(callback);
  }
  // Fallback for environments without requestAnimationFrame
  return setTimeout(callback, 16) as unknown as number;
}

/**
 * 지연 로딩을 위한 Intersection Observer 설정
 * @param selector 관찰할 요소 선택자
 * @param callback 요소가 뷰포트에 들어올 때 실행할 콜백
 * @param options Intersection Observer 옵션
 * @returns Intersection Observer 인스턴스
 */
export function setupLazyLoading(
  selector: string,
  callback: (element: Element) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') {
    return null;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '50px',
      ...options,
    }
  );

  const elements = document.querySelectorAll(selector);
  elements.forEach(element => observer.observe(element));

  return observer;
}

/**
 * 간단한 성능 측정
 * @param label 측정 라벨
 * @param fn 측정할 함수
 * @returns 실행 결과와 소요 시간
 */
export function measurePerformance<T>(label: string, fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  logger.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

  return { result, duration };
}

/**
 * 비동기 함수 성능 측정
 * @param label 측정 라벨
 * @param fn 측정할 비동기 함수
 * @returns 실행 결과와 소요 시간
 */
export async function measureAsyncPerformance<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  logger.debug(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

  return { result, duration };
}
