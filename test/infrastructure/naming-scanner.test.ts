/**
 * @fileoverview Epic NAMING-001 Phase A: 명명 규칙 스캐너 테스트
 * @description TDD 방식으로 명명 규칙 위반 검출 스크립트를 검증
 */

/* global process */

import { describe, it, expect } from 'vitest';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Epic NAMING-001 Phase A: 명명 규칙 스캐너', () => {
  describe('1. 불필요한 수식어 검출', () => {
    it('export 함수명에서 불필요한 수식어를 검출해야 함', async () => {
      const testCode = `
export function simpleHelper() {}
export const optimizedProcess = () => {};
`;

      const { scanUnnecessaryModifiers } = await import('../../scripts/scan-naming-violations.mjs');
      const result = scanUnnecessaryModifiers(testCode, 'test.ts');

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0]).toHaveProperty('type', 'unnecessary-modifier');
    });
  });

  describe('2. Boolean 함수 접두사 검증', () => {
    it('boolean 반환 함수가 적절한 접두사를 사용하는지 검증해야 함', async () => {
      const testCode = `export function ready(): boolean { return true; }`;

      const { scanBooleanPrefixes } = await import('../../scripts/scan-naming-violations.mjs');
      const result = scanBooleanPrefixes(testCode, 'test.ts');

      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. 동사 패턴 일관성 검증', () => {
    it('유틸리티 함수가 표준 동사 패턴을 사용하는지 검증해야 함', async () => {
      const testCode = `export function userCreation() {}`;

      const { scanVerbPatterns } = await import('../../scripts/scan-naming-violations.mjs');
      const result = scanVerbPatterns(testCode, 'test.ts');

      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. 전체 스캔 및 리포트 생성', () => {
    it('전체 디렉터리를 스캔하고 결과를 반환해야 함', async () => {
      const { scanDirectory } = await import('../../scripts/scan-naming-violations.mjs');

      const testDir = resolve(__dirname, '../../src/shared/utils');
      const result = await scanDirectory(testDir);

      expect(result).toHaveProperty('violations');
      expect(result).toHaveProperty('summary');
    });
  });
});
