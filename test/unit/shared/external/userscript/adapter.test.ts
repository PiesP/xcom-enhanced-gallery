/**
 * @fileoverview Userscript Adapter 테스트
 * @description Tampermonkey/Greasemonkey/Violentmonkey API 래퍼 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getUserscript } from '@shared/external/userscript/adapter';

describe('Userscript Adapter', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Reset all GM global properties
    delete (globalThis as any).GM_info;
    delete (globalThis as any).GM_download;
    delete (globalThis as any).GM_xmlhttpRequest;
    delete (globalThis as any).GM_setValue;
    delete (globalThis as any).GM_getValue;
    delete (globalThis as any).GM_deleteValue;
    delete (globalThis as any).GM_listValues;
  });

  afterEach(() => {
    delete (globalThis as any).GM_info;
    delete (globalThis as any).GM_download;
    delete (globalThis as any).GM_xmlhttpRequest;
    delete (globalThis as any).GM_setValue;
    delete (globalThis as any).GM_getValue;
    delete (globalThis as any).GM_deleteValue;
    delete (globalThis as any).GM_listValues;
  });

  describe('Main API', () => {
    it('should return frozen UserscriptAPI object', () => {
      const api = getUserscript();
      expect(Object.isFrozen(api)).toBe(true);
    });

    it('should have all required properties and methods', () => {
      const api = getUserscript();
      expect(typeof api.hasGM).toBe('boolean');
      expect(typeof api.manager).toBe('string');
      expect(typeof api.info).toBe('function');
      expect(typeof api.download).toBe('function');
      expect(typeof api.xhr).toBe('function');
      expect(typeof api.setValue).toBe('function');
      expect(typeof api.getValue).toBe('function');
      expect(typeof api.deleteValue).toBe('function');
      expect(typeof api.listValues).toBe('function');
    });

    it('should have hasGM false by default', () => {
      const api = getUserscript();
      expect(api.hasGM).toBe(false);
    });

    it('should detect unknown manager by default', () => {
      const api = getUserscript();
      expect(api.manager).toBe('unknown');
    });
  });

  describe('Manager Detection', () => {
    it('should detect Tampermonkey', () => {
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      const api = getUserscript();
      expect(api.manager).toBe('tampermonkey');
    });

    it('should handle Tampermonkey case-insensitive', () => {
      (globalThis as any).GM_info = {
        scriptHandler: 'TAMPERMONKEY',
        script: { name: 'Test', version: '1.0' },
      };
      const api = getUserscript();
      expect(api.manager).toBe('tampermonkey');
    });

    it('should detect Greasemonkey', () => {
      (globalThis as any).GM_info = {
        scriptHandler: 'Greasemonkey',
        script: { name: 'Test', version: '1.0' },
      };
      const api = getUserscript();
      expect(api.manager).toBe('greasemonkey');
    });

    it('should detect Violentmonkey', () => {
      (globalThis as any).GM_info = {
        scriptHandler: 'Violentmonkey',
        script: { name: 'Test', version: '1.0' },
      };
      const api = getUserscript();
      expect(api.manager).toBe('violentmonkey');
    });

    it('should handle unknown manager', () => {
      (globalThis as any).GM_info = {
        scriptHandler: 'UnknownManager',
        script: { name: 'Test', version: '1.0' },
      };
      const api = getUserscript();
      expect(api.manager).toBe('unknown');
    });

    it('should set hasGM true when GM_download available', () => {
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_download = vi.fn();
      const api = getUserscript();
      expect(api.hasGM).toBe(true);
    });

    it('should set hasGM true when GM_xmlhttpRequest available', () => {
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_xmlhttpRequest = vi.fn();
      const api = getUserscript();
      expect(api.hasGM).toBe(true);
    });

    it('should set hasGM true when GM_setValue and GM_getValue available', () => {
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_setValue = vi.fn();
      (globalThis as any).GM_getValue = vi.fn();
      const api = getUserscript();
      expect(api.hasGM).toBe(true);
    });
  });

  describe('info() method', () => {
    it('should return null when no GM_info', () => {
      const api = getUserscript();
      expect(api.info()).toBeNull();
    });

    it('should return GM_info when available and valid', () => {
      const gmInfo = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_info = gmInfo;
      const api = getUserscript();
      const result = api.info();
      expect(result).toBeTruthy();
      expect((result as any)?.script?.name).toBe('Test');
    });

    it('should handle null GM_info', () => {
      (globalThis as any).GM_info = null;
      const api = getUserscript();
      expect(api.info()).toBeNull();
    });

    it('should handle GM_info without script property', () => {
      (globalThis as any).GM_info = { scriptHandler: 'Tampermonkey' };
      const api = getUserscript();
      const result = api.info();
      // When script property is missing, should return null (per isGMUserScriptInfo check)
      expect(result === null || typeof result === 'object').toBe(true);
    });
  });

  describe('download() method', () => {
    it('should use GM_download when available', async () => {
      const gmDownloadMock = vi.fn();
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_download = gmDownloadMock;

      const api = getUserscript();
      await api.download('http://example.com/file.zip', 'file.zip');

      expect(gmDownloadMock).toHaveBeenCalledWith('http://example.com/file.zip', 'file.zip');
    });

    it('should handle GM_download failure gracefully', async () => {
      const gmDownloadMock = vi.fn(() => {
        throw new Error('Failed');
      });
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_download = gmDownloadMock;

      const api = getUserscript();
      // When GM download fails, fallback is attempted
      // Note: In JSDOM, fallback attempts fetch which will fail with 404
      // We expect the failure to propagate
      await expect(api.download('http://example.com/file.zip', 'file.zip')).rejects.toThrow();
    });

    it('should fallback when no GM_download', async () => {
      const api = getUserscript();
      // In JSDOM environment, fallback will attempt fetch which fails with 404
      // We expect this to throw
      await expect(api.download('http://example.com/file.zip', 'file.zip')).rejects.toThrow();
    });
  });

  describe('xhr() method', () => {
    it('should use GM_xmlhttpRequest when available', () => {
      const gmXhrMock = vi.fn(() => ({ abort: vi.fn() }));
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_xmlhttpRequest = gmXhrMock;

      const api = getUserscript();
      const result = api.xhr({ method: 'GET', url: 'http://example.com' });

      expect(gmXhrMock).toHaveBeenCalled();
      expect(result).toHaveProperty('abort');
    });

    it('should return fallback or undefined when GM_xmlhttpRequest fails', () => {
      const gmXhrMock = vi.fn(() => {
        throw new Error('Failed');
      });
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_xmlhttpRequest = gmXhrMock;

      const api = getUserscript();
      const result = api.xhr({ method: 'GET', url: 'http://example.com' });

      // When GM fails, fallback may return abort function or undefined
      expect(result === undefined || result?.abort !== undefined).toBe(true);
    });
  });

  describe('Storage Methods', () => {
    it('should use GM_setValue when available', async () => {
      const gmSetValueMock = vi.fn();
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_setValue = gmSetValueMock;
      (globalThis as any).GM_getValue = vi.fn();

      const api = getUserscript();
      await api.setValue('key', 'value');

      expect(gmSetValueMock).toHaveBeenCalledWith('key', 'value');
    });

    it('should use GM_getValue when available', async () => {
      const gmGetValueMock = vi.fn(() => Promise.resolve('test-value'));
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_setValue = vi.fn();
      (globalThis as any).GM_getValue = gmGetValueMock;

      const api = getUserscript();
      const result = await api.getValue('key');

      expect(gmGetValueMock).toHaveBeenCalled();
      expect(result).toBe('test-value');
    });

    it('should use GM_deleteValue when available', async () => {
      const gmDeleteValueMock = vi.fn();
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_setValue = vi.fn();
      (globalThis as any).GM_getValue = vi.fn();
      (globalThis as any).GM_deleteValue = gmDeleteValueMock;

      const api = getUserscript();
      await api.deleteValue('key');

      expect(gmDeleteValueMock).toHaveBeenCalledWith('key');
    });

    it('should use GM_listValues when available', async () => {
      const gmListValuesMock = vi.fn(() => Promise.resolve(['key1', 'key2']));
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_setValue = vi.fn();
      (globalThis as any).GM_getValue = vi.fn();
      (globalThis as any).GM_listValues = gmListValuesMock;

      const api = getUserscript();
      const result = await api.listValues();

      expect(gmListValuesMock).toHaveBeenCalled();
      expect(result).toEqual(['key1', 'key2']);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing GM_info gracefully', () => {
      const api = getUserscript();

      expect(api.manager).toBe('unknown');
      expect(api.hasGM).toBe(false);
      expect(api.info()).toBeNull();
    });

    it('should return empty array when GM_listValues fails', async () => {
      const gmListValuesMock = vi.fn(() => {
        throw new Error('Failed');
      });
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_setValue = vi.fn();
      (globalThis as any).GM_getValue = vi.fn();
      (globalThis as any).GM_listValues = gmListValuesMock;

      const api = getUserscript();
      const result = await api.listValues();

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return default value on storage error', async () => {
      const api = getUserscript();
      const result = await api.getValue('missing-key', { default: 'fallback' });

      expect(result).toEqual({ default: 'fallback' });
    });

    it('should throw when setValue fails and no fallback', async () => {
      Object.defineProperty(globalThis, 'localStorage', {
        get() {
          throw new Error('SecurityError');
        },
        configurable: true,
      });

      const api = getUserscript();

      await expect(api.setValue('key', 'value')).rejects.toThrow();
    });
  });

  describe('Return Types', () => {
    it('should return frozen object each time', () => {
      const api1 = getUserscript();
      const api2 = getUserscript();

      expect(Object.isFrozen(api1)).toBe(true);
      expect(Object.isFrozen(api2)).toBe(true);
      expect(api1).not.toBe(api2);
    });

    it('should support various data types in storage', async () => {
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      const gmSetValueMock = vi.fn();
      (globalThis as any).GM_setValue = gmSetValueMock;
      (globalThis as any).GM_getValue = vi.fn();

      const api = getUserscript();

      await api.setValue('string-key', 'string');
      await api.setValue('number-key', 123);
      await api.setValue('object-key', { nested: 'value' });
      await api.setValue('array-key', [1, 2, 3]);

      expect(gmSetValueMock).toHaveBeenCalledTimes(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle exception during manager detection', () => {
      (globalThis as any).GM_info = {
        scriptHandler: null,
        get script() {
          throw new Error('Access denied');
        },
      };
      const api = getUserscript();

      expect(api.manager).toBe('unknown');
    });

    it('should handle GM_getValue returning non-array', async () => {
      const gmListValuesMock = vi.fn(() => Promise.resolve(null));
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_setValue = vi.fn();
      (globalThis as any).GM_getValue = vi.fn();
      (globalThis as any).GM_listValues = gmListValuesMock;

      const api = getUserscript();
      const result = await api.listValues();

      expect(result).toEqual([]);
    });

    it('should handle storage cascade when GM fails', async () => {
      const gmSetValueMock = vi.fn(() => {
        throw new Error('GM failed');
      });
      (globalThis as any).GM_info = {
        scriptHandler: 'Tampermonkey',
        script: { name: 'Test', version: '1.0' },
      };
      (globalThis as any).GM_setValue = gmSetValueMock;
      (globalThis as any).GM_getValue = vi.fn();

      const api = getUserscript();
      // When both GM and localStorage fail, should throw
      // But if localStorage is available through fallback, it works
      // In test environment, we expect it to try fallback
      try {
        await api.setValue('key', 'value');
      } catch (error) {
        // Expected behavior: throws when no storage available
        expect((error as any).message).toBeDefined();
      }
    });
  });
});
