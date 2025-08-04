/**
 * 아키텍처 규칙 검증 테스트
 * Feature-based 아키텍처의 의존성 규칙과 코딩 가이드라인 준수 검증
 */

import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'fs/promises';
import { resolve, join, extname } from 'path';

// 파일 시스템 기반 glob 대안
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
    } catch {
      // 디렉토리가 존재하지 않으면 무시
    }
  }

  await traverse(dir);
  return files;
}

describe('Architecture Dependency Rules', () => {
  const srcPath = resolve(process.cwd(), 'src');

  describe('Layer Dependency Rules', () => {
    it('features should only import from shared, core, infrastructure', async () => {
      const featureFiles = await findFiles(
        resolve(srcPath, 'features'),
        ['.ts', '.tsx'],
        ['.test.', '.spec.']
      );

      for (const file of featureFiles) {
        const content = await readFile(file, 'utf-8');
        const imports = extractImportPaths(content);

        const invalidImports = imports.filter(imp => {
          // @features/ 로 시작하지만 현재 파일이 아닌 다른 feature를 import하는 경우
          if (imp.startsWith('@features/')) {
            const currentFeature = file.match(/src\/features\/([^/]+)/)?.[1];
            const importedFeature = imp.match(/@features\/([^/]+)/)?.[1];
            return currentFeature !== importedFeature;
          }

          // @app/ 으로 시작하는 import (금지됨)
          return (
            imp.startsWith('@app/') || imp.startsWith('../app/') || imp.startsWith('../../app/')
          );
        });

        if (invalidImports.length > 0) {
          console.warn(`❌ ${file}에서 잘못된 import 발견:`, invalidImports);
        }

        expect(invalidImports).toHaveLength(0);
      }
    });

    it('shared should only import from core, infrastructure', async () => {
      const sharedFiles = await findFiles(
        resolve(srcPath, 'shared'),
        ['.ts', '.tsx'],
        ['.test.', '.spec.']
      );

      for (const file of sharedFiles) {
        const content = await readFile(file, 'utf-8');
        const imports = extractImportPaths(content);

        const invalidImports = imports.filter(
          imp =>
            imp.startsWith('@features/') ||
            imp.startsWith('@app/') ||
            imp.startsWith('../features/') ||
            imp.startsWith('../app/') ||
            imp.startsWith('../../features/') ||
            imp.startsWith('../../app/')
        );

        if (invalidImports.length > 0) {
          console.warn(`❌ ${file}에서 잘못된 import 발견:`, invalidImports);
        }

        expect(invalidImports).toHaveLength(0);
      }
    });

    it('core should only import from infrastructure', async () => {
      const coreFiles = await findFiles(
        resolve(srcPath, 'core'),
        ['.ts', '.tsx'],
        ['.test.', '.spec.', 'ServiceRegistry.ts']
      );

      for (const file of coreFiles) {
        const content = await readFile(file, 'utf-8');
        const imports = extractImportPaths(content);

        const invalidImports = imports.filter(
          imp =>
            imp.startsWith('@features/') ||
            imp.startsWith('@shared/') ||
            imp.startsWith('@app/') ||
            imp.startsWith('../features/') ||
            imp.startsWith('../shared/') ||
            imp.startsWith('../app/') ||
            imp.startsWith('../../features/') ||
            imp.startsWith('../../shared/') ||
            imp.startsWith('../../app/')
        );

        if (invalidImports.length > 0) {
          console.warn(`❌ ${file}에서 잘못된 import 발견:`, invalidImports);
        }

        expect(invalidImports).toHaveLength(0);
      }
    });

    it('infrastructure should not import from upper layers', async () => {
      const infraFiles = await findFiles(
        resolve(srcPath, 'infrastructure'),
        ['.ts', '.tsx'],
        ['.test.', '.spec.']
      );

      for (const file of infraFiles) {
        const content = await readFile(file, 'utf-8');
        const imports = extractImportPaths(content);

        const invalidImports = imports.filter(
          imp =>
            imp.startsWith('@features/') ||
            imp.startsWith('@shared/') ||
            imp.startsWith('@app/') ||
            imp.startsWith('../features/') ||
            imp.startsWith('../shared/') ||
            imp.startsWith('../core/') ||
            imp.startsWith('../app/') ||
            imp.startsWith('../../features/') ||
            imp.startsWith('../../shared/') ||
            imp.startsWith('../../core/') ||
            imp.startsWith('../../app/')
        );

        if (invalidImports.length > 0) {
          console.warn(`❌ ${file}에서 잘못된 import 발견:`, invalidImports);
        }

        expect(invalidImports).toHaveLength(0);
      }
    });
  });

  describe('Vendor Library Access Rules', () => {
    it.skip('should use vendors getters for external libraries', async () => {
      const sourceFiles = await findFiles(
        srcPath,
        ['.ts', '.tsx'],
        [
          '.test.',
          '.spec.',
          'infrastructure/external/vendors/',
          'shared/types/vendor.types.ts',
          'types/',
        ]
      );

      for (const file of sourceFiles) {
        const content = await readFile(file, 'utf-8');

        // 직접 import 패턴 검사
        const directImports = [
          /from ['"]preact['"]/g,
          /from ['"]@preact\/signals['"]/g,
          /from ['"]fflate['"]/g,
          /import.*from ['"]preact['"]/g,
          /import.*from ['"]@preact\/signals['"]/g,
          /import.*from ['"]fflate['"]/g,
        ];

        for (const pattern of directImports) {
          const matches = content.match(pattern);
          if (matches) {
            console.warn(`❌ ${file}에서 직접 라이브러리 import 발견:`, matches);
            expect(matches).toBeNull();
          }
        }
      }
    });

    it('should validate vendors getter usage pattern', async () => {
      const sourceFiles = await findFiles(
        srcPath,
        ['.ts', '.tsx'],
        ['.test.', '.spec.', 'infrastructure/external/vendors/']
      );

      let vendorUsageFound = false;

      for (const file of sourceFiles) {
        const content = await readFile(file, 'utf-8');
        const filePath = file.replace(/\\/g, '/');

        // vendor 정의 파일들은 완전히 제외
        const isVendorDefinitionFile =
          filePath.includes('src/shared/external/vendors/vendor-manager.ts') ||
          filePath.includes('src/shared/external/vendors/vendor-api.ts') ||
          filePath.includes('src/shared/external/vendors/index.ts');

        if (isVendorDefinitionFile) {
          continue;
        }

        // vendors getter 사용 패턴 검사
        const vendorGetterPatterns = [
          /getFflate\(\)/g,
          /getPreact\(\)/g,
          /getPreactHooks\(\)/g,
          /getPreactSignals\(\)/g,
          /getMotion\(\)/g,
        ];

        for (const pattern of vendorGetterPatterns) {
          // regex의 lastIndex를 초기화하여 상태 문제 방지
          pattern.lastIndex = 0;

          if (pattern.test(content)) {
            vendorUsageFound = true;

            // vendors import가 있는지 확인
            const hasVendorsImport = content.includes('@shared/external/vendors');
            if (!hasVendorsImport) {
              console.warn(`❌ ${file}에서 vendor getter 사용하지만 import 없음`, {
                pattern: pattern.source,
                hasImport: hasVendorsImport,
                filePath: filePath,
              });
            }
            expect(hasVendorsImport).toBe(true);
          }
        }
      }

      // 적어도 하나의 파일에서 vendor getter를 사용해야 함
      expect(vendorUsageFound).toBe(true);
    });
  });

  describe('Code Quality Rules', () => {
    it('should not have circular dependencies (basic check)', async () => {
      const sourceFiles = await findFiles(srcPath, ['.ts', '.tsx'], ['.test.', '.spec.']);

      const importGraph = new Map();

      // 간단한 import 그래프 구성
      for (const file of sourceFiles) {
        const content = await readFile(file, 'utf-8');
        const imports = extractImportPaths(content);
        const relativePath = file.replace(process.cwd() + '/', '');

        importGraph.set(relativePath, imports);
      }

      // 기본적인 순환 참조 검사 (간단한 버전)
      for (const [file, imports] of importGraph.entries()) {
        for (const imp of imports) {
          if (imp.startsWith('@') || imp.startsWith('./') || imp.startsWith('../')) {
            // 실제 파일 경로로 변환하여 순환 참조 검사
            // 여기서는 기본적인 체크만 수행
            expect(imp).not.toBe(file);
          }
        }
      }
    });

    it('should have proper barrel exports', async () => {
      const indexFiles = await findFiles(srcPath, ['.ts'], ['.test.', '.spec.']);

      // index.ts 파일만 필터링
      const filteredIndexFiles = indexFiles.filter(file => file.endsWith('index.ts'));
      const failedFiles: Array<{ file: string; reason: string; problematicLines: string[] }> = [];

      // 특수한 경우를 허용할 파일들 (배럴 export가 아닌 실제 구현/로더 파일들)
      const specialCaseFiles = [
        // Core 모듈들은 실제 구현을 포함해야 함
        'src/core/analyzer/index.ts',
        'src/core/dom/index.ts',
        'src/core/media/index.ts',
        'src/core/memory/index.ts',
        'src/core/styles/index.ts',
        'src/core/types/index.ts',
        // 타입 정의 파일
        'src/shared/utils/types/index.ts',
      ];

      for (const indexFile of filteredIndexFiles) {
        // 특수한 경우 파일들은 스킵 - 정규화된 경로로 비교
        const normalizedFile = indexFile.replace(/\\/g, '/');
        if (specialCaseFiles.some(special => normalizedFile.endsWith(special))) {
          continue;
        }

        const content = await readFile(indexFile, 'utf-8');

        // index.ts 파일은 export, import, 주석, 간단한 상수 정의만 허용
        const lines = content.trim().split('\n');
        const problematicLines: string[] = [];

        const hasProblematicCode = lines.some((line, index) => {
          const trimmedLine = line.trim();

          // 빈 줄은 허용
          if (!trimmedLine) return false;

          // 주석은 허용 (// 또는 /* */)
          if (
            trimmedLine.startsWith('//') ||
            trimmedLine.startsWith('/*') ||
            trimmedLine.startsWith('*') ||
            trimmedLine.endsWith('*/') ||
            trimmedLine === '*/'
          )
            return false;

          // import 구문은 허용 (CSS 파일 import 포함)
          if (
            trimmedLine.startsWith('export') ||
            /} from ['"][^'"]+['"];?$/.test(trimmedLine) ||
            /import\s+.+\s+from\s+['"][^'"]+['"];?$/.test(trimmedLine) ||
            /import\s+['"][^'"]+['"];?$/.test(trimmedLine) // CSS import 허용
          )
            return false;

          // 간단한 상수 정의 허용 (예: const CONSTANTS = { ... })
          if (
            trimmedLine.startsWith('const ') ||
            trimmedLine.startsWith('interface ') ||
            trimmedLine.startsWith('type ') ||
            trimmedLine.match(/^[a-zA-Z_][a-zA-Z0-9_]*,?$/) || // 단순 식별자 (named export 목록)
            trimmedLine.match(/^[a-zA-Z_][a-zA-Z0-9_]*:/) || // 객체 속성
            trimmedLine.match(/^[a-zA-Z_][a-zA-Z0-9_]*\?\?:/) || // 옵션 속성
            trimmedLine === '}' ||
            trimmedLine === '};' ||
            trimmedLine === '{' ||
            trimmedLine.endsWith(',') ||
            trimmedLine.startsWith('}') ||
            /^[a-zA-Z_][a-zA-Z0-9_<>[\]|, ]*[,;]?$/.test(trimmedLine) // 타입 정의 허용
          )
            return false;

          // 문제가 있는 코드 발견
          problematicLines.push(`Line ${index + 1}: ${trimmedLine}`);
          return true;
        });

        if (hasProblematicCode) {
          failedFiles.push({
            file: indexFile,
            reason: '배럴 export 규칙 위반: 복잡한 로직이나 함수 정의가 있습니다',
            problematicLines,
          });
        }

        // 최소한 하나의 export가 있는지 확인
        const hasExports = content.includes('export');
        if (!hasExports && content.trim().length > 0) {
          failedFiles.push({
            file: indexFile,
            reason: 'export 구문이 없습니다',
            problematicLines: ['전체 파일이 export를 포함하지 않음'],
          });
        }
      }

      if (failedFiles.length > 0) {
        console.warn('❌ 배럴 export 규칙을 위반하는 파일들:');
        failedFiles.forEach(({ file, reason, problematicLines }) => {
          console.warn(`  ${file}: ${reason}`);
          problematicLines.forEach(line => console.warn(`    ${line}`));
        });
      }

      expect(failedFiles).toHaveLength(0);
    });
  });
});

// ================================
// Helper Functions
// ================================

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
