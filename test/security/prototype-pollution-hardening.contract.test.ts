/**
 * @fileoverview Prototype Pollution Hardening Contract Tests (Phase 1: RED)
 * @description CodeQL js/prototype-pollution-utility 경고 재현
 *
 * Epic: CODEQL-SECURITY-HARDENING
 * Issue: js/prototype-pollution-utility (1건)
 * 목표: mergeCategory 함수의 재귀적 속성 할당에서 prototype pollution 방지
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  SettingsService,
  SettingsSecurityError,
} from '@features/settings/services/SettingsService';

describe('Prototype Pollution Hardening (CodeQL)', () => {
  let settingsService: SettingsService;

  beforeEach(() => {
    settingsService = new SettingsService();
  });

  afterEach(() => {
    // 프로토타입 오염 정리 (만약 발생했다면)
    if (Object.hasOwn(Object.prototype, 'isAdmin')) {
      // @ts-expect-error - 테스트를 위한 프로토타입 정리
      delete Object.prototype.isAdmin;
    }
    if (Object.hasOwn(Object.prototype, 'polluted')) {
      // @ts-expect-error - 테스트를 위한 프로토타입 정리
      delete Object.prototype.polluted;
    }
  });

  describe('Direct Prototype Pollution Attempts', () => {
    it('should reject settings with __proto__ key', async () => {
      // 공격 벡터: __proto__ 키를 통한 prototype pollution
      const maliciousSettings = {
        gallery: {
          __proto__: {
            isAdmin: true,
          },
        },
      };

      await expect(async () => {
        // @ts-expect-error - 테스트를 위한 타입 무시
        await settingsService.set('gallery', maliciousSettings.gallery);
      }).rejects.toThrow(SettingsSecurityError);

      // 검증: Object.prototype이 오염되지 않았는지 확인
      const testObj = {};
      // @ts-expect-error - 테스트 검증
      expect(testObj.isAdmin).toBeUndefined();
    });

    it('should reject settings with constructor key', async () => {
      // 공격 벡터: constructor를 통한 prototype pollution
      const maliciousSettings = {
        gallery: {
          constructor: {
            prototype: {
              polluted: true,
            },
          },
        },
      };

      await expect(async () => {
        // @ts-expect-error - 테스트를 위한 타입 무시
        await settingsService.set('gallery', maliciousSettings.gallery);
      }).rejects.toThrow(SettingsSecurityError);

      // 검증: Object.prototype이 오염되지 않았는지 확인
      const testObj = {};
      // @ts-expect-error - 테스트 검증
      expect(testObj.polluted).toBeUndefined();
    });

    it('should reject settings with prototype key', async () => {
      // 공격 벡터: prototype 키를 통한 직접 접근
      const maliciousSettings = {
        gallery: {
          prototype: {
            isAdmin: true,
          },
        },
      };

      await expect(async () => {
        // @ts-expect-error - 테스트를 위한 타입 무시
        await settingsService.set('gallery', maliciousSettings.gallery);
      }).rejects.toThrow(SettingsSecurityError);
    });
  });

  describe('Nested Prototype Pollution Attempts', () => {
    it('should reject deeply nested __proto__ pollution', async () => {
      // 공격 벡터: 깊이 중첩된 __proto__
      const maliciousSettings = {
        gallery: {
          theme: {
            colors: {
              __proto__: {
                polluted: true,
              },
            },
          },
        },
      };

      await expect(async () => {
        // @ts-expect-error - 테스트를 위한 타입 무시
        await settingsService.set('gallery', maliciousSettings.gallery);
      }).rejects.toThrow(SettingsSecurityError);
    });

    it('should reject array with prototype pollution', async () => {
      // 공격 벡터: 배열 내 __proto__
      const maliciousSettings = {
        gallery: {
          items: [{ id: 1, __proto__: { polluted: true } }, { id: 2 }],
        },
      };

      await expect(async () => {
        // @ts-expect-error - 테스트를 위한 타입 무시
        await settingsService.set('gallery', maliciousSettings.gallery);
      }).rejects.toThrow(SettingsSecurityError);
    });
  });

  describe('Batch Update Protection', () => {
    it('should reject batch updates with prototype pollution', async () => {
      // 공격 벡터: 일괄 업데이트에서의 prototype pollution
      const maliciousBatch = {
        'gallery.theme': 'dark',
        'gallery.__proto__.isAdmin': true,
      };

      await expect(async () => {
        // @ts-expect-error - 테스트를 위한 타입 무시
        await settingsService.updateBatch(maliciousBatch);
      }).rejects.toThrow(SettingsSecurityError);
    });
  });

  describe('Import Settings Protection', () => {
    it('should reject JSON import with prototype pollution', async () => {
      // 공격 벡터: JSON import를 통한 prototype pollution
      const maliciousJson = JSON.stringify({
        gallery: {
          __proto__: {
            isAdmin: true,
          },
          theme: 'dark',
        },
      });

      await expect(async () => {
        await settingsService.importSettings(maliciousJson);
      }).rejects.toThrow();

      // 검증: 프로토타입 오염 없음
      const testObj = {};
      // @ts-expect-error - 테스트 검증
      expect(testObj.isAdmin).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should reject objects with non-Object prototype', async () => {
      // Edge case: 사용자 정의 프로토타입
      class CustomClass {
        theme = 'dark';
      }
      const customInstance = new CustomClass();

      await expect(async () => {
        // @ts-expect-error - 테스트를 위한 타입 무시
        await settingsService.set('gallery', customInstance);
      }).rejects.toThrow(SettingsSecurityError);
    });
  });
});
