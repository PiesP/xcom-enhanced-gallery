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

import { test, expect, type Page, type Route } from '@playwright/test';
import { existsSync } from 'node:fs';
import { DEV_USERSCRIPT_PATH, MOCK_GALLERY_HTML } from '../fixtures/artifacts';
import { installGMMock } from '../fixtures/gm-mock';
import { injectDevUserscript, waitForGalleryApp } from '../fixtures/userscript-harness';

interface DeferredActiveImage {
  readonly requested: Promise<void>;
  readonly fulfill: () => Promise<void>;
}

async function deferGalleryImages(page: Page): Promise<DeferredActiveImage> {
  let activeImageRoute: Route | null = null;
  let resolveRequest = (): void => {};
  const requested = new Promise<void>((resolvePromise) => {
    resolveRequest = resolvePromise;
  });

  await page.route('https://pbs.twimg.com/**', async (route) => {
    if (!activeImageRoute && route.request().url().includes('/E1.jpg')) {
      activeImageRoute = route;
      resolveRequest();
      return;
    }

    await route.abort();
  });

  return {
    requested,
    fulfill: async (): Promise<void> => {
      await requested;
      const route = activeImageRoute;
      if (!route) throw new Error('Active gallery image request was not intercepted');
      await route.fulfill({
        status: 200,
        contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" />',
      });
    },
  };
}

async function setupGalleryPage(page: Page): Promise<void> {
  await page.route('**/*.x.com/**', async (route) => {
    const url = route.request().url();
    if (url.includes('.css') || url.includes('.js') || url.includes('.jpg') || url.includes('.png') || url.includes('.svg') || url.includes('.webp') || url.includes('.gif')) {
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

  await installGMMock(page);
  await injectDevUserscript(page);
  await waitForGalleryApp(page);
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

function getPreviousButton(page: Page) {
  return page.getByRole('button', { name: 'Previous' });
}

function getNextButton(page: Page) {
  return page.getByRole('button', { name: 'Next' });
}

const RESPONSIVE_VIEWPORT_WIDTHS = [320, 375, 414, 768, 1024, 1280] as const;

test.describe('X.com Enhanced Gallery Keyboard Navigation', () => {
  test.beforeAll(() => {
    if (!existsSync(DEV_USERSCRIPT_PATH)) {
      throw new Error(`Build dev bundle first: ${DEV_USERSCRIPT_PATH}`);
    }
  });

  test('ArrowRight navigates to next item', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    expect(await getIndex(page)).toBe(0);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => getIndex(page)).toBe(1);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => getIndex(page)).toBe(2);
  });

  test('ArrowLeft navigates to previous item', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    expect(await getIndex(page)).toBe(0);
    // Go forward first, then back
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => getIndex(page)).toBe(1);
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => getIndex(page)).toBe(0);
  });

  test('ArrowDown navigates to next item', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    expect(await getIndex(page)).toBe(0);
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => getIndex(page)).toBe(1);
  });

  test('ArrowUp navigates to previous item', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    // Go forward first, then up
    await page.keyboard.press('ArrowDown');
    await expect.poll(() => getIndex(page)).toBe(1);
    await page.keyboard.press('ArrowUp');
    await expect.poll(() => getIndex(page)).toBe(0);
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
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '1');
  });

  test('ArrowRight at last item is a no-op', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => getIndex(page)).toBe(2);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '3');
  });

  test('toolbar previous/next buttons navigate and expose correct boundary state', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    const previousButton = getPreviousButton(page);
    const nextButton = getNextButton(page);

    await expect(previousButton).toBeDisabled();
    await expect(nextButton).toBeEnabled();
    expect(await getIndex(page)).toBe(0);

    await nextButton.click();
    await expect.poll(() => getIndex(page)).toBe(1);
    await expect(previousButton).toBeEnabled();
    await expect(nextButton).toBeEnabled();

    await nextButton.click();
    await expect.poll(() => getIndex(page)).toBe(2);
    await expect(previousButton).toBeEnabled();
    await expect(nextButton).toBeDisabled();

    await previousButton.click();
    await expect.poll(() => getIndex(page)).toBe(1);
  });

  test('toolbar controls remain fully operable across supported viewport widths', async ({
    page,
  }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    const toolbar = page.locator('[data-gallery-element="toolbar"]');

    for (const width of RESPONSIVE_VIEWPORT_WIDTHS) {
      await test.step(`${width}px viewport`, async () => {
        await page.setViewportSize({ width, height: 800 });

        const clippedControls = await toolbar.evaluate((element) => {
          const toolbarRect = element.getBoundingClientRect();
          const controls = [
            ...element.querySelectorAll<HTMLButtonElement>('button'),
            element.querySelector<HTMLElement>('[role="progressbar"]'),
          ].filter((control): control is HTMLElement => control !== null);

          return controls.flatMap((control) => {
            const rect = control.getBoundingClientRect();
            const isContained =
              rect.left >= toolbarRect.left &&
              rect.right <= toolbarRect.right &&
              rect.top >= toolbarRect.top &&
              rect.bottom <= toolbarRect.bottom &&
              rect.left >= 0 &&
              rect.right <= window.innerWidth &&
              rect.top >= 0 &&
              rect.bottom <= window.innerHeight;

            if (isContained) return [];

            return [
              control.getAttribute('aria-label') ?? control.textContent?.trim() ?? control.tagName,
            ];
          });
        });

        expect(clippedControls).toEqual([]);
      });
    }
  });

  test('settings panel stays reachable in a short narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 240 });
    await setupGalleryPage(page);
    await openGallery(page);

    await page.locator('#settings-button').click();
    const panel = page.locator('[data-gallery-element="settings-panel"]');
    await expect(panel).toBeVisible();

    const layout = await panel.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        viewportHeight: window.innerHeight,
        overflowY: getComputedStyle(element).overflowY,
      };
    });

    expect(layout.bottom).toBeLessThanOrEqual(layout.viewportHeight);
    expect(layout.overflowY).toBe('auto');

    await panel.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await expect(panel.locator('select').last()).toBeInViewport();
  });

  test('toolbar boundaries follow the item currently focused by scrolling', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    const itemsContainer = page.locator('[data-gallery-element="items"]');
    await itemsContainer.hover();
    await page.mouse.wheel(0, 1600);

    const toolbar = page.locator('[data-gallery-element="toolbar"]');
    await expect(toolbar).toHaveAttribute('data-focused-index', '2');
    await expect(getPreviousButton(page)).toBeEnabled();
    await expect(getNextButton(page)).toBeDisabled();

    await getPreviousButton(page).click();
    await expect.poll(() => getIndex(page)).toBe(1);
  });

  test('delayed media load does not override the user scroll position', async ({ page }) => {
    const activeImage = await deferGalleryImages(page);
    await setupGalleryPage(page);
    await openGallery(page);
    await activeImage.requested;

    const itemsContainer = page.locator('[data-gallery-element="items"]');
    await itemsContainer.hover();
    await page.mouse.wheel(0, 500);
    await expect.poll(() => itemsContainer.evaluate((element) => element.scrollTop)).toBe(500);

    // Let the gallery's scroll-idle timer expire before the active media loads.
    await page.waitForTimeout(350);
    const settledScrollTop = await itemsContainer.evaluate((element) => element.scrollTop);
    const toolbar = page.locator('[data-gallery-element="toolbar"]');
    const settledFocusedIndex = await toolbar.getAttribute('data-focused-index');

    await activeImage.fulfill();
    await expect(page.locator('[data-gallery-element="item"][data-index="0"]')).toHaveAttribute(
      'data-media-loaded',
      'true'
    );
    await page.waitForTimeout(300);

    expect(await itemsContainer.evaluate((element) => element.scrollTop)).toBe(settledScrollTop);
    await expect(toolbar).toHaveAttribute('data-focused-index', settledFocusedIndex ?? '');
  });

  test('Escape does not close gallery when editing form fields', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);
    await page.evaluate(() => {
      const ta = document.createElement('textarea');
      ta.id = 'test-textarea';
      document.querySelector('[data-xeg-gallery-container]')?.appendChild(ta);
    });
    await page.locator('#test-textarea').focus();
    expect(await page.evaluate(() => document.activeElement === document.getElementById('test-textarea'))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-xeg-gallery-container]')).toBeVisible();
  });
});
