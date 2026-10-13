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
 * Environment: Playwright + Chromium, with a startup smoke test in Firefox and WebKit
 * Userscript injection: page.evaluate() with bundle content
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { INTERLEAVED_DOM, STATUS_TILE_DOM } from '../../fixtures/issue-217-dom';
import { createMixedOwnerVideoResponse } from '../../fixtures/mixed-owner-video-response';
import { createQuotedVideoTweetResponse } from '../../fixtures/quoted-video-tweet-response';
import { unanchoredVideoPreview } from '../../fixtures/unanchored-video-preview';
import { DEV_USERSCRIPT_PATH, MOCK_GALLERY_HTML, MOCK_IMAGE } from '../fixtures/artifacts';
import { installGMMock } from '../fixtures/gm-mock';
import { injectDevUserscript, waitForGalleryApp } from '../fixtures/userscript-harness';

/**
 * Setup: Install GM_* mocks + navigate to x.com + inject userscript.
 */
async function setupGalleryPage(
  page: Page,
  url: string,
  twitterResponse?: Record<string, unknown>,
  apiStatus = 200,
  deferApi = false,
  preloadCount?: number
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

  if (preloadCount !== undefined) {
    await page.evaluate((count) => {
      window.GM_setValue('xeg-app-settings', { gallery: { preloadCount: count } });
    }, preloadCount);
  }

  if (twitterResponse) {
    await page.evaluate(
      ({ response, apiStatus, deferApi }) => {
        type RequestDetails = {
          url: string;
          onload?: (result: Record<string, unknown>) => void;
        };
        // biome-ignore lint/suspicious/noDocumentCookie: Controlled fixture cookie setup or reset stays isolated from live authentication.
        document.cookie = 'ct0=e2e-csrf-token; path=/';
        const w = window as unknown as {
          GM_xmlhttpRequest?: (details: RequestDetails) => { abort: () => void };
          __xegRequestedTweetIds?: string[];
          __xegReleaseApi?: () => void;
        };
        w.__xegRequestedTweetIds = [];
        const fixtureMediaRequest = w.GM_xmlhttpRequest;
        w.GM_xmlhttpRequest = (details) => {
          const url = new URL(details.url);
          const variables = JSON.parse(url.searchParams.get('variables') ?? '{}') as {
            tweetId?: string;
          };
          if (!variables.tweetId) {
            return fixtureMediaRequest?.(details) ?? { abort: () => undefined };
          }
          w.__xegRequestedTweetIds?.push(variables.tweetId);

          const respond = (): void => {
            details.onload?.({
              finalUrl: details.url,
              readyState: 4,
              status: apiStatus,
              statusText: 'OK',
              responseHeaders: 'content-type: application/json',
              response,
              responseText: JSON.stringify(response),
              context: null,
            });
          };
          if (deferApi) {
            w.__xegReleaseApi = respond;
          } else {
            queueMicrotask(respond);
          }
          return { abort: () => undefined };
        };
      },
      { response: twitterResponse, apiStatus, deferApi }
    );
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

  test('keeps distant video bodies deferred at preloadCount 20 and plays the selected item', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 800, height: 600 });
    const body = readFileSync(resolve(import.meta.dirname, '../fixtures/installed-quote-one.mp4'));
    const mediaRequests = new Map<string, number>();
    await page.route('https://pbs.twimg.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: MOCK_IMAGE })
    );
    await page.route('https://video.twimg.com/**', (route) => {
      const url = route.request().url();
      mediaRequests.set(url, (mediaRequests.get(url) ?? 0) + 1);
      return route.fulfill({ status: 200, contentType: 'video/mp4', body });
    });
    await setupGalleryPage(page, 'https://x.com/author/status/222', undefined, 200, false, 20);
    const urls = Array.from(
      { length: 6 },
      (_, index) => `https://video.twimg.com/ext_tw_video/222/pu/vid/gallery-${index}.mp4`
    );
    await page.evaluate((sources) => {
      const app = (
        globalThis as unknown as {
          __XEG__: {
            main: { galleryApp: { openGallery: (items: unknown[], index: number) => void } };
          };
        }
      ).__XEG__.main.galleryApp;
      app.openGallery(
        sources.map((url, index) => ({
          id: `222_api_${index}`,
          type: 'video',
          url,
          downloadSource: { url, quality: 'best-mp4', provenance: 'api' },
          width: 640,
          height: 360,
          thumbnailUrl: `https://pbs.twimg.com/ext_tw_video_thumb/222/pu/img/poster-${index}.jpg`,
        })),
        0
      );
    }, urls);
    const gallery = page.locator('[data-xeg-gallery-container]');
    const rows = gallery.locator('[data-gallery-element="item"]');
    await expect(rows).toHaveCount(6);
    await expect(rows.nth(0).locator('video')).toHaveAttribute('src', urls[0]!);
    await expect(rows.nth(5)).toHaveAttribute('data-media-display-url', urls[5]!);
    const distantIndices = await rows.evaluateAll((elements) =>
      elements.flatMap((row, index) =>
        row.getBoundingClientRect().top >= window.innerHeight * 2 ? [index] : []
      )
    );
    expect(distantIndices.length).toBeGreaterThanOrEqual(2);
    expect(distantIndices).toContain(5);
    await page.waitForTimeout(300); // Observe the distant boundary after observer delivery.
    for (const index of distantIndices) {
      await expect(rows.nth(index)).toHaveAttribute('data-video-admitted', 'false');
      await expect(rows.nth(index).locator('video')).not.toHaveAttribute('src', /.+/);
      expect(mediaRequests.get(urls[index]!) ?? 0).toBe(0);
    }

    const playback = rows.nth(0).locator('video');
    await playback.evaluate(async (element) => {
      const video = element as HTMLVideoElement;
      video.muted = true;
      await video.play();
    });
    await expect
      .poll(() =>
        playback.evaluate((element) => {
          const video = element as HTMLVideoElement;
          return {
            progressed: video.currentTime > 0,
            width: video.videoWidth,
            height: video.videoHeight,
            error: video.error?.code ?? null,
          };
        })
      )
      .toMatchObject({
        progressed: true,
        width: expect.any(Number),
        height: expect.any(Number),
        error: null,
      });
    expect(
      await playback.evaluate((element) => (element as HTMLVideoElement).videoWidth)
    ).toBeGreaterThan(0);
    expect(
      await playback.evaluate((element) => (element as HTMLVideoElement).videoHeight)
    ).toBeGreaterThan(0);

    // Focus is a direct navigation path. It attaches the source synchronously,
    // before the shared observer can deliver a new intersection entry.
    const focusResult = await rows
      .nth(5)
      .locator('video')
      .evaluate((element) => {
        const video = element as HTMLVideoElement;
        video.focus({ preventScroll: true });
        return video.getAttribute('src');
      });
    expect(focusResult).toBe(urls[5]);
    await expect.poll(() => mediaRequests.get(urls[5]!) ?? 0).toBeGreaterThan(0);
    await expect(rows.nth(5)).toHaveAttribute('data-media-display-url', urls[5]!);
    await expect(rows.nth(5)).toHaveAttribute('data-video-admitted', 'true');
    await page.keyboard.press('Escape');
    await expect(gallery).toHaveCount(0);
  });

  for (const replaceSource of [false, true]) {
    test(`delayed HTTP failure preserves image identity with a retained background: replaced=${replaceSource}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('https://pbs.twimg.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'image/png', body: MOCK_IMAGE })
      );
      await setupGalleryPage(page, 'https://x.com/author/status/222', {}, 503, true);
      await page.evaluate(() => {
        document.querySelector('main')!.innerHTML = `<article data-testid="tweet">
          <a role="link" href="/author/status/222"><time>Fixture permalink</time></a>
          <div data-testid="tweetPhoto" style="background-image:url(https://pbs.twimg.com/media/identity-A.jpg)">
            <img id="identity-target" src="https://pbs.twimg.com/media/identity-A.jpg" width="320" height="200">
          </div>
        </article>`;
        // Control source selection explicitly instead of relying on image loading races.
        Object.defineProperty(document.querySelector('#identity-target'), 'currentSrc', {
          get: () => '',
        });
      });
      await page.locator('#identity-target').click();
      await expect
        .poll(() =>
          page.evaluate(
            () => (window as unknown as { __xegRequestedTweetIds: string[] }).__xegRequestedTweetIds
          )
        )
        .toEqual(['222']);
      await page.evaluate((replace) => {
        if (replace) {
          document.querySelector<HTMLImageElement>('#identity-target')!.src =
            'https://pbs.twimg.com/media/identity-B.jpg';
        }
        const host = window as unknown as { __xegReleaseApi?: () => void };
        if (!host.__xegReleaseApi) {
          throw new Error('Deferred HTTP request was not observed');
        }
        host.__xegReleaseApi();
      }, replaceSource);
      const gallery = page.locator('[data-xeg-gallery-container]');
      if (replaceSource) {
        await expect(gallery).toHaveCount(0);
        await expect(page.locator('[data-gm-notification]').last()).toContainText(
          'Failed to load media'
        );
        await expect(page.locator('[data-gm-download], [data-gm-xhr-download]')).toHaveCount(0);
      } else {
        await expect(gallery).toBeVisible();
        await expect(gallery.locator('img')).toHaveAttribute('src', /identity-A/);
        await page.keyboard.press('Escape');
        await expect(gallery).toHaveCount(0);
      }
      expect(errors).toEqual([]);
    });
  }

  test('API-off mixed DOM retains document order and clicked item through repeated opens', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('https://pbs.twimg.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: MOCK_IMAGE })
    );
    // Empty MP4 fixtures exercise extraction/routing, not video decoding.
    await page.route('https://video.twimg.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'video/mp4', body: '' })
    );
    await setupGalleryPage(page, 'https://x.com/author/status/222', {}, 503);
    await page.evaluate((markup) => {
      document.querySelector('main')!.innerHTML = markup;
    }, INTERLEAVED_DOM);
    for (let cycle = 0; cycle < 4; cycle++) {
      await page.locator('#ordered-target').click();
      const gallery = page.locator('[data-xeg-gallery-container]');
      await expect(gallery).toBeVisible();
      await expect(gallery.locator('#xeg-toolbar-counter')).toHaveAttribute('data-position', '4');
      await expect(gallery.locator('#xeg-toolbar-counter')).toHaveAttribute('data-total', '4');
      await expect(
        gallery.getByRole('button', { name: 'Download 4 shown files as ZIP' })
      ).toBeVisible();
      const items = gallery.locator('[data-gallery-element="item"]');
      await expect(items).toHaveCount(4);
      await expect(items.nth(0)).toHaveAttribute('data-media-display-url', /first\.mp4/);
      await expect(items.nth(1).locator('img')).toHaveAttribute('src', /first-photo/);
      await expect(items.nth(2)).toHaveAttribute('data-media-display-url', /second\.mp4/);
      await expect(items.nth(3).locator('img')).toHaveAttribute('src', /second-photo/);
      await page.keyboard.press('Escape');
      await expect(gallery).toHaveCount(0);
    }
    expect(
      await page.evaluate(
        () => (window as unknown as { __xegRequestedTweetIds: string[] }).__xegRequestedTweetIds
      )
    ).toEqual(['222', '222', '222']);
    expect(errors).toEqual([]);
  });

  test('article-less tile is scoped and disclosed under API failure and circuit-open', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('https://pbs.twimg.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: MOCK_IMAGE })
    );
    await setupGalleryPage(page, 'https://x.com/author/status/222', {}, 503);
    await page.evaluate((markup) => {
      document.querySelector('main')!.innerHTML = markup;
    }, STATUS_TILE_DOM);
    for (let cycle = 0; cycle < 4; cycle++) {
      await page.locator('#tile-target').click();
      const gallery = page.locator('[data-xeg-gallery-container]');
      await expect(gallery).toBeVisible();
      await expect(gallery.locator('[data-gallery-element="item"]')).toHaveCount(1);
      await expect(gallery.locator('img')).toHaveAttribute('src', /tile-photo/);
      await expect(gallery.locator('#xeg-toolbar-counter')).toHaveAttribute('data-position', '1');
      await expect(gallery.locator('#xeg-toolbar-counter')).toHaveAttribute('data-total', '1');
      await expect(gallery.getByRole('button', { name: /ZIP/ })).toHaveCount(0);
      await expect(page.locator('[data-gm-notification]').last()).toContainText(
        'Visible media only'
      );
      await expect(page.locator('[data-gm-notification]').last()).toContainText(
        'Bulk download includes only the items shown.'
      );
      await gallery.getByRole('button', { name: 'Download', exact: true }).click();
      await expect(page.locator('[data-gm-xhr-download="true"]')).toHaveCount(cycle + 1);
      await expect(page.locator('[data-gm-xhr-download="true"]').last()).toHaveAttribute(
        'data-gm-xhr-download-url',
        /tile-photo/
      );
      await page.keyboard.press('Escape');
      await expect(gallery).toHaveCount(0);
    }
    expect(
      await page.evaluate(
        () => (window as unknown as { __xegRequestedTweetIds: string[] }).__xegRequestedTweetIds
      )
    ).toEqual(['222', '222', '222']);
    expect(errors).toEqual([]);
  });

  for (const apiSuccess of [true, false]) {
    test(`unanchored preview routes native play and extracts only its video: API success=${apiSuccess}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('https://pbs.twimg.com/**', async (route) => {
        await route.fulfill({ status: 200, contentType: 'image/png', body: MOCK_IMAGE });
      });
      await page.route('https://video.twimg.com/**', (route) =>
        route.fulfill({ status: 200, contentType: 'video/mp4', body: '' })
      );
      await setupGalleryPage(
        page,
        'https://x.com/quote_author/status/222',
        createQuotedVideoTweetResponse('333'),
        apiSuccess ? 200 : 403
      );
      await page.evaluate((markup) => {
        document.querySelectorAll('article').forEach((article) => {
          article.remove();
        });
        document.body.insertAdjacentHTML('beforeend', markup);
        const poster = document.querySelector<HTMLImageElement>('#main-poster')!;
        poster.style.cssText = 'display:block;width:320px;height:180px';
        document.querySelector('[data-testid="playButton"]')!.addEventListener('click', () => {
          document.body.dataset.nativePlay = 'true';
        });
      }, unanchoredVideoPreview);
      await page.locator('[data-testid="playButton"]').click();
      await expect(page.locator('body')).toHaveAttribute('data-native-play', 'true');
      expect(
        await page.evaluate(
          () => (window as unknown as { __xegRequestedTweetIds: string[] }).__xegRequestedTweetIds
        )
      ).toEqual([]);
      await page.locator('#main-poster').click();
      await expect
        .poll(() =>
          page.evaluate(
            () => (window as unknown as { __xegRequestedTweetIds: string[] }).__xegRequestedTweetIds
          )
        )
        .toEqual(['222']);
      const gallery = page.locator('[data-xeg-gallery-container]');
      if (apiSuccess) {
        await expect(gallery).toBeVisible();
        await expect(gallery.locator('#xeg-toolbar-counter')).toHaveAttribute('data-position', '2');
        await expect(gallery.locator('video')).toHaveAttribute('src', /quote-video\.mp4/);
      } else {
        await expect(page.locator('[data-gm-notification]')).toContainText('Failed to load media');
        await expect(gallery).toHaveCount(0);
      }
      expect(errors).toEqual([]);
    });
  }

  for (const mainPlayable of [true, false]) {
    test(`URL-less main preview uses its API owner, main MP4 available=${mainPlayable}`, async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.route('https://pbs.twimg.com/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: MOCK_IMAGE,
        })
      );
      await page.route('https://video.twimg.com/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'video/mp4',
          body: '',
        })
      );
      await setupGalleryPage(
        page,
        'https://x.com/quote_author/status/222',
        createMixedOwnerVideoResponse(mainPlayable)
      );
      await page.evaluate((markup) => {
        document.querySelectorAll('article').forEach((article) => {
          article.remove();
        });
        document.body.insertAdjacentHTML('beforeend', markup);
        const poster = document.querySelector<HTMLImageElement>('#main-poster')!;
        poster.removeAttribute('src');
        poster.style.cssText = 'display:block;width:320px;height:180px';
      }, unanchoredVideoPreview);
      await page.locator('#main-poster').click();
      await expect
        .poll(() =>
          page.evaluate(
            () => (window as unknown as { __xegRequestedTweetIds: string[] }).__xegRequestedTweetIds
          )
        )
        .toEqual(['222']);
      const gallery = page.locator('[data-xeg-gallery-container]');
      if (mainPlayable) {
        await expect(gallery).toBeVisible();
        await expect(gallery.locator('#xeg-toolbar-counter')).toHaveAttribute('data-position', '2');
        const items = gallery.locator('[data-gallery-element="item"]');
        await expect(items).toHaveCount(2);
        await expect(items.nth(0)).toHaveAttribute('data-media-display-url', /video-444\.mp4/);
        await expect(items.nth(1)).toHaveAttribute('data-media-display-url', /video-333\.mp4/);
        await expect(items.nth(1).locator('video')).toHaveAttribute('src', /video-333\.mp4/);
      } else {
        await expect(page.locator('[data-gm-notification]')).toContainText('Failed to load media');
        await expect(gallery).toHaveCount(0);
      }
      expect(errors).toEqual([]);
    });
  }

  test('cross-browser smoke: userscript injects without errors on x.com', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await setupGalleryPage(page, 'https://x.com');

    // Verify no critical errors from our script
    const xegErrors = errors.filter(
      (e) => e.includes('XEG') || e.includes('xcom-enhanced') || e.includes('gallery')
    );
    expect(xegErrors).toHaveLength(0);
  });

  test('userscript does not crash on page navigation', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await setupGalleryPage(page, 'https://x.com');
    await page.goto('https://x.com/explore', { waitUntil: 'domcontentloaded' });

    const xegErrors = errors.filter(
      (e) => e.includes('XEG') || e.includes('xcom-enhanced') || e.includes('gallery')
    );
    expect(xegErrors).toHaveLength(0);
  });

  test('opens the outer quote video when quoted media contains an image', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        errors.push(message.text());
      }
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
            (window as unknown as { __xegRequestedTweetIds?: string[] }).__xegRequestedTweetIds ??
            []
        )
      )
      .toEqual(['222']);

    const gallery = page.locator('[data-xeg-gallery-container]');
    await expect(gallery).toBeVisible();
    await expect(gallery.locator('#xeg-toolbar-counter')).toHaveAttribute('data-position', '2');

    const items = gallery.locator('[data-gallery-element="item"]');
    await expect(items).toHaveCount(2);
    await expect(items.nth(0).locator('img')).toHaveAttribute('src', /quoted-image\.jpg/);
    await expect(items.nth(1).locator('video')).toHaveAttribute('src', /quote-video\.mp4/);

    await page.keyboard.press('ArrowLeft');
    await expect(gallery.locator('#xeg-toolbar-counter')).toHaveAttribute('data-position', '1');
    expect(errors).toEqual([]);
  });
});
