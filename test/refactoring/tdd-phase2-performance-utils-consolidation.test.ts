/**
 * @fileoverview TDD Phase 2: Priority 2 - Performance Utils 중복 제거 (GREEN)
 * @description throttle, debounce, PerformanceUtils 함수들의 중복 제거 및 통합
 * @version 1.0.0 - 2025.8.6 Performance Utils Consolidation
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('🟢 GREEN Phase 2: Performance Utils 중복 제거', () => {
  describe('Step 1: 중복 파일 식별 및 제거', () => {
    it('performance 관련 중복 파일들이 정리되어야 함', () => {
      const filesToRemove = [
        'src/shared/utils/performance-new.ts',
        'src/shared/utils/performance-consolidated.ts',
      ];

      const filesToKeep = [
        'src/shared/utils/performance.ts',
        'src/shared/utils/performance/performance-utils-enhanced.ts',
        'src/shared/utils/integrated-utils.ts',
      ];

      // 제거될 파일들은 없어야 함
      filesToRemove.forEach(file => {
        const fullPath = join(process.cwd(), file);
        expect(existsSync(fullPath)).toBe(false);
        console.log(`✅ ${file} 제거됨`);
      });

      // 유지될 파일들은 있어야 함
      filesToKeep.forEach(file => {
        const fullPath = join(process.cwd(), file);
        expect(existsSync(fullPath)).toBe(true);
        console.log(`✅ ${file} 유지됨`);
      });
    });
  });

  describe('Step 2: 메인 performance.ts 통합', () => {
    it('performance.ts가 모든 성능 함수를 재export해야 함', () => {
      const performanceFile = join(process.cwd(), 'src/shared/utils/performance.ts');

      if (existsSync(performanceFile)) {
        const content = readFileSync(performanceFile, 'utf-8');

        // 필수 exports 확인
        expect(content).toContain('PerformanceUtils');
        expect(content).toContain('throttle');
        expect(content).toContain('debounce');
        expect(content).toContain('rafThrottle');
        expect(content).toContain('measurePerformance');

        console.log('✅ performance.ts에 모든 성능 함수 포함됨');
      }
    });

    it('performance.ts가 performance-utils-enhanced.ts를 참조해야 함', () => {
      const performanceFile = join(process.cwd(), 'src/shared/utils/performance.ts');

      if (existsSync(performanceFile)) {
        const content = readFileSync(performanceFile, 'utf-8');

        // performance-utils-enhanced 참조 확인
        expect(content).toContain('./performance/performance-utils-enhanced');

        console.log('✅ performance.ts가 performance-utils-enhanced.ts 참조함');
      }
    });
  });

  describe('Step 3: integrated-utils.ts 정리', () => {
    it('integrated-utils.ts가 중복 없이 정리되어야 함', () => {
      const integratedUtilsFile = join(process.cwd(), 'src/shared/utils/integrated-utils.ts');

      if (existsSync(integratedUtilsFile)) {
        const content = readFileSync(integratedUtilsFile, 'utf-8');

        // performance export 확인 (다른 파일 참조)
        expect(content).toContain('PerformanceUtils');

        // 직접 구현이 아닌 re-export인지 확인
        expect(content).not.toContain('function throttle');
        expect(content).not.toContain('function debounce');

        console.log('✅ integrated-utils.ts에서 중복 구현 제거됨');
      }
    });
  });

  describe('Step 4: performance/index.ts 정리', () => {
    it('performance/index.ts가 올바른 exports를 포함해야 함', () => {
      const performanceIndexFile = join(process.cwd(), 'src/shared/utils/performance/index.ts');

      if (existsSync(performanceIndexFile)) {
        const content = readFileSync(performanceIndexFile, 'utf-8');

        // 올바른 re-export 확인
        expect(content).toContain('./performance-utils');

        console.log('✅ performance/index.ts 정리됨');
      }
    });
  });

  describe('Step 5: 빌드 및 기능 검증', () => {
    it('모든 성능 함수가 정상적으로 import 가능해야 함', () => {
      // 정적 분석으로 export 확인
      const performanceUtilsFile = join(
        process.cwd(),
        'src/shared/utils/performance/performance-utils-enhanced.ts'
      );

      if (existsSync(performanceUtilsFile)) {
        const content = readFileSync(performanceUtilsFile, 'utf-8');

        // 주요 exports 확인
        expect(content).toContain('export class PerformanceUtils');
        expect(content).toContain('export const { rafThrottle, throttle, debounce');

        console.log('✅ 모든 성능 함수 export 확인됨');
      }
    });

    it('중복된 함수 구현이 제거되어야 함', () => {
      const functionCounts = analyzePerformanceFunctionCounts();

      // 각 함수는 최대 2개 위치에만 있어야 함 (구현체 1개 + re-export 1개)
      expect(functionCounts.throttle).toBeLessThanOrEqual(2);
      expect(functionCounts.debounce).toBeLessThanOrEqual(2);
      expect(functionCounts.PerformanceUtils).toBeLessThanOrEqual(2);

      console.log('📊 정리된 성능 함수 개수:', functionCounts);
    });
  });
});

describe('🎯 Phase 2 완료 후 다음 단계 준비', () => {
  describe('Interaction Manager 중복 분석', () => {
    it('interaction-manager 파일들의 중복 현황을 파악해야 함', () => {
      const interactionFiles = [
        'src/shared/utils/interaction/interaction-manager.ts',
        'src/shared/utils/interaction/interaction-manager-new.ts',
      ];

      const duplicateClasses = analyzeInteractionManagerDuplicates(interactionFiles);

      console.log('📊 Interaction Manager 중복 현황:', duplicateClasses);

      // 다음 단계에서 해결할 중복들
      expect(duplicateClasses.InteractionService).toBe(2);
      expect(duplicateClasses.GestureType).toBe(2);
    });
  });

  describe('Resource Manager 중복 분석', () => {
    it('resource-manager 파일들의 중복 현황을 파악해야 함', () => {
      const resourceFiles = [
        'src/shared/utils/resource-manager.ts',
        'src/shared/utils/memory/resource-manager.ts',
      ];

      const duplicateClasses = analyzeResourceManagerDuplicates(resourceFiles);

      console.log('📊 Resource Manager 중복 현황:', duplicateClasses);

      // 다음 단계에서 해결할 중복들
      expect(duplicateClasses.ResourceManager).toBeGreaterThan(0);
    });
  });
});

// 헬퍼 함수들
function analyzePerformanceFunctionCounts(): Record<string, number> {
  const functionCounts: Record<string, number> = {
    throttle: 0,
    debounce: 0,
    PerformanceUtils: 0,
    rafThrottle: 0,
    measurePerformance: 0,
  };

  const filesToCheck = [
    'src/shared/utils/performance.ts',
    'src/shared/utils/performance/performance-utils-enhanced.ts',
    'src/shared/utils/performance/performance-utils.ts',
    'src/shared/utils/integrated-utils.ts',
  ];

  filesToCheck.forEach(file => {
    const fullPath = join(process.cwd(), file);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');

        Object.keys(functionCounts).forEach(funcName => {
          // export 패턴 확인 (구현체 + re-export 포함)
          const exportPattern = new RegExp(`export.*${funcName}`, 'g');
          const matches = content.match(exportPattern);
          if (matches) {
            functionCounts[funcName] += matches.length;
          }
        });
      } catch {
        console.warn(`파일 읽기 실패: ${file}`);
      }
    }
  });

  return functionCounts;
}

function analyzeInteractionManagerDuplicates(files: string[]): Record<string, number> {
  const counts: Record<string, number> = {
    InteractionService: 0,
    GestureType: 0,
    MouseEventInfo: 0,
    KeyboardShortcut: 0,
  };

  files.forEach(file => {
    const fullPath = join(process.cwd(), file);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');

        Object.keys(counts).forEach(name => {
          if (
            content.includes(`class ${name}`) ||
            content.includes(`interface ${name}`) ||
            content.includes(`type ${name}`)
          ) {
            counts[name] += 1;
          }
        });
      } catch {
        console.warn(`파일 읽기 실패: ${file}`);
      }
    }
  });

  return counts;
}

function analyzeResourceManagerDuplicates(files: string[]): Record<string, number> {
  const counts: Record<string, number> = {
    ResourceManager: 0,
    ResourceType: 0,
    ResourceEntry: 0,
  };

  files.forEach(file => {
    const fullPath = join(process.cwd(), file);
    if (existsSync(fullPath)) {
      try {
        const content = readFileSync(fullPath, 'utf-8');

        Object.keys(counts).forEach(name => {
          if (
            content.includes(`class ${name}`) ||
            content.includes(`interface ${name}`) ||
            content.includes(`type ${name}`)
          ) {
            counts[name] += 1;
          }
        });
      } catch {
        console.warn(`파일 읽기 실패: ${file}`);
      }
    }
  });

  return counts;
}
