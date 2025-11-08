/**
 * @fileoverview Bootstrap Reporter Unit Tests
 * @description Phase 348: 부트스트랩 진단 리포터 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../../src/shared/logging';
import { getBootstrapDiagnostics } from '../../../src/bootstrap/diagnostics/bootstrap-reporter';
import * as userscript from '../../../src/shared/external/userscript';
import * as serviceChecker from '../../../src/bootstrap/diagnostics/service-checker';
import * as bootstrapLogger from '../../../src/bootstrap/diagnostics/bootstrap-logger';

describe('Bootstrap Reporter', () => {
  let detectEnvironmentSpy: ReturnType<typeof vi.fn>;
  let checkAllServicesSpy: ReturnType<typeof vi.fn>;
  let logEnvironmentInfoSpy: ReturnType<typeof vi.fn>;
  let logBootstrapSummarySpy: ReturnType<typeof vi.fn>;
  let loggerErrorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock logger
    loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});

    // Mock dependencies
    detectEnvironmentSpy = vi.spyOn(userscript, 'detectEnvironment');
    checkAllServicesSpy = vi.spyOn(serviceChecker, 'checkAllServices');
    logEnvironmentInfoSpy = vi
      .spyOn(bootstrapLogger, 'logEnvironmentInfo')
      .mockImplementation(() => {});
    logBootstrapSummarySpy = vi
      .spyOn(bootstrapLogger, 'logBootstrapSummary')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getBootstrapDiagnostics', () => {
    it('should return BootstrapResult with environment and services', async () => {
      detectEnvironmentSpy.mockReturnValue({
        environment: 'tampermonkey',
        isUserscriptEnvironment: true,
        isTestEnvironment: false,
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: ['GM_download'],
      });

      checkAllServicesSpy.mockResolvedValue([
        { name: 'HttpRequestService', available: true, message: 'Available' },
        { name: 'DownloadService', available: true, message: 'GM_download available' },
      ]);

      const result = await getBootstrapDiagnostics();

      expect(result).toMatchObject({
        success: true,
        environment: 'tampermonkey',
        warnings: [],
        errors: [],
      });
      expect(result.services).toHaveLength(2);
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO format
    });

    it('should call logEnvironmentInfo with detected environment', async () => {
      const mockEnv = {
        environment: 'test',
        isUserscriptEnvironment: false,
        isTestEnvironment: true,
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: [],
      };

      detectEnvironmentSpy.mockReturnValue(mockEnv);
      checkAllServicesSpy.mockResolvedValue([]);

      await getBootstrapDiagnostics();

      expect(logEnvironmentInfoSpy).toHaveBeenCalledWith(mockEnv);
    });

    it('should add warning for browser console environment', async () => {
      detectEnvironmentSpy.mockReturnValue({
        environment: 'browser',
        isUserscriptEnvironment: false,
        isTestEnvironment: false,
        isBrowserExtension: false,
        isBrowserConsole: true,
        availableGMAPIs: [],
      });

      checkAllServicesSpy.mockResolvedValue([]);

      const result = await getBootstrapDiagnostics();

      expect(result.warnings).toContain('⚠️ Plain browser console - limited functionality');
    });

    it('should not add warning for non-browser-console environment', async () => {
      detectEnvironmentSpy.mockReturnValue({
        environment: 'tampermonkey',
        isUserscriptEnvironment: true,
        isTestEnvironment: false,
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: ['GM_download'],
      });

      checkAllServicesSpy.mockResolvedValue([]);

      const result = await getBootstrapDiagnostics();

      expect(result.warnings).toHaveLength(0);
    });

    it('should include service check results', async () => {
      detectEnvironmentSpy.mockReturnValue({
        environment: 'test',
        isUserscriptEnvironment: false,
        isTestEnvironment: true,
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: [],
      });

      const mockServices = [
        { name: 'HttpRequestService', available: true, message: 'fetch API available' },
        { name: 'DownloadService', available: false, message: 'GM_download not found' },
        { name: 'PersistentStorage', available: true, message: 'localStorage fallback' },
      ];

      checkAllServicesSpy.mockResolvedValue(mockServices);

      const result = await getBootstrapDiagnostics();

      expect(result.services).toEqual(mockServices);
      expect(result.services).toHaveLength(3);
    });

    it('should call logBootstrapSummary with result', async () => {
      detectEnvironmentSpy.mockReturnValue({
        environment: 'test',
        isUserscriptEnvironment: false,
        isTestEnvironment: true,
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: [],
      });

      checkAllServicesSpy.mockResolvedValue([]);

      const result = await getBootstrapDiagnostics();

      expect(logBootstrapSummarySpy).toHaveBeenCalledWith(result);
    });

    it('should handle errors and set success to false', async () => {
      const testError = new Error('Environment detection failed');
      detectEnvironmentSpy.mockImplementation(() => {
        throw testError;
      });

      const result = await getBootstrapDiagnostics();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Environment detection failed');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        '[bootstrap] Bootstrap diagnostics error:',
        testError
      );
    });

    it('should handle non-Error exceptions', async () => {
      detectEnvironmentSpy.mockImplementation(() => {
        throw 'String error';
      });

      const result = await getBootstrapDiagnostics();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('String error');
    });

    it('should handle service check failures gracefully', async () => {
      detectEnvironmentSpy.mockReturnValue({
        environment: 'test',
        isUserscriptEnvironment: false,
        isTestEnvironment: true,
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: [],
      });

      checkAllServicesSpy.mockRejectedValue(new Error('Service check failed'));

      const result = await getBootstrapDiagnostics();

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Service check failed');
    });

    it('should generate ISO format timestamps', async () => {
      detectEnvironmentSpy.mockReturnValue({
        environment: 'test',
        isUserscriptEnvironment: false,
        isTestEnvironment: true,
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: [],
      });

      checkAllServicesSpy.mockResolvedValue([]);

      const result = await getBootstrapDiagnostics();

      // Verify ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Verify it's a valid date
      const date = new Date(result.timestamp);
      expect(date.getTime()).toBeGreaterThan(0);
    });

    it('should return success=true when no errors occur', async () => {
      detectEnvironmentSpy.mockReturnValue({
        environment: 'tampermonkey',
        isUserscriptEnvironment: true,
        isTestEnvironment: false,
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: ['GM_download', 'GM_setValue'],
      });

      checkAllServicesSpy.mockResolvedValue([
        { name: 'HttpRequestService', available: true, message: 'Available' },
      ]);

      const result = await getBootstrapDiagnostics();

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should set environment to unknown before detection', async () => {
      detectEnvironmentSpy.mockImplementation(() => {
        throw new Error('Detection failed');
      });

      const result = await getBootstrapDiagnostics();

      // Environment should remain 'unknown' if detection fails
      expect(result.environment).toBe('unknown');
    });
  });
});
