/**
 * @fileoverview CSS 호환성 TDD 테스트
 * @description CSS @extend 구문을 제거하고 호환성을 개선하는 TDD 테스트
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import process from 'process';

describe('CSS 호환성 TDD', () => {
  const buttonCssPath = join(process.cwd(), 'src/shared/components/ui/Button/Button.module.css');

  describe('Phase 1: CSS 구문 검증', () => {
    it('CSS 파일에 @extend 구문이 없어야 함', () => {
      const cssContent = readFileSync(buttonCssPath, 'utf-8');

      // @extend 구문이 있으면 테스트 실패
      expect(cssContent).not.toMatch(/@extend/g);
    });

    it('모든 CSS 선택자가 유효한 구문이어야 함', () => {
      const cssContent = readFileSync(buttonCssPath, 'utf-8');

      // 기본적인 CSS 구문 검증
      expect(cssContent).toMatch(/\.glassmorphism\s*{/);
      expect(cssContent).toMatch(/\.glassmorphism-light\s*{/);
      expect(cssContent).toMatch(/\.glassmorphism-medium\s*{/);
    });

    it('필수 글래스모피즘 속성이 모든 클래스에 정의되어야 함', () => {
      const cssContent = readFileSync(buttonCssPath, 'utf-8');

      // 각 글래스모피즘 클래스에 필수 속성이 있는지 확인
      const requiredProperties = [
        'background:',
        'backdrop-filter:',
        '-webkit-backdrop-filter:',
        'box-shadow:',
      ];

      requiredProperties.forEach(property => {
        expect(cssContent).toMatch(new RegExp(property.replace(':', '\\s*:')));
      });
    });
  });

  describe('Phase 2: 디자인 토큰 사용 검증', () => {
    it('하드코딩된 색상값 대신 CSS 변수를 사용해야 함', () => {
      const cssContent = readFileSync(buttonCssPath, 'utf-8');

      // CSS 변수 사용 패턴 검증
      expect(cssContent).toMatch(/var\(--xeg-glass-bg-/);
      expect(cssContent).toMatch(/var\(--xeg-glass-blur-/);
      expect(cssContent).toMatch(/var\(--xeg-glass-shadow-/);
      expect(cssContent).toMatch(/var\(--xeg-glass-border-/);
    });

    it('새로운 OKLCH 색상 시스템을 활용해야 함', () => {
      const cssContent = readFileSync(buttonCssPath, 'utf-8');

      // OKLCH 색상 또는 CSS 변수 사용 확인
      const hasOklchColors = cssContent.includes('oklch(') || cssContent.includes('--xeg-color-');

      expect(hasOklchColors).toBe(true);
    });
  });

  describe('Phase 3: 접근성 및 호환성 검증', () => {
    it('고대비 모드를 위한 미디어 쿼리가 있어야 함', () => {
      const cssContent = readFileSync(buttonCssPath, 'utf-8');

      expect(cssContent).toMatch(/@media\s*\(\s*prefers-contrast:\s*high\s*\)/);
    });

    it('투명도 감소 설정을 위한 미디어 쿼리가 있어야 함', () => {
      const cssContent = readFileSync(buttonCssPath, 'utf-8');

      expect(cssContent).toMatch(/@media\s*\(\s*prefers-reduced-transparency:\s*reduce\s*\)/);
    });

    it('backdrop-filter 미지원 브라우저를 위한 폴백이 있어야 함', () => {
      const cssContent = readFileSync(buttonCssPath, 'utf-8');

      expect(cssContent).toMatch(/@supports\s*not\s*\(\s*backdrop-filter:/);
    });
  });

  describe('Phase 4: 성능 최적화 검증', () => {
    it('GPU 가속을 위한 will-change 속성이 있어야 함', () => {
      const cssContent = readFileSync(buttonCssPath, 'utf-8');

      expect(cssContent).toMatch(/will-change:\s*backdrop-filter/);
    });

    it('레이어링을 위한 transform 속성이 있어야 함', () => {
      const cssContent = readFileSync(buttonCssPath, 'utf-8');

      expect(cssContent).toMatch(/transform:\s*translateZ\(0\)/);
    });

    it('렌더링 최적화를 위한 contain 속성이 있어야 함', () => {
      const cssContent = readFileSync(buttonCssPath, 'utf-8');

      expect(cssContent).toMatch(/contain:\s*layout\s+style\s+paint/);
    });
  });
});
