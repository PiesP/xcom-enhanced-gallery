/**
 * @fileoverview Bootstrap Reporter Unit Tests
 * @description Phase 348: 부트스트랩 진단 리포터 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach, type SpyInstance } from 'vitest';
import { logger } from '../../../src/shared/logging';
import {
  createDiagnosticsCollector,
  getBootstrapDiagnostics,
} from '../../../src/bootstrap/diagnostics/collector';
import type {
  BootstrapResult,
  ServiceAvailabilityInfo,
} from '../../../src/bootstrap/diagnostics/types';
import type { EnvironmentInfo } from '../../../src/shared/external/userscript/environment-detector';

const BASE_ENVIRONMENT: EnvironmentInfo = Object.freeze({
  environment: 'userscript',
  isUserscriptEnvironment: true,
  isTestEnvironment: false,
  isBrowserExtension: false,
  isBrowserConsole: false,
  availableGMAPIs: ['GM_download'],
});

const DEFAULT_TIMESTAMP = '2025-11-05T00:00:00.000Z';

type CollectorTestOverrides = {
  environment?: EnvironmentInfo;
  services?: ServiceAvailabilityInfo[];
  timestamp?: string;
  detectError?: unknown;
  serviceError?: unknown;
  now?: () => Date;
};

const createTestCollector = (overrides: CollectorTestOverrides = {}) => {
  const environment = overrides.environment ?? BASE_ENVIRONMENT;
  const detectEnvironment = vi.fn<[], EnvironmentInfo>();
  if ('detectError' in overrides && overrides.detectError !== undefined) {
    detectEnvironment.mockImplementation(() => {
      throw overrides.detectError;
    });
  } else {
    detectEnvironment.mockReturnValue(environment);
  }

  const checkAllServices = vi.fn<[], Promise<ServiceAvailabilityInfo[]>>();
  if ('serviceError' in overrides && overrides.serviceError !== undefined) {
    checkAllServices.mockImplementation(async () => {
      throw overrides.serviceError;
    });
  } else {
    checkAllServices.mockResolvedValue(overrides.services ?? []);
  }

  const logEnvironmentInfo = vi.fn<[EnvironmentInfo], void>();
  const logBootstrapSummary = vi.fn<[BootstrapResult], void>();
  const now = overrides.now ?? (() => new Date(overrides.timestamp ?? DEFAULT_TIMESTAMP));

  const collector = createDiagnosticsCollector({
    detectEnvironment,
    checkAllServices,
    logEnvironmentInfo,
    logBootstrapSummary,
    now,
  });

  return {
    collector,
    detectEnvironment,
    checkAllServices,
    logEnvironmentInfo,
    logBootstrapSummary,
  };
};

describe('Bootstrap Reporter', () => {
  let loggerErrorSpy: SpyInstance;

  beforeEach(() => {
    loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getBootstrapDiagnostics (integration)', () => {
    it('returns a snapshot using real environment detection', async () => {
      const result = await getBootstrapDiagnostics();

      expect(result).toEqual(
        expect.objectContaining({
          success: expect.any(Boolean),
          environment: expect.any(String),
          timestamp: expect.any(String),
          services: expect.any(Array),
          warnings: expect.any(Array),
          errors: expect.any(Array),
        })
      );
    });
  });

  describe('createDiagnosticsCollector', () => {
    it('collects diagnostics with deterministic dependencies', async () => {
      const services: ServiceAvailabilityInfo[] = [
        { name: 'HttpRequestService', available: true, message: 'ok' },
      ];
      const { collector } = createTestCollector({ services });

      const result = await collector.collect();

      expect(result).toEqual({
        success: true,
        environment: 'userscript',
        timestamp: DEFAULT_TIMESTAMP,
        services,
        warnings: [],
        errors: [],
      });
    });

    it('logs environment info and bootstrap summary on success', async () => {
      const services: ServiceAvailabilityInfo[] = [
        { name: 'PersistentStorage', available: true, message: 'GM_setValue detected' },
      ];
      const { collector, logEnvironmentInfo, logBootstrapSummary } = createTestCollector({
        services,
      });

      const result = await collector.collect();

      expect(logEnvironmentInfo).toHaveBeenCalledWith(
        expect.objectContaining({ environment: 'userscript' })
      );
      expect(logBootstrapSummary).toHaveBeenCalledWith(result);
    });

    it('adds warnings for browser console environments', async () => {
      const consoleEnvironment: EnvironmentInfo = {
        environment: 'console',
        isUserscriptEnvironment: false,
        isTestEnvironment: false,
        isBrowserExtension: false,
        isBrowserConsole: true,
        availableGMAPIs: [],
      };

      const { collector } = createTestCollector({ environment: consoleEnvironment });
      const result = await collector.collect();

      expect(result.warnings).toContain('⚠️ Plain browser console - limited functionality');
    });

    it('handles service check failures gracefully', async () => {
      const serviceError = new Error('Service check failed');
      const { collector, logBootstrapSummary } = createTestCollector({
        serviceError,
      });

      const result = await collector.collect();

      expect(result.success).toBe(false);
      expect(result.environment).toBe('unknown');
      expect(result.errors).toContain('Service check failed');
      expect(logBootstrapSummary).not.toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        '[bootstrap] Bootstrap diagnostics error:',
        serviceError
      );
    });

    it('handles environment detection errors', async () => {
      const detectionError = new Error('Environment detection failed');
      const { collector, logEnvironmentInfo, logBootstrapSummary } = createTestCollector({
        detectError: detectionError,
      });

      const result = await collector.collect();

      expect(result.success).toBe(false);
      expect(result.environment).toBe('unknown');
      expect(result.errors).toContain('Environment detection failed');
      expect(logEnvironmentInfo).not.toHaveBeenCalled();
      expect(logBootstrapSummary).not.toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        '[bootstrap] Bootstrap diagnostics error:',
        detectionError
      );
    });

    it('normalizes non-Error exceptions', async () => {
      const { collector } = createTestCollector({ detectError: 'String error' });

      const result = await collector.collect();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('String error');
    });

    it('supports custom timestamps via dependency injection', async () => {
      const customTimestamp = '2025-12-01T12:34:56.789Z';
      const { collector } = createTestCollector({
        now: () => new Date(customTimestamp),
      });

      const result = await collector.collect();

      expect(result.timestamp).toBe(customTimestamp);
    });
  });
});
