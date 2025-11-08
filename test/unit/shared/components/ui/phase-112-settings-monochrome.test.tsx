/**
 * Phase 112 RED Test: Settings Dropdown Monochrome Consistency
 * @description 설정 드롭다운이 hover/focus 시 흑백 기반 색상만 사용하는지 검증
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const SETTINGS_CONTROLS_CSS_PATH = 'src/shared/components/ui/Settings/SettingsControls.module.css';

function read(path: string): string {
  try {
    return readFileSync(path, 'utf-8');
  } catch (error) {
    console.error(`❌ Failed to read file: ${path}`, error);
    throw error;
  }
}

describe('Phase 112: Settings Dropdown Monochrome Consistency', () => {
  describe('CSS 파일 존재 및 구조', () => {
    it('SettingsControls.module.css 파일이 존재해야 함', () => {
      const css = read(SETTINGS_CONTROLS_CSS_PATH);
      expect(css.length).toBeGreaterThan(0);
    });

    it('select 클래스가 정의되어 있어야 함', () => {
      const css = read(SETTINGS_CONTROLS_CSS_PATH);
      expect(css.includes('.select')).toBe(true);
    });
  });

  describe('Hover 상태 색상 검증', () => {
    it('select:hover가 gray 기반 border-color를 사용해야 함', () => {
      const css = read(SETTINGS_CONTROLS_CSS_PATH);

      // :hover 스타일 블록 추출
      const hoverMatch = css.match(/\.select:hover\s*\{[^}]*\}/s);
      expect(hoverMatch, '❌ .select:hover 스타일이 정의되어 있지 않습니다').toBeTruthy();

      const hoverBlock = hoverMatch?.[0] || '';

      // border-color가 gray 계열 토큰 사용 확인
      const hasGrayBorderColor =
        hoverBlock.includes('--xeg-color-border-hover') ||
        hoverBlock.includes('--color-border-hover') ||
        hoverBlock.includes('--color-gray-') ||
        hoverBlock.includes('--xeg-color-neutral-');

      expect(
        hasGrayBorderColor,
        '❌ .select:hover의 border-color가 gray 기반 토큰을 사용하지 않습니다'
      ).toBe(true);

      // color-primary 사용 금지
      expect(
        hoverBlock.includes('--color-primary') || hoverBlock.includes('--xeg-color-primary'),
        '❌ .select:hover가 primary 색상을 사용하고 있습니다 (흑백 통일 위반)'
      ).toBe(false);
    });
  });

  describe('Focus 상태 색상 검증', () => {
    it('select:focus와 select:focus-visible이 gray 기반 border-color를 사용해야 함', () => {
      const css = read(SETTINGS_CONTROLS_CSS_PATH);

      // :focus, :focus-visible 스타일 블록 추출
      const focusMatch = css.match(/\.select:focus[^{]*\{[^}]*\}/gs);
      expect(
        focusMatch && focusMatch.length > 0,
        '❌ .select:focus 또는 .select:focus-visible 스타일이 정의되어 있지 않습니다'
      ).toBeTruthy();

      const focusBlocks = (focusMatch || []).join('\n');

      // border-color가 gray 계열 토큰 사용 확인
      const hasGrayBorderColor =
        focusBlocks.includes('--xeg-color-border-hover') ||
        focusBlocks.includes('--color-border-hover') ||
        focusBlocks.includes('--color-gray-') ||
        focusBlocks.includes('--xeg-color-neutral-');

      expect(
        hasGrayBorderColor,
        '❌ .select:focus의 border-color가 gray 기반 토큰을 사용하지 않습니다'
      ).toBe(true);

      // color-primary 사용 금지
      expect(
        focusBlocks.includes('--color-primary') || focusBlocks.includes('--xeg-color-primary'),
        '❌ .select:focus가 primary 색상을 사용하고 있습니다 (흑백 통일 위반)'
      ).toBe(false);
    });

    it('select focus ring(outline)이 gray 기반이어야 함', () => {
      const css = read(SETTINGS_CONTROLS_CSS_PATH);

      const focusMatch = css.match(/\.select:focus[^{]*\{[^}]*\}/gs);
      const focusBlocks = (focusMatch || []).join('\n');

      // outline이 --xeg-focus-ring 토큰 사용 확인
      const hasGrayFocusRing =
        focusBlocks.includes('--xeg-focus-ring') ||
        focusBlocks.includes('--color-gray-') ||
        focusBlocks.includes('--xeg-color-neutral-');

      expect(
        hasGrayFocusRing,
        '❌ .select의 focus ring(outline)이 gray 기반 토큰을 사용하지 않습니다'
      ).toBe(true);
    });
  });

  describe('라벨 가시성 검증', () => {
    it('label 클래스가 정의되어 있어야 함 (non-compact 모드용)', () => {
      const css = read(SETTINGS_CONTROLS_CSS_PATH);
      expect(css.includes('.label')).toBe(true);
    });

    it('label이 적절한 스타일을 가져야 함', () => {
      const css = read(SETTINGS_CONTROLS_CSS_PATH);

      const labelMatch = css.match(/\.label\s*\{[^}]*\}/s);
      expect(labelMatch, '❌ .label 스타일이 정의되어 있지 않습니다').toBeTruthy();

      const labelBlock = labelMatch?.[0] || '';

      // font-size와 color가 정의되어 있어야 함
      expect(
        labelBlock.includes('font-size'),
        '❌ .label에 font-size가 정의되어 있지 않습니다'
      ).toBe(true);

      expect(labelBlock.includes('color'), '❌ .label에 color가 정의되어 있지 않습니다').toBe(true);
    });
  });

  describe('디자인 토큰 사용 검증', () => {
    it('SettingsControls CSS가 하드코딩된 색상을 사용하지 않아야 함', () => {
      const css = read(SETTINGS_CONTROLS_CSS_PATH);

      // rgb, rgba, #hex 색상 하드코딩 금지
      const hardcodedColorPattern = /(rgb|rgba|#[0-9a-fA-F]{3,6})\s*\(/;
      expect(
        hardcodedColorPattern.test(css),
        '❌ SettingsControls CSS가 하드코딩된 색상을 사용하고 있습니다'
      ).toBe(false);
    });

    it('primary 색상 토큰을 사용하지 않아야 함 (흑백 통일)', () => {
      const css = read(SETTINGS_CONTROLS_CSS_PATH);

      // .select, .label, .setting, .body 클래스 블록에서만 검사
      const relevantBlocks = css.match(/\.(select|label|setting|body)[^{]*\{[^}]*\}/gs) || [];
      const relevantCSS = relevantBlocks.join('\n');

      expect(
        relevantCSS.includes('--color-primary') || relevantCSS.includes('--xeg-color-primary'),
        '❌ SettingsControls CSS가 primary 색상 토큰을 사용하고 있습니다 (흑백 통일 위반)'
      ).toBe(false);
    });
  });
});
