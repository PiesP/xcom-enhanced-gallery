// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash, randomUUID } from 'node:crypto';
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
import {
  observeLiveUrls,
  validateLiveObservation,
  validateLiveUrls,
} from './live-page.mjs';

const PROFILE_PREFIX = 'xeg-chrome-install-';
const DEFAULT_NOTIFICATION_ICON = 'icons/icon-128x128.png';
const TWEET_ID = '1234567890123456789';
const FIXTURE_URL = `https://x.com/testuser/status/${TWEET_ID}`;
const PUBLIC_TWEET_ID = '9876543210987654321';
const PUBLIC_FIXTURE_URL = `https://x.com/public_user/status/${PUBLIC_TWEET_ID}`;
const IMAGE_URL_MARKERS = ['GkE1234', 'GkE5678', 'GkE9012'];
const MAX_AGGREGATE_DEPTH = 2;
const MAX_AGGREGATE_ERRORS = 4;
const MAX_ERROR_SUMMARY_LENGTH = 2000;
const CYCLES = [
  { close: 'escape', direction: 'ArrowLeft', expectedIndex: 0, triggerIndex: 1 },
  { close: 'button', direction: 'ArrowRight', expectedIndex: 1, triggerIndex: 0 },
  { close: 'escape', direction: 'ArrowRight', expectedIndex: 2, triggerIndex: 1 },
];

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function safeError(error, depth = 0) {
  const rawSummary = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  const summary = rawSummary.length > MAX_ERROR_SUMMARY_LENGTH
    ? `${rawSummary.slice(0, MAX_ERROR_SUMMARY_LENGTH)}...`
    : rawSummary;
  if (!(error instanceof AggregateError) || depth >= MAX_AGGREGATE_DEPTH) return summary;

  const nestedErrors = Array.from(error.errors);
  const details = nestedErrors
    .slice(0, MAX_AGGREGATE_ERRORS)
    .map((nestedError) => safeError(nestedError, depth + 1));
  if (nestedErrors.length > MAX_AGGREGATE_ERRORS) {
    details.push(`${nestedErrors.length - MAX_AGGREGATE_ERRORS} more errors`);
  }
  return details.length ? `${summary} [${details.join('; ')}]` : summary;
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

async function verifyDownloadDirectory(context, downloads) {
  const page = await context.newPage();
  try {
    await page.goto('chrome://settings/downloads');
    const directory = await page.evaluate(() => new Promise((resolveDirectory) => {
      chrome.settingsPrivate.getPref('download.default_directory', (preference) => {
        resolveDirectory(preference.value);
      });
    }));
    assert.equal(resolve(directory), resolve(downloads), 'Chrome must use the task-owned download directory');
  } finally {
    await page.close();
  }
}

async function createImageFixtures(context) {
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
        return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
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

async function installFixtureRoutes(context, root, images) {
  const html = await readFile(join(root, 'test/e2e/fixtures/installed-gallery-page.html'), 'utf8');
  const apiResponses = [];
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === 'chrome-extension:') {
      await route.continue();
      return;
    }
    if (url.hostname === 'x.com' && url.pathname === '/favicon.ico') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    if (url.hostname === 'x.com' && url.pathname.endsWith('/TweetResultByRestId')) {
      apiResponses.push({ method: route.request().method(), status: 403, url: url.pathname });
      await route.fulfill({ status: 403, contentType: 'application/json', body: '{}' });
      return;
    }
    if (url.hostname === 'x.com' && route.request().isNavigationRequest()) {
      await route.fulfill({
        contentType: 'text/html',
        body: url.pathname === new URL(PUBLIC_FIXTURE_URL).pathname
          ? html.replace(
              '<body data-fixture-route="classic">',
              '<body data-fixture-route="public">'
            )
          : html,
      });
      return;
    }
    if (url.hostname === 'pbs.twimg.com') {
      await route.fulfill({
        contentType: 'image/jpeg',
        body: images[imageIndex(url.href)],
        headers: {
          'Access-Control-Allow-Origin': 'https://x.com',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
      return;
    }
    await route.abort('blockedbyclient');
  });
  return { apiResponses };
}

async function queryDownloads(extensionPage) {
  return extensionPage.evaluate(() => chrome.downloads.search({ orderBy: ['-startTime'] }));
}

async function verifyPackagedIcons(extensionPage) {
  const icons = await extensionPage.evaluate(async () => {
    const declarations = Object.entries(chrome.runtime.getManifest().icons ?? {});
    if (!declarations.length) throw new Error('Installed extension manifest has no icons');

    return Promise.all(
      declarations.map(async ([size, path]) => {
        const declaredSize = Number(size);
        const dimensions = await new Promise((resolveImage, rejectImage) => {
          const image = new Image();
          image.addEventListener(
            'load',
            () => {
              resolveImage({ height: image.naturalHeight, width: image.naturalWidth });
            },
            { once: true }
          );
          image.addEventListener(
            'error',
            () => {
              rejectImage(new Error(`Failed to decode manifest icon ${size}: ${path}`));
            },
            { once: true }
          );
          image.src = chrome.runtime.getURL(path);
        });
        return { declaredSize, height: dimensions.height, path, width: dimensions.width };
      })
    );
  });

  for (const icon of icons) {
    assert(
      Number.isSafeInteger(icon.declaredSize) && icon.declaredSize > 0,
      `Manifest icon size must be a positive integer: ${icon.declaredSize}`
    );
    assert.equal(
      icon.width,
      icon.declaredSize,
      `Manifest icon ${icon.path} intrinsic width must match ${icon.declaredSize}`
    );
    assert.equal(
      icon.height,
      icon.declaredSize,
      `Manifest icon ${icon.path} intrinsic height must match ${icon.declaredSize}`
    );
  }

  const defaultNotificationIcon = icons.find((icon) => icon.declaredSize === 128);
  assert.equal(
    defaultNotificationIcon?.path,
    DEFAULT_NOTIFICATION_ICON,
    'Installed manifest icon 128 must match the production notification fallback'
  );

  return { count: icons.length, defaultNotificationIcon: DEFAULT_NOTIFICATION_ICON, icons };
}

async function verifyDefaultNotification(extensionPage) {
  const id = `xeg-installed-validation-${randomUUID()}`;
  const payload = {
    id,
    title: `XEG installed validation ${id}`,
    message: `Default notification icon validation ${id}`,
  };
  let validation;
  let validationError;
  let validationErrorSeen = false;
  let cleanup;
  let cleanupError;
  let cleanupErrorSeen = false;

  try {
    validation = await extensionPage.evaluate(async (notification) => {
      const response = await chrome.runtime.sendMessage({
        type: 'SHOW_NOTIFICATION',
        payload: notification,
      });
      const active = await chrome.notifications.getAll();
      return { active: Object.hasOwn(active, notification.id), response };
    }, payload);
    assert.deepEqual(
      validation.response,
      { success: true },
      'Default notification request must succeed'
    );
    assert.equal(
      validation.active,
      true,
      'Created default notification must be returned by chrome.notifications.getAll'
    );
  } catch (error) {
    validationErrorSeen = true;
    validationError = error;
  } finally {
    try {
      cleanup = await extensionPage.evaluate(async (notificationId) => {
        const cleared = await chrome.notifications.clear(notificationId);
        const active = await chrome.notifications.getAll();
        return { active: Object.hasOwn(active, notificationId), cleared };
      }, id);
      if (!validationErrorSeen) {
        assert.equal(
          cleanup.cleared,
          true,
          'Validation notification must be cleared by its exact ID'
        );
      }
      assert.equal(
        cleanup.active,
        false,
        'Validation notification must be absent after exact-ID cleanup'
      );
    } catch (error) {
      cleanupErrorSeen = true;
      cleanupError = error;
    }
  }

  if (validationErrorSeen && cleanupErrorSeen) {
    throw new AggregateError(
      [validationError, cleanupError],
      `Default notification validation and cleanup failed: ${safeError(validationError)}; ${safeError(cleanupError)}`
    );
  }
  if (validationErrorSeen) throw validationError;
  if (cleanupErrorSeen) throw cleanupError;
  return {
    cleared: cleanup.cleared,
    defaultIcon: DEFAULT_NOTIFICATION_ICON,
    id,
    imageUrlOmitted: true,
    observed: validation.active,
  };
}

async function waitForDownload(extensionPage, knownIds, filename) {
  const deadline = Date.now() + 20_000;
  let observed = [];
  while (Date.now() < deadline) {
    observed = (await queryDownloads(extensionPage)).filter((download) => !knownIds.has(download.id));
    const item = observed.find(
      (download) => !knownIds.has(download.id) && basename(download.filename) === filename
    );
    if (item?.state === 'complete') return item;
    if (item?.state === 'interrupted') {
      throw new Error(`Chrome interrupted ${filename}: ${item.error ?? 'unknown error'}`);
    }
    await delay(100);
  }
  throw new Error(`Timed out waiting for privileged download ${filename}: ${JSON.stringify(
    observed.map(({ filename: name, state, error }) => ({ filename: basename(name), state, error }))
  )}`);
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

function isExpectedFixtureApiConsoleError(record) {
  try {
    return new URL(record.location).pathname.endsWith('/TweetResultByRestId') &&
      /\b403\b/u.test(record.text);
  } catch {
    return false;
  }
}

async function runPublicFixtureCycle({ apiResponses, output, page }) {
  await page.goto(PUBLIC_FIXTURE_URL);
  await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
    state: 'attached',
    timeout: 15_000,
  });
  const trigger = page.locator(
    'article:not([data-testid]) .public-media a[aria-label="View media"]'
  ).nth(1);
  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await trigger.focus();
  const before = await trigger.evaluate((element) => {
    const image = element.parentElement?.querySelector('img');
    if (!(image instanceof HTMLImageElement)) throw new Error('Public fixture image missing');
    const rectangle = image.getBoundingClientRect();
    const x = rectangle.left + rectangle.width / 2;
    const y = rectangle.top + rectangle.height / 2;
    const topAction = document.elementsFromPoint(x, y)
      .map((candidate) => candidate.closest('a[href]')).find(Boolean);
    const matchingActions = [...(element.closest('article')?.querySelectorAll('a[href]') ?? [])]
      .filter((anchor) => anchor.getAttribute('href') === element.getAttribute('href'));
    const style = document.body.style;
    return {
      active: document.activeElement === element,
      bodyStyle: {
        left: style.left,
        overflow: style.overflow,
        position: style.position,
        right: style.right,
        top: style.top,
      },
      duplicateActionCount: matchingActions.length,
      scrollRestoration: history.scrollRestoration,
      scrollY: window.scrollY,
      topAction: topAction === element,
    };
  });
  assert.equal(before.active, true, 'Public fixture trigger must hold focus before open');
  assert.equal(before.duplicateActionCount, 2, 'Public fixture must retain both same-href actions');
  assert.equal(before.topAction, true, 'View media overlay must be the hit-tested top action');
  assert(before.scrollY > 0, 'Public fixture must begin from a nonzero scroll position');
  await page.screenshot({ path: join(output, 'public-dom-before.png') });

  const apiCountBefore = apiResponses.length;
  await trigger.click();
  const gallery = page.locator('[data-xeg-gallery-container]');
  await gallery.waitFor({ state: 'visible', timeout: 15_000 });
  assert.equal(await gallery.getAttribute('role'), 'dialog');
  assert.equal(await gallery.getAttribute('aria-modal'), 'true');
  assert.equal(
    await gallery.locator('[role="progressbar"]').getAttribute('aria-valuenow'),
    '2',
    'Public View media overlay must select the second image'
  );
  await page.waitForFunction(() =>
    [...document.querySelectorAll('[data-xeg-gallery-container] [data-gallery-element="item"] img')]
      .some((image) => image instanceof HTMLImageElement && image.src.includes('GkE5678') &&
        image.complete && image.naturalWidth > 1),
  undefined, { timeout: 15_000 });
  const galleryImageCount = await gallery.locator('[data-gallery-element="item"] img').count();
  assert.equal(galleryImageCount, 2, 'Public fixture gallery must exclude the account avatar');
  assert.equal(apiResponses.length, apiCountBefore + 1, 'Public fixture must request TweetResultByRestId once');
  assert.equal(apiResponses.at(-1)?.status, 403, 'Public fixture API route must return 403');
  await page.screenshot({ path: join(output, 'public-dom-gallery.png') });

  await page.keyboard.press('Escape');
  await gallery.waitFor({ state: 'detached', timeout: 15_000 });
  const after = await trigger.evaluate((element) => {
    const style = document.body.style;
    return {
      active: document.activeElement === element,
      bodyStyle: {
        left: style.left,
        overflow: style.overflow,
        position: style.position,
        right: style.right,
        top: style.top,
      },
      scrollRestoration: history.scrollRestoration,
      scrollY: window.scrollY,
    };
  });
  assert.equal(after.active, true, 'Public fixture close must restore exact trigger focus');
  assert.equal(after.scrollY, before.scrollY, 'Public fixture close must restore scroll');
  assert.equal(after.scrollRestoration, before.scrollRestoration);
  assert.deepEqual(after.bodyStyle, before.bodyStyle, 'Public fixture close must restore body styles');
  await page.screenshot({ path: join(output, 'public-dom-after.png') });

  return {
    api: apiResponses.slice(apiCountBefore),
    clickedIndex: 1,
    duplicateActionCount: before.duplicateActionCount,
    focusRestored: after.active,
    galleryImageCount,
    loadedSelectedImage: true,
    scroll: { before: before.scrollY, after: after.scrollY, restored: after.scrollY === before.scrollY },
    topActionHitTested: before.topAction,
  };
}

async function runCycle({ cycle, downloads, extensionPage, output, page, images }) {
  const number = cycle.expectedIndex + 1;
  const trigger = page.locator('[data-testid="tweetPhoto"] img').nth(cycle.triggerIndex);
  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await trigger.focus();
  const before = await hostSnapshot(page, cycle.triggerIndex);
  assert(before.scrollY > 0, 'Fixture must begin from a nonzero scroll position');
  assert.equal(before.activeElementAlt, before.triggerAlt, 'Fixture trigger must hold focus before open');
  await page.screenshot({ path: join(output, `cycle-${number}-before.png`) });

  await trigger.evaluate((element) => {
    element.addEventListener('pointerdown', () => {
      // Playwright may scroll the trigger into view before dispatching input.
      // Observe the host state at the actual opening interaction boundary.
      element.dataset.openingScrollY = String(window.scrollY);
    }, { once: true, capture: true });
  });

  const openStarted = performance.now();
  await trigger.click();
  before.scrollY = Number(await trigger.getAttribute('data-opening-scroll-y'));
  assert(Number.isFinite(before.scrollY) && before.scrollY > 0, 'Opening scroll must be observed');
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
  assert(images[cycle.expectedIndex].equals(bytes), 'Downloaded bytes must match the selected fixture');
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

async function exerciseInstalledExtension(context, extensionId, root, output, downloads, images) {
  const fixtureRoutes = await installFixtureRoutes(context, root, images);
  const extensionPage = await context.newPage();
  const page = await context.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  const cycles = [];
  let packagingAssets;
  let notification;
  let publicDom;
  let flowResult;
  let primaryError;
  let primarySeen = false;
  let observationError;
  let observationErrorSeen = false;
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push({ location: message.location().url, text: message.text() });
    }
  });
  page.on('requestfailed', (request) => {
    const url = new URL(request.url());
    failedRequests.push({ host: url.hostname, path: url.pathname, error: request.failure()?.errorText });
  });
  try {
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    assert.equal(
      await extensionPage.evaluate(() => chrome.runtime.getManifest().name),
      'X.com Enhanced Gallery'
    );
    packagingAssets = await verifyPackagedIcons(extensionPage);
    notification = await verifyDefaultNotification(extensionPage);
    await page.goto(FIXTURE_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached', timeout: 15_000 });
    for (const cycle of CYCLES) {
      cycles.push(await runCycle({ cycle, downloads, extensionPage, output, page, images }));
    }
    publicDom = await runPublicFixtureCycle({
      apiResponses: fixtureRoutes.apiResponses,
      output,
      page,
    });
    const unexpectedConsoleErrors = consoleErrors.filter(
      (record) => !isExpectedFixtureApiConsoleError(record)
    );
    assert.deepEqual(pageErrors, [], 'Installed content script must not raise page errors');
    assert.deepEqual(
      unexpectedConsoleErrors,
      [],
      'Installed fixture must not log errors beyond its exact mocked API 403'
    );
    assert(cycles.every(({ scroll }) => scroll.restored), 'Every close must restore the saved scroll position');
    flowResult = {
      cycles,
      pageErrors,
      consoleErrors,
      fixtureApiResponses: fixtureRoutes.apiResponses,
      notification,
      packagingAssets,
      publicDom,
    };
  } catch (error) {
    primarySeen = true;
    primaryError = error;
    await page.screenshot({ path: join(output, 'installed-flow-error.png') }).catch(() => {});
  } finally {
    try {
      await writeFile(
        join(output, 'installed-flow-observations.json'),
        JSON.stringify(
          {
            cycles,
            pageErrors,
            consoleErrors,
            failedRequests,
            fixtureApiResponses: fixtureRoutes.apiResponses,
            notification,
            packagingAssets,
            publicDom,
          },
          null,
          2
        )
      );
    } catch (error) {
      observationErrorSeen = true;
      observationError = error;
    } finally {
      await Promise.allSettled([page.close(), extensionPage.close()]);
    }
  }
  if (primarySeen && observationErrorSeen) {
    throw new AggregateError(
      [primaryError, observationError],
      `Installed flow and observation evidence write failed: ${safeError(primaryError)}; ${safeError(observationError)}`
    );
  }
  if (primarySeen) throw primaryError;
  if (observationErrorSeen) throw observationError;
  return flowResult;
}

export async function run({
  chromium,
  root,
  output,
  browserName,
  headless,
  installation,
  liveUrls,
  liveObservation,
}) {
  assert(['chrome', 'msedge'].includes(browserName), 'Installed XCOM profile supports Chrome and Edge only');
  assert.equal(installation, 'extension', 'Installed XCOM profile supports extension installation only');
  const validatedLiveUrls = validateLiveUrls(liveUrls);
  validateLiveObservation(liveObservation);
  await mkdir(output, { recursive: true });
  const profile = await mkdtemp(join(root, PROFILE_PREFIX));
  const downloads = join(profile, 'downloads');
  await mkdir(downloads);
  assertOwnedProfile(root, profile);
  await mkdir(join(profile, 'Default'));
  await writeFile(join(profile, 'Default', 'Preferences'), JSON.stringify({
    download: { default_directory: downloads, prompt_for_download: false, directory_upgrade: true },
  }));

  let context;
  let cdp;
  let extensionId;
  let primaryError;
  let primarySeen = false;
  let installationResultError;
  let installationResultErrorSeen = false;
  const cleanupErrors = [];
  const result = {
    browserName,
    cleanup: {},
    installation,
    installationMethod: 'cdp-unpacked-extension',
    liveUrls: validatedLiveUrls,
    liveObservation,
    scope: validatedLiveUrls.length
      ? 'deterministic fixture followed by opt-in public X status diagnostics; no auth, consent, CAPTCHA, live download, native Save As, Explorer, or performance claim'
      : 'deterministic fixture; no live or authenticated X.com, native Save As, Explorer, or performance claim',
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
    await verifyDownloadDirectory(context, downloads);
    cdp = await context.browser().newBrowserCDPSession();
    // Use Chrome's download manager and this fresh profile's directory preference
    // so the extension's filename selection reaches the normal browser delegate.
    await cdp.send('Browser.setDownloadBehavior', {
      behavior: 'default', eventsEnabled: true,
    });
    ({ id: extensionId } = await cdp.send('Extensions.loadUnpacked', {
      path: join(root, 'dist-extension'),
    }));
    assert.equal(typeof extensionId, 'string');
    const images = await createImageFixtures(context);
    result.fixture = await exerciseInstalledExtension(
      context,
      extensionId,
      root,
      output,
      downloads,
      images
    );
    await context.unrouteAll({ behavior: 'wait' });
    result.live = await observeLiveUrls({
      context,
      extensionId,
      liveUrls: validatedLiveUrls,
      output,
    });
    result.evidenceStatus = validatedLiveUrls.length
      ? result.live.evidenceStatus
      : 'fixture-observed';
    result.status = 'passed';
  } catch (error) {
    primarySeen = true;
    primaryError = error;
    result.error = safeError(error);
    if (error && typeof error === 'object' && 'summary' in error) result.live = error.summary;
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
    try {
      await writeFile(join(output, 'installation-result.json'), JSON.stringify(result, null, 2));
    } catch (error) {
      installationResultErrorSeen = true;
      installationResultError = error;
    }
  }
  const combinedErrors = [
    ...(primarySeen ? [primaryError] : []),
    ...cleanupErrors,
    ...(installationResultErrorSeen ? [installationResultError] : []),
  ];
  if (combinedErrors.length > 1) {
    const failedStages = [
      ...(primarySeen ? ['installed flow'] : []),
      ...(cleanupErrors.length ? ['cleanup'] : []),
      ...(installationResultErrorSeen ? ['installation result write'] : []),
    ];
    throw new AggregateError(
      combinedErrors,
      `${failedStages.join(', ')} failed: ${combinedErrors.map((error) => safeError(error)).join('; ')}`
    );
  }
  if (primarySeen) throw primaryError;
  if (cleanupErrors.length) {
    throw new AggregateError(
      cleanupErrors,
      `Installed flow cleanup failed: ${cleanupErrors.map((error) => safeError(error)).join('; ')}`
    );
  }
  if (installationResultErrorSeen) throw installationResultError;
  return result;
}
