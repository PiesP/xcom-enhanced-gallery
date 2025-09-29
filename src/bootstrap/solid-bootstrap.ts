/**
 * @fileoverview Solid bootstrap entry point.
 * @description Stage D baseline that always prepares Solid-specific modules and vendors.
 */

import { logger } from '@/shared/logging';
import { getSolidCore, getSolidWeb } from '@shared/external/vendors';

export interface SolidBootstrapHandle {
  dispose(): void | Promise<void>;
}

let activeInstance: SolidBootstrapHandle | null = null;
let activeStartPromise: Promise<SolidBootstrapHandle> | null = null;

export async function startSolidBootstrap(): Promise<SolidBootstrapHandle> {
  if (activeInstance) {
    return activeInstance;
  }

  if (activeStartPromise) {
    return activeStartPromise;
  }

  activeStartPromise = (async () => {
    logger.info('[SolidBootstrap] 초기화 시작');

    try {
      // Ensure Solid runtime entry points are ready.
      getSolidCore();
      getSolidWeb();
    } catch (error) {
      logger.error('[SolidBootstrap] Solid 벤더 초기화 실패:', error);
      throw error;
    }

    const abortController = new AbortController();
    const warmupTasks: Promise<unknown>[] = [];

    const scheduleWarmup = (task: () => Promise<unknown>) => {
      const wrapped = task().catch(error => {
        logger.warn('[SolidBootstrap] 모듈 프리로드 실패:', error);
      });
      warmupTasks.push(wrapped);
    };

    scheduleWarmup(async () => {
      await import('@features/gallery/solid/renderSolidGalleryShell');
    });

    scheduleWarmup(async () => {
      await import('@features/settings/solid/renderSolidSettingsPanel');
    });

    scheduleWarmup(async () => {
      await import('@features/notifications/solid/renderSolidToastHost');
    });

    void Promise.allSettled(warmupTasks);

    let disposed = false;
    const handle: SolidBootstrapHandle = {
      dispose: () => {
        if (disposed) {
          return;
        }
        disposed = true;
        abortController.abort();
        activeInstance = null;
        logger.debug('[SolidBootstrap] dispose 완료');
      },
    };

    activeInstance = handle;
    logger.info('[SolidBootstrap] 초기화 완료');
    return handle;
  })();

  try {
    return await activeStartPromise;
  } finally {
    activeStartPromise = null;
  }
}
