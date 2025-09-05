/**
 * @fileoverview Toast Component Tokenization Tests
 * @description TDD 기반 Toast 컴포넌트의 border-radius 토큰화 검증
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

describe('Toast Component Tokenization', () => {
  let toastCssContent;

  beforeEach(() => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const cssPath = resolve(__dirname, '../../src/shared/components/ui/Toast/Toast.module.css');
    toastCssContent = readFileSync(cssPath, 'utf-8');
  });

  describe('RED 단계: 하드코딩된 border-radius 값 감지', () => {
    it('Toast에 하드코딩된 4px, 8px, 16px 값이 제거되어야 함', () => {
      const hardcodedMatches = toastCssContent.match(/border-radius:\s*(4px|8px|16px)/g);
      expect(hardcodedMatches).toBeNull();
    });

    it('모든 border-radius 값이 CSS 변수를 사용해야 함', () => {
      const borderRadiusMatches = toastCssContent.match(/border-radius:\s*[^;]+;/g);

      if (borderRadiusMatches) {
        borderRadiusMatches.forEach(match => {
          const value = match.replace('border-radius:', '').replace(';', '').trim();
          const isValidValue =
            value.includes('var(--') ||
            ['inherit', 'initial', 'unset', 'none', '50%'].includes(value);

          expect(isValidValue, `Invalid border-radius value: ${value}`).toBe(true);
        });
      }
    });
  });

  describe('GREEN 단계: 적절한 토큰 매핑', () => {
    it('Toast 컨테이너는 --xeg-radius-2xl 토큰을 사용해야 함', () => {
      // 16px -> --xeg-radius-2xl
      expect(toastCssContent).toContain('var(--xeg-radius-2xl)');
    });

    it('Action / Close 버튼은 정책상 --xeg-radius-md 토큰을 사용해야 함', () => {
      expect(toastCssContent).toContain('var(--xeg-radius-md)');
    });

    it('sm/lg 토큰은 더 이상 Toast에서 사용하지 않음 (정책: interaction=md)', () => {
      expect(toastCssContent).not.toContain('var(--xeg-radius-sm)');
      expect(toastCssContent).not.toContain('var(--xeg-radius-lg)');
    });

    it('xeg-radius 접두사 토큰만 사용해야 함', () => {
      const cssVariableMatches = toastCssContent.match(/var\(--([^)]+)\)/g);

      if (cssVariableMatches) {
        const radiusTokens = cssVariableMatches.filter(match => match.includes('radius'));

        radiusTokens.forEach(token => {
          expect(token).toMatch(/var\(--xeg-radius-/);
        });
      }
    });
  });

  describe('GREEN 단계: Toast 역할별 토큰 적용', () => {
    it('Toast 컨테이너 클래스들이 적절한 radius를 사용해야 함', () => {
      const toastContainerPattern = /\.(toast|toastContainer)[^{]*{[^}]*border-radius[^}]*}/g;
      const containerMatches = toastCssContent.match(toastContainerPattern);

      if (containerMatches) {
        containerMatches.forEach(match => {
          // 컨테이너는 큰 radius 사용
          const hasLargeRadius =
            match.includes('var(--xeg-radius-xl)') || match.includes('var(--xeg-radius-2xl)');
          expect(hasLargeRadius, `Container should use large radius: ${match}`).toBe(true);
        });
      }
    });

    it('버튼 요소들이 적절한 radius를 사용해야 함', () => {
      const buttonPattern = /\.(button|actionButton)[^{]*{[^}]*border-radius[^}]*}/g;
      const buttonMatches = toastCssContent.match(buttonPattern);

      if (buttonMatches) {
        buttonMatches.forEach(match => {
          // 버튼은 중간 radius 사용
          const hasMediumRadius = match.includes('var(--xeg-radius-md)');
          expect(hasMediumRadius, `Button should use medium radius: ${match}`).toBe(true);
        });
      }
    });
  });

  describe('REFACTOR 단계: 일관성 및 최적화', () => {
    it('중복된 border-radius 선언이 최소화되어야 함', () => {
      const borderRadiusMatches = toastCssContent.match(/border-radius:/g);

      if (borderRadiusMatches) {
        // 적절한 수준의 선언만 있어야 함
        expect(borderRadiusMatches.length).toBeLessThanOrEqual(8);
      }
    });

    it('Toast 타입별 일관성이 유지되어야 함', () => {
      const toastTypes = ['success', 'error', 'warning', 'info'];

      toastTypes.forEach(type => {
        const typePattern = new RegExp(`\\.toast.*${type}[^{]*{[^}]*border-radius[^}]*}`, 'g');
        const typeMatches = toastCssContent.match(typePattern);

        if (typeMatches) {
          typeMatches.forEach(match => {
            expect(match).toMatch(/var\(--xeg-radius-/);
          });
        }
      });
    });
  });
});
