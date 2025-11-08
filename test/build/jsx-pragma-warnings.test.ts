/**
 * @fileoverview JSX Pragma 경고 감지 테스트
 * @description Epic JSX-PRAGMA-CLEANUP Phase 1 (RED)
 *
 * 목적: esbuild JSX pragma 경고 제거 및 SolidJS 설정 표준화
 *
 * 배경: 다음 파일들에서 `/** @jsxImportSource solid-js * /` 주석이 빌드 경고 발생
 * - GalleryContainer.tsx
 * - NavigationButton.tsx
 *
 * 경고 메시지: "The JSX import source cannot be set without also enabling React's 'automatic' JSX transform"
 *
 * 품질 게이트:
 * - ✅ 빌드 경고 0개
 * - ✅ TypeScript 0 errors
 * - ✅ 테스트 GREEN
 * - ✅ 번들 크기 동일 (±1KB)
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../shared/global-cleanup-hooks';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '../..');
const SRC_ROOT = join(PROJECT_ROOT, 'src');

/**
 * JSX pragma 주석 패턴
 */
const JSX_PRAGMA_PATTERNS = [
  /\/\*\*\s*@jsxImportSource\s+solid-js\s*\*\//,
  /\/\*\s*@jsxImportSource\s+solid-js\s*\*\//,
  /\/\/\s*@jsxImportSource\s+solid-js/,
];

/**
 * 파일에서 JSX pragma 주석 찾기
 */
function findJsxPragma(filePath: string): { found: boolean; line?: number; match?: string } {
  if (!existsSync(filePath)) {
    return { found: false };
  }

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of JSX_PRAGMA_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        return {
          found: true,
          line: i + 1,
          match: match[0],
        };
      }
    }
  }

  return { found: false };
}

describe('Epic JSX-PRAGMA-CLEANUP Phase 1 (RED)', () => {
  setupGlobalTestIsolation();

  describe('JSX Pragma 경고 감지', () => {
    const targetFiles = [
      'src/shared/components/isolation/GalleryContainer.tsx',
      'src/shared/components/ui/NavigationButton/NavigationButton.tsx',
    ];

    it('GalleryContainer.tsx에 JSX pragma 주석이 없어야 함', () => {
      const filePath = join(PROJECT_ROOT, targetFiles[0]);
      const result = findJsxPragma(filePath);

      expect(result.found, `JSX pragma found at line ${result.line}: ${result.match}`).toBe(false);
    });

    it('NavigationButton.tsx에 JSX pragma 주석이 없어야 함', () => {
      const filePath = join(PROJECT_ROOT, targetFiles[1]);
      const result = findJsxPragma(filePath);

      expect(result.found, `JSX pragma found at line ${result.line}: ${result.match}`).toBe(false);
    });

    it('모든 대상 파일이 존재해야 함', () => {
      for (const file of targetFiles) {
        const filePath = join(PROJECT_ROOT, file);
        expect(existsSync(filePath), `File not found: ${file}`).toBe(true);
      }
    });
  });

  describe('Vite 설정 검증', () => {
    it('vite.config.ts에 SolidJS JSX 설정이 있어야 함', () => {
      const viteConfigPath = join(PROJECT_ROOT, 'vite.config.ts');
      expect(existsSync(viteConfigPath), 'vite.config.ts not found').toBe(true);

      const content = readFileSync(viteConfigPath, 'utf-8');

      // solidPlugin 사용 확인
      expect(content).toContain('solidPlugin');
    });

    it('tsconfig.json에 jsx 설정이 있어야 함', () => {
      const tsconfigPath = join(PROJECT_ROOT, 'tsconfig.json');
      expect(existsSync(tsconfigPath), 'tsconfig.json not found').toBe(true);

      const content = readFileSync(tsconfigPath, 'utf-8');

      // jsx preserve 설정 확인 (SolidJS는 preserve 사용)
      expect(content).toMatch(/"jsx"\s*:\s*"preserve"/);
    });
  });

  describe('빌드 경고 시뮬레이션', () => {
    it('JSX pragma 주석이 제거되면 빌드 경고가 없어야 함', () => {
      // RED 테스트: 현재는 pragma가 있어서 경고 발생 예상
      // GREEN 단계에서 pragma 제거 후 이 테스트가 통과해야 함

      const targetFiles = [
        join(PROJECT_ROOT, 'src/shared/components/isolation/GalleryContainer.tsx'),
        join(PROJECT_ROOT, 'src/shared/components/ui/NavigationButton/NavigationButton.tsx'),
      ];

      let totalPragmaCount = 0;
      for (const filePath of targetFiles) {
        const result = findJsxPragma(filePath);
        if (result.found) {
          totalPragmaCount++;
        }
      }

      // 목표: 0개의 pragma 주석
      expect(totalPragmaCount, 'JSX pragma 주석이 여전히 존재합니다').toBe(0);
    });
  });
});
