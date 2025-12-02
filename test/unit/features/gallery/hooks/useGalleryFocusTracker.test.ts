import { useGalleryFocusTracker } from '@features/gallery/hooks/useGalleryFocusTracker';
import { FocusCoordinator } from '@features/gallery/logic/focus-coordinator';
import { navigateToItem } from '@shared/state/signals/gallery.signals';
import { createRoot, createSignal } from 'solid-js';

// Mock dependencies
const { mockFocusedIndex } = vi.hoisted(() => ({
  mockFocusedIndex: { value: 0 },
}));

vi.mock('@features/gallery/logic/focus-coordinator', () => ({
  FocusCoordinator: vi.fn(),
}));
vi.mock('@shared/state/signals/gallery.signals', () => ({
  gallerySignals: {
    focusedIndex: mockFocusedIndex,
  },
  galleryState: {
    value: { currentIndex: 0 },
  },
  navigateToItem: vi.fn(),
  setFocusedIndex: vi.fn(),
}));

describe('useGalleryFocusTracker', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCoordinator: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup FocusCoordinator mock
    mockCoordinator = {
      registerItem: vi.fn(),
      cleanup: vi.fn(),
      updateFocus: vi.fn(),
    };

    (FocusCoordinator as unknown as ReturnType<typeof vi.fn>).mockImplementation(function (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options: any,
    ) {
      mockCoordinator.options = options;
      return mockCoordinator;
    });
  });

  it('should initialize FocusCoordinator with correct options', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal(null);

      useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      expect(FocusCoordinator).toHaveBeenCalled();
      const calls = (FocusCoordinator as unknown as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const options = calls[0]![0];
      expect(options.container()).toBe(container);
      expect(options.isEnabled()).toBe(false); // Should be false because isScrolling is false and trigger is null

      dispose();
    });
  });

  it('should update global state on auto-focus change', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(true);
      const [lastNavigationTrigger] = createSignal(null);

      useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      // Simulate coordinator callback
      const onFocusChange = mockCoordinator.options.onFocusChange;

      // Trigger auto-focus
      onFocusChange(5, 'auto');

      expect(navigateToItem).toHaveBeenCalledWith(5, 'scroll', 'auto-focus');

      dispose();
    });
  });

  it('should update global state on manual focus change via handleItemFocus', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal(null);

      const { handleItemFocus } = useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      handleItemFocus(3);

      expect(navigateToItem).toHaveBeenCalledWith(3, 'keyboard');

      dispose();
    });
  });

  it('should register items with coordinator', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal(null);

      const { registerItem } = useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      const element = document.createElement('div');
      registerItem(1, element);

      expect(mockCoordinator.registerItem).toHaveBeenCalledWith(1, element);

      dispose();
    });
  });

  it('should delegate registerItem to coordinator', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const element = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal(null);

      const { registerItem } = useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      registerItem(1, element);
      expect(mockCoordinator.registerItem).toHaveBeenCalledWith(1, element);

      dispose();
    });
  });

  it('should delegate forceSync to coordinator updateFocus', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal(null);

      const { forceSync } = useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      forceSync();
      expect(mockCoordinator.updateFocus).toHaveBeenCalled();

      dispose();
    });
  });





  it('should expose the current focused index', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal(null);

      const { focusedIndex } = useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      expect(focusedIndex()).toBe(0);

      dispose();
    });
  });

  it('should pass threshold option to FocusCoordinator', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal(null);

      useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
        threshold: 0.8,
      });

      const options = (FocusCoordinator as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      expect(options.threshold).toBe(0.8);

      dispose();
    });
  });

  it('should navigate to item on auto focus change', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal(null);

      useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      // Simulate auto focus change
      const onFocusChange = mockCoordinator.options.onFocusChange;
      onFocusChange(5, 'auto');

      expect(navigateToItem).toHaveBeenCalledWith(5, 'scroll', 'auto-focus');

      dispose();
    });
  });

  it('should call updateFocus(true) when forceSync is called', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal(null);

      const { forceSync } = useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      forceSync();

      expect(mockCoordinator.updateFocus).toHaveBeenCalledWith(true);

      dispose();
    });
  });
});

describe('useGalleryFocusTracker (mutation coverage)', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockCoordinator: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFocusedIndex.value = 0;

    mockCoordinator = {
      registerItem: vi.fn(),
      cleanup: vi.fn(),
      updateFocus: vi.fn(),
    };

    (FocusCoordinator as unknown as ReturnType<typeof vi.fn>).mockImplementation(function (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      options: any,
    ) {
      mockCoordinator.options = options;
      return mockCoordinator;
    });
  });

  it('should enable tracking when isScrolling is true', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(true);
      const [lastNavigationTrigger] = createSignal<string | null>(null);

      useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      const options = (FocusCoordinator as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      expect(options.isEnabled()).toBe(true);

      dispose();
    });
  });

  it('should enable tracking when lastNavigationTrigger is scroll', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal<string | null>('scroll');

      useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      const options = (FocusCoordinator as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      expect(options.isEnabled()).toBe(true);

      dispose();
    });
  });

  it('should disable tracking when isEnabled is false', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(false);
      const [isScrolling] = createSignal(true);
      const [lastNavigationTrigger] = createSignal<string | null>('scroll');

      useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      const options = (FocusCoordinator as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      expect(options.isEnabled()).toBe(false);

      dispose();
    });
  });

  it('should not navigate when auto focus change has null index', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(true);
      const [lastNavigationTrigger] = createSignal<string | null>(null);

      useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      const onFocusChange = mockCoordinator.options.onFocusChange;
      onFocusChange(null, 'auto');

      expect(navigateToItem).not.toHaveBeenCalled();

      dispose();
    });
  });

  it('should not navigate on manual focus change source', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(true);
      const [lastNavigationTrigger] = createSignal<string | null>(null);

      useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      const onFocusChange = mockCoordinator.options.onFocusChange;
      onFocusChange(5, 'manual');

      expect(navigateToItem).not.toHaveBeenCalled();

      dispose();
    });
  });

  it('should call coordinator cleanup on dispose', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal<string | null>(null);

      useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      dispose();

      expect(mockCoordinator.cleanup).toHaveBeenCalled();
    });
  });

  it('should pass custom rootMargin to FocusCoordinator', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal<string | null>(null);

      useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
        rootMargin: '100px',
      });

      const options = (FocusCoordinator as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      expect(options.rootMargin).toBe('100px');

      dispose();
    });
  });

  it('should use default rootMargin when not provided', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal<string | null>(null);

      useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      const options = (FocusCoordinator as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      expect(options.rootMargin).toBe('0px');

      dispose();
    });
  });

  it('should handle null container gracefully', () => {
    createRoot(dispose => {
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(true);
      const [lastNavigationTrigger] = createSignal<string | null>(null);

      useGalleryFocusTracker({
        container: () => null,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      const options = (FocusCoordinator as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      expect(options.container()).toBe(null);

      dispose();
    });
  });

  it('should accept container as direct value (MaybeAccessor)', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal<string | null>(null);

      useGalleryFocusTracker({
        container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      const options = (FocusCoordinator as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      expect(options.container()).toBe(container);

      dispose();
    });
  });

  it('should accept isEnabled as direct boolean value', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isScrolling] = createSignal(true);
      const [lastNavigationTrigger] = createSignal<string | null>(null);

      useGalleryFocusTracker({
        container: () => container,
        isEnabled: true,
        isScrolling,
        lastNavigationTrigger,
      });

      const options = (FocusCoordinator as unknown as ReturnType<typeof vi.fn>).mock.calls[0]![0];
      expect(options.isEnabled()).toBe(true);

      dispose();
    });
  });

  it('should return focusedIndex from gallerySignals', () => {
    mockFocusedIndex.value = 42;

    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal<string | null>(null);

      const { focusedIndex } = useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      expect(focusedIndex()).toBe(42);

      dispose();
    });
  });

  it('should register null element (to unregister item)', () => {
    createRoot(dispose => {
      const container = document.createElement('div');
      const [isEnabled] = createSignal(true);
      const [isScrolling] = createSignal(false);
      const [lastNavigationTrigger] = createSignal<string | null>(null);

      const { registerItem } = useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        isScrolling,
        lastNavigationTrigger,
      });

      registerItem(1, null);

      expect(mockCoordinator.registerItem).toHaveBeenCalledWith(1, null);

      dispose();
    });
  });
});
