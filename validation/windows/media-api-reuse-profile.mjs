// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const API_ROUTE = '**/TweetResultByRestId*';
const GALLERY = '[data-xeg-gallery-container]';
const READY = 'html[data-xeg-gallery-ready="true"]';
const MAX_OBSERVATIONS = 32;
const RETRY_AFTER_SECONDS = 3;

function targetRequest(route, tweetId) {
  const url = new URL(route.request().url());
  if (url.hostname !== 'x.com' || !url.pathname.endsWith('/TweetResultByRestId')) return false;
  try {
    return JSON.parse(url.searchParams.get('variables') ?? '{}').tweetId === tweetId;
  } catch {
    return false;
  }
}

async function readyPage(page, url) {
  await page.goto(url);
  await page.locator(READY).waitFor({ state: 'attached', timeout: 15_000 });
}

async function openAndClose(page, index, imagePaths, expectedUrl, original,
  verifyOrigin = true) {
  const trigger = page.locator(
    '[data-route="classic"][data-phase="normal"] [data-testid="tweetPhoto"] img'
  ).nth(index);
  assert.equal(await trigger.count(), 1, 'Expected quality fixture photo is missing');
  const clickedAtMonotonicMs = performance.now();
  await trigger.click();
  const gallery = page.locator(GALLERY);
  await gallery.waitFor({ state: 'visible', timeout: 15_000 });
  const selection = await page.waitForFunction(({ index: selectedIndex }) => {
    const root = document.querySelector('[data-xeg-gallery-container]');
    const toolbar = root?.querySelector('[data-gallery-element="toolbar"]');
    const counter = toolbar?.querySelector('#xeg-toolbar-counter');
    const item = root?.querySelector(
      `[data-gallery-element="item"][data-index="${selectedIndex}"]`
    );
    const image = item?.querySelector('img');
    if (counter?.getAttribute('data-position') !== String(selectedIndex + 1) ||
        counter?.getAttribute('data-total') !== '3' ||
        counter?.getAttribute('data-focused-index') !== String(selectedIndex) ||
        toolbar?.getAttribute('data-current-index') !== String(selectedIndex) ||
        toolbar?.getAttribute('data-focused-index') !== String(selectedIndex) ||
        !(image instanceof HTMLImageElement) || !image.complete || image.naturalWidth === 0 ||
        item?.getAttribute('data-media-loaded') !== 'true') return false;
    return { source: image.currentSrc || image.src,
      width: image.naturalWidth, height: image.naturalHeight };
  }, { index }, { timeout: 15_000 }).then((handle) => handle.jsonValue());
  assert(selection, 'Selected quality photo did not become ready');
  const source = new URL(selection.source);
  assert.equal(source.hostname, 'pbs.twimg.com');
  assert.equal(source.pathname, `/media/${imagePaths[index]}`,
    'Selected photo belongs to another attachment');
  assert.equal(source.searchParams.get('format'), 'jpg',
    'Selected fixture photo has an unexpected file format');
  if (original) {
    assert.equal(source.searchParams.get('name'), 'orig',
      'Healthy API selection must use its original photo');
    assert.equal(selection.width, 480 + index * 80);
    assert.equal(selection.height, 320 + index * 40);
  }
  if (verifyOrigin) {
    const sourceButton = gallery.locator('#tweet-text-button');
    assert.equal(await sourceButton.count(), 1);
    await sourceButton.click();
    const origin = gallery.locator('#toolbar-tweet-panel a[href^="https://x.com/"]');
    await origin.waitFor({ state: 'visible' });
    assert.equal(await origin.getAttribute('href'), expectedUrl,
      'Selected attachment has the wrong originating post');
    await sourceButton.click();
  }
  await page.keyboard.press('Escape');
  await gallery.waitFor({ state: 'detached', timeout: 15_000 });
  return { index, clickedAtMonotonicMs, path: source.pathname,
    original: source.searchParams.get('name') === 'orig',
    width: selection.width, height: selection.height };
}

/**
 * Optional native installed-extension acceptance, called after installFixtureRoutes.
 * The caller owns the installed context, extension and three-photo quality fixture.
 * This helper intercepts only the fixture's API requests and owns its new pages.
 */
export async function runInstalledMediaApiReuseProfile({
  context, page, qualityFixtureUrl, qualityTweetId, qualityImagePaths, output,
}) {
  assert(context && page, 'Installed browser context and page are required');
  assert.equal(qualityImagePaths?.length, 3, 'Three quality fixture paths are required');
  assert.equal(new URL(qualityFixtureUrl).pathname,
    `/qualityuser/status/${qualityTweetId}`, 'Expected installed quality fixture route');

  const requests = [];
  const ownedPages = [];
  const observedPages = [];
  const pageErrors = [];
  const consoleErrors = [];
  let errorOverflow = false;
  let activePage = page;
  const originalPageUrl = page.url();
  let variant = 'healthy';
  const routeHandler = async (route) => {
    if (!targetRequest(route, qualityTweetId)) return route.fallback();
    assert(requests.length < MAX_OBSERVATIONS, 'API reuse observation overflow');
    const record = { variant, method: route.request().method(),
      status: { healthy: 200, denied: 403, 'rate-limited': 429,
        'unreadable-retry': 503, 'provider-error': 200, malformed: 200,
        'malformed-wrapper': 200 }[variant],
      requestedAtMonotonicMs: performance.now() };
    requests.push(record);
    assert.equal(record.method, 'GET');
    if (variant === 'healthy') return route.fallback();
    if (variant === 'denied') {
      await route.fulfill({ status: 403, contentType: 'application/json',
        headers: { 'Retry-After': String(RETRY_AFTER_SECONDS) }, body: '{}' });
    } else if (variant === 'rate-limited') {
      await route.fulfill({ status: 429, contentType: 'application/json',
        headers: { 'Retry-After': String(RETRY_AFTER_SECONDS) }, body: '{}' });
    } else if (variant === 'unreadable-retry') {
      // The installed MV3 adapter retains 503 and Retry-After on JSON body-read failure.
      await route.fulfill({ status: 503, contentType: 'application/json',
        headers: { 'Retry-After': String(RETRY_AFTER_SECONDS) }, body: '{' });
    } else if (variant === 'provider-error') {
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ errors: [{ code: 88, message: 'fixture provider error' }] }) });
    } else if (variant === 'malformed') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    } else if (variant === 'malformed-wrapper') {
      await route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ data: { tweetResult: { result: {
          __typename: 'UnexpectedFixtureWrapper', tweet: { __typename: 'Tweet' },
        } } } }) });
    } else {
      throw new Error('Unknown API reuse fixture variant');
    }
    record.fulfilledAtMonotonicMs = performance.now();
  };
  const observePage = (observed) => {
    const observedVariant = variant;
    const onPageError = (error) => {
      if (pageErrors.length < MAX_OBSERVATIONS) pageErrors.push(error.message.slice(0, 500));
      else errorOverflow = true;
    };
    const onConsole = (message) => {
      if (message.type() !== 'error') return;
      let apiLocation = false;
      try {
        const url = new URL(message.location().url);
        apiLocation = url.hostname === 'x.com' &&
          url.pathname.endsWith('/TweetResultByRestId') &&
          JSON.parse(url.searchParams.get('variables') ?? '{}').tweetId === qualityTweetId;
      } catch { /* A missing location cannot identify an expected transport error. */ }
      const text = message.text().slice(0, 500);
      const status = /Failed to load resource: the server responded with a status of (403|429|503)(?:\D|$)/u
        .exec(text)?.[1];
      const expected = apiLocation && status !== undefined &&
        requests.some((request) => request.variant === observedVariant && request.status === Number(status));
      if (consoleErrors.length < MAX_OBSERVATIONS) {
        consoleErrors.push({ variant: observedVariant, text, expected });
      } else errorOverflow = true;
    };
    observed.on('pageerror', onPageError);
    observed.on('console', onConsole);
    observedPages.push({ page: observed, onPageError, onConsole });
  };
  const count = (name) => requests.filter((request) => request.variant === name).length;
  const newFixturePage = async (url = qualityFixtureUrl) => {
    const owned = await context.newPage();
    ownedPages.push(owned);
    observePage(owned);
    activePage = owned;
    await readyPage(owned, url);
    return owned;
  };
  const cases = [];
  const evidence = { status: 'running', cases, requests, pageErrors, consoleErrors,
    cleanup: { routesRemoved: false, pagesClosed: false, pageRestored: false } };
  let primaryError;

  observePage(page);
  await context.route(API_ROUTE, routeHandler);
  try {
    await readyPage(page, qualityFixtureUrl);
    const reuseStarted = performance.now();
    for (const index of [1, 2]) {
      const selection = await openAndClose(page, index, qualityImagePaths,
        qualityFixtureUrl, true);
      assert.equal(count('healthy'), 1,
        'Different attachments reopened within the reuse window must share one API request');
      cases.push({ case: `reuse-${index}`, ...selection, apiRequests: count('healthy') });
    }
    const reuseElapsedMs = performance.now() - reuseStarted;
    assert(reuseElapsedMs < 5_000, 'Repeated opens exceeded the five-second reuse window');

    const navigated = new URL(qualityFixtureUrl);
    navigated.searchParams.set('api-reuse-navigation', '1');
    await readyPage(page, navigated.href);
    await openAndClose(page, 0, qualityImagePaths, qualityFixtureUrl, true);
    assert.equal(count('healthy'), 2, 'Navigation must start a fresh API request');
    cases.push({ case: 'navigation', apiRequests: count('healthy') });

    await page.reload();
    await page.locator(READY).waitFor({ state: 'attached', timeout: 15_000 });
    await openAndClose(page, 2, qualityImagePaths, qualityFixtureUrl, true);
    assert.equal(count('healthy'), 3, 'Reload must start a fresh API request');
    cases.push({ case: 'reload', apiRequests: count('healthy') });

    const separatePage = await newFixturePage();
    await openAndClose(separatePage, 1, qualityImagePaths, qualityFixtureUrl, true);
    assert.equal(count('healthy'), 4, 'A second page must start a fresh API request');
    cases.push({ case: 'new-page', apiRequests: count('healthy') });

    for (const [name, expectedRequests] of [
      ['denied', 2], ['rate-limited', 1], ['unreadable-retry', 1],
      ['provider-error', 2], ['malformed', 2], ['malformed-wrapper', 2],
    ]) {
      variant = name;
      const failurePage = await newFixturePage();
      const started = performance.now();
      await openAndClose(failurePage, 1, qualityImagePaths, qualityFixtureUrl, false, false);
      assert.equal(count(name), 1, `${name} must first make one API request`);
      const second = await openAndClose(failurePage, 2, qualityImagePaths,
        qualityFixtureUrl, false, false);
      const elapsedMs = performance.now() - started;
      if (expectedRequests === 1) {
        const firstFulfilled = requests.find((request) => request.variant === name)
          ?.fulfilledAtMonotonicMs;
        assert(firstFulfilled !== undefined &&
          second.clickedAtMonotonicMs - firstFulfilled < RETRY_AFTER_SECONDS * 1_000,
        `${name} second click missed the bounded Retry-After window`);
      }
      assert.equal(count(name), expectedRequests,
        `${name} made an unexpected number of physical API requests`);
      const immediateApiRequests = count(name);
      if (expectedRequests === 1) {
        const firstFulfilled = requests.find((request) => request.variant === name)
          .fulfilledAtMonotonicMs;
        const remainingMs = Math.max(0,
          firstFulfilled + RETRY_AFTER_SECONDS * 1_000 + 100 - performance.now());
        if (remainingMs > 0) await new Promise((resolve) => setTimeout(resolve, remainingMs));
        await openAndClose(failurePage, 0, qualityImagePaths, qualityFixtureUrl, false, false);
        assert.equal(count(name), 2, `${name} must retry after the server wait`);
      }
      cases.push({ case: name, immediateApiRequests,
        afterWaitApiRequests: count(name), elapsedMs });
    }
    assert.equal(errorOverflow, false, 'API reuse error observations overflowed');
    assert.deepEqual(pageErrors, [], 'API reuse pages raised unexpected script errors');
    assert.deepEqual(consoleErrors.filter((record) => !record.expected), [],
      'API reuse pages logged errors beyond their exact controlled HTTP failures');
    Object.assign(evidence, { status: 'passed', reuseElapsedMs,
      retryAfterSeconds: RETRY_AFTER_SECONDS,
      untested: ['HLS-only media requires a video fixture'] });
    return evidence;
  } catch (error) {
    primaryError = error;
    evidence.status = 'failed';
    evidence.error = error instanceof Error ? error.message : String(error);
    if (output && !activePage.isClosed()) {
      await activePage.screenshot({ path: join(output, 'api-reuse-failure.png'), fullPage: true })
        .catch(() => {});
    }
    throw error;
  } finally {
    const cleanupErrors = [];
    try {
      await context.unroute(API_ROUTE, routeHandler);
      evidence.cleanup.routesRemoved = true;
    } catch (error) {
      cleanupErrors.push(error);
    }
    for (const observed of observedPages) {
      observed.page.off('pageerror', observed.onPageError);
      observed.page.off('console', observed.onConsole);
    }
    const pageCleanup = await Promise.allSettled(ownedPages.map((owned) => owned.close()));
    evidence.cleanup.pagesClosed = pageCleanup.every((result) => result.status === 'fulfilled');
    for (const result of pageCleanup) {
      if (result.status === 'rejected') cleanupErrors.push(result.reason);
    }
    try {
      if (!page.isClosed() && await page.locator(GALLERY).count()) {
        await page.keyboard.press('Escape');
      }
      if (!page.isClosed() && originalPageUrl !== page.url()) {
        await page.goto(originalPageUrl);
      }
      evidence.cleanup.pageRestored = !page.isClosed() && page.url() === originalPageUrl;
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (cleanupErrors.length > 0) evidence.status = 'failed';
    evidence.cleanup.errors = cleanupErrors.map((error) =>
      error instanceof Error ? error.message : String(error));
    if (output) await writeFile(join(output, 'api-reuse-observations.json'),
      JSON.stringify(evidence, null, 2));
    if (cleanupErrors.length > 0) {
      throw new AggregateError(primaryError ? [primaryError, ...cleanupErrors] : cleanupErrors,
        'Installed API reuse cleanup failed');
    }
  }
}
