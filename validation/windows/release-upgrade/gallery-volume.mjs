// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { join } from 'node:path';

const VIDEO_URL = 'https://x.com/outer_one/status/8111111111111111111';
const DIRECT_VIDEO_URL = 'https://x.com/quote_one/status/9111111111111111111';

/** Keep a bounded view of the owned settings panel when an upgrade UI check fails. */
export async function captureUpgradeSettingsFailure(page, output, installation, phase) {
  if (page.isClosed()) {
    return { phase, diagnosticError: 'page already closed' };
  }
  try {
    const controls = await page
      .locator('[data-xeg-gallery-container] #toolbar-settings-panel select')
      .evaluateAll((elements) =>
        elements.slice(0, 8).map((element) => ({ id: element.id, value: element.value }))
      );
    const screenshot = `${installation}-${phase}-settings-failure.png`;
    await page.screenshot({ path: join(output, screenshot) });
    return { phase, controls, screenshot };
  } catch (error) {
    return { phase, diagnosticError: String(error).slice(0, 500) };
  }
}

/** Verify the default enabled keyboard navigation using the visible gallery counter. */
export async function observeGalleryKeyboardNavigation(page, gallery) {
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
export async function observeDefaultVideoClick(context) {
  const page = await context.newPage();
  try {
    await page.goto(DIRECT_VIDEO_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    await page.locator('[data-unmarked-direct]').click();
    await page.locator('[data-xeg-gallery-container]').waitFor({ state: 'visible' });
    const clicks = await page.evaluate(() => window.__directVideoClicks);
    assert.equal(clicks.length, 1, 'Default mode must capture one direct video click');
    assert.equal(clicks[0].tag, 'video');
    assert.equal(clicks[0].prevented, true);
    return { mode: 'block-controls-only', clickCaptured: true, galleryOpened: true };
  } finally {
    await page.close();
  }
}

/** Change volume through the product's trusted keyboard shortcut on a loaded gallery video. */
export async function observeGalleryVolume(
  context,
  { before, after = null, waitForPersistedVolume = null, waitForInitialVolume = false }
) {
  const page = await context.newPage();
  try {
    await page.goto(VIDEO_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    await page.locator('body[data-video-ready="true"]').waitFor({ state: 'attached' });
    await page.locator('[data-case="recognized"] [data-quote-target]').click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    const counter = gallery.locator('#xeg-toolbar-counter');
    assert.equal(await counter.getAttribute('data-position'), '2');
    const video = gallery.locator('[data-gallery-element="item"][data-index="1"] video');
    await video.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const video = document.querySelector(
        '[data-xeg-gallery-container] [data-gallery-element="item"][data-index="1"] video'
      );
      return video instanceof HTMLVideoElement && video.readyState >= 1 && video.error === null;
    });
    if (waitForInitialVolume) {
      try {
        await page.waitForFunction(
          (expected) => {
            const video = document.querySelector(
              '[data-xeg-gallery-container] [data-gallery-element="item"][data-index="1"] video'
            );
            return video instanceof HTMLVideoElement && Math.abs(video.volume - expected) < 0.011;
          },
          before,
          { timeout: 5_000 }
        );
      } catch (error) {
        const observed = await video.evaluate((element) => element.volume);
        throw new Error(`Reopened gallery volume was ${observed}; expected ${before}`, {
          cause: error,
        });
      }
    }
    const initial = await video.evaluate((element) => element.volume);
    assert(Math.abs(initial - before) < 0.011, `Gallery volume before shortcut: ${initial}`);
    if (after !== null) {
      await video.focus();
      await page.keyboard.press(after < before ? 'ArrowDown' : 'ArrowUp');
      await page.waitForFunction(
        (expected) => {
          const video = document.querySelector(
            '[data-xeg-gallery-container] [data-gallery-element="item"][data-index="1"] video'
          );
          return video instanceof HTMLVideoElement && Math.abs(video.volume - expected) < 0.011;
        },
        after,
        { timeout: 5_000 }
      );
      assert.equal(await video.evaluate((element) => element.volume), after);
      // The application debounces volume persistence. Keep the gallery alive until
      // storage confirms the change so closing this page cannot cancel the write.
      if (waitForPersistedVolume) {
        await waitForPersistedVolume(after);
      }
    }
    return { source: 'trusted-gallery-keyboard-volume-control', before: initial, after };
  } finally {
    await page.close();
  }
}
