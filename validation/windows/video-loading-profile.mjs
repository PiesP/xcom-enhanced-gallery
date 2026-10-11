// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import {
  expectedStoredZipBytes,
  readExactDownloadFile,
  verifyStoredZip,
} from './download-memory.mjs';

const VIDEO_COUNT = 8;
const MAX_REQUESTS = 64;
const MAX_MP4_BYTES = 256 * 1024;
const SETTINGS_KEY = 'xeg-app-settings';
const BAD_MP4 = Buffer.from('controlled invalid MP4 bytes for decode recovery');
const POSTER_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl4bRkAAAAASUVORK5CYII=',
  'base64'
);

function videoUrl(tweetId, index, quality = 'best') {
  return `https://video.twimg.com/ext_tw_video/${tweetId}/pu/vid/320x180/video-${index}-${quality}.mp4`;
}

function posterUrl(tweetId, index) {
  return `https://pbs.twimg.com/ext_tw_video_thumb/${tweetId}/pu/img/video-${index}.png`;
}

function fixtureHtml(tweetId, handle) {
  const players = Array.from({ length: VIDEO_COUNT }, (_, index) => `
    <div data-testid="videoPlayer" class="player" data-fixture-index="${index}">
      <div data-testid="previewInterstitial"><img tabindex="0" data-video-target="${index}"
        src="${posterUrl(tweetId, index)}" alt="Video ${index + 1} preview" width="320" height="180"></div>
      <video controls poster="${posterUrl(tweetId, index)}" width="320" height="180"></video>
    </div>`).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Installed video loading fixture</title><style>
      body{margin:0;padding:20px;background:#000;color:#e7e9ea;font:16px Segoe UI,sans-serif}
      #spacer{height:900px}.player{display:inline-block;position:relative;width:320px;height:180px;margin:8px}
      .player img{display:block;width:320px;height:180px}.player video{display:none}
    </style></head><body style="--xeg-fixture-host-state: retained;"><div id="spacer" aria-hidden="true"></div><main>
    <article data-testid="tweet"><a href="/${handle}/status/${tweetId}"><time>Video fixture</time></a>
    <div data-testid="tweetText">Eight deterministic video variants</div>${players}
    </article></main></body></html>`;
}

function apiResponse(tweetId, handle) {
  const media = Array.from({ length: VIDEO_COUNT }, (_, index) => ({
    type: 'video', id_str: `${tweetId}${index}`, media_key: `7_${tweetId}${index}`,
    media_url_https: posterUrl(tweetId, index),
    expanded_url: `https://x.com/${handle}/status/${tweetId}/video/${index + 1}`,
    original_info: { width: 320, height: 180 },
    video_info: { aspect_ratio: [16, 9], variants: [
      { content_type: 'video/mp4', bitrate: 832000, url: videoUrl(tweetId, index) },
      ...(index === 0 ? [{ content_type: 'video/mp4', bitrate: 256000,
        url: videoUrl(tweetId, index, 'lower') }] : []),
    ] },
  }));
  return { data: { tweetResult: { result: {
    __typename: 'Tweet', rest_id: tweetId,
    core: { user_results: { result: { rest_id: tweetId,
      legacy: { screen_name: handle, name: handle } } } },
    legacy: { id_str: tweetId, full_text: 'Eight deterministic video variants',
      extended_entities: { media } },
  } } } };
}

async function waitForValue(readValue, description, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let value;
  do {
    value = await readValue();
    if (value !== undefined) return value;
    await new Promise((resolve) => setTimeout(resolve, 50));
  } while (Date.now() < deadline);
  throw new Error(`Timed out waiting for ${description}: ${JSON.stringify(value)}`);
}

async function itemState(page, index) {
  return page.evaluate((itemIndex) => {
    const gallery = document.querySelector('[data-xeg-gallery-container]');
    const root = gallery?.querySelector('[data-gallery-element="items"]');
    const item = root?.querySelector(`[data-gallery-element="item"][data-index="${itemIndex}"]`);
    const video = item?.querySelector('video');
    if (!(root instanceof HTMLElement) || !(item instanceof HTMLElement) ||
      !(video instanceof HTMLVideoElement)) return null;
    const rect = item.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    return {
      index: itemIndex, admitted: item.getAttribute('data-video-admitted'),
      metadata: item.getAttribute('data-media-loaded'),
      firstFrame: item.getAttribute('data-video-first-frame'),
      displayUrl: item.getAttribute('data-media-display-url'),
      src: video.getAttribute('src'), currentSrc: video.currentSrc,
      preload: video.preload, controls: video.controls, error: video.error?.code ?? null,
      readyState: video.readyState, videoWidth: video.videoWidth, videoHeight: video.videoHeight,
      currentTime: video.currentTime, paused: video.paused,
      box: { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
      viewport: { top: rootRect.top, bottom: rootRect.bottom, height: rootRect.height },
    };
  }, index);
}

function assertBestSource(value, bestUrl) {
  assert.equal(value?.displayUrl, bestUrl, 'The canonical display source changed');
}

/**
 * Exercise the installed extension against one routed X page. The caller owns
 * page/context/profile/output/download-directory lifetimes and supplies an
 * existing small playable MP4 in videoPayloads (quote-one is preferred).
 * Install the profile's fail-closed base routes before calling this helper;
 * unmatched URLs fall through to those routes. Page routes observe display
 * playback only. The HTTPS loopback separately serves native browser downloads.
 */
export async function runVideoLoadingProfile({
  context, page, extensionPage, fixtureUrl, tweetId, videoPayloads, downloads, output,
  nativeLoopback,
}) {
  const url = new URL(fixtureUrl);
  const match = /^\/([A-Za-z0-9_]{1,15})\/status\/([1-9]\d{0,19})$/u.exec(url.pathname);
  assert.equal(url.origin, 'https://x.com');
  assert(match && match[2] === tweetId && !url.search && !url.hash,
    'Fixture URL must bind the synthetic tweet ID');
  const handle = match[1];
  const validMp4 = videoPayloads['quote-one'] ?? videoPayloads.valid;
  assert(Buffer.isBuffer(validMp4) && validMp4.length > 0 && validMp4.length <= MAX_MP4_BYTES,
    'An existing playable MP4 at most 256 KiB is required');
  assert(BAD_MP4.length > 0 && BAD_MP4.length <= MAX_MP4_BYTES,
    'The controlled invalid MP4 exceeds the native fixture cap');
  assert(downloads && output, 'Native byte and failure evidence paths are required');
  assert(nativeLoopback && typeof nativeLoopback.setRecoveryPayloads === 'function' &&
    typeof nativeLoopback.mark === 'function' && typeof nativeLoopback.since === 'function' &&
    typeof nativeLoopback.snapshot === 'function',
  'The HTTPS native download loopback is required');
  nativeLoopback.setRecoveryPayloads({ tweetId, validMp4, badMp4: BAD_MP4 });
  const badSha256 = createHash('sha256').update(BAD_MP4).digest('hex');
  const bestUrl = videoUrl(tweetId, 0);
  const lowerUrl = videoUrl(tweetId, 0, 'lower');
  const records = { api: [], video: [], unexpectedVideo: [], overflow: 0 };
  const observation = { fixtureUrl, tweetId, expectedVideoCount: VIDEO_COUNT,
    canonicalBest: bestUrl, playableFallback: lowerUrl, requests: records,
    checks: [], timingsMs: {}, cleanup: { routeRemoved: false, settingsRestored: false,
      viewportRestored: false } };
  const viewportBefore = page.viewportSize();
  assert(viewportBefore, 'The owned page must have an explicit viewport');
  let releaseBest;
  const bestGate = new Promise((resolve) => { releaseBest = resolve; });
  let releaseLower;
  const lowerGate = new Promise((resolve) => { releaseLower = resolve; });
  let settingsBefore;
  let settingsChanged = false;
  let primaryError;
  const routeHandler = async (route) => {
    const request = route.request();
    const target = new URL(request.url());
    if (request.isNavigationRequest() && request.url() === fixtureUrl) {
      await route.fulfill({ status: 200, contentType: 'text/html', body: fixtureHtml(tweetId, handle) });
      return;
    }
    if (target.hostname === 'x.com' && target.pathname.endsWith('/TweetResultByRestId')) {
      let requestedId;
      try { requestedId = JSON.parse(target.searchParams.get('variables') ?? '{}').tweetId; }
      catch { requestedId = undefined; }
      if (requestedId === tweetId) {
        if (records.api.length < MAX_REQUESTS) records.api.push({ requestedId, method: request.method() });
        else records.overflow++;
        await route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify(apiResponse(tweetId, handle)) });
        return;
      }
    }
    if (target.hostname === 'pbs.twimg.com' &&
      target.pathname.startsWith(`/ext_tw_video_thumb/${tweetId}/pu/img/video-`)) {
      await route.fulfill({ status: 200, contentType: 'image/png', body: POSTER_PNG });
      return;
    }
    if (target.hostname === 'video.twimg.com') {
      const matched = new RegExp(`^/ext_tw_video/${tweetId}/pu/vid/320x180/video-([0-7])-(best|lower)\\.mp4$`, 'u')
        .exec(target.pathname);
      if (!matched || (matched[2] === 'lower' && matched[1] !== '0')) {
        if (records.unexpectedVideo.length < MAX_REQUESTS) records.unexpectedVideo.push(target.pathname);
        else records.overflow++;
        await route.fulfill({ status: 403, body: '' });
        return;
      }
      const index = Number(matched[1]);
      const quality = matched[2];
      const record = { index, quality, resourceType: request.resourceType(),
        atMs: performance.now(), range: request.headers().range ?? null, status: null };
      if (records.video.length < MAX_REQUESTS) records.video.push(record);
      else records.overflow++;
      if (index === 0 && quality === 'best') await bestGate;
      if (quality === 'lower') await lowerGate;
      const payload = index === 0 && quality === 'best' ? BAD_MP4 : validMp4;
      const range = /^bytes=(\d+)-(\d*)$/u.exec(request.headers().range ?? '');
      const start = range ? Number(range[1]) : 0;
      const end = Math.min(range?.[2] ? Number(range[2]) : payload.length - 1, payload.length - 1);
      if (start >= payload.length || end < start) {
        record.status = 416;
        await route.fulfill({ status: 416, headers: { 'Content-Range': `bytes */${payload.length}` } });
        return;
      }
      const bytes = payload.subarray(start, end + 1);
      record.status = range ? 206 : 200;
      await route.fulfill({ status: record.status, contentType: 'video/mp4', body: bytes,
        headers: { 'Access-Control-Allow-Origin': 'https://x.com',
          'Access-Control-Allow-Credentials': 'true', 'Accept-Ranges': 'bytes',
          'Content-Length': String(bytes.length),
          ...(range ? { 'Content-Range': `bytes ${start}-${end}/${payload.length}` } : {}) } });
      return;
    }
    await route.fallback();
  };
  await context.route('**/*', routeHandler);
  try {
    await page.setViewportSize({ width: 1280, height: 500 });
    observation.viewport = { width: 1280, height: 500 };
    settingsBefore = await extensionPage.evaluate(async (key) => {
      const values = await chrome.storage.local.get(key);
      return { exists: Object.hasOwn(values, key), value: values[key] ?? null };
    }, SETTINGS_KEY);
    const previous = settingsBefore.value;
    const value = {
      ...(previous && typeof previous === 'object' && !Array.isArray(previous)
        ? previous : { version: '1' }),
      gallery: { ...(previous?.gallery ?? {}), videoClickMode: 'allow-all', preloadCount: 20 },
      lastModified: Date.now(), __schemaHash: '1',
    };
    await extensionPage.evaluate(async ({ key, value }) => {
      await chrome.storage.local.set({ [key]: value });
    }, { key: SETTINGS_KEY, value });
    settingsChanged = true;
    const applied = await extensionPage.evaluate(async (key) =>
      (await chrome.storage.local.get(key))[key]?.gallery, SETTINGS_KEY);
    assert.equal(applied.videoClickMode, 'allow-all');
    assert.equal(applied.preloadCount, 20);

    await page.goto(fixtureUrl);
    const trigger = page.locator('[data-video-target="0"]');
    await trigger.scrollIntoViewIfNeeded();
    const beforeHost = await page.evaluate(() => ({ scrollY, bodyStyle: document.body.getAttribute('style') }));
    const openStartedAtMs = performance.now();
    await trigger.click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    await waitForValue(async () => Number(await gallery.locator('#xeg-toolbar-counter').getAttribute('data-total')) === VIDEO_COUNT
      ? true : undefined, 'eight production gallery entries');
    assert.equal(await gallery.locator('[data-gallery-element="item"]').count(), VIDEO_COUNT);
    assert(records.api.length > 0 && records.api.every(({ requestedId }) => requestedId === tweetId),
      'The gallery did not use the routed synthetic tweet API');
    await waitForValue(async () => (await itemState(page, 0))?.src === bestUrl
      ? true : undefined, 'active video source to attach before transport settlement');
    observation.initial = await itemState(page, 0);
    observation.timingsMs.activeSourceAttached = performance.now() - openStartedAtMs;
    assert.equal(observation.initial.admitted, 'true');
    assert.equal(observation.initial.preload, 'metadata');
    assertBestSource(observation.initial, bestUrl);
    observation.checks.push('active-video-source-attaches-before-response');
    releaseBest();
    await waitForValue(async () => records.video.some((record) => record.index === 0 && record.quality === 'lower')
      ? true : undefined, 'unsupported best MP4 to request the same-item lower variant');
    const beforeRecovery = await itemState(page, 0);
    assertBestSource(beforeRecovery, bestUrl);
    assert.equal(beforeRecovery.controls, true);
    const distant = [];
    for (let index = 1; index < VIDEO_COUNT; index++) {
      const state = await itemState(page, index);
      assert(state, `Missing video item ${index}`);
      if (state.box.top > state.viewport.bottom + state.viewport.height ||
        state.box.bottom < state.viewport.top - state.viewport.height) {
        assert.equal(state.admitted, 'false', `Distant video ${index} was admitted`);
        assert.equal(state.src, null, `Distant video ${index} attached a source`);
        assert.equal(state.preload, 'none', `Distant video ${index} has an active preload hint`);
        distant.push(index);
      }
    }
    assert(distant.length > 0, 'Fixture did not produce geometrically distant videos');
    await page.waitForTimeout(800);
    assert(distant.every((index) => records.video.every((record) => record.index !== index)),
      'A geometrically distant video requested its URL before activation');
    observation.distantBeforeActivation = distant;
    observation.beforeRecovery = beforeRecovery;
    observation.checks.push('distant-video-urls-absent-with-preload-count-20');

    const lowerReleasedAtMs = performance.now();
    releaseLower();
    await page.waitForFunction(() => {
      const item = document.querySelector('[data-xeg-gallery-container] [data-gallery-element="item"][data-index="0"]');
      const video = item?.querySelector('video');
      return item?.getAttribute('data-media-loaded') === 'true' &&
        video instanceof HTMLVideoElement && video.readyState >= 1 &&
        video.videoWidth > 0 && video.videoHeight > 0 && !video.error;
    }, null, { timeout: 20_000 });
    observation.metadata = await itemState(page, 0);
    observation.timingsMs.metadataAfterLowerRelease = performance.now() - lowerReleasedAtMs;
    assert.equal(observation.metadata.controls, true);
    observation.checks.push('metadata-ready-with-native-controls');
    await page.waitForFunction(() => {
      const item = document.querySelector('[data-xeg-gallery-container] [data-gallery-element="item"][data-index="0"]');
      const video = item?.querySelector('video');
      return item?.getAttribute('data-media-loaded') === 'true' &&
        item.getAttribute('data-video-first-frame') === 'true' &&
        video instanceof HTMLVideoElement && video.readyState >= 2 &&
        video.videoWidth > 0 && video.videoHeight > 0 && !video.error;
    }, null, { timeout: 20_000 });
    const recovered = await itemState(page, 0);
    observation.timingsMs.firstFrameAfterLowerRelease = performance.now() - lowerReleasedAtMs;
    assertBestSource(recovered, bestUrl);
    assert.equal(recovered.currentSrc, lowerUrl);
    assert.equal(recovered.metadata, 'true');
    assert.equal(recovered.firstFrame, 'true');
    assert.equal(recovered.videoWidth, 320);
    assert.equal(recovered.videoHeight, 180);
    assert.equal(recovered.error, null);
    assert.equal(recovered.controls, true);
    assert(Math.abs(recovered.box.width - beforeRecovery.box.width) <= 1 &&
      Math.abs(recovered.box.height - beforeRecovery.box.height) <= 1,
    'Logical video dimensions changed during recovery');
    const hint = (await gallery.locator('[role="status"]').allTextContents())
      .map((value) => value.trim()).find((value) => value.length > 0);
    assert(hint && !hint.includes('msg.gal.video.playbackFallback'),
      'Localized playback substitution hint is missing');
    const start = recovered.currentTime;
    await gallery.locator('[data-gallery-element="item"][data-index="0"] video').click();
    await page.waitForFunction((time) => {
      const video = document.querySelector('[data-xeg-gallery-container] [data-gallery-element="item"][data-index="0"] video');
      return video instanceof HTMLVideoElement && !video.paused && video.currentTime > time + 0.15;
    }, start, { timeout: 15_000 });
    observation.recovered = { ...recovered, playbackEnd: (await itemState(page, 0)).currentTime, hint };
    await page.screenshot({ path: join(output, 'video-recovery-gallery.png') });
    observation.checks.push('same-item-recovery-metadata-first-frame-playback-and-geometry');

    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').focus();
    await page.keyboard.press('ArrowRight');
    await waitForValue(async () => Number(await gallery.locator('#xeg-toolbar-counter').getAttribute('data-position')) === 2
      ? true : undefined, 'keyboard-selected second video');
    await waitForValue(async () => (await itemState(page, 1))?.src === videoUrl(tweetId, 1)
      ? true : undefined, 'keyboard-selected video source');
    observation.keyboard = await itemState(page, 1);
    assert.equal(observation.keyboard.admitted, 'true');
    assert.equal(observation.keyboard.src, videoUrl(tweetId, 1));
    observation.checks.push('keyboard-selection-attaches-source');

    await page.keyboard.press('ArrowLeft');
    await waitForValue(async () => Number(await gallery.locator('#xeg-toolbar-counter').getAttribute('data-position')) === 1
      ? true : undefined, 'returned best-source selection');
    const canonical = await itemState(page, 0);
    assertBestSource(canonical, bestUrl);
    assert.equal(canonical.currentSrc, lowerUrl);
    assert.equal(records.overflow, 0);
    assert.deepEqual(records.unexpectedVideo, []);
    assert(records.video.filter((record) => record.index === 0 && record.quality === 'best').length >= 1);
    assert(records.video.filter((record) => record.index === 0 && record.quality === 'lower').length >= 1);
    assert(records.video.every(({ status }) => status === 200 || status === 206 || status === 416),
      'The decode fixture must not turn an HTTP denial into playback fallback evidence');

    const knownIds = new Set((await extensionPage.evaluate(() => chrome.downloads.search({})))
      .map(({ id }) => id));
    const nativeMark = nativeLoopback.mark();
    const nativeBaseline = nativeLoopback.snapshot();
    assert(Number.isSafeInteger(nativeMark) && nativeMark >= 0,
      'Native loopback marker must identify the pre-download event boundary');
    const nativeStartedAtMs = performance.now();
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
    const native = await waitForValue(async () => {
      const matches = (await extensionPage.evaluate(() => chrome.downloads.search({})))
        .filter((item) => !knownIds.has(item.id));
      assert(matches.length <= 1, 'More than one native download began');
      if (matches[0]?.state === 'interrupted') {
        throw new Error(`Canonical best MP4 native download interrupted: ${matches[0].error ?? 'unknown'}`);
      }
      return matches[0]?.state === 'complete' ? matches[0] : undefined;
    }, 'canonical best MP4 native download', 30_000);
    observation.timingsMs.nativeBestCompletion = performance.now() - nativeStartedAtMs;
    const expectedName = `${handle}_${tweetId}_0.mp4`;
    assert.equal(basename(native.filename), expectedName);
    assert.equal(native.state, 'complete', 'Native browser download did not reach terminal success');
    assert.equal(native.url, bestUrl, 'Native download started from a different source URL');
    assert.equal(native.finalUrl, bestUrl, 'Native final URL differs from the canonical best MP4');
    assert(Number.isSafeInteger(native.id) && !knownIds.has(native.id),
      'Native browser download ID was not newly created for this action');
    const served = await waitForValue(async () => {
      const snapshot = nativeLoopback.snapshot();
      assert(!snapshot.overflow, 'Native loopback request records overflowed');
      assert.equal(snapshot.unexpectedCount, nativeBaseline.unexpectedCount,
        'Native loopback saw an unexpected request after the action');
      const later = nativeLoopback.since(nativeMark);
      assert(Array.isArray(later), 'Native loopback since(marker) must return bounded events');
      assert(later.every((event) => ['video.twimg.com', 'video.twimg.com:443'].includes(event.host) &&
        event.path === new URL(bestUrl).pathname),
        'Native loopback served a noncanonical recovery URL after the action');
      return later.find((event) => event.result === 'served' &&
        event.bytes === BAD_MP4.length &&
        event.sha256 === badSha256);
    }, 'native HTTPS loopback to serve the canonical best MP4');
    const relativeFile = relative(resolve(downloads), resolve(native.filename));
    assert(relativeFile && !relativeFile.startsWith('..') && !isAbsolute(relativeFile),
      'Native file escaped the task-owned download directory');
    const file = await readExactDownloadFile(native.filename, BAD_MP4.length);
    assert(file.bytes.equals(BAD_MP4), 'Native file differs from canonical best MP4 transport bytes');
    const fileSha256 = createHash('sha256').update(file.bytes).digest('hex');
    assert.equal(fileSha256, badSha256, 'Native file digest differs from served best MP4 bytes');
    await writeFile(join(output, 'video-recovery-current.mp4'), file.bytes, { flag: 'wx' });
    observation.download = { id: native.id, loopback: served,
      finalUrl: native.finalUrl, filename: expectedName, bytes: file.bytes.length,
      sha256: fileSha256, file: 'video-recovery-current.mp4',
      expectedDecode: 'invalid-controlled-best-bytes' };
    observation.checks.push('native-download-retains-canonical-best-bytes');

    const knownBeforeZip = new Set((await extensionPage.evaluate(() => chrome.downloads.search({})))
      .map(({ id }) => id));
    const zipStartedAtMs = performance.now();
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download 8 shown files as ZIP"]').click();
    const zip = await waitForValue(async () => {
      const matches = (await extensionPage.evaluate(() => chrome.downloads.search({})))
        .filter((item) => !knownBeforeZip.has(item.id));
      assert(matches.length <= 1, 'More than one native ZIP download began');
      if (matches[0]?.state === 'interrupted') {
        throw new Error(`Canonical video ZIP download interrupted: ${matches[0].error ?? 'unknown'}`);
      }
      return matches[0]?.state === 'complete' ? matches[0] : undefined;
    }, 'canonical video ZIP native download', 30_000);
    const expectedEntries = Array.from({ length: VIDEO_COUNT }, (_, index) => ({
      filename: `${handle}_${tweetId}_${index}.mp4`,
      bytes: index === 0 ? BAD_MP4 : validMp4,
    }));
    assert.equal(basename(zip.filename), `${handle}_${tweetId}.zip`);
    const zipRelativeFile = relative(resolve(downloads), resolve(zip.filename));
    assert(zipRelativeFile && !zipRelativeFile.startsWith('..') && !isAbsolute(zipRelativeFile),
      'Video ZIP escaped the task-owned download directory');
    const zipFile = await readExactDownloadFile(zip.filename, expectedStoredZipBytes(expectedEntries));
    const verified = verifyStoredZip(zipFile.bytes, expectedEntries);
    await writeFile(join(output, 'video-recovery.zip'), zipFile.bytes, { flag: 'wx' });
    observation.zip = { id: zip.id, filename: basename(zip.filename),
      bytes: zipFile.bytes.length, sha256: createHash('sha256').update(zipFile.bytes).digest('hex'),
      file: 'video-recovery.zip', verified,
      firstEntrySource: bestUrl, firstEntryDecode: 'invalid-controlled-best-bytes' };
    observation.timingsMs.zipCompletion = performance.now() - zipStartedAtMs;
    observation.checks.push('zip-retains-canonical-best-bytes-order-and-crc-after-playback-fallback');

    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    const afterHost = await page.evaluate(() => ({ scrollY, bodyStyle: document.body.getAttribute('style') }));
    observation.hostRestoration = { before: beforeHost, after: afterHost };
    assert.deepEqual(afterHost, beforeHost, 'Gallery close did not restore host scroll and inline style');
    observation.checks.push('host-scroll-and-style-restored');
    return observation;
  } catch (error) {
    primaryError = error;
    observation.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    await page.screenshot({ path: join(output, 'video-loading-failure.png') }).catch(() => {});
    await writeFile(join(output, 'video-loading-failure.json'), JSON.stringify(observation, null, 2)).catch(() => {});
    throw error;
  } finally {
    releaseBest();
    releaseLower();
    const cleanupFailures = [];
    try {
      await context.unroute('**/*', routeHandler);
      observation.cleanup.routeRemoved = true;
    } catch (error) {
      cleanupFailures.push(error);
      observation.cleanup.routeError = String(error);
    }
    if (settingsChanged) {
      try {
        await extensionPage.evaluate(async ({ key, previous }) => {
          if (previous.exists) await chrome.storage.local.set({ [key]: previous.value });
          else await chrome.storage.local.remove(key);
        }, { key: SETTINGS_KEY, previous: settingsBefore });
        const restored = await extensionPage.evaluate(async ({ key, previous }) => {
          const values = await chrome.storage.local.get(key);
          return Object.hasOwn(values, key) === previous.exists &&
            (!previous.exists || JSON.stringify(values[key]) === JSON.stringify(previous.value));
        }, { key: SETTINGS_KEY, previous: settingsBefore });
        assert(restored, 'Task-owned gallery settings were not restored');
        observation.cleanup.settingsRestored = true;
      } catch (error) {
        cleanupFailures.push(error);
        observation.cleanup.settingsError = String(error);
      }
    } else observation.cleanup.settingsRestored = true;
    try {
      await page.setViewportSize(viewportBefore);
      observation.cleanup.viewportRestored = true;
    } catch (error) {
      cleanupFailures.push(error);
      observation.cleanup.viewportError = String(error);
    }
    if (primaryError || cleanupFailures.length) {
      await writeFile(join(output, 'video-loading-failure.json'), JSON.stringify(observation, null, 2))
        .catch(() => {});
    }
    if (cleanupFailures.length) {
      throw new AggregateError(primaryError ? [primaryError, ...cleanupFailures] : cleanupFailures,
        'Video loading assertion and/or task-owned cleanup failed');
    }
  }
}
