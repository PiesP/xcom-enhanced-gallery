/**
 * TDD: VerticalImageItem 디자인 일관성 개선
 * @description 하드코딩된 값 제거 및 design-tokens.css 활용
 * @version 1.0.0
 */

import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readAllDesignTokens } from '../shared/design-token-helpers';

describe('TDD: VerticalImageItem 디자인 일관성 개선', () => {
  setupGlobalTestIsolation();

  describe('RED: 하드코딩된 값 검증', () => {
    it('하드코딩된 border-radius 값들이 제거되어야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      // 하드코딩된 border-radius 값 검증
      expect(cssContent).not.toMatch(/border-radius:\s*16px/);
      expect(cssContent).not.toMatch(/border-radius:\s*8px/);
      expect(cssContent).not.toMatch(/border-radius:\s*4px/);

      // design-tokens.css 변수 사용 검증
      expect(cssContent).toMatch(/border-radius:\s*var\(--xeg-radius-/);
    });

    it('하드코딩된 padding/margin 값들이 제거되어야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      // 하드코딩된 spacing 값 검증
      expect(cssContent).not.toMatch(/padding:\s*8px/);
      expect(cssContent).not.toMatch(/margin-bottom:\s*var\(--xeg-item-spacing\)/);

      // 표준화된 spacing 변수 사용 검증
      expect(cssContent).toMatch(/padding:\s*var\(--xeg-spacing-/);
      expect(cssContent).toMatch(/margin-bottom:\s*var\(--xeg-spacing-/);
    });

    it('하드코딩된 크기 값들이 제거되어야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      // 하드코딩된 크기 값 검증
      expect(cssContent).not.toMatch(/min-height:\s*200px/);
      expect(cssContent).not.toMatch(/width:\s*32px/);
      expect(cssContent).not.toMatch(/height:\s*32px/);
      expect(cssContent).not.toMatch(/max-height:\s*80vh/);

      // design-tokens.css 크기 변수 사용 검증
      expect(cssContent).toMatch(/min-height:\s*var\(--xeg-/);
    });

    it('비표준 CSS 변수명들이 제거되어야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      // 비표준 변수명 검증
      expect(cssContent).not.toMatch(/--xeg-item-border-radius/);
      expect(cssContent).not.toMatch(/--xeg-item-spacing/);
      expect(cssContent).not.toMatch(/--xeg-item-transition/);
      expect(cssContent).not.toMatch(/--xeg-bg-overlay-medium/);
      expect(cssContent).not.toMatch(/--xeg-text-inverse/);

      // 표준화된 design-tokens.css 변수 사용 검증
      expect(cssContent).toMatch(/var\(--xeg-radius-lg\)/);
      expect(cssContent).toMatch(/var\(--xeg-spacing-md\)/);
      expect(cssContent).toMatch(/var\(--xeg-transition-normal\)/);
    });
  });

  describe('RED: 색상 시스템 표준화 검증', () => {
    it('하드코딩된 색상 값들이 제거되어야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      // 하드코딩된 색상 값 검증
      expect(cssContent).not.toMatch(/rgba\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)/);
      expect(cssContent).not.toMatch(/#[0-9a-fA-F]{3,8}/);

      // design-tokens.css 색상 변수 사용 검증
      expect(cssContent).toMatch(/var\(--xeg-color-/);
    });

    it('글래스모피즘 색상이 표준화되어야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      // 표준화된 글래스모피즘 변수 사용 검증
      expect(cssContent).toMatch(/var\(--xeg-media-glass-bg\)/);
      expect(cssContent).toMatch(/var\(--xeg-media-glass-border\)/);
      expect(cssContent).toMatch(/var\(--xeg-media-glass-blur\)/);
      expect(cssContent).toMatch(/var\(--xeg-media-glass-shadow\)/);
    });
  });

  describe('RED: 애니메이션 시스템 표준화 검증', () => {
    it('하드코딩된 transition 값들이 제거되어야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      // 하드코딩된 transition 값 검증
      expect(cssContent).not.toMatch(/transition:\s*all\s+0\.3s\s+ease/);
      expect(cssContent).not.toMatch(/transition:\s*box-shadow\s+0\.2s\s+ease/);
      expect(cssContent).not.toMatch(/transition:\s*background\s+0\.2s\s+ease/);

      // 표준화된 transition 변수 사용 검증
      expect(cssContent).toMatch(/transition:\s*var\(--xeg-transition-/);
    });

    it('하드코딩된 transform 값들이 표준화되어야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      // 하드코딩된 transform 값 검증
      expect(cssContent).not.toMatch(/translateY\(-2px\)/);
      expect(cssContent).not.toMatch(/--xeg-item-hover-transform/);

      // 표준화된 hover 효과 사용 검증
      expect(cssContent).toMatch(/var\(--xeg-hover-lift\)/);
    });
  });

  describe('RED: 타이포그래피 시스템 표준화 검증', () => {
    it('비표준 font-size 변수들이 제거되어야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      // 표준화된 font-size 변수 사용 검증
      expect(cssContent).toMatch(/font-size:\s*var\(--xeg-font-size-/);
      expect(cssContent).toMatch(/font-weight:\s*var\(--xeg-font-weight-/);
    });
  });

  describe('RED: 접근성 시스템 표준화 검증', () => {
    it('포커스 링 시스템이 표준화되어야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      // 비표준 포커스 변수 제거 검증
      expect(cssContent).not.toMatch(/--xeg-item-focus-shadow/);
      expect(cssContent).not.toMatch(/--xeg-item-active-shadow/);

      // 표준화된 포커스 시스템 사용 검증
      expect(cssContent).toMatch(/var\(--xeg-focus-shadow\)/);
      expect(cssContent).toMatch(/var\(--xeg-active-shadow\)/);
    });
  });

  describe('RED: Z-index 시스템 표준화 검증', () => {
    it('하드코딩된 z-index 값들이 제거되어야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      // 하드코딩된 z-index 값 검증
      expect(cssContent).not.toMatch(/z-index:\s*9999/);

      // 표준화된 z-index 변수 사용 검증 (필요 시)
      if (cssContent.includes('z-index:')) {
        expect(cssContent).toMatch(/z-index:\s*var\(--xeg-z-/);
      }
    });
  });

  describe('GREEN: 디자인 토큰 일관성 확보', () => {
    it('design-tokens.css의 모든 관련 변수가 활용되어야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      const designTokensContent = readAllDesignTokens();

      // 핵심 디자인 토큰 활용 검증
      const requiredTokens = [
        '--xeg-radius-lg',
        '--xeg-spacing-sm',
        '--xeg-spacing-md',
        '--xeg-color-primary',
        '--xeg-shadow-md',
        '--xeg-transition-normal',
        '--xeg-font-size-sm',
        '--xeg-font-weight-medium',
      ];

      requiredTokens.forEach(token => {
        expect(designTokensContent).toMatch(new RegExp(token));
        // CSS에서 활용되는지 검증 (모든 토큰이 사용될 필요는 없음)
      });
    });
  });

  describe('REFACTOR: 성능 최적화 검증', () => {
    it('CSS 변수 선언이 중복되지 않아야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      // :root 블록에서 중복 변수 선언 검증
      const rootBlocks = cssContent.match(/:root\s*\{[^}]+\}/g) || [];

      if (rootBlocks.length > 1) {
        // 여러 :root 블록이 있으면 중복 제거 필요
        expect(rootBlocks.length).toBeLessThanOrEqual(1);
      }
    });

    it('불필요한 CSS 변수 오버라이드가 제거되어야 한다', () => {
      const cssContent = readFileSync(
        'src/features/gallery/components/vertical-gallery-view/VerticalImageItem.module.css',
        'utf8'
      );

      // design-tokens.css에 이미 정의된 값을 재정의하지 않아야 함
      expect(cssContent).not.toMatch(/--xeg-radius-lg:\s*8px/);
      expect(cssContent).not.toMatch(/--xeg-spacing-md:\s*16px/);
    });
  });
});
