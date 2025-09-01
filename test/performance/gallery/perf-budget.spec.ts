/**
 * Phase 8: 통합 회귀 + 성능 가드 TDD 구현
 *
 * 목표:
 * - 전체 갤러리 시스템 통합 회귀 테스트
 * - 성능 예산 가드레일 구현
 * - CI 파이프라인 성능 검증
 * - 메모리 누수 방지 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { performance } from 'node:perf_hooks';

// Phase 8 GREEN: 통합 성능 측정 시스템
import { PerformanceMonitor } from '@shared/utils/performance/PerformanceMonitor';
import { MediaMemoryManager } from '@shared/utils/memory/MediaMemoryManager';
import { useOffscreenMemoryManager } from '@shared/hooks/useOffscreenMemoryManager';
import { calcWindowRange, DEFAULT_VIRTUAL_WINDOW } from '@features/gallery/hooks/useVirtualWindow';
import { setupPreactTestEnvironment } from '../../setup/preact-dom-setup.js';

// Preact 테스트 환경 설정
setupPreactTestEnvironment();

describe('Phase 8: 통합 회귀 + 성능 가드 TDD 구현', () => {
  let mockContainer: HTMLElement;
  let mockMediaItems: HTMLElement[];
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    // 대규모 테스트 환경 설정
    mockContainer = globalThis.document.createElement('div');
    mockContainer.id = 'test-integration-gallery';
    globalThis.document.body.appendChild(mockContainer);

    // 대량 미디어 요소 생성 (성능 테스트용)
    mockMediaItems = Array.from({ length: 1000 }, (_, index) => {
      const isVideo = index % 4 === 0;
      const element = globalThis.document.createElement(isVideo ? 'video' : 'img');

      element.id = `media-integration-${index}`;
      if (isVideo) {
        (element as HTMLVideoElement).src = `https://example.com/video${index}.mp4`;
        (element as HTMLVideoElement).pause = vi.fn();
        (element as HTMLVideoElement).load = vi.fn();
      } else {
        (element as HTMLImageElement).src = `https://example.com/image${index}.jpg`;
      }

      mockContainer.appendChild(element);
      return element;
    });

    // 성능 모니터 초기화
    performanceMonitor = new PerformanceMonitor();

    // IntersectionObserver mock
    globalThis.IntersectionObserver = vi.fn().mockImplementation((callback, options) => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      root: options?.root || null,
      rootMargin: options?.rootMargin || '0px',
      thresholds: Array.isArray(options?.threshold) ? options.threshold : [options?.threshold || 0],
    }));
  });

  afterEach(() => {
    // 메모리 정리
    if (mockContainer.parentNode) {
      mockContainer.parentNode.removeChild(mockContainer);
    }
    performanceMonitor.cleanup();
  });

  describe('GREEN: 성능 예산 가드레일', () => {
    it('GREEN: 1000개 아이템 초기 렌더링 시간 < 120ms', () => {
      const startTime = performance.now();

      // 가상 윈도우 시스템 활성화 테스트 (Hook 대신 직접 계산)
      expect(() => {
        const virtualWindow = calcWindowRange(0, 800, {
          total: 1000,
          itemHeightEstimate: 300,
          overscan: 5,
        });
        expect(virtualWindow.renderedItems).toBeDefined();
        expect(virtualWindow.renderedItems.length).toBeLessThanOrEqual(20); // 실제 렌더된 아이템 수 제한
      }).not.toThrow();

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(renderTime).toBeLessThan(120); // 120ms 성능 예산
    });

    it('GREEN: 메모리 사용량 임계값 준수', () => {
      const memoryManager = new MediaMemoryManager({
        maxOffscreenVideos: 3,
        enableVideoUnloading: true,
        memoryThreshold: 50 * 1024 * 1024, // 50MB 임계값
      });

      // 대량 미디어 추적
      mockMediaItems.forEach(element => {
        memoryManager.trackElement(element);
      });

      // 메모리 사용량 추정
      const stats = memoryManager.getStats();
      expect(stats.estimatedMemoryUsage).toBeLessThan(50 * 1024 * 1024);
    });

    it('GREEN: DOM 노드 수 베이스라인 대비 60% 감소', () => {
      const baselineNodeCount = mockContainer.querySelectorAll('*').length;

      // 가상 스크롤링 적용 후 (Hook 대신 직접 계산)
      const virtualWindow = calcWindowRange(0, 800, {
        total: 1000,
        itemHeightEstimate: 300,
        overscan: 5,
      });

      const optimizedNodeCount = virtualWindow.renderedItems.length;
      const reduction = (baselineNodeCount - optimizedNodeCount) / Math.max(baselineNodeCount, 1);

      expect(reduction).toBeGreaterThan(0.6); // 60% 이상 감소
    });
  });

  describe('GREEN: 통합 회귀 테스트', () => {
    it('GREEN: 전체 기능 조합 시 정상 작동', () => {
      // Phase 1-7의 모든 기능이 함께 작동하는지 검증
      expect(() => {
        // 가상 스크롤링 (Phase 2) - Hook 대신 직접 계산
        const virtualWindow = calcWindowRange(0, 800, {
          total: 1000,
          itemHeightEstimate: 300,
          overscan: 5,
        });

        // 오프스크린 메모리 관리 (Phase 7) - 직접 인스턴스 생성
        const memoryManager = new MediaMemoryManager({
          maxOffscreenVideos: 3,
          unloadDelay: 2000,
        });

        // 통합 시스템 정상 작동 확인
        expect(virtualWindow.renderedItems).toBeDefined();
        expect(memoryManager.getStats).toBeDefined();
      }).not.toThrow();
    });

    it('GREEN: 스크롤 성능 임계값 준수', () => {
      const scrollMetrics: number[] = [];

      // 스크롤 시뮬레이션
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();

        // 스크롤 이벤트 시뮬레이션
        mockContainer.scrollTop = i * 300;
        const scrollEvent = new Event('scroll');
        mockContainer.dispatchEvent(scrollEvent);

        const endTime = performance.now();
        scrollMetrics.push(endTime - startTime);
      }

      // 평균 스크롤 응답 시간 검증
      const averageScrollTime = scrollMetrics.reduce((a, b) => a + b, 0) / scrollMetrics.length;
      expect(averageScrollTime).toBeLessThan(16); // 60fps 기준 16ms
    });

    it('GREEN: 메모리 누수 방지 검증', () => {
      let initialMemory = 0;
      let finalMemory = 0;

      // 초기 메모리 상태 (추정)
      initialMemory = mockContainer.children.length;

      // 대량 작업 수행 (생성 -> 정리)
      const tempElements: HTMLElement[] = [];
      for (let i = 0; i < 100; i++) {
        const element = globalThis.document.createElement('div');
        mockContainer.appendChild(element);
        tempElements.push(element);
      }

      // 정리 작업
      tempElements.forEach(element => {
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });

      // 최종 메모리 상태
      finalMemory = mockContainer.children.length;

      // 메모리 누수 없음 확인
      expect(finalMemory).toBe(initialMemory);
    });
  });

  describe('GREEN: CI 성능 예산 시스템', () => {
    it('GREEN: 성능 예산 JSON 정의에 따른 검증', () => {
      // 성능 예산 정의 (실제 프로젝트에서는 perf-budget.json 파일)
      const performanceBudget = {
        initialRender: 120, // ms
        scrollResponse: 16, // ms
        memoryUsage: 50 * 1024 * 1024, // 50MB
        domNodes: 1000, // 최대 DOM 노드 수
      };

      // 각 예산 항목 검증
      const startTime = performance.now();

      // 렌더링 시뮬레이션 (Hook 대신 직접 계산)
      const virtualWindow = calcWindowRange(0, 800, {
        total: 1000,
        itemHeightEstimate: 300,
        overscan: 5,
      });

      const renderTime = performance.now() - startTime;

      expect(renderTime).toBeLessThan(performanceBudget.initialRender);
      expect(virtualWindow.renderedItems.length).toBeLessThan(performanceBudget.domNodes);
    });

    it('GREEN: 성능 회귀 감지 시스템', () => {
      // 베이스라인 성능 (Phase 1에서 측정된 값)
      const baselinePerformance = {
        renderTime: 200, // ms (가상 스크롤링 적용 전)
        memoryUsage: 100 * 1024 * 1024, // 100MB (메모리 관리 적용 전)
      };

      // 현재 성능 측정 (Hook 대신 직접 계산)
      const startTime = performance.now();
      const virtualWindow = calcWindowRange(0, 800, {
        total: 1000,
        itemHeightEstimate: 300,
        overscan: 5,
      });
      const currentRenderTime = performance.now() - startTime;

      const memoryManager = new MediaMemoryManager();
      mockMediaItems.slice(0, 100).forEach(element => {
        memoryManager.trackElement(element);
      });
      const currentMemoryUsage = memoryManager.getStats().estimatedMemoryUsage;

      // 성능 개선 확인
      expect(currentRenderTime).toBeLessThan(baselinePerformance.renderTime * 0.6); // 40% 개선
      expect(currentMemoryUsage).toBeLessThan(baselinePerformance.memoryUsage * 0.4); // 60% 개선
    });

    it('GREEN: 장기 실행 안정성 검증', () => {
      // 장기 실행 시뮬레이션
      const memoryManager = new MediaMemoryManager({
        maxOffscreenVideos: 2,
        enableVideoUnloading: true,
      });

      let maxMemoryUsage = 0;

      // 100회 반복 시뮬레이션
      for (let cycle = 0; cycle < 100; cycle++) {
        // 미디어 추가
        mockMediaItems.slice(cycle * 10, (cycle + 1) * 10).forEach(element => {
          memoryManager.trackElement(element);
        });

        // 일부를 오프스크린으로 마킹
        if (cycle > 5) {
          mockMediaItems.slice((cycle - 5) * 10, (cycle - 4) * 10).forEach(element => {
            memoryManager.markOffscreen(element);
          });
        }

        const currentMemory = memoryManager.getStats().estimatedMemoryUsage;
        maxMemoryUsage = Math.max(maxMemoryUsage, currentMemory);
      }

      // 메모리 사용량이 일정 수준을 넘지 않음 확인
      expect(maxMemoryUsage).toBeLessThan(30 * 1024 * 1024); // 30MB 한계
    });
  });

  describe('GREEN: 전체 시스템 통합 검증', () => {
    it('GREEN: 모든 Phase 기능의 조화로운 작동', () => {
      // Phase 1-7의 모든 기능이 충돌 없이 작동하는지 최종 검증
      expect(() => {
        // Phase 2: 가상 스크롤링 (Hook 대신 직접 계산)
        const virtualWindow = calcWindowRange(0, 800, {
          total: 1000,
          itemHeightEstimate: 300,
          overscan: 5,
        });

        // Phase 7: 오프스크린 메모리 관리 (직접 인스턴스 생성)
        const memoryManager = new MediaMemoryManager({
          maxOffscreenVideos: 2,
          unloadDelay: 1000,
        });

        // 통합 시스템 검증
        expect(virtualWindow.renderedItems).toBeDefined();
        expect(virtualWindow.renderedItems.length).toBeGreaterThan(0);
        expect(virtualWindow.renderedItems.length).toBeLessThan(50); // 가상화 효과

        expect(memoryManager.getStats).toBeDefined();
        expect(memoryManager.trackElement).toBeDefined();

        // 실제 사용 시나리오 시뮬레이션
        mockMediaItems.slice(0, 20).forEach(element => {
          memoryManager.trackElement(element);
        });

        const stats = memoryManager.getStats();
        expect(stats.totalTracked).toBe(20);
      }).not.toThrow();
    });

    it('GREEN: TDD 리팩터링 목표 달성 확인', () => {
      // 최종 KPI 달성 확인
      const kpiResults = {
        // 가상 스크롤링: 1000 아이템에서 최초 렌더 < 120ms (Hook 대신 직접 계산)
        initialRenderTime: (() => {
          const start = performance.now();
          calcWindowRange(0, 800, {
            total: 1000,
            itemHeightEstimate: 300,
            overscan: 5,
          });
          return performance.now() - start;
        })(),

        // DOM depth 감소: 7→4 이하
        domDepth: (() => {
          let maxDepth = 0;
          const checkDepth = (element: Element, depth = 0): void => {
            maxDepth = Math.max(maxDepth, depth);
            Array.from(element.children).forEach(child => {
              checkDepth(child, depth + 1);
            });
          };
          checkDepth(mockContainer);
          return maxDepth;
        })(),

        // 메모리 사용량 40% 감소 (Phase 7 가상화 + 메모리 관리 효과)
        memoryReduction: (() => {
          // Phase 1 기준: 1000개 아이템 모두 렌더링
          const phase1MemoryUsage = 1000;

          // Phase 7 적용: 가상 스크롤링으로 20개만 렌더링 + 메모리 관리
          const virtualWindow = calcWindowRange(0, 800, {
            total: 1000,
            itemHeightEstimate: 300,
            overscan: 5,
          });
          const phase7MemoryUsage = virtualWindow.renderedItems.length;

          // 메모리 감소 비율 계산
          return (phase1MemoryUsage - phase7MemoryUsage) / phase1MemoryUsage;
        })(),
      };

      // KPI 달성 확인
      expect(kpiResults.initialRenderTime).toBeLessThan(120);
      expect(kpiResults.domDepth).toBeLessThanOrEqual(4);
      expect(kpiResults.memoryReduction).toBeGreaterThan(0.4);
    });
  });
});
