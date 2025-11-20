/**
 * Phase 54.1: 다크 모드 토큰 통합 TDD 테스트
 *
 * 목표: 컴포넌트 CSS에서 개별 정의된 @media (prefers-color-scheme: dark) 중복 검출
 *
 * RED 상태: 현재 5개 컴포넌트 CSS 파일에서 개별 미디어 쿼리 사용
 * - ToolbarShell.module.css
 * - VerticalImageItem.module.css
 * - ModalShell.module.css
 * - Button.module.css
 * - Toolbar.module.css (이전 고대비 조합 제거됨)
 *
 * GREEN 목표: semantic layer만 @media 쿼리 사용, 컴포넌트는 토큰 참조만
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

/**
 * 재귀적으로 파일 찾기
 */
function findFiles(dir: string, pattern: RegExp, results: string[] = []): string[] {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        findFiles(fullPath, pattern, results);
      } else if (entry.isFile() && pattern.test(entry.name)) {
        results.push(fullPath);
      }
    }
  } catch (err) {
    // 디렉터리 접근 권한 문제 등 무시
  }

  return results;
}

describe('Phase 54.1: 다크 모드 토큰 통합', () => {
  setupGlobalTestIsolation();

  it('컴포넌트 CSS는 @media (prefers-color-scheme: dark)를 사용하지 않음', () => {
    const componentCssFiles = findFiles(join(projectRoot, 'src'), /\.module\.css$/).filter(file => {
      // features, shared/components 하위의 컴포넌트 CSS만
      return file.includes('features') || file.includes('shared/components');
    });

    const violations: Array<{ file: string; lines: string[] }> = [];

    componentCssFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      const relativePath = file.replace(projectRoot, '');

      // @media (prefers-color-scheme: dark) 패턴 검출
      const darkModePattern = /@media\s*\([^)]*prefers-color-scheme\s*:\s*dark[^)]*\)/gi;
      const matches = [...content.matchAll(darkModePattern)];

      if (matches.length > 0) {
        const lines = matches.map(m => {
          const lineNumber = content.substring(0, m.index).split('\n').length;
          return `  Line ${lineNumber}: ${m[0].trim()}`;
        });

        violations.push({
          file: relativePath,
          lines,
        });
      }
    });

    if (violations.length > 0) {
      console.error('\n❌ 컴포넌트 CSS에서 다크 모드 미디어 쿼리 발견:');
      console.error(`   총 ${violations.length}개 파일에서 중복 정의\n`);

      violations.forEach(({ file, lines }) => {
        console.error(`📄 ${file}`);
        lines.forEach(line => console.error(line));
        console.error('');
      });

      console.error('💡 해결 방법:');
      console.error('   1. design-tokens.semantic.css에 다크 모드 토큰 정의');
      console.error('   2. 컴포넌트는 토큰 참조만 사용 (--xeg-*, --color-*)');
      console.error('   3. @media 쿼리는 semantic layer에만 존재\n');
    }

    expect(violations).toHaveLength(0);
  });

  it('Semantic layer는 다크 모드 토큰을 일관되게 정의', () => {
    const semanticCss = readFileSync(
      join(projectRoot, 'src/shared/styles/design-tokens.semantic.css'),
      'utf-8'
    );

    // 다크 모드 블록이 존재하는지 확인
    expect(semanticCss).toContain('@media (prefers-color-scheme: dark)');

    // 핵심 토큰들이 정의되어 있는지 확인
    const requiredTokens = [
      '--color-bg-primary',
      '--color-text-primary',
      '--xeg-gallery-bg',
      '--xeg-bg-toolbar',
      '--xeg-modal-bg',
      '--xeg-modal-border',
    ];

    requiredTokens.forEach(token => {
      expect(semanticCss).toContain(token);
    });
  });

  it('컴포넌트는 semantic 토큰만 참조 (하드코딩된 다크 모드 값 없음)', () => {
    const componentCssFiles = findFiles(join(projectRoot, 'src'), /\.module\.css$/).filter(file => {
      return file.includes('features') || file.includes('shared/components');
    });

    const violations: Array<{ file: string; hardcodedValues: string[] }> = [];

    componentCssFiles.forEach(file => {
      const content = readFileSync(file, 'utf-8');
      const relativePath = file.replace(projectRoot, '');

      // @media 블록 내에서 하드코딩된 색상 값 검출
      const darkModeBlockPattern =
        /@media\s*\([^)]*prefers-color-scheme\s*:\s*dark[^)]*\)\s*\{[^}]*\{[^}]*\}/gis;
      const blocks = [...content.matchAll(darkModeBlockPattern)];

      const hardcodedValues: string[] = [];

      blocks.forEach(block => {
        const blockContent = block[0];
        // rgba(), rgb(), #hex 색상 하드코딩 검출
        const colorPattern = /(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})/g;
        const colors = [...blockContent.matchAll(colorPattern)];

        if (colors.length > 0) {
          colors.forEach(c => {
            hardcodedValues.push(`  ${c[0]}`);
          });
        }
      });

      if (hardcodedValues.length > 0) {
        violations.push({
          file: relativePath,
          hardcodedValues,
        });
      }
    });

    if (violations.length > 0) {
      console.error('\n❌ 다크 모드 블록에서 하드코딩된 색상 값 발견:');
      console.error(`   총 ${violations.length}개 파일\n`);

      violations.forEach(({ file, hardcodedValues }) => {
        console.error(`📄 ${file}`);
        hardcodedValues.forEach(val => console.error(val));
        console.error('');
      });

      console.error('💡 해결 방법:');
      console.error('   하드코딩된 값을 semantic 토큰으로 교체');
      console.error('   예: rgba(30, 30, 30, 0.95) → var(--xeg-bg-toolbar-dark)\n');
    }

    expect(violations).toHaveLength(0);
  });
});
