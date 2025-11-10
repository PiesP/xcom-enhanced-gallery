/**
 * @fileoverview useGalleryKeyboard 훅의 생명주기/정리 동작 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../../shared/global-cleanup-hooks';

type RegisteredHandler = (event: Event) => void;

describe('useGalleryKeyboard lifecycle', () => {
  setupGlobalTestIsolation();

  const addListenerMock = vi.fn();
  const removeListenerMock = vi.fn();
  const getInstanceMock = vi.fn();

  let registeredHandler: RegisteredHandler | null = null;
  let listenerIdQueue: string[] = [];
  let effectRunner: (() => void) | null = null;
  let cleanupHistory: Array<Array<() => void>> = [];
  let activeCleanup: Array<() => void> | null = null;

  const primeModule = async () => {
    vi.resetModules();
    registeredHandler = null;
    listenerIdQueue = [];
    effectRunner = null;
    cleanupHistory = [];
    activeCleanup = null;

    addListenerMock.mockImplementation((_target, type, handler) => {
      if (type === 'keydown') {
        registeredHandler = handler;
      }
      return listenerIdQueue.shift() ?? `listener-${addListenerMock.mock.calls.length}`;
    });
    removeListenerMock.mockReset();
    removeListenerMock.mockImplementation(() => {
      registeredHandler = null;
      return true;
    });
    getInstanceMock.mockReturnValue({
      addListener: addListenerMock,
      removeListener: removeListenerMock,
    });

    vi.doMock('@/shared/services/event-manager', () => ({
      EventManager: {
        getInstance: getInstanceMock,
      },
    }));

    vi.doMock('@/shared/external/vendors', () => ({
      getSolid: vi.fn(() => ({
        createEffect: (fn: () => void) => {
          const runEffect = () => {
            const bucket: Array<() => void> = [];
            cleanupHistory.push(bucket);
            activeCleanup = bucket;
            fn();
            activeCleanup = null;
          };

          effectRunner = () => {
            const previous = cleanupHistory.at(-1);
            if (previous) {
              for (const cleanup of previous) {
                cleanup();
              }
            }
            runEffect();
          };

          effectRunner();
        },
        onCleanup: (fn: () => void) => {
          if (!activeCleanup) {
            throw new Error('onCleanup called outside of createEffect');
          }
          activeCleanup.push(fn);
        },
      })),
    }));

    const mod = await import(
      '@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard' as string
    );
    return {
      useGalleryKeyboard: mod.useGalleryKeyboard,
      runEffect: () => {
        if (!effectRunner) {
          throw new Error('effectRunner not initialized');
        }
        effectRunner();
      },
    };
  };

  beforeEach(() => {
    addListenerMock.mockReset();
    removeListenerMock.mockReset();
    removeListenerMock.mockImplementation(() => {
      registeredHandler = null;
      return true;
    });
    getInstanceMock.mockReset();
    listenerIdQueue = [];
    registeredHandler = null;
    cleanupHistory = [];
    effectRunner = null;
    activeCleanup = null;
  });

  const fire = (event: KeyboardEvent) => {
    if (!registeredHandler) {
      throw new Error('keyboard listener not registered');
    }
    registeredHandler(event);
  };

  it('re-subscribes when effect re-runs and cleans the previous listener', async () => {
    const { useGalleryKeyboard, runEffect } = await primeModule();
    const onClose = vi.fn();
    listenerIdQueue = ['first', 'second'];

    useGalleryKeyboard({ onClose });
    expect(addListenerMock).toHaveBeenCalledTimes(1);
    expect(removeListenerMock).not.toHaveBeenCalled();

    runEffect();
    expect(removeListenerMock).toHaveBeenCalledWith('first');
    expect(addListenerMock).toHaveBeenCalledTimes(2);

    fire(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('uses latest listener id for subsequent cleanups', async () => {
    const { useGalleryKeyboard, runEffect } = await primeModule();
    listenerIdQueue = ['initial', 'rerun'];

    useGalleryKeyboard({ onClose: vi.fn() });
    expect(cleanupHistory).toHaveLength(1);
    expect(cleanupHistory[0]).toHaveLength(1);

    runEffect();
    expect(cleanupHistory).toHaveLength(2);
    expect(removeListenerMock).toHaveBeenNthCalledWith(1, 'initial');

    const latestCleanup = cleanupHistory.at(-1);
    expect(latestCleanup).toBeDefined();
    latestCleanup?.forEach(cleanup => cleanup());
    expect(removeListenerMock).toHaveBeenLastCalledWith('rerun');
  });

  it('throws when firing after cleanup removes the listener', async () => {
    const { useGalleryKeyboard } = await primeModule();
    useGalleryKeyboard({ onClose: vi.fn() });

    const cleanupBucket = cleanupHistory[0];
    expect(cleanupBucket).toBeDefined();
    cleanupBucket?.forEach(cleanup => cleanup());

    expect(() => fire(new KeyboardEvent('keydown', { key: 'Escape' }))).toThrowError(
      'keyboard listener not registered'
    );
  });
});
