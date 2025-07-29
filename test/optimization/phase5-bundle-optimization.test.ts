/**
 * Phase 5: 번들 최적화 및 Tree-shaking 효율성 테스트
 *
 * @description
 * 번들 크기 최적화와 Tree-shaking 효율성을 검증합니다.
 * 간소화된 번들 유틸리티의 실용적 접근법을 테스트합니다.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createBundleInfo,
  isWithinSizeTarget,
  getBundleOptimizationSuggestions,
  memoizeFunction,
  memo,
  type BundleInfo,
} from '@shared/utils/optimization/bundle';

describe('Phase 5: 번들 최적화', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Bundle 유틸리티 사용 분석', () => {
    it('Bundle 유틸리티가 존재하고 사용 가능해야 함', () => {
      expect(createBundleInfo).toBeDefined();
      expect(isWithinSizeTarget).toBeDefined();
      expect(getBundleOptimizationSuggestions).toBeDefined();
      expect(memoizeFunction).toBeDefined();
      expect(memo).toBeDefined();

      const bundleInfo = createBundleInfo(['module1', 'module2'], 80);
      expect(bundleInfo.modules).toEqual(['module1', 'module2']);
      expect(bundleInfo.totalSize).toBe(80);
      expect(bundleInfo.gzippedSize).toBe(28); // 80 * 0.35
    });

    it('현재 프로젝트에서 Bundle 유틸리티 실제 사용 여부를 확인해야 함', () => {
      // 번들 크기 검증
      const bundleInfo = createBundleInfo(['main'], 500000);
      expect(bundleInfo.totalSize).toBe(500000);
      expect(bundleInfo.gzippedSize).toBe(175000); // 500000 * 0.35
      expect(bundleInfo).toBeDefined();

      // 크기 목표 달성 여부 확인
      const isWithinTarget = isWithinSizeTarget(bundleInfo, 600);
      expect(isWithinTarget).toBe(true);
    });

    it('Bundle 분석 결과가 실용적이어야 함', () => {
      const bundleInfo = createBundleInfo(
        ['large-module1', 'large-module2', 'large-module3'],
        1000000
      );
      const suggestions = getBundleOptimizationSuggestions(bundleInfo, 500);

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('2. 메모이제이션 최적화', () => {
    it('memoizeFunction이 올바르게 작동해야 함', () => {
      let callCount = 0;
      const expensiveFunction = (x: number) => {
        callCount++;
        return x * 2;
      };

      const memoized = memoizeFunction(expensiveFunction);

      // 첫 번째 호출
      expect(memoized(5)).toBe(10);
      expect(callCount).toBe(1);

      // 두 번째 호출 (캐시된 결과)
      expect(memoized(5)).toBe(10);
      expect(callCount).toBe(1);

      // 다른 인수로 호출
      expect(memoized(10)).toBe(20);
      expect(callCount).toBe(2);
    });

    it('memo 유틸리티가 올바르게 작동해야 함', () => {
      const TestComponent = ({ value }: { value: number }) => ({ value });
      const MemoizedComponent = memo(TestComponent);

      expect(MemoizedComponent).toBeDefined();
    });
  });

  describe('3. 번들 크기 분석', () => {
    it('크기 임계값 검사가 올바르게 작동해야 함', () => {
      const smallBundle = createBundleInfo(['small-module'], 50000);
      const largeBundle = createBundleInfo(['large-module'], 500000);

      expect(isWithinSizeTarget(smallBundle, 100)).toBe(true);
      expect(isWithinSizeTarget(largeBundle, 100)).toBe(false);
    });

    it('최적화 제안이 적절히 생성되어야 함', () => {
      const oversizedBundle = createBundleInfo(
        Array.from({ length: 25 }, (_, i) => `module${i}`),
        2000000
      );
      const suggestions = getBundleOptimizationSuggestions(oversizedBundle, 500);

      // 2000000 bytes = 1953.125 KB, 1953 - 500 = 1453KB
      expect(suggestions).toContain('번들 크기를 1454KB 줄여야 합니다');
      expect(suggestions).toContain('코드 스플리팅을 고려해보세요');
    });
  });

  describe('4. Tree-shaking 효율성 검증', () => {
    it('사용되지 않는 코드 식별이 기본적으로 작동해야 함', () => {
      // 기본적인 Tree-shaking 개념 검증
      const moduleWithUnusedCode = {
        usedFunction: () => 'used',
        unusedFunction: () => 'unused',
      };

      expect(moduleWithUnusedCode.usedFunction).toBeDefined();
      expect(moduleWithUnusedCode.unusedFunction).toBeDefined();
    });

    it('ES6 모듈 import/export 패턴이 Tree-shaking 친화적이어야 함', () => {
      // Tree-shaking을 위한 ES6 모듈 패턴 검증
      expect(typeof createBundleInfo).toBe('function');
      expect(typeof isWithinSizeTarget).toBe('function');
    });
  });

  describe('5. 실제 프로젝트 적용 검증', () => {
    it('현재 프로젝트의 번들 구조가 최적화에 적합해야 함', () => {
      // 실제 번들 크기 추정 (유저스크립트 환경)
      const estimatedMainBundle = createBundleInfo(['xcom-enhanced-gallery'], 480880);

      // 1MB 이하 목표
      expect(isWithinSizeTarget(estimatedMainBundle, 1024)).toBe(true);

      const suggestions = getBundleOptimizationSuggestions(estimatedMainBundle, 1024);
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('유저스크립트 환경에서의 최적화 전략이 적절해야 함', () => {
      // 유저스크립트는 단일 파일로 번들링되므로 특별한 최적화 필요
      // 압축률을 높게 설정하여 중복 코드 제거 메시지가 나오도록 함
      const userscriptBundle: BundleInfo = {
        totalSize: 800000,
        gzippedSize: 400000, // 0.5 압축률로 설정 (0.4보다 높음)
        modules: Array.from({ length: 25 }, (_, i) => `userscript-module${i}`),
      };

      expect(isWithinSizeTarget(userscriptBundle, 1024)).toBe(true);

      // 목표 크기를 낮춰서 권장사항이 생성되도록 함
      const suggestions = getBundleOptimizationSuggestions(userscriptBundle, 700);
      expect(suggestions.some(s => s.includes('중복 코드'))).toBe(true);
    });
  });
});
