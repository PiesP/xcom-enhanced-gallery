/**
 * @fileoverview Phase 44 Step 3 - Toolbar Expandable Panel Styles (TDD RED)
 * @description Toolbar.module.css에 settingsPanel 스타일 정의 검증
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeVendors } from '@shared/external/vendors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Toolbar Expandable Panel Styles (Phase 44 Step 3)', () => {
  setupGlobalTestIsolation();

  let toolbarCss: string;

  beforeEach(async () => {
    await initializeVendors();
    const toolbarPath = resolve(
      __dirname,
      '../../src/shared/components/ui/Toolbar/Toolbar.module.css'
    );
    toolbarCss = readFileSync(toolbarPath, 'utf-8');
  });

  describe('RED: settingsPanel 클래스 정의', () => {
    it('settingsPanel 클래스가 정의되어야 함', () => {
      expect(toolbarCss).toContain('.settingsPanel');
    });

    it('settingsPanel은 토큰화된 transition을 사용해야 함', () => {
      const panelMatch = toolbarCss.match(/\.settingsPanel\s*\{([^}]+)\}/s);
      if (panelMatch) {
        const panelStyles = panelMatch[1];
        expect(panelStyles).toMatch(/transition:\s*var\(--xeg-toolbar-panel-transition\)/);
      } else {
        // RED: 아직 정의되지 않음
        expect(panelMatch).toBeTruthy();
      }
    });

    it('settingsPanel은 height: 0으로 시작해야 함', () => {
      const panelMatch = toolbarCss.match(/\.settingsPanel\s*\{([^}]+)\}/s);
      if (panelMatch) {
        const panelStyles = panelMatch[1];
        expect(panelStyles).toMatch(/height:\s*var\(--xeg-toolbar-panel-height\)|height:\s*0/);
      } else {
        // RED: 아직 정의되지 않음
        expect(panelMatch).toBeTruthy();
      }
    });

    it('settingsPanel은 max-height 토큰을 사용해야 함', () => {
      const panelMatch = toolbarCss.match(/\.settingsPanel\s*\{([^}]+)\}/s);
      if (panelMatch) {
        const panelStyles = panelMatch[1];
        expect(panelStyles).toMatch(/max-height:\s*var\(--xeg-toolbar-panel-max-height\)/);
      } else {
        // RED: 아직 정의되지 않음
        expect(panelMatch).toBeTruthy();
      }
    });

    it('settingsPanel은 overflow: hidden을 가져야 함', () => {
      const panelMatch = toolbarCss.match(/\.settingsPanel\s*\{([^}]+)\}/s);
      if (panelMatch) {
        const panelStyles = panelMatch[1];
        expect(panelStyles).toMatch(/overflow:\s*hidden/);
      } else {
        // RED: 아직 정의되지 않음
        expect(panelMatch).toBeTruthy();
      }
    });
  });

  describe('RED: data-expanded 상태 정의', () => {
    it('[data-expanded="true"] 상태가 정의되어야 함', () => {
      // 작은따옴표와 큰따옴표 모두 허용
      expect(toolbarCss).toMatch(/\[data-expanded=['"]true['"]\]/);
    });

    it('[data-expanded="true"]일 때 height가 auto여야 함', () => {
      const expandedMatch = toolbarCss.match(
        /\.settingsPanel\[data-expanded=["']true["']\]\s*\{([^}]+)\}/s
      );
      if (expandedMatch) {
        const expandedStyles = expandedMatch[1];
        expect(expandedStyles).toMatch(/height:\s*auto/);
      } else {
        // RED: 아직 정의되지 않음
        expect(expandedMatch).toBeTruthy();
      }
    });

    it('[data-expanded="true"]일 때 opacity가 1이어야 함', () => {
      const expandedMatch = toolbarCss.match(
        /\.settingsPanel\[data-expanded=["']true["']\]\s*\{([^}]+)\}/s
      );
      if (expandedMatch) {
        const expandedStyles = expandedMatch[1];
        expect(expandedStyles).toMatch(/opacity:\s*1/);
      } else {
        // RED: 아직 정의되지 않음
        expect(expandedMatch).toBeTruthy();
      }
    });
  });

  describe('RED: 레이아웃 구조 정의', () => {
    it('settingsPanel은 display: flex를 가져야 함', () => {
      const panelMatch = toolbarCss.match(/\.settingsPanel\s*\{([^}]+)\}/s);
      if (panelMatch) {
        const panelStyles = panelMatch[1];
        expect(panelStyles).toMatch(/display:\s*flex/);
      } else {
        // RED: 아직 정의되지 않음
        expect(panelMatch).toBeTruthy();
      }
    });

    it('settingsPanel은 flex-direction: column을 가져야 함', () => {
      const panelMatch = toolbarCss.match(/\.settingsPanel\s*\{([^}]+)\}/s);
      if (panelMatch) {
        const panelStyles = panelMatch[1];
        expect(panelStyles).toMatch(/flex-direction:\s*column/);
      } else {
        // RED: 아직 정의되지 않음
        expect(panelMatch).toBeTruthy();
      }
    });

    it('settingsPanel은 토큰화된 gap을 사용해야 함', () => {
      const panelMatch = toolbarCss.match(/\.settingsPanel\s*\{([^}]+)\}/s);
      if (panelMatch) {
        const panelStyles = panelMatch[1];
        // gap은 var(--space-*) 또는 var(--xeg-spacing-*) 토큰 사용
        expect(panelStyles).toMatch(/gap:\s*var\(--(?:space|xeg-spacing)-/);
      } else {
        // RED: 아직 정의되지 않음
        expect(panelMatch).toBeTruthy();
      }
    });

    it('settingsPanel은 토큰화된 padding을 사용해야 함', () => {
      const panelMatch = toolbarCss.match(/\.settingsPanel\s*\{([^}]+)\}/s);
      if (panelMatch) {
        const panelStyles = panelMatch[1];
        // padding은 var(--space-*) 또는 var(--xeg-spacing-*) 토큰 사용
        expect(panelStyles).toMatch(/padding:\s*var\(--(?:space|xeg-spacing)-/);
      } else {
        // RED: 아직 정의되지 않음
        expect(panelMatch).toBeTruthy();
      }
    });
  });

  describe('GREEN: prefers-reduced-motion 지원', () => {
    it('settingsPanel의 transition은 semantic 레이어 토큰으로 자동 처리됨 (Phase 254)', () => {
      // settingsPanel은 var(--xeg-duration-*)를 사용하므로
      // design-tokens.semantic.css의 @media (prefers-reduced-motion)에서
      // duration이 0ms로 설정되어 자동 처리됨
      // 따라서 컴포넌트 레벨의 개별 @media 블록은 불필요함

      // settingsPanel이 duration 토큰을 사용하는지 확인
      const settingsPanelMatch = toolbarCss.match(/\.settingsPanel\s*\{([^}]+)\}/s);
      expect(settingsPanelMatch).toBeTruthy();

      const styles = settingsPanelMatch![1];
      // transition에 --xeg-duration-* 토큰 사용 확인
      expect(styles).toMatch(/transition:[^;]*var\(--xeg-/);
    });
  });
});
