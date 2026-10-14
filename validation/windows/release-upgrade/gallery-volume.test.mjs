// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { chromium } from '@playwright/test';
import { captureUpgradeSettingsFailure } from './gallery-volume.mjs';

test('upgrade settings diagnostic scopes public and candidate controls to the gallery panel', async () => {
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
