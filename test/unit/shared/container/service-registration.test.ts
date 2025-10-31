/**
 * @fileoverview Service Registration Tests - Phase 237
 * @description 서비스 등록 시 require 사용 없이 정상 작동하는지 검증
 */

import { describe, it, expect } from 'vitest';
import { registerCoreBaseServices } from '@/shared/container/service-accessors';
import { CoreServiceRegistry } from '@/shared/container/core-service-registry';
import { SERVICE_KEYS } from '@/constants';

describe('Phase 237: Service Registration', () => {
  describe('registerCoreBaseServices', () => {
    it('should register core services without require', () => {
      // Act
      registerCoreBaseServices();

      // Assert: 핵심 서비스들이 등록되었는지 확인
      const animationService = CoreServiceRegistry.tryGet(SERVICE_KEYS.ANIMATION);
      const themeService = CoreServiceRegistry.tryGet(SERVICE_KEYS.THEME);
      const languageService = CoreServiceRegistry.tryGet(SERVICE_KEYS.LANGUAGE);

      expect(animationService).toBeDefined();
      expect(themeService).toBeDefined();
      expect(languageService).toBeDefined();
    });

    it('should not throw ReferenceError about require', () => {
      // Arrange: require가 정의되지 않은 환경에서도 작동해야 함
      const originalRequire = (global as any).require;
      delete (global as any).require;

      // Act & Assert: require 없이도 동작해야 함
      expect(() => registerCoreBaseServices()).not.toThrow();

      // Cleanup
      if (originalRequire) {
        (global as any).require = originalRequire;
      }
    });

    it('should handle service registration errors gracefully', () => {
      // Act & Assert: 에러가 throw되지 않아야 함
      // try-catch로 감싸져 있으므로 개별 서비스 등록 실패해도 전체 함수는 실패하지 않음
      expect(() => registerCoreBaseServices()).not.toThrow();
    });
  });
});
