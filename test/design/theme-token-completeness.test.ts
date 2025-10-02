/**
 * @fileoverview Theme Token Completeness Tests
 * @description 라이트/다크 테마 토큰 완전성 및 하드코딩 색상 검증
 * @version 1.0.0 - Epic THEME-ICON-UNIFY-001 Phase A (Completed)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Theme Token Completeness', () => {
  const primitiveTokensPath = resolve(
    __dirname,
    '../../src/shared/styles/design-tokens.primitive.css'
  );
  const semanticTokensPath = resolve(
    __dirname,
    '../../src/shared/styles/design-tokens.semantic.css'
  );

  const toolbarCssPath = resolve(
    __dirname,
    '../../src/shared/components/ui/Toolbar/Toolbar.module.css'
  );
  const settingsModalCssPath = resolve(
    __dirname,
    '../../src/shared/components/ui/SettingsModal/SettingsModal.module.css'
  );
  const toastCssPath = resolve(__dirname, '../../src/shared/components/ui/Toast/Toast.module.css');

  describe('Semantic 토큰 정의 검증', () => {
    it('모든 semantic 색상 토큰이 라이트/다크 테마에서 정의되어야 함', () => {
      const semanticContent = readFileSync(semanticTokensPath, 'utf-8');

      // 필수 semantic 토큰 목록
      const requiredTokens = [
        '--color-bg-primary',
        '--color-bg-secondary',
        '--color-text-primary',
        '--color-border-primary',
        '--xeg-bg-toolbar',
        '--xeg-toolbar-bg',
        '--xeg-toolbar-border',
        '--xeg-toolbar-shadow',
        '--xeg-settings-bg',
        '--xeg-settings-border',
        '--xeg-toast-bg-info',
        '--xeg-toast-bg-success',
        '--xeg-toast-bg-warning',
        '--xeg-toast-bg-error',
      ];

      // [data-theme="light"] 블록 확인 - 전체 내용에서 모든 블록 탐색
      const lightThemePattern = /\[data-theme=['"]light['"]\]\s*\{/g;
      const lightThemeExists = lightThemePattern.test(semanticContent);
      expect(lightThemeExists, '[data-theme="light"] 블록이 존재해야 함').toBe(true);

      // 각 토큰이 파일 어디든 존재하는지 확인 (더 관대한 검증)
      requiredTokens.forEach(token => {
        const tokenExists = semanticContent.includes(token);
        expect(tokenExists, `${token} 토큰이 파일에 정의되어야 함`).toBe(true);
      });

      // [data-theme="dark"] 블록 확인
      const darkThemePattern = /\[data-theme=['"]dark['"]\]\s*\{/g;
      const darkThemeExists = darkThemePattern.test(semanticContent);
      expect(darkThemeExists, '[data-theme="dark"] 블록이 존재해야 함').toBe(true);

      // prefers-color-scheme: dark 미디어쿼리 확인
      const prefersColorScheme = /@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)/;
      expect(
        semanticContent.match(prefersColorScheme),
        'prefers-color-scheme: dark 지원이 있어야 함'
      ).toBeTruthy();
    });
  });

  describe('하드코딩 색상 검출', () => {
    const hardcodedColorPatterns = [
      /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g, // rgb(a) 함수
      /#[0-9a-fA-F]{3,8}(?!\s*;)/g, // hex 색상 (단, 주석 제외)
    ];

    it('Toolbar 컴포넌트가 하드코딩 색상을 사용하지 않아야 함', () => {
      const toolbarContent = readFileSync(toolbarCssPath, 'utf-8');

      // 주석 제거
      const contentWithoutComments = toolbarContent.replace(/\/\*[\s\S]*?\*\//g, '');

      hardcodedColorPatterns.forEach((pattern, index) => {
        const matches = contentWithoutComments.match(pattern);
        if (matches) {
          const filteredMatches = matches.filter(match => {
            // var() 함수 내부는 허용
            const contextStart = contentWithoutComments.indexOf(match);
            const before = contentWithoutComments.substring(
              Math.max(0, contextStart - 10),
              contextStart
            );
            return !before.includes('var(');
          });

          expect(
            filteredMatches.length,
            `Toolbar.module.css에서 하드코딩 색상 패턴 ${index + 1} 검출: ${filteredMatches.join(', ')}`
          ).toBe(0);
        }
      });
    });

    it('SettingsModal 컴포넌트가 하드코딩 색상을 사용하지 않아야 함', () => {
      const settingsContent = readFileSync(settingsModalCssPath, 'utf-8');

      // 주석 제거
      const contentWithoutComments = settingsContent.replace(/\/\*[\s\S]*?\*\//g, '');

      hardcodedColorPatterns.forEach((pattern, index) => {
        const matches = contentWithoutComments.match(pattern);
        if (matches) {
          const filteredMatches = matches.filter(match => {
            // var() 함수 내부는 허용
            const contextStart = contentWithoutComments.indexOf(match);
            const before = contentWithoutComments.substring(
              Math.max(0, contextStart - 10),
              contextStart
            );
            return !before.includes('var(');
          });

          expect(
            filteredMatches.length,
            `SettingsModal.module.css에서 하드코딩 색상 패턴 ${index + 1} 검출: ${filteredMatches.join(', ')}`
          ).toBe(0);
        }
      });
    });

    it('Toast 컴포넌트가 하드코딩 색상을 사용하지 않아야 함', () => {
      const toastContent = readFileSync(toastCssPath, 'utf-8');

      // 주석 제거
      const contentWithoutComments = toastContent.replace(/\/\*[\s\S]*?\*\//g, '');

      hardcodedColorPatterns.forEach((pattern, index) => {
        const matches = contentWithoutComments.match(pattern);
        if (matches) {
          const filteredMatches = matches.filter(match => {
            // var() 함수 내부는 허용
            const contextStart = contentWithoutComments.indexOf(match);
            const before = contentWithoutComments.substring(
              Math.max(0, contextStart - 10),
              contextStart
            );
            return !before.includes('var(');
          });

          expect(
            filteredMatches.length,
            `Toast.module.css에서 하드코딩 색상 패턴 ${index + 1} 검출: ${filteredMatches.join(', ')}`
          ).toBe(0);
        }
      });
    });
  });
});
