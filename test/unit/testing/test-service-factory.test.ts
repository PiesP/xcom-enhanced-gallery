/**
 * @fileoverview Test Service Factory Tests - Phase 314-7
 * @description Conditional mock/real service selection
 */

import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';
import {
  getServiceImplementation,
  createConditionalService,
  getServiceStatus,
  getAllServiceStatuses,
  assertServiceIsMock,
  assertServiceIsReal,
} from '../../../src/shared/external/test/test-service-factory';
import {
  enableTestMode,
  disableTestMode,
  resetTestConfig,
} from '../../../src/shared/external/test/test-environment-config';

describe('Test Service Factory - Phase 314-7', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    // Clean all mock GM APIs first
    const gmApis = [
      'GM_getValue',
      'GM_setValue',
      'GM_download',
      'GM_notification',
      'GM_setClipboard',
      'GM_registerMenuCommand',
      'GM_deleteValue',
      'GM_listValues',
    ];
    gmApis.forEach(api => {
      delete (globalThis as Record<string, unknown>)[api];
    });

    resetTestConfig();
    disableTestMode();
  });

  afterEach(() => {
    // Clean all mock GM APIs
    const gmApis = [
      'GM_getValue',
      'GM_setValue',
      'GM_download',
      'GM_notification',
      'GM_setClipboard',
      'GM_registerMenuCommand',
      'GM_deleteValue',
      'GM_listValues',
    ];
    gmApis.forEach(api => {
      delete (globalThis as Record<string, unknown>)[api];
    });

    resetTestConfig();
    disableTestMode();
  });

  describe('getServiceImplementation', () => {
    it('should return real by default', () => {
      const impl = getServiceImplementation('TestService');

      expect(impl).toBe('real');
    });

    it('should return mock when test mode is enabled with mockServices', () => {
      enableTestMode({ mockServices: true });

      const impl = getServiceImplementation('TestService');
      expect(impl).toBe('mock');
    });

    it('should return real when test mode has mockServices disabled', () => {
      enableTestMode({ mockServices: false });

      const impl = getServiceImplementation('TestService');
      expect(impl).toBe('real');
    });

    it('should use custom selector when provided', () => {
      enableTestMode({ mockServices: true });

      const impl = getServiceImplementation('TestService', {
        selector: () => 'real',
      });

      expect(impl).toBe('real');
    });

    it('should use forceMock option', () => {
      const impl = getServiceImplementation('TestService', { forceMock: true });

      expect(impl).toBe('mock');
    });

    it('should use forceReal option', () => {
      enableTestMode({ mockServices: true });

      const impl = getServiceImplementation('TestService', { forceReal: true });

      expect(impl).toBe('real');
    });

    it('should prioritize forceMock over test mode', () => {
      enableTestMode({ mockServices: false });

      const impl = getServiceImplementation('TestService', { forceMock: true });

      expect(impl).toBe('mock');
    });

    it('should prioritize custom selector over options', () => {
      enableTestMode({ mockServices: true });

      const impl = getServiceImplementation('TestService', {
        selector: () => 'real',
        forceMock: true,
      });

      expect(impl).toBe('real');
    });
  });

  describe('createConditionalService', () => {
    it('should create real service by default', () => {
      const realImpl = vi.fn(() => ({ type: 'real' }));
      const mockImpl = vi.fn(() => ({ type: 'mock' }));

      const service = createConditionalService('TestService', realImpl, mockImpl);

      expect(service).toEqual({ type: 'real' });
      expect(realImpl).toHaveBeenCalled();
      expect(mockImpl).not.toHaveBeenCalled();
    });

    it('should create mock service when enabled', () => {
      enableTestMode({ mockServices: true });

      const realImpl = vi.fn(() => ({ type: 'real' }));
      const mockImpl = vi.fn(() => ({ type: 'mock' }));

      const service = createConditionalService('TestService', realImpl, mockImpl);

      expect(service).toEqual({ type: 'mock' });
      expect(mockImpl).toHaveBeenCalled();
      expect(realImpl).not.toHaveBeenCalled();
    });

    it('should fall back to real if mock creation fails', () => {
      enableTestMode({ mockServices: true });

      const realImpl = vi.fn(() => ({ type: 'real' }));
      const mockImpl = vi.fn(() => {
        throw new Error('Mock creation failed');
      });

      const service = createConditionalService('TestService', realImpl, mockImpl);

      expect(service).toEqual({ type: 'real' });
      expect(mockImpl).toHaveBeenCalled();
      expect(realImpl).toHaveBeenCalled();
    });

    it('should respect forceMock option', () => {
      const realImpl = vi.fn(() => ({ type: 'real' }));
      const mockImpl = vi.fn(() => ({ type: 'mock' }));

      const service = createConditionalService('TestService', realImpl, mockImpl, {
        forceMock: true,
      });

      expect(service).toEqual({ type: 'mock' });
    });
  });

  describe('getServiceStatus', () => {
    it('should return service status', () => {
      const status = getServiceStatus('TestService');

      expect(status).toHaveProperty('name');
      expect(status).toHaveProperty('available');
      expect(status).toHaveProperty('implementation');
      expect(status).toHaveProperty('reason');
    });

    it('should show real implementation by default', () => {
      const status = getServiceStatus('TestService');

      expect(status.implementation).toBe('real');
      expect(status.available).toBe(true);
    });

    it('should show mock implementation when enabled', () => {
      enableTestMode({ mockServices: true });

      const status = getServiceStatus('TestService');

      expect(status.implementation).toBe('mock');
      expect(status.available).toBe(true);
    });

    it('should include reason in status', () => {
      const status = getServiceStatus('TestService');

      expect(status.reason.length).toBeGreaterThan(0);
    });
  });

  describe('getAllServiceStatuses', () => {
    it('should return statuses for all services', () => {
      const services = ['Service1', 'Service2', 'Service3'];
      const statuses = getAllServiceStatuses(services);

      expect(statuses).toHaveLength(3);
      expect(statuses[0].name).toBe('Service1');
      expect(statuses[1].name).toBe('Service2');
      expect(statuses[2].name).toBe('Service3');
    });

    it('should handle empty service list', () => {
      const statuses = getAllServiceStatuses([]);

      expect(statuses).toHaveLength(0);
    });
  });

  describe('assertServiceIsMock', () => {
    it('should pass when service is mock', () => {
      enableTestMode({ mockServices: true });

      expect(() => {
        assertServiceIsMock('TestService');
      }).not.toThrow();
    });

    it('should throw when service is not mock', () => {
      expect(() => {
        assertServiceIsMock('TestService');
      }).toThrow();
    });

    it('should throw with descriptive message', () => {
      expect(() => {
        assertServiceIsMock('MyService');
      }).toThrow(/MyService/);
    });
  });

  describe('assertServiceIsReal', () => {
    it('should pass when service is real', () => {
      expect(() => {
        assertServiceIsReal('TestService');
      }).not.toThrow();
    });

    it('should throw when service is not real', () => {
      enableTestMode({ mockServices: true });

      expect(() => {
        assertServiceIsReal('TestService');
      }).toThrow();
    });

    it('should throw with descriptive message', () => {
      enableTestMode({ mockServices: true });

      expect(() => {
        assertServiceIsReal('MyService');
      }).toThrow(/MyService/);
    });
  });
});

// Global cleanup: Remove all mock GM APIs from globalThis after all tests
afterAll(() => {
  // Vitest cleanup functions
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.clearAllMocks();

  // Manual cleanup: Remove all mock GM APIs
  const gmApis = [
    'GM_getValue',
    'GM_setValue',
    'GM_download',
    'GM_notification',
    'GM_setClipboard',
    'GM_registerMenuCommand',
    'GM_deleteValue',
    'GM_listValues',
  ];
  gmApis.forEach(api => {
    delete (globalThis as Record<string, unknown>)[api];
  });

  // Final reset
  resetTestConfig();
  disableTestMode();
});
