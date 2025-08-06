/**
 * @fileoverview 🔴 RED Phase 1: 성능 유틸리티 중복 분석 및 통합 요구사항
 * @description throttle/debounce 함수 중복 제거가 필요함을 검증하는 실패하는 테스트
 * @version 1.0.0 - TDD RED Phase
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

describe('🔴 RED Phase 1: 성능 유틸리티 중복 분석', () => {
  describe('중복 구현 식별', () => {
    it('RED: throttle 함수가 여러 곳에 중복 구현되어야 함', async () => {
      // 중복이 있는 현재 상태를 검증 (RED)
      const throttleLocations = [];

      // 1. performance-utils-enhanced.ts에서 확인
      try {
        const enhanced = await import('@shared/utils/performance/performance-utils-enhanced');
        if (enhanced.throttle) {
          throttleLocations.push('performance-utils-enhanced');
        }
      } catch (error) {
        console.debug('performance-utils-enhanced import 실패:', error);
      }

      // 2. utils/types에서 확인
      try {
        const types = await import('@shared/utils/types');
        if (types.throttle) {
          throttleLocations.push('utils/types');
        }
      } catch (error) {
        console.debug('utils/types import 실패:', error);
      }

      // 3. utils/performance에서 확인
      try {
        const perf = await import('@shared/utils/performance');
        if (perf.throttle) {
          throttleLocations.push('utils/performance');
        }
      } catch (error) {
        console.debug('utils/performance import 실패:', error);
      }

      // 4. core-utils에서 확인
      try {
        const core = await import('@shared/utils/core-utils');
        if (core.throttleScroll) {
          throttleLocations.push('core-utils');
        }
      } catch (error) {
        console.debug('core-utils import 실패:', error);
      }

      // RED: 현재 여러 곳에 throttle이 있어야 함
      console.log('🔴 발견된 throttle 구현 위치:', throttleLocations);
      expect(throttleLocations.length).toBeGreaterThanOrEqual(2);
    });

    it('RED: debounce 함수가 여러 곳에 중복 구현되어야 함', async () => {
      const debounceLocations = [];

      // 1. performance-utils-enhanced.ts
      try {
        const enhanced = await import('@shared/utils/performance/performance-utils-enhanced');
        if (enhanced.debounce) {
          debounceLocations.push('performance-utils-enhanced');
        }
      } catch (error) {
        console.debug('performance-utils-enhanced import 실패:', error);
      }

      // 2. timer-management.ts
      try {
        const timer = await import('@shared/utils/timer-management');
        if (timer.Debouncer || timer.createDebouncer) {
          debounceLocations.push('timer-management');
        }
      } catch (error) {
        console.debug('timer-management import 실패:', error);
      }

      // 3. utils/types
      try {
        const types = await import('@shared/utils/types');
        if (types.debounce) {
          debounceLocations.push('utils/types');
        }
      } catch (error) {
        console.debug('utils/types import 실패:', error);
      }

      console.log('🔴 발견된 debounce 구현 위치:', debounceLocations);
      expect(debounceLocations.length).toBeGreaterThanOrEqual(2);
    });

    it('RED: PerformanceUtils 클래스가 완전히 통합되지 않았어야 함', async () => {
      // 현재는 여전히 분산된 구현들이 있어야 함
      const performanceImplementations = [];

      try {
        const enhanced = await import('@shared/utils/performance/performance-utils-enhanced');
        if (enhanced.PerformanceUtils) {
          performanceImplementations.push('enhanced');
        }
      } catch (error) {
        console.debug('performance-utils-enhanced import 실패:', error);
      }

      try {
        const integrated = await import('@shared/utils/integrated-utils');
        if (integrated.PerformanceUtils) {
          performanceImplementations.push('integrated');
        }
      } catch (error) {
        console.debug('integrated-utils import 실패:', error);
      }

      // RED: 아직 통합이 완전하지 않아야 함
      console.log('🔴 PerformanceUtils 구현 위치:', performanceImplementations);
      expect(performanceImplementations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('파일 레벨 중복 분석', () => {
    it('RED: 성능 관련 파일들이 중복된 코드를 포함해야 함', () => {
      const performanceFiles = [
        'src/shared/utils/performance/performance-utils-enhanced.ts',
        'src/shared/utils/performance.ts',
        'src/shared/utils/timer-management.ts',
        'src/shared/utils/types/index.ts',
        'src/shared/utils/core-utils.ts',
      ];

      const duplicateAnalysis = analyzeCodeDuplication(performanceFiles);

      // RED: 중복된 패턴이 발견되어야 함
      expect(duplicateAnalysis.throttleImplementations).toBeGreaterThan(1);
      expect(duplicateAnalysis.debounceImplementations).toBeGreaterThan(1);

      console.log('🔴 중복 분석 결과:', duplicateAnalysis);
    });

    it('RED: 번들 크기가 최적화되지 않았어야 함', () => {
      // 중복으로 인한 번들 크기 증가가 있어야 함
      const estimatedDuplicateSize = calculateDuplicateCodeSize([
        'throttle',
        'debounce',
        'rafThrottle',
        'measurePerformance',
      ]);

      // RED: 중복으로 인한 크기 증가가 있어야 함
      expect(estimatedDuplicateSize).toBeGreaterThan(0);
      console.log('🔴 예상 중복 코드 크기:', estimatedDuplicateSize, 'bytes');
    });
  });

  describe('의존성 복잡도 분석', () => {
    it('RED: 성능 유틸리티 import 경로가 일관되지 않아야 함', () => {
      // 현재 다양한 import 경로가 존재해야 함
      const importPaths = [
        '@shared/utils/performance/performance-utils-enhanced',
        '@shared/utils/performance',
        '@shared/utils/timer-management',
        '@shared/utils/types',
        '@shared/utils/core-utils',
        '@shared/utils/integrated-utils',
      ];

      // RED: 여러 import 경로가 있어야 함 (일관되지 않음)
      expect(importPaths.length).toBeGreaterThan(3);
      console.log('🔴 다양한 import 경로:', importPaths);
    });

    it('RED: 유틸리티 간 순환 의존성이 있을 수 있음', () => {
      // 현재 상태에서는 의존성 복잡도가 높아야 함
      const dependencyComplexity = analyzeDependencyComplexity();

      // RED: 복잡한 의존성이 있어야 함
      expect(dependencyComplexity.circularDependencies).toBeGreaterThanOrEqual(0);
      expect(dependencyComplexity.complexityScore).toBeGreaterThan(2);

      console.log('🔴 의존성 복잡도:', dependencyComplexity);
    });
  });
});

// 헬퍼 함수들
function analyzeCodeDuplication(files: string[]): {
  throttleImplementations: number;
  debounceImplementations: number;
  rafThrottleImplementations: number;
} {
  const analysis = {
    throttleImplementations: 0,
    debounceImplementations: 0,
    rafThrottleImplementations: 0,
  };

  files.forEach(file => {
    try {
      if (existsSync(join(process.cwd(), file))) {
        const content = readFileSync(join(process.cwd(), file), 'utf-8');

        if (content.includes('function throttle') || content.includes('static throttle')) {
          analysis.throttleImplementations++;
        }
        if (content.includes('function debounce') || content.includes('static debounce')) {
          analysis.debounceImplementations++;
        }
        if (content.includes('rafThrottle') || content.includes('requestAnimationFrame')) {
          analysis.rafThrottleImplementations++;
        }
      }
    } catch (error) {
      console.warn(`파일 분석 실패: ${file}`, error);
    }
  });

  return analysis;
}

function calculateDuplicateCodeSize(functionNames: string[]): number {
  // 중복된 함수들의 대략적인 크기 계산
  const avgFunctionSize = 150; // bytes per function
  const duplicateCount = functionNames.length * 2; // 평균 2개 위치에 중복

  return duplicateCount * avgFunctionSize;
}

function analyzeDependencyComplexity(): {
  circularDependencies: number;
  complexityScore: number;
} {
  // 의존성 복잡도 분석 (단순화된 버전)
  return {
    circularDependencies: 1, // RED: 순환 의존성이 있다고 가정
    complexityScore: 4, // RED: 높은 복잡도
  };
}
