/**
 * @fileoverview TDD Phase 57: Toolbar-Settings Panel Design Continuity Tests
 * @description 툴바와 설정 패널의 시각적 연속성 검증 - RED 단계
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ESM에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TOOLBAR_CSS_PATH = resolve(
  __dirname,
  '../../src/shared/components/ui/Toolbar/Toolbar.module.css'
);

function readToolbarCSS(): string {
  return readFileSync(TOOLBAR_CSS_PATH, 'utf-8');
}

describe('TDD Phase 57: Toolbar-Settings Panel Visual Continuity', () => {
  setupGlobalTestIsolation();

  describe('RED: Toolbar expansion state (설정 패널 확장 시 툴바 스타일)', () => {
    it('툴바가 확장 상태일 때 하단 border-radius를 제거해야 함', () => {
      const css = readToolbarCSS();

      // 기대: .galleryToolbar[data-settings-expanded="true"] 선택자가 존재하고
      // border-radius 또는 border-bottom-*-radius를 0 또는 제거해야 함
      const expandedToolbarPattern = /\.galleryToolbar\[data-settings-expanded=["']true["']\]/;
      const hasBorderRadiusOverride =
        /border-radius:\s*var\(--xeg-radius-lg\)\s+var\(--xeg-radius-lg\)\s+0\s+0/.test(css) ||
        /border-bottom-left-radius:\s*0/.test(css) ||
        /border-bottom-right-radius:\s*0/.test(css);

      expect(css).toMatch(expandedToolbarPattern);
      expect(hasBorderRadiusOverride).toBe(true);
    });

    it('툴바가 확장 상태일 때 통합된 box-shadow를 적용해야 함', () => {
      const css = readToolbarCSS();

      // 기대: 확장 상태에서 더 강조된 그림자 또는 패널까지 포함하는 그림자
      const expandedToolbarShadowPattern =
        /\.galleryToolbar\[data-settings-expanded=["']true["']\][^}]*box-shadow:[^;]+(--xeg-shadow-lg|--xeg-shadow-xl)/;

      expect(css).toMatch(expandedToolbarShadowPattern);
    });
  });

  describe('RED: Settings panel continuity (설정 패널 연속성)', () => {
    it('설정 패널의 상단 border가 미세한 구분선이어야 함', () => {
      const css = readToolbarCSS();

      // 기대: .settingsPanel[data-expanded="true"]에서
      // border-top-color가 var(--xeg-comp-toolbar-border)로 설정됨 (여러 줄에 걸쳐 있을 수 있음)
      const panelBorderPattern =
        /\.settingsPanel\[data-expanded=["']true["']\][^}]*border-top-color:\s*var\(--xeg-comp-toolbar-border\)/s;

      expect(css).toMatch(panelBorderPattern);
    });

    it('설정 패널이 툴바와 동일한 배경색을 사용해야 함', () => {
      const css = readToolbarCSS();

      // 이미 구현됨 - 확인만
      const panelBgPattern = /\.settingsPanel[^}]*background:[^;]*var\(--xeg-comp-toolbar-bg\)/;

      expect(css).toMatch(panelBgPattern);
    });

    it('설정 패널의 하단 border-radius가 툴바와 일치해야 함', () => {
      const css = readToolbarCSS();

      // 기대: .settingsPanel이 0 0 var(--xeg-radius-lg) var(--xeg-radius-lg) 사용
      const panelRadiusPattern =
        /\.settingsPanel[^}]*border-radius:[^;]*0\s+0\s+var\(--xeg-radius-lg\)\s+var\(--xeg-radius-lg\)/;

      expect(css).toMatch(panelRadiusPattern);
    });
  });

  describe('RED: Animation smoothness (애니메이션 부드러움)', () => {
    it('설정 패널 애니메이션이 opacity + transform을 사용해야 함', () => {
      const css = readToolbarCSS();

      // 이미 Phase 49에서 구현됨 - 확인만
      const animationPattern =
        /\.settingsPanel[^}]*transition:[^;]*(opacity|transform)[^;]*(opacity|transform)/s;

      expect(css).toMatch(animationPattern);
    });

    it('prefers-reduced-motion 환경에서 애니메이션이 비활성화되어야 함', () => {
      const css = readToolbarCSS();

      // 이미 구현됨 - 확인만
      const reducedMotionPattern =
        /@media\s+\(prefers-reduced-motion:\s*reduce\)[^}]*\.settingsPanel[^}]*transition:\s*none/s;

      expect(css).toMatch(reducedMotionPattern);
    });
  });
});
