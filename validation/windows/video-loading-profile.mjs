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

function fixtureHtml(tweetId, handle, count = VIDEO_COUNT) {
  const players = Array.from({ length: count }, (_, index) => `
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

function apiResponse(tweetId, handle, count = VIDEO_COUNT) {
  const media = Array.from({ length: count }, (_, index) => ({
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
      muted: video.muted, volume: video.volume, seeking: video.seeking,
      currentIndex: Number(gallery?.querySelector('[data-gallery-element="toolbar"]')?.getAttribute('data-current-index')),
      focusedIndex: Number(gallery?.querySelector('[data-gallery-element="toolbar"]')?.getAttribute('data-focused-index')),
      box: { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height },
      viewport: { top: rootRect.top, bottom: rootRect.bottom, height: rootRect.height,
        clientHeight: root.clientHeight, scrollTop: root.scrollTop },
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
    const followupErrors = [];
    try { observation.geometry = await runAdmissionGeometryCases({ context, validMp4, output }); }
    catch (error) { followupErrors.push(error); }
    try {
      observation.recoveryIntent = await runRecoveryIntentCases({ context, validMp4, output, nativeLoopback });
    } catch (error) { followupErrors.push(error); }
    if (followupErrors.length) throw new AggregateError(followupErrors,
      'Required video admission and recovery intent cases failed');
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

/** A bounded real decode failure after playback; MP4 metadata and early samples stay valid. */
function delayedDecodeFailure(validMp4) {
  assert.equal(createHash('sha256').update(validMp4).digest('hex'),
    'ddffb3c8da4ab0b9ec96a8a92e1fa7d09fbbdf9a73d7ce34e819a05e1c536fd3',
    'The declared four-second H.264 fixture changed; recheck its sample table');
  assert.equal(validMp4.length, 3086);
  const bytes = Buffer.from(validMp4);
  // ffprobe identifies 11-byte P samples from 0.75 s at byte 2228. Preserve
  // atom/sample tables and every initial decodable sample, corrupt later AVCC lengths.
  for (let offset = 2228; offset < bytes.length; offset += 11) bytes.writeUInt32BE(0xffffffff, offset);
  return { bytes, prefixEnd: 2228 };
}

async function runRecoveryIntentCases({ context, validMp4, output, nativeLoopback }) {
  assert(typeof nativeLoopback.armVideoHold === 'function' &&
    typeof nativeLoopback.completeVideoHold === 'function' &&
    typeof nativeLoopback.abortVideoHold === 'function');
  const damaged = delayedDecodeFailure(validMp4);
  const cases = [];
  const requests = [];
  const pages = [];
  const evidence = { status: 'running', cases, requests, prefixEnd: damaged.prefixEnd,
    bestPayloadSha256: createHash('sha256').update(damaged.bytes).digest('hex'),
    pausedObservationMs: 700, maxMediaEvents: 64,
    cleanup: { routesRemoved: false, pagesClosed: false, videoHoldReleased: false,
      fixturePermissionRestored: false, permissionSessionDetached: false } };
  let active;
  let primaryError;
  let permissionSession;
  let permissionBefore;
  let permissionPage;
  const handler = async (route) => {
    if (!active) return route.fallback();
    const target = new URL(route.request().url());
    if (route.request().isNavigationRequest() && target.href === active.url) {
      return route.fulfill({ status: 200, contentType: 'text/html',
        body: fixtureHtml(active.id, 'intentrecovery') });
    }
    if (target.hostname === 'x.com' && target.pathname.endsWith('/TweetResultByRestId')) {
      let id;
      try { id = JSON.parse(target.searchParams.get('variables') ?? '{}').tweetId; }
      catch { return route.fallback(); }
      if (id === active.id) return route.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify(apiResponse(id, 'intentrecovery')) });
    }
    if (target.hostname === 'pbs.twimg.com' &&
      target.pathname.startsWith(`/ext_tw_video_thumb/${active.id}/pu/img/video-`)) {
      return route.fulfill({ status: 200, contentType: 'image/png', body: POSTER_PNG });
    }
    if (target.hostname === 'video.twimg.com') {
      const match = new RegExp(`^/ext_tw_video/${active.id}/pu/vid/320x180/video-([0-7])-(best|lower)\\.mp4$`, 'u').exec(target.pathname);
      if (!match || (match[2] === 'lower' && match[1] !== '0')) return route.fallback();
      assert(requests.length < MAX_REQUESTS, 'Recovery-intent request observations overflowed');
      const record = { case: active.name, index: Number(match[1]), quality: match[2],
        atMonotonicMs: performance.now(), range: route.request().headers().range ?? null };
      requests.push(record);
      if (match[1] === '0' && match[2] === 'best') {
        // Only this exact declared source reaches the bounded mapped HTTPS server.
        return route.continue();
      }
      if (match[2] === 'lower') await active.lowerGate;
      const range = /^bytes=(\d+)-(\d*)$/u.exec(route.request().headers().range ?? '');
      const start = range ? Number(range[1]) : 0;
      const end = Math.min(range?.[2] ? Number(range[2]) : validMp4.length - 1, validMp4.length - 1);
      assert(start >= 0 && start <= end && end < validMp4.length, 'Unexpected controlled media range');
      const bytes = validMp4.subarray(start, end + 1);
      record.fulfilledAtMonotonicMs = performance.now();
      return route.fulfill({ status: range ? 206 : 200, contentType: 'video/mp4', body: bytes,
        headers: { 'Accept-Ranges': 'bytes', 'Content-Length': String(bytes.length),
          ...(range ? { 'Content-Range': `bytes ${start}-${end}/${validMp4.length}` } : {}) } });
    }
    return route.fallback();
  };
  const stateWhen = (page, predicate, description, timeout = 15_000) =>
    waitForValue(async () => {
      const value = await itemState(page, 0);
      return value && predicate(value) ? value : undefined;
    }, description, timeout);
  const scrollOut = async (page) => {
    await page.locator('[data-xeg-gallery-container] [data-gallery-element="items"]').hover();
    await page.mouse.wheel(0, 1500);
    return stateWhen(page, (value) => value.box.bottom < value.viewport.top - 4 &&
      value.paused && value.muted, 'recovering video to become outside, paused and visibility-muted');
  };
  const scrollBack = async (page) => {
    await page.locator('[data-xeg-gallery-container] [data-gallery-element="items"]').hover();
    await page.mouse.wheel(0, -1500);
    return stateWhen(page, (value) => value.box.top >= value.viewport.top - 1 &&
      value.box.bottom <= value.viewport.bottom + 1, 'recovering video to return inside the scrollport');
  };
  const stablePaused = async (page) => {
    const first = await stateWhen(page, (value) => value.metadata === 'true' &&
      value.readyState >= 1 && !value.seeking, 'replacement metadata and settled seek');
    await page.waitForTimeout(evidence.pausedObservationMs);
    const after = await itemState(page, 0);
    assert.equal(after.paused, true, 'Delayed recovery resumed contrary to fresh intent');
    assert(after.currentTime - first.currentTime <= 0.05,
      'Playback progressed during the required paused observation');
    return { before: first, after, progress: after.currentTime - first.currentTime };
  };
  await context.route('**/*', handler);
  try {
    // The compatibility query can be granted while loopback itself is denied.
    // Set and restore only the actual descriptor in this owned persistent profile.
    permissionPage = context.pages().find((value) => value.url().startsWith('https://x.com/'));
    assert(permissionPage, 'An existing owned fixture page is required');
    const browser = context.browser();
    assert(browser, 'The installed persistent Chromium browser is required');
    permissionSession = await browser.newBrowserCDPSession();
    const contexts = await permissionSession.send('Target.getBrowserContexts');
    assert.deepEqual(contexts.browserContextIds, [],
      'This fixture requires its isolated persistent default context');
    permissionBefore = await permissionPage.evaluate(async () =>
      (await navigator.permissions.query({ name: 'loopback-network' })).state);
    evidence.fixturePermission = { name: 'loopback-network', origin: 'https://x.com',
      context: 'owned-persistent-default', before: permissionBefore };
    evidence.browserVersion = await permissionSession.send('Browser.getVersion');
    await permissionSession.send('Browser.setPermission', { permission: { name: 'loopback-network' },
      setting: 'granted', origin: 'https://x.com' });
    for (const [index, name] of [
      'metadata-while-outside', 'reenter-before-metadata', 'later-user-pause-mute-volume',
    ].entries()) {
      const id = `466600011122233377${index + 1}`;
      let releaseLower;
      const lowerGate = new Promise((resolve) => { releaseLower = resolve; });
      active = { id, name, url: `https://x.com/intentrecovery/status/${id}`, lowerGate };
      nativeLoopback.setRecoveryPayloads({ tweetId: id, validMp4, badMp4: damaged.bytes });
      const nativeMark = nativeLoopback.mark();
      nativeLoopback.armVideoHold(new URL(videoUrl(id, 0)).pathname, damaged.prefixEnd);
      const page = await context.newPage();
      pages.push(page);
      const observed = { name, id, status: 'running', best: videoUrl(id, 0),
        lower: videoUrl(id, 0, 'lower'), pageErrors: [], requestFailures: [], consoleErrors: [] };
      cases.push(observed);
      const onPageError = (error) => {
        assert(observed.pageErrors.length < MAX_REQUESTS);
        observed.pageErrors.push(error.message.slice(0, 500));
      };
      const onRequestFailed = (request) => {
        assert(observed.requestFailures.length < MAX_REQUESTS);
        observed.requestFailures.push({ url: request.url(), reason: request.failure()?.errorText });
      };
      const onConsole = (message) => {
        if (message.type() !== 'error') return;
        assert(observed.consoleErrors.length < MAX_REQUESTS);
        observed.consoleErrors.push({ text: message.text().slice(0, 500),
          location: message.location().url });
      };
      page.on('pageerror', onPageError);
      page.on('requestfailed', onRequestFailed);
      page.on('console', onConsole);
      try {
        await page.setViewportSize({ width: 1280, height: 500 });
        await page.goto(active.url);
        await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
        observed.permission = await page.evaluate(async () =>
          (await navigator.permissions.query({ name: 'loopback-network' })).state);
        assert.equal(observed.permission, 'granted');
        await page.locator('[data-video-target="0"]').click();
        await page.locator('[data-xeg-gallery-container]').waitFor({ state: 'visible' });
        const originalControl = page.locator('[data-xeg-gallery-container]')
          .getByRole('button', { name: 'Original', exact: true });
        if (await originalControl.getAttribute('aria-pressed') !== 'true') await originalControl.click();
        const video = page.locator('[data-gallery-element="item"][data-index="0"] video');
        await video.evaluate((element) => {
          const state = { records: [], overflow: false, listeners: [] };
          for (const type of ['loadstart', 'loadedmetadata', 'loadeddata', 'play', 'playing', 'pause', 'error', 'volumechange', 'keydown']) {
            const listener = (event) => {
              if (state.records.length >= 64) { state.overflow = true; return; }
              state.records.push({ type, trusted: event.isTrusted,
                atPageMonotonicMs: performance.now(), source: element.currentSrc,
                attribute: element.getAttribute('src'), error: element.error?.code ?? null,
                time: element.currentTime, paused: element.paused, muted: element.muted,
                volume: element.volume, key: event instanceof KeyboardEvent ? event.key : null });
            };
            element.addEventListener(type, listener, true);
            state.listeners.push([type, listener]);
          }
          window.__xegRecoveryEventObservation = state;
        });
        const initial = await stateWhen(page, (value) => value.readyState >= 2 &&
          value.videoWidth === 320 && value.videoHeight === 180 && !value.error,
        'valid initial frames before the corrupt tail');
        assert.equal(nativeLoopback.videoHeld(), true,
          'The native HTTPS source must still hold later samples');
        await video.focus();
        if (initial.muted) await page.keyboard.press('m');
        observed.beforePlay = await itemState(page, 0);
        assert.equal(observed.beforePlay.muted, false, 'Ordinary mute control did not unmute the visible video');
        await video.click();
        observed.playingOriginal = await stateWhen(page, (value) => !value.paused &&
          value.currentTime > observed.beforePlay.currentTime + 0.15,
        'actual trusted playback progression before corruption');
        nativeLoopback.completeVideoHold();
        observed.corruptTailReleasedAtMonotonicMs = performance.now();
        await waitForValue(async () => requests.some((record) =>
          record.case === name && record.index === 0 && record.quality === 'lower') ? true : undefined,
        'native decoder error to select and request the same-item replacement');
        const eventRecords = await page.evaluate(() => window.__xegRecoveryEventObservation.records);
        // Match outside the page: the observer records native events without injecting them.
        observed.decodeError = eventRecords.find((event) => event.type === 'error' &&
          event.error === 3 && event.source === observed.best && event.trusted);
        assert(observed.decodeError, 'A real native code-3 error after playback is required');
        observed.pending = await itemState(page, 0);
        assert.equal(observed.pending.src, observed.lower);

        if (name === 'later-user-pause-mute-volume') {
          await video.focus();
          await page.keyboard.press('Space');
          await stateWhen(page, (value) => !value.paused, 'pending-source play intent from supported Space control');
          await page.keyboard.press('Space');
          observed.userPaused = await stateWhen(page, (value) => value.paused,
            'subsequent deliberate pause through supported Space control');
          const volumeBefore = observed.userPaused.volume;
          await page.keyboard.press('ArrowDown');
          await stateWhen(page, (value) => value.volume < volumeBefore,
            'later volume change through the supported keyboard control');
          if (!(await itemState(page, 0)).muted) await page.keyboard.press('m');
          observed.userControls = await stateWhen(page, (value) => value.muted,
            'later deliberate mute before replacement metadata');
          releaseLower();
          observed.pausedAfterMetadata = await stablePaused(page);
          assert.equal(observed.pausedAfterMetadata.after.muted, observed.userControls.muted);
          assert.equal(observed.pausedAfterMetadata.after.volume, observed.userControls.volume);
          await scrollOut(page);
          await scrollBack(page);
          observed.pausedAfterReentry = await stablePaused(page);
        } else {
          observed.outsideBeforeMetadata = await scrollOut(page);
          if (name === 'reenter-before-metadata') observed.reenteredBeforeMetadata = await scrollBack(page);
          releaseLower();
          if (name === 'metadata-while-outside') {
            observed.pausedOutside = await stablePaused(page);
            assert.equal(observed.pausedOutside.after.muted, true,
              'Recovery metadata undid visibility-imposed mute');
            observed.reentered = await scrollBack(page);
          }
          const resumeStart = await stateWhen(page, (value) => value.metadata === 'true' &&
            value.currentSrc === observed.lower && !value.seeking,
          'replacement metadata before legitimate resume progress');
          observed.resumed = await stateWhen(page, (value) => !value.paused && !value.muted &&
            value.currentTime > resumeStart.currentTime + 0.15,
          'latest visible playback intent to resume with positive progress');
        }
        assertBestSource(await itemState(page, 0), observed.best);
        observed.nativeRequests = nativeLoopback.since(nativeMark);
        assert(observed.nativeRequests.some((record) => record.path === new URL(observed.best).pathname &&
          record.result === 'served'), 'The bounded real HTTPS source was not served');
        assert.deepEqual(observed.pageErrors, []);
        assert.deepEqual(observed.requestFailures.filter((record) =>
          record.url !== observed.best || record.reason !== 'net::ERR_ABORTED'), [],
        'Recovery fixture has failures beyond its exact intentionally damaged source');
        assert.deepEqual(observed.consoleErrors.filter((record) =>
          record.location !== observed.best || !record.text.includes('net::ERR_ABORTED')), [],
        'Recovery fixture logged an unexpected console error');
        observed.status = 'passed';
      } catch (error) {
        observed.status = 'failed';
        observed.error = error instanceof Error ? error.message : String(error);
        observed.nativeRequests = nativeLoopback.since(nativeMark);
      } finally {
        releaseLower();
        nativeLoopback.abortVideoHold();
        if (!page.isClosed()) {
          observed.mediaEvents = await page.evaluate(() => {
            const state = window.__xegRecoveryEventObservation;
            if (!state) return { records: [], overflow: false };
            const video = document.querySelector('[data-gallery-element="item"][data-index="0"] video');
            if (video) for (const [type, listener] of state.listeners) video.removeEventListener(type, listener, true);
            delete window.__xegRecoveryEventObservation;
            return { records: state.records, overflow: state.overflow };
          });
          assert.equal(observed.mediaEvents.overflow, false, 'Native media event observation overflowed');
          await page.screenshot({ path: join(output, `video-recovery-intent-${name}.png`) });
          if (await page.locator('[data-xeg-gallery-container]').count()) await page.keyboard.press('Escape');
        }
        page.off('pageerror', onPageError);
        page.off('requestfailed', onRequestFailed);
        page.off('console', onConsole);
        await page.close();
      }
    }
    assert.deepEqual(cases.filter((item) => item.status !== 'passed').map((item) =>
      ({ name: item.name, error: item.error })), [], 'Required native recovery intent cases failed');
    evidence.status = 'passed';
    return evidence;
  } catch (error) {
    primaryError = error;
    evidence.status = 'failed';
    evidence.error = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    const errors = [];
    nativeLoopback.abortVideoHold();
    evidence.cleanup.videoHoldReleased = !nativeLoopback.videoHeld();
    await context.unroute('**/*', handler).then(() => { evidence.cleanup.routesRemoved = true; })
      .catch((error) => errors.push(error));
    if (permissionSession && permissionBefore) {
      try {
        await permissionSession.send('Browser.setPermission', { permission: { name: 'loopback-network' },
          setting: permissionBefore, origin: 'https://x.com' });
        const after = await permissionPage.evaluate(async () =>
          (await navigator.permissions.query({ name: 'loopback-network' })).state);
        assert.equal(after, permissionBefore, 'The exact fixture permission did not restore');
        evidence.fixturePermission.after = after;
        evidence.cleanup.fixturePermissionRestored = true;
      } catch (error) { errors.push(error); }
    } else evidence.cleanup.fixturePermissionRestored = true;
    if (permissionSession) {
      await permissionSession.detach().then(() => { evidence.cleanup.permissionSessionDetached = true; })
        .catch((error) => errors.push(error));
    } else evidence.cleanup.permissionSessionDetached = true;
    const closing = await Promise.allSettled(pages.filter((page) => !page.isClosed()).map((page) => page.close()));
    evidence.cleanup.pagesClosed = pages.every((page) => page.isClosed());
    errors.push(...closing.filter((result) => result.status === 'rejected').map((result) => result.reason));
    evidence.cleanup.errors = errors.map((error) => error instanceof Error ? error.message : String(error));
    if (errors.length) evidence.status = 'failed';
    await writeFile(join(output, 'video-recovery-intent-observations.json'), JSON.stringify(evidence, null, 2));
    if (errors.length) throw new AggregateError(primaryError ? [primaryError, ...errors] : errors,
      'Recovery intent fixture cleanup failed');
  }
}

/** Real layout/IntersectionObserver observations; no observer or application replacement. */
async function runAdmissionGeometryCases({ context, validMp4, output }) {
  const count = 12;
  const cases = [];
  const requests = [];
  const pages = [];
  const evidence = { status: 'running', cases, requests,
    admissionDeadlineMs: 1_500, distantObservationMs: 800,
    cleanup: { routesRemoved: false, pagesClosed: false } };
  let active;
  let primaryError;
  const handler = async (route) => {
    if (!active) return route.fallback();
    const target = new URL(route.request().url());
    if (route.request().isNavigationRequest() && target.href === active.url) {
      return route.fulfill({ status: 200, contentType: 'text/html',
        body: fixtureHtml(active.id, 'admissioncheck', count) });
    }
    if (target.hostname === 'x.com' && target.pathname.endsWith('/TweetResultByRestId')) {
      let id;
      try { id = JSON.parse(target.searchParams.get('variables') ?? '{}').tweetId; }
      catch { return route.fallback(); }
      if (id === active.id) {
        return route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify(apiResponse(id, 'admissioncheck', count)) });
      }
    }
    if (target.hostname === 'pbs.twimg.com' &&
      target.pathname.startsWith(`/ext_tw_video_thumb/${active.id}/pu/img/video-`)) {
      return route.fulfill({ status: 200, contentType: 'image/png', body: POSTER_PNG });
    }
    if (target.hostname === 'video.twimg.com') {
      const matched = new RegExp(`^/ext_tw_video/${active.id}/pu/vid/320x180/video-(\\d+)-best\\.mp4$`, 'u').exec(target.pathname);
      if (matched && Number(matched[1]) < count) {
        assert(requests.length < MAX_REQUESTS, 'Geometry media request cap exceeded');
        requests.push({ case: active.name, index: Number(matched[1]),
          atMonotonicMs: performance.now(), range: route.request().headers().range ?? null });
        return route.fulfill({ status: 200, contentType: 'video/mp4', body: validMp4 });
      }
    }
    return route.fallback();
  };
  const readAll = async (page) => {
    const states = [];
    for (let index = 0; index < count; index++) states.push(await itemState(page, index));
    assert(states.every(Boolean), 'The real gallery geometry inventory is incomplete');
    return states;
  };
  const isNear = (state, direction) => state.index !== state.currentIndex &&
    state.index !== state.focusedIndex && (direction === 'below'
      ? state.box.top > state.viewport.bottom + 8 &&
        state.box.top < state.viewport.bottom + state.viewport.clientHeight - 8
      : state.box.bottom < state.viewport.top - 8 &&
        state.box.bottom > state.viewport.top - state.viewport.clientHeight + 8);
  const isFar = (state) => state.box.top > state.viewport.bottom + state.viewport.clientHeight + 8 ||
    state.box.bottom < state.viewport.top - state.viewport.clientHeight - 8;
  const checkNear = async (page, target, descriptor) => {
    await waitForValue(async () => {
      const now = await itemState(page, target.index);
      return now?.admitted === 'true' && now.src === videoUrl(descriptor.id, target.index) &&
        requests.some((record) => record.case === descriptor.name && record.index === target.index)
        ? now : undefined;
    }, `unselected ${descriptor.direction} video admission`, evidence.admissionDeadlineMs);
    const now = await itemState(page, target.index);
    assert(isNear(now, descriptor.direction), 'Admission must precede selection/focus/visible entry');
    assert.equal(now.paused, true, 'Advance admission must not play the off-screen video');
    return now;
  };
  await context.route('**/*', handler);
  try {
    for (const descriptor of [
      { name: 'below-normal-resize', id: '4666000111222333661', selected: 0,
        direction: 'below', viewport: { width: 1280, height: 500 }, resize: { width: 1280, height: 900 } },
      { name: 'above-narrow-tall-resize', id: '4666000111222333662', selected: 11,
        direction: 'above', viewport: { width: 700, height: 800 }, resize: { width: 700, height: 1000 } },
    ]) {
      active = { ...descriptor, url: `https://x.com/admissioncheck/status/${descriptor.id}` };
      const page = await context.newPage();
      pages.push(page);
      const observed = { ...descriptor, status: 'running' };
      cases.push(observed);
      try {
        await page.setViewportSize(descriptor.viewport);
        await page.goto(active.url);
        await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
        await page.locator(`[data-video-target="${descriptor.selected}"]`).click();
        await page.locator('[data-xeg-gallery-container]').waitFor({ state: 'visible' });
        await waitForValue(async () => {
          const selected = await itemState(page, descriptor.selected);
          return selected?.metadata === 'true' && selected.readyState >= 1 &&
            selected.currentIndex === descriptor.selected && selected.focusedIndex === descriptor.selected
            ? true : undefined;
        }, 'selected real-layout video metadata and identity');
        const states = await readAll(page);
        observed.initial = states;
        const near = states.find((state) => isNear(state, descriptor.direction));
        assert(near, 'Fixture has no unselected/unfocused near-but-not-visible target');
        const distant = states.filter((state) => isFar(state) && state.src === null);
        assert(distant.length > 0, 'Fixture has no separate never-admitted far target');
        observed.nearBefore = near;
        observed.nearAfter = await checkNear(page, near, descriptor);
        observed.distant = distant;
        await page.waitForTimeout(evidence.distantObservationMs);
        assert(distant.every((state) => !requests.some((record) =>
          record.case === descriptor.name && record.index === state.index)),
        'A never-admitted distant video requested its body');

        await page.setViewportSize(descriptor.resize);
        await page.waitForTimeout(100);
        const resized = await readAll(page);
        observed.resized = resized;
        assert(resized[0].viewport.clientHeight > states[0].viewport.clientHeight,
          'The actual gallery scrollport did not grow with the viewport');
        const entering = resized.find((state) => distant.some((old) => old.index === state.index) &&
          isNear(state, descriptor.direction));
        assert(entering, 'Resize did not move a never-admitted item into the advance region');
        observed.admittedAfterResize = await checkNear(page, entering, descriptor);
        const oldRoot = await page.locator('[data-xeg-gallery-container] [data-gallery-element="items"]').elementHandle();
        await page.keyboard.press('Escape');
        await page.locator('[data-xeg-gallery-container]').waitFor({ state: 'detached' });
        assert.equal(await oldRoot.evaluate((root) => root.isConnected), false);
        await page.locator(`[data-video-target="${descriptor.selected}"]`).click();
        await page.locator('[data-xeg-gallery-container]').waitFor({ state: 'visible' });
        const reopened = await waitForValue(async () => {
          const values = await readAll(page);
          const target = values.find((value) => isNear(value, descriptor.direction));
          return target ? target : undefined;
        }, 'replacement gallery root near target');
        observed.reopenedNear = await checkNear(page, reopened, descriptor);
        observed.retiredRootDisconnected = true;
        await oldRoot.dispose();
        observed.status = 'passed';
      } catch (error) {
        observed.status = 'failed';
        observed.error = error instanceof Error ? error.message : String(error);
      } finally {
        await page.screenshot({ path: join(output, `video-admission-${descriptor.name}.png`) });
        if (await page.locator('[data-xeg-gallery-container]').count()) await page.keyboard.press('Escape');
        await page.close();
      }
    }
    assert.deepEqual(cases.filter((item) => item.status !== 'passed').map((item) =>
      ({ name: item.name, error: item.error })), [], 'Required actual-scroll-root geometry cases failed');
    evidence.status = 'passed';
    return evidence;
  } catch (error) {
    primaryError = error;
    evidence.status = 'failed';
    evidence.error = error instanceof Error ? error.message : String(error);
    throw error;
  } finally {
    const errors = [];
    await context.unroute('**/*', handler).then(() => { evidence.cleanup.routesRemoved = true; })
      .catch((error) => errors.push(error));
    const closing = await Promise.allSettled(pages.filter((page) => !page.isClosed()).map((page) => page.close()));
    evidence.cleanup.pagesClosed = pages.every((page) => page.isClosed());
    errors.push(...closing.filter((result) => result.status === 'rejected').map((result) => result.reason));
    evidence.cleanup.errors = errors.map((error) => error instanceof Error ? error.message : String(error));
    if (errors.length) evidence.status = 'failed';
    await writeFile(join(output, 'video-admission-geometry-observations.json'), JSON.stringify(evidence, null, 2));
    if (errors.length) throw new AggregateError(primaryError ? [primaryError, ...errors] : errors,
      'Geometry fixture cleanup failed');
  }
}
