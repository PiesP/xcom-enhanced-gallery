// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';

const VIDEO_URL = 'https://x.com/outer_one/status/8111111111111111111';

/** Change volume through the product's trusted keyboard shortcut on a loaded gallery video. */
export async function observeGalleryVolume(context, { before, after = null }) {
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
    }
    return { source: 'trusted-gallery-keyboard-volume-control', before: initial, after };
  } finally {
    await page.close();
  }
}
