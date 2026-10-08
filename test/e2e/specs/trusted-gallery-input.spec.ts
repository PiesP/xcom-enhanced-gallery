// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { expect, type Page, test } from '@playwright/test';
import { resolve } from 'node:path';
import { build } from 'vite';
import { basePreset } from '../../../tooling/vite/presets/base';
import type { observeEarlyClicks } from '../fixtures/early-click-replay';
import { MOCK_GALLERY_HTML, MOCK_IMAGE } from '../fixtures/artifacts';
import { installGMMock } from '../fixtures/gm-mock';
import { injectDevUserscript, waitForGalleryApp } from '../fixtures/userscript-harness';

interface RenderFault {
  remaining: number;
  throws: number;
  autoResetTimers: number;
}

declare global {
  interface Window {
    __xegTrustedInputFault?: RenderFault;
    __xegEarlyInputFixture: { observeEarlyClicks: typeof observeEarlyClicks };
    __xegEarlyInputObserver?: ReturnType<typeof observeEarlyClicks>;
  }
}

let earlyInputBundle = '';
test.beforeAll(async () => {
  const result = await build({
    ...basePreset({ isDev: false, version: 'test', featureMediaExtraction: true }),
    configFile: false,
    build: {
      write: false,
      lib: {
        entry: resolve(import.meta.dirname, '../fixtures/early-click-replay.ts'),
        name: '__xegEarlyInputFixture',
        formats: ['iife'],
      },
    },
  });
  const outputs = Array.isArray(result) ? result : [result];
  for (const output of outputs) {
    if (!('output' in output)) continue;
    const chunk = output.output.find((item) => item.type === 'chunk');
    if (chunk?.type === 'chunk') earlyInputBundle = chunk.code;
  }
  if (!earlyInputBundle) throw new Error('Readiness browser fixture build produced no code');
});

test('retains a genuine early media click as a private capability exactly once', async ({ page }) => {
  await page.route('https://x.com/**', (route) => route.fulfill({
    status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML,
  }));
  await page.route('https://pbs.twimg.com/**', (route) => route.fulfill({
    status: 200, contentType: 'image/png', body: MOCK_IMAGE,
  }));
  await page.goto('https://x.com/testuser/status/1234567890123456789');
  await page.addScriptTag({ content: earlyInputBundle });
  await page.evaluate(() => {
    document.querySelectorAll('[data-testid="tweetPhoto"] img').forEach((image, index) => {
      image.id = `early-${index}`;
    });
    window.__xegEarlyInputObserver = window.__xegEarlyInputFixture.observeEarlyClicks();
    document.querySelector<HTMLElement>('#early-0')?.click();
  });
  await page.evaluate(() => window.__xegEarlyInputObserver?.complete());
  expect(await page.evaluate(() => window.__xegEarlyInputObserver?.observations())).toEqual([]);
  await page.evaluate(() => {
    window.__xegEarlyInputObserver = window.__xegEarlyInputFixture.observeEarlyClicks();
  });
  await page.locator('#early-0').click();
  await page.locator('#early-1').click();
  await page.evaluate(async () => {
    await window.__xegEarlyInputObserver?.complete();
    await window.__xegEarlyInputObserver?.complete();
  });
  expect(await page.evaluate(() => window.__xegEarlyInputObserver?.observations())).toEqual([
    { trusted: true, target: 'early-0' },
  ]);
  await page.evaluate(() => {
    window.__xegEarlyInputObserver = window.__xegEarlyInputFixture.observeEarlyClicks();
  });
  await page.locator('#early-0').click();
  await page.evaluate(async () => {
    document.querySelector('#early-0')?.remove();
    await window.__xegEarlyInputObserver?.complete();
  });
  expect(await page.evaluate(() => window.__xegEarlyInputObserver?.observations())).toEqual([]);
});

async function setup(page: Page): Promise<void> {
  await page.route('https://x.com/**', (route) => route.fulfill({
    status: 200, contentType: 'text/html', body: MOCK_GALLERY_HTML,
  }));
  await page.route('https://pbs.twimg.com/**', (route) => route.fulfill({
    status: 200, contentType: 'image/png', body: MOCK_IMAGE,
  }));
  await page.goto('https://x.com/testuser/status/1234567890123456789');
  await installGMMock(page);
  await page.evaluate(() => {
    const downloadRequest = window.GM_xmlhttpRequest;
    window.GM_xmlhttpRequest = (details) => {
      if (details.responseType === 'blob') return downloadRequest(details);
      queueMicrotask(() => details.onload?.({
        finalUrl: details.url,
        readyState: 4,
        status: 403,
        statusText: 'Forbidden',
        responseHeaders: 'content-type: application/json',
        response: {},
        responseText: '{}',
        context: details.context,
      }));
      return { abort: () => undefined };
    };
  });
  await injectDevUserscript(page);
  await waitForGalleryApp(page);
}

/** Bounded test-only render fault through the production gallery DOM adapter. */
async function installRenderFault(page: Page, failures: number): Promise<void> {
  await page.evaluate((remaining) => {
    const descriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'setProperty');
    if (!descriptor || typeof descriptor.value !== 'function') throw new Error('Missing CSS API');
    const original = descriptor.value;
    const state: RenderFault = { remaining, throws: 0, autoResetTimers: 0 };
    window.__xegTrustedInputFault = state;
    Object.defineProperty(CSSStyleDeclaration.prototype, 'setProperty', {
      ...descriptor,
      value(this: CSSStyleDeclaration, property: string, value: string, priority?: string) {
        if (property === '--xeg-viewport-w' && state.remaining > 0) {
          state.remaining -= 1;
          state.throws += 1;
          throw new Error(`Bounded gallery render failure ${state.throws}`);
        }
        return Reflect.apply(original, this, [property, value, priority]);
      },
    });
    const originalTimeout = window.setTimeout;
    window.setTimeout = ((handler: TimerHandler, delay?: number, ...args: unknown[]) => {
      if (delay === 30_000) state.autoResetTimers += 1;
      return originalTimeout(handler, delay, ...args);
    }) as typeof window.setTimeout;
  }, failures);
}

const action = (page: Page, name: string) => page.locator(`[data-xeg-error-action="${name}"]`);
const notifications = (page: Page) => page.locator('[data-gm-notification="true"]');

test('synthetic gallery input has no effect while real keyboard and button input still work', async ({ page }) => {
  await setup(page);
  const trigger = page.locator('[data-testid="tweetPhoto"] img').first();
  await trigger.evaluate((element) => (element as HTMLElement).click());
  await expect(page.locator('[data-xeg-gallery-container]')).toHaveCount(0);
  await trigger.click();
  const gallery = page.locator('[data-xeg-gallery-container]');
  await expect(gallery).toBeVisible();
  const before = await notifications(page).count();
  await page.evaluate(() => {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
    document.body.click();
    document.querySelector<HTMLElement>('[data-gallery-element="items"]')?.click();
    document.querySelector<HTMLElement>('[aria-label="Close"]')?.click();
    document.querySelector<HTMLElement>('[aria-label="Download"]')?.click();
  });
  await expect(gallery).toBeVisible();
  await expect(notifications(page)).toHaveCount(before);
  await page.getByRole('button', { name: 'Close', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(gallery).toHaveCount(0);
  await trigger.click();
  await page.keyboard.press('Escape');
  await expect(gallery).toHaveCount(0);
});

test('trusted recovery retries remain bounded and a successful third retry has no stale reset', async ({ page }) => {
  await page.clock.install();
  await setup(page);
  await installRenderFault(page, 3);
  await page.locator('[data-testid="tweetPhoto"] img').first().click();
  await expect(action(page, 'retry')).toBeVisible();
  const before = await notifications(page).count();
  await action(page, 'retry').evaluate((element) => (element as HTMLElement).click());
  await action(page, 'close').evaluate((element) => (element as HTMLElement).click());
  expect(await page.evaluate(() => window.__xegTrustedInputFault?.throws)).toBe(1);
  await expect(notifications(page)).toHaveCount(before);
  await expect(action(page, 'retry')).toBeVisible();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await action(page, 'retry').focus();
    await page.keyboard.press('Enter');
    if (attempt < 2) {
      await expect.poll(() => page.evaluate(() => window.__xegTrustedInputFault?.throws)).toBe(attempt + 2);
    }
  }
  await expect(page.locator('[data-xeg-gallery-container]')).toBeVisible();
  expect(await page.evaluate(() => window.__xegTrustedInputFault?.autoResetTimers)).toBe(0);
  await page.clock.fastForward(30_000);
  await expect(page.locator('[data-xeg-gallery-container]')).toBeVisible();
  expect(await page.evaluate(() => window.__xegTrustedInputFault?.throws)).toBe(3);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-xeg-gallery-container]')).toHaveCount(0);
});

test('trusted reset and close preserve recovery and host cleanup', async ({ page }) => {
  await setup(page);
  await installRenderFault(page, 4);
  await page.locator('[data-testid="tweetPhoto"] img').first().click();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await action(page, 'retry').click();
    await expect.poll(() => page.evaluate(() => window.__xegTrustedInputFault?.throws)).toBe(attempt + 2);
  }
  await expect(action(page, 'retry')).toBeDisabled();
  await expect(action(page, 'reset')).toBeVisible();
  const before = await notifications(page).count();
  await action(page, 'reset').evaluate((element) => (element as HTMLElement).click());
  await expect(action(page, 'retry')).toBeDisabled();
  await expect(notifications(page)).toHaveCount(before);
  await action(page, 'reset').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-xeg-gallery-container]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-xeg-gallery-container]')).toHaveCount(0);
  await installRenderFault(page, 1);
  await page.locator('[data-testid="tweetPhoto"] img').first().click();
  await expect(action(page, 'close')).toBeVisible();
  await action(page, 'close').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-xeg-error-boundary]')).toHaveCount(0);
  await expect(page.locator('[data-xeg-gallery-container]')).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.position)).not.toBe('fixed');
  await expect(page.locator('#outside-button')).toBeEnabled();
});
