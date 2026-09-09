// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Artifact injection validates rendering, not userscript-manager installation. */
export async function run({ browser, root, output }) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'en-US',
    acceptDownloads: true,
  });
  const errors = [];
  try {
    await mkdir(output, { recursive: true });
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const html = await readFile(
      path.join(root, 'test/e2e/fixtures/mock-gallery-page.html'),
      'utf8'
    );
    const script = await readFile(path.join(root, 'dist/xcom-enhanced-gallery.user.js'), 'utf8');
    // Generate visible, nontrivial PNG fixtures with the browser's own Canvas encoder.
    await page.goto('about:blank');
    const images = await page.evaluate(() =>
      [
        [480, 720],
        [1200, 360],
        [640, 480],
      ].map(([width, height], index) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = ['#154c72', '#73501b', '#254b39'][index];
        ctx.fillRect(0, 0, width, height);
        ctx.strokeStyle = '#e5ecf2';
        ctx.lineWidth = 8;
        ctx.strokeRect(12, 12, width - 24, height - 24);
        ctx.fillStyle = '#ffffff';
        ctx.font = '28px Segoe UI';
        ctx.fillText(`Windows fixture ${index + 1}`, 30, 60);
        return canvas.toDataURL('image/png').split(',')[1];
      })
    );
    const pngs = images.map((value) => Buffer.from(value, 'base64'));
    await context.route('**/*', async (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === 'x.com' && route.request().isNavigationRequest()) {
        return route.fulfill({ contentType: 'text/html', body: html });
      }
      if (url.hostname === 'pbs.twimg.com') {
        const index = url.pathname.includes('5678') ? 1 : url.pathname.includes('9012') ? 2 : 0;
        return route.fulfill({
          contentType: 'image/png',
          body: pngs[index],
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      }
      return route.abort('blockedbyclient');
    });
    await page.goto('https://x.com/testuser/status/1234567890123456789');
    const { installGMMock } = await import(
      pathToFileURL(path.join(root, 'test/e2e/fixtures/gm-mock.ts')).href
    );
    await installGMMock(page);
    await page.evaluate((encodedFixtures) => {
      // Keep production media extraction deterministic: bypass the callback-only
      // GM_cookie fallback and make the unavailable fixture API fail into DOM extraction.
      document.cookie = 'ct0=windows-acceptance-fixture; path=/; SameSite=Lax';
      window.GM_xmlhttpRequest = (details) => {
        queueMicrotask(() =>
          details.onerror?.({ status: 503, statusText: 'Fixture API disabled' })
        );
        return { abort: () => undefined };
      };
      // Exercise an actual browser download through an explicitly mocked GM host.
      window.GM_download = (details, name) => {
        const options = typeof details === 'string' ? { url: details, name } : details;
        document.documentElement.dataset.xegAcceptanceDownload = options.url;
        const index = options.url.includes('5678') ? 1 : options.url.includes('9012') ? 2 : 0;
        const binary = atob(encodedFixtures[index]);
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
        try {
          const blob = new Blob([bytes], { type: 'image/png' });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = options.filename ?? options.name ?? 'fixture.png';
          (document.querySelector('.xeg-gallery-root') ?? document.body).append(anchor);
          anchor.click();
          anchor.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          options.onload?.();
        } catch (error) {
          options.onerror?.(error);
        }
      };
    }, images);
    await page.addScriptTag({ content: script });
    // Wait for public UI behavior; the production artifact has no debug globals.
    await page.waitForFunction(
      () => document.documentElement.getAttribute('data-xeg-gallery-ready') === 'true',
      undefined,
      { timeout: 15_000 }
    );
    await page.locator('[data-testid="tweetPhoto"] img').first().click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForFunction(() =>
      [...document.querySelectorAll('[data-xeg-gallery-container] img')].some(
        (image) => image.complete && image.naturalWidth > 1
      )
    );
    await page.screenshot({ path: path.join(output, 'gallery-portrait.png') });
    const progress = gallery.locator('[role="progressbar"]');
    const initial = await progress.getAttribute('aria-valuenow');
    assert.equal(initial, '1', 'Gallery must open on the clicked first image');

    const toolbar = gallery.locator('[data-gallery-element="toolbar"]');
    await toolbar.locator('button[aria-label="Fit Window"]').click();
    const selectedFit = toolbar.locator('button[aria-label="Fit Window"][aria-pressed="true"]');
    const selectedStyle = () =>
      selectedFit.evaluate(async (element) => {
        await Promise.allSettled(element.getAnimations().map((animation) => animation.finished));
        const style = getComputedStyle(element);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          borderStyle: style.borderStyle,
          borderWidth: style.borderWidth,
          boxShadow: style.boxShadow,
          focusVisible: element.matches(':focus-visible'),
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
        };
      });
    const forcedColorReference = () =>
      page.evaluate(() => {
        const reference = document.createElement('span');
        reference.style.forcedColorAdjust = 'none';
        reference.style.color = 'HighlightText';
        reference.style.backgroundColor = 'Highlight';
        document.body.append(reference);
        const style = getComputedStyle(reference);
        const colors = {
          backgroundColor: style.backgroundColor,
          color: style.color,
        };
        reference.remove();
        return colors;
      });
    assert.equal(await selectedFit.isEnabled(), true, 'Selected fit mode must remain focusable');
    const selectedResting = await selectedStyle();
    assert.notEqual(
      selectedResting.backgroundColor,
      'rgba(0, 0, 0, 0)',
      'Selected fit mode must retain a visible background'
    );
    assert.notEqual(selectedResting.boxShadow, 'none', 'Selected fit mode must retain an inset ring');
    await selectedFit.hover();
    const selectedHovered = await selectedStyle();
    assert.equal(
      selectedHovered.backgroundColor,
      selectedResting.backgroundColor,
      'Hover must not erase selected state'
    );
    assert.equal(
      selectedHovered.boxShadow,
      selectedResting.boxShadow,
      'Hover must not erase the selected ring'
    );
    await page.keyboard.press('Tab');
    await selectedFit.focus();
    const selectedFocused = await selectedStyle();
    assert.equal(
      selectedFocused.backgroundColor,
      selectedResting.backgroundColor,
      'Focus must not erase selected state'
    );
    assert.notEqual(selectedFocused.outlineStyle, 'none', 'Selected focus must remain visible');
    assert.equal(selectedFocused.focusVisible, true, 'Selected focus must use keyboard modality');
    assert(
      Number.parseFloat(selectedFocused.outlineWidth) >= 2,
      'Selected focus outline must be at least 2px'
    );
    await page.emulateMedia({ forcedColors: 'active' });
    await selectedFit.evaluate((element) => element.blur());
    await selectedFit.hover();
    const systemHighlight = await forcedColorReference();
    const selectedForcedHovered = await selectedStyle();
    assert.equal(
      selectedForcedHovered.backgroundColor,
      systemHighlight.backgroundColor,
      'Forced-colors hover must retain the system highlight background'
    );
    assert.equal(
      selectedForcedHovered.color,
      systemHighlight.color,
      'Forced-colors hover must retain the system highlight text'
    );
    await page.keyboard.press('Tab');
    await selectedFit.focus();
    const selectedForced = await selectedStyle();
    assert.equal(
      selectedForced.backgroundColor,
      systemHighlight.backgroundColor,
      'Forced-colors focus must retain the system highlight background'
    );
    assert.equal(
      selectedForced.color,
      systemHighlight.color,
      'Forced-colors focus must retain the system highlight text'
    );
    assert.equal(
      selectedForced.focusVisible,
      true,
      'Forced-colors focus must use keyboard modality'
    );
    assert.equal(selectedForced.borderStyle, 'solid', 'Forced colors must expose a selected border');
    assert(
      Number.parseFloat(selectedForced.borderWidth) >= 2,
      'Forced-colors selected border must be at least 2px'
    );
    assert.notEqual(
      selectedForced.outlineStyle,
      'none',
      'Forced-colors selected focus must remain visible'
    );
    await page.emulateMedia({ forcedColors: 'none' });
    await toolbar.evaluate((element) => element.setAttribute('disabled', ''));
    assert.equal(await selectedFit.isDisabled(), true, 'Disabled toolbar must disable selected fit mode');
    const selectedDisabled = await selectedStyle();
    assert.equal(
      selectedDisabled.backgroundColor,
      selectedResting.backgroundColor,
      'Disabled state must retain selected background'
    );
    assert.equal(
      selectedDisabled.boxShadow,
      selectedResting.boxShadow,
      'Disabled state must retain selected ring'
    );
    await toolbar.evaluate((element) => element.removeAttribute('disabled'));

    // A focused toolbar must survive gallery scrolling. After keyboard focus
    // returns to the image, auto-hide must expose the content beneath it.
    await selectedFit.focus();
    await page.mouse.move(600, 500);
    const items = gallery.locator('[data-gallery-element="items"]');
    const scrollBeforeWheel = await items.evaluate((element) => element.scrollTop);
    await page.mouse.wheel(0, 40);
    await page.waitForFunction((previous) => {
      const items = document.querySelector('[data-gallery-element="items"]');
      return items && items.scrollTop > previous;
    }, scrollBeforeWheel);
    const focusedToolbar = await selectedFit.evaluate((element) => {
      const wrapper = element.closest('[data-gallery-element="toolbar"]').parentElement;
      return {
        focused: document.activeElement === element,
        visibility: getComputedStyle(wrapper).visibility,
        opacity: getComputedStyle(wrapper).opacity,
      };
    });
    assert.equal(focusedToolbar.focused, true);
    assert.equal(focusedToolbar.visibility, 'visible', 'Scrolling must preserve focused toolbar');
    assert.equal(focusedToolbar.opacity, '1');
    for (let step = 0; step < 30; step += 1) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(() => Boolean(document.activeElement?.closest('[data-gallery-element="item"]')))) break;
    }
    assert.equal(
      await page.evaluate(() => Boolean(document.activeElement?.closest('[data-gallery-element="item"]'))),
      true,
      'Keyboard users must be able to return focus to gallery content'
    );
    await page.waitForFunction(() => {
      const toolbar = document.querySelector('[data-gallery-element="toolbar"]');
      return toolbar && getComputedStyle(toolbar.parentElement).visibility === 'hidden'
        && getComputedStyle(toolbar.parentElement).opacity === '0';
    }, undefined, { timeout: 6000 });
    await page.screenshot({ path: path.join(output, 'gallery-content-uncovered.png') });

    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(
      (previous) =>
        document
          .querySelector('[data-xeg-gallery-container] [role="progressbar"]')
          ?.getAttribute('aria-valuenow') !== previous,
      initial
    );
    const next = await progress.getAttribute('aria-valuenow');
    assert.equal(next, '2', 'ArrowRight must select the second image');
    await page.screenshot({ path: path.join(output, 'gallery-panorama.png') });
    await page.setViewportSize({ width: 401, height: 592 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.mouse.move(200, 4);
    await toolbar.waitFor({ state: 'visible' });
    await page.waitForFunction(() => {
      const toolbar = document.querySelector('[data-gallery-element="toolbar"]');
      return toolbar && getComputedStyle(toolbar.parentElement).opacity === '1';
    });
    await page.screenshot({ path: path.join(output, 'gallery-narrow-dark.png') });
    const narrowGeometry = await toolbar.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, viewport: innerWidth };
    });
    assert(narrowGeometry.left >= 0 && narrowGeometry.right <= narrowGeometry.viewport,
      'Toolbar must fit the narrow viewport');
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.mouse.move(600, 4);
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15_000 }),
      (async () => {
        await page
          .locator('[data-gallery-element="toolbar"] button[aria-label="Download"]')
          .click();
        await page.waitForFunction(() =>
          Boolean(document.documentElement.dataset.xegAcceptanceDownload)
        );
      })(),
    ]);
    const requestedUrl = await page.locator('html').getAttribute('data-xeg-acceptance-download');
    assert(requestedUrl?.includes('5678'), 'Download must request the selected second fixture');
    assert.equal(await download.failure(), null);
    const filename = 'downloaded-fixture.png';
    await download.saveAs(path.join(output, filename));
    const bytes = await readFile(path.join(output, filename));
    assert(pngs[1].equals(bytes), 'Downloaded bytes must match the selected second fixture');
    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    assert.deepEqual(errors, []);
    return {
      checks: [
        'production-userscript-injection',
        'gallery-open',
        'toolbar-selected-state',
        'toolbar-selected-focus',
        'toolbar-forced-colors',
        'keyboard-next',
        'focused-toolbar-survives-scroll',
        'keyboard-content-auto-hide',
        'narrow-dark-toolbar',
        'mock-GM-browser-download',
        'escape-close',
      ],
      browserVersion: browser.version(),
      download: {
        file: filename,
        suggestedFilename: download.suggestedFilename(),
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      },
      scope:
        'fixture userscript rendering and mocked-GM browser download; no extension installation or live X.com',
      visualReview: 'pending',
    };
  } finally {
    await context.close();
  }
}
