// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { expectedStoredZipBytes, readExactDownloadFile, verifyStoredZip } from './download-memory.mjs';
import { createImageFixtures, enableDeveloperMode, verifyDownloadDirectory } from './install-profile.mjs';

const SCRIPT_NAME = 'X.com Enhanced Gallery';
const PROFILE_PREFIX = 'xeg-userscript-install-';
const TWEET_ID = '1234567890123456789';
const FIXTURE_URL = `https://x.com/testuser/status/${TWEET_ID}`;
const IMAGE_MARKERS = ['GkE1234', 'GkE5678', 'GkE9012'];
const MAX_DOWNLOADS = 8;

function sha256(bytes) { return createHash('sha256').update(bytes).digest('hex'); }
function filename(index) { return `testuser_${TWEET_ID}_${index}.jpg`; }
function delay(ms) { return new Promise((resolveDelay) => setTimeout(resolveDelay, ms)); }

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

async function downloadsIn(managerPage) {
  return managerPage.evaluate(() => new Promise((resolveItems, rejectItems) => {
    chrome.downloads.search({}, (items) => {
      const error = chrome.runtime.lastError;
      if (error) rejectItems(new Error(error.message));
      else resolveItems(items);
    });
  }));
}

async function waitForDownload(managerPage, knownIds, expectedName, downloads, expectedBytes) {
  const item = await waitFor(async () => {
    const created = (await downloadsIn(managerPage)).filter(({ id }) => !knownIds.has(id));
    assert(created.length <= 1, `One action created ${created.length} downloads`);
    if (created.length === 0) return undefined;
    const candidate = created[0];
    if (candidate.state === 'interrupted') throw new Error(`Native download interrupted: ${candidate.error}`);
    return candidate.state === 'complete' ? candidate : undefined;
  }, `native completion of ${expectedName}`, 30_000);
  assert.equal(basename(item.filename), expectedName, 'Native saved filename differs');
  const child = relative(downloads, item.filename);
  assert(child && !child.startsWith('..') && !isAbsolute(child), 'Native download escaped owned directory');
  const { bytes } = await readExactDownloadFile(item.filename, expectedBytes);
  return { id: item.id, filename: expectedName, bytes, sha256: sha256(bytes),
    nativeState: item.state, browserBytesReceived: item.bytesReceived };
}

function browserFilename(name, duplicate) {
  if (duplicate === 0) return name;
  const dot = name.lastIndexOf('.');
  return `${name.slice(0, dot)} (${duplicate})${name.slice(dot)}`;
}

async function assertNoDownload(managerPage, knownIds, label) {
  // The routed request must reach a terminal failure/cancellation before this check.
  const created = (await downloadsIn(managerPage)).filter(({ id }) => !knownIds.has(id));
  assert.deepEqual(created, [], `${label} created a native download`);
}

async function runFixture(context, managerId, root, output, downloads, images) {
  const html = await readFile(join(root, 'test/e2e/fixtures/installed-gallery-page.html'), 'utf8');
  const routeRecords = [];
  let phase = 'normal';
  let heldRequest;
  let releaseHeld;
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
      const index = IMAGE_MARKERS.findIndex((marker) => url.pathname.includes(marker));
      assert(index >= 0, 'Unknown media fixture request');
      assert(routeRecords.length < 64, 'Fixture exceeded its routed request limit');
      const record = { phase, index, resourceType: route.request().resourceType(),
        method: route.request().method() };
      routeRecords.push(record);
      if ((phase === 'failure' && index === 0) || (phase === 'partial' && index === 1)) {
        record.result = 'http-503';
        await route.fulfill({ status: 503, contentType: 'text/plain', body: 'fixture unavailable' });
        return;
      }
      if (phase === 'held' && index === 0 && route.request().resourceType() !== 'image') {
        assert(!heldRequest, 'More than one held request');
        heldRequest = record;
        await new Promise((resolveHeld) => { releaseHeld = resolveHeld; });
        record.result = 'released-after-close';
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
  const managerPage = await context.newPage();
  const page = await context.newPage();
  const result = { status: 'failed', downloads: [], routes: routeRecords, cases: {}, cleanup: {} };
  try {
    await managerPage.goto(`chrome-extension://${managerId}/options.html`);
    await page.goto(FIXTURE_URL, { waitUntil: 'domcontentloaded' });
    const trigger = page.locator('[data-testid="tweetPhoto"] img').first();
    await trigger.click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    const current = gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]');
    const all = gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download 3 shown files as ZIP"]');
    const expectedEntries = images.map((bytes, index) => ({ filename: filename(index), bytes }));
    let known = new Set((await downloadsIn(managerPage)).map(({ id }) => id));
    assert.equal(known.size, 0, 'Task profile has prior downloads');
    for (let repetition = 0; repetition < 2; repetition++) {
      const routedBeforeSingle = routeRecords.filter(({ phase: p, index }) =>
        p === 'normal' && index === 0).length;
      await current.click();
      const single = await waitForDownload(managerPage, known,
        browserFilename(filename(0), repetition), downloads, images[0].length);
      assert(routeRecords.filter(({ phase: p, index }) =>
        p === 'normal' && index === 0).length > routedBeforeSingle,
      'Single download did not use the bounded media route');
      assert(single.bytes.equals(images[0]), 'Single saved bytes differ');
      known.add(single.id);
      result.downloads.push({ kind: 'single', repetition, ...single, bytes: single.bytes.length });
      await waitFor(async () => await current.isEnabled() ? true : undefined, 'single control ready');
      await all.click();
      const zip = await waitForDownload(managerPage, known,
        browserFilename(`testuser_${TWEET_ID}.zip`, repetition),
        downloads, expectedStoredZipBytes(expectedEntries));
      const verified = verifyStoredZip(zip.bytes, expectedEntries);
      known.add(zip.id);
      result.downloads.push({ kind: 'zip', repetition, ...zip, bytes: zip.bytes.length,
        entryOrder: verified.entryOrder, included: verified.entries.length, omitted: 0 });
      await waitFor(async () => await all.isEnabled() ? true : undefined, 'ZIP control ready');
    }
    result.cases.repeated = 'passed';
    assert(known.size <= MAX_DOWNLOADS, 'Fixture created too many downloads');

    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
    await gallery.waitFor({ state: 'detached' });
    await trigger.click();
    await gallery.waitFor({ state: 'visible' });
    result.cases.closeReopen = 'passed';

    phase = 'failure';
    await current.click();
    await waitFor(async () => routeRecords.some(({ phase: p, index, result: outcome }) =>
      p === 'failure' && index === 0 && outcome === 'http-503') ? true : undefined,
    'routed transport failure');
    await waitFor(async () => await current.isEnabled() ? true : undefined, 'failed control ready');
    await assertNoDownload(managerPage, known, 'Transport failure');
    result.cases.networkFailure = 'passed';

    phase = 'partial';
    await all.click();
    const includedEntries = expectedEntries.filter((_, index) => index !== 1);
    const partial = await waitForDownload(managerPage, known,
      browserFilename(`testuser_${TWEET_ID}.zip`, 2), downloads,
      expectedStoredZipBytes(includedEntries));
    const partialZip = verifyStoredZip(partial.bytes, includedEntries);
    known.add(partial.id);
    result.downloads.push({ kind: 'partial-zip', ...partial, bytes: partial.bytes.length,
      entryOrder: partialZip.entryOrder, included: 2, omitted: 1 });
    assert(routeRecords.some(({ phase: p, index, result: outcome }) =>
      p === 'partial' && index === 1 && outcome === 'http-503'), 'Partial ZIP failure was not routed');
    result.cases.partialZip = 'passed';

    phase = 'held';
    await current.click();
    await waitFor(async () => heldRequest ? true : undefined, 'held media request');
    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    releaseHeld();
    releaseHeld = undefined;
    await waitFor(async () => heldRequest.result ? true : undefined, 'late transport settlement');
    await assertNoDownload(managerPage, known, 'Pre-dispatch cancellation');
    result.cases.preDispatchCancellation = 'passed';
    result.cases.delayedSettlement = 'passed';

    phase = 'normal';
    await page.reload({ waitUntil: 'domcontentloaded' });
    await trigger.click();
    await gallery.waitFor({ state: 'visible' });
    await current.click();
    const recovered = await waitForDownload(managerPage, known,
      browserFilename(filename(0), 2), downloads, images[0].length);
    assert(recovered.bytes.equals(images[0]), 'Reload recovery saved bytes differ');
    known.add(recovered.id);
    result.downloads.push({ kind: 'single-after-reload', ...recovered, bytes: recovered.bytes.length });
    result.cases.reloadRecovery = 'passed';
    assert.equal((await downloadsIn(managerPage)).length, known.size, 'Unexpected native download count');
    await page.screenshot({ path: join(output, 'userscript-fixture.png') });
    result.status = 'passed';
    return result;
  } finally {
    if (releaseHeld) releaseHeld();
    await page.close().catch((error) => { result.cleanup.pageError = String(error); });
    await managerPage.close().catch((error) => { result.cleanup.managerPageError = String(error); });
    await context.unroute('**/*', handler).then(() => { result.cleanup.routeRemoved = true; },
      (error) => { result.cleanup.routeError = String(error); });
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
    scope: 'small routed fixture; native saved bytes and history; no heap/RSS or native Save As claim',
    cleanup: {} };
  let context;
  let cdp;
  let managerId;
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
    result.fixture = await runFixture(context, managerId, root, output, downloads, images);
    result.status = 'passed';
  } catch (error) {
    primaryError = error;
    result.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  } finally {
    const errors = [];
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
