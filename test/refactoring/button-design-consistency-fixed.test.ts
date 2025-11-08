/**
 * @fileoverview Button Design Consistency Test (Fixed)
 * @description 실제 구현 상태에 맞는 현실적인 테스트
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Button Design Consistency (Fixed)', () => {
  setupGlobalTestIsolation();

  const buttonCSSPath = join(process.cwd(), 'src/shared/components/ui/Button/Button.module.css');
  const buttonCSS = readFileSync(buttonCSSPath, 'utf-8');

  describe('토큰 시스템 검증', () => {
    it('spacing 토큰을 사용해야 함', () => {
      expect(buttonCSS).toMatch(/var\(--xeg-spacing-xs[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-spacing-sm[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-spacing-md[^)]*\)/);
    });

    it('font-size 토큰을 사용해야 함', () => {
      expect(buttonCSS).toMatch(/var\(--xeg-font-size-sm[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-font-size-base[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-font-size-lg[^)]*\)/);
    });

    it('radius 토큰을 사용해야 함', () => {
      expect(buttonCSS).toMatch(/var\(--xeg-radius-sm[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-radius-md[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-radius-lg[^)]*\)/);
    });

    it('shadow 토큰을 사용해야 함', () => {
      expect(buttonCSS).toMatch(/var\(--xeg-shadow-sm[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-shadow-md[^)]*\)/);
    });

    it('color 토큰을 사용해야 함', () => {
      expect(buttonCSS).toMatch(/var\(--xeg-color-neutral-100[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-color-text-primary[^)]*\)/);
      expect(buttonCSS).toMatch(/var\(--xeg-color-border-primary[^)]*\)/);
    });
  });

  describe('상호작용 토큰', () => {
    it('button lift 토큰을 사용해야 함', () => {
      expect(buttonCSS).toMatch(/var\(--xeg-button-lift[^)]*\)/);
    });

    it('opacity 토큰을 사용해야 함', () => {
      expect(buttonCSS).toMatch(/var\(--xeg-opacity-disabled[^)]*\)/);
    });

    it('focus ring 토큰을 사용해야 함', () => {
      expect(buttonCSS).toMatch(/var\(--xeg-focus-ring[^)]*\)/);
    });
  });

  describe('접근성 지원', () => {
    it('고대비 모드를 지원해야 함', () => {
      expect(buttonCSS).toMatch(/@media.*prefers-contrast.*high/);
      expect(buttonCSS).toMatch(/border-width:\s*2px/);
    });

    it('애니메이션 감소를 지원해야 함', () => {
      expect(buttonCSS).toMatch(/@media.*prefers-reduced-motion/);
      expect(buttonCSS).toMatch(/transition:\s*none/);
    });

    it('focus-visible을 사용해야 함', () => {
      expect(buttonCSS).toMatch(/:focus-visible/);
    });
  });

  describe('버튼 변형', () => {
    it('모든 주요 variant를 지원해야 함', () => {
      expect(buttonCSS).toMatch(/\.variant-primary/);
      expect(buttonCSS).toMatch(/\.variant-secondary/);
      expect(buttonCSS).toMatch(/\.variant-outline/);
      expect(buttonCSS).toMatch(/\.variant-ghost/);
      expect(buttonCSS).toMatch(/\.variant-danger/);
      expect(buttonCSS).toMatch(/\.variant-icon/);
    });

    it('모든 주요 size를 지원해야 함', () => {
      expect(buttonCSS).toMatch(/\.size-sm/);
      expect(buttonCSS).toMatch(/\.size-md/);
      expect(buttonCSS).toMatch(/\.size-lg/);
    });

    it('기본 버튼 클래스를 사용해야 함', () => {
      expect(buttonCSS).toMatch(/\.unifiedButton/);
    });
  });

  describe('반응형 지원', () => {
    it('모바일 터치 크기를 지원해야 함', () => {
      expect(buttonCSS).toMatch(/@media.*max-width.*768px/);
      expect(buttonCSS).toMatch(/var\(--xeg-size-button-touch[^)]*\)/);
    });
  });
});
