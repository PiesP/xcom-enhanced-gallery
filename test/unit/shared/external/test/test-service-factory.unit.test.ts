/**
 * Unit tests for test-service-factory
 *
 * @fileoverview Mock/Real 서비스 조건부 생성 및 검증 테스트
 * @see src/shared/external/test/test-service-factory.ts
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getServiceImplementation,
  createConditionalService,
  getServiceStatus,
  getAllServiceStatuses,
  assertServiceIsMock,
  assertServiceIsReal,
  type ServiceFactoryOptions,
  type ServiceStatus,
} from '../../../../../src/shared/external/test/test-service-factory';
import {
  enableTestMode,
  disableTestMode,
  resetTestConfig,
} from '../../../../../src/shared/external/test/test-environment-config';

describe('test-service-factory', () => {
  // ==========================================
  // Setup & Teardown
  // ==========================================

  beforeEach(() => {
    resetTestConfig();
  });

  // ==========================================
  // Service Implementation Selection
  // ==========================================

  describe('getServiceImplementation', () => {
    it('should return real by default', () => {
      const impl = getServiceImplementation('TestService');
      expect(impl).toBe('real');
    });

    it('should return mock when test mode enabled with mockServices', () => {
      enableTestMode({ mockServices: true });
      const impl = getServiceImplementation('TestService');
      expect(impl).toBe('mock');
    });

    it('should return mock when forceMock is true', () => {
      const impl = getServiceImplementation('TestService', { forceMock: true });
      expect(impl).toBe('mock');
    });

    it('should return real when forceReal is true', () => {
      enableTestMode({ mockServices: true });
      const impl = getServiceImplementation('TestService', { forceReal: true });
      expect(impl).toBe('real');
    });

    it('should prioritize custom selector over test mode', () => {
      enableTestMode({ mockServices: true });
      const impl = getServiceImplementation('TestService', {
        selector: () => 'real',
      });
      expect(impl).toBe('real');
    });

    it('should prioritize custom selector over forceMock', () => {
      const impl = getServiceImplementation('TestService', {
        selector: () => 'real',
        forceMock: true,
      });
      expect(impl).toBe('real');
    });

    it('should prioritize forceMock over test mode', () => {
      enableTestMode({ mockServices: false });
      const impl = getServiceImplementation('TestService', { forceMock: true });
      expect(impl).toBe('mock');
    });

    it('should prioritize forceReal over test mode', () => {
      enableTestMode({ mockServices: true });
      const impl = getServiceImplementation('TestService', { forceReal: true });
      expect(impl).toBe('real');
    });

    it('should respect test mode mockServices option', () => {
      enableTestMode({ mockServices: false });
      const impl = getServiceImplementation('TestService');
      expect(impl).toBe('real');

      enableTestMode({ mockServices: true });
      const impl2 = getServiceImplementation('TestService');
      expect(impl2).toBe('mock');
    });

    it('should handle multiple services independently', () => {
      enableTestMode({ mockServices: true });
      const impl1 = getServiceImplementation('Service1');
      const impl2 = getServiceImplementation('Service2', { forceReal: true });
      expect(impl1).toBe('mock');
      expect(impl2).toBe('real');
    });
  });

  // ==========================================
  // Conditional Service Creation
  // ==========================================

  describe('createConditionalService', () => {
    it('should create real implementation by default', () => {
      let realCalled = false;
      let mockCalled = false;

      createConditionalService(
        'TestService',
        () => {
          realCalled = true;
          return 'real-instance';
        },
        () => {
          mockCalled = true;
          return 'mock-instance';
        }
      );

      expect(realCalled).toBe(true);
      expect(mockCalled).toBe(false);
    });

    it('should create mock implementation in test mode', () => {
      enableTestMode({ mockServices: true });
      let realCalled = false;
      let mockCalled = false;

      createConditionalService(
        'TestService',
        () => {
          realCalled = true;
          return 'real-instance';
        },
        () => {
          mockCalled = true;
          return 'mock-instance';
        }
      );

      expect(realCalled).toBe(false);
      expect(mockCalled).toBe(true);
    });

    it('should return correct implementation instance', () => {
      const result = createConditionalService(
        'TestService',
        () => 'real-implementation',
        () => 'mock-implementation'
      );

      expect(result).toBe('real-implementation');
    });

    it('should return mock instance when forceMock', () => {
      const result = createConditionalService(
        'TestService',
        () => 'real-implementation',
        () => 'mock-implementation',
        { forceMock: true }
      );

      expect(result).toBe('mock-implementation');
    });

    it('should surface mock creation failure', () => {
      enableTestMode({ mockServices: true });

      expect(() =>
        createConditionalService(
          'TestService',
          () => 'fallback-real',
          () => {
            throw new Error('Mock creation failed');
          }
        )
      ).toThrow(/Mock creation failed/);
    });

    it('should surface real creation failure', () => {
      expect(() =>
        createConditionalService(
          'TestService',
          () => {
            throw new Error('Real creation failed');
          },
          () => 'fallback-mock'
        )
      ).toThrow(/Real creation failed/);
    });

    it('should throw if both implementations fail', () => {
      expect(() => {
        createConditionalService(
          'TestService',
          () => {
            throw new Error('Real failed');
          },
          () => {
            throw new Error('Mock failed');
          }
        );
      }).toThrow();
    });

    it('should handle objects as service instances', () => {
      class RealService {
        type = 'real';
      }
      class MockService {
        type = 'mock';
      }

      enableTestMode({ mockServices: true });
      const instance = createConditionalService(
        'ComplexService',
        () => new RealService(),
        () => new MockService()
      );

      expect(instance.type).toBe('mock');
    });

    it('should support generic types', () => {
      interface MyService {
        execute(): string;
      }

      const result = createConditionalService<MyService>(
        'MyService',
        () => ({
          execute: () => 'real-result',
        }),
        () => ({
          execute: () => 'mock-result',
        })
      );

      expect(result.execute()).toBe('real-result');
    });
  });

  // ==========================================
  // Service Status
  // ==========================================

  describe('getServiceStatus', () => {
    it('should return service status', () => {
      const status = getServiceStatus('TestService');
      expect(status.name).toBe('TestService');
      expect(status.available).toBe(true);
      expect(status.implementation).toBe('real');
      expect(status.reason).toBeDefined();
    });

    it('should reflect test mode in reason', () => {
      const statusBefore = getServiceStatus('TestService');
      expect(statusBefore.reason).toContain('test mode: false');

      enableTestMode({ mockServices: true });
      const statusAfter = getServiceStatus('TestService');
      expect(statusAfter.reason).toContain('enabled: true');
    });

    it('should show mock implementation in reason', () => {
      enableTestMode({ mockServices: true });
      const status = getServiceStatus('TestService');
      expect(status.implementation).toBe('mock');
      expect(status.reason).toContain('mock');
    });
  });

  describe('getAllServiceStatuses', () => {
    it('should return status for multiple services', () => {
      const services = ['Service1', 'Service2', 'Service3'];
      const statuses = getAllServiceStatuses(services);
      expect(statuses).toHaveLength(3);
      expect(statuses[0].name).toBe('Service1');
      expect(statuses[1].name).toBe('Service2');
      expect(statuses[2].name).toBe('Service3');
    });

    it('should return all real in non-test mode', () => {
      disableTestMode();
      const statuses = getAllServiceStatuses(['S1', 'S2', 'S3']);
      statuses.forEach(status => {
        expect(status.implementation).toBe('real');
      });
    });

    it('should return all mock in test mode', () => {
      enableTestMode({ mockServices: true });
      const statuses = getAllServiceStatuses(['S1', 'S2', 'S3']);
      statuses.forEach(status => {
        expect(status.implementation).toBe('mock');
      });
    });

    it('should handle empty service list', () => {
      const statuses = getAllServiceStatuses([]);
      expect(statuses).toHaveLength(0);
    });
  });

  // ==========================================
  // Assertion Helpers
  // ==========================================

  describe('assertServiceIsMock', () => {
    it('should not throw if service uses mock', () => {
      enableTestMode({ mockServices: true });
      expect(() => {
        assertServiceIsMock('TestService');
      }).not.toThrow();
    });

    it('should throw if service uses real', () => {
      expect(() => {
        assertServiceIsMock('TestService');
      }).toThrow();
    });

    it('should work with forceMock option', () => {
      expect(() => {
        assertServiceIsMock('TestService', { forceMock: true });
      }).not.toThrow();
    });

    it('should throw with helpful message', () => {
      expect(() => {
        assertServiceIsMock('TestService', { forceReal: true });
      }).toThrow(/TestService.*real/i);
    });
  });

  describe('assertServiceIsReal', () => {
    it('should not throw if service uses real', () => {
      expect(() => {
        assertServiceIsReal('TestService');
      }).not.toThrow();
    });

    it('should throw if service uses mock', () => {
      enableTestMode({ mockServices: true });
      expect(() => {
        assertServiceIsReal('TestService');
      }).toThrow();
    });

    it('should work with forceReal option', () => {
      expect(() => {
        assertServiceIsReal('TestService', { forceReal: true });
      }).not.toThrow();
    });

    it('should throw with helpful message', () => {
      expect(() => {
        assertServiceIsReal('TestService', { forceMock: true });
      }).toThrow(/TestService.*mock/i);
    });
  });

  // ==========================================
  // Priority & Option Handling
  // ==========================================

  describe('option priority', () => {
    it('should follow priority: selector > force > test mode > default', () => {
      enableTestMode({ mockServices: false });

      // Priority 1: selector
      const impl1 = getServiceImplementation('S1', {
        selector: () => 'mock',
        forceMock: true,
      });
      expect(impl1).toBe('mock');

      // Priority 2: forceMock
      const impl2 = getServiceImplementation('S2', {
        forceMock: true,
      });
      expect(impl2).toBe('mock');

      // Priority 3: test mode (mockServices disabled)
      const impl3 = getServiceImplementation('S3');
      expect(impl3).toBe('real');

      // Enable test mode
      enableTestMode({ mockServices: true });
      const impl4 = getServiceImplementation('S4');
      expect(impl4).toBe('mock');
    });

    it('forceReal should override forceMock', () => {
      const impl = getServiceImplementation('TestService', {
        forceMock: true,
        forceReal: true,
      });
      // forceReal should be checked after forceMock, so it depends on implementation order
      // In this case, we expect forceReal to override
      expect(impl).toBe('real');
    });
  });

  // ==========================================
  // Type Safety
  // ==========================================

  describe('type definitions', () => {
    it('should have correct ServiceFactoryOptions interface', () => {
      const options: ServiceFactoryOptions = {
        forceMock: true,
        selector: () => 'mock',
      };
      expect(options.forceMock).toBe(true);
    });

    it('should have correct ServiceStatus interface', () => {
      const status: ServiceStatus = {
        name: 'TestService',
        available: true,
        implementation: 'mock',
        reason: 'Test mode mock',
      };
      expect(status.name).toBe('TestService');
    });
  });
});
