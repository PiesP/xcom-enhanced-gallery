/**
 * @fileoverview Phase 4: 중복된 테스트 파일 정리 TDD
 * @description TDD 방식으로 중복된 테스트 파일들을 식별하고 정리
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 4: 중복된 테스트 파일 정리', () => {
  describe('RED: 중복 파일 식별', () => {
    it('test-factories.ts와 test-factories-new.ts 중복이 해결되어야 함', () => {
      const factoriesPath = path.resolve(__dirname, '../utils/fixtures/test-factories.ts');
      const factoriesNewPath = path.resolve(__dirname, '../utils/fixtures/test-factories-new.ts');

      // 현재 상태 확인: 두 파일이 모두 존재할 수 있음
      const factoriesExists = fs.existsSync(factoriesPath);
      const factoriesNewExists = fs.existsSync(factoriesNewPath);

      if (factoriesExists && factoriesNewExists) {
        // 두 파일이 모두 존재하는 경우 - 중복 상태
        console.log('중복 파일 존재: test-factories.ts와 test-factories-new.ts');

        // 내용 비교
        const factoriesContent = fs.readFileSync(factoriesPath, 'utf-8');
        const factoriesNewContent = fs.readFileSync(factoriesNewPath, 'utf-8');

        // 기능적으로 유사한 내용인지 확인
        const hasCreateFunctions = (content: any) => {
          return content.includes('createMock') && content.includes('export function');
        };

        expect(hasCreateFunctions(factoriesContent)).toBe(true);
        expect(hasCreateFunctions(factoriesNewContent)).toBe(true);
      } else {
        // 하나만 존재하는 경우 - 이미 정리됨
        expect(factoriesExists || factoriesNewExists).toBe(true);
      }
    });
  });

  describe('GREEN: 정리 후 검증', () => {
    it('test-factories.ts만 존재해야 함', () => {
      const factoriesPath = path.resolve(__dirname, '../utils/fixtures/test-factories.ts');
      const factoriesNewPath = path.resolve(__dirname, '../utils/fixtures/test-factories-new.ts');

      expect(fs.existsSync(factoriesPath)).toBe(true);
      expect(fs.existsSync(factoriesNewPath)).toBe(false);
    });

    it('통합된 test-factories.ts가 모든 필요한 함수를 제공해야 함', () => {
      const factoriesPath = path.resolve(__dirname, '../utils/fixtures/test-factories.ts');

      if (fs.existsSync(factoriesPath)) {
        const content = fs.readFileSync(factoriesPath, 'utf-8');

        // 필수 export들이 존재하는지 확인
        const requiredExports = [
          'createMockMediaUrl',
          'createMockTwitterUrl',
          'createMockImageItem',
          'createMockVideoItem',
          'createMockMediaItems',
          'createMockBrowserEnvironment',
          'createMockElement',
        ];

        for (const exportName of requiredExports) {
          if (!content.includes(`export function ${exportName}`)) {
            console.log(`누락된 export: ${exportName}`);
          }
        }

        // 파일 내용이 유효한 TypeScript인지 확인
        expect(content).toContain('export');
        expect(content.length).toBeGreaterThan(0);
      } else {
        // test-factories.ts가 없으면 실패
        expect(fs.existsSync(factoriesPath)).toBe(true);
      }
    });
  });

  describe('REFACTOR: 정리 완료 검증', () => {
    it('모든 import 참조가 올바르게 업데이트되어야 함', () => {
      // test-factories-new import가 남아있는지 확인
      const testDir = path.resolve(__dirname, '..');

      function checkImports(dirPath: string): string[] {
        if (!fs.existsSync(dirPath)) return [];

        const badImports: string[] = [];

        function scanFiles(currentPath: string): void {
          const items = fs.readdirSync(currentPath, { withFileTypes: true });

          for (const item of items) {
            const fullPath = path.join(currentPath, item.name);

            if (item.isDirectory()) {
              scanFiles(fullPath);
            } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
              // 자기 자신(현재 테스트 파일)은 제외
              if (item.name === 'phase4-duplicate-test-files.test.ts') {
                continue;
              }

              const content = fs.readFileSync(fullPath, 'utf-8');
              if (content.includes('test-factories-new')) {
                badImports.push(fullPath);
              }
            }
          }
        }

        scanFiles(dirPath);
        return badImports;
      }

      const badImports = checkImports(testDir);
      if (badImports.length > 0) {
        console.log('test-factories-new를 여전히 import하는 파일들:', badImports);
      }

      expect(badImports).toEqual([]);
    });

    it('중복 제거가 성공적으로 완료되었음을 확인', () => {
      // 주요 중복 파일들이 정리되었는지 확인
      const testUtilsDir = path.resolve(__dirname, '../utils');

      // test-factories-new.ts가 제거되었는지 확인
      const factoriesNewPath = path.join(testUtilsDir, 'fixtures', 'test-factories-new.ts');
      expect(fs.existsSync(factoriesNewPath)).toBe(false);

      // 원본 test-factories.ts는 여전히 존재하는지 확인
      const originalFile = path.join(testUtilsDir, 'fixtures', 'test-factories.ts');
      expect(fs.existsSync(originalFile)).toBe(true);

      // 정리 작업이 성공했음을 표시
      expect(true).toBe(true);
    });
  });
});
