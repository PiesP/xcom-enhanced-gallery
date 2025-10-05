/**
 * fflate Deprecated API 제거 검증 테스트
 *
 * Epic: FFLATE-DEPRECATED-API-REMOVAL
 * Phase: 1 (RED)
 *
 * 목적: fflate deprecated API stub과 테스트 모킹이 완전히 제거되었는지 검증
 *
 * Acceptance:
 * - getFflate() 함수가 vendor API에 존재하지 않아야 함
 * - fflate-deprecated.ts 파일이 존재하지 않아야 함
 * - vendor-manager-static.ts에 deprecatedFflateApi 속성이 없어야 함
 * - 테스트 모킹 파일에 createMockFflate()가 없어야 함
 * - LICENSES/fflate-MIT.txt 파일은 보존 (기여 인정)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..', '..');

describe('fflate Deprecated API 제거 검증 (Epic: FFLATE-DEPRECATED-API-REMOVAL)', () => {
  describe('Task 1.1: Vendor API 정리', () => {
    it('vendor-api-safe.ts에 getFflateSafe() 함수가 존재하지 않아야 함', () => {
      const vendorApiPath = resolve(projectRoot, 'src/shared/external/vendors/vendor-api-safe.ts');
      const content = readFileSync(vendorApiPath, 'utf8');

      expect(
        content.includes('getFflateSafe'),
        'getFflateSafe() 함수가 아직 존재합니다.\n' +
          '제거 필요: export function getFflateSafe() {...}'
      ).toBe(false);
    });

    it('vendor-api.ts에 getFflate export가 존재하지 않아야 함 (Phase 4B: 파일 제거됨)', () => {
      const vendorApiPath = resolve(projectRoot, 'src/shared/external/vendors/vendor-api.ts');

      // Phase 4B에서 vendor-api.ts 파일이 제거되었으므로 존재하지 않아야 함
      expect(existsSync(vendorApiPath), 'vendor-api.ts 파일이 아직 존재합니다').toBe(false);
    });

    it('index.ts에 getFflate export가 존재하지 않아야 함', () => {
      const indexPath = resolve(projectRoot, 'src/shared/external/vendors/index.ts');
      const content = readFileSync(indexPath, 'utf8');

      expect(
        content.includes('getFflate'),
        'index.ts에 getFflate export가 아직 존재합니다.\n' +
          '제거 필요: export { getFflate } 또는 import { getFflate }'
      ).toBe(false);
    });
  });

  describe('Task 1.2: Deprecated 파일 제거', () => {
    it('fflate-deprecated.ts 파일이 존재하지 않아야 함', () => {
      const deprecatedPath = resolve(
        projectRoot,
        'src/shared/external/vendors/fflate-deprecated.ts'
      );

      expect(
        existsSync(deprecatedPath),
        `fflate-deprecated.ts 파일이 아직 존재합니다: ${deprecatedPath}\n` +
          '이 파일은 완전히 제거되어야 합니다.'
      ).toBe(false);
    });
  });

  describe('Task 1.3: VendorManager 정리', () => {
    it('vendor-manager-static.ts에 deprecatedFflateApi 속성이 없어야 함', () => {
      const managerPath = resolve(
        projectRoot,
        'src/shared/external/vendors/vendor-manager-static.ts'
      );
      const content = readFileSync(managerPath, 'utf8');

      expect(
        content.includes('deprecatedFflateApi'),
        'VendorManager에 deprecatedFflateApi 속성이 아직 존재합니다.\n' +
          '제거 필요: private readonly deprecatedFflateApi'
      ).toBe(false);
    });

    it('vendor-manager-static.ts에 getFflate() 메서드가 없어야 함', () => {
      const managerPath = resolve(
        projectRoot,
        'src/shared/external/vendors/vendor-manager-static.ts'
      );
      const content = readFileSync(managerPath, 'utf8');

      expect(
        content.includes('getFflate()'),
        'VendorManager에 getFflate() 메서드가 아직 존재합니다.\n' +
          '제거 필요: public getFflate(): FflateAPI {...}'
      ).toBe(false);
    });

    it('vendor-manager-static.ts에 fflate-deprecated import가 없어야 함', () => {
      const managerPath = resolve(
        projectRoot,
        'src/shared/external/vendors/vendor-manager-static.ts'
      );
      const content = readFileSync(managerPath, 'utf8');

      const hasDeprecatedImport =
        content.includes('createDeprecatedFflateApi') ||
        content.includes('warnFflateDeprecated') ||
        content.includes("from './fflate-deprecated'");

      expect(
        hasDeprecatedImport,
        'vendor-manager-static.ts에 fflate-deprecated import가 아직 존재합니다.\n' +
          '제거 필요: import { createDeprecatedFflateApi, warnFflateDeprecated } from ...'
      ).toBe(false);
    });
  });

  describe('Task 1.4: 테스트 모킹 정리', () => {
    it('vendor-mocks.ts에 createMockFflate() 함수가 없어야 함', () => {
      const mocksPath = resolve(projectRoot, 'test/utils/mocks/vendor-mocks.ts');
      const content = readFileSync(mocksPath, 'utf8');

      expect(
        content.includes('createMockFflate'),
        'test/utils/mocks/vendor-mocks.ts에 createMockFflate() 함수가 아직 존재합니다.\n' +
          '제거 필요: export function createMockFflate() {...}'
      ).toBe(false);
    });

    it('vendor-mocks-clean.ts에 createMockFflate() 함수가 없어야 함', () => {
      const mocksPath = resolve(projectRoot, 'test/utils/mocks/vendor-mocks-clean.ts');
      const content = readFileSync(mocksPath, 'utf8');

      expect(
        content.includes('createMockFflate'),
        'test/utils/mocks/vendor-mocks-clean.ts에 createMockFflate() 함수가 아직 존재합니다.\n' +
          '제거 필요: export function createMockFflate() {...}'
      ).toBe(false);
    });

    it('MockVendorManager에 getFflate() 메서드가 없어야 함 (vendor-mocks.ts)', () => {
      const mocksPath = resolve(projectRoot, 'test/utils/mocks/vendor-mocks.ts');
      const content = readFileSync(mocksPath, 'utf8');

      // MockVendorManager 클래스 내부의 getFflate 메서드 패턴 검색
      const mockVendorManagerMatch = content.match(/class MockVendorManager\s*{[\s\S]*?^}/m);
      if (mockVendorManagerMatch) {
        const classContent = mockVendorManagerMatch[0];
        expect(
          classContent.includes('getFflate'),
          'MockVendorManager에 getFflate() 메서드가 아직 존재합니다.\n' +
            '제거 필요: async getFflate() {...}'
        ).toBe(false);
      }
    });

    it('MockVendorManager에 getFflate() 메서드가 없어야 함 (vendor-mocks-clean.ts)', () => {
      const mocksPath = resolve(projectRoot, 'test/utils/mocks/vendor-mocks-clean.ts');
      const content = readFileSync(mocksPath, 'utf8');

      const mockVendorManagerMatch = content.match(/class MockVendorManager\s*{[\s\S]*?^}/m);
      if (mockVendorManagerMatch) {
        const classContent = mockVendorManagerMatch[0];
        expect(
          classContent.includes('getFflate'),
          'MockVendorManager에 getFflate() 메서드가 아직 존재합니다.\n' +
            '제거 필요: getFflate() {...}'
        ).toBe(false);
      }
    });

    it('vendor.mock.ts에 mockFflateAPI가 존재하지 않아야 함', () => {
      const mockPath = resolve(projectRoot, 'test/__mocks__/vendor.mock.ts');
      const content = readFileSync(mockPath, 'utf8');

      expect(
        content.includes('mockFflateAPI'),
        'test/__mocks__/vendor.mock.ts에 mockFflateAPI가 아직 존재합니다.\n' +
          '제거 필요: export const mockFflateAPI = {...}'
      ).toBe(false);
    });

    it('vendor.mock.js에 mockFflateAPI가 존재하지 않아야 함', () => {
      const mockPath = resolve(projectRoot, 'test/__mocks__/vendor.mock.js');
      const content = readFileSync(mockPath, 'utf8');

      expect(
        content.includes('mockFflateAPI'),
        'test/__mocks__/vendor.mock.js에 mockFflateAPI가 아직 존재합니다.\n' +
          '제거 필요: export const mockFflateAPI = {...}'
      ).toBe(false);
    });

    it('vendor-mock-clean.js에 mockFflateAPI가 존재하지 않아야 함', () => {
      const mockPath = resolve(projectRoot, 'test/__mocks__/vendor-mock-clean.js');
      const content = readFileSync(mockPath, 'utf8');

      expect(
        content.includes('mockFflateAPI'),
        'test/__mocks__/vendor-mock-clean.js에 mockFflateAPI가 아직 존재합니다.\n' +
          '제거 필요: export const mockFflateAPI = {...}'
      ).toBe(false);
    });
  });

  describe('Task 1.5: 라이선스 보존', () => {
    it('LICENSES/fflate-MIT.txt 파일이 존재해야 함 (기여 인정)', () => {
      const licensePath = resolve(projectRoot, 'LICENSES/fflate-MIT.txt');

      expect(
        existsSync(licensePath),
        `LICENSES/fflate-MIT.txt 파일이 존재하지 않습니다: ${licensePath}\n` +
          'fflate 라이브러리 기여자를 인정하기 위해 라이선스 파일은 보존되어야 합니다.'
      ).toBe(true);
    });

    it('fflate-MIT.txt 내용이 유효한 MIT 라이선스여야 함', () => {
      const licensePath = resolve(projectRoot, 'LICENSES/fflate-MIT.txt');
      const content = readFileSync(licensePath, 'utf8');

      expect(content).toContain('MIT License');
      expect(content).toContain('Copyright');
      expect(content).toContain('Arjun Barrett');
    });
  });
});
