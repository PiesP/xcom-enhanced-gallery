/**
 * @fileoverview Preload strategy tests
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setupGlobalTestIsolation } from '@test/shared/global-cleanup-hooks';
import type { PreloadDependencies, PreloadTask } from '../../../src/bootstrap/preload';

const PRELOAD_MODULE_PATH = '../../../src/bootstrap/preload';

describe('executePreloadStrategy', () => {
  setupGlobalTestIsolation();

  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv('DEV', true);
    vi.stubEnv('PROD', false);
  });

  it('preloads configured chunks exactly once', async () => {
    const chunkSpy = vi.fn();

    vi.doMock('@features/gallery', () => {
      chunkSpy();
      return {};
    });

    const { executePreloadStrategy } = await import(PRELOAD_MODULE_PATH);

    await executePreloadStrategy();

    expect(chunkSpy).toHaveBeenCalledTimes(1);
  });

  it('logs a warning when a chunk fails to preload', async () => {
    const warnSpy = vi.fn();

    const { executePreloadStrategy } = await import(PRELOAD_MODULE_PATH);

    const loaderSpy = vi.fn(async () => {
      throw new Error('chunk failed');
    });

    const failingTask: PreloadTask = {
      label: 'failing chunk',
      loader: loaderSpy,
    };

    const deps: PreloadDependencies = {
      logWarn: warnSpy,
    };

    await expect(executePreloadStrategy([failingTask], deps)).resolves.toBeUndefined();
    expect(loaderSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[preload] failing chunk preload failed',
      expect.any(Error)
    );
  });
});
