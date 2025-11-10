import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setupGlobalTestIsolation } from '../../../shared/global-cleanup-hooks';

type RegisteredHandler = (event: Event) => void;

describe('useGalleryKeyboard (service parity)', () => {
  setupGlobalTestIsolation();

  const addListenerMock = vi.fn();
  const removeListenerMock = vi.fn();
  const getInstanceMock = vi.fn();
  let cleanupCallbacks: Array<() => void> = [];
  let registeredHandler: RegisteredHandler | null = null;
  let listenerIdQueue: string[] = [];

  const primeModule = async () => {
    vi.resetModules();
    cleanupCallbacks = [];
    registeredHandler = null;
    listenerIdQueue = [];
    addListenerMock.mockImplementation((_target, type, handler) => {
      if (type === 'keydown') {
        registeredHandler = handler;
      }
      return listenerIdQueue.shift() ?? 'listener-id';
    });
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
        createEffect: (fn: () => void) => fn(),
        onCleanup: (fn: () => void) => {
          cleanupCallbacks.push(fn);
        },
      })),
    }));

    const mod = await import(
      '@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard' as string
    );
    return mod.useGalleryKeyboard;
  };

  beforeEach(() => {
    addListenerMock.mockReset();
    removeListenerMock.mockReset();
    removeListenerMock.mockImplementation(() => {
      registeredHandler = null;
      return true;
    });
    getInstanceMock.mockReset();
    cleanupCallbacks = [];
    registeredHandler = null;
    listenerIdQueue = [];
  });

  const fire = (event: KeyboardEvent) => {
    if (!registeredHandler) {
      throw new Error('keyboard listener not registered');
    }
    registeredHandler(event);
  };

  it('triggers onClose for Escape and ignores editable targets', async () => {
    const useGalleryKeyboard = await primeModule();
    const onClose = vi.fn();

    useGalleryKeyboard({ onClose });

    expect(addListenerMock).toHaveBeenCalledWith(
      document,
      'keydown',
      expect.any(Function),
      { capture: true },
      'gallery-keyboard-navigation'
    );

    fire(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(onClose).toHaveBeenCalledTimes(1);

    const input = document.createElement('input');
    const editableEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    Object.defineProperty(editableEvent, 'target', { value: input });
    fire(editableEvent);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('triggers onOpenHelp for ? and Shift+/', async () => {
    const useGalleryKeyboard = await primeModule();
    const onClose = vi.fn();
    const onOpenHelp = vi.fn();

    useGalleryKeyboard({ onClose, onOpenHelp });

    fire(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
    fire(new KeyboardEvent('keydown', { key: '/', shiftKey: true, bubbles: true }));

    expect(onOpenHelp).toHaveBeenCalledTimes(2);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('cleans up listeners via onCleanup', async () => {
    const useGalleryKeyboard = await primeModule();
    useGalleryKeyboard({ onClose: vi.fn() });

    expect(cleanupCallbacks).toHaveLength(1);
    cleanupCallbacks[0]!();

    expect(removeListenerMock).toHaveBeenCalledWith('listener-id');
  });

  it('prevents default propagation when handled and re-subscribes cleanly', async () => {
    const useGalleryKeyboard = await primeModule();
    const onClose = vi.fn();

    listenerIdQueue = ['first-listener', 'second-listener'];
    useGalleryKeyboard({ onClose });

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    fire({
      key: 'Escape',
      preventDefault,
      stopPropagation,
      target: null,
    } as unknown as KeyboardEvent);

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(stopPropagation).toHaveBeenCalledTimes(1);

    expect(cleanupCallbacks).toHaveLength(1);
    cleanupCallbacks[0]!();
    expect(removeListenerMock).toHaveBeenCalledWith('first-listener');

    expect(() => fire(new KeyboardEvent('keydown', { key: 'Escape' }))).toThrowError(
      'keyboard listener not registered'
    );
  });
});
