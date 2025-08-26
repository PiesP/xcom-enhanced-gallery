/**
 * 테마 일관성 검증 테스트 (실제 문제 탐지)
 *
 * TDD RED 단계: 실제로 문제가 있는 부분을 찾아 테스트
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('테마 일관성 검증 (TDD RED)', () => {
  it('모든 UI 컴포넌트가 일관된 glassmorphism 변수를 사용해야 함', () => {
    // 다양한 UI 컴포넌트 CSS 파일들 확인
    const componentPaths = [
      'src/shared/components/ui/Toolbar/Toolbar.module.css',
      'src/shared/components/ui/SettingsModal/SettingsModal.module.css',
      'src/shared/components/ui/Toast/Toast.tsx', // TSX 파일에서 인라인 스타일 확인
      'src/shared/components/ui/Button/Button.tsx',
    ];

    // 표준 glassmorphism 변수들
    const standardGlassVars = [
      '--xeg-surface-glass-bg',
      '--xeg-surface-glass-border',
      '--xeg-surface-glass-shadow',
      '--xeg-surface-glass-blur',
    ];

    const componentsWithOldVariables = [];

    componentPaths.forEach(path => {
      if (existsSync(path)) {
        const content = readFileSync(path, 'utf-8');

        // 오래된 glassmorphism 변수 사용을 찾음
        const oldVariables = [
          '--xeg-toolbar-glass-bg',
          '--xeg-toast-glass-bg',
          '--xeg-gallery-glass-bg',
          '--xeg-media-glass-bg',
          'rgba(255, 255, 255, 0.85)', // 하드코딩된 값
          'rgba(0, 0, 0, 0.85)',
        ];

        oldVariables.forEach(oldVar => {
          if (content.includes(oldVar)) {
            componentsWithOldVariables.push({
              file: path,
              variable: oldVar,
            });
          }
        });
      }
    });

    // 모든 컴포넌트가 표준 변수를 사용해야 함
    expect(componentsWithOldVariables).toEqual([]);
  });

  it('다크 테마에서 텍스트 색상이 밝게 나타나야 함', () => {
    const designTokensPath = 'src/shared/styles/design-tokens.css';
    const content = readFileSync(designTokensPath, 'utf-8');

    // 다크 테마에서 text-primary가 정의되었는지 확인
    const darkThemeRegex = /\[data-theme=['"]dark['"]\]\s*{([^}]+)}/g;
    const matches = [...content.matchAll(darkThemeRegex)];

    let darkTextPrimaryFound = false;
    matches.forEach(match => {
      const block = match[1];
      if (block.includes('--xeg-color-text-primary')) {
        darkTextPrimaryFound = true;
        // 다크 테마에서는 neutral-50 (밝은 색상)을 사용해야 함
        expect(block).toMatch(/--xeg-color-text-primary:\s*var\(--xeg-color-neutral-50\)/);
      }
    });

    expect(darkTextPrimaryFound).toBe(true);
  });

  it('중복된 glassmorphism 변수 정의가 없어야 함', () => {
    const designTokensPath = 'src/shared/styles/design-tokens.css';
    const content = readFileSync(designTokensPath, 'utf-8');

    // 이제 사용하지 않는 오래된 변수들이 남아있는지 확인
    const deprecatedVariables = [
      '--xeg-toolbar-glass-bg:',
      '--xeg-toast-glass-bg:',
      '--xeg-gallery-glass-bg:',
      '--xeg-media-glass-bg:',
    ];

    const foundDeprecated = [];
    deprecatedVariables.forEach(variable => {
      if (content.includes(variable)) {
        foundDeprecated.push(variable);
      }
    });

    // 중복 정의가 있으면 실패해야 함
    expect(foundDeprecated.length).toBe(0);
  });
});
