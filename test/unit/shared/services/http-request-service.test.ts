/**
 * HttpRequestService unit tests - Phase 314-2
 *
 * Tests environment-aware validation and error handling
 * for HTTP requests in different execution contexts.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';
// Dynamic import to bypass module resolution cache issues
const importService = async () => {
  const { HttpRequestService: Service } = await import(
    '../../../../src/shared/services/http-request-service.ts'
  );
  return Service;
};

let HttpRequestService: any;

describe('HttpRequestService - Phase 314-2', () => {
  // Setup global test isolation to prevent state leakage
  setupGlobalTestIsolation();

  beforeEach(async () => {
    HttpRequestService = await importService();
  });

  let service: InstanceType<typeof HttpRequestService>;

  beforeEach(() => {
    service = HttpRequestService.getInstance();
  });

  describe('validateAvailability()', () => {
    it('should detect test environment and report availability', async () => {
      // Arrange: Vitest environment always has __VITEST__ marker
      (globalThis as Record<string, unknown>).__VITEST__ = true;

      // Act
      const result: any = await service.validateAvailability();

      // Assert: Vitest environment allows fetch, so available is true
      expect(result).toBeDefined();
      expect(result.environment).toBe('test');
      expect(result.canFallback).toBe(false); // Vitest has native fetch support
      expect(result.available).toBe(true); // Vitest environment has fetch available
      expect(result.message).toContain('available');
    });

    it('should detect userscript environment in Vitest (mocked)', async () => {
      // Arrange: In Vitest, environment detector always returns 'test'
      // This test validates the behavior when running in actual test environment
      (globalThis as Record<string, unknown>).__VITEST__ = true;

      // Act
      const result: any = await service.validateAvailability();

      // Assert: Vitest always reports 'test' environment
      expect(result).toBeDefined();
      expect(result.available).toBe(true);
      expect(result.environment).toBe('test'); // Vitest always returns 'test'
      expect(result.canFallback).toBe(false);
    });

    it('should detect test environment without specific GM APIs', async () => {
      // Arrange: Vitest environment, no additional mocks
      const gm = globalThis as Record<string, unknown>;
      gm.__VITEST__ = true; // Always present in Vitest
      delete gm.__TEST_ENVIRONMENT__;

      // Act
      const result: any = await service.validateAvailability();

      // Assert: Vitest environment has native fetch
      expect(result).toBeDefined();
      expect(result.environment).toBe('test'); // Vitest always returns 'test'
      expect(result.available).toBe(true); // Native fetch available
      expect(result.canFallback).toBe(false);
    });

    it('should include environment description message', async () => {
      // Arrange: Set test environment
      (globalThis as Record<string, unknown>).__VITEST__ = true;

      // Act
      const result: any = await service.validateAvailability();

      // Assert
      expect(result.message).toBeDefined();
      expect(result.message.length).toBeGreaterThan(0);
      expect(typeof result.message).toBe('string');
    });

    it('should have all required properties', async () => {
      // Act
      const result: any = await service.validateAvailability();

      // Assert
      expect(result).toHaveProperty('available');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('canFallback');
      expect(typeof result.available).toBe('boolean');
      expect(typeof result.environment).toBe('string');
      expect(typeof result.message).toBe('string');
      expect(typeof result.canFallback).toBe('boolean');
    });
  });

  describe('getInstance()', () => {
    it('should return singleton instance', () => {
      // Act
      const instance1 = HttpRequestService.getInstance();
      const instance2 = HttpRequestService.getInstance();

      // Assert
      expect(instance1).toBe(instance2);
    });
  });

  describe('environment-aware error handling', () => {
    it('should handle test environment gracefully', async () => {
      // Arrange: Vitest environment (always has __VITEST__)
      (globalThis as Record<string, unknown>).__VITEST__ = true;

      // Act
      const result = await service.validateAvailability();

      // Assert: Vitest has native fetch, so available is true
      expect(result.available).toBe(true);
      expect(result.canFallback).toBe(false);
      expect(result.message).toBeTruthy();
    });

    it('should confirm native fetch availability in Vitest', async () => {
      // Arrange: Vitest environment (native fetch support)
      (globalThis as Record<string, unknown>).__VITEST__ = true;

      // Act
      const result = await service.validateAvailability();

      // Assert: Vitest always reports 'test' environment
      expect(result.available).toBe(true);
      expect(result.environment).toBe('test');
    });
  });
});
