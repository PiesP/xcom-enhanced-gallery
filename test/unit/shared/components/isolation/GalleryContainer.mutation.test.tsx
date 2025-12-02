import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GalleryContainer } from '@shared/components/isolation';

const cleanupCallbacks: Array<() => void> = [];

vi.mock('@shared/external/vendors/solid-hooks', () => ({
  createEffect: (fn: () => void) => {
    fn();
  },
  onCleanup: (cb: () => void) => {
    cleanupCallbacks.push(cb);
  },
  render: vi.fn(),
}));

const addListenerMock = vi.fn();
const removeListenerMock = vi.fn();

vi.mock('@shared/services/event-manager', () => ({
  EventManager: {
    getInstance: () => ({
      addListener: addListenerMock,
      removeListener: removeListenerMock,
    }),
  },
}));

describe('GalleryContainer (mutation scenarios)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanupCallbacks.length = 0;
  });

  afterEach(() => {
    delete (window as typeof window & { __xegCapturedEscapeListener?: unknown })
      .__xegCapturedEscapeListener;
  });

  it('skips registerEscapeListener when onClose is missing', () => {
    const registerEscapeListener = vi.fn();

    GalleryContainer({
      children: <div>noop</div>,
      registerEscapeListener,
    });

    expect(registerEscapeListener).not.toHaveBeenCalled();
    expect(addListenerMock).not.toHaveBeenCalled();
    const capturedListener = (
      window as typeof window & { __xegCapturedEscapeListener?: unknown }
    ).__xegCapturedEscapeListener;
    expect(capturedListener).toBeUndefined();
  });

  it('ignores non-escape key presses for registered listener', () => {
    let capturedListener: (event: KeyboardEvent) => void = () => {
      throw new Error('listener missing');
    };

    addListenerMock.mockImplementation((_target, _type, listener) => {
      capturedListener = listener as (event: KeyboardEvent) => void;
      return 'listener-9';
    });

    const onClose = vi.fn();

    GalleryContainer({
      children: <div>gallery</div>,
      onClose,
    });

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    capturedListener({
      key: 'Space',
      preventDefault,
      stopPropagation,
    } as unknown as KeyboardEvent);

    expect(preventDefault).not.toHaveBeenCalled();
    expect(stopPropagation).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    cleanupCallbacks.forEach(cb => cb());
    expect(removeListenerMock).toHaveBeenCalledWith('listener-9');
  });

  it('calls onClose when Escape key is pressed', () => {
    let capturedListener: (event: KeyboardEvent) => void = () => {};

    addListenerMock.mockImplementation((_target, _type, listener) => {
      capturedListener = listener as (event: KeyboardEvent) => void;
      return 'listener-10';
    });

    const onClose = vi.fn();

    GalleryContainer({ children: <div>gallery</div>, onClose });

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    capturedListener({ key: 'Escape', preventDefault, stopPropagation } as unknown as KeyboardEvent);

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    // caller cleanup should remove listener
    cleanupCallbacks.forEach(cb => cb());
    expect(removeListenerMock).toHaveBeenCalledWith('listener-10');
  });

  it('registerEscapeListener is invoked and stored on window when provided', () => {
    const registerEscapeListener = vi.fn();
    const onClose = vi.fn();

    GalleryContainer({ children: <div>gallery</div>, onClose, registerEscapeListener });

    expect(registerEscapeListener).toHaveBeenCalled();
    const capturedListener = (
      window as typeof window & { __xegCapturedEscapeListener?: unknown }
    ).__xegCapturedEscapeListener;
    expect(typeof capturedListener).toBe('function');
  });
});
