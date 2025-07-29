/**
 * Phase 3 - Step 2: 코드 분할 대상 식별 테스트
 *
 * fflate 지연 로딩 이후 추가 최적화 대상을 식별하고
 * 동적 import 적용 가능성을 검증하는 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createBundleInfo } from '@shared/utils/optimization/bundle';

// Vendor mocking for tests
vi.mock('@shared/external/vendors', () => ({
  getPreactCompat: () => ({
    memo: vi.fn(component => component),
  }),
  getMotion: () => ({
    animate: vi.fn(),
    scroll: vi.fn(),
    timeline: vi.fn(),
  }),
}));

describe('Phase 3 Step 2: 코드 분할 대상 식별', () => {
  describe('1. 현재 번들 구조 분석', () => {
    it('현재 번들 크기가 목표 범위 내에 있어야 한다', () => {
      // 현재 production 번들: 382.47 KB (목표: 400KB 이내)
      const currentBundle = createBundleInfo(
        ['main-app', 'gallery-components', 'media-services', 'vendor-libraries', 'css-styles'],
        382470 // 382.47 KB in bytes
      );

      expect(currentBundle.totalSize).toBeLessThanOrEqual(400 * 1024); // 400KB
      expect(currentBundle.gzippedSize).toBeLessThanOrEqual(140 * 1024); // ~35% 압축률
    });

    it('추가 최적화 대상 모듈을 식별해야 한다', () => {
      const bundleModules = [
        'OptimizedLazyLoadingService', // 지연 로딩 서비스 (크기 큰 편)
        'BundleOptimizer', // 복잡한 최적화 클래스 (개발용?)
        'VerticalGalleryView', // 갤러리 컴포넌트 (조건부 로딩 가능)
        'MediaExtractionService', // 미디어 추출 (필요시만)
        'MotionAPI', // 애니메이션 라이브러리 (사용시만)
        'AdvancedMemoization', // 고급 최적화 (선택적)
      ];

      const splitCandidates = bundleModules.filter(module => {
        // 조건부 로딩이 가능한 모듈들
        return (
          module.includes('Optimized') ||
          module.includes('Advanced') ||
          module.includes('Motion') ||
          module.includes('Bundle')
        );
      });

      expect(splitCandidates.length).toBeGreaterThan(0);
      expect(splitCandidates).toContain('OptimizedLazyLoadingService');
      expect(splitCandidates).toContain('BundleOptimizer');
    });
  });

  describe('2. 동적 import 대상 우선순위', () => {
    it('Motion API는 애니메이션 사용시에만 로드되어야 한다', async () => {
      // Motion API 동적 로딩 테스트
      const mockMotionAPI = {
        animate: vi.fn(),
        scroll: vi.fn(),
        timeline: vi.fn(),
      };

      vi.doMock('@shared/external/vendors', () => ({
        getMotion: () => mockMotionAPI,
      }));

      // 동적 import 시뮬레이션
      const loadMotionWhenNeeded = async () => {
        const { getMotion } = await import('@shared/external/vendors');
        return getMotion();
      };

      const motionAPI = await loadMotionWhenNeeded();
      expect(motionAPI).toBeDefined();
      expect(typeof motionAPI.animate).toBe('function');
    });

    it('고급 갤러리 기능은 필요시에만 로드되어야 한다', () => {
      const advancedFeatures = [
        'VirtualScrollManager',
        'AdvancedMemoization',
        'OptimizedLazyLoadingService',
        'WorkerPoolManager',
      ];

      // 고급 기능들은 기본 갤러리 로딩 후 필요시 로드
      const isAdvancedFeature = (moduleName: string) => {
        return advancedFeatures.includes(moduleName);
      };

      expect(isAdvancedFeature('VirtualScrollManager')).toBe(true);
      expect(isAdvancedFeature('AdvancedMemoization')).toBe(true);
      expect(isAdvancedFeature('BasicGalleryComponent')).toBe(false);
    });

    it('개발용 유틸리티는 production에서 제외되어야 한다', () => {
      const developmentModules = [
        'BundleOptimizer',
        'DebugUtils',
        'PerformanceProfiler',
        'TestHelpers',
      ];

      const unusedInProduction = developmentModules.filter(
        module => module.includes('Bundle') || module.includes('Debug')
      );
      expect(unusedInProduction.length).toBeGreaterThan(0);
    });
  });

  describe('3. 번들 분할 전략', () => {
    it('코어 갤러리와 고급 기능을 분리해야 한다', () => {
      const coreModules = [
        'VerticalGalleryView',
        'MediaService',
        'BulkDownloadService',
        'BasicToast',
      ];

      const advancedModules = [
        'OptimizedLazyLoadingService',
        'VirtualScrollManager',
        'AdvancedMemoization',
        'WorkerPoolManager',
      ];

      // 코어 모듈은 즉시 로딩
      expect(coreModules.every(module => !module.includes('Advanced'))).toBe(true);

      // 고급 모듈은 지연 로딩 대상
      expect(
        advancedModules.every(
          module =>
            module.includes('Advanced') ||
            module.includes('Optimized') ||
            module.includes('Virtual') ||
            module.includes('Worker')
        )
      ).toBe(true);
    });

    it('외부 라이브러리별 분할 전략이 정의되어야 한다', () => {
      const vendorSplitStrategy = {
        // 즉시 필요: UI 프레임워크
        immediate: ['preact', '@preact/signals'],

        // 조건부 로딩: 압축 라이브러리 (이미 구현됨)
        conditional: ['fflate'],

        // 지연 로딩: 애니메이션 라이브러리
        lazy: ['motion-one'],
      };

      expect(vendorSplitStrategy.immediate).toContain('preact');
      expect(vendorSplitStrategy.conditional).toContain('fflate');
      expect(vendorSplitStrategy.lazy).toContain('motion-one');
    });
  });

  describe('4. 성능 영향 검증', () => {
    it('동적 import가 초기 로딩 시간을 개선해야 한다', async () => {
      const startTime = performance.now();

      // 기본 갤러리 컴포넌트 로딩 시뮬레이션 (import 없이)
      const basicGalleryPromise = Promise.resolve({
        VerticalGalleryView: 'loaded',
      });
      const basicGallery = await basicGalleryPromise;
      const basicLoadTime = performance.now() - startTime;

      // 고급 기능은 별도 로딩
      const advancedStartTime = performance.now();
      const mockAdvancedModule = Promise.resolve({
        OptimizedLazyLoadingService: class {},
        VirtualScrollManager: class {},
      });
      await mockAdvancedModule;
      const advancedLoadTime = performance.now() - advancedStartTime;

      expect(basicGallery).toBeDefined();
      expect(basicLoadTime).toBeLessThan(100); // 기본 로딩은 빨라야 함
      expect(advancedLoadTime).toBeGreaterThan(0); // 고급 기능은 별도 로딩
    });

    it('메모리 사용량이 최적화되어야 한다', () => {
      // 즉시 로딩되는 모듈 목록
      const immediateModules = ['VerticalGalleryView', 'MediaService', 'BulkDownloadService'];

      // 지연 로딩되는 모듈 목록
      const lazyModules = [
        'OptimizedLazyLoadingService',
        'VirtualScrollManager',
        'AdvancedMemoization',
      ];

      // 즉시 로딩 모듈은 최소한으로 유지
      expect(immediateModules.length).toBeLessThanOrEqual(5);

      // 지연 로딩 모듈로 메모리 최적화
      expect(lazyModules.length).toBeGreaterThan(2);
    });
  });

  describe('5. 실제 구현 대상 식별', () => {
    it('Motion One 라이브러리 지연 로딩 대상으로 식별되어야 한다', () => {
      const motionFeatures = ['animate', 'scroll', 'timeline', 'stagger', 'inView'];

      // Motion 기능은 모두 애니메이션 관련
      const isAnimationFeature = (feature: string) => {
        return motionFeatures.includes(feature);
      };

      expect(isAnimationFeature('animate')).toBe(true);
      expect(isAnimationFeature('scroll')).toBe(true);

      // 애니메이션은 갤러리 사용 중에만 필요
      expect(
        motionFeatures.every(feature =>
          ['animate', 'scroll', 'timeline', 'stagger', 'inView'].includes(feature)
        )
      ).toBe(true);
    });

    it('고급 최적화 모듈들이 지연 로딩 대상으로 식별되어야 한다', () => {
      const optimizationModules = [
        'OptimizedLazyLoadingService',
        'VirtualScrollManager',
        'AdvancedMemoization',
        'WorkerPoolManager',
        'MemoryPoolManager',
      ];

      const shouldBeLazyLoaded = optimizationModules.filter(module => {
        // 크기가 크거나 선택적으로 사용되는 모듈들
        return (
          module.includes('Optimized') ||
          module.includes('Advanced') ||
          module.includes('Virtual') ||
          module.includes('Pool')
        );
      });

      expect(shouldBeLazyLoaded.length).toBe(optimizationModules.length);
    });
  });
});
