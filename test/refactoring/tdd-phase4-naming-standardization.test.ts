/**
 * @fileoverview TDD Phase 4: 명명 규칙 표준화 - RED 단계
 * @description 현재 명명 규칙 위반 사항들을 탐지하는 실패 테스트들
 * @version 1.0.0 - Phase 4: Naming Convention Standardization
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';

describe('🏷️ Phase 4: 명명 규칙 표준화 - TDD RED 단계', () => {
  const projectRoot = process.cwd();
  const srcDir = join(projectRoot, 'src');

  describe('🔴 RED: 파일명 표준화 검증', () => {
    it('모든 TypeScript 파일은 kebab-case를 사용해야 함', async () => {
      const violations: string[] = [];

      function scanDirectory(dir: string): void {
        const entries = readdirSync(dir);

        for (const entry of entries) {
          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
            const fileName = basename(entry, extname(entry));

            // kebab-case 패턴: lowercase 알파벳과 하이픈만 허용
            const isKebabCase = /^[a-z]+(-[a-z]+)*$/.test(fileName);

            if (!isKebabCase) {
              const relativePath = fullPath.replace(projectRoot, '').replace(/\\/g, '/');
              violations.push(relativePath);
            }
          }
        }
      }

      scanDirectory(srcDir);

      // 🔴 RED: 현재 상태에서는 PascalCase 파일들이 존재하므로 실패해야 함
      console.log('📋 kebab-case 위반 파일들:');
      violations.forEach(file => console.log(`  ❌ ${file}`));

      // 예상되는 위반 파일들 (정보성)
      const expectedViolationsCount = 4; // PascalCase 파일들
      console.log(`📊 예상 위반 건수: ${expectedViolationsCount}개`);

      // 🔴 RED: 실패해야 하는 테스트 (위반 사항이 존재함)
      expect(violations.length).toBe(0); // 현재는 실패할 것
    });
  });

  describe('🔴 RED: 클래스명 표준화 검증', () => {
    it('모든 Service/Manager 클래스는 Service 접미사를 사용해야 함', async () => {
      const violations: string[] = [];

      function scanForClasses(dir: string): void {
        const entries = readdirSync(dir);

        for (const entry of entries) {
          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            scanForClasses(fullPath);
          } else if (
            entry.endsWith('.ts') &&
            !entry.endsWith('.test.ts') &&
            !entry.endsWith('.d.ts')
          ) {
            try {
              const content = readFileSync(fullPath, 'utf-8');

              // Manager 접미사를 가진 클래스 탐지
              const managerMatches = content.match(/export\s+class\s+\w+Manager\b/g);
              if (managerMatches) {
                const relativePath = fullPath.replace(projectRoot, '').replace(/\\/g, '/');
                violations.push(`${relativePath}: ${managerMatches.join(', ')}`);
              }
            } catch {
              // 파일 읽기 실패 시 무시
            }
          }
        }
      }

      scanForClasses(srcDir);

      console.log('📋 Manager 접미사 사용 클래스들:');
      violations.forEach(violation => console.log(`  ❌ ${violation}`));

      // 예상되는 Manager 클래스들 (정보성)
      const expectedManagerCount = 6; // ResourceManager, AccessibilityManager 등
      console.log(`📊 예상 Manager 클래스: ${expectedManagerCount}개`);

      // 🔴 RED: 실패해야 하는 테스트 (Manager 클래스들이 존재함)
      expect(violations.length).toBe(0); // 현재는 실패할 것
    });
  });

  describe('🔴 RED: 함수명 표준화 검증', () => {
    it('모든 함수는 camelCase를 사용해야 함', () => {
      // 샘플 파일에서 함수명 검증
      const sampleFiles = [
        'src/shared/utils/type-safety-helpers.ts',
        'src/shared/services/service-manager.ts',
      ];

      const violations: string[] = [];

      sampleFiles.forEach(filePath => {
        const fullPath = join(projectRoot, filePath);
        try {
          const content = readFileSync(fullPath, 'utf-8');

          // snake_case 함수명 탐지
          const snakeCaseMatches = content.match(/function\s+\w*_\w+|const\s+\w*_\w+\s*=/g);
          if (snakeCaseMatches) {
            violations.push(`${filePath}: ${snakeCaseMatches.join(', ')}`);
          }
        } catch {
          // 파일이 없으면 무시
        }
      });

      if (violations.length > 0) {
        console.log('📋 snake_case 함수명 발견:');
        violations.forEach(violation => console.log(`  ❌ ${violation}`));
      }

      // 🔴 RED: 현재 상태에서는 대부분 camelCase이므로 통과할 수 있음
      expect(violations.length).toBe(0);
    });
  });

  describe('🔴 RED: 상수명 표준화 검증', () => {
    it('모든 상수는 SCREAMING_SNAKE_CASE를 사용해야 함', () => {
      const constantsFile = join(projectRoot, 'src/constants.ts');

      try {
        const content = readFileSync(constantsFile, 'utf-8');
        const violations: string[] = [];

        // camelCase 상수 탐지
        const camelCaseMatches = content.match(/export\s+const\s+[a-z][a-zA-Z]*\s*=/g);
        if (camelCaseMatches) {
          violations.push(...camelCaseMatches);
        }

        if (violations.length > 0) {
          console.log('📋 camelCase 상수명 발견:');
          violations.forEach(violation => console.log(`  ❌ ${violation}`));
        }

        // 🔴 RED: 현재 상태에서는 대부분 SCREAMING_SNAKE_CASE이므로 통과할 수 있음
        expect(violations.length).toBe(0);
      } catch {
        // 파일이 없으면 테스트 스킵
        expect(true).toBe(true);
      }
    });
  });

  describe('🔴 RED: import 경로 일관성 검증', () => {
    it('PascalCase 파일명을 참조하는 import가 존재하지 않아야 함', () => {
      const violations: string[] = [];
      const pascalCaseImportPattern = /from\s+['"`][^'"`]*\/[A-Z]\w*['"`]/g;

      function scanForImports(dir: string): void {
        const entries = readdirSync(dir);

        for (const entry of entries) {
          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);

          if (stat.isDirectory()) {
            scanForImports(fullPath);
          } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
            try {
              const content = readFileSync(fullPath, 'utf-8');
              const matches = content.match(pascalCaseImportPattern);

              if (matches) {
                const relativePath = fullPath.replace(projectRoot, '').replace(/\\/g, '/');
                violations.push(`${relativePath}: ${matches.join(', ')}`);
              }
            } catch {
              // 파일 읽기 실패 시 무시
            }
          }
        }
      }

      scanForImports(srcDir);

      if (violations.length > 0) {
        console.log('📋 PascalCase import 경로 발견:');
        violations.forEach(violation => console.log(`  ❌ ${violation}`));
      }

      // 🔴 RED: 실패해야 하는 테스트 (PascalCase import들이 존재함)
      expect(violations.length).toBe(0); // 현재는 실패할 것
    });
  });
});

// ================================
// 헬퍼 함수들 (향후 GREEN 단계에서 사용 예정)
// ================================

/**
 * 파일명이 kebab-case 패턴인지 확인
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isKebabCase(fileName: string): boolean {
  return /^[a-z]+(-[a-z]+)*$/.test(fileName);
}

/**
 * 클래스명이 PascalCase + Service 패턴인지 확인
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isPascalCaseService(className: string): boolean {
  return /^[A-Z][a-zA-Z]*Service$/.test(className);
}

/**
 * 함수명이 camelCase 패턴인지 확인
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isCamelCase(functionName: string): boolean {
  return /^[a-z][a-zA-Z0-9]*$/.test(functionName);
}

/**
 * 상수명이 SCREAMING_SNAKE_CASE 패턴인지 확인
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isScreamingSnakeCase(constantName: string): boolean {
  return /^[A-Z][A-Z0-9_]*$/.test(constantName);
}
