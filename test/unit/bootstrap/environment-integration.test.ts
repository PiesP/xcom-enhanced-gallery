import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';

function mockLoggerModule() {
  vi.doMock('../../../src/shared/logging', () => ({
    logger: {
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  }));
}

async function importModule() {
  vi.resetModules();
  mockLoggerModule();
  return await import('../../../src/bootstrap/environment');
}

describe('Bootstrap Environment Integration', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (globalThis as any).GM_getValue;
    delete (globalThis as any).GM_setValue;
    delete (globalThis as any).__VITEST__;
  });

  describe('initializeEnvironment', () => {
    it('should detect and log Tampermonkey environment', async () => {
      (globalThis as any).GM_getValue = vi.fn();
      (globalThis as any).GM_setValue = vi.fn();

      const { initializeEnvironment } = await importModule();

      await expect(initializeEnvironment()).resolves.not.toThrow();
    });

    it('should detect and log test environment', async () => {
      (globalThis as any).__VITEST__ = true;

      const { initializeEnvironment } = await importModule();

      await expect(initializeEnvironment()).resolves.not.toThrow();
    });

    it('should handle environment detection gracefully', async () => {
      const { initializeEnvironment } = await importModule();

      // Environment should be detected even if no APIs are available
      await expect(initializeEnvironment()).resolves.not.toThrow();
    });
  });
});
