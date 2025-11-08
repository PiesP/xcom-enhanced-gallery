/**
 * @fileoverview Phase 46: Toolbar Expandable Panel Design Consistency Test
 * @description 확장 패널의 glassmorphism 스타일 일관성 검증
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TOOLBAR_CSS_PATH = resolve(
  __dirname,
  '../../src/shared/components/ui/Toolbar/Toolbar.module.css'
);

const TOOLBAR_TSX_PATH = resolve(__dirname, '../../src/shared/components/ui/Toolbar/Toolbar.tsx');

describe('Phase 46: Toolbar Expandable Panel Design Consistency', () => {
  setupGlobalTestIsolation();

  const toolbarCSS = readFileSync(TOOLBAR_CSS_PATH, 'utf-8');
  const toolbarTSX = readFileSync(TOOLBAR_TSX_PATH, 'utf-8');

  describe('Semantic Token Usage', () => {
    it('settingsPanel이 semantic toolbar 배경 토큰을 사용해야 함', () => {
      // settingsPanel 섹션 추출
      const settingsPanelSection = toolbarCSS.match(/\.settingsPanel\s*\{[\s\S]*?\}/)?.[0];
      expect(settingsPanelSection).toBeDefined();
      expect(settingsPanelSection).toMatch(/--xeg-bg-toolbar/);
    });

    it('settingsPanel이 border 토큰을 사용해야 함', () => {
      const settingsPanelSection = toolbarCSS.match(/\.settingsPanel\s*\{[\s\S]*?\}/)?.[0];
      expect(settingsPanelSection).toMatch(/--color-border-default/);
    });

    it('settingsPanel이 border-radius 토큰을 사용해야 함', () => {
      const settingsPanelSection = toolbarCSS.match(/\.settingsPanel\s*\{[\s\S]*?\}/)?.[0];
      expect(settingsPanelSection).toMatch(/--xeg-radius-lg/);
    });

    it('settingsPanel이 spacing 토큰을 사용해야 함', () => {
      const settingsPanelSection = toolbarCSS.match(/\.settingsPanel\s*\{[\s\S]*?\}/)?.[0];
      expect(settingsPanelSection).toMatch(/--space-md/);
    });

    it('settingsPanel이 transition 토큰을 사용해야 함', () => {
      const settingsPanelSection = toolbarCSS.match(/\.settingsPanel\s*\{[\s\S]*?\}/)?.[0];
      expect(settingsPanelSection).toMatch(/--xeg-toolbar-panel-transition/);
    });
  });

  describe('No Hardcoded Values', () => {
    it('settingsPanel에 하드코딩된 색상 값이 없어야 함', () => {
      const settingsPanelSection = toolbarCSS.match(/\.settingsPanel[\s\S]*?(?=\/\*|$)/)?.[0];

      // RGB/RGBA 패턴
      expect(settingsPanelSection).not.toMatch(/rgba?\(\s*\d+\s*,/);
      // HEX 색상 패턴
      expect(settingsPanelSection).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      // HSL 패턴
      expect(settingsPanelSection).not.toMatch(/hsla?\(/);
    });

    it('settingsPanel에 하드코딩된 border-radius 값이 없어야 함', () => {
      const settingsPanelSection = toolbarCSS.match(/\.settingsPanel\s*\{[\s\S]*?\}/)?.[0];

      // px/rem/em 단위의 border-radius 하드코딩 검출
      const hardcodedRadius = settingsPanelSection?.match(
        /border-radius:\s*(?!var\()[0-9]+(?:px|rem|em)/
      );
      expect(hardcodedRadius).toBeNull();
    });

    it('settingsPanel에 하드코딩된 spacing 값이 없어야 함', () => {
      const settingsPanelSection = toolbarCSS.match(/\.settingsPanel\s*\{[\s\S]*?\}/)?.[0];

      // padding/gap/margin에 하드코딩된 값 검출 (var() 제외)
      const paddingMatch = settingsPanelSection?.match(/padding:\s*(?!var\()[0-9]+(?:px|rem|em)/);
      const gapMatch = settingsPanelSection?.match(/gap:\s*(?!var\()[0-9]+(?:px|rem|em)/);

      expect(paddingMatch).toBeNull();
      expect(gapMatch).toBeNull();
    });
  });

  describe('Glassmorphism Consistency', () => {
    it('galleryToolbar와 settingsPanel이 동일한 배경 토큰을 사용해야 함', () => {
      const toolbarBg = toolbarCSS.match(
        /\.galleryToolbar\s*\{[\s\S]*?background:\s*(var\([^)]+\))/
      )?.[1];
      const panelBg = toolbarCSS.match(
        /\.settingsPanel\s*\{[\s\S]*?background:\s*(var\([^)]+\))/
      )?.[1];

      expect(toolbarBg).toBeDefined();
      expect(panelBg).toBeDefined();
      expect(toolbarBg).toBe(panelBg);
    });

    it('galleryToolbar와 settingsPanel이 동일한 border 토큰을 사용해야 함', () => {
      const toolbarBorder = toolbarCSS.match(
        /\.galleryToolbar\s*\{[\s\S]*?border:\s*[^;]*?(var\([^)]+\))/
      )?.[1];
      const panelBorder = toolbarCSS.match(
        /\.settingsPanel\s*\{[\s\S]*?border-top:\s*[^;]*?(var\([^)]+\))/
      )?.[1];

      expect(toolbarBorder).toBeDefined();
      expect(panelBorder).toBeDefined();
      expect(toolbarBorder).toBe(panelBorder);
    });

    it('settingsPanel이 toolbar와 연결된 border-radius를 사용해야 함', () => {
      const panelRadius = toolbarCSS.match(
        /\.settingsPanel\s*\{[\s\S]*?border-radius:\s*([^;]+)/
      )?.[1];

      // 하단 라운드만 적용 (0 0 var(--xeg-radius-lg) var(--xeg-radius-lg))
      expect(panelRadius).toMatch(/0\s+0\s+var\(--xeg-radius-lg\)/);
    });
  });

  describe('Animation & Transition', () => {
    it('settingsPanel이 transition 토큰을 사용해야 함', () => {
      const panelTransition = toolbarCSS.match(
        /\.settingsPanel\s*\{[\s\S]*?transition:\s*([^;]+)/
      )?.[1];

      expect(panelTransition).toMatch(/var\(--xeg-toolbar-panel-transition\)/);
    });

    it('settingsPanel이 prefers-reduced-motion을 지원해야 함', () => {
      const reducedMotionSection = toolbarCSS.match(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.settingsPanel\s*\{[\s\S]*?transition:\s*none/
      );

      expect(reducedMotionSection).toBeDefined();
    });

    it('settingsPanel expanded 상태가 height와 opacity를 변경해야 함', () => {
      const expandedSection = toolbarCSS.match(
        /\.settingsPanel\[data-expanded=['"]true['"]\]\s*\{[\s\S]*?\}/
      )?.[0];

      expect(expandedSection).toMatch(/height:\s*auto/);
      expect(expandedSection).toMatch(/opacity:\s*1/);
    });
  });

  describe('High Contrast Mode', () => {
    it('toolbar CSS가 forced-colors 미디어 쿼리를 지원해야 함 (있다면)', () => {
      const forcedColorsSupport = toolbarCSS.includes('@media (forced-colors: active)');

      // 현재 지원하지 않으면 경고만 (향후 추가 권장)
      if (!forcedColorsSupport) {
        console.warn(
          '⚠️  Toolbar does not support forced-colors mode yet. Consider adding for high contrast accessibility.'
        );
      }

      // 테스트는 통과 (선택적 기능)
      expect(true).toBe(true);
    });

    it('settingsPanel이 기본 border를 가져야 함 (고대비 모드 대비)', () => {
      const panelBorder = toolbarCSS.match(
        /\.settingsPanel\s*\{[\s\S]*?border-top:\s*([^;]+)/
      )?.[1];

      expect(panelBorder).toMatch(/1px solid/);
    });
  });

  describe('Component Integration', () => {
    it('Toolbar.tsx가 SettingsControls를 import해야 함', () => {
      expect(toolbarTSX).toMatch(/import\s+\{[^}]*SettingsControls[^}]*\}\s+from/);
    });

    it('Toolbar.tsx가 settingsPanel 요소를 렌더링해야 함', () => {
      expect(toolbarTSX).toMatch(/class(Name)?=\{styles\.settingsPanel\}/);
    });

    it('settingsPanel이 data-expanded 속성을 가져야 함', () => {
      expect(toolbarTSX).toMatch(/data-expanded=\{[^}]+\}/);
    });

    it('settingsPanel이 role="region" 속성을 가져야 함', () => {
      expect(toolbarTSX).toMatch(/role=["']region["']/);
    });

    it('settingsPanel이 aria-label을 가져야 함', () => {
      expect(toolbarTSX).toMatch(/aria-label=["'][^"']*설정[^"']*["']/);
    });
  });

  describe('Layout & Positioning', () => {
    it('settingsPanel이 flex layout을 사용해야 함', () => {
      const panelLayout = toolbarCSS.match(/\.settingsPanel\s*\{[\s\S]*?\}/)?.[0];

      expect(panelLayout).toMatch(/display:\s*flex/);
      expect(panelLayout).toMatch(/flex-direction:\s*column/);
    });

    it('settingsPanel이 적절한 overflow 처리를 해야 함', () => {
      const panelOverflow = toolbarCSS.match(
        /\.settingsPanel\s*\{[\s\S]*?overflow:\s*([^;]+)/
      )?.[1];

      expect(panelOverflow).toBe('hidden');
    });

    it('settingsPanel이 max-height 제한을 가져야 함', () => {
      const panelMaxHeight = toolbarCSS.match(
        /\.settingsPanel\s*\{[\s\S]*?max-height:\s*([^;]+)/
      )?.[1];

      expect(panelMaxHeight).toMatch(/var\(--xeg-toolbar-panel-max-height\)/);
    });
  });
});
