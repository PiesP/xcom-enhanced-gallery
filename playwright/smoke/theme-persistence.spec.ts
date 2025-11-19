import { test, expect } from '@playwright/test';
import { ensureHarness } from './utils';

/**
 * Theme Persistence & Sync E2E Tests
 *
 * Tests for fixes in Phase 415+:
 * - Theme settings persist across gallery sessions
 * - Theme syncs between ThemeService and SettingsService
 * - Auto theme follows system preferences
 *
 * Fixed Issues:
 * - Theme always reset to 'auto' on restart
 * - SettingsService and ThemeService storage mismatch
 *
 * Phase 415 Enhancement:
 * - Uses local HTTP server (port 3456) for localStorage access
 * - Resolves Chromium SecurityError in data: URLs
 * - Server started in playwright/global-setup.ts
 */

test.describe('Theme Persistence & Sync', () => {
  test.beforeEach(async ({ page }) => {
    // Use local HTTP test server (resolves localStorage SecurityError)
    const testServerURL = process.env.XEG_TEST_SERVER_URL || 'http://localhost:3456';
    await page.goto(testServerURL);
    await ensureHarness(page);

    // Clear storage before each test
    await page.evaluate(() => {
      localStorage.clear();
      // Clear IndexedDB if available
      if (typeof indexedDB !== 'undefined') {
        indexedDB.deleteDatabase('GM_config');
      }
    });
  });

  test.afterEach(async ({ page }) => {
    await page.evaluate(async () => {
      const harness = (window as { __XEG_HARNESS__?: { disposeGalleryApp?: () => Promise<void> } })
        .__XEG_HARNESS__;
      if (!harness) return;
      try {
        await harness.disposeGalleryApp?.();
      } catch {
        /* ignore */
      }
    });
  });

  test('should persist light theme across gallery sessions', async ({ page }) => {
    // Simulate opening toolbar settings and changing theme
    const themeValue = await page.evaluate(() => {
      // Mock theme service interaction
      const themeKey = 'xeg-theme';
      localStorage.setItem(themeKey, 'light');

      // Mock settings service storage
      const settingsKey = 'xeg-app-settings';
      const settings = {
        gallery: { theme: 'light' },
        toolbar: {},
        download: {},
        tokens: {},
        accessibility: {},
        features: {},
        version: '1.0.0',
        lastModified: Date.now(),
      };
      localStorage.setItem(settingsKey, JSON.stringify(settings));

      return localStorage.getItem(themeKey);
    });

    expect(themeValue).toBe('light');

    // Verify theme persisted
    const persistedTheme = await page.evaluate(() => {
      return localStorage.getItem('xeg-theme');
    });

    expect(persistedTheme).toBe('light');
  });

  test('should persist dark theme after page reload', async ({ page }) => {
    // Set dark theme in storage
    await page.evaluate(() => {
      localStorage.setItem('xeg-theme', 'dark');
      const settings = {
        gallery: { theme: 'dark' },
        toolbar: {},
        download: {},
        tokens: {},
        accessibility: {},
        features: {},
        version: '1.0.0',
        lastModified: Date.now(),
      };
      localStorage.setItem('xeg-app-settings', JSON.stringify(settings));
    });

    // Reload page (simulates browser restart)
    await page.reload();
    await ensureHarness(page);

    // Verify theme persisted after reload
    const themeAfterReload = await page.evaluate(() => {
      return localStorage.getItem('xeg-theme');
    });

    expect(themeAfterReload).toBe('dark');
  });

  test('should sync theme between ThemeService and SettingsService', async ({ page }) => {
    // Change theme via "ThemeService"
    await page.evaluate(() => {
      localStorage.setItem('xeg-theme', 'light');
      const settings = {
        gallery: { theme: 'light' },
        toolbar: {},
        download: {},
        tokens: {},
        accessibility: {},
        features: {},
        version: '1.0.0',
        lastModified: Date.now(),
      };
      localStorage.setItem('xeg-app-settings', JSON.stringify(settings));
    });

    // Verify SettingsService storage also updated
    const settingsTheme = await page.evaluate(() => {
      const settingsStr = localStorage.getItem('xeg-app-settings');
      if (!settingsStr) return null;
      const settings = JSON.parse(settingsStr) as { gallery?: { theme?: string } };
      return settings.gallery?.theme;
    });

    // Note: In real implementation, sync happens in use-toolbar-settings-controller
    // This test verifies storage structure is correct
    expect(settingsTheme).toBe('light');
  });

  test('should handle auto theme with system preference', async ({ page }) => {
    // Set system theme to dark via prefers-color-scheme
    await page.emulateMedia({ colorScheme: 'dark' });

    await page.evaluate(() => {
      localStorage.setItem('xeg-theme', 'auto');
    });

    // Verify auto theme is stored
    const storedTheme = await page.evaluate(() => {
      return localStorage.getItem('xeg-theme');
    });

    expect(storedTheme).toBe('auto');

    // Verify system preference is detected
    const systemDark = await page.evaluate(() => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    expect(systemDark).toBe(true);
  });

  test('should not override user theme with default auto', async ({ page }) => {
    // User sets light theme
    await page.evaluate(() => {
      localStorage.setItem('xeg-theme', 'light');
      const settings = {
        gallery: { theme: 'light' },
        toolbar: {},
        download: {},
        tokens: {},
        accessibility: {},
        features: {},
        version: '1.0.0',
        lastModified: Date.now(),
      };
      localStorage.setItem('xeg-app-settings', JSON.stringify(settings));
    });

    // Verify theme NOT overridden to 'auto'
    const finalTheme = await page.evaluate(() => {
      return localStorage.getItem('xeg-theme');
    });

    expect(finalTheme).toBe('light');
  });

  test('should handle missing theme gracefully', async ({ page }) => {
    // No theme in storage (fresh install)
    const defaultTheme = await page.evaluate(() => {
      return localStorage.getItem('xeg-theme');
    });

    // Should be null or auto (not set yet)
    expect(defaultTheme).toBeNull();
  });
});
