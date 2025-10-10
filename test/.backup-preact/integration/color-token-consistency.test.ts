/**
 * @fileoverview 색상 토큰 일관성 테스트
 * @description 하드코딩된 색상 사용 금지 및 컴포넌트 토큰 활용 검증
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

// TSX 파일 재귀 검색 함수
function findTsxFiles(dir) {
  const files = [];
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findTsxFiles(fullPath));
    } else if (stat.isFile() && item.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

describe('Color Token Consistency', () => {
  describe('Hard-coded Color Prevention', () => {
    it('should not use hardcoded Twitter colors in glass-surface', () => {
      const cssPath = resolve(projectRoot, 'src/features/gallery/styles/gallery-global.css');
      const cssContent = readFileSync(cssPath, 'utf8');

      // Twitter 브랜드 색상 하드코딩 금지
      expect(cssContent).not.toMatch(/#1d9bf0/i, 'Should not use hardcoded Twitter blue (#1d9bf0)');
      expect(cssContent).not.toMatch(
        /#1570b8/i,
        'Should not use hardcoded Twitter blue active (#1570b8)'
      );
      expect(cssContent).not.toMatch(
        /#1a8cd8/i,
        'Should not use hardcoded Twitter blue hover (#1a8cd8)'
      );

      // Twitter 토큰 직접 사용 금지 (폴백 제외)
      const twitterTokenUsage = cssContent.match(/var\(--color-twitter-blue[^,)]*\)/g);
      expect(twitterTokenUsage).toBeNull(
        'Should not use Twitter tokens without semantic abstraction'
      );
    });

    it('should not use hardcoded rgba colors in glass-surface', () => {
      const cssPath = resolve(projectRoot, 'src/features/gallery/styles/gallery-global.css');
      const cssContent = readFileSync(cssPath, 'utf8');

      // glass-surface 클래스 내 rgba 하드코딩 금지
      const glassSurfaceSection = cssContent.match(/\.glass-surface\s*{[^}]+}/gs);
      if (glassSurfaceSection) {
        for (const section of glassSurfaceSection) {
          expect(section).not.toMatch(
            /rgba\(29,\s*155,\s*240/i,
            'Should not use hardcoded Twitter blue rgba'
          );
          expect(section).not.toMatch(
            /rgba\(21,\s*32,\s*43/i,
            'Should not use hardcoded dark background rgba'
          );
        }
      }
    });
  });

  describe('Semantic Token Usage', () => {
    it('should use semantic tokens for toolbar backgrounds (alias removed)', () => {
      const toolbarCssPath = resolve(
        projectRoot,
        'src/shared/components/ui/Toolbar/Toolbar.module.css'
      );
      const toolbarCss = readFileSync(toolbarCssPath, 'utf8');

      // 툴바에서 시맨틱 토큰 사용 (component alias 금지)
      expect(toolbarCss).toMatch(
        /background:\s*var\(--xeg-bg-toolbar\)/,
        'Toolbar should use semantic background token (--xeg-bg-toolbar)'
      );
      expect(toolbarCss).not.toMatch(
        /--xeg-comp-toolbar-bg/,
        'Toolbar should not use deprecated component alias token'
      );
    });

    it('should use semantic tokens for modal backgrounds', () => {
      const modalCssPath = resolve(
        projectRoot,
        'src/shared/components/ui/SettingsModal/SettingsModal.module.css'
      );
      const modalCss = readFileSync(modalCssPath, 'utf8');

      // 모달에서 시맨틱 토큰 사용 확인
      expect(modalCss).toMatch(
        /background:\s*var\(--xeg-modal-bg\)/,
        'Modal should use semantic background token'
      );
    });
  });

  describe('Theme-specific Token Definition', () => {
    it('should define theme-specific toolbar semantic tokens correctly', () => {
      const semanticTokensPath = resolve(
        projectRoot,
        'src/shared/styles/design-tokens.semantic.css'
      );
      const semanticTokens = readFileSync(semanticTokensPath, 'utf8');

      // 라이트 / 다크 모드에서 시맨틱 툴바 배경 토큰 정의 확인
      expect(semanticTokens).toMatch(
        /--xeg-bg-toolbar:/,
        'Should define base semantic toolbar background token'
      );
      expect(semanticTokens).toMatch(
        /\[data-theme=['"]dark['"][^}]*--xeg-bg-toolbar/s,
        'Should define dark mode semantic toolbar override'
      );

      // prefers-color-scheme 지원 확인
      expect(semanticTokens).toMatch(
        /@media\s*\(\s*prefers-color-scheme:\s*dark\s*\)/,
        'Should support prefers-color-scheme: dark'
      );
    });

    it('should define glass effect tokens', () => {
      const semanticTokensPath = resolve(
        projectRoot,
        'src/shared/styles/design-tokens.semantic.css'
      );
      const semanticTokens = readFileSync(semanticTokensPath, 'utf8');

      // 유리 효과 토큰 정의 확인
      expect(semanticTokens).toMatch(
        /--xeg-surface-glass-bg/,
        'Should define glass surface background token'
      );
      expect(semanticTokens).toMatch(
        /--xeg-surface-glass-border/,
        'Should define glass surface border token'
      );
    });
  });

  describe('Accessibility Token Support', () => {
    it('should support high contrast mode', () => {
      const componentTokensPath = resolve(
        projectRoot,
        'src/shared/styles/design-tokens.component.css'
      );
      const componentTokens = readFileSync(componentTokensPath, 'utf8');

      // 고대비 모드 지원 확인
      expect(componentTokens).toMatch(
        /@media\s*\(\s*prefers-contrast:\s*high\s*\)/,
        'Should support prefers-contrast: high'
      );
    });

    it('should support reduced transparency preference', () => {
      const componentTokensPath = resolve(
        projectRoot,
        'src/shared/styles/design-tokens.component.css'
      );
      const componentTokens = readFileSync(componentTokensPath, 'utf8');

      // 투명도 감소 선호 지원 확인
      expect(componentTokens).toMatch(
        /@media\s*\(\s*prefers-reduced-transparency:\s*reduce\s*\)/,
        'Should support prefers-reduced-transparency: reduce'
      );
    });
  });
});

describe('Glass Surface Class Usage', () => {
  it('should not use glass-surface class in TSX components', () => {
    // TSX 파일에서 glass-surface 클래스 사용 금지 확인
    const srcDir = resolve(projectRoot, 'src');
    const tsxFiles = findTsxFiles(srcDir);

    for (const filePath of tsxFiles) {
      const content = readFileSync(filePath, 'utf8');
      expect(content).not.toMatch(
        /['"`]glass-surface['"`]/,
        `File ${filePath} should not use glass-surface class`
      );
    }
  });
});
