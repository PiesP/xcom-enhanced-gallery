// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';

const PROFILE_PREFIX = 'xeg-chrome-install-';
const TWEET_ID = '1234567890123456789';
const FIXTURE_URL = `https://x.com/testuser/status/${TWEET_ID}`;
const IMAGE_URL_MARKERS = ['GkE1234', 'GkE5678', 'GkE9012'];
const CYCLES = [
  { close: 'escape', direction: 'ArrowLeft', expectedIndex: 0, triggerIndex: 1 },
  { close: 'button', direction: 'ArrowRight', expectedIndex: 1, triggerIndex: 0 },
  { close: 'escape', direction: 'ArrowRight', expectedIndex: 2, triggerIndex: 1 },
];

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function safeError(error) {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

function expectedFilename(index) {
  return `testuser_${TWEET_ID}_${index}.jpg`;
}

function assertOwnedProfile(root, profile) {
  const resolvedRoot = resolve(root);
  const resolvedProfile = resolve(profile);
  assert.equal(dirname(resolvedProfile), resolvedRoot, 'Chrome profile must be a direct child of the task root');
  assert(basename(resolvedProfile).startsWith(PROFILE_PREFIX), 'Chrome profile must use the task prefix');
}

async function pathExists(path) {
  return stat(path).then(() => true, (error) => {
    if (error.code === 'ENOENT') return false;
    throw error;
  });
}

async function enableDeveloperMode(context) {
  const page = await context.newPage();
  try {
    await page.goto('chrome://extensions/');
    const toggle = page.locator('#devMode');
    await toggle.waitFor({ state: 'visible' });
    if (!(await toggle.evaluate((element) => element.checked))) await toggle.click();
    assert(await toggle.evaluate((element) => element.checked), 'Chrome extension developer mode is disabled');
  } finally {
    await page.close();
  }
}

async function createPngFixtures(context) {
  const page = await context.newPage();
  try {
    await page.goto('about:blank');
    const encoded = await page.evaluate(() =>
      [
        { color: '#155a91', label: 'Fixture 1' },
        { color: '#9a5d16', label: 'Fixture 2' },
        { color: '#27764b', label: 'Fixture 3' },
      ].map(({ color, label }, index) => {
        const canvas = document.createElement('canvas');
        canvas.width = 480 + index * 80;
        canvas.height = 320 + index * 40;
        const drawing = canvas.getContext('2d');
        drawing.fillStyle = color;
        drawing.fillRect(0, 0, canvas.width, canvas.height);
        drawing.fillStyle = '#ffffff';
        drawing.font = 'bold 36px Segoe UI';
        drawing.fillText(label, 36, 72);
        return canvas.toDataURL('image/png').split(',')[1];
      })
    );
    return encoded.map((value) => Buffer.from(value, 'base64'));
  } finally {
    await page.close();
  }
}

function imageIndex(url) {
  const index = IMAGE_URL_MARKERS.findIndex((marker) => url.includes(marker));
  return index < 0 ? 0 : index;
}

async function installFixtureRoutes(context, root, pngs) {
  const html = await readFile(join(root, 'test/e2e/fixtures/installed-gallery-page.html'), 'utf8');
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === 'chrome-extension:') {
      await route.continue();
      return;
    }
    if (url.hostname === 'x.com' && route.request().isNavigationRequest()) {
      await route.fulfill({ contentType: 'text/html', body: html });
      return;
    }
    if (url.hostname === 'pbs.twimg.com') {
      await route.fulfill({
        contentType: 'image/png',
        body: pngs[imageIndex(url.href)],
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
      return;
    }
    await route.abort('blockedbyclient');
  });
}

async function queryDownloads(extensionPage) {
  return extensionPage.evaluate(() => chrome.downloads.search({ orderBy: ['-startTime'] }));
}

async function waitForDownload(extensionPage, knownIds, filename) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const item = (await queryDownloads(extensionPage)).find(
      (download) => !knownIds.has(download.id) && basename(download.filename) === filename
    );
    if (item?.state === 'complete') return item;
    if (item?.state === 'interrupted') {
      throw new Error(`Chrome interrupted ${filename}: ${item.error ?? 'unknown error'}`);
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for privileged download ${filename}`);
}

async function hostSnapshot(page, triggerIndex) {
  return page.evaluate((index) => {
    const trigger = document.querySelectorAll('[data-testid="tweetPhoto"] img')[index];
    const style = document.body.style;
    return {
      activeElementAlt: document.activeElement?.getAttribute('alt') ?? null,
      background: ['#host-layout-spacer', 'main'].map((selector) => {
        const element = document.querySelector(selector);
        return {
          ariaHidden: element?.getAttribute('aria-hidden') ?? null,
          hiddenMarker: element?.hasAttribute('data-xeg-gallery-hidden') ?? false,
          inert: element?.hasAttribute('inert') ?? false,
          selector,
        };
      }),
      bodyStyle: {
        left: style.left,
        overflow: style.overflow,
        position: style.position,
        right: style.right,
        top: style.top,
      },
      scrollRestoration: window.history.scrollRestoration,
      scrollY: window.scrollY,
      triggerAlt: trigger?.getAttribute('alt') ?? null,
    };
  }, triggerIndex);
}

async function runCycle({ cycle, downloads, extensionPage, output, page, pngs }) {
  const number = cycle.expectedIndex + 1;
  const trigger = page.locator('[data-testid="tweetPhoto"] img').nth(cycle.triggerIndex);
  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await trigger.focus();
  const before = await hostSnapshot(page, cycle.triggerIndex);
  assert(before.scrollY > 0, 'Fixture must begin from a nonzero scroll position');
  assert.equal(before.activeElementAlt, before.triggerAlt, 'Fixture trigger must hold focus before open');
  await page.screenshot({ path: join(output, `cycle-${number}-before.png`) });

  const openStarted = performance.now();
  await trigger.click();
  const gallery = page.locator('[data-xeg-gallery-container]');
  await gallery.waitFor({ state: 'visible', timeout: 15_000 });
  const openMs = performance.now() - openStarted;
  const progress = gallery.locator('[role="progressbar"]');
  assert.equal(Number(await progress.getAttribute('aria-valuenow')), cycle.triggerIndex + 1);

  const lateBackground = await page.evaluate(() => {
    const node = document.createElement('aside');
    node.id = 'late-host-panel';
    node.setAttribute('aria-hidden', 'false');
    node.textContent = 'Late host panel';
    document.body.append(node);
    return node.id;
  });
  await page.locator(`#${lateBackground}[data-xeg-gallery-hidden]`).waitFor({ state: 'attached' });

  let shiftedLayout = false;
  if (cycle.expectedIndex === 0) {
    await page.locator('#host-layout-spacer').evaluate((element) => {
      element.style.height = '3000px';
    });
    shiftedLayout = true;
  }

  const navigationStarted = performance.now();
  await page.keyboard.press(cycle.direction);
  await page.waitForFunction(
    (expected) =>
      document
        .querySelector('[data-xeg-gallery-container] [role="progressbar"]')
        ?.getAttribute('aria-valuenow') === String(expected),
    cycle.expectedIndex + 1
  );
  const navigationMs = performance.now() - navigationStarted;

  const knownIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const filename = expectedFilename(cycle.expectedIndex);
  const downloadStarted = performance.now();
  await gallery
    .locator('[data-gallery-element="toolbar"] button[aria-label="Download"]')
    .click();
  const download = await waitForDownload(extensionPage, knownIds, filename);
  const downloadMs = performance.now() - downloadStarted;
  assert.equal(typeof download.filename, 'string');
  const relativeDownload = relative(downloads, download.filename);
  assert(
    relativeDownload && !relativeDownload.startsWith('..') && !isAbsolute(relativeDownload),
    'Privileged download must remain inside the task-owned directory'
  );
  const bytes = await readFile(download.filename);
  assert(pngs[cycle.expectedIndex].equals(bytes), 'Downloaded bytes must match the selected fixture');
  const copiedName = `cycle-${number}-download.jpg`;
  await copyFile(download.filename, join(output, copiedName));

  const closeStarted = performance.now();
  if (cycle.close === 'button') {
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
  } else {
    await page.keyboard.press('Escape');
  }
  await gallery.waitFor({ state: 'detached' });
  const closeMs = performance.now() - closeStarted;
  const after = await hostSnapshot(page, cycle.triggerIndex);
  await page.screenshot({ path: join(output, `cycle-${number}-after.png`) });

  const lateState = await page.locator(`#${lateBackground}`).evaluate((element) => ({
    ariaHidden: element.getAttribute('aria-hidden'),
    hiddenMarker: element.hasAttribute('data-xeg-gallery-hidden'),
    inert: element.hasAttribute('inert'),
  }));
  assert.deepEqual(lateState, { ariaHidden: 'false', hiddenMarker: false, inert: false });
  assert.deepEqual(after.background, before.background, 'Gallery close must restore host isolation');
  assert.deepEqual(after.bodyStyle, before.bodyStyle, 'Gallery close must restore body inline styles');
  assert.equal(
    after.scrollRestoration,
    before.scrollRestoration,
    'Gallery close must restore history scroll behavior'
  );
  assert.equal(after.activeElementAlt, before.triggerAlt, 'Gallery close must restore trigger focus');
  assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0, 'Gallery must detach');

  if (shiftedLayout) {
    await page.locator('#host-layout-spacer').evaluate((element) => {
      element.style.height = '1200px';
    });
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), before.scrollY);
  }
  await page.locator(`#${lateBackground}`).evaluate((element) => element.remove());

  return {
    closeMethod: cycle.close,
    download: {
      bytes: bytes.length,
      file: copiedName,
      filename,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
    expectedIndex: cycle.expectedIndex,
    focusRestored: after.activeElementAlt === before.triggerAlt,
    layoutShiftedWhileOpen: shiftedLayout,
    scroll: { before: before.scrollY, after: after.scrollY, restored: after.scrollY === before.scrollY },
    timingsMs: { close: closeMs, download: downloadMs, navigation: navigationMs, open: openMs },
  };
}

async function exerciseInstalledExtension(context, extensionId, root, output, downloads, pngs) {
  await installFixtureRoutes(context, root, pngs);
  const extensionPage = await context.newPage();
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  try {
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    assert.equal(
      await extensionPage.evaluate(() => chrome.runtime.getManifest().name),
      'X.com Enhanced Gallery'
    );
    await page.goto(FIXTURE_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached', timeout: 15_000 });
    const cycles = [];
    for (const cycle of CYCLES) {
      cycles.push(await runCycle({ cycle, downloads, extensionPage, output, page, pngs }));
    }
    assert.deepEqual(pageErrors, [], 'Installed content script must not raise page errors');
    assert.deepEqual(consoleErrors, [], 'Installed content script must not log console errors');
    assert(cycles.every(({ scroll }) => scroll.restored), 'Every close must restore the saved scroll position');
    return { cycles, pageErrors, consoleErrors };
  } catch (error) {
    await page.screenshot({ path: join(output, 'installed-flow-error.png') }).catch(() => {});
    throw error;
  } finally {
    await Promise.allSettled([page.close(), extensionPage.close()]);
  }
}

export async function run({ chromium, root, output, browserName, headless, installation, liveUrls }) {
  assert(['chrome', 'msedge'].includes(browserName), 'Installed XCOM profile supports Chrome and Edge only');
  assert.equal(installation, 'extension', 'Installed XCOM profile supports extension installation only');
  assert.deepEqual(liveUrls, [], 'Installed XCOM fixture does not accept live URLs');
  await mkdir(output, { recursive: true });
  const profile = await mkdtemp(join(root, PROFILE_PREFIX));
  const downloads = join(profile, 'downloads');
  await mkdir(downloads);
  assertOwnedProfile(root, profile);

  let context;
  let cdp;
  let extensionId;
  let primaryError;
  const cleanupErrors = [];
  const result = {
    browserName,
    cleanup: {},
    installation,
    installationMethod: 'cdp-unpacked-extension',
    liveUrls: [],
    scope: 'deterministic fixture; no live or authenticated X.com, native Save As, Explorer, or performance claim',
    status: 'failed',
  };
  try {
    context = await chromium.launchPersistentContext(profile, {
      channel: browserName,
      headless,
      acceptDownloads: true,
      downloadsPath: downloads,
      locale: 'en-US',
      viewport: { width: 1280, height: 800 },
      ignoreDefaultArgs: ['--disable-extensions'],
      args: ['--enable-unsafe-extension-debugging'],
    });
    result.browserVersion = context.browser().version();
    await enableDeveloperMode(context);
    cdp = await context.browser().newBrowserCDPSession();
    ({ id: extensionId } = await cdp.send('Extensions.loadUnpacked', {
      path: join(root, 'dist-extension'),
    }));
    assert.equal(typeof extensionId, 'string');
    const pngs = await createPngFixtures(context);
    result.fixture = await exerciseInstalledExtension(
      context,
      extensionId,
      root,
      output,
      downloads,
      pngs
    );
    result.status = 'passed';
  } catch (error) {
    primaryError = error;
    result.error = safeError(error);
  } finally {
    if (cdp && extensionId) {
      try {
        await cdp.send('Extensions.uninstall', { id: extensionId });
        result.cleanup.extensionUninstalled = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    try {
      await context?.close();
      result.cleanup.browserClosed = true;
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (result.cleanup.browserClosed) {
      try {
        assertOwnedProfile(root, profile);
        await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
        assert.equal(await pathExists(profile), false, 'Task-owned Chrome profile remained after cleanup');
        result.cleanup.profileRemoved = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    } else {
      result.cleanup.profilePreserved = true;
    }
    result.cleanup.errorCount = cleanupErrors.length;
    if (cleanupErrors.length) {
      result.status = 'failed';
      result.cleanup.errors = cleanupErrors.map(safeError);
    }
    await writeFile(join(output, 'installation-result.json'), JSON.stringify(result, null, 2));
  }
  if (primaryError && cleanupErrors.length) {
    throw new AggregateError([primaryError, ...cleanupErrors], 'Installed flow and cleanup failed');
  }
  if (primaryError) throw primaryError;
  if (cleanupErrors.length) throw new AggregateError(cleanupErrors, 'Installed flow cleanup failed');
  return result;
}
