// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview E2E tests for download flow in X.com Enhanced Gallery.
 *
 * Tests verify:
 * 1. Clicking the download button triggers GM_download with correct data
 * 2. Download button is accessible via toolbar
 * 3. Video media keeps its native playback controls
 *
 * Environment: Playwright + Chromium (headless)
 * Test page: Mock HTML served under https://x.com via page.route()
 * Gallery trigger: Direct API call via dev build's __XEG__ namespace
 */

import { test, expect, type Page } from '@playwright/test';
import { existsSync } from 'node:fs';
import { DEV_USERSCRIPT_PATH, MOCK_GALLERY_HTML, MOCK_IMAGE } from '../fixtures/artifacts';
import { installGMMock } from '../fixtures/gm-mock';
import { injectDevUserscript, waitForGalleryApp } from '../fixtures/userscript-harness';

/**
 * Setup: Route x.com requests to mock HTML, install GM mocks, inject userscript.
 */
async function setupGalleryPage(page: Page): Promise<void> {
  await page.route('https://pbs.twimg.com/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/png',
      headers: { 'access-control-allow-origin': '*' },
      body: MOCK_IMAGE,
    });
  });

  // Intercept all x.com requests
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

test.describe('X.com Enhanced Gallery Download Flow', () => {
  test.beforeAll(() => {
    if (!existsSync(DEV_USERSCRIPT_PATH)) {
      throw new Error(
        `Dev userscript bundle not found at ${DEV_USERSCRIPT_PATH}. Run 'pnpm build:dev' first.`
      );
    }
  });

  test('Download button exists in toolbar with accessible label', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    // The download button has aria-label from translation 'tb.dl'
    const toolbar = page.locator('[data-gallery-element="toolbar"]');
    await expect(toolbar).toBeVisible();

    // Find button with aria-label containing Download
    const downloadButton = toolbar.locator('button[aria-label*="Download" i]');
    await expect(downloadButton).toBeVisible();
    await expect(downloadButton).not.toBeDisabled();
  });

  test('Download flow calls GM_download via the orchestrator chain', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    const downloadButton = page.locator('[data-gallery-element="toolbar"] button[aria-label*="Download" i]');
    await expect(downloadButton).toBeVisible();
    await downloadButton.click();

    const marker = page.locator('[data-gm-download="true"]');
    await expect(marker).toHaveCount(1);
    await expect(marker).toHaveAttribute(
      'data-gm-download-url',
      /^https:\/\/pbs\.twimg\.com\/media\/Example1\.jpg(?:\?.*)?$/
    );
    await expect(marker).toHaveAttribute('data-gm-download-name', 'Example1.jpg');
    await expect(page.locator('[data-xeg-gallery-container]')).toBeVisible();
  });

  test('Download button is not disabled when gallery has items', async ({ page }) => {
    await setupGalleryPage(page);
    await openGallery(page);

    const downloadButtons = page.locator(
      '[data-gallery-element="toolbar"] button[aria-label*="Download" i]'
    );
    const btnCount = await downloadButtons.count();
    expect(btnCount).toBeGreaterThan(0);

    for (let i = 0; i < btnCount; i++) {
      const btn = downloadButtons.nth(i);
      const isDisabled = await btn.isDisabled();
      expect(isDisabled).toBe(false);
    }
  });

  test('renders video media with native playback controls', async ({ page }) => {
    await setupGalleryPage(page);

    await page.evaluate(() => {
      const galleryApp = (globalThis as any).__XEG__.main.galleryApp;
      galleryApp.openGallery([
        {
          id: 'test_video_1',
          url: 'https://video.twimg.com/ext_tw_video/example.mp4',
          type: 'video',
          filename: 'example.mp4',
          tweetUsername: 'testuser',
          tweetId: '1234567890',
          tweetUrl: 'https://x.com/testuser/status/1234567890',
          originalUrl: 'https://video.twimg.com/ext_tw_video/example.mp4',
          thumbnailUrl: 'https://pbs.twimg.com/media/example.jpg?format=jpg&name=thumb',
          alt: 'Example video',
          width: 1280,
          height: 720,
          metadata: {},
        },
      ], 0);
    });

    const video = page.locator('[data-xeg-gallery-container] video');
    await expect(video).toBeAttached();
    await expect(video).toHaveAttribute('controls', '');
    await expect(video).toHaveAttribute('aria-label', /Video 1 of 1/i);
    await expect(video).toHaveAttribute('src', /example\.mp4/);
  });
});
