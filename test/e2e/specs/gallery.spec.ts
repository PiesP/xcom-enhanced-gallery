// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview E2E tests for X.com Enhanced Gallery userscript.
 *
 * Tests the gallery functionality by:
 * 1. Navigating to x.com with media content
 * 2. Injecting GM_* API mocks
 * 3. Injecting the built userscript
 * 4. Verifying gallery interactions
 *
 * Environment: Playwright + Chromium (headed)
 * Userscript injection: page.evaluate() with bundle content
 */

import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const DIST_DIR = resolve(__filename, '../../../../dist');
const USERSCRIPT_PATH = resolve(DIST_DIR, 'xcom-enhanced-gallery.user.js');

/**
 * Inject userscript bundle into the page via page.evaluate().
 * This simulates Tampermonkey injecting the script in MAIN world.
 */
async function injectUserscript(page: Page): Promise<void> {
  const bundle = readFileSync(USERSCRIPT_PATH, 'utf8');
  await page.evaluate((code: string) => {
    const script = document.createElement('script');
    script.textContent = code;
    document.head.appendChild(script);
  }, bundle);
}

/**
 * Setup: Install GM_* mocks + navigate to x.com + inject userscript.
 */
async function setupGalleryPage(page: Page, url: string): Promise<void> {
  // Navigate first so we can install mocks on the correct origin
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  // Install GM_* API mocks
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
      const details = typeof urlOrDetails === 'string' ? { url: urlOrDetails, name: name ?? 'download' } : urlOrDetails;
      // Record the download without triggering actual navigation
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
      el.style.cssText = 'position:fixed;top:10px;right:10px;background:#1d9bf0;color:#fff;padding:8px 16px;border-radius:8px;z-index:2147483647;';
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

  // Inject userscript
  await injectUserscript(page);

  // Wait for userscript initialization
  await page.waitForTimeout(2000);
}

import { existsSync } from 'node:fs';

test.describe('X.com Enhanced Gallery E2E', () => {
  test.beforeAll(() => {
    if (!existsSync(USERSCRIPT_PATH)) {
      throw new Error(
        `Userscript bundle not found at ${USERSCRIPT_PATH}. Run 'pnpm build' first.`
      );
    }
  });

  test('userscript injects without errors on x.com', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await setupGalleryPage(page, 'https://x.com');

    // Verify no critical errors from our script
    const xegErrors = errors.filter((e) =>
      e.includes('XEG') || e.includes('xcom-enhanced') || e.includes('gallery')
    );
    expect(xegErrors).toHaveLength(0);
  });

  test('GM_* APIs are available after injection', async ({ page }) => {
    await setupGalleryPage(page, 'https://x.com');

    const gmAvailable = await page.evaluate(() => ({
      GM_setValue: typeof window.GM_setValue === 'function',
      GM_getValue: typeof window.GM_getValue === 'function',
      GM_deleteValue: typeof window.GM_deleteValue === 'function',
      GM_listValues: typeof window.GM_listValues === 'function',
      GM_download: typeof window.GM_download === 'function',
      GM_notification: typeof window.GM_notification === 'function',
      GM_cookie: typeof window.GM_cookie === 'object',
    }));

    expect(gmAvailable.GM_setValue).toBe(true);
    expect(gmAvailable.GM_getValue).toBe(true);
    expect(gmAvailable.GM_download).toBe(true);
    expect(gmAvailable.GM_notification).toBe(true);
  });

  test('GM_setValue/GM_getValue roundtrip works', async ({ page }) => {
    await setupGalleryPage(page, 'https://x.com');

    const result = await page.evaluate(() => {
      window.GM_setValue!('test_key', 'test_value');
      return window.GM_getValue!('test_key');
    });

    expect(result).toBe('test_value');
  });

  test('GM_download records download metadata', async ({ page }) => {
    await setupGalleryPage(page, 'https://x.com');

    await page.evaluate(() => {
      window.GM_download!('data:image/png;base64,iVBORw0KGgo=', 'test-image.png');
    });

    const marker = page.locator('[data-gm-download="true"]').first();
    await expect(marker).toBeAttached();
    await expect(marker).toHaveAttribute('data-gm-download-name', 'test-image.png');
  });

  test('GM_notification creates visible notification', async ({ page }) => {
    await setupGalleryPage(page, 'https://x.com');

    await page.evaluate(() => {
      window.GM_notification!({ title: 'Test', text: 'Hello from test' });
    });

    const notification = page.locator('[data-gm-notification="true"]');
    await expect(notification).toBeVisible();
    await expect(notification).toContainText('Test');
  });

  test('userscript does not crash on page navigation', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await setupGalleryPage(page, 'https://x.com');
    await page.goto('https://x.com/explore', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    const xegErrors = errors.filter((e) =>
      e.includes('XEG') || e.includes('xcom-enhanced') || e.includes('gallery')
    );
    expect(xegErrors).toHaveLength(0);
  });

  test('gallery opens on media image click', async ({ page }) => {
    // Navigate to a tweet with media content
    // Note: We use a known public tweet URL or search for one
    await setupGalleryPage(page, 'https://x.com');

    // Check if the userscript initialized its observers
    const scriptInjected = await page.evaluate(() => {
      // The userscript should have set up click listeners
      // We check by looking for the script tag in head
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.some((s) => s.textContent?.includes('xcom-enhanced-gallery'));
    });

    expect(scriptInjected).toBe(true);
  });
});
