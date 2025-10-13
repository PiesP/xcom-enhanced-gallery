/**
 * @fileoverview Toolbar Expandable Tokens Tests (Phase 44 Step 2)
 * @description Design token validation for expandable settings panel
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DESIGN_TOKENS_PATH = resolve(
  __dirname,
  '../../src/shared/styles/design-tokens.component.css'
);

describe('Toolbar Expandable Panel Tokens (Phase 44 Step 2)', () => {
  let tokensContent: string;

  beforeEach(() => {
    tokensContent = readFileSync(DESIGN_TOKENS_PATH, 'utf-8');
  });

  describe('RED: 애니메이션 토큰', () => {
    it('툴바 패널 transition 토큰이 정의되어야 함', () => {
      expect(tokensContent).toContain('--xeg-toolbar-panel-transition');
    });

    it('툴바 패널 height 토큰이 정의되어야 함', () => {
      expect(tokensContent).toContain('--xeg-toolbar-panel-height');
    });

    it('툴바 패널 max-height 토큰이 정의되어야 함', () => {
      expect(tokensContent).toContain('--xeg-toolbar-panel-max-height');
    });
  });

  describe('RED: 토큰 값 검증', () => {
    it('transition은 duration과 easing 토큰을 참조해야 함', () => {
      const transitionMatch = tokensContent.match(/--xeg-toolbar-panel-transition:\s*([^;]+);/);

      if (transitionMatch) {
        const value = transitionMatch[1];
        expect(value).toMatch(/var\(--xeg-duration-/);
        expect(value).toMatch(/var\(--xeg-ease-/);
      } else {
        // RED: 아직 정의되지 않음
        expect(transitionMatch).toBeTruthy();
      }
    });

    it('max-height는 적절한 값을 가져야 함 (280px)', () => {
      const maxHeightMatch = tokensContent.match(/--xeg-toolbar-panel-max-height:\s*([^;]+);/);

      if (maxHeightMatch) {
        const value = maxHeightMatch[1].trim();
        expect(value).toMatch(/280px/);
      } else {
        // RED: 아직 정의되지 않음
        expect(maxHeightMatch).toBeTruthy();
      }
    });
  });

  describe('RED: 네이밍 일관성', () => {
    it('모든 패널 관련 토큰은 xeg-toolbar-panel 접두사를 사용해야 함', () => {
      const panelTokens = tokensContent.match(/--xeg-toolbar-panel-[a-z-]+/g) || [];

      // 최소 3개 이상의 패널 토큰이 있어야 함
      expect(panelTokens.length).toBeGreaterThanOrEqual(3);

      // 모든 토큰이 올바른 네이밍 규칙을 따라야 함
      panelTokens.forEach(token => {
        expect(token).toMatch(/^--xeg-toolbar-panel-[a-z-]+$/);
      });
    });
  });
});
