// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { expectedStoredZipBytes, readExactDownloadFile, verifyStoredZip } from './download-memory.mjs';
import { createImageFixtures, enableDeveloperMode, verifyDownloadDirectory } from './install-profile.mjs';

const SCRIPT_NAME = 'X.com Enhanced Gallery';
const PROFILE_PREFIX = 'xeg-userscript-install-';
const TWEET_ID = '1234567890123456789';
const FIXTURE_URL = `https://x.com/testuser/status/${TWEET_ID}`;
export const MEDIA_COHORTS = {
  normal: ['GkE1234ABCDEF', 'GkE5678GHIJKL', 'GkE9012MNOPQR'],
  failure: ['GkF1234ABCDEF', 'GkF5678GHIJKL', 'GkF9012MNOPQR'],
  partial: ['GkP1234ABCDEF', 'GkP5678GHIJKL', 'GkP9012MNOPQR'],
  held: ['GkH1234ABCDEF', 'GkH5678GHIJKL', 'GkH9012MNOPQR'],
};
export const FIXTURE_ZIP_NAME = `testuser_${TWEET_ID}.zip`;
const MAX_DOWNLOADS = 8;

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function filename(index) { return `testuser_${TWEET_ID}_${index}.jpg`; }
export function fixtureZipEntries(images) {
  return images.map((bytes, index) => ({ filename: filename(index), bytes }));
}
function delay(ms) { return new Promise((resolveDelay) => setTimeout(resolveDelay, ms)); }

export function summarizeDownloadUrl(value) {
  const url = new URL(value);
  return { scheme: url.protocol, origin: url.origin };
}

export function requirePageBlobZipSource(value) {
  const source = summarizeDownloadUrl(value);
  assert.deepEqual(source, { scheme: 'blob:', origin: 'https://x.com' },
    'ZIP must be saved from a page-origin Blob URL');
  return source;
}

async function waitFor(read, label, timeoutMs = 15_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    const value = await read();
    if (value !== undefined) return value;
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

function assertOwned(root, profile) {
  assert.equal(dirname(resolve(profile)), resolve(root), 'Profile is outside the task root');
  assert(basename(profile).startsWith(PROFILE_PREFIX), 'Profile prefix differs');
}

function safeRouteError(error) {
  const name = error instanceof Error ? error.name : typeof error;
  const message = (error instanceof Error ? error.message : String(error))
    .replace(/https?:\/\/[^\s)]+/gu, '[url]').slice(0, 256);
  return { name, message };
}

/** Correlate Playwright's request lifecycle to the exact held route request. */
export function watchExactRequestTerminal(context) {
  let ownedRequest;
  let terminal;
  const finished = (request) => {
    if (request === ownedRequest) terminal = { kind: 'requestfinished' };
  };
  const failed = (request) => {
    if (request !== ownedRequest) return;
    const errorText = request.failure()?.errorText ?? null;
    terminal = {
      kind: 'requestfailed',
      errorText: errorText?.replace(/https?:\/\/[^\s)]+/gu, '[url]').slice(0, 256) ?? null,
    };
  };
  context.on('requestfinished', finished);
  context.on('requestfailed', failed);
  return {
    bind(request) {
      assert(!ownedRequest, 'Held transport was bound more than once');
      ownedRequest = request;
    },
    async waitForTerminal() {
      assert(ownedRequest, 'Held transport was not bound');
      return waitFor(() => terminal, 'exact held request terminal', 15_000);
    },
    terminal: () => terminal,
    dispose() {
      context.off('requestfinished', finished);
      context.off('requestfailed', failed);
    },
  };
}

export function requireHeldRouteOutcome(routeInvocation, requestTerminal) {
  assert(requestTerminal?.kind === 'requestfinished' || requestTerminal?.kind === 'requestfailed',
    'Held request has no correlated transport terminal');
  if (routeInvocation?.kind === 'rejected' && requestTerminal.kind !== 'requestfailed') {
    throw new Error('Held route fulfillment failed without a matching failed request');
  }
  assert(['fulfilled', 'rejected'].includes(routeInvocation?.kind),
    'Held route invocation has no completion outcome');
  return { routeInvocation, requestTerminal };
}

async function installUserscript(context, id, root, output) {
  const manifest = JSON.parse(await readFile(join(root, 'test-tools/userscript-manager/manifest.json'), 'utf8'));
  assert(/^\d+(?:\.\d+){1,3}$/.test(manifest.version), 'Manager version is invalid');
  const page = await context.newPage();
  try {
    await page.goto(`chrome://extensions/?id=${id}`);
    const toggle = page.locator('#allow-user-scripts cr-toggle');
    await toggle.waitFor({ state: 'visible' });
    if (!(await toggle.evaluate((element) => element.checked))) await toggle.click();
    assert(await toggle.evaluate((element) => element.checked), 'Manager user-scripts permission is disabled');
    const keep = page.getByRole('button', { name: 'Keep', exact: true });
    if (await keep.isVisible()) await keep.click();
    const restarted = context.waitForEvent('serviceworker', {
      predicate: (worker) => worker.url().startsWith(`chrome-extension://${id}/`), timeout: 15_000,
    });
    await page.locator('extensions-detail-view #dev-reload-button').click();
    await restarted;
    await page.goto(`chrome-extension://${id}/options.html`);
    await page.getByText('Utilities', { exact: true }).click();
    const confirmationPromise = context.waitForEvent('page');
    await page.locator('input[type=file]').setInputFiles(join(root, 'dist/xcom-enhanced-gallery.user.js'));
    const confirmation = await confirmationPromise;
    await confirmation.waitForURL(`chrome-extension://${id}/ask.html*`);
    const closed = confirmation.waitForEvent('close');
    await confirmation.getByRole('button', { name: 'Install', exact: true }).click();
    await closed;
    await page.reload();
    await page.getByText('Installed Userscripts', { exact: true }).first().click();
    await page.getByText(SCRIPT_NAME, { exact: true }).first().waitFor({ state: 'visible' });
    await page.screenshot({ path: join(output, 'userscript-installed.png') });
    return { id, managerName: 'Tampermonkey', managerVersion: manifest.version,
      scriptName: SCRIPT_NAME, method: 'real-manager-ui-import' };
  } finally {
    await page.close();
  }
}

/** Browser-level events require no optional permissions from Tampermonkey. */
export function createBrowserDownloadObserver(cdp) {
  const begun = [];
  const progress = new Map();
  const onBegin = (event) => {
    assert(begun.length < MAX_DOWNLOADS + 4, 'Too many task-profile downloads');
    begun.push({ guid: event.guid, suggestedFilename: event.suggestedFilename,
      url: event.url });
  };
  const onProgress = (event) => {
    progress.set(event.guid, { state: event.state,
      receivedBytes: event.receivedBytes, totalBytes: event.totalBytes,
      filePath: event.filePath ?? null });
  };
  cdp.on('Browser.downloadWillBegin', onBegin);
  cdp.on('Browser.downloadProgress', onProgress);
  return {
    snapshot: () => begun.length,
    events: () => begun.map(({ guid, suggestedFilename, url }) => ({
      guid, suggestedFilename, source: summarizeDownloadUrl(url),
    })),
    async flush() { await cdp.send('Browser.getVersion'); },
    async waitForCompletion(since, ...expectedNames) {
      const item = await waitFor(() => {
        const created = begun.slice(since);
        assert(created.length <= 1, `One action created ${created.length} native downloads`);
        if (!created.length) return undefined;
        const candidate = created[0];
        assert(expectedNames.includes(candidate.suggestedFilename),
          'Browser download request used an unexpected filename');
        const status = progress.get(candidate.guid);
        if (status?.state === 'canceled') throw new Error('Browser canceled the native download');
        return status?.state === 'completed' ? { ...candidate, ...status } : undefined;
      }, `CDP native completion of ${expectedNames[0]}`, 30_000);
      return item;
    },
    async assertNoneSince(since, label) {
      await cdp.send('Browser.getVersion');
      assert.deepEqual(begun.slice(since), [], `${label} created a native download`);
    },
    dispose() {
      cdp.off('Browser.downloadWillBegin', onBegin);
      cdp.off('Browser.downloadProgress', onProgress);
    },
  };
}

async function waitForDownload(observer, since, beforeFiles, requestedName, savedName,
  downloads, expectedBytes) {
  const item = await observer.waitForCompletion(since, requestedName, savedName);
  const added = await waitFor(async () => {
    const names = await readdir(downloads);
    const newNames = names.filter((name) => !beforeFiles.has(name) && !name.endsWith('.crdownload'));
    assert(newNames.length <= 1, `One action saved ${newNames.length} files`);
    return newNames.length ? newNames : undefined;
  }, `native saved file for ${savedName}`);
  assert.deepEqual(added, [savedName], 'Native saved filename differs');
  const source = requestedName.endsWith('.zip')
    ? requirePageBlobZipSource(item.url) : summarizeDownloadUrl(item.url);
  if (item.filePath !== null) {
    assert.equal(resolve(item.filePath), resolve(downloads, savedName),
      'CDP completed a file outside the exact owned download path');
  }
  const { bytes } = await readExactDownloadFile(join(downloads, savedName), expectedBytes);
  assert.equal((await readdir(downloads)).filter((name) => name.endsWith('.crdownload')).length,
    0, 'Partial native download remained');
  return { guid: item.guid, requestedName, filename: savedName, source,
    bytes, sha256: sha256(bytes),
    nativeState: item.state, browserBytesReceived: item.receivedBytes };
}

function browserFilename(name, duplicate) {
  if (duplicate === 0) return name;
  const dot = name.lastIndexOf('.');
  return `${name.slice(0, dot)} (${duplicate})${name.slice(dot)}`;
}

export async function observeNoNativeDownload(observer, since, beforeFiles, downloads,
  label, durationMs = 0) {
  assert(Number.isSafeInteger(durationMs) && durationMs >= 0 && durationMs <= 5_000,
    'Native absence observation must be bounded');
  const started = Date.now();
  let samples = 0;
  do {
    await observer.assertNoneSince(since, label);
    assert.deepEqual((await readdir(downloads)).sort(), [...beforeFiles].sort(),
      `${label} left a file in the owned directory`);
    samples += 1;
    const remaining = durationMs - (Date.now() - started);
    if (remaining <= 0) break;
    await delay(Math.min(50, remaining));
  } while (true);
  return { observedMs: Date.now() - started, samples,
    boundary: 'bounded browser events and owned files after held request terminal; not manager callback completion' };
}

async function runFixture(context, observer, root, output, downloads, images) {
  const html = await readFile(join(root, 'test/e2e/fixtures/installed-gallery-page.html'), 'utf8');
  const routeRecords = [];
  let phase = 'normal';
  let heldRequest;
  let releaseHeld;
  let heldRouteInvocation;
  let heldTerminalObserver;
  const handler = async (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === 'chrome-extension:') {
      await route.continue();
      return;
    }
    if (url.hostname === 'x.com' && route.request().isNavigationRequest()) {
      await route.fulfill({ status: 200, contentType: 'text/html', body: html });
      return;
    }
    if (url.hostname === 'x.com' && url.pathname === '/favicon.ico') {
      await route.fulfill({ status: 204, body: '' });
      return;
    }
    if (url.hostname === 'pbs.twimg.com') {
      const cohort = Object.entries(MEDIA_COHORTS).find(([, markers]) =>
        markers.some((marker) => url.pathname.includes(marker)));
      assert(cohort, 'Unknown media fixture request');
      const [mediaPhase, markers] = cohort;
      const index = markers.findIndex((marker) => url.pathname.includes(marker));
      assert(routeRecords.length < 64, 'Fixture exceeded its routed request limit');
      const record = { phase, mediaPhase, index, resourceType: route.request().resourceType(),
        method: route.request().method() };
      routeRecords.push(record);
      if (mediaPhase === phase && (phase === 'failure' || (phase === 'partial' && index === 1))) {
        record.result = 'http-503';
        await route.fulfill({ status: 503, contentType: 'text/plain', body: 'fixture unavailable' });
        return;
      }
      if (mediaPhase === 'held' && phase === 'held' && index === 0 &&
        route.request().resourceType() !== 'image') {
        assert(!heldRequest, 'More than one held request');
        heldRequest = record;
        heldTerminalObserver.bind(route.request());
        await new Promise((resolveHeld) => { releaseHeld = resolveHeld; });
        try {
          await route.fulfill({ status: 200, contentType: 'image/jpeg', body: images[index] });
          heldRouteInvocation = { kind: 'fulfilled' };
        } catch (error) {
          heldRouteInvocation = { kind: 'rejected', error: safeRouteError(error) };
        } finally {
          record.routeInvocation = heldRouteInvocation;
        }
        return;
      }
      record.result ??= 'image';
      await route.fulfill({ status: 200, contentType: 'image/jpeg', body: images[index] });
      return;
    }
    if (url.hostname === 'x.com' && url.pathname.endsWith('/TweetResultByRestId')) {
      await route.fulfill({ status: 403, contentType: 'application/json', body: '{}' });
      return;
    }
    await route.abort('blockedbyclient');
  };
  await context.route('**/*', handler);
  const page = await context.newPage();
  const result = { status: 'failed', downloads: [], routes: routeRecords, cases: {}, cleanup: {} };
  try {
    await page.goto(FIXTURE_URL, { waitUntil: 'domcontentloaded' });
    const trigger = page.locator('[data-phase="normal"] [data-testid="tweetPhoto"] img').first();
    await trigger.click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    const current = gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]');
    const all = gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download 3 shown files as ZIP"]');
    const expectedEntries = fixtureZipEntries(images);
    const showPhase = async (nextPhase) => {
      await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
      await gallery.waitFor({ state: 'detached' });
      phase = nextPhase;
      await page.locator('body').evaluate((body, selected) => {
        body.dataset.fixturePhase = selected;
      }, nextPhase);
      const nextTrigger = page.locator(`[data-phase="${nextPhase}"] [data-testid="tweetPhoto"] img`).first();
      await nextTrigger.click();
      await gallery.waitFor({ state: 'visible' });
      return nextTrigger;
    };
    assert.equal(observer.snapshot(), 0, 'Task profile has prior native downloads');
    assert.deepEqual(await readdir(downloads), [], 'Task download directory is not empty');
    for (let repetition = 0; repetition < 2; repetition++) {
      const routedBeforeSingle = routeRecords.filter(({ phase: p, mediaPhase, index }) =>
        p === 'normal' && mediaPhase === 'normal' && index === 0).length;
      const singleSince = observer.snapshot();
      const singleBefore = new Set(await readdir(downloads));
      await current.click();
      const single = await waitForDownload(observer, singleSince, singleBefore,
        filename(0), browserFilename(filename(0), repetition), downloads, images[0].length);
      if (repetition === 0) {
        assert(routeRecords.filter(({ phase: p, mediaPhase, index }) =>
          p === 'normal' && mediaPhase === 'normal' && index === 0).length > routedBeforeSingle,
        'First single download did not use the bounded media route');
      }
      assert(single.bytes.equals(images[0]), 'Single saved bytes differ');
      result.downloads.push({ kind: 'single', repetition, ...single, bytes: single.bytes.length });
      await waitFor(async () => await current.isEnabled() ? true : undefined, 'single control ready');
      const zipSince = observer.snapshot();
      const zipBefore = new Set(await readdir(downloads));
      await all.click();
      const zipName = FIXTURE_ZIP_NAME;
      const zip = await waitForDownload(observer, zipSince, zipBefore,
        zipName, browserFilename(zipName, repetition), downloads,
        expectedStoredZipBytes(expectedEntries));
      const verified = verifyStoredZip(zip.bytes, expectedEntries);
      result.downloads.push({ kind: 'zip', repetition, ...zip, bytes: zip.bytes.length,
        entryOrder: verified.entryOrder, included: verified.entries.length, omitted: 0 });
      await waitFor(async () => await all.isEnabled() ? true : undefined, 'ZIP control ready');
    }
    result.cases.repeated = 'passed';
    assert(result.downloads.length <= MAX_DOWNLOADS, 'Fixture created too many downloads');

    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
    await gallery.waitFor({ state: 'detached' });
    await trigger.click();
    await gallery.waitFor({ state: 'visible' });
    result.cases.closeReopen = 'passed';

    await showPhase('failure');
    const failureSince = observer.snapshot();
    const failureBefore = new Set(await readdir(downloads));
    await all.click();
    await waitFor(async () => routeRecords.some(({ phase: p, mediaPhase, index, result: outcome }) =>
      p === 'failure' && mediaPhase === 'failure' && index === 0 && outcome === 'http-503')
      ? true : undefined,
    'routed transport failure');
    await waitFor(async () => await all.isEnabled() ? true : undefined, 'failed control ready');
    await observeNoNativeDownload(observer, failureSince, failureBefore, downloads,
      'Transport failure');
    result.cases.networkFailure = 'passed';

    await showPhase('partial');
    const partialSince = observer.snapshot();
    const partialBefore = new Set(await readdir(downloads));
    await all.click();
    const includedEntries = expectedEntries.filter((_, index) => index !== 1);
    const partialName = FIXTURE_ZIP_NAME;
    const partial = await waitForDownload(observer, partialSince, partialBefore,
      partialName, browserFilename(partialName, 2), downloads,
      expectedStoredZipBytes(includedEntries));
    const partialZip = verifyStoredZip(partial.bytes, includedEntries);
    result.downloads.push({ kind: 'partial-zip', ...partial, bytes: partial.bytes.length,
      entryOrder: partialZip.entryOrder, included: 2, omitted: 1 });
    assert(routeRecords.some(({ phase: p, mediaPhase, index, result: outcome }) =>
      p === 'partial' && mediaPhase === 'partial' && index === 1 && outcome === 'http-503'),
    'Partial ZIP failure was not routed');
    result.cases.partialZip = 'passed';
    await waitFor(async () => await all.isEnabled() ? true : undefined, 'partial ZIP control ready');

    heldTerminalObserver = watchExactRequestTerminal(context);
    const heldTrigger = await showPhase('held');
    const heldSince = observer.snapshot();
    const heldBefore = new Set(await readdir(downloads));
    await all.click();
    await waitFor(async () => heldRequest ? true : undefined, 'held media request');
    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    releaseHeld();
    releaseHeld = undefined;
    await waitFor(() => heldRouteInvocation, 'held route invocation completion');
    const requestTerminal = await heldTerminalObserver.waitForTerminal();
    const heldOutcome = requireHeldRouteOutcome(heldRouteInvocation, requestTerminal);
    heldRequest.requestTerminal = requestTerminal;
    // cleanupGallery() resets the busy signal synchronously. A detached gallery
    // and enabled toolbar cannot prove that an old manager callback has settled.
    // Keep this document alive after the late route response and inspect browser
    // events and owned files throughout a bounded post-response interval.
    await heldTrigger.click();
    await gallery.waitFor({ state: 'visible' });
    await waitFor(async () => await all.isEnabled() ? true : undefined,
      'same-document toolbar ready after cancellation');
    result.cases.lateAbsence = await observeNoNativeDownload(observer, heldSince,
      heldBefore, downloads, 'Pre-dispatch cancellation', 2_000);
    result.cases.preDispatchCancellation = 'passed';
    result.cases.delayedSettlement = { status: 'bounded-no-native-save',
      ...heldOutcome };

    phase = 'normal';
    assert(heldTerminalObserver.terminal(), 'Held request remains active before reload');
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
    await gallery.waitFor({ state: 'detached' });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await trigger.click();
    await gallery.waitFor({ state: 'visible' });
    const recoverySince = observer.snapshot();
    const recoveryBefore = new Set(await readdir(downloads));
    await current.click();
    const recovered = await waitForDownload(observer, recoverySince, recoveryBefore,
      filename(0), browserFilename(filename(0), 2), downloads, images[0].length);
    assert(recovered.bytes.equals(images[0]), 'Reload recovery saved bytes differ');
    result.downloads.push({ kind: 'single-after-reload', ...recovered, bytes: recovered.bytes.length });
    result.cases.reloadRecovery = 'passed';
    await observer.flush();
    assert.equal(observer.snapshot(), result.downloads.length,
      'Unexpected native download count');
    await page.screenshot({ path: join(output, 'userscript-fixture.png') });
    result.status = 'passed';
    return result;
  } finally {
    if (releaseHeld) releaseHeld();
    await page.close().catch((error) => { result.cleanup.pageError = String(error); });
    heldTerminalObserver?.dispose();
    await context.unroute('**/*', handler).then(() => { result.cleanup.routeRemoved = true; },
      (error) => { result.cleanup.routeError = String(error); });
    result.browserDownloadEvents = observer.events();
    await writeFile(join(output, 'userscript-fixture-result.json'), JSON.stringify(result, null, 2));
    assert.deepEqual(result.cleanup, { routeRemoved: true }, 'Fixture cleanup failed');
  }
}

export async function runUserscriptInstallation({ chromium, root, output, browserName, headless }) {
  assert(['chrome', 'msedge'].includes(browserName), 'Userscript installation requires Chrome or Edge');
  await mkdir(output, { recursive: true });
  const source = await readFile(join(root, 'dist/xcom-enhanced-gallery.user.js'));
  const profile = await mkdtemp(join(root, PROFILE_PREFIX));
  assertOwned(root, profile);
  const downloads = join(profile, 'downloads');
  await mkdir(downloads);
  await mkdir(join(profile, 'Default'));
  await writeFile(join(profile, 'Default', 'Preferences'), JSON.stringify({
    download: { default_directory: downloads, prompt_for_download: false, directory_upgrade: true },
  }));
  const result = { status: 'failed', browserName, installation: 'userscript',
    installationMethod: 'real-manager-ui-import', sourceSha256: sha256(source),
    profileId: 'xeg-gallery', profilePrefix: PROFILE_PREFIX,
    scope: 'small routed fixture; CDP native completion and saved bytes; no heap/RSS or native Save As claim',
    cleanup: {} };
  let context;
  let cdp;
  let managerId;
  let observer;
  let primaryError;
  try {
    context = await chromium.launchPersistentContext(profile, {
      channel: browserName, headless, acceptDownloads: true, downloadsPath: downloads,
      locale: 'en-US', viewport: { width: 1280, height: 800 },
      ignoreDefaultArgs: ['--disable-extensions'], args: ['--enable-unsafe-extension-debugging'],
    });
    result.browserVersion = context.browser().version();
    await enableDeveloperMode(context, browserName);
    await verifyDownloadDirectory(context, downloads);
    result.downloadDirectoryVerified = true;
    cdp = await context.browser().newBrowserCDPSession();
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'default', eventsEnabled: true });
    ({ id: managerId } = await cdp.send('Extensions.loadUnpacked', {
      path: join(root, 'test-tools/userscript-manager'),
    }));
    assert.equal(typeof managerId, 'string');
    result.manager = await installUserscript(context, managerId, root, output);
    const images = await createImageFixtures(context);
    result.fixtureLimits = { imageBytes: images.map((image) => image.length),
      imageSha256: images.map(sha256),
      maxDownloads: MAX_DOWNLOADS, maxRoutedImageRequests: 64,
      productionBudget: 'unchanged' };
    observer = createBrowserDownloadObserver(cdp);
    result.fixture = await runFixture(context, observer, root, output, downloads, images);
    result.status = 'passed';
  } catch (error) {
    primaryError = error;
    result.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  } finally {
    const errors = [];
    if (observer) {
      observer.dispose();
      result.cleanup.browserDownloadObserverRemoved = true;
    }
    if (cdp && managerId) {
      await cdp.send('Extensions.uninstall', { id: managerId }).then(
        () => { result.cleanup.managerUninstalled = true; }, (error) => errors.push(error));
    }
    if (context) {
      await context.close().then(() => { result.cleanup.browserClosed = true; },
        (error) => errors.push(error));
    }
    if (result.cleanup.browserClosed || !context) {
      try {
        assertOwned(root, profile);
        await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
        assert.equal(await stat(profile).then(() => true, () => false), false,
          'Owned profile remains after cleanup');
        result.cleanup.profileRemoved = true;
      } catch (error) { errors.push(error); }
    } else result.cleanup.profilePreserved = true;
    result.cleanup.errorCount = errors.length;
    if (errors.length) {
      result.status = 'failed';
      result.cleanup.errors = errors.map(String);
    }
    await writeFile(join(output, 'installation-result.json'), JSON.stringify(result, null, 2));
    if (primaryError && errors.length) throw new AggregateError([primaryError, ...errors],
      'Userscript installation and cleanup failed');
    if (errors.length) throw new AggregateError(errors, 'Userscript installation cleanup failed');
  }
  if (primaryError) throw primaryError;
  return result;
}
