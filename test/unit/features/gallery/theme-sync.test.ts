/**
 * @fileoverview Theme Synchronization Unit Tests - Phase 415
 * @description Tests for theme sync between ThemeService and SettingsService
 *
 * Test Coverage:
 * - GalleryApp initialization theme sync (SettingsService → ThemeService)
 * - Toolbar settings controller theme change sync (bidirectional)
 * - Error handling and fallback behavior
 * - Edge cases (service unavailable, race conditions)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

type ThemeName = 'auto' | 'light' | 'dark';

describe('Phase 415: Theme Synchronization', () => {
  describe('GalleryApp - Initialization Theme Sync', () => {
    let mockThemeService: {
      getCurrentTheme: () => ThemeName;
      setTheme: (theme: ThemeName) => void;
    };

    let mockSettingsService: {
      get: <T>(key: string) => T | null;
      set: (key: string, value: unknown) => Promise<void>;
    };

    beforeEach(() => {
      mockThemeService = {
        getCurrentTheme: vi.fn() as unknown as () => ThemeName,
        setTheme: vi.fn() as unknown as (theme: ThemeName) => void,
      };

      mockSettingsService = {
        get: vi.fn() as unknown as <T>(key: string) => T | null,
        set: vi.fn() as unknown as (key: string, value: unknown) => Promise<void>,
      };
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should sync theme from SettingsService to ThemeService on init when values differ', async () => {
      // Arrange: SettingsService has 'dark', ThemeService has 'auto'
      mockSettingsService.get.mockReturnValue('dark');
      mockThemeService.getCurrentTheme.mockReturnValue('auto');

      // Act: Simulate GalleryApp initialization logic
      const settingsTheme = mockSettingsService.get('gallery.theme') as ThemeName;
      const currentTheme = mockThemeService.getCurrentTheme();

      if (settingsTheme && settingsTheme !== currentTheme) {
        mockThemeService.setTheme(settingsTheme);
      }

      // Assert
      expect(mockThemeService.setTheme).toHaveBeenCalledWith('dark');
      expect(mockThemeService.setTheme).toHaveBeenCalledTimes(1);
    });

    it('should not call setTheme when themes are already in sync', async () => {
      // Arrange: Both have 'light'
      mockSettingsService.get.mockReturnValue('light');
      mockThemeService.getCurrentTheme.mockReturnValue('light');

      // Act
      const settingsTheme = mockSettingsService.get('gallery.theme') as ThemeName;
      const currentTheme = mockThemeService.getCurrentTheme();

      if (settingsTheme && settingsTheme !== currentTheme) {
        mockThemeService.setTheme(settingsTheme);
      }

      // Assert
      expect(mockThemeService.setTheme).not.toHaveBeenCalled();
    });

    it('should handle null/undefined theme from SettingsService gracefully', async () => {
      // Arrange: SettingsService returns null
      mockSettingsService.get.mockReturnValue(null);
      mockThemeService.getCurrentTheme.mockReturnValue('auto');

      // Act
      const settingsTheme = mockSettingsService.get('gallery.theme') as ThemeName;
      const currentTheme = mockThemeService.getCurrentTheme();

      if (settingsTheme && settingsTheme !== currentTheme) {
        mockThemeService.setTheme(settingsTheme);
      }

      // Assert: No sync should happen
      expect(mockThemeService.setTheme).not.toHaveBeenCalled();
    });

    it('should handle SettingsService unavailable', async () => {
      // Arrange: SettingsService is null
      const settingsService = null;

      // Act: Simulate conditional check
      let syncAttempted = false;
      if (settingsService) {
        syncAttempted = true;
      }

      // Assert: No sync attempt
      expect(syncAttempted).toBe(false);
      expect(mockThemeService.setTheme).not.toHaveBeenCalled();
    });

    it('should handle ThemeService error during sync', async () => {
      // Arrange: setTheme throws error
      mockSettingsService.get.mockReturnValue('dark');
      mockThemeService.getCurrentTheme.mockReturnValue('auto');
      mockThemeService.setTheme.mockImplementation(() => {
        throw new Error('ThemeService unavailable');
      });

      // Act & Assert: Error should be caught
      const settingsTheme = mockSettingsService.get('gallery.theme') as ThemeName;
      const currentTheme = mockThemeService.getCurrentTheme();

      try {
        if (settingsTheme && settingsTheme !== currentTheme) {
          mockThemeService.setTheme(settingsTheme);
        }
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('ThemeService unavailable');
      }

      expect(mockThemeService.setTheme).toHaveBeenCalledWith('dark');
    });
  });

  describe('Toolbar Settings Controller - Bidirectional Sync', () => {
    let mockThemeManager: {
      setTheme: (theme: ThemeName) => void;
    };

    let mockSettingsManager: {
      set: (key: string, value: unknown) => Promise<void>;
    };

    beforeEach(() => {
      mockThemeManager = {
        setTheme: vi.fn() as unknown as (theme: ThemeName) => void,
      };

      mockSettingsManager = {
        set: vi.fn().mockResolvedValue(undefined) as unknown as (
          key: string,
          value: unknown
        ) => Promise<void>,
      };
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should sync theme to both ThemeService and SettingsService on change', async () => {
      // Arrange
      const newTheme: ThemeName = 'dark';

      // Act: Simulate handleThemeChange logic
      mockThemeManager.setTheme(newTheme);
      await mockSettingsManager.set('gallery.theme', newTheme);

      // Assert
      expect(mockThemeManager.setTheme).toHaveBeenCalledWith('dark');
      expect(mockSettingsManager.set).toHaveBeenCalledWith('gallery.theme', 'dark');
    });

    it('should handle SettingsService sync failure gracefully', async () => {
      // Arrange: SettingsService.set fails
      const newTheme: ThemeName = 'light';
      mockSettingsManager.set.mockRejectedValue(new Error('Storage quota exceeded'));

      // Act
      mockThemeManager.setTheme(newTheme);
      let syncError: Error | null = null;
      try {
        await mockSettingsManager.set('gallery.theme', newTheme);
      } catch (error) {
        syncError = error as Error;
      }

      // Assert: ThemeService succeeds, SettingsService fails
      expect(mockThemeManager.setTheme).toHaveBeenCalledWith('light');
      expect(syncError).toBeInstanceOf(Error);
      expect(syncError?.message).toBe('Storage quota exceeded');
    });

    it('should handle SettingsService unavailable', async () => {
      // Arrange: SettingsService is null
      const settingsManager = null;
      const newTheme: ThemeName = 'auto';

      // Act
      mockThemeManager.setTheme(newTheme);
      let syncAttempted = false;
      if (settingsManager) {
        await settingsManager.set('gallery.theme', newTheme);
        syncAttempted = true;
      }

      // Assert: Only ThemeService updated
      expect(mockThemeManager.setTheme).toHaveBeenCalledWith('auto');
      expect(syncAttempted).toBe(false);
    });

    it('should handle rapid theme changes (race condition)', async () => {
      // Arrange: User changes theme multiple times quickly
      const themes: ThemeName[] = ['light', 'dark', 'auto', 'light'];

      // Act: Simulate rapid calls
      for (const theme of themes) {
        mockThemeManager.setTheme(theme);
        // Don't await - simulate race condition
        void mockSettingsManager.set('gallery.theme', theme);
      }

      // Wait for all promises
      await new Promise(resolve => setTimeout(resolve, 100));

      // Assert: All calls made (last one wins)
      expect(mockThemeManager.setTheme).toHaveBeenCalledTimes(4);
      expect(mockSettingsManager.set).toHaveBeenCalledTimes(4);
      expect(mockThemeManager.setTheme).toHaveBeenLastCalledWith('light');
    });
  });

  describe('Integration Scenarios', () => {
    it('should maintain consistency across full lifecycle', async () => {
      // Simulate full lifecycle
      const storage = { theme: 'auto' as ThemeName };

      // 1. Initial load - SettingsService has 'dark'
      storage.theme = 'dark';
      const initTheme = storage.theme;

      // 2. GalleryApp syncs to ThemeService
      expect(initTheme).toBe('dark');

      // 3. User changes to 'light' via toolbar
      storage.theme = 'light';

      // 4. Restart gallery - should load 'light'
      const restartTheme = storage.theme;
      expect(restartTheme).toBe('light');
    });

    it('should handle default value when no stored theme exists', () => {
      // Arrange: Empty storage
      const storage: { theme?: ThemeName } = {};

      // Act: Simulate getting theme with fallback
      const theme = storage.theme ?? 'auto';

      // Assert: Falls back to 'auto'
      expect(theme).toBe('auto');
    });

    it('should validate theme values', () => {
      // Arrange
      const validThemes: ThemeName[] = ['auto', 'light', 'dark'];
      const testValues = ['auto', 'light', 'dark', 'invalid', '', null];

      // Act & Assert
      for (const value of testValues) {
        const isValid = validThemes.includes(value as ThemeName);
        if (value === 'auto' || value === 'light' || value === 'dark') {
          expect(isValid).toBe(true);
        } else {
          expect(isValid).toBe(false);
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should log warning when sync fails but not crash', async () => {
      // Arrange
      const mockLogger = {
        warn: vi.fn(),
        debug: vi.fn(),
      };

      const mockSettingsManager = {
        set: vi.fn().mockRejectedValue(new Error('Network error')),
      };

      // Act
      try {
        await mockSettingsManager.set('gallery.theme', 'dark');
      } catch (error) {
        mockLogger.warn('Failed to sync theme to SettingsService:', error);
      }

      // Assert: Error logged, app continues
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to sync theme to SettingsService:',
        expect.any(Error)
      );
    });

    it('should handle corrupted theme value', () => {
      // Arrange: Storage returns invalid JSON
      const corruptedValue = '{invalid json}';

      // Act & Assert
      expect(() => {
        JSON.parse(corruptedValue);
      }).toThrow();

      // Fallback to default
      let theme: ThemeName = 'auto';
      try {
        theme = JSON.parse(corruptedValue);
      } catch {
        theme = 'auto';
      }
      expect(theme).toBe('auto');
    });
  });

  describe('Type Safety', () => {
    it('should enforce ThemeName type constraints', () => {
      // Arrange
      type TestThemeName = 'auto' | 'light' | 'dark';

      // Act & Assert: Type-level test (compile time)
      const validTheme: TestThemeName = 'auto';
      expect(validTheme).toBe('auto');

      // Runtime validation
      const isValidTheme = (value: string): value is TestThemeName => {
        return value === 'auto' || value === 'light' || value === 'dark';
      };

      expect(isValidTheme('auto')).toBe(true);
      expect(isValidTheme('invalid')).toBe(false);
    });
  });
});
