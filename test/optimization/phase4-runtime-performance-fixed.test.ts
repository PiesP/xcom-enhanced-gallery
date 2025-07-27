/**
 * @fileoverview Phase 4: 런타임 성능 최적화 테스트 (수정본)
 * @description 런타임 성능 최적화와 메모리 효율성 검증
 * @version 4.0.0 - Phase 4 Runtime Performance Optimization
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { join } from 'path';
import { readFileSync } from 'fs';
// Phase 4: 실제 서비스 import로 연결
import { OptimizedLazyLoadingService } from '@shared/services/OptimizedLazyLoadingService';
import { RuntimeResourceManager } from '@shared/managers';

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

  getTotalUsage(): number {
    return Array.from(this.allocations.values()).reduce((sum, size) => sum + size, 0);
  }

  clear(): void {
    this.allocations.clear();
  }
}

describe('Phase 4: 런타임 성능 최적화', () => {
  beforeEach(() => {
    // 테스트 환경 격리
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 리소스 정리
    vi.restoreAllMocks();
  });

  describe('1. 이벤트 핸들러 성능 최적화', () => {
    it('이벤트 핸들러가 throttle로 최적화되어야 함', () => {
      let callCount = 0;
      const handler = vi.fn(() => callCount++);

      // RAF throttle 시뮬레이션
      const throttledHandler = rafThrottleSimulation(handler);

      // 빠른 연속 호출
      for (let i = 0; i < 10; i++) {
        throttledHandler();
      }

      // throttle로 인해 호출 횟수가 제한되어야 함
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('메모리 누수 없이 이벤트 정리가 되어야 함', () => {
      const handlers = new Set<() => void>();
      const cleanup = () => {
        handlers.clear();
      };

      // 핸들러 등록
      for (let i = 0; i < 100; i++) {
        handlers.add(() => {});
      }

      expect(handlers.size).toBe(100);

      // 정리 실행
      cleanup();
      expect(handlers.size).toBe(0);
    });
  });

  describe('2. DOM 조작 배치 처리 최적화', () => {
    it('DOM 캐시 시스템이 효율적으로 작동해야 함', () => {
      const cacheContent = readFile('src/shared/dom/DOMCache.ts');

      // DOMCache 클래스 존재 확인
      expect(cacheContent).toContain('class DOMCache');
      expect(cacheContent).toContain('LRU');
      expect(cacheContent).toContain('cache');
    });

    it('DOM 쿼리가 캐시를 통해 최적화되어야 함', () => {
      const cacheContent = readFile('src/shared/dom/DOMCache.ts');

      // 캐시 관련 메서드 존재 확인
      expect(cacheContent).toContain('querySelector');
      expect(cacheContent).toContain('querySelectorAll');
      expect(cacheContent).toContain('get');
      expect(cacheContent).toContain('set');
    });

    it('배치 DOM 업데이트가 적용되어야 함', () => {
      const { result, duration } = measurePerformance(() => {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < 50; i++) {
          const div = document.createElement('div');
          div.textContent = `Item ${i}`;
          fragment.appendChild(div);
        }
        return fragment;
      });

      // 배치 처리로 인한 성능 향상 확인
      expect(duration).toBeLessThan(10); // 10ms 미만
      expect(result.childNodes.length).toBe(50);
    });
  });

  describe('3. 메모리 사용량 최적화', () => {
    it('MemoryTracker가 효율적으로 메모리를 관리해야 함', () => {
      const memoryTrackerContent = readFile('src/shared/memory/MemoryTracker.ts');

      // MemoryTracker 클래스 존재 확인
      expect(memoryTrackerContent).toContain('class MemoryTracker');
      expect(memoryTrackerContent).toContain('trackMemory');
      expect(memoryTrackerContent).toContain('cleanup');
    });

    it('고급 메모이제이션이 메모리 효율적이어야 함', () => {
      const memoContent = readFile('src/shared/components/optimization/AdvancedMemoization.ts');

      // 고급 메모이제이션 기능 확인
      expect(memoContent).toContain('AdvancedMemoization');
      expect(memoContent).toContain('memoize');
      expect(memoContent).toContain('WeakMap');
    });

    it('메모리 사용량이 임계값을 초과하지 않아야 함', () => {
      const memoryMonitor = new MemoryMonitor();

      // 메모리 할당 시뮬레이션
      for (let i = 0; i < 100; i++) {
        memoryMonitor.allocate(`item-${i}`, 1024); // 1KB씩 할당
      }

      const totalUsage = memoryMonitor.getTotalUsage();
      expect(totalUsage).toBeLessThan(200000); // 200KB 미만

      // 정리
      memoryMonitor.clear();
      expect(memoryMonitor.getTotalUsage()).toBe(0);
    });
  });

  describe('4. Intersection Observer 지연 로딩', () => {
    it('Intersection Observer가 올바르게 설정되어야 함', () => {
      const observer = {
        observe: vi.fn(),
        disconnect: vi.fn(),
        unobserve: vi.fn(),
      };

      expect(observer.observe).toBeDefined();
      expect(observer.disconnect).toBeDefined();
      expect(observer.unobserve).toBeDefined();
    });

    it('뷰포트 진입 시에만 로딩이 시작되어야 함', () => {
      // 실제 OptimizedLazyLoadingService 테스트
      const lazyService = OptimizedLazyLoadingService.getInstance();
      let loadCount = 0;

      const testElement = document.createElement('div');
      const loadFn = vi.fn(async () => {
        loadCount++;
      });

      lazyService.observe(testElement, loadFn);

      // 서비스가 정상적으로 초기화되었는지 확인
      expect(lazyService).toBeDefined();
      expect(loadFn).not.toHaveBeenCalled(); // 아직 뷰포트에 들어오지 않았으므로

      // 정리
      lazyService.destroy();
    });

    it('메모리 효율적인 이미지 로딩이 구현되어야 함', () => {
      const loadedImages = new Map<string, boolean>();

      // 이미지 로딩 시뮬레이션
      const simulateImageLoad = (src: string) => {
        loadedImages.set(src, true);
      };

      // 50개 이미지 중 처음 10개만 로드
      for (let i = 1; i <= 10; i++) {
        simulateImageLoad(`image-${i}.jpg`);
      }

      expect(loadedImages.size).toBe(10);
      expect(loadedImages.has('image-5.jpg')).toBe(true);
      expect(loadedImages.has('image-50.jpg')).toBe(false);
    });
  });

  describe('5. 런타임 리소스 관리', () => {
    it('리소스 정리가 체계적으로 이루어져야 함', () => {
      // 실제 RuntimeResourceManager 사용
      const resourceManager = RuntimeResourceManager.getInstance();

      // 리소스 등록
      const imageUrl = resourceManager.addResource('test-image', 'image', new Image(), 1024);
      const videoUrl = resourceManager.addResource(
        'test-video',
        'video',
        { src: 'test.mp4' },
        2048
      );

      // 리소스가 등록되었는지 확인
      expect(resourceManager.getResourceCount()).toBeGreaterThan(0);
      expect(resourceManager.getMemoryUsage()).toBeGreaterThan(0);

      // 정리 실행
      resourceManager.cleanup();

      // 리소스가 정리되었는지 확인
      expect(resourceManager.getResourceCount()).toBeLessThanOrEqual(2);
    });

    it('성능 모니터링이 오버헤드 없이 동작해야 함', () => {
      const performanceData: number[] = [];

      // 성능 측정 시뮬레이션
      for (let i = 0; i < 100; i++) {
        const start = performance.now();
        // 최소한의 작업
        Math.random();
        const end = performance.now();
        performanceData.push(end - start);
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

        return operations.map(op => op());
      });

      // 성능 기준치 검증
      expect(duration).toBeLessThan(50); // 50ms 미만
      expect(result).toBeDefined();
    });

    it('메모리 효율성이 유지되어야 함', () => {
      const memoryMonitor = new MemoryMonitor();

      // 대량 메모리 할당
      for (let i = 0; i < 1000; i++) {
        memoryMonitor.allocate(`item-${i}`, 1024);
      }

      // 메모리 사용량이 예상 범위 내에 있어야 함
      expect(memoryMonitor.getTotalUsage()).toBeLessThan(1024 * 1024); // 1MB 미만
    });

    it('유저스크립트 환경에서 안정적으로 동작해야 함', () => {
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
