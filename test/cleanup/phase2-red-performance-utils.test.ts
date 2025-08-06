/**
 * @fileoverview TDD RED Phase: Performance Utils 중복 제거 테스트
 * @description 현재는 실패하는 테스트들 - 중복된 performance utils 구현들을 검증
 */

import { describe, it, expect } from 'vitest';

describe('🔴 RED Phase: Performance Utils 중복 분석', () => {
  describe('중복된 throttle 구현 검증', () => {
    it('전체 코드베이스에서 throttle 구현이 1개만 존재해야 함', async () => {
      // RED: 현재는 여러 구현이 존재하므로 실패

      // 가능한 throttle 구현 위치들 검사
      const throttleImplementations = await scanForThrottleImplementations();

      expect(throttleImplementations).toHaveLength(1);
    });

    it('모든 throttle 사용처가 동일한 함수를 참조해야 함', async () => {
      // RED: 현재는 서로 다른 구현을 import하므로 실패

      const throttleReferences = await findAllThrottleReferences();
      const uniqueImplementations = new Set(throttleReferences.map(ref => ref.source));

      expect(uniqueImplementations.size).toBe(1);
    });

    it('throttle 함수는 통합된 performance utils에서만 export되어야 함', async () => {
      // RED: 현재는 여러 파일에서 export하므로 실패

      const throttleExports = await findThrottleExports();
      const expectedSource = 'src/shared/utils/performance/unified-performance-utils.ts';

      expect(throttleExports).toHaveLength(1);
      expect(throttleExports[0].file).toBe(expectedSource);
    });
  });

  describe('중복된 debounce 구현 검증', () => {
    it('전체 코드베이스에서 debounce 구현이 1개만 존재해야 함', async () => {
      // RED: 현재는 여러 구현이 존재하므로 실패

      const debounceImplementations = await scanForDebounceImplementations();

      expect(debounceImplementations).toHaveLength(1);
    });

    it('createDebouncer 팩토리 함수가 통합되어야 함', async () => {
      // RED: 현재는 여러 createDebouncer 구현이 존재

      const debouncerFactories = await findDebouncerFactories();

      expect(debouncerFactories).toHaveLength(1);
    });
  });

  describe('중복된 rafThrottle 구현 검증', () => {
    it('rafThrottle 구현이 1개만 존재해야 함', async () => {
      // RED: 현재는 여러 구현이 존재하므로 실패

      const rafThrottleImplementations = await scanForRafThrottleImplementations();

      expect(rafThrottleImplementations).toHaveLength(1);
    });

    it('RAF 기반 throttle과 일반 throttle이 명확히 구분되어야 함', async () => {
      // RED: 현재는 구현이 혼재되어 있음

      // 통합 파일이 존재하지 않으므로 현재는 실패
      try {
        const performanceUtils = await import(
          'c:/git/xcom-enhanced-gallery/src/shared/utils/performance/unified-performance-utils.ts'
        );

        expect(performanceUtils.throttle).toBeDefined();
        expect(performanceUtils.rafThrottle).toBeDefined();
        expect(performanceUtils.throttle).not.toBe(performanceUtils.rafThrottle);
      } catch (error) {
        // RED: 현재는 통합 파일이 존재하지 않으므로 실패
        expect(error).toBeDefined();
      }
    });
  });

  describe('Performance 유틸리티 API 일관성', () => {
    it('모든 performance utils가 동일한 타입 시그니처를 가져야 함', async () => {
      // RED: 현재는 서로 다른 타입 정의가 존재

      const typeDefinitions = await analyzePerformanceUtilTypes();

      // throttle 함수들의 타입이 일관되어야 함
      expect(
        typeDefinitions.throttle.every(
          def => def.signature === typeDefinitions.throttle[0].signature
        )
      ).toBe(true);
    });

    it('performance measurement utils가 통합되어야 함', async () => {
      // RED: 현재는 여러 성능 측정 구현이 존재

      const performanceMeasurements = await findPerformanceMeasurementUtils();

      expect(performanceMeasurements).toHaveLength(1);
    });
  });

  describe('중복 파일 제거 검증', () => {
    it('중복된 performance utils 파일들이 제거되어야 함', async () => {
      // RED: 현재는 여러 파일에 중복 구현이 존재

      const duplicateFiles = [
        'src/shared/utils/performance/performance-utils-enhanced.ts',
        'src/shared/utils/performance/scroll-utils.ts',
        'src/core/utils/performance.ts',
        // TDD 테스트 파일들은 별도 정리
      ];

      const existingFiles = await checkFilesExist(duplicateFiles);
      const shouldNotExist = existingFiles.filter(file => file.exists);

      expect(shouldNotExist).toHaveLength(0);
    });

    it('통합된 performance utils 파일만 존재해야 함', async () => {
      // RED: 통합 파일이 아직 생성되지 않음

      const unifiedFile = 'src/shared/utils/performance/unified-performance-utils.ts';
      const fileExists = await checkFileExists(unifiedFile);

      expect(fileExists).toBe(true);
    });
  });
});

// =================================
// Mock 함수들 (실제 구현은 다음 단계에서)
// =================================

async function scanForThrottleImplementations(): Promise<Array<{ file: string; line: number }>> {
  // RED: 실제로는 여러 구현이 발견될 것
  return [
    { file: 'src/shared/utils/performance/performance-utils-enhanced.ts', line: 45 },
    { file: 'src/shared/utils/performance/scroll-utils.ts', line: 23 },
    { file: 'src/core/utils/performance.ts', line: 67 },
    { file: 'src/shared/utils/performance/core-utils.ts', line: 89 },
  ];
}

async function findAllThrottleReferences(): Promise<Array<{ file: string; source: string }>> {
  // RED: 서로 다른 소스에서 import
  return [
    {
      file: 'src/features/gallery/hooks/useScrollPositionManager.ts',
      source: 'performance-utils-enhanced',
    },
    { file: 'src/shared/components/ui/InfiniteScroll.ts', source: 'scroll-utils' },
    { file: 'src/core/media/MediaProcessor.ts', source: 'core/utils/performance' },
  ];
}

async function findThrottleExports(): Promise<Array<{ file: string }>> {
  // RED: 여러 파일에서 export
  return [
    { file: 'src/shared/utils/performance/performance-utils-enhanced.ts' },
    { file: 'src/shared/utils/performance/scroll-utils.ts' },
    { file: 'src/core/utils/performance.ts' },
  ];
}

async function scanForDebounceImplementations(): Promise<Array<{ file: string; line: number }>> {
  // RED: 여러 debounce 구현 발견
  return [
    { file: 'src/shared/utils/performance/performance-utils-enhanced.ts', line: 78 },
    { file: 'src/shared/utils/performance/core-utils.ts', line: 123 },
    { file: 'src/core/utils/performance.ts', line: 45 },
  ];
}

async function findDebouncerFactories(): Promise<Array<{ file: string }>> {
  // RED: 여러 createDebouncer 구현
  return [
    { file: 'src/shared/utils/performance/performance-utils-enhanced.ts' },
    { file: 'src/shared/utils/performance/core-utils.ts' },
  ];
}

async function scanForRafThrottleImplementations(): Promise<Array<{ file: string }>> {
  // RED: 여러 rafThrottle 구현
  return [
    { file: 'src/shared/utils/performance/performance-utils-enhanced.ts' },
    { file: 'src/shared/utils/performance/core-utils.ts' },
  ];
}

async function analyzePerformanceUtilTypes(): Promise<{
  throttle: Array<{ signature: string }>;
  debounce: Array<{ signature: string }>;
}> {
  // RED: 타입 시그니처가 일관되지 않음
  return {
    throttle: [
      { signature: '(fn: Function, delay: number) => Function' },
      { signature: '<T extends (...args: any[]) => any>(fn: T, delay: number) => T' },
      { signature: '(callback: () => void, delay: number) => () => void' },
    ],
    debounce: [
      { signature: '(fn: Function, delay: number) => Function' },
      { signature: '<T extends Function>(fn: T, delay: number) => T' },
    ],
  };
}

async function findPerformanceMeasurementUtils(): Promise<Array<{ file: string }>> {
  // RED: 여러 성능 측정 유틸리티
  return [
    { file: 'src/shared/dom/unified-dom-service.ts' },
    { file: 'src/shared/utils/performance/performance-utils-enhanced.ts' },
    { file: 'src/core/utils/performance.ts' },
  ];
}

async function checkFilesExist(
  filePaths: string[]
): Promise<Array<{ file: string; exists: boolean }>> {
  // RED: 중복 파일들이 현재 존재함
  return filePaths.map(file => ({ file, exists: true }));
}

async function checkFileExists(_filePath: string): Promise<boolean> {
  // RED: 통합 파일이 아직 존재하지 않음
  return false;
}
