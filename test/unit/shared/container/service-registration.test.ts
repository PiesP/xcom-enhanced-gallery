/**
 * @fileoverview Service Registration Tests - Phase 237
 * @description 서비스 등록 시 require 사용 없이 정상 작동하는지 검증
 */

import { beforeEach, describe, it, expect } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
import { initializeCoreBaseServices } from '@/bootstrap/base-services';
import { CoreService } from '@shared/services/core';
import { SERVICE_KEYS } from '@/constants';

describe('Phase 237: Service Registration', () => {
  setupGlobalTestIsolation();

  describe('initializeCoreBaseServices', () => {
    beforeEach(() => {
      CoreService.resetInstance();
    });

    it('registers and initializes base services', async () => {
      const coreService = CoreService.getInstance();

      await initializeCoreBaseServices();

      const registeredKeys = coreService.getRegisteredBaseServices();

      expect(registeredKeys).toContain(SERVICE_KEYS.THEME);
      expect(registeredKeys).toContain(SERVICE_KEYS.LANGUAGE);
      expect(coreService.isBaseServiceInitialized(SERVICE_KEYS.THEME)).toBe(true);
      expect(coreService.isBaseServiceInitialized(SERVICE_KEYS.LANGUAGE)).toBe(true);
    });

    it('is idempotent even without require()', async () => {
      const originalRequire = (global as Record<string, unknown>).require;
      delete (global as Record<string, unknown>).require;

      await expect(initializeCoreBaseServices()).resolves.not.toThrow();
      await expect(initializeCoreBaseServices()).resolves.not.toThrow();

      if (originalRequire) {
        (global as Record<string, unknown>).require = originalRequire;
      }
    });

    it('swallows initialization errors using bootstrap strategy', async () => {
      const instance = CoreService.getInstance();
      const originalRegister = instance.registerBaseService;
      instance.registerBaseService = () => {
        throw new Error('forced');
      };

      await expect(initializeCoreBaseServices()).resolves.not.toThrow();

      instance.registerBaseService = originalRegister;
    });
  });
});
