/**
 * @fileoverview Hardcoded Color Detection Tests (Phase 55.3)
 * @description CSS 파일에서 하드코딩된 색상 값 검출 및 방지
 *
 * Purpose:
 * - CSS 모듈에서 하드코딩된 hex 색상 값 검출
 * - 디자인 토큰 체계를 우회하는 패턴 방지
 * - primitive/semantic 토큰 사용 강제
 *
 * Allowed Exceptions:
 * - design-tokens.primitive.css의 #ffffff, #000000 (base colors)
 * - 주석 내의 hex 값 (참조용 주석)
 */

import { describe, expect, it } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { join } from 'node:path';
import { readdirSync, readFileSync, statSync } from 'node:fs';

describe('hardcoded-color-detection (Phase 55.3)', () => {
  setupGlobalTestIsolation();

  const projectRoot = process.cwd();

  /**
   * CSS 파일 재귀 탐색
   */
  function findCssFiles(dir: string, exclude: string[] = []): string[] {
    const files: string[] = [];

    try {
      const entries = readdirSync(dir);

      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);

        if (stat.isDirectory()) {
          if (!exclude.includes(entry)) {
            files.push(...findCssFiles(fullPath, exclude));
          }
        } else if (entry.endsWith('.css')) {
          files.push(fullPath);
        }
      }
    } catch (_error) {
      // 디렉터리 접근 실패 시 빈 배열 반환
    }

    return files;
  }

  /**
   * 하드코딩된 hex 색상 값 추출 (주석 제외)
   */
  function extractHardcodedColors(cssContent: string): Array<{ value: string; line: number }> {
    const lines = cssContent.split('\n');
    const hardcoded: Array<{ value: string; line: number }> = [];

    // 주석을 제거한 버전 생성 (/* ... */ 형태)
    const withoutComments = cssContent.replace(/\/\*[\s\S]*?\*\//g, '');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 주석 라인 스킵
      if (line.trim().startsWith('/*') || line.trim().startsWith('*')) {
        continue;
      }

      // hex 색상 패턴 매칭 (#fff, #ffffff)
      const hexPattern = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;
      let match: RegExpExecArray | null;

      while ((match = hexPattern.exec(line)) !== null) {
        const fullMatch = match[0];

        // 주석 내부인지 확인 (라인 단위)
        const beforeMatch = line.substring(0, match.index);
        const commentStart = beforeMatch.lastIndexOf('/*');
        const commentEnd = beforeMatch.lastIndexOf('*/');

        if (commentStart !== -1 && commentEnd < commentStart) {
          // 주석 내부이므로 스킵
          continue;
        }

        hardcoded.push({
          value: fullMatch,
          line: i + 1,
        });
      }
    }

    return hardcoded;
  }

  it('CSS 모듈 파일에 하드코딩된 hex 색상 값이 없어야 함', () => {
    const srcDir = join(projectRoot, 'src');
    const cssFiles = findCssFiles(srcDir);
    const violations: Array<{ file: string; colors: Array<{ value: string; line: number }> }> = [];

    for (const file of cssFiles) {
      // primitive 토큰 파일은 예외 (base colors 허용)
      if (file.includes('design-tokens.primitive.css')) {
        continue;
      }

      const content = readFileSync(file, 'utf-8');
      const hardcoded = extractHardcodedColors(content);

      if (hardcoded.length > 0) {
        violations.push({
          file: file.replace(projectRoot, ''),
          colors: hardcoded,
        });
      }
    }

    if (violations.length > 0) {
      const report = violations
        .map(v => {
          const colorList = v.colors.map(c => `    Line ${c.line}: ${c.value}`).join('\n');
          return `  ${v.file}\n${colorList}`;
        })
        .join('\n\n');

      throw new Error(
        `CSS 파일에서 하드코딩된 hex 색상 값을 발견했습니다:\n\n${report}\n\n` +
          `→ 해결 방법:\n` +
          `  1. primitive 토큰 정의: src/shared/styles/design-tokens.primitive.css\n` +
          `  2. semantic 토큰 매핑: src/shared/styles/design-tokens.semantic.css\n` +
          `  3. var(--token-name) 사용\n\n` +
          `예외:\n` +
          `  - design-tokens.primitive.css의 #ffffff, #000000 (base colors)\n` +
          `  - 주석 내의 참조 값 (참조용 주석)`
      );
    }

    expect(violations).toHaveLength(0);
  });

  it('semantic 토큰 파일에 var() fallback으로 hex 값이 사용되지 않아야 함', () => {
    const semanticTokensPath = join(projectRoot, 'src/shared/styles/design-tokens.semantic.css');
    const content = readFileSync(semanticTokensPath, 'utf-8');

    // var(--token, #fallback) 패턴 검출
    const fallbackPattern = /var\(--[\w-]+,\s*(#[0-9a-fA-F]{3,6})\)/g;
    const violations: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = fallbackPattern.exec(content)) !== null) {
      violations.push(match[0]);
    }

    if (violations.length > 0) {
      throw new Error(
        `semantic 토큰에서 var() fallback으로 hex 값을 사용하고 있습니다:\n  ${violations.join('\n  ')}\n\n` +
          `→ 해결 방법: primitive 토큰을 먼저 정의하고 fallback 없이 사용하세요.\n` +
          `  예시: var(--color-gray-800) (O)  vs  var(--color-gray-800, #2a2a2a) (X)`
      );
    }

    expect(violations).toHaveLength(0);
  });

  it('primitive 토큰 파일에 정의된 색상은 oklch 또는 base colors(#ffffff, #000000)여야 함', () => {
    const primitiveTokensPath = join(projectRoot, 'src/shared/styles/design-tokens.primitive.css');
    const content = readFileSync(primitiveTokensPath, 'utf-8');

    // 토큰 정의 라인 추출
    const lines = content.split('\n');
    const violations: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // 토큰 정의 라인인지 확인
      if (!line.startsWith('--color-') || !line.includes(':')) {
        continue;
      }

      // oklch(), #ffffff, #000000이 아닌 hex 값 검출
      const hasOklch = line.includes('oklch(');
      const hasWhite = line.includes('#ffffff');
      const hasBlack = line.includes('#000000');
      const hasOtherHex = /#[0-9a-fA-F]{3,6}/.test(line) && !hasWhite && !hasBlack;

      if (hasOtherHex && !hasOklch) {
        violations.push(`Line ${i + 1}: ${line}`);
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `primitive 토큰에서 oklch() 또는 base colors가 아닌 hex 값을 발견했습니다:\n  ${violations.join('\n  ')}\n\n` +
          `→ 해결 방법: oklch() 형식으로 변환하거나 #ffffff/#000000 base colors만 사용하세요.`
      );
    }

    expect(violations).toHaveLength(0);
  });
});
