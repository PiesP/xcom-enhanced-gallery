/**
 * @fileoverview Bootstrap Environment Integration Tests - Phase 314-5
 * @description Environment initialization with BootstrapResult
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import { initializeEnvironment, type BootstrapResult } from '../../../src/bootstrap';

describe('Bootstrap Environment - Phase 314-5', () => {
  // Setup global test isolation to prevent state leakage
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeEnvironment', () => {
    it('should return BootstrapResult', async () => {
      const result = await initializeEnvironment();

      expect(result).toBeDefined();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('services');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('errors');
    });

    it('should initialize vendors successfully', async () => {
      const result = await initializeEnvironment();

      expect(result.success).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect test environment', async () => {
      const result = await initializeEnvironment();

      expect(result.environment).toBe('test');
    });

    it('should include service availability checks', async () => {
      const result = await initializeEnvironment();

      expect(result.services.length).toBeGreaterThan(0);
      const serviceNames = result.services.map(s => s.name);
      expect(serviceNames).toContain('HttpRequestService');
    });

    it('should have timestamp in ISO format', async () => {
      const result = await initializeEnvironment();
      const parsedDate = new Date(result.timestamp);

      expect(parsedDate instanceof Date).toBe(true);
      expect(parsedDate.getTime()).not.toBeNaN();
    });

    it('should provide detailed bootstrap information', async () => {
      const result = await initializeEnvironment();

      // Services should have details
      result.services.forEach(service => {
        expect(service.name).toBeDefined();
        expect(service.available).toBeDefined();
        expect(service.message).toBeDefined();
      });

      // Result should have minimal errors for test environment
      expect(typeof result.success).toBe('boolean');
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});
