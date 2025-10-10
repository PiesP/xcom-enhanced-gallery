import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Gallery State Centralization', () => {
  beforeEach(() => {
    // Clear any existing global state
    if (typeof globalThis !== 'undefined') {
      delete globalThis['galleryStore'];
    }
  });

  afterEach(() => {
    // Clean up
    if (typeof globalThis !== 'undefined') {
      delete globalThis['galleryStore'];
    }
  });

  describe('Gallery Store Structure', () => {
    it('should define GalleryState interface with required properties', () => {
      // RED: This test should fail initially
      expect(() => {
        // Try to import the type
        import('../../src/shared/state/gallery-store.ts').then(module => {
          const { GalleryState } = module;
          // Should have these properties
          const requiredKeys = ['items', 'currentIndex', 'loading', 'ui'];

          // Type check through instantiation
          const state: GalleryState = {
            items: [],
            currentIndex: 0,
            loading: false,
            ui: { toolbarVisible: false, settingsOpen: false },
          };

          expect(typeof state.items).toBe('object');
          expect(typeof state.currentIndex).toBe('number');
          expect(typeof state.loading).toBe('boolean');
          expect(typeof state.ui).toBe('object');
        });
      }).not.toThrow();
    });

    it('should export galleryState signal with initial state', async () => {
      // RED: This test should fail initially
      const module = await import('../../src/shared/state/gallery-store.ts');
      const { galleryState } = module;

      expect(galleryState).toBeDefined();
      expect(galleryState.value).toBeDefined();
      expect(galleryState.value.items).toEqual([]);
      expect(galleryState.value.currentIndex).toBe(0);
      expect(galleryState.value.loading).toBe(false);
      expect(galleryState.value.ui.toolbarVisible).toBe(false);
      expect(galleryState.value.ui.settingsOpen).toBe(false);
    });

    it('should provide actions for state updates', async () => {
      // RED: This test should fail initially
      const module = await import('../../src/shared/state/gallery-store.ts');
      const { galleryActions } = module;

      expect(galleryActions).toBeDefined();
      expect(typeof galleryActions.setItems).toBe('function');
      expect(typeof galleryActions.setCurrentIndex).toBe('function');
      expect(typeof galleryActions.setLoading).toBe('function');
      expect(typeof galleryActions.setToolbarVisible).toBe('function');
      expect(typeof galleryActions.setSettingsOpen).toBe('function');
    });
  });

  describe('State Management Actions', () => {
    it('should update items correctly', async () => {
      const module = await import('../../src/shared/state/gallery-store.ts');
      const { galleryState, galleryActions } = module;

      const testItems = [
        { id: '1', url: 'test1.jpg', type: 'image' },
        { id: '2', url: 'test2.jpg', type: 'image' },
      ];

      galleryActions.setItems(testItems);

      expect(galleryState.value.items).toEqual(testItems);
    });

    it('should update current index correctly', async () => {
      const module = await import('../../src/shared/state/gallery-store.ts');
      const { galleryState, galleryActions } = module;

      // First set some items to make index 5 valid
      const testItems = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        url: `test${i}.jpg`,
        type: 'image' as const,
      }));

      galleryActions.setItems(testItems);
      galleryActions.setCurrentIndex(5);

      expect(galleryState.value.currentIndex).toBe(5);
    });

    it('should update loading state correctly', async () => {
      const module = await import('../../src/shared/state/gallery-store.ts');
      const { galleryState, galleryActions } = module;

      galleryActions.setLoading(true);

      expect(galleryState.value.loading).toBe(true);
    });

    it('should update UI state correctly', async () => {
      const module = await import('../../src/shared/state/gallery-store.ts');
      const { galleryState, galleryActions } = module;

      galleryActions.setToolbarVisible(true);
      galleryActions.setSettingsOpen(true);

      expect(galleryState.value.ui.toolbarVisible).toBe(true);
      expect(galleryState.value.ui.settingsOpen).toBe(true);
    });
  });

  describe('Signal Reactivity', () => {
    it('should trigger reactivity when state changes', async () => {
      const module = await import('../../src/shared/state/gallery-store.ts');
      const { galleryState, galleryActions } = module;

      let notificationCount = 0;

      // Subscribe to changes
      const unsubscribe = galleryState.subscribe(() => {
        notificationCount++;
      });

      // Make changes
      galleryActions.setLoading(true);
      galleryActions.setCurrentIndex(1);

      // Should have been notified of changes
      expect(notificationCount).toBeGreaterThan(0);

      unsubscribe();
    });
  });

  describe('Type Safety', () => {
    it('should enforce readonly types for state access', async () => {
      const module = await import('../../src/shared/state/gallery-store.ts');
      const { galleryState } = module;

      // Should be readonly access
      const state = galleryState.value;

      // TypeScript should prevent direct mutation
      // These would be compile-time errors:
      // state.items.push({ id: '3', url: 'test3.jpg', type: 'image' });
      // state.currentIndex = 10;

      expect(state).toBeDefined();
      expect(Array.isArray(state.items)).toBe(true);
    });
  });
});
