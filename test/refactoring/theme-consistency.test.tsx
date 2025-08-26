/**
 * 테마 일관성 검증 테스트
 *
 * TDD RED 단계: 툴바와 설정 모달 간의 테마 일관성을 검증하는 테스트
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { promises as fs } from 'fs';
import { join } from 'path';

type ThemeVariables = {
  [key: string]: string;
};

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
 * 다크 테마에서 정의되어야 하는 변수명들을 추출하는 함수
 */
function parseThemeVariableNames(cssContent: string, theme: 'light' | 'dark'): string[] {
  const selector = theme === 'dark' ? "[data-theme='dark']" : ':root';
  const variables = parseThemeVariables(cssContent, selector);
  return Object.keys(variables).map(key => `--${key}`);
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

  it('다크 테마에서 필수 디자인 토큰들이 재정의되어 있어야 함', async () => {
    const content = await fs.readFile(designTokensPath, 'utf8');

    // 다크 테마 섹션이 있는지 확인
    expect(content).toMatch(/\[data-theme=.dark.\]/);

    const darkThemeTokens = parseThemeVariableNames(content, 'dark');
    console.log('Found dark theme variables:', darkThemeTokens);

    // 필수 토큰들이 다크 테마에서 재정의되었는지 확인
    THEME_REQUIRED_TOKENS.forEach(token => {
      const fullTokenName = `--${token}`;
      expect(darkThemeTokens).toContain(fullTokenName);
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

    // 다크 테마의 텍스트는 neutral-50을 참조해야 함 (밝은 색상)
    expect(darkTextColor).toMatch(/var\(--xeg-color-neutral-50\)/);
  });

  test('툴바와 설정 모달이 glass-surface 클래스 방식을 사용해야 함', () => {
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

    // 새로운 방식: 댓글에서 glass-surface 클래스 기반 접근법 언급 확인
    expect(toolbarCss).toMatch(
      /glassmorphism은.*클래스로|glass-surface.*클래스.*사용|레이아웃 속성만 정의.*glassmorphism은.*클래스/
    );
    expect(modalCss).toMatch(
      /glassmorphism은.*클래스로|glass-surface.*클래스.*사용|레이아웃 속성만 정의.*glassmorphism은.*클래스/
    );

    // 직접 CSS 변수 사용이 제거되었는지 확인
    expect(toolbarCss).not.toMatch(/var\(--xeg-surface-glass-bg\)/);
    expect(modalCss).not.toMatch(/var\(--xeg-surface-glass-bg\)/);
  });
});
