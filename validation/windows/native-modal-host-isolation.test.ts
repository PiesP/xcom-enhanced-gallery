// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { test } from 'vite-plus/test';
import { assertLateHostPanelIsolation } from './install-profile.ts';

test('installed host isolation probe observes native modal accessibility and focus restoration', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<main>Host content</main><dialog data-xeg-gallery-container></dialog>');
    await page.evaluate(() => {
      document.querySelector('dialog')?.showModal();
      const panel = document.createElement('aside');
      panel.id = 'late-host-panel';
      panel.setAttribute('aria-hidden', 'false');
      const action = document.createElement('button');
      action.textContent = 'Late host action late-host-panel';
      panel.append(action);
      document.body.append(panel);
    });

    await assertLateHostPanelIsolation(page, 'late-host-panel', 'open');
    await page.evaluate(() => document.querySelector('dialog')?.close());
    await assertLateHostPanelIsolation(page, 'late-host-panel', 'closed');
  } finally {
    await browser.close();
  }
});

test('installed host isolation probe rejects a modeless dialog', async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent('<main>Host content</main><dialog data-xeg-gallery-container></dialog>');
    await page.evaluate(() => {
      document.querySelector('dialog')?.show();
      const panel = document.createElement('aside');
      panel.id = 'late-host-panel';
      panel.setAttribute('aria-hidden', 'false');
      const action = document.createElement('button');
      action.textContent = 'Late host action late-host-panel';
      panel.append(action);
      document.body.append(panel);
    });
    await assert.rejects(
      assertLateHostPanelIsolation(page, 'late-host-panel', 'open'),
      /Native gallery modal must be open/u
    );
  } finally {
    await browser.close();
  }
});
