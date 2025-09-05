/**
 * @fileoverview UnifiedToolbarButton Component Tokenization Tests
 * @description TDD 기반 UnifiedToolbarButton의 border-radius 토큰화 검증
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('UnifiedToolbarButton Component Tokenization', () => {
  let toolbarButtonCssContent: string;

  beforeEach(() => {
    const cssPath = resolve(
      __dirname,
      '../../src/shared/components/ui/Toolbar/UnifiedToolbarButton.module.css'
    );
    toolbarButtonCssContent = readFileSync(cssPath, 'utf-8');
  });

  describe('RED 단계: 하드코딩된 border-radius 값 감지', () => {
    it('UnifiedToolbarButton에 하드코딩된 10px 값이 제거되어야 함', () => {
      // 기존 하드코딩된 10px 값이 없어야 함
      const hardcodedMatches = toolbarButtonCssContent.match(/border-radius:\s*10px/g);
      expect(hardcodedMatches).toBeNull();
    });

    it('모든 border-radius 값이 CSS 변수를 사용해야 함', () => {
      const borderRadiusMatches = toolbarButtonCssContent.match(/border-radius:\s*[^;]+;/g);

      if (borderRadiusMatches) {
        borderRadiusMatches.forEach(match => {
          // CSS 변수를 사용하거나 inherit/none 등의 키워드만 허용
          const value = match.replace('border-radius:', '').replace(';', '').trim();
          const isValidValue =
            value.includes('var(--') || ['inherit', 'initial', 'unset', 'none'].includes(value);

          expect(isValidValue, `Invalid border-radius value: ${value}`).toBe(true);
        });
      }
    });
  });

  describe('GREEN 단계: 적절한 토큰 사용', () => {
    it('기본 버튼 요소는 --xeg-radius-lg 토큰을 사용해야 함', () => {
      // 10px -> 8px (--xeg-radius-lg) 근사값 적용
      expect(toolbarButtonCssContent).toContain('var(--xeg-radius-lg)');
    });

    it('xeg-radius 접두사를 가진 토큰을 사용해야 함', () => {
      const cssVariableMatches = toolbarButtonCssContent.match(/var\(--([^)]+)\)/g);

      if (cssVariableMatches) {
        const radiusTokens = cssVariableMatches.filter(match => match.includes('radius'));

        radiusTokens.forEach(token => {
          expect(token).toMatch(/var\(--xeg-radius-/);
        });
      }
    });

    it('일관된 디자인 시스템 적용을 위한 토큰 구조가 있어야 함', () => {
      // design tokens semantic layer 참조
      const expectedPatterns = [
        /var\(--xeg-radius-lg\)/, // 기본 버튼
        /var\(--xeg-radius-md\)/, // 작은 버튼 (있다면)
      ];

      const hasValidTokens = expectedPatterns.some(pattern =>
        pattern.test(toolbarButtonCssContent)
      );

      expect(hasValidTokens).toBe(true);
    });
  });

  describe('REFACTOR 단계: 일관성 및 최적화', () => {
    it('중복된 border-radius 선언이 없어야 함', () => {
      const borderRadiusMatches = toolbarButtonCssContent.match(/border-radius:/g);

      if (borderRadiusMatches) {
        // 적절한 수준의 선언만 있어야 함 (과도한 중복 방지)
        expect(borderRadiusMatches.length).toBeLessThanOrEqual(5);
      }
    });

    it('hover, focus, active 상태도 일관된 토큰을 사용해야 함', () => {
      const stateSelectors = [':hover', ':focus', ':active', '.active'];

      stateSelectors.forEach(selector => {
        const statePattern = new RegExp(
          `[^{]*${selector.replace(':', '\\:')}[^{]*{[^}]*border-radius[^}]*}`,
          'g'
        );
        const stateMatches = toolbarButtonCssContent.match(statePattern);

        if (stateMatches) {
          stateMatches.forEach(match => {
            if (match.includes('border-radius:')) {
              expect(match).toMatch(/var\(--xeg-radius-/);
            }
          });
        }
      });
    });
  });
});
