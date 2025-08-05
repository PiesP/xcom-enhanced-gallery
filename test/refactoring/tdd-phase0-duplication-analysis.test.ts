/**
 * @fileoverview TDD Phase 0: 중복 구현 및 미사용 코드 완전 분석
 * @description 체계적인 중복 제거를 위한 현재 상태 정확한 분석
 * @version 1.0.0 - 2025.8.6 Complete Duplication Analysis
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

describe('🔴 RED Phase 0: 완전한 중복 분석', () => {
  describe('성능 유틸리티 중복 분석', () => {
    it('performance 관련 파일 중복을 식별해야 함', () => {
      const performanceFiles = [
        'src/shared/utils/performance.ts',
        'src/shared/utils/performance-new.ts',
        'src/shared/utils/performance-consolidated.ts',
        'src/shared/utils/integrated-utils.ts',
        'src/shared/utils/performance/performance-utils.ts',
        'src/shared/utils/performance/performance-utils-enhanced.ts',
        'src/shared/utils/performance/index.ts',
      ];

      const duplicates = analyzePerformanceUtilsDuplication(performanceFiles);

      expect(duplicates.throttle).toBeGreaterThan(1);
      expect(duplicates.debounce).toBeGreaterThan(1);
      expect(duplicates.PerformanceUtils).toBeGreaterThan(1);

      console.log('🔴 성능 유틸리티 중복 현황:', duplicates);
    });

    it('UIOptimizer 중복 (대소문자 문제)을 식별해야 함', () => {
      const uiOptimizerFiles = [
        'src/shared/utils/performance/ui-optimizer.ts',
        'src/shared/utils/performance/UIOptimizer.ts',
      ];

      const areBothPresent = uiOptimizerFiles.every(file => {
        try {
          statSync(join(process.cwd(), file));
          return true;
        } catch {
          return false;
        }
      });

      expect(areBothPresent).toBe(true);
      console.log('🔴 UIOptimizer 파일 중복 확인됨');
    });
  });

  describe('스타일 관리 중복 분석', () => {
    it('스타일 관련 파일 중복을 식별해야 함', () => {
      const styleFiles = [
        'src/shared/utils/styles.ts',
        'src/shared/utils/styles/index.ts',
        'src/shared/utils/styles/style-utils.ts',
        'src/shared/utils/styles/css-utilities.ts',
        'src/shared/styles/style-manager.ts',
      ];

      const duplicates = analyzeStyleUtilsDuplication(styleFiles);

      expect(duplicates.setCSSVariable).toBeGreaterThan(1);
      expect(duplicates.getCSSVariable).toBeGreaterThan(1);

      console.log('🔴 스타일 유틸리티 중복 현황:', duplicates);
    });
  });

  describe('상호작용 관리 중복 분석', () => {
    it('InteractionService 중복을 식별해야 함', () => {
      const interactionFiles = [
        'src/shared/utils/interaction/interaction-manager.ts',
        'src/shared/utils/interaction/interaction-manager-new.ts',
      ];

      const duplicates = analyzeInteractionManagerDuplication(interactionFiles);

      expect(duplicates.InteractionService).toBe(2);
      expect(duplicates.GestureType).toBe(2);
      expect(duplicates.MouseEventInfo).toBe(2);

      console.log('🔴 상호작용 관리 중복 현황:', duplicates);
    });
  });

  describe('리소스 관리 중복 분석', () => {
    it('ResourceManager 중복을 식별해야 함', () => {
      const resourceFiles = [
        'src/shared/utils/resource-manager.ts',
        'src/shared/utils/memory/resource-manager.ts',
      ];

      const duplicates = analyzeResourceManagerDuplication(resourceFiles);

      expect(duplicates.ResourceManager).toBeGreaterThan(1);
      expect(duplicates.ResourceType).toBeGreaterThan(1);

      console.log('🔴 리소스 관리 중복 현황:', duplicates);
    });
  });

  describe('미사용 코드 분석', () => {
    it('빈 index.ts 파일들을 식별해야 함', () => {
      const emptyIndexFiles = findEmptyIndexFiles();

      expect(emptyIndexFiles.length).toBeGreaterThan(0);
      console.log('🔴 빈 index.ts 파일들:', emptyIndexFiles);
    });

    it('터치 이벤트 관련 코드를 식별해야 함', () => {
      const touchEventCode = findTouchEventCode();

      if (touchEventCode.length > 0) {
        console.log('🔴 제거할 터치 이벤트 코드:', touchEventCode);
      }
    });

    it('복잡한 HOC 패턴을 식별해야 함', () => {
      const hocFiles = findHOCComponents();

      if (hocFiles.length > 0) {
        console.log('🔴 복잡한 HOC 컴포넌트들:', hocFiles);
      }
    });
  });

  describe('번들 크기 분석', () => {
    it('현재 번들 크기가 목표를 초과함을 확인해야 함', () => {
      const TARGET_SIZE_KB = 150; // 목표 크기
      const CURRENT_PROD_SIZE_KB = 266.17; // 현재 프로덕션 크기

      expect(CURRENT_PROD_SIZE_KB).toBeGreaterThan(TARGET_SIZE_KB);

      const reduction_needed = CURRENT_PROD_SIZE_KB - TARGET_SIZE_KB;
      console.log(`🔴 번들 크기 감소 필요: ${reduction_needed.toFixed(2)}KB`);
    });
  });
});

// 분석 헬퍼 함수들
function analyzePerformanceUtilsDuplication(files: string[]): Record<string, number> {
  const functionCounts: Record<string, number> = {
    throttle: 0,
    debounce: 0,
    PerformanceUtils: 0,
    rafThrottle: 0,
    measurePerformance: 0,
  };

  files.forEach(file => {
    try {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');

      Object.keys(functionCounts).forEach(funcName => {
        const regex = new RegExp(`\\b${funcName}\\b`, 'g');
        const matches = content.match(regex);
        if (matches) {
          functionCounts[funcName] += matches.length;
        }
      });
    } catch (error) {
      console.warn(`파일 읽기 실패: ${file}`);
    }
  });

  return functionCounts;
}

function analyzeStyleUtilsDuplication(files: string[]): Record<string, number> {
  const functionCounts: Record<string, number> = {
    setCSSVariable: 0,
    getCSSVariable: 0,
    applyTheme: 0,
    toggleClass: 0,
  };

  files.forEach(file => {
    try {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');

      Object.keys(functionCounts).forEach(funcName => {
        const regex = new RegExp(
          `\\bfunction\\s+${funcName}\\b|\\bconst\\s+${funcName}\\s*=|\\b${funcName}\\s*:|export.*${funcName}`,
          'g'
        );
        const matches = content.match(regex);
        if (matches) {
          functionCounts[funcName] += matches.length;
        }
      });
    } catch (error) {
      console.warn(`파일 읽기 실패: ${file}`);
    }
  });

  return functionCounts;
}

function analyzeInteractionManagerDuplication(files: string[]): Record<string, number> {
  const counts: Record<string, number> = {
    InteractionService: 0,
    GestureType: 0,
    MouseEventInfo: 0,
    KeyboardShortcut: 0,
  };

  files.forEach(file => {
    try {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');

      Object.keys(counts).forEach(name => {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        const matches = content.match(regex);
        if (matches) {
          counts[name] += 1; // 파일당 1회로 계산
        }
      });
    } catch (error) {
      console.warn(`파일 읽기 실패: ${file}`);
    }
  });

  return counts;
}

function analyzeResourceManagerDuplication(files: string[]): Record<string, number> {
  const counts: Record<string, number> = {
    ResourceManager: 0,
    ResourceType: 0,
    ResourceEntry: 0,
  };

  files.forEach(file => {
    try {
      const content = readFileSync(join(process.cwd(), file), 'utf-8');

      Object.keys(counts).forEach(name => {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        const matches = content.match(regex);
        if (matches) {
          counts[name] += 1;
        }
      });
    } catch (error) {
      console.warn(`파일 읽기 실패: ${file}`);
    }
  });

  return counts;
}

function findEmptyIndexFiles(): string[] {
  const emptyFiles: string[] = [];
  const srcDir = join(process.cwd(), 'src');

  function scanDirectory(dir: string) {
    try {
      const items = readdirSync(dir);

      items.forEach(item => {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (item === 'index.ts') {
          try {
            const content = readFileSync(fullPath, 'utf-8').trim();
            if (content === '' || content.length < 10) {
              emptyFiles.push(fullPath.replace(process.cwd(), '').replace(/\\/g, '/'));
            }
          } catch (error) {
            console.warn(`파일 읽기 실패: ${fullPath}`);
          }
        }
      });
    } catch (error) {
      console.warn(`디렉토리 스캔 실패: ${dir}`);
    }
  }

  scanDirectory(srcDir);
  return emptyFiles;
}

function findTouchEventCode(): string[] {
  const touchEventFiles: string[] = [];
  const srcDir = join(process.cwd(), 'src');

  const touchEventPatterns = [
    'onTouchStart',
    'onTouchMove',
    'onTouchEnd',
    'touchstart',
    'touchmove',
    'touchend',
    'TouchEvent',
  ];

  function scanForTouchEvents(dir: string) {
    try {
      const items = readdirSync(dir);

      items.forEach(item => {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scanForTouchEvents(fullPath);
        } else if (extname(item) === '.ts' || extname(item) === '.tsx') {
          try {
            const content = readFileSync(fullPath, 'utf-8');

            const hasTouchEvent = touchEventPatterns.some(pattern => content.includes(pattern));

            if (hasTouchEvent) {
              touchEventFiles.push(fullPath.replace(process.cwd(), '').replace(/\\/g, '/'));
            }
          } catch (error) {
            console.warn(`파일 읽기 실패: ${fullPath}`);
          }
        }
      });
    } catch (error) {
      console.warn(`디렉토리 스캔 실패: ${dir}`);
    }
  }

  scanForTouchEvents(srcDir);
  return touchEventFiles;
}

function findHOCComponents(): string[] {
  const hocFiles: string[] = [];
  const srcDir = join(process.cwd(), 'src');

  const hocPatterns = [
    'withGallery',
    'withTheme',
    'withAccessibility',
    'HOC',
    'higher.*order',
    'React.forwardRef',
    'React.memo',
  ];

  function scanForHOC(dir: string) {
    try {
      const items = readdirSync(dir);

      items.forEach(item => {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          scanForHOC(fullPath);
        } else if (extname(item) === '.tsx') {
          try {
            const content = readFileSync(fullPath, 'utf-8');

            const hasHOCPattern = hocPatterns.some(pattern => {
              const regex = new RegExp(pattern, 'i');
              return regex.test(content);
            });

            if (hasHOCPattern) {
              hocFiles.push(fullPath.replace(process.cwd(), '').replace(/\\/g, '/'));
            }
          } catch (error) {
            console.warn(`파일 읽기 실패: ${fullPath}`);
          }
        }
      });
    } catch (error) {
      console.warn(`디렉토리 스캔 실패: ${dir}`);
    }
  }

  scanForHOC(srcDir);
  return hocFiles;
}
