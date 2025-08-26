/**
 * 테마 일관성 검증 테스트
 *
 * TDD RED 단계: 툴바와 설정 모달 간의 테마 일관성을 검증하는 테스트
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

interface ThemeVariables {
  [key: string]: string;
}

/**
 * CSS 파일에서 특정 선택자의 CSS 변수들을 파싱하는 함수
 */
function parseThemeVariables(cssContent: string, selector: string): ThemeVariables {
  const variables: ThemeVariables = {};

  // 선택자 블록을 찾아서 내부의 CSS 변수들 추출
  const selectorRegex = new RegExp(
    `${selector.replace(/[\[\]'=]/g, '\\$&')}\\s*\\{([^}]+)\\}`,
    'gs'
  );
  const matches = cssContent.matchAll(selectorRegex);

  for (const match of matches) {
    const block = match[1];
    const varMatches = block.matchAll(/\s*--([a-zA-Z0-9-]+)\s*:\s*([^;]+);?/g);

    for (const varMatch of varMatches) {
      const name = varMatch[1];
      const value = varMatch[2].trim();
      variables[name] = value;
    }
  }

  return variables;
}

/**
 * 툴바와 설정 모달에서 공통으로 사용하는 디자인 토큰들
 */
const SHARED_DESIGN_TOKENS = [
  'xeg-surface-glass-bg',
  'xeg-surface-glass-border',
  'xeg-surface-glass-shadow',
  'xeg-surface-glass-blur',
  'xeg-color-text-primary',
  'xeg-color-text-secondary',
  'xeg-color-border-primary',
];

/**
 * 필수 테마별 변수 정의가 있어야 하는 토큰들
 */
const THEME_REQUIRED_TOKENS = [
  'xeg-surface-glass-bg',
  'xeg-color-text-primary',
  'xeg-color-border-primary',
];

describe('테마 일관성 검증', () => {
  const designTokensPath = join(process.cwd(), 'src', 'shared', 'styles', 'design-tokens.css');

  it('design-tokens.css 파일이 존재해야 함', () => {
    expect(() => readFileSync(designTokensPath, 'utf-8')).not.toThrow();
  });

  it('라이트 테마에서 공통 디자인 토큰들이 정의되어 있어야 함', () => {
    const cssContent = readFileSync(designTokensPath, 'utf-8');
    const lightThemeVariables = parseThemeVariables(cssContent, ':root');

    SHARED_DESIGN_TOKENS.forEach(token => {
      expect(lightThemeVariables[token]).toBeDefined();
      expect(lightThemeVariables[token]).not.toBe('');
    });
  });

  it('다크 테마에서 필수 디자인 토큰들이 재정의되어 있어야 함', () => {
    const cssContent = readFileSync(designTokensPath, 'utf-8');
    const darkThemeVariables = parseThemeVariables(cssContent, "[data-theme='dark']");

    // 현재는 다크 테마 변수가 정의되지 않아서 테스트가 실패할 것 (RED 단계)
    THEME_REQUIRED_TOKENS.forEach(token => {
      if (!darkThemeVariables[token]) {
        console.log(`🔴 다크 테마에서 누락된 토큰: --${token}`);
      }
      expect(darkThemeVariables[token]).toBeDefined();
      expect(darkThemeVariables[token]).not.toBe('');
    });
  });

  it('다크 테마의 surface-glass-bg는 어두운 색상이어야 함', () => {
    const cssContent = readFileSync(designTokensPath, 'utf-8');
    const lightThemeVariables = parseThemeVariables(cssContent, ':root');
    const darkThemeVariables = parseThemeVariables(cssContent, "[data-theme='dark']");

    const lightBg = lightThemeVariables['xeg-surface-glass-bg'];
    const darkBg = darkThemeVariables['xeg-surface-glass-bg'];

    // 라이트 테마와 다크 테마의 배경색이 달라야 함
    expect(lightBg).toBeDefined();
    expect(darkBg).toBeDefined();
    expect(lightBg).not.toBe(darkBg);

    // 다크 테마는 낮은 R,G,B 값을 가져야 함 (어두운 색상)
    if (darkBg?.includes('rgba')) {
      const rgbaMatch = darkBg.match(/rgba\((\d+),\s*(\d+),\s*(\d+),/);
      if (rgbaMatch) {
        const [, r, g, b] = rgbaMatch.map(Number);
        const averageValue = (r + g + b) / 3;

        // 다크 테마는 평균 RGB 값이 128 미만이어야 함
        expect(averageValue).toBeLessThan(128);
      }
    }
  });

  it('다크 테마의 text-primary는 밝은 색상이어야 함', () => {
    const cssContent = readFileSync(designTokensPath, 'utf-8');
    const darkThemeVariables = parseThemeVariables(cssContent, "[data-theme='dark']");

    const darkTextColor = darkThemeVariables['xeg-color-text-primary'];
    expect(darkTextColor).toBeDefined();

    // 다크 테마의 텍스트는 밝은 색상이어야 함
    if (darkTextColor?.includes('#')) {
      const hexValue = parseInt(darkTextColor.replace('#', ''), 16);
      const r = (hexValue >> 16) & 255;
      const g = (hexValue >> 8) & 255;
      const b = hexValue & 255;
      const averageValue = (r + g + b) / 3;

      // 다크 테마의 텍스트는 평균 RGB 값이 200 이상이어야 함 (밝은 색상)
      expect(averageValue).toBeGreaterThan(200);
    }
  });

  it('툴바와 설정 모달이 glass-surface 클래스 통합 방식을 사용해야 함', () => {
    const toolbarPath = join(
      process.cwd(),
      'src',
      'shared',
      'components',
      'ui',
      'Toolbar',
      'Toolbar.module.css'
    );
    const settingsModalPath = join(
      process.cwd(),
      'src',
      'shared',
      'components',
      'ui',
      'SettingsModal',
      'SettingsModal.module.css'
    );

    const toolbarCss = readFileSync(toolbarPath, 'utf-8');
    const modalCss = readFileSync(settingsModalPath, 'utf-8');

    // 개별 CSS에서는 glassmorphism 속성이 제거되어야 함
    expect(toolbarCss).not.toMatch(/\.galleryToolbar.*var\(--xeg-surface-glass-bg\)/s);
    expect(modalCss).not.toMatch(/\.modal.*var\(--xeg-surface-glass-bg\)/s);

    // 대신 TSX 파일에서 glass-surface 클래스 사용 확인
    const toolbarTsxPath = join(
      process.cwd(),
      'src',
      'shared',
      'components',
      'ui',
      'Toolbar',
      'Toolbar.tsx'
    );
    const modalTsxPath = join(
      process.cwd(),
      'src',
      'shared',
      'components',
      'ui',
      'SettingsModal',
      'SettingsModal.tsx'
    );

    const toolbarTsx = readFileSync(toolbarTsxPath, 'utf-8');
    const modalTsx = readFileSync(modalTsxPath, 'utf-8');

    expect(toolbarTsx).toMatch(/glass-surface/);
    expect(modalTsx).toMatch(/glass-surface/);
  });
});
