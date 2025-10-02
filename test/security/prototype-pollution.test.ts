/**
 * SECURITY-HARDENING-001: Prototype Pollution Prevention
 *
 * CodeQL 발견 사항:
 * - src/features/settings/services/SettingsService.ts:163
 * - Spread 연산자를 통한 재귀 병합 시 __proto__ 보호 누락
 *
 * 위험 시나리오:
 * 1. 악의적인 설정 import ({"__proto__": {"isAdmin": true}})
 * 2. localStorage 주입 공격
 * 3. 크로스 사이트 설정 오염
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsService } from '@features/settings/services/SettingsService';
import { defaultSettings } from '@features/settings/services/settings-factory';

describe('SECURITY-HARDENING-001: Prototype Pollution Prevention', () => {
  let settingsService: SettingsService;

  beforeEach(async () => {
    // 테스트마다 새로운 인스턴스 생성
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      globalThis.localStorage.clear();
    }
    settingsService = new SettingsService();
    await settingsService.initialize(defaultSettings);
  });

  describe('RED: Detect prototype pollution vulnerabilities', () => {
    it('should reject __proto__ in imported settings', async () => {
      const maliciousSettings = {
        ...defaultSettings,
        __proto__: { isAdmin: true },
      };

      await expect(
        settingsService.importSettings(JSON.stringify(maliciousSettings))
      ).rejects.toThrow();

      // 프로토타입이 오염되지 않았는지 확인
      const testObj = {};
      // @ts-expect-error - checking prototype pollution
      expect(testObj.isAdmin).toBeUndefined();
    });

    it('should reject constructor property in settings', async () => {
      const maliciousSettings = {
        ...defaultSettings,
        constructor: { prototype: { isAdmin: true } },
      };

      await expect(
        settingsService.importSettings(JSON.stringify(maliciousSettings))
      ).rejects.toThrow();
    });

    it('should reject __proto__ nested in category objects', async () => {
      // JSON 문자열로 직접 테스트 (sanitizeSettings 우회)
      const maliciousJson = JSON.stringify({
        gallery: {
          autoScrollSpeed: 5,
          __proto__: { polluted: true },
        },
      });

      await expect(settingsService.importSettings(maliciousJson)).rejects.toThrow();
    });

    it('should prevent prototype pollution via migrateSettings spread', async () => {
      // migrateSettings 내부의 spread 연산자가 __proto__를 처리하는지 테스트
      const maliciousJson = JSON.stringify({
        gallery: {
          autoScrollSpeed: 5,
          __proto__: { exploited: true },
        },
      });

      await expect(settingsService.importSettings(maliciousJson)).rejects.toThrow();

      // Object.prototype이 오염되지 않았는지 확인
      // @ts-expect-error - checking prototype pollution
      expect({}.exploited).toBeUndefined();
    });
  });

  describe('GREEN: Safe settings operations', () => {
    it('should safely import valid settings', async () => {
      // 완전한 설정 객체 생성 (validateSettingsStructure 요구사항)
      const currentSettings = settingsService.exportSettings();
      const parsedSettings = JSON.parse(currentSettings);
      parsedSettings.gallery.autoScrollSpeed = 5;

      const validSettings = JSON.stringify(parsedSettings);

      await expect(settingsService.importSettings(validSettings)).resolves.toBeUndefined();

      expect(settingsService.get('gallery.autoScrollSpeed')).toBe(5);
    });

    it('should create null-prototype objects for nested settings', () => {
      const settings = settingsService.getAllSettings();

      // sanitizeSettingsTree가 Object.create(null)을 사용하는지 확인
      expect(Object.getPrototypeOf(settings)).toBeNull();
    });

    it('should safely merge category defaults and overrides', () => {
      // SettingsService.get()이 타입 확인을 강제하지 않음
      const autoScrollSpeed = settingsService.get<number>('gallery.autoScrollSpeed');

      // 기본값이 존재하는지 확인
      expect(typeof autoScrollSpeed).toBe('number');

      // 프로토타입 체인이 안전한지 확인
      const gallery = settingsService.get('gallery');
      expect(Object.getPrototypeOf(gallery)).toBeNull();
    });
  });

  describe('Edge cases: Known prototype keys', () => {
    const dangerousKeys = ['__proto__', 'constructor', 'prototype', 'hasOwnProperty'];

    dangerousKeys.forEach(key => {
      it(`should reject settings with dangerous key: ${key}`, async () => {
        const malicious = {
          ...defaultSettings,
          [key]: { evil: true },
        };

        await expect(settingsService.importSettings(JSON.stringify(malicious))).rejects.toThrow();
      });
    });

    it('should handle deeply nested __proto__', async () => {
      const deepMalicious = JSON.stringify({
        gallery: {
          autoScrollSpeed: 5,
          nested: {
            __proto__: { deep: true },
          },
        },
      });

      await expect(settingsService.importSettings(deepMalicious)).rejects.toThrow();
    });

    it('should prevent pollution via JSON.parse', async () => {
      // JSON.parse 자체는 __proto__를 일반 속성으로 파싱함
      // 하지만 이후 spread나 Object.assign에서 위험할 수 있음
      const jsonString = '{"__proto__": {"polluted": true}}';
      const parsed = JSON.parse(jsonString);

      // parsed 객체 자체는 __proto__ 속성을 가짐 (위험하지 않음)
      expect(parsed).toHaveProperty('__proto__');

      // 하지만 이를 spread하면 위험함
      const dangerous = { ...parsed };

      // 새로운 객체의 프로토타입이 오염되지 않았는지 확인
      // @ts-expect-error - checking prototype pollution
      expect({}.polluted).toBeUndefined();
    });
  });
});
