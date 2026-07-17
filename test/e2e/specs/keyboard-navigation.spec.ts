// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview E2E tests for keyboard navigation in X.com Enhanced Gallery.
 *
 * Tests verify:
 * 1. ArrowRight navigates to next item
 * 2. ArrowLeft navigates to previous item (via ArrowRight then ArrowLeft)
 * 3. ArrowDown navigates to next item
 * 4. ArrowUp navigates to previous item (via ArrowDown then ArrowUp)
 * 5. Escape closes the gallery
 * 6. ArrowLeft at first item is a no-op
 * 7. ArrowRight at last item is a no-op
 * 8. Escape does not close gallery when editing form fields
 *
 * Environment: Playwright + Chromium (headless)
 * Test page: Mock HTML served under https://x.com via page.route()
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

async function setupGalleryPage(page: Page): Promise<void> {
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

  // Install GM_* API mocks
  await page.evaluate(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__gmStorage = new Map<string, unknown>();
    window.GM_setValue = (key: string, value: unknown) => { (w.__gmStorage as Map<string, unknown>).set(key, value); };
    window.GM_getValue = <T = unknown>(key: string, defaultValue?: T): T => {
      const s = w.__gmStorage as Map<string, unknown>;
      return s.has(key) ? (s.get(key) as T) : (defaultValue as T);
    };
    window.GM_deleteValue = (key: string) => { (w.__gmStorage as Map<string, unknown>).delete(key); };
    window.GM_listValues = (): string[] => Array.from((w.__gmStorage as Map<string, unknown>).keys());
    window.GM_download = (urlOrDetails: string | { url: string; name?: string }, name?: string) => {
      const d = typeof urlOrDetails === 'string' ? { url: urlOrDetails, name: name ?? 'download' } : urlOrDetails;
      const m = document.createElement('span');
      m.setAttribute('data-gm-download', 'true');
      m.setAttribute('data-gm-download-url', d.url);
      m.setAttribute('data-gm-download-name', d.name ?? 'download');
      m.style.display = 'none';
      document.body.appendChild(m);
    };
    window.GM_notification = (details: { title: string; text: string }) => {
      const e = document.createElement('div');
      e.setAttribute('data-gm-notification', 'true');
      e.textContent = `${details.title}: ${details.text}`;
      e.style.cssText = 'position:fixed;top:10px;right:10px;background:#1d9bf0;color:#fff;padding:8px 16px;border-radius:8px;z-index:2147483647;font-size:14px;';
      document.body.appendChild(e);
      setTimeout(() => e.remove(), 5000);
    };
    window.GM_xmlhttpRequest = undefined;
    window.GM_cookie = {
      list: () => document.cookie.split(';').filter(Boolean).map((c) => { const [n, ...r] = c.trim().split('='); return { name: n!.trim(), value: r.join('=').trim() }; }),
      set: (cookie: { name: string; value: string }) => { document.cookie = `${cookie.name}=${cookie.value}`; },
      delete: (name: string) => { document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT`; },
    };
  });

  const bundle = readFileSync(USERSCRIPT_PATH, 'utf8');
  const result = await page.evaluate((code: string) => {
    try { const s = document.createElement('script'); s.textContent = code; (document.head || document.documentElement).appendChild(s); return { success: true }; }
    catch (e: unknown) { return { success: false, error: (e as Error).message }; }
  }, bundle);
  if (!result.success) throw new Error(`Failed to inject userscript: ${result.error}`);

  await page.waitForFunction(() => { const g = globalThis as any; return g.__XEG__?.main?.galleryApp != null; }, { timeout: 15_000 });
}

async function openGallery(page: Page): Promise<void> {
  await page.evaluate(() => {
    const g = globalThis as any;
    g.__XEG__.main.galleryApp.openGallery([
      { id: 'img_1', url: 'https://pbs.twimg.com/media/E1.jpg?format=jpg&name=large', type: 'image', filename: 'E1.jpg', tweetUsername: 'u', tweetId: '1', tweetUrl: 'https://x.com/u/1', originalUrl: 'https://pbs.twimg.com/media/E1.jpg?format=jpg&name=large', thumbnailUrl: 'https://pbs.twimg.com/media/E1.jpg?format=jpg&name=thumb', alt: 'A', width: 800, height: 600, metadata: {} },
      { id: 'img_2', url: 'https://pbs.twimg.com/media/E2.jpg?format=jpg&name=large', type: 'image', filename: 'E2.jpg', tweetUsername: 'u', tweetId: '1', tweetUrl: 'https://x.com/u/1', originalUrl: 'https://pbs.twimg.com/media/E2.jpg?format=jpg&name=large', thumbnailUrl: 'https://pbs.twimg.com/media/E2.jpg?format=jpg&name=thumb', alt: 'B', width: 800, height: 600, metadata: {} },
      { id: 'img_3', url: 'https://pbs.twimg.com/media/E3.jpg?format=jpg&name=large', type: 'image', filename: 'E3.jpg', tweetUsername: 'u', tweetId: '1', tweetUrl: 'https://x.com/u/1', originalUrl: 'https://pbs.twimg.com/media/E3.jpg?format=jpg&name=large', thumbnailUrl: 'https://pbs.twimg.com/media/E3.jpg?format=jpg&name=thumb', alt: 'C', width: 800, height: 600, metadata: {} },
    ], 0);
  });
  await page.waitForSelector('[data-xeg-gallery-container]', { timeout: 10_000 });
}

async function getIndex(page: Page): Promise<number> {
  const v = await page.locator('[role="progressbar"]').getAttribute('aria-valuenow');
  return v ? parseInt(v, 10) - 1 : -1;
}

test.describe('X.com Enhanced Gallery Keyboard Navigation', () => {
  test.beforeAll(() => {
    if (!existsSync(USERSCRIPT_PATH)) throw new Error(`Build dev bundle first: ${USERSCRIPT_PATH}`);
  });

  test('ArrowRight navigates to next item', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    expect(await getIndex(page)).toBe(0);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    expect(await getIndex(page)).toBe(1);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    expect(await getIndex(page)).toBe(2);
  });

  test('ArrowLeft navigates to previous item', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    expect(await getIndex(page)).toBe(0);
    // Go forward first, then back
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    expect(await getIndex(page)).toBe(1);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);
    expect(await getIndex(page)).toBe(0);
  });

  test('ArrowDown navigates to next item', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    expect(await getIndex(page)).toBe(0);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    expect(await getIndex(page)).toBe(1);
  });

  test('ArrowUp navigates to previous item', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    // Go forward first, then up
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(500);
    expect(await getIndex(page)).toBe(1);
    await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(500);
    expect(await getIndex(page)).toBe(0);
  });

  test('Escape closes the gallery', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    await expect(page.locator('[data-xeg-gallery-container]')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForSelector('[data-xeg-gallery-container]', { state: 'detached', timeout: 10_000 });
    expect(await page.evaluate(() => !document.querySelector('[data-xeg-gallery-container]'))).toBe(true);
  });

  test('ArrowLeft at first item is a no-op', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    expect(await getIndex(page)).toBe(0);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(500);
    expect(await getIndex(page)).toBe(0);
  });

  test('ArrowRight at last item is a no-op', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    expect(await getIndex(page)).toBe(2);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    expect(await getIndex(page)).toBe(2);
  });

  test('Escape does not close gallery when editing form fields', async ({ page }) => {
    await setupGalleryPage(page);
    await page.evaluate(() => {
      const ta = document.createElement('textarea');
      ta.id = 'test-textarea';
      document.body.appendChild(ta);
    });
    await openGallery(page);
    await page.locator('#test-textarea').focus();
    expect(await page.evaluate(() => document.activeElement === document.getElementById('test-textarea'))).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => !!document.querySelector('[data-xeg-gallery-container]'))).toBe(true);
  });
});
