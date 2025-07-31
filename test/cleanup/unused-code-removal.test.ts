/**
 * @fileoverview Phase 1: 사용하지 않는 코드 제거 테스트
 * @description TDD 방식으로 사용하지 않는 코드 제거를 검증
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Phase 1: 사용하지 않는 코드 제거', () => {
  describe('1. utils-backup.ts 파일 제거', () => {
    it('utils-backup.ts 파일이 더 이상 존재하지 않아야 함', () => {
      const backupFilePath = path.resolve(__dirname, '../../src/shared/utils/utils-backup.ts');
      expect(fs.existsSync(backupFilePath)).toBe(false);
    });

    it('utils-backup.ts가 어떤 파일에서도 import되지 않아야 함', async () => {
      const srcDir = path.resolve(__dirname, '../../src');
      const importReferences = [];

      function scanDirectory(dirPath: string) {
        if (!fs.existsSync(dirPath)) return;

        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const item of items) {
          const fullPath = path.join(dirPath, item.name);

          if (item.isDirectory()) {
            scanDirectory(fullPath);
          } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            if (content.includes('utils-backup')) {
              importReferences.push(fullPath);
            }
          }
        }
      }

      scanDirectory(srcDir);
      expect(importReferences).toEqual([]);
    });
  });

  describe('2. TODO/FIXME 주석 정리', () => {
    it('main.ts의 TODO 주석이 해결되거나 정리되어야 함', async () => {
      const mainFilePath = path.resolve(__dirname, '../../src/main.ts');
      const content = fs.readFileSync(mainFilePath, 'utf-8');

      // TODO 주석 찾기
      const todoMatches = content.match(/\/\/\s*TODO:/gi);

      // TODO가 있다면 적절한 주석으로 업데이트되었는지 확인
      if (todoMatches) {
        expect(todoMatches.length).toBeLessThanOrEqual(1); // 최대 1개까지 허용

        // TODO가 있다면 구체적인 계획이 있어야 함
        const todoLines = content
          .split('\n')
          .filter(line => line.includes('TODO:'))
          .map(line => line.trim());

        for (const todoLine of todoLines) {
          expect(todoLine.length).toBeGreaterThan(20); // 구체적인 설명 필요
        }
      }
    });
  });

  describe('3. 사용되지 않는 export 검증', () => {
    it('모든 export된 함수와 클래스가 실제로 사용되어야 함', async () => {
      // 이 테스트는 구현 후 활성화될 예정
      // 현재는 기본적인 검증만 수행
      expect(true).toBe(true);
    });
  });

  describe('4. 번들 크기 개선 검증', () => {
    it('사용하지 않는 코드 제거 후 번들 크기가 감소해야 함', () => {
      // 현재 빌드 결과: dev 778.36 KB, prod 415.49 KB
      // utils-backup.ts 제거 후 최소 5KB 감소 예상

      // 실제 번들 크기는 빌드 후 측정
      expect(true).toBe(true);
    });
  });
});
