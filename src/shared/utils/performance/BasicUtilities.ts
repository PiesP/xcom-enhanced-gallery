/**
 * @fileoverview Basic Performance Utilities
 * @version 1.0.0
 *
 * 기본적인 성능 최적화 유틸리티 함수들 (debounce, throttle, RAF)
 */

/**
 * 디바운스된 함수를 생성합니다
 * @param func 디바운스할 함수
 * @param wait 대기 시간 (밀리초)
 * @returns 디바운스된 함수
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
}

/**
 * 스로틀된 함수를 생성합니다
 * @param func 스로틀할 함수
 * @param limit 제한 시간 (밀리초)
 * @returns 스로틀된 함수
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

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
 * 메모리 사용량 모니터링 (가능한 경우)
 * @returns 메모리 정보 또는 null
 */
export function getMemoryUsage(): {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
} | null {
  if ('performance' in window && 'memory' in performance) {
    const memory = (
      performance as unknown as {
        memory: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      }
    ).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
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

  console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

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

  console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

  return { result, duration };
}
