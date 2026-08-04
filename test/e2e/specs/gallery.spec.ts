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
import { existsSync } from 'node:fs';
import { DEV_USERSCRIPT_PATH, MOCK_GALLERY_HTML, MOCK_IMAGE } from '../fixtures/artifacts';
import { installGMMock } from '../fixtures/gm-mock';
import { injectDevUserscript, waitForGalleryApp } from '../fixtures/userscript-harness';
import { createQuotedVideoTweetResponse } from '../../fixtures/quoted-video-tweet-response';

/**
 * Setup: Install GM_* mocks + navigate to x.com + inject userscript.
 */
async function setupGalleryPage(
  page: Page,
  url: string,
  twitterResponse?: Record<string, unknown>
): Promise<void> {
  await page.route('https://x.com/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML });
  });
  await page.route('https://x.com', async (route) => {
    await route.fulfill({ status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML });
  });

  // Navigate first so we can install mocks on the correct origin
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  await installGMMock(page);

  if (twitterResponse) {
    await page.evaluate((response) => {
      type RequestDetails = {
        url: string;
        onload?: (result: Record<string, unknown>) => void;
      };
      document.cookie = 'ct0=e2e-csrf-token; path=/';
      const w = window as unknown as {
        GM_xmlhttpRequest?: (details: RequestDetails) => { abort: () => void };
        __xegRequestedTweetIds?: string[];
      };
      w.__xegRequestedTweetIds = [];
      w.GM_xmlhttpRequest = (details) => {
        const url = new URL(details.url);
        const variables = JSON.parse(url.searchParams.get('variables') ?? '{}') as {
          tweetId?: string;
        };
        if (variables.tweetId) w.__xegRequestedTweetIds?.push(variables.tweetId);

        queueMicrotask(() => {
          details.onload?.({
            finalUrl: details.url,
            readyState: 4,
            status: 200,
            statusText: 'OK',
            responseHeaders: 'content-type: application/json',
            response,
            responseText: JSON.stringify(response),
            context: null,
          });
        });
        return { abort: () => undefined };
      };
    }, twitterResponse);
  }

  await injectDevUserscript(page);
  await waitForGalleryApp(page);
}

test.describe('X.com Enhanced Gallery E2E', () => {
  test.beforeAll(() => {
    if (!existsSync(DEV_USERSCRIPT_PATH)) {
      throw new Error(
        `Dev userscript bundle not found at ${DEV_USERSCRIPT_PATH}. Run 'pnpm build:dev' first.`
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

  test('userscript does not crash on page navigation', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await setupGalleryPage(page, 'https://x.com');
    await page.goto('https://x.com/explore', { waitUntil: 'domcontentloaded' });

    const xegErrors = errors.filter((e) =>
      e.includes('XEG') || e.includes('xcom-enhanced') || e.includes('gallery')
    );
    expect(xegErrors).toHaveLength(0);
  });

  test('opens the outer quote video when quoted media contains an image', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });

    await page.route('https://pbs.twimg.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: MOCK_IMAGE,
      });
    });
    await page.route('https://video.twimg.com/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'video/mp4', body: '' });
    });

    await setupGalleryPage(
      page,
      'https://x.com/quote_author/status/222',
      createQuotedVideoTweetResponse()
    );

    await page.evaluate(() => {
      const article = document.createElement('article');
      article.setAttribute('data-testid', 'tweet');
      const runtimeVideoUrl = URL.createObjectURL(
        new Blob([new Uint8Array([0, 0, 0, 0])], { type: 'video/mp4' })
      );
      article.innerHTML = `
        <a href="/original_author/status/111/photo/1">
          <img src="https://pbs.twimg.com/media/quoted-image.jpg" alt="Quoted original image">
        </a>
        <a href="/quote_author/status/222/video/1">
          <div data-testid="videoPlayer">
            <video
              src="${runtimeVideoUrl}"
              poster="https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/quote-video.jpg"
              style="display:block;width:640px;height:360px"
            ></video>
          </div>
        </a>
      `;
      document.body.appendChild(article);
    });

    await page.locator('a[href="/quote_author/status/222/video/1"] video').click();

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as unknown as { __xegRequestedTweetIds?: string[] })
              .__xegRequestedTweetIds ?? []
        )
      )
      .toEqual(['222']);

    const gallery = page.locator('[data-xeg-gallery-container]');
    await expect(gallery).toBeVisible();
    await expect(gallery.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '2');

    const items = gallery.locator('[data-gallery-element="item"]');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0).locator('img')).toHaveAttribute('src', /quoted-image\.jpg/);
    await expect(items.nth(1).locator('video')).toHaveAttribute('src', /quote-video\.mp4/);

    await page.keyboard.press('ArrowLeft');
    await expect(gallery.locator('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '1');
    expect(errors).toEqual([]);
  });
});
