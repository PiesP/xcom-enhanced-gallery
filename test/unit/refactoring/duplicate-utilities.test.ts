/**
 * @fileoverview Duplicate Utilities Detection Test
 * @description Phase 33 Step 3 - 중복된 유틸리티 함수 감지 및 통합
 */

import { describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
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
  setupGlobalTestIsolation();

  describe('combineClasses function', () => {
    it('should no longer exist in the codebase', () => {
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

      expect(filesWithCombineClasses.length).toBe(0);

      console.log('\n✅ combineClasses 정의가 더 이상 존재하지 않습니다.');
    });
  });

  describe('toggleClass function', () => {
    it('should no longer exist in the codebase', () => {
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

      expect(filesWithToggleClass.length).toBe(0);

      console.log('\n✅ toggleClass 정의가 더 이상 존재하지 않습니다.');
    });
  });

  describe('updateComponentState function', () => {
    it('should no longer exist in the codebase', () => {
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

      expect(filesWithUpdateState.length).toBe(0);

      console.log('\n✅ updateComponentState 정의가 더 이상 존재하지 않습니다.');
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

      console.log(`\n✅ 총 중복 함수 정의: ${totalDuplicates}개`);
      console.log('🎯 목표 달성: 모든 중복 제거 완료');

      // GREEN 상태: 모든 중복 제거됨
      expect(totalDuplicates).toBe(0);
    });
  });
});
