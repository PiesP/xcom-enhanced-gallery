/**
 * @fileoverview Unused Exports Detection Tests
 * @description Phase 34 Step 1: 미사용 Export 감지 및 제거 검증
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * 소스 파일에서 특정 심볼의 사용처를 찾습니다.
 * @param symbolName - 찾을 심볼 이름
 * @param excludePaths - 제외할 파일 경로 (정의 파일 등)
 */
function findSymbolUsages(symbolName: string, excludePaths: string[]): string[] {
  const srcDir = path.join(projectRoot, 'src');
  const usages: string[] = [];

  function searchDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');

      if (entry.isDirectory()) {
        searchDir(fullPath);
      } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
        // 제외 경로 체크
        if (excludePaths.some(exclude => relativePath.includes(exclude))) {
          continue;
        }

        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          // export 선언은 제외
          if (line.includes('export') && line.includes(symbolName)) {
            return;
          }

          // 실제 사용처만 찾기 (함수 호출, 타입 참조 등)
          const regex = new RegExp(`\\b${symbolName}\\s*[(:<!]`, 'g');
          if (regex.test(line)) {
            usages.push(`${relativePath}:${index + 1}`);
          }
        });
      }
    }
  }

  searchDir(srcDir);
  return usages;
}

describe('Phase 34 Step 1: Style utilities canonicalization', () => {
  setupGlobalTestIsolation();

  describe('getCSSVariable usage detection', () => {
    it('should detect getCSSVariable is not used in codebase', () => {
      // 정의 파일 제외
      const excludePaths = ['src/shared/utils/styles/index.ts'];

      const usages = findSymbolUsages('getCSSVariable', excludePaths);

      // 실제 사용처가 없어야 함 (정의 및 export 제외)
      expect(usages).toEqual([]);
    });
  });

  describe('applyTheme usage detection', () => {
    it('should detect applyTheme is not used in codebase', () => {
      // 정의 파일 제외
      const excludePaths = ['src/shared/utils/styles/index.ts'];

      const usages = findSymbolUsages('applyTheme', excludePaths);

      // 실제 사용처가 없어야 함 (정의 및 export 제외)
      expect(usages).toEqual([]);
    });
  });

  describe('verify canonical source is css-utilities', () => {
    it('should confirm style-utils.ts has been removed', () => {
      const styleUtilsPath = path.join(projectRoot, 'src/shared/utils/styles/style-utils.ts');
      const exists = fs.existsSync(styleUtilsPath);

      expect(exists).toBe(false);
    });

    it('should confirm css-utilities.ts has been removed', () => {
      const cssUtilitiesPath = path.join(projectRoot, 'src/shared/utils/styles/css-utilities.ts');
      const exists = fs.existsSync(cssUtilitiesPath);

      expect(exists).toBe(false);
    });
  });
});
