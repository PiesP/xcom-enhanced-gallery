/**
 * @fileoverview Bootstrap Logger Unit Tests
 * @description Phase 348: 부트스트랩 로깅 유틸리티 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../../../src/shared/logging';
import {
  logBootstrapSummary,
  logEnvironmentInfo,
} from '../../../src/bootstrap/diagnostics/bootstrap-logger';
import type { BootstrapResult } from '../../../src/bootstrap/diagnostics/types';

describe('Bootstrap Logger', () => {
  // Mock logger functions
  let infoSpy: ReturnType<typeof vi.fn>;
  let debugSpy: ReturnType<typeof vi.fn>;
  let warnSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => {});
    debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => {});
    warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logBootstrapSummary', () => {
    it('should log successful bootstrap with all services available', () => {
      const result: BootstrapResult = {
        success: true,
        environment: 'tampermonkey',
        timestamp: '2025-11-04T12:00:00.000Z',
        services: [
          { name: 'HttpRequestService', available: true, message: 'Native fetch API detected' },
          { name: 'DownloadService', available: true, message: 'GM_download detected' },
        ],
        warnings: [],
        errors: [],
      };

      logBootstrapSummary(result);

      // Verify summary log
      expect(infoSpy).toHaveBeenCalledWith(
        '[bootstrap] Summary: tampermonkey | Services: 2/2 | Status: ✅'
      );

      // Verify service logs
      expect(debugSpy).toHaveBeenCalledWith(
        '[bootstrap] ✅ HttpRequestService: Native fetch API detected'
      );
      expect(debugSpy).toHaveBeenCalledWith('[bootstrap] ✅ DownloadService: GM_download detected');
    });

    it('should log failed bootstrap with status ❌', () => {
      const result: BootstrapResult = {
        success: false,
        environment: 'test',
        timestamp: '2025-11-04T12:00:00.000Z',
        services: [],
        warnings: [],
        errors: ['Critical error occurred'],
      };

      logBootstrapSummary(result);

      expect(infoSpy).toHaveBeenCalledWith(
        '[bootstrap] Summary: test | Services: 0/0 | Status: ❌'
      );
    });

    it('should log unavailable services with warning icon', () => {
      const result: BootstrapResult = {
        success: true,
        environment: 'browser',
        timestamp: '2025-11-04T12:00:00.000Z',
        services: [
          { name: 'HttpRequestService', available: true, message: 'Native fetch API detected' },
          { name: 'DownloadService', available: false, message: 'GM_download unavailable' },
        ],
        warnings: [],
        errors: [],
      };

      logBootstrapSummary(result);

      expect(infoSpy).toHaveBeenCalledWith(
        '[bootstrap] Summary: browser | Services: 1/2 | Status: ✅'
      );
      expect(debugSpy).toHaveBeenCalledWith(
        '[bootstrap] ✅ HttpRequestService: Native fetch API detected'
      );
      expect(debugSpy).toHaveBeenCalledWith(
        '[bootstrap] ⚠️  DownloadService: GM_download unavailable'
      );
    });

    it('should log warnings if present', () => {
      const result: BootstrapResult = {
        success: true,
        environment: 'test',
        timestamp: '2025-11-04T12:00:00.000Z',
        services: [],
        warnings: ['Warning 1', 'Warning 2'],
        errors: [],
      };

      logBootstrapSummary(result);

      expect(warnSpy).toHaveBeenCalledWith('[bootstrap] Warning 1');
      expect(warnSpy).toHaveBeenCalledWith('[bootstrap] Warning 2');
    });

    it('should log errors if present', () => {
      const result: BootstrapResult = {
        success: false,
        environment: 'test',
        timestamp: '2025-11-04T12:00:00.000Z',
        services: [],
        warnings: [],
        errors: ['Error 1', 'Error 2'],
      };

      logBootstrapSummary(result);

      expect(errorSpy).toHaveBeenCalledWith('[bootstrap] Error 1');
      expect(errorSpy).toHaveBeenCalledWith('[bootstrap] Error 2');
    });

    it('should handle empty services array', () => {
      const result: BootstrapResult = {
        success: true,
        environment: 'test',
        timestamp: '2025-11-04T12:00:00.000Z',
        services: [],
        warnings: [],
        errors: [],
      };

      logBootstrapSummary(result);

      expect(infoSpy).toHaveBeenCalledWith(
        '[bootstrap] Summary: test | Services: 0/0 | Status: ✅'
      );
    });
  });

  describe('logEnvironmentInfo', () => {
    it('should log Tampermonkey environment with available APIs', () => {
      const environment = {
        environment: 'tampermonkey',
        isUserscriptEnvironment: true,
        isTestEnvironment: false,
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: ['GM_download', 'GM_setValue', 'GM_getValue'],
      };

      logEnvironmentInfo(environment);

      expect(debugSpy).toHaveBeenCalledWith(
        '[bootstrap] ✅ Tampermonkey APIs available: GM_download, GM_setValue, GM_getValue'
      );
    });

    it('should log test environment', () => {
      const environment = {
        environment: 'test',
        isUserscriptEnvironment: false,
        isTestEnvironment: true,
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: [],
      };

      logEnvironmentInfo(environment);

      expect(debugSpy).toHaveBeenCalledWith(
        '[bootstrap] 🧪 Test environment - using mock implementations'
      );
    });

    it('should log browser extension environment', () => {
      const environment = {
        environment: 'extension',
        isUserscriptEnvironment: false,
        isTestEnvironment: false,
        isBrowserExtension: true,
        isBrowserConsole: false,
        availableGMAPIs: [],
      };

      logEnvironmentInfo(environment);

      expect(debugSpy).toHaveBeenCalledWith('[bootstrap] 🔌 Browser extension environment');
    });

    it('should warn about plain browser console environment', () => {
      const environment = {
        environment: 'browser',
        isUserscriptEnvironment: false,
        isTestEnvironment: false,
        isBrowserExtension: false,
        isBrowserConsole: true,
        availableGMAPIs: [],
      };

      logEnvironmentInfo(environment);

      expect(warnSpy).toHaveBeenCalledWith('[bootstrap] ⚠️ Plain browser console environment');
    });

    it('should handle empty GM APIs array', () => {
      const environment = {
        environment: 'tampermonkey',
        isUserscriptEnvironment: true,
        isTestEnvironment: false,
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: [],
      };

      logEnvironmentInfo(environment);

      expect(debugSpy).toHaveBeenCalledWith('[bootstrap] ✅ Tampermonkey APIs available: ');
    });

    it('should prioritize userscript environment over test environment', () => {
      const environment = {
        environment: 'tampermonkey',
        isUserscriptEnvironment: true,
        isTestEnvironment: true, // Both true, but userscript should take precedence
        isBrowserExtension: false,
        isBrowserConsole: false,
        availableGMAPIs: ['GM_download'],
      };

      logEnvironmentInfo(environment);

      expect(debugSpy).toHaveBeenCalledWith(
        '[bootstrap] ✅ Tampermonkey APIs available: GM_download'
      );
      expect(debugSpy).not.toHaveBeenCalledWith(
        '[bootstrap] 🧪 Test environment - using mock implementations'
      );
    });
  });
});
