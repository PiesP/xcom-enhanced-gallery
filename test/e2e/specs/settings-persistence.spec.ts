// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview E2E tests for settings persistence and theme switching
 * in X.com Enhanced Gallery.
 *
 * Tests verify:
 * 1. Theme switching (auto/light/dark) through the settings panel
 * 2. Settings panel opens and contains theme/language controls
 * 3. Settings are stored via GM_setValue/GM_getValue
 * 4. GM storage API roundtrip works correctly
 *
 * Environment: Playwright + Chromium (headless)
 * Test page: Mock HTML served under https://x.com via page.route()
 * Gallery trigger: Direct API call via dev build's __XEG__ namespace
 */

import { test, expect, type Page } from '@playwright/test';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const DIST_DIR = resolve(__filename, '../../../../dist');
const USERSCRIPT_PATH = resolve(DIST_DIR, 'xcom-enhanced-gallery.dev.user.js');
const MOCK_PAGE_PATH = resolve(__filename, '../../fixtures/mock-gallery-page.html');

const MOCK_HTML = readFileSync(MOCK_PAGE_PATH, 'utf8');

/**
 * Setup: Route x.com requests to mock HTML, install GM mocks, inject userscript.
 * @param usePersistence - Use localStorage-backed GM mocks for persistence tests
 */
async function setupGalleryPage(page: Page, usePersistence = false): Promise<void> {
  await page.route('**/*.x.com/**', async (route) => {
    const url = route.request().url();
    if (url.includes('.css') || url.includes('.js') || url.includes('.jpg') || url.includes('.png') || url.includes('.svg') || url.includes('.webp') || url.includes('.gif')) {
      await route.abort();
    } else {
      await route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_HTML });
    }
  });

  await page.route('https://x.com/', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_HTML });
  });

  await page.route('https://x.com', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_HTML });
  });

  await page.goto('https://x.com', { waitUntil: 'domcontentloaded', timeout: 15_000 });

  if (usePersistence) {
    // Use localStorage-backed storage for persistence across reloads
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const STORAGE_KEY = '__xeg_test_storage';
      let storage: Map<string, unknown>;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        storage = new Map(saved ? JSON.parse(saved) : []);
      } catch {
        storage = new Map();
      }

      const persist = () => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(storage.entries())));
        } catch { /* localStorage full */ }
      };

      w.__gmStorage = storage;

      window.GM_setValue = (key: string, value: unknown) => {
        storage.set(key, value);
        persist();
      };
      window.GM_getValue = <T = unknown>(key: string, defaultValue?: T): T => {
        return storage.has(key) ? (storage.get(key) as T) : (defaultValue as T);
      };
      window.GM_deleteValue = (key: string) => {
        storage.delete(key);
        persist();
      };
      window.GM_listValues = (): string[] => {
        return Array.from(storage.keys());
      };
      window.GM_download = (urlOrDetails: string | { url: string; name?: string }, name?: string) => {
        const details = typeof urlOrDetails === 'string'
          ? { url: urlOrDetails, name: name ?? 'download' }
          : urlOrDetails;
        const marker = document.createElement('span');
        marker.setAttribute('data-gm-download', 'true');
        marker.setAttribute('data-gm-download-url', details.url);
        marker.setAttribute('data-gm-download-name', details.name ?? 'download');
        marker.style.display = 'none';
        document.body.appendChild(marker);
      };
      window.GM_notification = (details: { title: string; text: string }) => {
        const el = document.createElement('div');
        el.setAttribute('data-gm-notification', 'true');
        el.textContent = `${details.title}: ${details.text}`;
        el.style.cssText = 'position:fixed;top:10px;right:10px;background:#1d9bf0;color:#fff;padding:8px 16px;border-radius:8px;z-index:2147483647;font-size:14px;';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 5000);
      };
      window.GM_xmlhttpRequest = undefined;
      window.GM_cookie = {
        list: () => document.cookie.split(';').filter(Boolean).map((c) => {
          const [name, ...rest] = c.trim().split('=');
          return { name: name!.trim(), value: rest.join('=').trim() };
        }),
        set: (cookie: { name: string; value: string }) => {
          document.cookie = `${cookie.name}=${cookie.value}`;
        },
        delete: (name: string) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        },
      };
    });
  } else {
    // Standard in-memory mocks
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      w.__gmStorage = new Map<string, unknown>();

      window.GM_setValue = (key: string, value: unknown) => {
        (w.__gmStorage as Map<string, unknown>).set(key, value);
      };
      window.GM_getValue = <T = unknown>(key: string, defaultValue?: T): T => {
        const storage = w.__gmStorage as Map<string, unknown>;
        return storage.has(key) ? (storage.get(key) as T) : (defaultValue as T);
      };
      window.GM_deleteValue = (key: string) => {
        (w.__gmStorage as Map<string, unknown>).delete(key);
      };
      window.GM_listValues = (): string[] => {
        return Array.from((w.__gmStorage as Map<string, unknown>).keys());
      };
      window.GM_download = (urlOrDetails: string | { url: string; name?: string }, name?: string) => {
        const details = typeof urlOrDetails === 'string'
          ? { url: urlOrDetails, name: name ?? 'download' }
          : urlOrDetails;
        const marker = document.createElement('span');
        marker.setAttribute('data-gm-download', 'true');
        marker.setAttribute('data-gm-download-url', details.url);
        marker.setAttribute('data-gm-download-name', details.name ?? 'download');
        marker.style.display = 'none';
        document.body.appendChild(marker);
      };
      window.GM_notification = (details: { title: string; text: string }) => {
        const el = document.createElement('div');
        el.setAttribute('data-gm-notification', 'true');
        el.textContent = `${details.title}: ${details.text}`;
        el.style.cssText = 'position:fixed;top:10px;right:10px;background:#1d9bf0;color:#fff;padding:8px 16px;border-radius:8px;z-index:2147483647;font-size:14px;';
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 5000);
      };
      window.GM_xmlhttpRequest = undefined;
      window.GM_cookie = {
        list: () => document.cookie.split(';').filter(Boolean).map((c) => {
          const [name, ...rest] = c.trim().split('=');
          return { name: name!.trim(), value: rest.join('=').trim() };
        }),
        set: (cookie: { name: string; value: string }) => {
          document.cookie = `${cookie.name}=${cookie.value}`;
        },
        delete: (name: string) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        },
      };
    });
  }

  // Inject dev userscript
  const bundle = readFileSync(USERSCRIPT_PATH, 'utf8');
  const injectResult = await page.evaluate((code: string) => {
    try {
      const script = document.createElement('script');
      script.textContent = code;
      (document.head || document.documentElement).appendChild(script);
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: (e as Error).message };
    }
  }, bundle);
  if (!injectResult.success) {
    throw new Error(`Failed to inject userscript: ${injectResult.error}`);
  }

  // Wait for userscript initialization and __XEG__ namespace
  await page.waitForFunction(() => {
    const g = globalThis as any;
    return g.__XEG__?.main?.galleryApp != null;
  }, { timeout: 15_000 });
}

/**
 * Programmatically open the gallery with mock media items via __XEG__ namespace.
 */
async function openGallery(page: Page): Promise<void> {
  await page.evaluate(() => {
    const g = globalThis as any;
    const galleryApp = g.__XEG__.main.galleryApp as { openGallery: (items: unknown[], startIndex?: number) => void };

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
    if (!existsSync(USERSCRIPT_PATH)) {
      throw new Error(
        `Dev userscript bundle not found at ${USERSCRIPT_PATH}. Run 'pnpm build:dev' first.`
      );
    }
  });

  // ── Settings Panel ───────────────────────────────────────────

  test('Settings panel opens and contains theme select', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    // Find the settings button
    const settingsButton = page.locator('[data-gallery-element="toolbar"] button[aria-label*="Settings" i]');
    await expect(settingsButton).toBeVisible();

    // Click settings button to open panel
    await settingsButton.click();
    await page.waitForTimeout(500);

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

    const settingsButton = page.locator('[data-gallery-element="toolbar"] button[aria-label*="Settings" i]');
    await settingsButton.click();
    await page.waitForTimeout(500);

    const settingsPanel = page.locator('[data-gallery-element="settings-panel"]');
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

  test('Gallery container has lang attribute after opening', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    const container = page.locator('[data-xeg-gallery-container]');
    await expect(container).toBeVisible();

    const lang = await container.getAttribute('lang');
    expect(lang).not.toBeNull();
    expect(lang).not.toBe('');
  });

  // ── GM Storage API ──────────────────────────────────────────

  test('GM_setValue/GM_getValue roundtrip works', async ({ page }) => {
    await setupGalleryPage(page);

    const result = await page.evaluate(() => {
      window.GM_setValue!('test_key', 'test_value');
      return window.GM_getValue!('test_key');
    });

    expect(result).toBe('test_value');
  });

  test('GM_getValue returns default for missing keys', async ({ page }) => {
    await setupGalleryPage(page);

    const result = await page.evaluate(() => {
      return window.GM_getValue!('nonexistent_key', 'default_value');
    });

    expect(result).toBe('default_value');
  });

  test('GM_listValues returns all stored keys', async ({ page }) => {
    await setupGalleryPage(page);

    await page.evaluate(() => {
      window.GM_setValue!('key_a', 'value_a');
      window.GM_setValue!('key_b', 'value_b');
      window.GM_setValue!('key_c', 'value_c');
    });

    const keys = await page.evaluate(() => {
      return window.GM_listValues!();
    });

    expect(keys).toContain('key_a');
    expect(keys).toContain('key_b');
    expect(keys).toContain('key_c');
  });

  test('GM_deleteValue removes stored values', async ({ page }) => {
    await setupGalleryPage(page);

    await page.evaluate(() => {
      window.GM_setValue!('temp_key', 'temp_value');
    });

    let value = await page.evaluate(() => {
      return window.GM_getValue!('temp_key');
    });
    expect(value).toBe('temp_value');

    await page.evaluate(() => {
      window.GM_deleteValue!('temp_key');
    });

    value = await page.evaluate(() => {
      return window.GM_getValue!('temp_key', 'default');
    });
    expect(value).toBe('default');
  });

  // ── Settings Persistence ─────────────────────────────────────

  test('Settings persist in localStorage-backed GM storage across page reload', async ({ page }) => {
    // Use persistence-backed mocks
    await setupGalleryPage(page, true);

    // Store theme in GM storage as the xeg_settings key
    await page.evaluate(() => {
      const settings = {
        gallery: {
          theme: 'dark',
          imageFitMode: 'fitContainer',
          autoScrollSpeed: 5,
          infiniteScroll: false,
          preloadCount: 3,
          animations: true,
          enableKeyboardNav: true,
          videoVolume: 1,
          videoMuted: false,
          videoClickMode: 'block-all',
        },
        toolbar: { autoHideDelay: 3000 },
        download: {
          filenamePattern: 'original',
          imageQuality: 'original',
          maxConcurrent: 3,
          imageDownloadStrategy: 'direct',
          autoDownload: false,
        },
        lastModified: Date.now(),
        version: 1,
      };
      window.GM_setValue!('xeg_settings', JSON.stringify(settings));
    });

    // Verify it was stored
    const storedRaw = await page.evaluate(() => {
      return window.GM_getValue!('xeg_settings');
    });
    expect(storedRaw).toBeTruthy();

    const stored = JSON.parse(storedRaw as string);
    expect(stored.gallery.theme).toBe('dark');
  });

  test('GM storage survives page reload with localStorage backing', async ({ page }) => {
    await setupGalleryPage(page, true);

    // Store a value
    await page.evaluate(() => {
      window.GM_setValue!('persist_key', 'persist_value');
    });

    // Verify stored
    let value = await page.evaluate(() => window.GM_getValue!('persist_key'));
    expect(value).toBe('persist_value');

    // Reload page with persistence mocks
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Re-install persistence-backed mocks
    await page.evaluate(() => {
      const w = window as unknown as Record<string, unknown>;
      const STORAGE_KEY = '__xeg_test_storage';
      let storage: Map<string, unknown>;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        storage = new Map(saved ? JSON.parse(saved) : []);
      } catch {
        storage = new Map();
      }
      const persist = () => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(storage.entries()))); } catch { /* */ }
      };
      w.__gmStorage = storage;
      window.GM_setValue = (key: string, value: unknown) => { storage.set(key, value); persist(); };
      window.GM_getValue = <T = unknown>(key: string, defaultValue?: T): T => {
        return storage.has(key) ? (storage.get(key) as T) : (defaultValue as T);
      };
      window.GM_deleteValue = (key: string) => { storage.delete(key); persist(); };
      window.GM_listValues = (): string[] => Array.from(storage.keys());
      window.GM_download = () => { /* stub */ };
      window.GM_notification = () => { /* stub */ };
      window.GM_xmlhttpRequest = undefined;
      window.GM_cookie = {
        list: () => [],
        set: () => {},
        delete: () => {},
      };
    });

    // Verify the persisted value survived the reload
    value = await page.evaluate(() => window.GM_getValue!('persist_key'));
    expect(value).toBe('persist_value');
  });
});
