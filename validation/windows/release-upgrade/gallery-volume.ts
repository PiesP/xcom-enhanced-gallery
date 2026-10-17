// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { join } from 'node:path';
import type { BrowserContext, Locator, Page } from '@playwright/test';

declare global {
  interface Window {
    __directVideoClicks?: Array<{ tag: string; prevented: boolean }>;
  }
}

type GalleryVolumeOptions = {
  before: number | null;
  after?: number | null;
  galleryFixture?: 'quoted' | 'direct';
  waitForPersistedVolume?: ((volume: number) => Promise<unknown>) | null;
  waitForInitialVolume?: boolean;
  onFailure?: ((page: Page, consoleEvents: string[]) => Promise<unknown>) | null;
};

const VIDEO_URL = 'https://x.com/outer_one/status/8111111111111111111';
const DIRECT_VIDEO_URL = 'https://x.com/quote_one/status/9111111111111111111';

/** Capture bounded fixture and gallery state before a failed volume page closes. */
export async function captureGalleryVolumeFailure(
  page: Page,
  output: string,
  installation: string,
  phase: string,
  consoleEvents: string[]
) {
  const diagnostic: {
    phase: string;
    consoleEvents: string[];
    pageState?: unknown;
    screenshot?: string;
    captureError?: string;
  } = { phase, consoleEvents };
  try {
    diagnostic.pageState = await page.evaluate(() => {
      const source = document.querySelector('[data-unmarked-direct], [data-quote-target]');
      const gallery = document.querySelector('[data-xeg-gallery-container]');
      const directClicks = window.__directVideoClicks;
      return {
        url: location.href,
        galleryReady: document.documentElement.dataset.xegGalleryReady ?? null,
        videoReady: document.body.dataset.videoReady ?? null,
        source: source
          ? {
              tag: source.tagName.toLowerCase(),
              mediaReadyState: source instanceof HTMLVideoElement ? source.readyState : null,
              src: (
                (source instanceof HTMLMediaElement ? source.currentSrc : '') ||
                source.getAttribute('src') ||
                ''
              ).slice(0, 200),
            }
          : null,
        directClicks: Array.isArray(directClicks) ? directClicks.slice(-4) : null,
        galleryPresent: gallery !== null,
        galleryVideoCount: gallery?.querySelectorAll('video').length ?? 0,
      };
    });
    diagnostic.screenshot = `${installation}-${phase}-volume-failure.png`;
    await page.screenshot({ path: join(output, diagnostic.screenshot) });
  } catch (error) {
    diagnostic.captureError = String(error).slice(0, 300);
  }
  return diagnostic;
}

/** Keep a bounded view of the owned settings panel when an upgrade UI check fails. */
export async function captureUpgradeSettingsFailure(
  page: Page,
  output: string,
  installation: string,
  phase: string
) {
  if (page.isClosed()) {
    return { phase, diagnosticError: 'page already closed' };
  }
  try {
    const controls = await page
      .locator('[data-xeg-gallery-container] #toolbar-settings-panel select')
      .evaluateAll((elements) =>
        elements.slice(0, 8).map((element) => {
          if (!(element instanceof HTMLSelectElement)) {
            throw new Error('Expected gallery settings select');
          }
          return { id: element.id, value: element.value };
        })
      );
    const screenshot = `${installation}-${phase}-settings-failure.png`;
    await page.screenshot({ path: join(output, screenshot) });
    return { phase, controls, screenshot };
  } catch (error) {
    return { phase, diagnosticError: String(error).slice(0, 500) };
  }
}

/** Verify the default enabled keyboard navigation using the visible gallery counter. */
export async function observeGalleryKeyboardNavigation(page: Page, gallery: Locator) {
  const counter = gallery.locator('#xeg-toolbar-counter');
  assert.equal(await counter.getAttribute('data-position'), '1');
  await gallery.locator('[data-gallery-element="item"][data-index="0"] button').focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(
    () => document.querySelector('#xeg-toolbar-counter')?.getAttribute('data-position') === '2'
  );
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(
    () => document.querySelector('#xeg-toolbar-counter')?.getAttribute('data-position') === '1'
  );
  return { defaultEnabled: true, movedRightAndBack: true };
}

/** Observe the public default mode through a trusted click on an unmarked video. */
export async function observeDefaultVideoClick(context: BrowserContext) {
  const page = await context.newPage();
  try {
    await page.goto(DIRECT_VIDEO_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    await page.locator('[data-unmarked-direct]').click();
    await page.locator('[data-xeg-gallery-container]').waitFor({ state: 'visible' });
    const clicks = await page.evaluate(() => window.__directVideoClicks);
    assert(clicks, 'Direct video click receipt is unavailable');
    assert.equal(clicks.length, 1, 'Default mode must capture one direct video click');
    const click = clicks[0];
    assert(click, 'Direct video click is unavailable');
    assert.equal(click.tag, 'video');
    assert.equal(click.prevented, true);
    return { mode: 'block-controls-only', clickCaptured: true, galleryOpened: true };
  } finally {
    await page.close();
  }
}

/** Change volume through the product's trusted keyboard shortcut on a loaded gallery video. */
export async function observeGalleryVolume(
  context: BrowserContext,
  {
    before,
    after = null,
    galleryFixture = 'quoted',
    waitForPersistedVolume = null,
    waitForInitialVolume = false,
    onFailure = null,
  }: GalleryVolumeOptions
) {
  assert(['quoted', 'direct'].includes(galleryFixture), 'Unsupported gallery volume fixture');
  assert(before !== null || after === null, 'A volume change requires a known initial volume');
  const direct = galleryFixture === 'direct';
  const videoIndex = direct ? 0 : 1;
  const videoSelector = `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${videoIndex}"] video`;
  const page = await context.newPage();
  const consoleEvents: string[] = [];
  if (onFailure) {
    page.on('console', (message) => {
      if (['warning', 'error'].includes(message.type()) && consoleEvents.length < 8) {
        consoleEvents.push(`${message.type()}: ${message.text().slice(0, 300)}`);
      }
    });
    page.on('pageerror', (error) => {
      if (consoleEvents.length < 8) {
        consoleEvents.push(`pageerror: ${String(error).slice(0, 300)}`);
      }
    });
  }
  try {
    await page.goto(direct ? DIRECT_VIDEO_URL : VIDEO_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    if (direct) {
      await page.locator('[data-unmarked-direct]').click();
    } else {
      await page.locator('body[data-video-ready="true"]').waitFor({ state: 'attached' });
      await page.locator('[data-case="recognized"] [data-quote-target]').click();
    }
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    const counter = gallery.locator('#xeg-toolbar-counter');
    assert.equal(await counter.getAttribute('data-position'), String(videoIndex + 1));
    const video = gallery.locator(
      `[data-gallery-element="item"][data-index="${videoIndex}"] video`
    );
    await video.waitFor({ state: 'visible' });
    await page.waitForFunction((selector) => {
      const video = document.querySelector(selector);
      return video instanceof HTMLVideoElement && video.readyState >= 1 && video.error === null;
    }, videoSelector);
    if (waitForInitialVolume) {
      assert(before !== null, 'Initial volume must be known before waiting');
      try {
        await page.waitForFunction(
          ({ selector, expected }) => {
            const video = document.querySelector(selector);
            return video instanceof HTMLVideoElement && Math.abs(video.volume - expected) < 0.011;
          },
          { selector: videoSelector, expected: before },
          { timeout: 5_000 }
        );
      } catch (error) {
        const observed = await video.evaluate((element) => {
          if (!(element instanceof HTMLVideoElement)) {
            throw new Error('Expected gallery video');
          }
          return element.volume;
        });
        throw new Error(`Reopened gallery volume was ${observed}; expected ${before}`, {
          cause: error,
        });
      }
    }
    const initial = await video.evaluate((element) => {
      if (!(element instanceof HTMLVideoElement)) {
        throw new Error('Expected gallery video');
      }
      return element.volume;
    });
    if (before !== null) {
      assert(Math.abs(initial - before) < 0.011, `Gallery volume before shortcut: ${initial}`);
    }
    if (after !== null) {
      assert(before !== null, 'A volume change requires a known initial volume');
      await video.focus();
      await page.keyboard.press(after < before ? 'ArrowDown' : 'ArrowUp');
      await page.waitForFunction(
        ({ selector, expected }) => {
          const video = document.querySelector(selector);
          return video instanceof HTMLVideoElement && Math.abs(video.volume - expected) < 0.011;
        },
        { selector: videoSelector, expected: after },
        { timeout: 5_000 }
      );
      assert.equal(
        await video.evaluate((element) => {
          if (!(element instanceof HTMLVideoElement)) {
            throw new Error('Expected gallery video');
          }
          return element.volume;
        }),
        after
      );
      // The application debounces volume persistence. Keep the gallery alive until
      // storage confirms the change so closing this page cannot cancel the write.
      if (waitForPersistedVolume) {
        await waitForPersistedVolume(after);
      }
    }
    return {
      source: 'trusted-gallery-keyboard-volume-control',
      ...(direct ? { fixture: 'direct' } : {}),
      before: initial,
      after,
    };
  } catch (error) {
    if (onFailure) {
      await onFailure(page, consoleEvents).catch(() => {});
    }
    throw error;
  } finally {
    await page.close();
  }
}
