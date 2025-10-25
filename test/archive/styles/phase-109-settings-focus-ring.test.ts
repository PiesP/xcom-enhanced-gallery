/**
 * Phase 109.1 RED Test: Settings Focus Ring Color Consistency
 * @description 설정 드롭다운의 focus ring이 파란색 하드코딩 없이 표준 토큰을 사용하는지 검증
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const DESIGN_TOKENS_PATH = 'src/shared/styles/design-tokens.semantic.css';
const SETTINGS_CONTROLS_CSS_PATH = 'src/shared/components/ui/Settings/SettingsControls.module.css';

function read(path: string): string {
  return readFileSync(path, 'utf-8');
}

describe('Phase 109.1: Settings Focus Ring Color Consistency', () => {
  it('design-tokens.semantic.css에 파란색 하드코딩된 focus ring이 없어야 함', () => {
    const tokensCSS = read(DESIGN_TOKENS_PATH);

    // --xeg-settings-select-focus-ring 토큰에서 oklch 파란색 값 검사
    // oklch(0.676 0.151 237.8) 는 파란색
    const blueColorPattern = /--xeg-settings-select-focus-ring:.*oklch\([^)]*237\.8[^)]*\)/;

    expect(
      blueColorPattern.test(tokensCSS),
      '❌ --xeg-settings-select-focus-ring에 파란색(237.8 hue)이 하드코딩되어 있습니다'
    ).toBe(false);
  });

  it('SettingsControls.module.css가 표준 focus ring 토큰을 사용해야 함', () => {
    const controlsCSS = read(SETTINGS_CONTROLS_CSS_PATH);

    // box-shadow에 --xeg-settings-select-focus-ring 사용 확인
    const usesCustomFocusRing = /box-shadow:.*var\(--xeg-settings-select-focus-ring\)/.test(
      controlsCSS
    );

    if (usesCustomFocusRing) {
      // 커스텀 토큰을 사용 중이라면, 이 토큰이 파란색이 아니어야 함
      const tokensCSS = read(DESIGN_TOKENS_PATH);
      const blueColorPattern = /--xeg-settings-select-focus-ring:.*oklch\([^)]*237\.8[^)]*\)/;

      expect(
        blueColorPattern.test(tokensCSS),
        '❌ 커스텀 focus ring 토큰이 파란색으로 하드코딩되어 있습니다'
      ).toBe(false);
    }
  });

  it('설정 드롭다운 focus 상태가 표준 outline 토큰을 사용해야 함', () => {
    const controlsCSS = read(SETTINGS_CONTROLS_CSS_PATH);

    // .select:focus 또는 .select:focus-visible 블록 확인
    const hasFocusOutline =
      /\.select:focus(-visible)?[^{]*\{[^}]*outline:\s*var\(--xeg-focus-ring\)/.test(controlsCSS);

    expect(hasFocusOutline, '✅ 설정 드롭다운이 표준 --xeg-focus-ring 토큰을 사용해야 합니다').toBe(
      true
    );
  });

  it('design-tokens.semantic.css에서 settings 관련 파란색 하드코딩이 전혀 없어야 함', () => {
    const tokensCSS = read(DESIGN_TOKENS_PATH);

    // Settings 섹션에서 파란색 계열(hue 220-260) oklch 값 검사
    const settingsSection =
      tokensCSS.match(/\/\* Settings Component Tokens \*\/[\s\S]*?(?=\/\*|$)/)?.[0] || '';

    // 파란색 hue 범위 (220-260도)
    const blueHuePattern = /oklch\([^)]*\s(2[2-6]\d|23\d|24\d|25\d|260)(?:\.\d+)?\s*\)/;

    expect(
      blueHuePattern.test(settingsSection),
      '❌ Settings 토큰 섹션에 파란색 계열 하드코딩이 발견되었습니다'
    ).toBe(false);
  });
});
