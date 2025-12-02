/**
 * @fileoverview useGalleryKeyboard Hook Tests
 *
 * Tests for keyboard event handling in gallery view
 * Covers: Escape key handling, editable target detection, cleanup
 */

import { EventManager } from '@shared/services/event-manager';

// Mock dependencies
vi.mock('@shared/external/vendors/solid-hooks', () => ({
  createEffect: (fn: () => void) => fn(),
  onCleanup: (fn: () => void) => {
    // Store cleanup for manual calling
    (global as Record<string, unknown>).__cleanupFn = fn;
  },
}));

vi.mock('@shared/services/event-manager', () => ({
  EventManager: {
    getInstance: vi.fn(),
  },
}));

describe('useGalleryKeyboard', () => {
  let mockEventManager: {
    addListener: ReturnType<typeof vi.fn>;
    removeListener: ReturnType<typeof vi.fn>;
  };
  let capturedKeydownHandler: ((event: Event) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();

    mockEventManager = {
      addListener: vi.fn((_target, eventType, handler) => {
        if (eventType === 'keydown') {
          capturedKeydownHandler = handler;
        }
        return 'listener-id-123';
      }),
      removeListener: vi.fn(),
    };

    (EventManager.getInstance as ReturnType<typeof vi.fn>).mockReturnValue(mockEventManager);

    // Reset cleanup function
    (global as Record<string, unknown>).__cleanupFn = null;
  });

  afterEach(() => {
    capturedKeydownHandler = null;
  });

  it('should register keydown listener on mount', async () => {
    const { useGalleryKeyboard } = await import(
      '@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard'
    );
    const onClose = vi.fn();

    useGalleryKeyboard({ onClose });

    expect(mockEventManager.addListener).toHaveBeenCalledWith(
      document,
      'keydown',
      expect.any(Function),
      { capture: true },
      'gallery-keyboard-navigation',
    );
  });

  it('should call onClose when Escape key is pressed', async () => {
    const { useGalleryKeyboard } = await import(
      '@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard'
    );
    const onClose = vi.fn();

    useGalleryKeyboard({ onClose });

    expect(capturedKeydownHandler).not.toBeNull();

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    Object.defineProperty(escapeEvent, 'target', {
      value: document.createElement('div'),
    });

    const preventDefaultSpy = vi.spyOn(escapeEvent, 'preventDefault');
    const stopPropagationSpy = vi.spyOn(escapeEvent, 'stopPropagation');

    capturedKeydownHandler!(escapeEvent);

    expect(onClose).toHaveBeenCalled();
    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(stopPropagationSpy).toHaveBeenCalled();
  });

  it('should not call onClose when Escape is pressed on INPUT element', async () => {
    const { useGalleryKeyboard } = await import(
      '@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard'
    );
    const onClose = vi.fn();

    useGalleryKeyboard({ onClose });

    const inputElement = document.createElement('input');
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    Object.defineProperty(escapeEvent, 'target', {
      value: inputElement,
    });

    capturedKeydownHandler!(escapeEvent);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should not call onClose when Escape is pressed on TEXTAREA element', async () => {
    const { useGalleryKeyboard } = await import(
      '@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard'
    );
    const onClose = vi.fn();

    useGalleryKeyboard({ onClose });

    const textareaElement = document.createElement('textarea');
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    Object.defineProperty(escapeEvent, 'target', {
      value: textareaElement,
    });

    capturedKeydownHandler!(escapeEvent);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should not call onClose when Escape is pressed on contenteditable element', async () => {
    const { useGalleryKeyboard } = await import(
      '@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard'
    );
    const onClose = vi.fn();

    useGalleryKeyboard({ onClose });

    // Create a mock element with isContentEditable property
    const editableDiv = {
      tagName: 'DIV',
      isContentEditable: true, // Boolean property, not string
    };
    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    Object.defineProperty(escapeEvent, 'target', {
      value: editableDiv,
    });

    capturedKeydownHandler!(escapeEvent);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('should not handle non-Escape keys', async () => {
    const { useGalleryKeyboard } = await import(
      '@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard'
    );
    const onClose = vi.fn();

    useGalleryKeyboard({ onClose });

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
    });
    Object.defineProperty(enterEvent, 'target', {
      value: document.createElement('div'),
    });

    const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault');

    capturedKeydownHandler!(enterEvent);

    expect(onClose).not.toHaveBeenCalled();
    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });

  it('should handle null target gracefully', async () => {
    const { useGalleryKeyboard } = await import(
      '@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard'
    );
    const onClose = vi.fn();

    useGalleryKeyboard({ onClose });

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    Object.defineProperty(escapeEvent, 'target', {
      value: null,
    });

    capturedKeydownHandler!(escapeEvent);

    // Should not throw and should call onClose since null target is not editable
    expect(onClose).toHaveBeenCalled();
  });

  it('should cleanup listener on unmount', async () => {
    const { useGalleryKeyboard } = await import(
      '@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard'
    );
    const onClose = vi.fn();

    useGalleryKeyboard({ onClose });

    // Get the cleanup function
    const cleanupFn = (global as Record<string, unknown>).__cleanupFn as (() => void) | null;
    expect(cleanupFn).toBeDefined();

    // Call cleanup
    cleanupFn!();

    expect(mockEventManager.removeListener).toHaveBeenCalledWith('listener-id-123');
  });

  it('should not try to remove listener if listenerId is falsy', async () => {
    mockEventManager.addListener.mockReturnValue(null);

    vi.resetModules();

    const { useGalleryKeyboard } = await import(
      '@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard'
    );
    const onClose = vi.fn();

    useGalleryKeyboard({ onClose });

    const cleanupFn = (global as Record<string, unknown>).__cleanupFn as (() => void) | null;
    cleanupFn!();

    expect(mockEventManager.removeListener).not.toHaveBeenCalled();
  });

  it('should handle element without tagName', async () => {
    const { useGalleryKeyboard } = await import(
      '@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard'
    );
    const onClose = vi.fn();

    useGalleryKeyboard({ onClose });

    const escapeEvent = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });

    // Create a mock target without tagName
    const mockTarget = {
      tagName: undefined,
      isContentEditable: false,
    };
    Object.defineProperty(escapeEvent, 'target', {
      value: mockTarget,
    });

    capturedKeydownHandler!(escapeEvent);

    expect(onClose).toHaveBeenCalled();
  });
});

describe('useGalleryKeyboard - SSR safety', () => {
  const originalDocument = global.document;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    global.document = originalDocument;
  });

  it('should not register listener when document is undefined', async () => {
    // Temporarily remove document
    // @ts-expect-error - intentionally setting to undefined for SSR test
    delete global.document;

    vi.doMock('@shared/external/vendors', () => ({
      getSolid: () => ({
        createEffect: (fn: () => void) => fn(),
        onCleanup: vi.fn(),
      }),
    }));

    const mockEventManager = {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    };

    vi.doMock('@shared/services/event-manager', () => ({
      EventManager: {
        getInstance: () => mockEventManager,
      },
    }));

    const { useGalleryKeyboard } = await import(
      '@features/gallery/components/vertical-gallery-view/hooks/useGalleryKeyboard'
    );
    const onClose = vi.fn();

    useGalleryKeyboard({ onClose });

    expect(mockEventManager.addListener).not.toHaveBeenCalled();
  });
});
