// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { chromium, type BrowserContext } from '@playwright/test';
import { captureUpgradeSettingsFailure, observeGalleryVolume } from './gallery-volume.ts';

async function galleryContext(
  volume: number,
  calls: string[]
): Promise<{ context: BrowserContext; close: () => Promise<void> }> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const media = await readFile(
    new URL('../../../test/e2e/fixtures/installed-quote-one.mp4', import.meta.url)
  );
  context.on('page', (page) => page.on('close', () => calls.push('close')));
  await context.route('https://x.com/**', async (route) => {
    const url = route.request().url();
    calls.push(url);
    await route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html>
        <html data-xeg-gallery-ready="true"><body data-video-ready="true">
          <div data-case="recognized"><button data-quote-target>Open</button></div>
          <button data-unmarked-direct>Open direct</button>
          <div data-xeg-gallery-container>
            <span id="xeg-toolbar-counter" data-position="${url.includes('/quote_one/') ? 1 : 2}"></span>
            <div data-gallery-element="item" data-index="${url.includes('/quote_one/') ? 0 : 1}">
              <video controls tabindex="0" src="data:video/mp4;base64,${media.toString('base64')}"></video>
            </div>
          </div>
          <script>
            const video = document.querySelector('video');
            video.volume = ${volume};
            video.addEventListener('keydown', (event) => {
              if (event.key === 'ArrowDown') video.volume = Math.round((video.volume - 0.1) * 10) / 10;
            });
          </script>
        </body></html>`,
    });
  });
  return { context, close: () => browser.close() };
}

test('volume persistence completes while the gallery page is still open', async () => {
  const calls: string[] = [];
  const fixture = await galleryContext(1, calls);
  try {
    const result = await observeGalleryVolume(fixture.context, {
      before: 1,
      after: 0.9,
      waitForPersistedVolume: async (expected) => {
        assert.equal(expected, 0.9);
        calls.push('persisted');
      },
    });
    assert.equal(result.after, 0.9);
    assert.deepEqual(calls.slice(-2), ['persisted', 'close']);
  } finally {
    await fixture.close();
  }
});

test('direct video fixture reads the single gallery item without changing volume', async () => {
  const calls: string[] = [];
  const fixture = await galleryContext(0.9, calls);
  try {
    const result = await observeGalleryVolume(fixture.context, {
      before: null,
      galleryFixture: 'direct',
    });
    assert.equal(result.before, 0.9);
    assert.equal(result.fixture, 'direct');
    assert.deepEqual(calls, ['https://x.com/quote_one/status/9111111111111111111', 'close']);
  } finally {
    await fixture.close();
  }
});

test('upgrade settings diagnostic scopes public and candidate controls to the gallery panel', async () => {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  const output = await mkdtemp(join(tmpdir(), 'xeg-upgrade-settings-'));
  const page = await browser.newPage();
  try {
    await page.setContent(`
      <select id="settings-video-click-select"><option value="outside">Outside</option></select>
      <div data-xeg-gallery-container>
        <section id="toolbar-settings-panel">
          <select id="settings-language-select"><option value="ko">Korean</option></select>
        </section>
      </div>
    `);
    const publicUi = await captureUpgradeSettingsFailure(page, output, 'extension', 'public');
    assert.deepEqual(publicUi.controls, [{ id: 'settings-language-select', value: 'ko' }]);
    assert((await stat(join(output, publicUi.screenshot))).size > 0);

    await page.locator('#toolbar-settings-panel').evaluate((panel) => {
      panel.insertAdjacentHTML(
        'beforeend',
        '<select id="settings-video-click-select"><option value="block-controls-only">Default</option></select>'
      );
    });
    const candidateUi = await captureUpgradeSettingsFailure(page, output, 'extension', 'candidate');
    assert.deepEqual(candidateUi.controls, [
      { id: 'settings-language-select', value: 'ko' },
      { id: 'settings-video-click-select', value: 'block-controls-only' },
    ]);
    assert((await stat(join(output, candidateUi.screenshot))).size > 0);
  } finally {
    await page.close();
    await browser.close();
    await rm(output, { recursive: true, force: true });
  }
});
