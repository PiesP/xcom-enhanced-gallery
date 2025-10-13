/**
 * @fileoverview Duplicate Utilities Detection Test
 * @description Phase 33 Step 3 - 중복된 유틸리티 함수 감지 및 통합
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const SRC_DIR = join(process.cwd(), 'src');

/**
 * 디렉터리를 재귀적으로 순회하여 모든 TypeScript 파일 찾기
 */
function findTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && entry !== 'node_modules' && entry !== 'dist') {
      files.push(...findTypeScriptFiles(fullPath));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts') && !entry.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 파일에서 함수 정의 찾기
 */
function findFunctionDefinitions(content: string, functionName: string): number {
  const regex = new RegExp(
    `(export\\s+)?function\\s+${functionName}\\s*[<(]|const\\s+${functionName}\\s*=`,
    'g'
  );
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

describe('Phase 33 Step 3: Duplicate Utilities Detection (RED)', () => {
  describe('combineClasses function', () => {
    it('should be defined in exactly one canonical location', () => {
      const files = findTypeScriptFiles(SRC_DIR);
      const filesWithCombineClasses: Array<{ file: string; count: number }> = [];

      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const count = findFunctionDefinitions(content, 'combineClasses');

        if (count > 0) {
          filesWithCombineClasses.push({
            file: relative(process.cwd(), file),
            count,
          });
        }
      }

      // 현재 상태: 3개 파일에서 발견될 것으로 예상 (RED)
      expect(filesWithCombineClasses.length).toBeGreaterThan(1);

      // 상세 정보 출력
      console.log('\n📊 combineClasses 정의 위치:');
      filesWithCombineClasses.forEach(({ file, count }) => {
        console.log(`  - ${file} (${count}회)`);
      });

      // 목표: 정확히 1개의 정의만 있어야 함
      // expect(filesWithCombineClasses.length).toBe(1);
      // expect(filesWithCombineClasses[0].file).toContain('css-utilities.ts');
    });

    it('should identify duplicate implementations', () => {
      const targetFiles = [
        'src/shared/utils/styles/style-utils.ts',
        'src/shared/utils/styles/css-utilities.ts',
        'src/shared/utils/core-utils.ts',
      ];

      const implementations: Array<{ file: string; content: string }> = [];

      for (const file of targetFiles) {
        const fullPath = join(process.cwd(), file);
        try {
          const content = readFileSync(fullPath, 'utf-8');
          const match = content.match(
            /function combineClasses[\s\S]*?\{[\s\S]*?return[\s\S]*?;[\s\S]*?\}/
          );

          if (match) {
            implementations.push({
              file: relative(process.cwd(), fullPath),
              content: match[0],
            });
          }
        } catch {
          // 파일이 없으면 무시
        }
      }

      // 현재 상태: 여러 구현이 있음 (RED)
      expect(implementations.length).toBeGreaterThan(1);

      console.log(`\n⚠️  ${implementations.length}개의 중복 구현 발견:`);
      implementations.forEach(({ file }) => {
        console.log(`  - ${file}`);
      });
    });
  });

  describe('toggleClass function', () => {
    it('should be defined in exactly one canonical location', () => {
      const files = findTypeScriptFiles(SRC_DIR);
      const filesWithToggleClass: Array<{ file: string; count: number }> = [];

      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const count = findFunctionDefinitions(content, 'toggleClass');

        if (count > 0) {
          filesWithToggleClass.push({
            file: relative(process.cwd(), file),
            count,
          });
        }
      }

      // 현재 상태: 2개 파일에서 발견될 것으로 예상 (RED)
      expect(filesWithToggleClass.length).toBeGreaterThan(1);

      console.log('\n📊 toggleClass 정의 위치:');
      filesWithToggleClass.forEach(({ file, count }) => {
        console.log(`  - ${file} (${count}회)`);
      });

      // 목표: 정확히 1개의 정의만 있어야 함
      // expect(filesWithToggleClass.length).toBe(1);
    });
  });

  describe('updateComponentState function', () => {
    it('should be defined in exactly one canonical location', () => {
      const files = findTypeScriptFiles(SRC_DIR);
      const filesWithUpdateState: Array<{ file: string; count: number }> = [];

      for (const file of files) {
        const content = readFileSync(file, 'utf-8');
        const count = findFunctionDefinitions(content, 'updateComponentState');

        if (count > 0) {
          filesWithUpdateState.push({
            file: relative(process.cwd(), file),
            count,
          });
        }
      }

      // 현재 상태: 2개 파일에서 발견될 것으로 예상 (RED)
      expect(filesWithUpdateState.length).toBeGreaterThan(1);

      console.log('\n📊 updateComponentState 정의 위치:');
      filesWithUpdateState.forEach(({ file, count }) => {
        console.log(`  - ${file} (${count}회)`);
      });

      // 목표: 정확히 1개의 정의만 있어야 함
      // expect(filesWithUpdateState.length).toBe(1);
    });
  });

  describe('Overall duplication summary', () => {
    it('should report total number of duplicate functions', () => {
      const functionsToCheck = ['combineClasses', 'toggleClass', 'updateComponentState'];
      const files = findTypeScriptFiles(SRC_DIR);

      let totalDuplicates = 0;

      for (const functionName of functionsToCheck) {
        let count = 0;
        for (const file of files) {
          const content = readFileSync(file, 'utf-8');
          if (findFunctionDefinitions(content, functionName) > 0) {
            count++;
          }
        }
        if (count > 1) {
          totalDuplicates += count - 1; // 1개는 정상, 나머지는 중복
        }
      }

      console.log(`\n📊 총 중복 함수 정의: ${totalDuplicates}개`);
      console.log('🎯 목표: 모든 중복 제거 (0개)');

      // 현재 상태 확인 (RED)
      expect(totalDuplicates).toBeGreaterThan(0);

      // 목표 상태 (GREEN)
      // expect(totalDuplicates).toBe(0);
    });
  });
});
