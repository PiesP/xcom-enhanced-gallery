// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview E2E tests for settings persistence and theme switching
 * in X.com Enhanced Gallery.
 *
 * Tests verify:
 * 1. Theme switching (auto/light/dark) through the settings panel
 * 2. Settings panel opens and contains theme/language controls
 * 3. A UI-selected setting is persisted and restored after reload
 *
 * Environment: Playwright + Chromium (headless)
 * Test page: Mock HTML served under https://x.com via page.route()
 * Gallery trigger: Direct API call via dev build's __XEG__ namespace
 */

import { existsSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { DEV_USERSCRIPT_PATH, MOCK_GALLERY_HTML, MOCK_IMAGE } from '../fixtures/artifacts';
import { installGMMock } from '../fixtures/gm-mock';
import { injectDevUserscript, waitForGalleryApp } from '../fixtures/userscript-harness';

/**
 * Setup: Route x.com requests to mock HTML, install GM mocks, inject userscript.
 * @param usePersistence - Use localStorage-backed GM mocks for persistence tests
 */
async function setupGalleryPage(
  page: Page,
  usePersistence = false,
  faultableStorage = false,
  seedSettings?: unknown,
  denyInitialRead = false
): Promise<void> {
  await page.route('https://pbs.twimg.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      headers: { 'access-control-allow-origin': '*' },
      body: MOCK_IMAGE,
    });
  });

  await page.route('**/*.x.com/**', async (route) => {
    const url = route.request().url();
    if (
      url.includes('.css') ||
      url.includes('.js') ||
      url.includes('.jpg') ||
      url.includes('.png') ||
      url.includes('.svg') ||
      url.includes('.webp') ||
      url.includes('.gif')
    ) {
      await route.abort();
    } else {
      await route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML });
    }
  });

  await page.route('https://x.com/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML });
  });

  await page.route('https://x.com', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML });
  });

  await page.goto('https://x.com', { waitUntil: 'domcontentloaded', timeout: 15_000 });
  if (seedSettings !== undefined) {
    await page.evaluate((seed) => {
      localStorage.setItem('__xeg_e2e_gm_storage', JSON.stringify([['xeg-app-settings', seed]]));
    }, seedSettings);
  }
  await installGMMock(page, { persistentStorage: usePersistence });
  if (faultableStorage) {
    await page.evaluate((denyRead) => {
      const host = window as typeof window & {
        __xegStorageFaults?: { denyPrimary: boolean; denyFallback: boolean; denyNextRead: number };
      };
      const faults = { denyPrimary: false, denyFallback: false, denyNextRead: denyRead ? 1 : 0 };
      host.__xegStorageFaults = faults;
      const originalSet = window.GM_setValue;
      const originalGet = window.GM_getValue;
      const originalFallbackSet = Storage.prototype.setItem;
      window.GM_getValue = <T>(key: string, defaultValue?: T): T => {
        if (faults.denyNextRead > 0) {
          faults.denyNextRead--;
          throw new Error('controlled initial read denial');
        }
        return originalGet(key, defaultValue);
      };
      window.GM_setValue = (key, value) => {
        if (faults.denyPrimary) {
          throw new Error('controlled primary denial');
        }
        return originalSet(key, value);
      };
      Storage.prototype.setItem = function (key, value) {
        if (faults.denyFallback && key.startsWith('xeg-fallback:')) {
          throw new Error('controlled fallback denial');
        }
        return originalFallbackSet.call(this, key, value);
      };
    }, denyInitialRead);
  }
  await injectDevUserscript(page);
  await waitForGalleryApp(page);
}

async function readDurableTheme(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    const raw = window.GM_getValue?.<string>('xeg-app-settings:field:gallery.theme');
    if (typeof raw !== 'string') {
      return undefined;
    }
    return (JSON.parse(raw) as { value?: string }).value;
  });
}

/**
 * Programmatically open the gallery with mock media items via __XEG__ namespace.
 */
async function openGallery(page: Page): Promise<void> {
  await page.evaluate(() => {
    const g = globalThis as typeof globalThis & {
      __XEG__: {
        main: { galleryApp: { openGallery(items: unknown[], startIndex?: number): void } };
      };
    };
    const galleryApp = g.__XEG__.main.galleryApp as {
      openGallery: (items: unknown[], startIndex?: number) => void;
    };

    const mockItems = [
      {
        id: 'test_img_1',
        url: 'https://pbs.twimg.com/media/Example1.jpg?format=jpg&name=large',
        type: 'image',
        filename: 'Example1.jpg',
        tweetUsername: 'testuser',
        tweetId: '1234567890',
        tweetUrl: 'https://x.com/testuser/status/1234567890',
        originalUrl: 'https://pbs.twimg.com/media/Example1.jpg?format=jpg&name=large',
        thumbnailUrl: 'https://pbs.twimg.com/media/Example1.jpg?format=jpg&name=thumb',
        alt: 'Mountain landscape',
        width: 800,
        height: 600,
        metadata: {},
      },
    ];

    galleryApp.openGallery(mockItems, 0);
  });

  // Wait for gallery container to appear in DOM
  await page.waitForSelector('[data-xeg-gallery-container]', { timeout: 10_000 });
}

test.describe('X.com Enhanced Gallery Settings & Theme', () => {
  test.beforeAll(() => {
    if (!existsSync(DEV_USERSCRIPT_PATH)) {
      throw new Error(
        `Dev userscript bundle not found at ${DEV_USERSCRIPT_PATH}. Run 'pnpm build:dev' first.`
      );
    }
  });

  // ── Settings Panel ───────────────────────────────────────────

  test('Settings panel opens and contains theme select', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    // Find the settings button
    const settingsButton = page.locator(
      '[data-gallery-element="toolbar"] button[aria-label*="Settings" i]'
    );
    await expect(settingsButton).toBeVisible();

    // Click settings button to open panel
    await settingsButton.click();

    // Settings panel should be expanded
    const settingsPanel = page.locator('[data-gallery-element="settings-panel"]');
    await expect(settingsPanel).toBeVisible();

    // Should have a theme select element
    const themeSelect = settingsPanel.locator('select').first();
    await expect(themeSelect).toBeVisible();
  });

  test('Settings panel has both theme and language selects', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    const settingsButton = page.locator(
      '[data-gallery-element="toolbar"] button[aria-label*="Settings" i]'
    );
    await settingsButton.click();

    const settingsPanel = page.locator('[data-gallery-element="settings-panel"]');
    await expect(settingsPanel).toBeVisible();
    const allSelects = settingsPanel.locator('select');
    const selectCount = await allSelects.count();

    // Should have at least 2 selects (theme and language)
    expect(selectCount).toBeGreaterThanOrEqual(2);
  });

  // ── Theme Attributes ─────────────────────────────────────────

  test('Gallery container has data-theme attribute after opening', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    const container = page.locator('[data-xeg-gallery-container]');
    await expect(container).toBeVisible();

    const theme = await container.getAttribute('data-theme');
    expect(theme).not.toBeNull();
    expect(['auto', 'light', 'dark']).toContain(theme);
  });

  test('Gallery design tokens stay scoped to the XEG product container', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await setupGalleryPage(page);
    await openGallery(page);

    const container = page.locator('[data-xeg-gallery-container]');
    const contract = await container.evaluate((container) => {
      const styles = getComputedStyle(container);
      const rootStyles = getComputedStyle(document.documentElement);

      return {
        isDesignScope: container.classList.contains('pp-design'),
        product: container.getAttribute('data-pp-product'),
        theme: container.getAttribute('data-pp-theme'),
        sharedAccent: styles.getPropertyValue('--pp-color-accent').trim(),
        xegAccent: styles.getPropertyValue('--xeg-color-primary').trim(),
        hostSharedAccent: rootStyles.getPropertyValue('--pp-color-accent').trim(),
      };
    });

    expect(contract).toMatchObject({
      isDesignScope: true,
      product: 'xeg',
      theme: 'auto',
      hostSharedAccent: '',
    });
    expect(contract.sharedAccent).not.toBe('');
    expect(contract.xegAccent).toBe(contract.sharedAccent);

    await page.locator('[data-gallery-element="toolbar"] button[aria-label*="Settings" i]').click();
    await page
      .locator('[data-gallery-element="settings-panel"] select')
      .first()
      .selectOption('dark');
    await expect(container).toHaveAttribute('data-theme', 'dark');
    await expect(container).toHaveAttribute('data-pp-theme', 'dark');

    const darkAccent = await container.evaluate((element) => {
      const styles = getComputedStyle(element);
      return {
        shared: styles.getPropertyValue('--pp-color-accent').trim(),
        xeg: styles.getPropertyValue('--xeg-color-primary').trim(),
      };
    });
    expect(darkAccent.shared).not.toBe(contract.sharedAccent);
    expect(darkAccent.xeg).toBe(darkAccent.shared);
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('Gallery container has lang attribute after opening', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    const container = page.locator('[data-xeg-gallery-container]');
    await expect(container).toBeVisible();

    const lang = await container.getAttribute('lang');
    expect(lang).not.toBeNull();
    expect(lang).not.toBe('');
  });

  // ── Settings Persistence ─────────────────────────────────────

  test('theme selected in the product UI persists across page reload', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text());
      }
    });

    await setupGalleryPage(page, true);
    await openGallery(page);

    const settingsButton = page.locator(
      '[data-gallery-element="toolbar"] button[aria-label*="Settings" i]'
    );
    await settingsButton.click();
    const themeSelect = page.locator('[data-gallery-element="settings-panel"] select').first();
    await themeSelect.selectOption('dark');

    const container = page.locator('[data-xeg-gallery-container]');
    await expect(container).toHaveAttribute('data-theme', 'dark');
    await expect.poll(() => readDurableTheme(page)).toBe('dark');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await installGMMock(page, { persistentStorage: true });
    await injectDevUserscript(page);
    await waitForGalleryApp(page);
    await openGallery(page);

    await expect(page.locator('[data-xeg-gallery-container]')).toHaveAttribute(
      'data-theme',
      'dark'
    );
    expect(pageErrors).toEqual([]);
    expect(consoleErrors).toEqual([]);
  });

  test('denied settings stay active in session and the latest value persists after retry and reload', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await setupGalleryPage(page, true, true);
    await openGallery(page);
    await page.locator('[data-gallery-element="toolbar"] button[aria-label*="Settings" i]').click();
    const panel = page.locator('[data-gallery-element="settings-panel"]');
    const theme = panel.locator('select').first();
    const unsaved = panel.locator('[data-xeg-settings-unsaved]');

    await page.evaluate(() => {
      const faults = (
        window as typeof window & {
          __xegStorageFaults?: { denyPrimary: boolean; denyFallback: boolean };
        }
      ).__xegStorageFaults;
      if (!faults) {
        throw new Error('Storage fault fixture unavailable');
      }
      faults.denyPrimary = true;
      faults.denyFallback = true;
    });

    await theme.selectOption('dark');
    await expect(unsaved).toBeVisible();
    await expect(page.locator('[data-xeg-gallery-container]')).toHaveAttribute(
      'data-theme',
      'dark'
    );
    await theme.selectOption('light');
    await expect(page.locator('[data-xeg-gallery-container]')).toHaveAttribute(
      'data-theme',
      'light'
    );
    await expect(unsaved).toBeVisible();
    expect(await readDurableTheme(page)).toBe('dark');

    await page.evaluate(() => {
      const faults = (
        window as typeof window & {
          __xegStorageFaults?: { denyPrimary: boolean; denyFallback: boolean };
        }
      ).__xegStorageFaults;
      if (!faults) {
        throw new Error('Storage fault fixture unavailable');
      }
      faults.denyPrimary = false;
      faults.denyFallback = false;
    });
    await unsaved.getByRole('button').click();
    await expect(unsaved).toHaveCount(0);
    await expect.poll(() => readDurableTheme(page)).toBe('light');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await installGMMock(page, { persistentStorage: true });
    await injectDevUserscript(page);
    await waitForGalleryApp(page);
    await openGallery(page);
    await expect(page.locator('[data-xeg-gallery-container]')).toHaveAttribute(
      'data-theme',
      'light'
    );
    expect(pageErrors).toEqual([]);
  });

  test('an initial read denial preserves untouched preferences after a theme edit', async ({
    page,
  }) => {
    const saved = {
      gallery: { theme: 'dark', imageFitMode: 'fitHeight', videoVolume: 0.8 },
      __schemaHash: '1',
    };
    await setupGalleryPage(
      page,
      true,
      true,
      JSON.stringify({
        __xegStorageEnvelope: 1,
        updatedAt: 1_001,
        value: saved,
      }),
      true
    );
    await openGallery(page);
    await page.locator('[data-gallery-element="toolbar"] button[aria-label*="Settings" i]').click();
    const panel = page.locator('[data-gallery-element="settings-panel"]');
    const unsaved = panel.locator('[data-xeg-settings-unsaved]');
    await expect(unsaved).toBeVisible();
    await panel.locator('select').first().selectOption('light');
    await expect(unsaved).toHaveCount(0);
    await expect(page.locator('[data-xeg-gallery-container]')).toHaveAttribute(
      'data-theme',
      'light'
    );
    await expect.poll(() => readDurableTheme(page)).toBe('light');

    await page.reload({ waitUntil: 'domcontentloaded' });
    await installGMMock(page, { persistentStorage: true });
    await injectDevUserscript(page);
    await waitForGalleryApp(page);
    await openGallery(page);
    await expect(page.locator('[data-xeg-gallery-container]')).toHaveAttribute(
      'data-theme',
      'light'
    );
    const durable = await page.evaluate(() => {
      const raw = window.GM_getValue?.<string>('xeg-app-settings');
      return typeof raw === 'string'
        ? (JSON.parse(raw) as { value: { gallery: { imageFitMode: string; videoVolume: number } } })
            .value.gallery
        : null;
    });
    expect(durable).toMatchObject({ imageFitMode: 'fitHeight', videoVolume: 0.8 });
  });
});
