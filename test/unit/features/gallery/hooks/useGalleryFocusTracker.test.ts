/**
 * @fileoverview Tests for useGalleryFocusTracker hook
 * @description Verifies focus tracking behavior and FocusCoordinator integration
 */

import { createRoot, createSignal } from 'solid-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGalleryFocusTracker } from '../../../../../src/features/gallery/hooks/useGalleryFocusTracker';

const { MockFocusCoordinator } = vi.hoisted(() => {
  const mockFocusCoordinatorInstance = {
    registerItem: vi.fn(),
    cleanup: vi.fn(),
    recompute: vi.fn(),
  };
  return {
    MockFocusCoordinator: vi.fn(function () {
      return mockFocusCoordinatorInstance;
    }),
  };
});

vi.mock('../../../../../src/features/gallery/logic/focus-coordinator', () => ({
  FocusCoordinator: MockFocusCoordinator,
}));

vi.mock('@shared/state/signals/gallery.signals', () => ({
  setFocusedIndex: vi.fn(),
  navigateToItem: vi.fn(),
}));

import { navigateToItem, setFocusedIndex } from '@shared/state/signals/gallery.signals';

interface MockCoordinatorOptions {
  container: () => HTMLElement;
  isEnabled: () => boolean;
  onFocusChange: (index: number, source: 'auto' | 'manual') => void;
}

describe('useGalleryFocusTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getCoordinatorOptions = (): MockCoordinatorOptions => {
    const calls = MockFocusCoordinator.mock.calls as unknown[][];
    return calls[0]![0] as MockCoordinatorOptions;
  };

  it('should initialize FocusCoordinator with correct options', () => {
    createRoot(dispose => {
      const [isEnabled, setIsEnabled] = createSignal(true);
      const container = document.createElement('div');

      useGalleryFocusTracker({
        container: () => container,
        isEnabled,
        getCurrentIndex: () => 0,
      });

      expect(MockFocusCoordinator).toHaveBeenCalledTimes(1);
      const options = getCoordinatorOptions();
      expect(options.container()).toBe(container);

      // Initial state: enabled=true -> should be true
      expect(options.isEnabled()).toBe(true);

      // Disable explicitly
      setIsEnabled(false);
      expect(options.isEnabled()).toBe(false);

      dispose();
    });
  });

  it('should disable FocusCoordinator when manual focus is active', () => {
    createRoot(dispose => {
      const { handleItemFocus, setManualFocus } = useGalleryFocusTracker({
        container: () => document.createElement('div'),
        isEnabled: () => true,
        getCurrentIndex: () => 0,
      });

      const options = getCoordinatorOptions();

      // Initially enabled
      expect(options.isEnabled()).toBe(true);

      // Set manual focus
      handleItemFocus(1);
      expect(options.isEnabled()).toBe(false);

      // Clear manual focus
      setManualFocus(null);
      expect(options.isEnabled()).toBe(true);

      dispose();
    });
  });

  it('should register item with coordinator', () => {
    createRoot(dispose => {
      const { registerItem } = useGalleryFocusTracker({
        container: () => document.createElement('div'),
        isEnabled: () => true,
        getCurrentIndex: () => 0,
      });

      const element = document.createElement('div');
      registerItem(1, element);

      const mock = MockFocusCoordinator as unknown as {
        mock: { results: { value: { registerItem: ReturnType<typeof vi.fn> } }[] };
      };
      const instance = mock.mock.results[0]!.value;
      expect(instance.registerItem).toHaveBeenCalledWith(1, element);

      dispose();
    });
  });

  it('should handle item focus correctly', () => {
    createRoot(dispose => {
      const { handleItemFocus } = useGalleryFocusTracker({
        container: () => document.createElement('div'),
        isEnabled: () => true,
        getCurrentIndex: () => 0,
      });

      handleItemFocus(2);

      expect(setFocusedIndex).toHaveBeenCalledWith(2);

      const options = getCoordinatorOptions();
      expect(options.isEnabled()).toBe(false); // Manual focus active

      dispose();
    });
  });

  it('should handle item blur correctly', () => {
    createRoot(dispose => {
      const { handleItemFocus, handleItemBlur } = useGalleryFocusTracker({
        container: () => document.createElement('div'),
        isEnabled: () => true,
        getCurrentIndex: () => 0,
      });

      // Set manual focus
      handleItemFocus(3);

      const options = getCoordinatorOptions();
      expect(options.isEnabled()).toBe(false);

      // Blur different item - should not clear manual focus
      handleItemBlur(2);
      expect(options.isEnabled()).toBe(false);

      // Blur focused item - should clear manual focus
      handleItemBlur(3);
      expect(options.isEnabled()).toBe(true);

      dispose();
    });
  });

  it('should apply focus after navigation', () => {
    createRoot(dispose => {
      const { applyFocusAfterNavigation } = useGalleryFocusTracker({
        container: () => document.createElement('div'),
        isEnabled: () => true,
        getCurrentIndex: () => 0,
      });

      applyFocusAfterNavigation(4, 'keyboard');

      expect(setFocusedIndex).toHaveBeenCalledWith(4);

      const options = getCoordinatorOptions();
      expect(options.isEnabled()).toBe(false); // Manual focus active

      dispose();
    });
  });

  it('should update focused index when coordinator reports auto change', () => {
    createRoot(dispose => {
      useGalleryFocusTracker({
        container: () => document.createElement('div'),
        isEnabled: () => true,
        getCurrentIndex: () => 0,
      });

      const options = getCoordinatorOptions();

      // Simulate coordinator reporting focus change
      options.onFocusChange(5, 'auto');

      expect(navigateToItem).toHaveBeenCalledWith(5, 'scroll', 'auto-focus');

      dispose();
    });
  });

  it('should ignore focus change when manual focus is active', () => {
    createRoot(dispose => {
      const { handleItemFocus } = useGalleryFocusTracker({
        container: () => document.createElement('div'),
        isEnabled: () => true,
        getCurrentIndex: () => 0,
      });

      // Set manual focus
      handleItemFocus(2);
      vi.mocked(setFocusedIndex).mockClear();

      const options = getCoordinatorOptions();

      // Simulate coordinator reporting focus change
      options.onFocusChange(5, 'auto');

      expect(setFocusedIndex).not.toHaveBeenCalled();

      dispose();
    });
  });

  it('should ignore focus change when source is not auto', () => {
    createRoot(dispose => {
      useGalleryFocusTracker({
        container: () => document.createElement('div'),
        isEnabled: () => true,
        getCurrentIndex: () => 0,
      });

      const options = getCoordinatorOptions();

      // Simulate coordinator reporting focus change from manual source
      options.onFocusChange(5, 'manual');

      expect(setFocusedIndex).not.toHaveBeenCalled();

      dispose();
    });
  });

  it('should call forceSync when recompute is triggered', () => {
    createRoot(dispose => {
      const { forceSync } = useGalleryFocusTracker({
        container: () => document.createElement('div'),
        isEnabled: () => true,
        getCurrentIndex: () => 0,
      });

      const mock = MockFocusCoordinator as unknown as {
        mock: { results: { value: { recompute: ReturnType<typeof vi.fn> } }[] };
      };
      const instance = mock.mock.results[0]!.value;

      forceSync();

      expect(instance.recompute).toHaveBeenCalled();

      dispose();
    });
  });
});
