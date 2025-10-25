/**
 * Vendor Dependency Rules 검증
 * @description Vendor 라이브러리 접근이 getter를 통해서만 이루어지는지 검증
 * @see docs/CODING_GUIDELINES.md - Vendor Getter 규칙
 * @see docs/ARCHITECTURE.md - 계층 구조
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'fs/promises';
import { resolve, join, extname } from 'path';

/**
 * 파일 시스템 기반 재귀 파일 검색
 */
async function findFiles(
  dir: string,
  extensions: string[],
  ignore: string[] = []
): Promise<string[]> {
  const files: string[] = [];

  async function traverse(currentDir: string): Promise<void> {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);
        const relativePath = fullPath.replace(process.cwd() + '\\', '').replace(/\\/g, '/');

        // ignore 패턴 체크
        if (ignore.some(pattern => relativePath.includes(pattern))) {
          continue;
        }

        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else if (entry.isFile()) {
          const ext = extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(relativePath);
          }
        }
      }
    } catch (error) {
      // 디렉토리가 존재하지 않으면 무시
    }
  }

  await traverse(dir);
  return files;
}

/**
 * 파일 내용에서 import 경로 추출
 */
function extractImportPaths(content: string): string[] {
  const imports: string[] = [];

  // import 문 정규식
  const importRegex = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"]([^'"]+)['"]/g;

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // dynamic import도 체크
  const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

describe('Vendor Dependency Rules', () => {
  const srcPath = resolve(process.cwd(), 'src');

  describe('Vendor Library Access', () => {
    it('should use vendors getters for external libraries (no direct imports)', async () => {
      const sourceFiles = await findFiles(
        srcPath,
        ['.ts', '.tsx'],
        ['.test.', '.spec.', 'external/vendors/', 'external/userscript/', 'types/']
      );

      const violations: Array<{ file: string; pattern: string; matches: string[] }> = [];

      for (const file of sourceFiles) {
        const content = await readFile(file, 'utf-8');

        // 금지된 직접 import 패턴들
        const forbiddenPatterns = [
          { name: 'solid-js', regex: /from\s+['"]solid-js['"]/ },
          { name: 'solid-js/store', regex: /from\s+['"]solid-js\/store['"]/ },
          { name: 'fflate', regex: /from\s+['"]fflate['"]/ },
        ];

        for (const { name, regex } of forbiddenPatterns) {
          if (regex.test(content)) {
            const matches = content.match(regex) || [];
            violations.push({
              file,
              pattern: name,
              matches: matches as string[],
            });
          }
        }
      }

      if (violations.length > 0) {
        const message = violations
          .map(v => `  ${v.file}: forbidden import from "${v.pattern}"`)
          .join('\n');
        console.warn('❌ Direct vendor imports found:\n' + message);
      }

      expect(violations).toHaveLength(0);
    });

    it('should use getSolid/getSolidStore getters for Solid.js APIs', async () => {
      const sourceFiles = await findFiles(
        srcPath,
        ['.ts', '.tsx'],
        ['.test.', '.spec.', 'external/vendors/', 'types/']
      );

      let vendorUsageFound = false;

      for (const file of sourceFiles) {
        const content = await readFile(file, 'utf-8');

        // Solid getter 사용 패턴
        const getterPatterns = [/getSolid\(\)/g, /getSolidStore\(\)/g];

        for (const pattern of getterPatterns) {
          pattern.lastIndex = 0;
          if (pattern.test(content)) {
            vendorUsageFound = true;

            // vendors import 확인 (정적 또는 동적)
            const hasVendorsImport =
              content.includes('@shared/external/vendors') ||
              content.includes("import('@shared/external/vendors'") ||
              content.includes('external/vendors');

            expect(hasVendorsImport).toBe(true);
          }
        }
      }

      // 적어도 하나의 파일에서 vendor getter 사용 필요
      expect(vendorUsageFound).toBe(true);
    });

    it('should use getUserscript getter for Userscript APIs', async () => {
      const sourceFiles = await findFiles(
        srcPath,
        ['.ts', '.tsx'],
        ['.test.', '.spec.', 'external/userscript/', 'types/']
      );

      for (const file of sourceFiles) {
        const content = await readFile(file, 'utf-8');

        // Userscript getter 사용 패턴 확인
        if (/getUserscript\(\)/.test(content)) {
          const hasUserscriptImport =
            content.includes('@shared/external/userscript') ||
            content.includes("import('@shared/external/userscript'");

          expect(hasUserscriptImport).toBe(true);
        }

        // 금지된 직접 GM_* 호출 (getter 없이)
        const directGMCalls = content.match(/GM_\w+/g) || [];
        const indirectGMCalls = directGMCalls.filter(call => {
          // getUserscript() 호출 내 있는 경우는 허용
          const index = content.indexOf(call);
          const beforeContext = content.substring(Math.max(0, index - 100), index);
          return !beforeContext.includes('getUserscript()');
        });

        expect(indirectGMCalls).toHaveLength(0);
      }
    });
  });

  describe('Vendor Getter Pattern Correctness', () => {
    it('vendors getter imports should be from @shared/external/vendors', async () => {
      const externalPath = resolve(srcPath, 'shared/external');
      const vendorsFile = join(externalPath, 'vendors.ts');

      const content = await readFile(vendorsFile, 'utf-8');

      // getSolid, getSolidStore 함수 export 확인
      expect(content).toMatch(/export.*function.*getSolid/);
      expect(content).toMatch(/export.*function.*getSolidStore/);
    });

    it('userscript getter imports should be from @shared/external/userscript/adapter', async () => {
      const adapterFile = resolve(srcPath, 'shared/external/userscript/adapter.ts');

      const content = await readFile(adapterFile, 'utf-8');

      // getUserscript 함수 export 확인
      expect(content).toMatch(/export.*function.*getUserscript/);
    });
  });
});
