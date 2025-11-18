/**
 * @fileoverview Bootstrap Logger Unit Tests
 * @description Phase 348: 부트스트랩 로깅 유틸리티 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Logger } from '../../../src/shared/logging';
import {
  diagnosticsLogger,
  logBootstrapSummary,
  logEnvironmentInfo,
} from '../../../src/bootstrap/diagnostics/logger';
import type { BootstrapResult } from '../../../src/bootstrap/diagnostics/types';

describe('Bootstrap Logger', () => {
  // Mock logger functions
  let scopedLogger: Logger;
  let infoSpy: ReturnType<typeof vi.fn>;
  let debugSpy: ReturnType<typeof vi.fn>;
  let warnSpy: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    scopedLogger = diagnosticsLogger.getLogger();
    infoSpy = vi.spyOn(scopedLogger, 'info').mockImplementation(() => {});
    debugSpy = vi.spyOn(scopedLogger, 'debug').mockImplementation(() => {});
    warnSpy = vi.spyOn(scopedLogger, 'warn').mockImplementation(() => {});
    errorSpy = vi.spyOn(scopedLogger, 'error').mockImplementation(() => {});
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
      expect(infoSpy).toHaveBeenCalledWith('✅ Bootstrap summary • tampermonkey • Services 2/2');

      // Verify service logs
      expect(debugSpy).toHaveBeenCalledWith('✅ HttpRequestService: Native fetch API detected');
      expect(debugSpy).toHaveBeenCalledWith('✅ DownloadService: GM_download detected');
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

      expect(infoSpy).toHaveBeenCalledWith('❌ Bootstrap summary • test • Services 0/0');
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

      expect(infoSpy).toHaveBeenCalledWith('✅ Bootstrap summary • browser • Services 1/2');
      expect(debugSpy).toHaveBeenCalledWith('✅ HttpRequestService: Native fetch API detected');
      expect(debugSpy).toHaveBeenCalledWith('⚠️ DownloadService: GM_download unavailable');
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

      expect(warnSpy).toHaveBeenCalledWith('⚠️ Warning 1');
      expect(warnSpy).toHaveBeenCalledWith('⚠️ Warning 2');
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

      expect(errorSpy).toHaveBeenCalledWith('❌ Error 1');
      expect(errorSpy).toHaveBeenCalledWith('❌ Error 2');
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

      expect(infoSpy).toHaveBeenCalledWith('✅ Bootstrap summary • test • Services 0/0');
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
        'Tampermonkey environment detected • GM APIs: GM_download, GM_setValue, GM_getValue'
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
        'Test environment detected • using mock implementations'
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

      expect(debugSpy).toHaveBeenCalledWith('Browser extension environment detected');
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

      expect(warnSpy).toHaveBeenCalledWith('Plain browser console environment detected');
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

      expect(debugSpy).toHaveBeenCalledWith('Tampermonkey environment detected • GM APIs: none');
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
        'Tampermonkey environment detected • GM APIs: GM_download'
      );
      expect(debugSpy).not.toHaveBeenCalledWith(
        'Test environment detected • using mock implementations'
      );
    });
  });
});
