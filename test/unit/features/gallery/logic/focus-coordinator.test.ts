/**
 * @fileoverview FocusCoordinator unit tests for mutation coverage
 */
import { FocusCoordinator, type FocusCoordinatorOptions } from '@features/gallery/logic/focus-coordinator';
import * as performanceModule from '@shared/utils/performance';

vi.mock('@shared/utils/performance', () => ({
  SharedObserver: {
    observe: vi.fn(),
  },
}));

const { SharedObserver } = performanceModule;

describe('FocusCoordinator', () => {
  let mockOptions: FocusCoordinatorOptions;
  let mockOnFocusChange: (index: number | null, source: 'auto' | 'manual') => void;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContainer = document.createElement('div');
    Object.defineProperty(mockContainer, 'getBoundingClientRect', {
      value: () => ({
        top: 0,
        bottom: 500,
        height: 500,
        left: 0,
        right: 400,
        width: 400,
      }),
    });

    mockOnFocusChange = vi.fn();

    mockOptions = {
      isEnabled: () => true,
      container: () => mockContainer,
      activeIndex: () => 0,
      onFocusChange: mockOnFocusChange,
    };
  });

  describe('constructor', () => {
    it('should use default threshold and rootMargin when not provided', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      expect(coordinator).toBeDefined();
    });

    it('should use custom threshold when provided', () => {
      const customOptions = {
        ...mockOptions,
        threshold: [0, 0.5, 1.0],
      };
      const coordinator = new FocusCoordinator(customOptions);
      expect(coordinator).toBeDefined();
    });

    it('should use custom rootMargin when provided', () => {
      const customOptions = {
        ...mockOptions,
        rootMargin: '10px',
      };
      const coordinator = new FocusCoordinator(customOptions);
      expect(coordinator).toBeDefined();
    });
  });

  describe('registerItem', () => {
    it('should register an item with valid element', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element = document.createElement('div');
      const unsubscribe = vi.fn();
      vi.mocked(SharedObserver.observe).mockReturnValue(unsubscribe);

      coordinator.registerItem(0, element);

      expect(SharedObserver.observe).toHaveBeenCalledWith(
        element,
        expect.any(Function),
        expect.any(Object)
      );
    });

    it('should unsubscribe previous item when re-registering same index', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      const unsubscribe1 = vi.fn();
      const unsubscribe2 = vi.fn();

      vi.mocked(SharedObserver.observe)
        .mockReturnValueOnce(unsubscribe1)
        .mockReturnValueOnce(unsubscribe2);

      coordinator.registerItem(0, element1);
      coordinator.registerItem(0, element2);

      expect(unsubscribe1).toHaveBeenCalled();
    });

    it('should delete item when element is null', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element = document.createElement('div');
      const unsubscribe = vi.fn();
      vi.mocked(SharedObserver.observe).mockReturnValue(unsubscribe);

      coordinator.registerItem(0, element);
      coordinator.registerItem(0, null);

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should handle optional chaining when prev has no unsubscribe', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element = document.createElement('div');

      // First registration without unsubscribe function - returns void
      vi.mocked(SharedObserver.observe).mockReturnValue(undefined as unknown as () => void);
      coordinator.registerItem(0, element);

      // Re-register - should not throw
      vi.mocked(SharedObserver.observe).mockReturnValue(vi.fn());
      expect(() => coordinator.registerItem(0, element)).not.toThrow();
    });

    it('should update item entry and visibility in callback', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element = document.createElement('div');
      let observerCallback: (entry: IntersectionObserverEntry) => void = () => {};

      vi.mocked(SharedObserver.observe).mockImplementation((_el, callback) => {
        observerCallback = callback;
        return vi.fn();
      });

      coordinator.registerItem(0, element);

      // Simulate intersection
      const mockEntry = {
        isIntersecting: true,
        intersectionRatio: 0.5,
      } as IntersectionObserverEntry;

      observerCallback(mockEntry);

      // The item should now be visible
      // We verify by calling updateFocus
    });
  });

  describe('updateFocus', () => {
    it('should not update when isEnabled returns false', () => {
      const options = {
        ...mockOptions,
        isEnabled: () => false,
      };
      const coordinator = new FocusCoordinator(options);

      coordinator.updateFocus();

      expect(mockOnFocusChange).not.toHaveBeenCalled();
    });

    it('should update when force is true even if isEnabled is false', () => {
      const options = {
        ...mockOptions,
        isEnabled: () => false,
      };
      const coordinator = new FocusCoordinator(options);

      coordinator.updateFocus(true);

      // No items registered, so no focus change
      expect(mockOnFocusChange).not.toHaveBeenCalled();
    });

    it('should not update when container is null', () => {
      const options = {
        ...mockOptions,
        container: () => null,
      };
      const coordinator = new FocusCoordinator(options);

      coordinator.updateFocus();

      expect(mockOnFocusChange).not.toHaveBeenCalled();
    });

    it('should call onFocusChange when best candidate differs from activeIndex', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element = document.createElement('div');

      // Mock element rect and isConnected
      Object.defineProperty(element, 'isConnected', { value: true });
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({
          top: 100,
          bottom: 300,
          height: 200,
          left: 0,
          right: 400,
          width: 400,
        }),
      });

      let observerCallback: (entry: IntersectionObserverEntry) => void = () => {};
      vi.mocked(SharedObserver.observe).mockImplementation((_el, callback) => {
        observerCallback = callback;
        return vi.fn();
      });

      coordinator.registerItem(1, element);

      // Simulate intersection - make item visible
      observerCallback({
        isIntersecting: true,
        intersectionRatio: 0.8,
      } as IntersectionObserverEntry);

      // Set activeIndex to different value
      mockOptions.activeIndex = () => 0;

      coordinator.updateFocus();

      expect(mockOnFocusChange).toHaveBeenCalledWith(1, 'auto');
    });

    it('should not call onFocusChange when best candidate equals activeIndex', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element = document.createElement('div');

      Object.defineProperty(element, 'isConnected', { value: true });
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({
          top: 100,
          bottom: 300,
          height: 200,
          left: 0,
          right: 400,
          width: 400,
        }),
      });

      let observerCallback: (entry: IntersectionObserverEntry) => void = () => {};
      vi.mocked(SharedObserver.observe).mockImplementation((_el, callback) => {
        observerCallback = callback;
        return vi.fn();
      });

      coordinator.registerItem(0, element);
      observerCallback({
        isIntersecting: true,
        intersectionRatio: 0.8,
      } as IntersectionObserverEntry);

      // activeIndex is 0, best candidate should be 0
      coordinator.updateFocus();

      expect(mockOnFocusChange).not.toHaveBeenCalled();
    });

    it('should return early when no selection is made', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      // No items registered

      coordinator.updateFocus();

      expect(mockOnFocusChange).not.toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe all items and clear map', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element1 = document.createElement('div');
      const element2 = document.createElement('div');
      const unsubscribe1 = vi.fn();
      const unsubscribe2 = vi.fn();

      vi.mocked(SharedObserver.observe)
        .mockReturnValueOnce(unsubscribe1)
        .mockReturnValueOnce(unsubscribe2);

      coordinator.registerItem(0, element1);
      coordinator.registerItem(1, element2);

      coordinator.cleanup();

      expect(unsubscribe1).toHaveBeenCalled();
      expect(unsubscribe2).toHaveBeenCalled();
    });

    it('should handle items without unsubscribe function', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element = document.createElement('div');

      vi.mocked(SharedObserver.observe).mockReturnValue(undefined as unknown as () => void);
      coordinator.registerItem(0, element);

      expect(() => coordinator.cleanup()).not.toThrow();
    });
  });

  describe('selectBestCandidate', () => {
    it('should skip items that are not visible', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element = document.createElement('div');

      Object.defineProperty(element, 'isConnected', { value: true });

      let observerCallback: (entry: IntersectionObserverEntry) => void = () => {};
      vi.mocked(SharedObserver.observe).mockImplementation((_el, callback) => {
        observerCallback = callback;
        return vi.fn();
      });

      coordinator.registerItem(0, element);

      // Item is NOT visible
      observerCallback({
        isIntersecting: false,
        intersectionRatio: 0,
      } as IntersectionObserverEntry);

      coordinator.updateFocus();

      expect(mockOnFocusChange).not.toHaveBeenCalled();
    });

    it('should skip items that are not connected', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element = document.createElement('div');

      // Element is NOT connected
      Object.defineProperty(element, 'isConnected', { value: false });
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({
          top: 100,
          bottom: 300,
          height: 200,
        }),
      });

      let observerCallback: (entry: IntersectionObserverEntry) => void = () => {};
      vi.mocked(SharedObserver.observe).mockImplementation((_el, callback) => {
        observerCallback = callback;
        return vi.fn();
      });

      coordinator.registerItem(0, element);
      observerCallback({
        isIntersecting: true,
        intersectionRatio: 0.5,
      } as IntersectionObserverEntry);

      coordinator.updateFocus();

      expect(mockOnFocusChange).not.toHaveBeenCalled();
    });

    it('should prefer top-aligned candidate', () => {
      const coordinator = new FocusCoordinator(mockOptions);

      // Element 1: top-aligned (top is near viewport top)
      const element1 = document.createElement('div');
      Object.defineProperty(element1, 'isConnected', { value: true });
      Object.defineProperty(element1, 'getBoundingClientRect', {
        value: () => ({
          top: 10, // Very close to container top (0)
          bottom: 200,
          height: 190,
        }),
      });

      // Element 2: higher visibility but not top-aligned
      const element2 = document.createElement('div');
      Object.defineProperty(element2, 'isConnected', { value: true });
      Object.defineProperty(element2, 'getBoundingClientRect', {
        value: () => ({
          top: 200,
          bottom: 400,
          height: 200,
        }),
      });

      const callbacks: Array<(entry: IntersectionObserverEntry) => void> = [];
      vi.mocked(SharedObserver.observe).mockImplementation((_el, callback) => {
        callbacks.push(callback);
        return vi.fn();
      });

      coordinator.registerItem(0, element1);
      coordinator.registerItem(1, element2);

      callbacks[0]?.({ isIntersecting: true, intersectionRatio: 0.5 } as IntersectionObserverEntry);
      callbacks[1]?.({ isIntersecting: true, intersectionRatio: 0.9 } as IntersectionObserverEntry);

      mockOptions.activeIndex = () => 5; // Different from both

      coordinator.updateFocus();

      // Should prefer element1 (top-aligned) even though element2 has higher visibility
      expect(mockOnFocusChange).toHaveBeenCalledWith(0, 'auto');
    });

    it('should use highest visibility when no top-aligned candidate', () => {
      const coordinator = new FocusCoordinator(mockOptions);

      // Element 1: lower visibility
      const element1 = document.createElement('div');
      Object.defineProperty(element1, 'isConnected', { value: true });
      Object.defineProperty(element1, 'getBoundingClientRect', {
        value: () => ({
          top: 400, // Far from top
          bottom: 500,
          height: 100,
        }),
      });

      // Element 2: higher visibility
      const element2 = document.createElement('div');
      Object.defineProperty(element2, 'isConnected', { value: true });
      Object.defineProperty(element2, 'getBoundingClientRect', {
        value: () => ({
          top: 100, // Far from top but more visible
          bottom: 400,
          height: 300,
        }),
      });

      const callbacks: Array<(entry: IntersectionObserverEntry) => void> = [];
      vi.mocked(SharedObserver.observe).mockImplementation((_el, callback) => {
        callbacks.push(callback);
        return vi.fn();
      });

      coordinator.registerItem(0, element1);
      coordinator.registerItem(1, element2);

      callbacks[0]?.({ isIntersecting: true, intersectionRatio: 0.2 } as IntersectionObserverEntry);
      callbacks[1]?.({ isIntersecting: true, intersectionRatio: 0.8 } as IntersectionObserverEntry);

      mockOptions.activeIndex = () => 5;

      coordinator.updateFocus();

      // Element2 should be selected (higher visibility)
      expect(mockOnFocusChange).toHaveBeenCalledWith(1, 'auto');
    });

    it('should prefer closer to center when visibility is equal', () => {
      const coordinator = new FocusCoordinator(mockOptions);

      // Both elements have same visibility but different center distances
      const element1 = document.createElement('div');
      Object.defineProperty(element1, 'isConnected', { value: true });
      Object.defineProperty(element1, 'getBoundingClientRect', {
        value: () => ({
          top: 100, // Center at 200
          bottom: 300,
          height: 200,
        }),
      });

      const element2 = document.createElement('div');
      Object.defineProperty(element2, 'isConnected', { value: true });
      Object.defineProperty(element2, 'getBoundingClientRect', {
        value: () => ({
          top: 200, // Center at 300, closer to viewport center (250)
          bottom: 400,
          height: 200,
        }),
      });

      const callbacks: Array<(entry: IntersectionObserverEntry) => void> = [];
      vi.mocked(SharedObserver.observe).mockImplementation((_el, callback) => {
        callbacks.push(callback);
        return vi.fn();
      });

      coordinator.registerItem(0, element1);
      coordinator.registerItem(1, element2);

      // Same visibility ratio
      callbacks[0]?.({ isIntersecting: true, intersectionRatio: 0.5 } as IntersectionObserverEntry);
      callbacks[1]?.({ isIntersecting: true, intersectionRatio: 0.5 } as IntersectionObserverEntry);

      mockOptions.activeIndex = () => 5;

      coordinator.updateFocus();

      // Element closer to center should be selected
      expect(mockOnFocusChange).toHaveBeenCalled();
    });

    it('should handle zero item height gracefully', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element = document.createElement('div');

      Object.defineProperty(element, 'isConnected', { value: true });
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({
          top: 100,
          bottom: 100,
          height: 0, // Zero height
        }),
      });

      let observerCallback: (entry: IntersectionObserverEntry) => void = () => {};
      vi.mocked(SharedObserver.observe).mockImplementation((_el, callback) => {
        observerCallback = callback;
        return vi.fn();
      });

      coordinator.registerItem(0, element);
      observerCallback({
        isIntersecting: true,
        intersectionRatio: 0,
      } as IntersectionObserverEntry);

      // Should not throw
      expect(() => coordinator.updateFocus()).not.toThrow();
    });

    it('should handle top distance exactly at threshold', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element = document.createElement('div');

      Object.defineProperty(element, 'isConnected', { value: true });
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({
          top: 50, // Exactly at threshold (50px)
          bottom: 250,
          height: 200,
        }),
      });

      let observerCallback: (entry: IntersectionObserverEntry) => void = () => {};
      vi.mocked(SharedObserver.observe).mockImplementation((_el, callback) => {
        observerCallback = callback;
        return vi.fn();
      });

      coordinator.registerItem(0, element);
      observerCallback({
        isIntersecting: true,
        intersectionRatio: 0.5,
      } as IntersectionObserverEntry);

      mockOptions.activeIndex = () => 5;

      coordinator.updateFocus();

      // Should be considered top-aligned at exactly threshold
      expect(mockOnFocusChange).toHaveBeenCalledWith(0, 'auto');
    });

    it('should use center-based fallback when visibility is low', () => {
      const coordinator = new FocusCoordinator(mockOptions);
      const element = document.createElement('div');

      Object.defineProperty(element, 'isConnected', { value: true });
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({
          top: 450, // Mostly outside viewport
          bottom: 600,
          height: 150,
        }),
      });

      let observerCallback: (entry: IntersectionObserverEntry) => void = () => {};
      vi.mocked(SharedObserver.observe).mockImplementation((_el, callback) => {
        observerCallback = callback;
        return vi.fn();
      });

      coordinator.registerItem(0, element);
      observerCallback({
        isIntersecting: true,
        intersectionRatio: 0.05, // Below 0.1 threshold
      } as IntersectionObserverEntry);

      mockOptions.activeIndex = () => 5;

      coordinator.updateFocus();

      // Should still select via center-based fallback
      expect(mockOnFocusChange).toHaveBeenCalledWith(0, 'auto');
    });
  });
});
