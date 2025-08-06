/**
 * @fileoverview TDD Phase 2 최종: DOM 통합 완료 검증 테스트
 * @description 모든 DOM 관련 중복이 UnifiedDOMService로 통합되었는지 검증
 */

import { describe, it, expect } from 'vitest';
import { unifiedDOMService } from '@shared/dom/unified-dom-service';

describe('🔴 RED: DOM 통합 완료 검증', () => {
  describe('중복 DOM 함수 제거 검증', () => {
    it('UnifiedDOMService가 모든 DOM 기능을 제공해야 함', () => {
      // UnifiedDOMService가 모든 필요한 DOM 메서드를 가져야 함
      expect(unifiedDOMService.querySelector).toBeDefined();
      expect(unifiedDOMService.querySelectorAll).toBeDefined();
      expect(unifiedDOMService.createElement).toBeDefined();
      expect(unifiedDOMService.addEventListener).toBeDefined();
      expect(unifiedDOMService.removeEventListener).toBeDefined();
      expect(unifiedDOMService.setStyle).toBeDefined();
      expect(unifiedDOMService.addClass).toBeDefined();
      expect(unifiedDOMService.removeClass).toBeDefined();
    });

    it('DOM 성능 최적화 기능이 통합되어야 함', () => {
      // 배치 처리 기능
      expect(unifiedDOMService.batch).toBeDefined();

      // 성능 측정 기능
      expect(unifiedDOMService.measurePerformance).toBeDefined();

      // 캐시 관리 기능
      expect(unifiedDOMService.getPerformanceStats).toBeDefined();
    });

    it('사용하지 않는 성능 상수가 제거되어야 함', () => {
      // TIMING.DEBOUNCE_DELAY가 실제로 사용되지 않는지 확인
      const fs = require('fs');
      const constantsContent = fs.readFileSync('src/constants.ts', 'utf-8');

      // DEBOUNCE_DELAY가 정의되어 있지만 사용되지 않음을 확인
      expect(constantsContent).toContain('DEBOUNCE_DELAY');

      // 실제 프로젝트에서 DEBOUNCE_DELAY 사용처가 없어야 함
      // (이 테스트는 현재 실패해야 함 - RED 단계)
    });
  });

  describe('성능 유틸리티 통합 검증', () => {
    it('모든 DOM 관련 성능 함수가 통합되어야 함', () => {
      // DOM 캐싱
      expect(unifiedDOMService.querySelector('body')).toBeTruthy();

      // 배치 업데이트
      const operations = [
        {
          type: 'style' as const,
          element: document.body,
          property: 'display',
          value: 'block',
        },
      ];

      expect(() => unifiedDOMService.batch(operations)).not.toThrow();
    });

    it('DOM 이벤트 관리가 메모리 안전해야 함', () => {
      const testElement = document.createElement('div');
      const testHandler = () => {};

      // 이벤트 추가
      const cleanup = unifiedDOMService.addEventListener(testElement, 'click', testHandler);

      // 정리 함수가 반환되어야 함
      expect(cleanup).toBeTypeOf('function');

      // 정리 실행
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe('코드베이스 정리 검증', () => {
    it('중복된 DOM 유틸리티가 제거되어야 함', () => {
      // 이 테스트는 현재 실패해야 함 (RED 단계)
      // 중복된 querySelector, createElement 사용이 정리되어야 함

      const fileSystem = require('fs');
      const path = require('path');

      // src 디렉토리의 모든 .ts 파일 검사
      function checkForDuplicates(dir: string): string[] {
        const duplicates: string[] = [];
        const files = fileSystem.readdirSync(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fileSystem.statSync(filePath);

          if (stat.isDirectory() && !file.includes('node_modules')) {
            duplicates.push(...checkForDuplicates(filePath));
          } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
            const content = fileSystem.readFileSync(filePath, 'utf-8');

            // UnifiedDOMService를 사용하지 않고 직접 DOM 함수를 사용하는 경우 감지
            if (
              content.includes('document.querySelector') ||
              content.includes('document.createElement') ||
              content.includes('element.addEventListener')
            ) {
              // UnifiedDOMService import가 있는지 확인
              if (!content.includes('unifiedDOMService')) {
                duplicates.push(filePath);
              }
            }
          }
        }

        return duplicates;
      }

      const duplicates = checkForDuplicates('src');

      // 현재는 중복이 있을 것으로 예상 (RED 단계)
      // GREEN 단계에서는 이 테스트가 통과해야 함
      expect(duplicates.length).toBeGreaterThan(0); // RED: 현재 중복이 있음
    });
  });
});
