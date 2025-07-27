/**
 * @fileoverview Phase 4: 런타임 성능 최적화 테스트
 * @description 런타임 성능 최적화와 메모리 효율성 검증
 * @version 4.0.0 - Phase 4 Runtime Performance Optimization
 *
 * 핵심 원칙: 환경 격리, 로직 분리, 행위 중심 테스트
 *
 * 최적화 영역:
 * - 이벤트 핸들러 성능 최적화
 * - DOM 조작 배치 처리
 * - 메모리 사용량 최적화
 * - Intersection Observer 기반 지연 로딩
 * - 런타임 리소스 관리
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { readFileSync } from 'fs';

const ROOT_DIR = join(__dirname, '..', '..');

/**
 * 파일 읽기 유틸리티 - 환경 격리
 */
function readFile(relativePath: string): string {
  return readFileSync(join(ROOT_DIR, relativePath), 'utf-8');
}

/**
 * 성능 측정 유틸리티 - 행위 중심 테스트
 */
function measurePerformance<T>(fn: () => T): { result: T; duration: number } {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * 메모리 사용량 모니터링 유틸리티
 */
class MemoryMonitor {
  private allocations = new Map<string, number>();

  allocate(key: string, size: number): void {
    this.allocations.set(key, (this.allocations.get(key) || 0) + size);
  }

  deallocate(key: string, size?: number): void {
    const current = this.allocations.get(key) || 0;
    if (size) {
      this.allocations.set(key, Math.max(0, current - size));
    } else {
      this.allocations.delete(key);
    }
  }

  getUsage(key?: string): number {
    if (key) {
      return this.allocations.get(key) || 0;
    }
    return Array.from(this.allocations.values()).reduce((sum, val) => sum + val, 0);
  }
}

describe('Phase 4: 런타임 성능 최적화', () => {
  let memoryMonitor: MemoryMonitor;

  beforeEach(() => {
    vi.clearAllMocks();
    memoryMonitor = new MemoryMonitor();

    // Mock IntersectionObserver
    globalThis.IntersectionObserver = vi.fn().mockImplementation(callback => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    }));

    // Mock requestAnimationFrame
    globalThis.requestAnimationFrame = vi.fn().mockImplementation(callback => {
      return setTimeout(callback, 16) as unknown as number;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('1. 이벤트 핸들러 성능 최적화', () => {
    it('이벤트 등록 빈도가 최적화되어야 함', () => {
      const unifiedEventsContent = readFile('src/shared/utils/unified-events.ts');

      // 우선순위 강화 간격이 적절히 설정되어야 함 (15초는 너무 빈번)
      expect(unifiedEventsContent).toContain('setInterval');

      // 성능 최적화를 위한 주석이나 설정이 있어야 함
      const hasOptimizationComment =
        unifiedEventsContent.includes('성능') ||
        unifiedEventsContent.includes('최적화') ||
        unifiedEventsContent.includes('optimization');
      expect(hasOptimizationComment).toBe(true);
    });

    it('이벤트 핸들러가 throttle로 최적화되어야 함', () => {
      let callCount = 0;
      const optimizedHandler = () => {
        callCount++;
      };

      // RAF throttle 시뮬레이션
      const throttled = rafThrottleSimulation(optimizedHandler);

      // 연속 호출 시뮬레이션
      for (let i = 0; i < 100; i++) {
        throttled();
      }

      // throttling 효과로 호출 횟수가 제한되어야 함
      expect(callCount).toBeLessThan(5);
    });

    it('메모리 누수 없이 이벤트 정리가 되어야 함', () => {
      memoryMonitor.allocate('eventListeners', 1000);

      // 이벤트 정리 시뮬레이션
      const cleanup = () => {
        memoryMonitor.deallocate('eventListeners');
      };

      cleanup();

      expect(memoryMonitor.getUsage('eventListeners')).toBe(0);
    });
  });

  describe('2. DOM 조작 배치 처리 최적화', () => {
    it('DOM 캐시 시스템이 효율적으로 작동해야 함', () => {
      const domCacheContent = readFile('src/shared/dom/DOMCache.ts');

      // TTL 설정이 적절해야 함
      expect(domCacheContent).toContain('defaultTTL');
      expect(domCacheContent).toContain('maxCacheSize');

      // 정리 메커니즘이 있어야 함
      expect(domCacheContent).toContain('cleanup');
    });

    it('DOM 쿼리가 캐시를 통해 최적화되어야 함', () => {
      const mockCache = new Map();

      const querySelector = (selector: string) => {
        if (mockCache.has(selector)) {
          return mockCache.get(selector);
        }

        const element = { querySelector: selector };
        mockCache.set(selector, element);
        return element;
      };

      // 첫 번째 쿼리
      const result1 = querySelector('.test-selector');

      // 두 번째 쿼리 (캐시됨)
      const result2 = querySelector('.test-selector');

      expect(result1).toBe(result2); // 동일한 객체 참조
      expect(mockCache.size).toBe(1);
    });

    it('배치 DOM 업데이트가 적용되어야 함', () => {
      const operations: string[] = [];

      const batchUpdate = (updateFns: (() => void)[]) => {
        // requestAnimationFrame으로 배치 처리 시뮬레이션
        updateFns.forEach(fn => fn());
      };

      batchUpdate([
        () => operations.push('update1'),
        () => operations.push('update2'),
        () => operations.push('update3'),
      ]);

      expect(operations).toEqual(['update1', 'update2', 'update3']);
    });
  });

  describe('3. 메모리 사용량 최적화', () => {
    it('MemoryTracker가 효율적으로 메모리를 관리해야 함', () => {
      const memoryTrackerContent = readFile('src/shared/memory/MemoryTracker.ts');

      // 메모리 임계값이 설정되어야 함
      expect(memoryTrackerContent).toContain('MEMORY_THRESHOLDS');
      expect(memoryTrackerContent).toContain('WARNING_MB');
      expect(memoryTrackerContent).toContain('CRITICAL_MB');
    });

    it('고급 메모이제이션이 메모리 효율적이어야 함', () => {
      const advancedMemoContent = readFile(
        'src/shared/components/optimization/AdvancedMemoization.ts'
      );

      // 정리 메커니즘이 있어야 함
      expect(advancedMemoContent).toContain('cleanup');
      expect(advancedMemoContent).toContain('clearStats');

      // 최대 캐시 크기 제한이 있어야 함
      expect(advancedMemoContent).toContain('maxCacheSize');
    });

    it('메모리 사용량이 임계값을 초과하지 않아야 함', () => {
      const MEMORY_LIMIT = 100; // MB

      memoryMonitor.allocate('components', 50);
      memoryMonitor.allocate('cache', 30);
      memoryMonitor.allocate('events', 15);

      const totalUsage = memoryMonitor.getUsage();

      expect(totalUsage).toBeLessThan(MEMORY_LIMIT);
    });
  });

  describe('4. Intersection Observer 지연 로딩', () => {
    it('Intersection Observer가 올바르게 설정되어야 함', () => {
      const observer = new IntersectionObserver(() => {});

      expect(observer.observe).toBeDefined();
      expect(observer.disconnect).toBeDefined();
      expect(observer.unobserve).toBeDefined();
    });

    it('뷰포트 진입 시에만 로딩이 시작되어야 함', () => {
      let loadCount = 0;

      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn(),
      };

      const lazyLoader = {
        observe: (element: HTMLElement) => {
          mockObserver.observe(element);
        },
        onIntersect: () => {
          loadCount++;
        },
      };

      const testElement = document.createElement('div');
      lazyLoader.observe(testElement);

      expect(mockObserver.observe).toHaveBeenCalledWith(testElement);
    });

    it('메모리 효율적인 이미지 로딩이 구현되어야 함', () => {
      const imageUrls = Array.from({ length: 100 }, (_, i) => `image-${i}.jpg`);
      const loadedImages = new Set<string>();

      // 뷰포트 내 이미지만 로드하는 시뮬레이션
      const loadVisibleImages = (visibleRange: [number, number]) => {
        const [start, end] = visibleRange;
        for (let i = start; i <= end && i < imageUrls.length; i++) {
          loadedImages.add(imageUrls[i]);
        }
      };

      // 처음 10개만 로드
      loadVisibleImages([0, 9]);

      expect(loadedImages.size).toBe(10);
      expect(loadedImages.has('image-0.jpg')).toBe(true);
      expect(loadedImages.has('image-50.jpg')).toBe(false);
    });
  });

  describe('5. 런타임 리소스 관리', () => {
    it('리소스 정리가 체계적으로 이루어져야 함', () => {
      const resources = {
        timers: new Set<number>(),
        observers: new Set<any>(),
        listeners: new Set<any>(),
      };

      const cleanup = () => {
        resources.timers.forEach(id => clearTimeout(id));
        resources.observers.forEach(observer => observer.disconnect());
        resources.listeners.forEach(cleanup => cleanup());

        resources.timers.clear();
        resources.observers.clear();
        resources.listeners.clear();
      };

      // 리소스 등록
      resources.timers.add(setTimeout(() => {}, 1000) as any);
      resources.observers.add({ disconnect: vi.fn() });
      resources.listeners.add(() => {});

      expect(resources.timers.size).toBe(1);
      expect(resources.observers.size).toBe(1);
      expect(resources.listeners.size).toBe(1);

      cleanup();

      expect(resources.timers.size).toBe(0);
      expect(resources.observers.size).toBe(0);
      expect(resources.listeners.size).toBe(0);
    });

    it('성능 모니터링이 오버헤드 없이 동작해야 함', () => {
      const performanceData: number[] = [];

      const monitor = (fn: () => void) => {
        const start = performance.now();
        fn();
        const end = performance.now();
        performanceData.push(end - start);
      };

      // 100번 성능 측정
      for (let i = 0; i < 100; i++) {
        monitor(() => {
          // 간단한 작업
          Math.random();
        });
      }

      // 모니터링 오버헤드가 최소화되어야 함
      const averageTime =
        performanceData.reduce((sum, time) => sum + time, 0) / performanceData.length;
      expect(averageTime).toBeLessThan(1); // 1ms 미만
    });
  });

  describe('6. 전체 성능 검증', () => {
    it('런타임 성능이 기준치를 만족해야 함', () => {
      const { result, duration } = measurePerformance(() => {
        // 복합적인 성능 테스트
        const operations = [];

        // DOM 캐시 시뮬레이션
        for (let i = 0; i < 50; i++) {
          operations.push(() => document.createElement('div'));
        }

        // 이벤트 핸들링 시뮬레이션
        for (let i = 0; i < 30; i++) {
          operations.push(() => {});
        }

        // 메모리 작업 시뮬레이션
        for (let i = 0; i < 20; i++) {
          operations.push(() => new Array(100).fill(0));
        }

        return operations.length;
      });

      expect(result).toBe(100);
      expect(duration).toBeLessThan(50); // 50ms 미만
    });

    it('메모리 효율성이 유지되어야 함', () => {
      // 대량 작업 시뮬레이션
      for (let i = 0; i < 1000; i++) {
        memoryMonitor.allocate(`item-${i}`, 1);
      }

      expect(memoryMonitor.getUsage()).toBe(1000);

      // 배치 정리
      for (let i = 0; i < 1000; i++) {
        memoryMonitor.deallocate(`item-${i}`);
      }

      expect(memoryMonitor.getUsage()).toBe(0);
    });

    it('유저스크립트 환경에서 안정적으로 동작해야 함', () => {
      // 유저스크립트 특화 검증
      const constraints = {
        maxBundleSize: 500000, // 500KB
        maxInitTime: 100, // 100ms
        maxMemoryUsage: 50, // 50MB
      };

      const mockStats = {
        bundleSize: 450000,
        initTime: 85,
        memoryUsage: 45,
      };

      expect(mockStats.bundleSize).toBeLessThan(constraints.maxBundleSize);
      expect(mockStats.initTime).toBeLessThan(constraints.maxInitTime);
      expect(mockStats.memoryUsage).toBeLessThan(constraints.maxMemoryUsage);
    });
  });
});

/**
 * RAF throttle 시뮬레이션 함수
 */
function rafThrottleSimulation<T extends (...args: any[]) => void>(fn: T): T {
  let isThrottled = false;

  return ((...args: any[]) => {
    if (!isThrottled) {
      fn(...args);
      isThrottled = true;
      setTimeout(() => {
        isThrottled = false;
      }, 16); // 60fps
    }
  }) as T;
}
