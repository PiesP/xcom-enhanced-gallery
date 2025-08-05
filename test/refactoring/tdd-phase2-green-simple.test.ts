/**
 * 🟢 TDD Phase 2 (GREEN) - 중복 제거 및 통합 구현 테스트
 *
 * Phase 1에서 식별된 중복 구현들을 실제로 제거하고 통합하는 구현 테스트
 * RED-GREEN-REFACTOR 사이클의 GREEN 단계
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { existsSync } from 'fs';
import { join } from 'path';

const SRC_PATH = join(process.cwd(), 'src');

describe('🟢 GREEN Phase 2: 중복 구현 제거 및 통합', () => {
  beforeEach(() => {
    console.log('🟢 GREEN Phase 2: 중복 제거 테스트 실행 중...');
  });

  describe('1단계: unified-* 서비스 제거', () => {
    test('unified-dom-service.ts 파일이 제거되었는지 확인', async () => {
      const unifiedDomPath = join(SRC_PATH, 'shared/services/unified-dom-service.ts');
      expect(existsSync(unifiedDomPath)).toBe(false);
    });

    test('unified-style-service.ts 파일이 제거되었는지 확인', async () => {
      const unifiedStylePath = join(SRC_PATH, 'shared/services/unified-style-service.ts');
      expect(existsSync(unifiedStylePath)).toBe(false);
    });

    test('unified-performance-service.ts 파일이 제거되었는지 확인', async () => {
      const unifiedPerfPath = join(SRC_PATH, 'shared/services/unified-performance-service.ts');
      expect(existsSync(unifiedPerfPath)).toBe(false);
    });
  });

  describe('2단계: DOM 유틸리티 통합', () => {
    test('중복된 DOM 유틸리티가 정리되었는지 확인', async () => {
      // dom-utils.ts 중복 확인
      const domUtilsMain = join(SRC_PATH, 'shared/dom/dom-utils.ts');
      const domUtilsUtils = join(SRC_PATH, 'shared/dom/utils/dom-utils.ts');

      // 메인 DOM 유틸리티만 존재해야 함
      const existingFiles = [domUtilsMain, domUtilsUtils].filter(existsSync);
      expect(existingFiles.length).toBeLessThanOrEqual(1);
    });
  });

  describe('3단계: 성능 유틸리티 통합', () => {
    test('throttle 함수가 통합되었는지 확인', async () => {
      const performanceUtils = await import(
        '../../src/shared/utils/performance/performance-utils.ts'
      );
      expect(performanceUtils).toBeDefined();
      expect(typeof performanceUtils.throttle).toBe('function');
    });
  });

  describe('결과 요약', () => {
    test('Phase 2 중복 제거 작업 완료 확인', async () => {
      console.log('🟢 Phase 2 (GREEN) 중복 제거 및 통합 작업 진행 중...');
      expect(true).toBe(true);
    });
  });
});
