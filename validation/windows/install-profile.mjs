// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash, randomUUID } from 'node:crypto';
import {
  copyFile,
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path';
import {
  createControlledVideoSettings,
  observeLiveUrls,
  validateLiveObservation,
  validateLiveUrls,
} from './live-page.mjs';
import {
  QUOTED_CASES,
  UNAVAILABLE_SEQUENCE,
  quotedVideoApiResponse,
} from '../../test/e2e/fixtures/installed-quoted-video-api.mjs';

const PROFILE_PREFIX = 'xeg-chrome-install-';
const DEFAULT_NOTIFICATION_ICON = 'icons/icon-128x128.png';
const TWEET_ID = '1234567890123456789';
const FIXTURE_URL = `https://x.com/testuser/status/${TWEET_ID}`;
const PUBLIC_TWEET_ID = '9876543210987654321';
const PUBLIC_FIXTURE_URL = `https://x.com/public_user/status/${PUBLIC_TWEET_ID}`;
const DOWNLOAD_TRACKING_STORAGE_KEY = 'xeg.download-tracking.v1';
const MV3_RESTART_BLOB_BYTES = 256 * 1024 * 1024;
const TRUSTED_INPUT_DOWNLOAD_BYTES = 64 * 1024 * 1024;
const IMAGE_URL_MARKERS = ['GkE1234', 'GkE5678', 'GkE9012'];
const MAX_AGGREGATE_DEPTH = 2;
const MAX_AGGREGATE_ERRORS = 4;
const MAX_ERROR_SUMMARY_LENGTH = 2000;
const MAX_UNAVAILABLE_API_RECORDS = 8;
const CYCLES = [
  { close: 'escape', direction: 'ArrowLeft', expectedIndex: 0, triggerIndex: 1 },
  { close: 'button', direction: 'ArrowRight', expectedIndex: 1, triggerIndex: 0 },
  { close: 'escape', direction: 'ArrowRight', expectedIndex: 2, triggerIndex: 1 },
];

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function waitForValue(readValue, description, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let lastValue;
  while (Date.now() < deadline) {
    lastValue = await readValue();
    if (lastValue !== undefined) return lastValue;
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${description}: ${JSON.stringify(lastValue)}`);
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

async function createServiceWorkerObserver(browserCdp, pageCdp) {
  // Chromium exposes target discovery on the browser agent host and the
  // ServiceWorker domain through a render-frame agent host.
  const serviceWorkerTargetIds = new Set();
  const targetEvents = [];
  const versionEvents = [];
  const versions = new Map();
  const onTargetCreated = ({ targetInfo }) => {
    if (targetInfo.type === 'service_worker') {
      serviceWorkerTargetIds.add(targetInfo.targetId);
      targetEvents.push({
        event: 'created',
        sequence: targetEvents.length + 1,
        targetId: targetInfo.targetId,
        targetInfo: structuredClone(targetInfo),
        url: targetInfo.url,
      });
    }
  };
  const onTargetDestroyed = ({ targetId }) => {
    if (serviceWorkerTargetIds.has(targetId)) {
      targetEvents.push({
        event: 'destroyed',
        sequence: targetEvents.length + 1,
        targetId,
      });
    }
  };
  const onWorkerVersionUpdated = ({ versions: updatedVersions }) => {
    for (const version of updatedVersions) {
      const snapshot = {
        ...structuredClone(version),
        sequence: versionEvents.length + 1,
      };
      versionEvents.push(snapshot);
      versions.set(version.versionId, snapshot);
    }
  };
  const removeListeners = () => {
    browserCdp.off('Target.targetCreated', onTargetCreated);
    browserCdp.off('Target.targetDestroyed', onTargetDestroyed);
    pageCdp.off('ServiceWorker.workerVersionUpdated', onWorkerVersionUpdated);
  };
  try {
    browserCdp.on('Target.targetCreated', onTargetCreated);
    browserCdp.on('Target.targetDestroyed', onTargetDestroyed);
    pageCdp.on('ServiceWorker.workerVersionUpdated', onWorkerVersionUpdated);
    await browserCdp.send('Target.setDiscoverTargets', { discover: true });
    await pageCdp.send('ServiceWorker.enable');
  } catch (error) {
    removeListeners();
    const cleanup = await Promise.allSettled([
      pageCdp.send('ServiceWorker.disable'),
      browserCdp.send('Target.setDiscoverTargets', { discover: false }),
    ]);
    const detach = await Promise.allSettled([pageCdp.detach()]);
    const failures = [...cleanup, ...detach]
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason);
    if (failures.length) {
      throw new AggregateError(
        [error, ...failures],
        'Service Worker observer initialization and cleanup failed'
      );
    }
    throw error;
  }

  const workerScriptUrl = (extensionId) => `chrome-extension://${extensionId}/background.js`;
  const currentTargets = async (extensionId) => {
    const { targetInfos } = await browserCdp.send('Target.getTargets');
    return targetInfos.filter(
      ({ type, url }) => type === 'service_worker' && url === workerScriptUrl(extensionId)
    );
  };
  const createdTargetIds = (extensionId) =>
    targetEvents
      .filter(
        ({ event, url }) => event === 'created' && url === workerScriptUrl(extensionId)
      )
      .map(({ targetId }) => targetId);
  const matchingTargetEvents = (extensionId) => {
    const matchingTargetIds = new Set(
      targetEvents
        .filter(({ url }) => url === workerScriptUrl(extensionId))
        .map(({ targetId }) => targetId)
    );
    return targetEvents.filter(({ targetId }) => matchingTargetIds.has(targetId));
  };
  const matchingVersionEvents = (extensionId) =>
    versionEvents.filter(({ scriptURL }) => scriptURL === workerScriptUrl(extensionId));
  const snapshot = async (extensionId) => ({
    currentTargets: structuredClone(await currentTargets(extensionId)),
    targetEvents: structuredClone(matchingTargetEvents(extensionId)),
    versionEvents: structuredClone(matchingVersionEvents(extensionId)),
    versionStates: structuredClone(
      [...versions.values()].filter(
        ({ scriptURL }) => scriptURL === workerScriptUrl(extensionId)
      )
    ),
  });
  const runningWorkerAfter = (extensionId, worker, lifecycleSequence, targets) => {
    const runningEvent = matchingVersionEvents(extensionId).findLast(
      ({ runningStatus, sequence, versionId }) =>
        versionId === worker.versionId &&
        sequence > lifecycleSequence &&
        runningStatus === 'running'
    );
    const target = targets.find(({ targetId }) => targetId === runningEvent?.targetId);
    if (!runningEvent || !target) return undefined;
    if (versions.get(runningEvent.versionId)?.sequence !== runningEvent.sequence) {
      return undefined;
    }
    const lifecycleEvents = matchingVersionEvents(extensionId).filter(
      ({ sequence, versionId }) =>
        versionId === worker.versionId && sequence > lifecycleSequence
    );
    return {
      lifecycle: structuredClone(runningEvent),
      lifecycleEvents: structuredClone(lifecycleEvents),
      startingObserved: lifecycleEvents.some(
        ({ runningStatus }) => runningStatus === 'starting'
      ),
      target: structuredClone(target),
      targetId: target.targetId,
      targetIdReused: target.targetId === worker.targetId,
      versionId: runningEvent.versionId,
    };
  };

  return {
    targetEvents,
    async waitForRunning(extensionId) {
      return waitForValue(async () => {
        const targets = await currentTargets(extensionId);
        const version = matchingVersionEvents(extensionId).findLast(
          (candidate) =>
            candidate.runningStatus === 'running'
        );
        const target = targets.find(({ targetId }) => targetId === version?.targetId);
        if (!version) return undefined;
        if (versions.get(version.versionId)?.sequence !== version.sequence) return undefined;
        if (!target) return undefined;
        return {
          lifecycle: structuredClone(version),
          target: structuredClone(target),
          targetId: target.targetId,
          versionId: version.versionId,
        };
      }, 'running extension service worker');
    },
    async stopAndWait(extensionId, worker) {
      const stopCreatedTargetIds = createdTargetIds(extensionId);
      const targetEventOffsetBeforeStop = targetEvents.length;
      const versionEventOffsetBeforeStop = versionEvents.length;
      await pageCdp.send('ServiceWorker.stopWorker', { versionId: worker.versionId });
      return waitForValue(async () => {
        const targets = await currentTargets(extensionId);
        const oldTargetPresent = targets.some(({ targetId }) => targetId === worker.targetId);
        const stoppedEvent = versionEvents.find(
          ({ runningStatus, sequence, versionId }) =>
            versionId === worker.versionId &&
            sequence > versionEventOffsetBeforeStop &&
            runningStatus === 'stopped'
        );
        const observedCreatedTargetIds = createdTargetIds(extensionId);
        if (!stoppedEvent) return undefined;
        return {
          createdEventCount: stopCreatedTargetIds.length,
          createdTargetIds: stopCreatedTargetIds,
          currentTargets: structuredClone(targets),
          extensionTargetCount: targets.length,
          lifecycle: structuredClone(stoppedEvent),
          oldTargetPresent,
          observedCreatedTargetIds,
          runningStatus: stoppedEvent.runningStatus,
          status: stoppedEvent.status,
          targetAbsentAtConfirmation: targets.length === 0,
          targetEventOffset: targetEvents.length,
          targetEventOffsetBeforeStop,
          versionEventOffset: versionEvents.length,
          versionEventOffsetBeforeStop,
        };
      }, 'old extension service worker to report stopped');
    },
    async capturePreCancelObservation(extensionId, worker, stop) {
      const targets = await currentTargets(extensionId);
      const observedCreatedTargetIds = createdTargetIds(extensionId);
      const replacementWorker = runningWorkerAfter(
        extensionId,
        worker,
        stop.lifecycle.sequence,
        targets
      );
      return {
        createdEventCount: observedCreatedTargetIds.length,
        createdTargetIds: observedCreatedTargetIds,
        currentTargets: structuredClone(targets),
        extensionTargetCount: targets.length,
        lifecycleBoundarySequence: versionEvents.length,
        lifecycleEventsAfterStop: structuredClone(
          matchingVersionEvents(extensionId).filter(
            ({ sequence }) => sequence > stop.lifecycle.sequence
          )
        ),
        replacementWorker: replacementWorker ?? null,
        targetEventOffset: targetEvents.length,
      };
    },
    async waitForRunningAfter(extensionId, worker, lifecycleBoundarySequence) {
      return waitForValue(async () => {
        const targets = await currentTargets(extensionId);
        return runningWorkerAfter(
          extensionId,
          worker,
          lifecycleBoundarySequence,
          targets
        );
      }, 'post-stop running extension service worker');
    },
    captureLifecycleBoundary() {
      return versionEvents.length;
    },
    snapshotEvents(extensionId) {
      return structuredClone(matchingTargetEvents(extensionId));
    },
    snapshot,
    async dispose() {
      removeListeners();
      const cleanup = await Promise.allSettled([
        pageCdp.send('ServiceWorker.disable'),
        browserCdp.send('Target.setDiscoverTargets', { discover: false }),
      ]);
      const detach = await Promise.allSettled([pageCdp.detach()]);
      const failures = [...cleanup, ...detach]
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason);
      if (failures.length) {
        throw new AggregateError(failures, 'Service Worker observer cleanup failed');
      }
    },
  };
}

export async function enableDeveloperMode(context, browserName) {
  const page = await context.newPage();
  try {
    await page.goto(browserName === 'msedge' ? 'edge://extensions/' : 'chrome://extensions/');
    const toggle = page.locator(browserName === 'msedge' ? '#dev-switch:visible' : '#devMode');
    await toggle.waitFor({ state: 'visible' });
    if (!(await toggle.evaluate((element) => element.checked))) await toggle.click();
    assert(await toggle.evaluate((element) => element.checked), 'Extension developer mode is disabled');
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
  const quotedHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-quoted-video-page.html'), 'utf8'
  );
  const preplayerHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-public-preplayer-page.html'), 'utf8'
  );
  const unavailableHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-unavailable-sequence-page.html'), 'utf8'
  );
  const videoPayloads = Object.fromEntries(await Promise.all(
    ['quote-one', 'quote-two', 'linked-four', 'quote-three', 'nested-c'].map(async (name) => [
      name, await readFile(join(root, `test/e2e/fixtures/installed-${name}.mp4`)),
    ])
  ));
  const apiResponses = [];
  const quotedApiResponses = [];
  const unavailableApiResponses = [];
  let unavailableApiOverflow = 0;
  let sequenceRouteActive = false;
  const routeHandler = async (route) => {
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
      let tweetId;
      try {
        tweetId = JSON.parse(url.searchParams.get('variables') ?? '{}').tweetId;
      } catch {
        tweetId = undefined;
      }
      const quotedResponse = quotedVideoApiResponse(tweetId);
      if (quotedResponse) {
        const record = { method: route.request().method(), status: 200,
          tweetId, url: url.pathname, requestedAt: new Date().toISOString(),
          requestedAtMonotonicMs: performance.now(),
          resultTypename: quotedResponse.data?.tweetResult?.result?.__typename ?? null,
          providerErrors: quotedResponse.errors?.length ?? 0 };
        quotedApiResponses.push(record);
        if (sequenceRouteActive) {
          if (unavailableApiResponses.length < MAX_UNAVAILABLE_API_RECORDS) {
            unavailableApiResponses.push(record);
          } else unavailableApiOverflow += 1;
        }
        await route.fulfill({ status: 200, contentType: 'application/json',
          body: JSON.stringify(quotedResponse) });
        record.fulfilledAt = new Date().toISOString();
        return;
      }
      apiResponses.push({ method: route.request().method(), status: 403, url: url.pathname });
      await route.fulfill({ status: 403, contentType: 'application/json', body: '{}' });
      return;
    }
    if (url.hostname === 'x.com' && route.request().isNavigationRequest()) {
      const quotedCase = QUOTED_CASES.find(({ handle, outer }) =>
        url.pathname === `/${handle}/status/${outer}`
      );
      const unavailableRoute = url.pathname ===
        `/${UNAVAILABLE_SEQUENCE.handle}/status/${UNAVAILABLE_SEQUENCE.failures[0].outer}`;
      sequenceRouteActive = unavailableRoute;
      await route.fulfill({
        contentType: 'text/html',
        body: unavailableRoute ? unavailableHtml : quotedCase
          ? quotedCase.name === 'public-preplayer' ? preplayerHtml
            : quotedHtml.replace('<body data-quote-case="recognized">',
              `<body data-quote-case="${quotedCase.route}">`)
          : url.pathname === new URL(PUBLIC_FIXTURE_URL).pathname
          ? html.replace(
              '<body data-fixture-route="classic">',
              '<body data-fixture-route="public">'
            )
          : html,
      });
      return;
    }
    if (url.hostname === 'video.twimg.com') {
      const name = url.pathname.split('/').at(-1)?.replace(/\.mp4$/u, '');
      const payload = videoPayloads[name] ??
        (name?.startsWith('outer-') ? videoPayloads['nested-c'] : undefined);
      if (!payload) {
        await route.abort('blockedbyclient');
        return;
      }
      const range = route.request().headers()['range'];
      const match = range?.match(/^bytes=(\d+)-(\d*)$/u);
      const start = match ? Number(match[1]) : 0;
      const requestedEnd = match?.[2] ? Number(match[2]) : payload.length - 1;
      const end = Math.min(requestedEnd, payload.length - 1);
      if (match && (start >= payload.length || end < start)) {
        await route.fulfill({ status: 416, headers: {
          'Content-Range': `bytes */${payload.length}` } });
        return;
      }
      const selectedBytes = match ? payload.subarray(start, end + 1) : payload;
      await route.fulfill({ status: match ? 206 : 200, contentType: 'video/mp4',
        body: selectedBytes,
        headers: { 'Access-Control-Allow-Origin': 'https://x.com',
          'Access-Control-Allow-Credentials': 'true',
          'Accept-Ranges': 'bytes', 'Content-Length': String(selectedBytes.length),
          ...(match ? { 'Content-Range': `bytes ${start}-${end}/${payload.length}` } : {}) } });
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
  };
  await context.route('**/*', routeHandler);
  return {
    apiResponses,
    quotedApiResponses,
    unavailableApiResponses,
    getUnavailableApiOverflow: () => unavailableApiOverflow,
    videoPayloads,
    async remove() {
      await context.unroute('**/*', routeHandler);
    },
  };
}

async function queryDownloads(extensionPage) {
  return extensionPage.evaluate(() => chrome.downloads.search({ orderBy: ['-startTime'] }));
}

async function findOwnedDownload(extensionPage, initialDownloadIds, objectUrl) {
  const matches = (await queryDownloads(extensionPage)).filter(
    (download) =>
      !initialDownloadIds.has(download.id) &&
      download.url === objectUrl
  );
  assert(matches.length <= 1, `Expected at most one owned download, found ${matches.length}`);
  return matches[0];
}

async function readPauseControlState(extensionPage) {
  return extensionPage.evaluate(() => {
    const value = globalThis.__xegMv3PauseControl?.state;
    return value ? structuredClone(value) : null;
  });
}

async function recoverOwnedDownload(extensionPage, initialDownloadIds, objectUrl) {
  const pauseControl = await readPauseControlState(extensionPage);
  if (Number.isInteger(pauseControl?.downloadId)) {
    assert.equal(
      initialDownloadIds.has(pauseControl.downloadId),
      false,
      'Pause listener matched a pre-existing download ID'
    );
    const [download] = await extensionPage.evaluate(
      (id) => chrome.downloads.search({ id }),
      pauseControl.downloadId
    );
    if (download !== undefined) {
      assert.equal(download.url, objectUrl, 'Pause listener matched a different download URL');
      return download;
    }
    return undefined;
  }
  return findOwnedDownload(extensionPage, initialDownloadIds, objectUrl);
}

async function readMv3LifecycleState(extensionPage, requestId, downloadId) {
  return extensionPage.evaluate(async ({ id, trackingKey, trackedRequestId }) => {
    const stored = await chrome.storage.local.get(trackingKey);
    const records = stored[trackingKey] ?? {};
    const downloads = id === undefined ? [] : await chrome.downloads.search({ id });
    return {
      download: downloads[0] ?? null,
      record: records[trackedRequestId] ?? null,
      trackingKeys: Object.keys(records).sort(),
    };
  }, {
    id: downloadId,
    trackedRequestId: requestId,
    trackingKey: DOWNLOAD_TRACKING_STORAGE_KEY,
  });
}

export function assertDownloadIncomplete(download, stage) {
  assert(
    Number.isSafeInteger(download?.bytesReceived) &&
    download.bytesReceived >= 0 &&
    Number.isSafeInteger(download.totalBytes) &&
    download.totalBytes > 0 &&
    download.bytesReceived < download.totalBytes,
    stage + ': paused download must have bytes remaining: ' + JSON.stringify({
      id: download?.id,
      state: download?.state,
      paused: download?.paused,
      bytesReceived: download?.bytesReceived,
      totalBytes: download?.totalBytes,
    })
  );
}

async function verifyTrustedDownloadInput({ context, downloads, extensionId, extensionPage, page, evidence }) {
  const initialIds = (await queryDownloads(extensionPage)).map((item) => item.id);
  const initialFiles = new Set(await readdir(downloads));
  const worker = context.serviceWorkers().find((item) => item.url().startsWith(`chrome-extension://${extensionId}/`));
  assert(worker, 'Installed worker must be available for the notification-count seam');
  const payload = Buffer.alloc(TRUSTED_INPUT_DOWNLOAD_BYTES, 0x58);
  const fetches = [];
  const routeHandler = async (route) => {
    if (!['fetch', 'xhr'].includes(route.request().resourceType())) {
      await route.fallback();
      return;
    }
    assert(fetches.length < 2, 'Unexpected repeated download fetch');
    assert(route.request().url().includes(IMAGE_URL_MARKERS[0]), 'Download must select the first image');
    fetches.push({ bytes: payload.length, resourceType: route.request().resourceType() });
    await route.fulfill({ status: 200, contentType: 'image/jpeg', body: payload,
      headers: { 'Access-Control-Allow-Origin': 'https://x.com', 'Access-Control-Allow-Credentials': 'true' } });
  };
  let downloadId;
  let requestId;
  let filename;
  let primaryError;
  let notificationSeamInstalled = false;
  let pauseInstalled = false;
  const cleanupErrors = [];
  Object.assign(evidence, { bytes: TRUSTED_INPUT_DOWNLOAD_BYTES, fetches, syntheticInputs: [],
    notificationScope: 'Production SHOW_NOTIFICATION path counted at native create boundary; delivery suppressed during this case',
    cleanup: {}, status: 'pending' });
  try {
    await page.route('https://pbs.twimg.com/**', routeHandler);
    await worker.evaluate(() => {
      const original = chrome.notifications.create;
      const state = { calls: 0, original };
      globalThis.__xegIngressNotifications = state;
      chrome.notifications.create = async (id) => {
        state.calls += 1;
        return id;
      };
    });
    notificationSeamInstalled = true;
    await extensionPage.evaluate((oldIds) => {
      const state = { downloadId: null, pause: 'waiting', duplicates: 0 };
      const listener = (item) => {
        if (oldIds.includes(item.id) || !item.url.startsWith('blob:https://x.com/')) return;
        if (state.downloadId !== null) { state.duplicates += 1; return; }
        state.downloadId = item.id;
        Promise.resolve(chrome.downloads.pause(item.id)).then(
          () => { state.pause = 'fulfilled'; },
          (error) => { state.pause = `rejected: ${String(error)}`; }
        );
      };
      globalThis.__xegIngressPause = { state, listener };
      chrome.downloads.onCreated.addListener(listener);
    }, initialIds);
    pauseInstalled = true;
    const trigger = page.locator('[data-testid="tweetPhoto"] img').first();
    await trigger.click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    await page.keyboard.press('?');
    await waitForValue(async () => (await worker.evaluate(() => globalThis.__xegIngressNotifications.calls)) === 1
      ? true : undefined, 'trusted help input to reach the notification boundary');
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
    const control = await waitForValue(async () => {
      const value = await extensionPage.evaluate(() => globalThis.__xegIngressPause.state);
      if (value.pause.startsWith('rejected:')) throw new Error(value.pause);
      return Number.isInteger(value.downloadId) && value.pause === 'fulfilled' ? value : undefined;
    }, 'gallery-initiated native download to pause');
    downloadId = control.downloadId;
    assert.equal(control.duplicates, 0);
    assert.equal(fetches.length, 1);
    const binding = await waitForValue(async () => extensionPage.evaluate(async ({ id, key }) => {
      const records = (await chrome.storage.local.get(key))[key] ?? {};
      const matches = Object.entries(records).filter(([, record]) => record.downloadId === id);
      if (matches.length > 1) throw new Error('Ambiguous native request ownership');
      return matches[0] ? { requestId: matches[0][0], record: matches[0][1] } : undefined;
    }, { id: downloadId, key: DOWNLOAD_TRACKING_STORAGE_KEY }), 'private request-to-download binding');
    requestId = binding.requestId;
    const before = await waitForValue(async () => {
      const state = await readMv3LifecycleState(extensionPage, requestId, downloadId);
      evidence.precondition = state;
      if (!state.download || state.download.state !== 'in_progress') {
        throw new Error('Owned download ended before synthetic input');
      }
      assertDownloadIncomplete(state.download, 'before synthetic input');
      return state.download.paused === true &&
        state.download.totalBytes === TRUSTED_INPUT_DOWNLOAD_BYTES &&
        typeof state.download.filename === 'string' && state.download.filename.length > 0
        ? state : undefined;
    }, 'paused download filename and size to settle before synthetic input');
    assert.deepEqual(before.record, { cancellationRequested: false, downloadId });
    filename = basename(before.download.filename);
    assert.equal(resolve(before.download.filename), resolve(join(downloads, filename)));
    evidence.before = { downloadId, bytesReceived: before.download.bytesReceived,
      totalBytes: before.download.totalBytes, state: before.download.state,
      paused: before.download.paused, requestBinding: before.record, filename,
      notificationCalls: 1 };
    for (const input of ['Escape', 'help', 'outside', 'backdrop', 'close', 'reparented-close', 'download']) {
      await page.evaluate((kind) => {
        if (kind === 'Escape' || kind === 'help') {
          document.body.dispatchEvent(new KeyboardEvent('keydown', {
            key: kind === 'Escape' ? 'Escape' : '?', bubbles: true, cancelable: true,
          }));
        } else if (kind === 'outside') document.body.click();
        else if (kind === 'backdrop') document.querySelector('[data-gallery-element="items"]')?.click();
        else {
          const button = document.querySelector(`[data-gallery-element="toolbar"] button[aria-label="${kind === 'download' ? 'Download' : 'Close'}"]`);
          if (!(button instanceof HTMLButtonElement)) throw new Error('Missing actual toolbar button');
          if (kind === 'reparented-close') {
            const parent = button.parentNode;
            const next = button.nextSibling;
            try { document.body.append(button); button.click(); }
            finally { parent.insertBefore(button, next); }
          } else button.click();
        }
      }, input);
      await delay(150);
      assert.equal(await gallery.isVisible(), true, `${input}: gallery must remain open`);
      const current = await readMv3LifecycleState(extensionPage, requestId, downloadId);
      assert.equal(current.download?.state, 'in_progress', `${input}: native download must remain active`);
      assert.equal(current.download.paused, true);
      assertDownloadIncomplete(current.download, input);
      assert.deepEqual(current.record, before.record);
      assert.equal(await worker.evaluate(() => globalThis.__xegIngressNotifications.calls), 1,
        `${input}: synthetic input must not induce a notification`);
      evidence.syntheticInputs.push({ input, galleryOpen: true, downloadId,
        state: current.download.state, paused: true, cancellationRequested: false, notificationCalls: 1 });
    }
    await page.keyboard.press('Escape');
    await gallery.waitFor({ state: 'detached' });
    const terminal = await waitForValue(async () => {
      const value = await readMv3LifecycleState(extensionPage, requestId, downloadId);
      return value.download?.state === 'interrupted' && value.record === null ? value : undefined;
    }, 'genuine Escape to cancel the exact owned download');
    assert.equal(terminal.download.error, 'USER_CANCELED');
    await waitForValue(async () => (await readdir(downloads)).every((entry) => initialFiles.has(entry))
      ? true : undefined, 'cancelled task files to disappear');
    evidence.after = { downloadId, state: terminal.download.state, error: terminal.download.error,
      requestBinding: terminal.record, filesAdded: [], galleryDetached: true,
      notificationCalls: await worker.evaluate(() => globalThis.__xegIngressNotifications.calls) };
    assert.equal(evidence.after.notificationCalls, 1);
    evidence.status = 'passed';
  } catch (error) {
    primaryError = error;
    evidence.status = 'failed';
    evidence.error = safeError(error);
  } finally {
    if (pauseInstalled) {
      try {
        const state = await extensionPage.evaluate(() => {
          const control = globalThis.__xegIngressPause;
          chrome.downloads.onCreated.removeListener(control.listener);
          delete globalThis.__xegIngressPause;
          return control.state;
        });
        downloadId ??= state.downloadId ?? undefined;
        evidence.cleanup.pauseListenerRemoved = true;
      } catch (error) { cleanupErrors.push(error); }
    }
    if (downloadId !== undefined) {
      try {
        assert(!initialIds.includes(downloadId), 'Refusing cleanup of a pre-existing download');
        await extensionPage.evaluate(async (id) => {
          let [item] = await chrome.downloads.search({ id });
          if (!item?.url.startsWith('blob:https://x.com/')) throw new Error('Owned download URL mismatch');
          if (item.state === 'in_progress') await chrome.downloads.cancel(id);
        }, downloadId);
        await waitForValue(async () => {
          const [item] = await extensionPage.evaluate((id) => chrome.downloads.search({ id }), downloadId);
          return item?.state !== 'in_progress' ? true : undefined;
        }, 'owned download to reach terminal cleanup state');
        await extensionPage.evaluate((id) => chrome.downloads.erase({ id }), downloadId);
        evidence.cleanup.downloadHistoryRemoved = true;
      } catch (error) { cleanupErrors.push(error); }
    }
    if (notificationSeamInstalled) {
      try {
        await worker.evaluate(() => {
          chrome.notifications.create = globalThis.__xegIngressNotifications.original;
          delete globalThis.__xegIngressNotifications;
        });
        evidence.cleanup.notificationSeamRestored = true;
      } catch (error) { cleanupErrors.push(error); }
    }
    try {
      await page.unroute('https://pbs.twimg.com/**', routeHandler);
      evidence.cleanup.routeRemoved = true;
      for (const entry of await readdir(downloads)) {
        if (initialFiles.has(entry)) continue;
        const candidate = resolve(downloads, entry);
        assert.equal(dirname(candidate), resolve(downloads));
        await rm(candidate, { recursive: true, force: true });
      }
      evidence.cleanup.addedFilesRemoved = true;
    } catch (error) { cleanupErrors.push(error); }
    evidence.cleanup.errorCount = cleanupErrors.length;
    if (cleanupErrors.length) evidence.cleanup.errors = cleanupErrors.map(safeError);
  }
  const errors = [...(primaryError ? [primaryError] : []), ...cleanupErrors];
  if (errors.length) throw new AggregateError(errors, `Trusted input validation/cleanup failed: ${errors.map(safeError).join('; ')}`);
}

async function verifyMv3RestartCancellation({
  downloads,
  extensionId,
  extensionPage,
  evidence,
  page,
  workerObserver,
}) {
  const filename = `xeg-mv3-restart-${randomUUID()}.bin`;
  const requestId = `xeg-mv3-restart-${randomUUID()}`;
  const initialFiles = new Set(await readdir(downloads));
  const initialDownloadIds = new Set(
    (await queryDownloads(extensionPage)).map((download) => download.id)
  );
  Object.assign(evidence, {
    cleanup: {},
    filename,
    requestId,
    source: {
      bytes: MV3_RESTART_BLOB_BYTES,
      mimeType: 'application/octet-stream',
      productionMessageType: 'DOWNLOAD_BLOB_URL_REQUEST',
    },
  });
  let downloadId;
  let objectUrl;
  let pauseListenerInstalled = false;
  let cancellationObservation = { status: 'not-sent' };
  let primaryError;
  let primarySeen = false;
  const cleanupErrors = [];

  try {
    const blobFixture = await page.evaluate((bytes) => {
      const chunk = new Uint8Array(1024 * 1024);
      chunk.fill(0x58);
      const parts = Array.from({ length: bytes / chunk.byteLength }, () => chunk);
      const blob = new Blob(parts, { type: 'application/octet-stream' });
      if (blob.size !== bytes) throw new Error(`Unexpected fixture Blob size: ${blob.size}`);
      const url = URL.createObjectURL(blob);
      globalThis.__xegMv3RestartBlobUrl = url;
      return { size: blob.size, url };
    }, MV3_RESTART_BLOB_BYTES);
    assert.equal(blobFixture.size, MV3_RESTART_BLOB_BYTES);
    assert(blobFixture.url.startsWith('blob:https://x.com/'));
    objectUrl = blobFixture.url;
    evidence.source.url = objectUrl;

    await extensionPage.evaluate((ownedUrl) => {
      const state = {
        downloadId: null,
        duplicateEvents: 0,
        events: [],
        pause: { status: 'waiting' },
      };
      const listener = (download) => {
        if (download.url !== ownedUrl) return;
        state.events.push({
          bytesReceived: download.bytesReceived,
          filename: typeof download.filename === 'string'
            ? (download.filename.split(/[\\/]/).at(-1) ?? '')
            : null,
          id: download.id,
          paused: download.paused,
          state: download.state,
          totalBytes: download.totalBytes,
          url: download.url,
        });
        if (state.downloadId !== null) {
          state.duplicateEvents += 1;
          return;
        }
        state.downloadId = download.id;
        try {
          Promise.resolve(chrome.downloads.pause(download.id)).then(
            () => {
              state.pause = { status: 'fulfilled' };
            },
            (error) => {
              state.pause = { error: String(error), status: 'rejected' };
            }
          );
        } catch (error) {
          state.pause = { error: String(error), status: 'rejected' };
        }
      };
      globalThis.__xegMv3PauseControl = { listener, state };
      chrome.downloads.onCreated.addListener(listener);
    }, objectUrl);
    pauseListenerInstalled = true;

    await extensionPage.evaluate((message) => {
      globalThis.__xegMv3RestartStart = chrome.runtime.sendMessage(message).then(
        (response) => ({ response, status: 'fulfilled' }),
        (error) => ({ error: String(error), status: 'rejected' })
      );
    }, {
      type: 'DOWNLOAD_BLOB_URL_REQUEST',
      payload: {
        filename,
        mimeType: 'application/octet-stream',
        objectUrl,
        requestId,
      },
    });

    const pauseControl = await waitForValue(async () => {
      const control = await readPauseControlState(extensionPage);
      if (control?.pause.status === 'rejected') {
        throw new Error(`Failed to pause owned download: ${control.pause.error}`);
      }
      return Number.isInteger(control?.downloadId) && control.pause.status === 'fulfilled'
        ? control
        : undefined;
    }, 'owned Chrome download to be created and paused');
    downloadId = pauseControl.downloadId;
    assert.equal(pauseControl.duplicateEvents, 0);
    assert.equal(pauseControl.events.length, 1);
    assert.equal(pauseControl.events[0].id, downloadId);
    assert.equal(pauseControl.events[0].url, objectUrl);
    const ownedDownload = await waitForValue(
      () => findOwnedDownload(extensionPage, initialDownloadIds, objectUrl),
      'owned Chrome download item'
    );
    assert.equal(ownedDownload.id, downloadId);
    const bound = await waitForValue(async () => {
      const stored = await extensionPage.evaluate(async ({ trackingKey, trackedRequestId }) => {
        const values = await chrome.storage.local.get(trackingKey);
        return values[trackingKey]?.[trackedRequestId] ?? null;
      }, {
        trackedRequestId: requestId,
        trackingKey: DOWNLOAD_TRACKING_STORAGE_KEY,
      });
      return Number.isInteger(stored?.downloadId) ? stored : undefined;
    }, 'persisted request-to-download relationship');
    assert.equal(bound.downloadId, downloadId);

    const beforeStop = await waitForValue(async () => {
      const state = await readMv3LifecycleState(extensionPage, requestId, downloadId);
      const ready = (
        state.download?.state === 'in_progress' &&
        state.download.paused === true &&
        state.download.totalBytes === MV3_RESTART_BLOB_BYTES &&
        typeof state.download.filename === 'string' &&
        basename(state.download.filename) === filename
      );
      if (!ready) return undefined;
      assertDownloadIncomplete(state.download, 'before worker stop');
      return state;
    }, 'paused in-progress Chrome download before worker stop');
    assert.deepEqual(beforeStop.record, {
      cancellationRequested: false,
      downloadId,
    });
    assert.equal(beforeStop.download.paused, true);
    assert.equal(beforeStop.download.totalBytes, MV3_RESTART_BLOB_BYTES);
    assert.equal(basename(beforeStop.download.filename), filename);
    const oldWorker = await workerObserver.waitForRunning(extensionId);
    const initialWorkerObservation = await workerObserver.snapshot(extensionId);
    evidence.beforeStop = {
      download: {
        bytesReceived: beforeStop.download.bytesReceived,
        filename: basename(beforeStop.download.filename),
        id: downloadId,
        paused: beforeStop.download.paused,
        state: beforeStop.download.state,
        totalBytes: beforeStop.download.totalBytes,
      },
      pauseControl,
      storageRecord: beforeStop.record,
      worker: oldWorker,
      workerObservation: initialWorkerObservation,
    };

    evidence.stop = await workerObserver.stopAndWait(extensionId, oldWorker);
    const afterStop = await readMv3LifecycleState(extensionPage, requestId, downloadId);
    assert.equal(afterStop.download?.state, 'in_progress');
    assert.equal(afterStop.download?.paused, true);
    assertDownloadIncomplete(afterStop.download, 'after worker stop');
    assert.deepEqual(
      afterStop.record,
      beforeStop.record,
      'Persisted tracking must survive the old worker stopping'
    );
    evidence.afterStop = {
      downloadPaused: afterStop.download.paused,
      downloadState: afterStop.download.state,
      storageRecord: afterStop.record,
    };
    evidence.preCancel = await workerObserver.capturePreCancelObservation(
      extensionId,
      oldWorker,
      evidence.stop
    );
    const preCancellationState = await readMv3LifecycleState(
      extensionPage,
      requestId,
      downloadId
    );
    assert.equal(preCancellationState.download?.state, 'in_progress');
    assert.equal(preCancellationState.download.paused, true);
    assert.equal(preCancellationState.download.id, downloadId);
    assert.equal(preCancellationState.download.url, objectUrl);
    assert.equal(basename(preCancellationState.download.filename), filename);
    assert.equal(preCancellationState.download.totalBytes, MV3_RESTART_BLOB_BYTES);
    assertDownloadIncomplete(preCancellationState.download, 'before cancellation');
    assert.deepEqual(preCancellationState.record, beforeStop.record);
    assert.deepEqual(preCancellationState.trackingKeys, [requestId]);
    const newDownloadsBeforeCancellation = (await queryDownloads(extensionPage))
      .filter(({ id }) => !initialDownloadIds.has(id));
    assert.deepEqual(
      newDownloadsBeforeCancellation.map(({ id }) => id),
      [downloadId],
      'Worker restart must not allocate another Chrome download'
    );
    evidence.preCancel.download = {
      bytesReceived: preCancellationState.download.bytesReceived,
      filename: basename(preCancellationState.download.filename),
      id: preCancellationState.download.id,
      paused: preCancellationState.download.paused,
      state: preCancellationState.download.state,
      totalBytes: preCancellationState.download.totalBytes,
    };
    evidence.preCancel.newDownloadIds = newDownloadsBeforeCancellation.map(({ id }) => id);
    evidence.preCancel.storageRecord = preCancellationState.record;
    evidence.preCancel.trackingKeys = preCancellationState.trackingKeys;

    const cancellationDispatchLifecycleSequence = workerObserver.captureLifecycleBoundary();
    const cancellationResponsePromise = extensionPage.evaluate((message) =>
      chrome.runtime.sendMessage(message), {
      type: 'DOWNLOAD_CANCEL_REQUEST',
      payload: { requestId },
    });
    const newWorkerPromise = evidence.preCancel.replacementWorker === null
      ? workerObserver.waitForRunningAfter(
          extensionId,
          oldWorker,
          evidence.stop.lifecycle.sequence
        )
      : Promise.resolve(evidence.preCancel.replacementWorker);
    const [cancellationResult, workerResult] = await Promise.allSettled([
      cancellationResponsePromise,
      newWorkerPromise,
    ]);
    cancellationObservation = cancellationResult.status === 'fulfilled'
      ? { response: cancellationResult.value, status: 'fulfilled' }
      : { error: safeError(cancellationResult.reason), status: 'rejected' };
    let replacementObservationTiming = 'not-observed';
    if (workerResult.status === 'fulfilled') {
      replacementObservationTiming =
        workerResult.value.lifecycle.sequence <= cancellationDispatchLifecycleSequence
          ? 'before-cancellation-dispatch'
          : 'after-cancellation-dispatch';
    }
    evidence.cancellation = {
      dispatchLifecycleSequence: cancellationDispatchLifecycleSequence,
      response: cancellationObservation,
      replacementObservationTiming,
      workerRestart: workerResult.status === 'fulfilled'
        ? { status: 'fulfilled', worker: workerResult.value }
        : { error: safeError(workerResult.reason), status: 'rejected' },
    };
    const cancellationFailures = [cancellationResult, workerResult]
      .filter((result) => result.status === 'rejected')
      .map((result) => result.reason);
    if (cancellationFailures.length > 1) {
      throw new AggregateError(
        cancellationFailures,
        'Cancellation response and service worker restart observation failed'
      );
    }
    if (cancellationFailures.length === 1) throw cancellationFailures[0];
    const cancellationResponse = cancellationResult.value;
    const newWorker = workerResult.value;
    assert.deepEqual(cancellationResponse, { success: true });
    assert.equal(newWorker.versionId, oldWorker.versionId);
    assert(newWorker.lifecycle.sequence > evidence.stop.lifecycle.sequence);

    const afterCancel = await waitForValue(async () => {
      const state = await readMv3LifecycleState(extensionPage, requestId, downloadId);
      return state.download?.state === 'interrupted' && state.record === null
        ? state
        : undefined;
    }, 'interrupted download and removed tracking record');
    assert.equal(afterCancel.download.error, 'USER_CANCELED');
    assert.equal(
      resolve(afterCancel.download.filename),
      resolve(join(downloads, filename)),
      'Cancelled download must use the task-owned file path'
    );
    assert.deepEqual(afterCancel.trackingKeys, []);
    const remainingFiles = await waitForValue(async () => {
      const entries = await readdir(downloads);
      const additions = entries.filter((entry) => !initialFiles.has(entry));
      return additions.length === 0 ? entries : undefined;
    }, 'cancelled download files to be removed');
    // DownloadItem.exists is cached; search does not await its filesystem check.
    const fileSystemFileExists = await pathExists(join(downloads, filename));
    assert.equal(fileSystemFileExists, false);
    const originalRequestOutcome = await extensionPage.evaluate(async (timeoutMs) => {
      const outcome = globalThis.__xegMv3RestartStart;
      if (!outcome) return { status: 'missing' };
      return Promise.race([
        outcome,
        new Promise((resolveOutcome) => {
          setTimeout(() => resolveOutcome({ status: 'pending' }), timeoutMs);
        }),
      ]);
    }, 1_000);

    evidence.afterCancel = {
      download: {
        bytesReceived: afterCancel.download.bytesReceived,
        error: afterCancel.download.error,
        exists: afterCancel.download.exists,
        filename: basename(afterCancel.download.filename),
        id: downloadId,
        state: afterCancel.download.state,
      },
      filesAdded: remainingFiles.filter((entry) => !initialFiles.has(entry)),
      fileSystemFileExists,
      originalRequestOutcome,
      storageRecord: afterCancel.record,
      trackingKeys: afterCancel.trackingKeys,
      worker: newWorker,
    };
    evidence.workerTargetEvents = workerObserver.snapshotEvents(extensionId);
    evidence.workerObservation = await workerObserver.snapshot(extensionId);
    evidence.status = 'passed';
  } catch (error) {
    primarySeen = true;
    primaryError = error;
    evidence.error = safeError(error);
    let ownershipRecoveryError;
    if (downloadId === undefined && objectUrl !== undefined) {
      try {
        downloadId = (await recoverOwnedDownload(
          extensionPage,
          initialDownloadIds,
          objectUrl
        ))?.id;
      } catch (recoveryError) {
        ownershipRecoveryError = recoveryError;
      }
    }
    const failureReads = await Promise.allSettled([
      readMv3LifecycleState(extensionPage, requestId, downloadId),
      readdir(downloads),
      readPauseControlState(extensionPage),
      workerObserver.snapshot(extensionId),
    ]);
    const lifecycleState = failureReads[0];
    const files = failureReads[1];
    const pauseControl = failureReads[2];
    const workerObservation = failureReads[3];
    evidence.failureSnapshot = {
      ...(lifecycleState.status === 'fulfilled'
        ? {
            download: lifecycleState.value.download === null
              ? null
              : {
                  bytesReceived: lifecycleState.value.download.bytesReceived,
                  error: lifecycleState.value.download.error,
                  exists: lifecycleState.value.download.exists,
                  filename: typeof lifecycleState.value.download.filename === 'string'
                    ? basename(lifecycleState.value.download.filename)
                    : null,
                  id: lifecycleState.value.download.id,
                  paused: lifecycleState.value.download.paused,
                  state: lifecycleState.value.download.state,
                  totalBytes: lifecycleState.value.download.totalBytes,
                },
            storageRecord: lifecycleState.value.record,
            trackingKeys: lifecycleState.value.trackingKeys,
          }
        : { lifecycleReadError: safeError(lifecycleState.reason) }),
      ...(files.status === 'fulfilled'
        ? { filesAdded: files.value.filter((entry) => !initialFiles.has(entry)) }
        : { fileReadError: safeError(files.reason) }),
      ...(ownershipRecoveryError === undefined
        ? { recoveredDownloadId: downloadId ?? null }
        : { ownershipRecoveryError: safeError(ownershipRecoveryError) }),
      ...(pauseControl.status === 'fulfilled'
        ? { pauseControl: pauseControl.value }
        : { pauseControlReadError: safeError(pauseControl.reason) }),
      cancellation: cancellationObservation,
      ...(workerObservation.status === 'fulfilled'
        ? { workerObservation: workerObservation.value }
        : { workerObservationReadError: safeError(workerObservation.reason) }),
      workerTargetEvents: workerObserver.snapshotEvents(extensionId),
    };
    evidence.status = 'failed';
  } finally {
    if (downloadId === undefined && objectUrl !== undefined) {
      try {
        const pauseControl = await readPauseControlState(extensionPage);
        const recoverDownload = () =>
          recoverOwnedDownload(extensionPage, initialDownloadIds, objectUrl);
        const ownedDownload = Number.isInteger(pauseControl?.downloadId)
          ? await waitForValue(
              recoverDownload,
              'listener-owned Chrome download item during cleanup',
              2_000
            )
          : await recoverDownload();
        downloadId = ownedDownload?.id;
        evidence.cleanup.downloadRecovery = { found: ownedDownload !== undefined };
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (downloadId !== undefined) {
      try {
        evidence.cleanup.download = await extensionPage.evaluate(async (id) => {
          let [download] = await chrome.downloads.search({ id });
          if (download?.state === 'in_progress') {
            await chrome.downloads.cancel(id);
            const deadline = Date.now() + 10_000;
            while (Date.now() < deadline) {
              [download] = await chrome.downloads.search({ id });
              if (download === undefined || download.state !== 'in_progress') break;
              await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
            }
          }
          if (download?.state === 'in_progress') {
            throw new Error(`Download ${id} remained in progress after cleanup cancellation`);
          }
          const terminalState = download?.state ?? null;
          const erasedIds = await chrome.downloads.erase({ id });
          const remaining = await chrome.downloads.search({ id });
          if (remaining.length !== 0) {
            throw new Error(`Download ${id} remained in browser history after cleanup erase`);
          }
          return { erasedIds, historyRemoved: true, terminalState };
        }, downloadId);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    try {
      await extensionPage.evaluate(async ({ trackingKey, trackedRequestId }) => {
        const stored = await chrome.storage.local.get(trackingKey);
        const records = stored[trackingKey];
        if (!records || !Object.hasOwn(records, trackedRequestId)) return;
        const nextRecords = { ...records };
        delete nextRecords[trackedRequestId];
        await chrome.storage.local.set({ [trackingKey]: nextRecords });
      }, {
        trackedRequestId: requestId,
        trackingKey: DOWNLOAD_TRACKING_STORAGE_KEY,
      });
      evidence.cleanup.trackingRemoved = true;
    } catch (error) {
      cleanupErrors.push(error);
    }
    try {
      evidence.cleanup.pauseListener = await extensionPage.evaluate(() => {
        const control = globalThis.__xegMv3PauseControl;
        const state = control ? structuredClone(control.state) : null;
        if (control) chrome.downloads.onCreated.removeListener(control.listener);
        delete globalThis.__xegMv3PauseControl;
        delete globalThis.__xegMv3RestartStart;
        return {
          controlCleared: !Object.hasOwn(globalThis, '__xegMv3PauseControl'),
          removed: control !== undefined,
          requestOutcomeCleared: !Object.hasOwn(globalThis, '__xegMv3RestartStart'),
          state,
        };
      });
      assert.equal(evidence.cleanup.pauseListener.controlCleared, true);
      assert.equal(evidence.cleanup.pauseListener.requestOutcomeCleared, true);
      if (pauseListenerInstalled) {
        assert.equal(evidence.cleanup.pauseListener.removed, true);
      }
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (objectUrl !== undefined) {
      try {
        evidence.cleanup.blob = await page.evaluate((ownedUrl) => {
          URL.revokeObjectURL(ownedUrl);
          if (globalThis.__xegMv3RestartBlobUrl === ownedUrl) {
            delete globalThis.__xegMv3RestartBlobUrl;
          }
          return {
            globalCleared: !Object.hasOwn(globalThis, '__xegMv3RestartBlobUrl'),
            revoked: true,
          };
        }, objectUrl);
        assert.deepEqual(evidence.cleanup.blob, { globalCleared: true, revoked: true });
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    try {
      const currentFiles = await readdir(downloads);
      for (const entry of currentFiles) {
        if (initialFiles.has(entry)) continue;
        const candidate = resolve(downloads, entry);
        assert.equal(dirname(candidate), resolve(downloads), 'Download cleanup escaped task directory');
        await rm(candidate, { recursive: true, force: true });
      }
      evidence.cleanup.addedFilesRemoved = true;
    } catch (error) {
      cleanupErrors.push(error);
    }
    evidence.cleanup.errorCount = cleanupErrors.length;
    if (cleanupErrors.length) evidence.cleanup.errors = cleanupErrors.map(safeError);
  }

  const combinedErrors = [...(primarySeen ? [primaryError] : []), ...cleanupErrors];
  if (combinedErrors.length > 1) {
    throw new AggregateError(
      combinedErrors,
      `MV3 restart validation and cleanup failed: ${combinedErrors.map(safeError).join('; ')}`
    );
  }
  if (primarySeen) throw primaryError;
  if (cleanupErrors.length) throw cleanupErrors[0];
  return evidence;
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

async function fixtureTabZoom(context, extensionId, page, factor = null, restoreSettings = null) {
  assert.equal(page.url(), FIXTURE_URL, 'Browser zoom must target the exact owned fixture page');
  const workerUrl = `chrome-extension://${extensionId}/background.js`;
  const workers = context.serviceWorkers().filter((worker) => worker.url() === workerUrl);
  assert.equal(workers.length, 1, 'Browser zoom requires the exact installed extension worker');
  return workers[0].evaluate(async ({ url, zoomFactor, restore }) => {
    const tabs = await chrome.tabs.query({ url });
    if (tabs.length !== 1 || tabs[0].url !== url || !Number.isInteger(tabs[0].id)) {
      throw new Error('Browser zoom requires one exact fixture tab');
    }
    const id = tabs[0].id;
    const previous = await chrome.tabs.getZoom(id);
    const settings = await chrome.tabs.getZoomSettings(id);
    if (zoomFactor !== null) {
      await chrome.tabs.setZoomSettings(id, { mode: 'automatic', scope: 'per-tab' });
      await chrome.tabs.setZoom(id, zoomFactor);
      if (restore) {
        await chrome.tabs.setZoomSettings(id, { mode: restore.mode, scope: restore.scope });
      }
    }
    return { previous, settings, observed: await chrome.tabs.getZoom(id),
      observedSettings: await chrome.tabs.getZoomSettings(id) };
  }, { url: FIXTURE_URL, zoomFactor: factor, restore: restoreSettings });
}

async function runZoomSpanishCycle({ context, downloads, extensionId, extensionPage, images, output, page }) {
  const baseline = await page.evaluate(() => ({
    devicePixelRatio: devicePixelRatio,
    innerWidth,
    viewportScale: visualViewport?.scale ?? null,
  }));
  const priorZoom = await fixtureTabZoom(context, extensionId, page);
  let zoomAttempted = false;
  try {
    zoomAttempted = true;
    const changedZoom = await fixtureTabZoom(context, extensionId, page, 2);
    assert.equal(changedZoom.observed, 2, 'Installed browser did not accept 200% tab zoom');
    const zoomRatio = changedZoom.observed / priorZoom.previous;
    await page.waitForFunction((before) =>
      devicePixelRatio >= before.devicePixelRatio * before.zoomRatio * 0.95 &&
      innerWidth <= before.innerWidth / (before.zoomRatio * 0.95) &&
      Math.abs((visualViewport?.scale ?? 1) - 1) <= 0.05,
    { ...baseline, zoomRatio });

    const trigger = page.locator('[data-testid="tweetPhoto"] img').first();
    await trigger.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -120));
    await trigger.focus();
    const before = await hostSnapshot(page, 0);
    assert(before.scrollY > 0, 'Zoom fixture must open from a nonzero host scroll position');
    await trigger.evaluate((element) => {
      element.addEventListener('pointerdown', () => {
        element.dataset.openingScrollY = String(window.scrollY);
      }, { once: true, capture: true });
    });
    await trigger.click();
    before.scrollY = Number(await trigger.getAttribute('data-opening-scroll-y'));
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible', timeout: 15_000 });
    const toolbar = gallery.locator('[data-gallery-element="toolbar"]');
    const settingsButton = toolbar.locator('#settings-button');
    await settingsButton.click();
    const languageSelect = gallery.locator('#settings-language-select');
    const priorLanguage = await languageSelect.inputValue();
    await languageSelect.selectOption('es');
    await page.waitForFunction(() =>
      document.querySelector('[data-gallery-element="fit-mode-label"]')?.textContent?.startsWith('Ajuste: ')
    );
    await settingsButton.click();
    await toolbar.locator('button[aria-label="Ajustar ventana"]').click();
    await page.waitForFunction(() =>
      document.querySelector('[data-gallery-element="fit-mode-label"]')?.textContent ===
        'Ajuste: Ajustar ventana'
    );

    await gallery.locator('[data-gallery-element="item"][data-index="0"] button').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(() =>
      document.querySelector('#xeg-toolbar-counter')?.getAttribute('data-position') === '2'
    );
    const position = toolbar.locator('#xeg-toolbar-counter');
    assert.notEqual(await position.getAttribute('role'), 'progressbar',
      'Collection position must not announce task progress');
    assert.equal(await position.getAttribute('data-total'), '3');
    assert.equal(await position.getAttribute('data-focused-index'), '1');
    assert.equal(await toolbar.getAttribute('data-current-index'), '1');
    assert.equal(await toolbar.getAttribute('data-focused-index'), '1');
    assert.match(await position.textContent(), /Archivo 2 de 3/u);
    const selectedSource = await gallery.locator('[data-gallery-element="item"][data-index="1"] img').getAttribute('src');
    assert(selectedSource?.includes('GkE5678'), 'Displayed second item has wrong media provenance');
    assert.equal(await toolbar.locator('button[aria-label="Ajustar ventana"]').getAttribute('aria-pressed'), 'true');
    const bulkLabel = 'Descargar los 3 archivos visibles como ZIP';
    assert.equal(await toolbar.locator(`button[aria-label="${bulkLabel}"]`).count(), 1);

    const layout = await toolbar.evaluate((element) => {
      const toolbarRect = element.getBoundingClientRect();
      const label = element.querySelector('[data-gallery-element="fit-mode-label"]');
      const labelRect = label?.getBoundingClientRect();
      const counter = element.querySelector('#xeg-toolbar-counter');
      const counterRect = counter?.getBoundingClientRect();
      return {
        viewportWidth: innerWidth,
        devicePixelRatio,
        viewportScale: visualViewport?.scale ?? null,
        toolbar: { left: toolbarRect.left, right: toolbarRect.right, width: toolbarRect.width,
          scrollWidth: element.scrollWidth, clientWidth: element.clientWidth },
        fitLabel: { text: label?.textContent?.trim() ?? null, left: labelRect?.left ?? null,
          right: labelRect?.right ?? null, height: labelRect?.height ?? null,
          fontSizePx: label ? Number.parseFloat(getComputedStyle(label).fontSize) : null,
          scrollWidth: label?.scrollWidth ?? null, clientWidth: label?.clientWidth ?? null,
          scrollHeight: label?.scrollHeight ?? null, clientHeight: label?.clientHeight ?? null },
        position: { left: counterRect?.left ?? null, right: counterRect?.right ?? null,
          text: counter?.textContent?.trim() ?? null,
          scrollWidth: counter?.scrollWidth ?? null, clientWidth: counter?.clientWidth ?? null },
      };
    });
    assert(layout.toolbar.left >= -1 && layout.toolbar.right <= layout.viewportWidth + 1,
      '200% toolbar is clipped by the viewport');
    assert(layout.toolbar.scrollWidth <= layout.toolbar.clientWidth + 1,
      '200% toolbar content overflows horizontally');
    for (const target of [layout.fitLabel, layout.position]) {
      assert(target.left !== null && target.left >= -1 &&
        target.right !== null && target.right <= layout.viewportWidth + 1,
      '200% fit or position label is clipped');
    }
    assert(layout.fitLabel.height > 0, 'Spanish effective fit label is not displayed');
    assert(layout.fitLabel.fontSizePx >= 12, 'Spanish effective fit label is too small');
    assert(layout.fitLabel.scrollWidth <= layout.fitLabel.clientWidth + 1 &&
      layout.fitLabel.scrollHeight <= layout.fitLabel.clientHeight + 1,
    'Spanish effective fit label is clipped within its control');
    assert(layout.position.scrollWidth <= layout.position.clientWidth + 1,
      'Spanish displayed position is clipped within its control');
    assert(layout.viewportWidth <= 700, '200% browser zoom did not produce a narrow CSS viewport');
    await page.screenshot({ path: join(output, 'installed-zoom-200-spanish-gallery.png') });

    const essential = new Set([
      'Anterior', 'Siguiente', 'Ajustar ventana', 'Descargar', bulkLabel, 'Cerrar',
    ]);
    const reached = new Set();
    await gallery.locator('[data-gallery-element="item"][data-index="1"] button').focus();
    for (let step = 0; step < 40 && reached.size < essential.size; step += 1) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const element = document.activeElement;
        const rect = element?.getBoundingClientRect();
        return { label: element?.getAttribute('aria-label') ?? null,
          left: rect?.left ?? null, right: rect?.right ?? null,
          visibility: element ? getComputedStyle(element).visibility : null };
      });
      if (!essential.has(focused.label)) continue;
      assert(focused.left >= -1 && focused.right <= layout.viewportWidth + 1,
        `200% keyboard control ${focused.label} is clipped`);
      assert.equal(focused.visibility, 'visible', `200% keyboard control ${focused.label} is hidden`);
      reached.add(focused.label);
    }
    assert.deepEqual([...reached].sort(), [...essential].sort(),
      'Keyboard cannot reach every essential Spanish toolbar action');

    const knownDownloadIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    await toolbar.locator('button[aria-label="Descargar"]').click();
    const selectedDownload = await waitForValue(async () => {
      const created = (await queryDownloads(extensionPage))
        .filter(({ id }) => !knownDownloadIds.has(id));
      assert(created.length <= 1, 'Zoom current-item action created multiple downloads');
      if (created[0]?.state === 'interrupted') {
        throw new Error(`Zoom current-item download interrupted: ${created[0].error}`);
      }
      return created[0]?.state === 'complete' ? created[0] : undefined;
    }, '200% selected-item download', 20_000);
    const relativeDownload = relative(downloads, selectedDownload.filename);
    assert(relativeDownload && !relativeDownload.startsWith('..') && !isAbsolute(relativeDownload),
      'Zoom current-item download escaped the task-owned directory');
    assert(basename(selectedDownload.filename).startsWith(`testuser_${TWEET_ID}_1`),
      'Zoom current-item filename does not identify the displayed second item');
    const selectedBytes = await readFile(selectedDownload.filename);
    assert(images[1].equals(selectedBytes),
      'Zoom current-item download bytes do not match the displayed second item');
    await copyFile(selectedDownload.filename, join(output, 'zoom-200-selected-download.jpg'));

    await settingsButton.click();
    await gallery.locator('#settings-language-select').selectOption(priorLanguage);
    await page.waitForFunction(() =>
      document.querySelector('[data-gallery-element="toolbar"] button[aria-label="Close"]') !== null
    );
    await settingsButton.click();
    await toolbar.locator('button[aria-label="Close"]').click();
    await gallery.waitFor({ state: 'detached' });
    const after = await hostSnapshot(page, 0);
    assert.deepEqual(after.background, before.background, '200% close did not restore host isolation');
    assert.deepEqual(after.bodyStyle, before.bodyStyle, '200% close did not restore body styles');
    assert.equal(after.scrollRestoration, before.scrollRestoration);
    assert.equal(after.scrollY, before.scrollY, '200% close did not restore host scroll');
    assert.equal(after.activeElementAlt, before.triggerAlt, '200% close did not restore trigger focus');
    await page.screenshot({ path: join(output, 'installed-zoom-200-spanish-after.png') });
    return { status: 'passed', actualBrowserZoom: changedZoom.observed, baseline, layout, priorZoom,
      keyboardReachable: [...reached].sort(), shownCount: 3,
      selectedIndex: 1, selectedSourceMarker: 'GkE5678',
      download: { bytes: selectedBytes.length, file: 'zoom-200-selected-download.jpg',
        filename: basename(selectedDownload.filename), sha256: createHash('sha256').update(selectedBytes).digest('hex') },
      hostRestored: true, language: 'es' };
  } finally {
    if (zoomAttempted) {
      const restored = await fixtureTabZoom(context, extensionId, page,
        priorZoom.previous, priorZoom.settings);
      assert.equal(restored.observed, priorZoom.previous, 'Fixture browser zoom was not restored');
      assert.equal(restored.observedSettings.mode, priorZoom.settings.mode);
      assert.equal(restored.observedSettings.scope, priorZoom.settings.scope);
    }
  }
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
    await gallery.locator('#xeg-toolbar-counter').getAttribute('data-position'),
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

async function quotedHostSnapshot(page, caseName, triggerSelector) {
  return page.evaluate(({ name, selector }) => {
    const article = document.querySelector(`[data-case="${name}"]`);
    const trigger = article?.querySelector(selector);
    const style = document.body.style;
    return {
      active: document.activeElement === trigger,
      background: ['#host-layout-spacer', 'main'].map((target) => {
        const element = document.querySelector(target);
        return {
          ariaHidden: element?.getAttribute('aria-hidden') ?? null,
          hiddenMarker: element?.hasAttribute('data-xeg-gallery-hidden') ?? false,
          inert: element?.hasAttribute('inert') ?? false,
          selector: target,
        };
      }),
      bodyStyle: { left: style.left, overflow: style.overflow, position: style.position,
        right: style.right, top: style.top },
      scrollRestoration: history.scrollRestoration,
      scrollY: window.scrollY,
    };
  }, { name: caseName, selector: triggerSelector });
}

async function captureQuotedOpeningScroll(trigger) {
  await trigger.evaluate((element) => {
    element.addEventListener('pointerdown', () => {
      element.dataset.openingScrollY = String(window.scrollY);
    }, { once: true, capture: true });
  });
}

async function assertQuotedSelection(page, { position, total, type, path }) {
  const index = position - 1;
  const state = await waitForValue(async () => {
    const observed = await page.evaluate(({ selectedIndex, mediaType }) => {
      const gallery = document.querySelector('[data-xeg-gallery-container]');
      const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
      const counter = toolbar?.querySelector('#xeg-toolbar-counter');
      const item = gallery?.querySelector(
        `[data-gallery-element="item"][data-index="${selectedIndex}"]`
      );
      const media = item?.querySelector(mediaType === 'video' ? 'video' : 'img');
      return {
        position: counter?.getAttribute('data-position') ?? null,
        total: counter?.getAttribute('data-total') ?? null,
        counterFocusedIndex: counter?.getAttribute('data-focused-index') ?? null,
        currentIndex: toolbar?.getAttribute('data-current-index') ?? null,
        focusedIndex: toolbar?.getAttribute('data-focused-index') ?? null,
        source: media?.currentSrc || media?.src || null,
        mediaReady: mediaType === 'video'
          ? media instanceof HTMLVideoElement && media.readyState >= HTMLMediaElement.HAVE_METADATA &&
            media.videoWidth > 0 && media.videoHeight > 0 && media.error === null
          : media instanceof HTMLImageElement && media.complete && media.naturalWidth > 0,
        loaded: item?.getAttribute('data-media-loaded') ?? null,
      };
    }, { selectedIndex: index, mediaType: type });
    return observed.position === String(position) && observed.total === String(total) &&
      observed.counterFocusedIndex === String(index) &&
      observed.currentIndex === String(index) &&
      observed.focusedIndex === String(index) && observed.mediaReady &&
      observed.loaded === 'true' ? observed : undefined;
  }, `quoted selection ${position}/${total}`);
  const source = new URL(state.source);
  assert.equal(source.pathname, path, 'Selected media source must match the expected owner');
  assert.equal(source.hostname, type === 'video' ? 'video.twimg.com' : 'pbs.twimg.com');
  return state;
}

async function assertQuotedOriginLink(gallery, expectedUrl, allowMediaPath = false) {
  const button = gallery.locator('#tweet-text-button');
  assert.equal(await button.count(), 1, 'Selected media must expose originating post metadata');
  await button.click();
  const link = gallery.locator('#toolbar-tweet-panel a[href^="https://x.com/"]');
  await link.waitFor({ state: 'visible' });
  const observed = await link.getAttribute('href');
  assert(
    observed === expectedUrl || (allowMediaPath && observed === `${expectedUrl}/video/2`),
    'Toolbar source link must identify the selected post'
  );
  await button.click();
  return observed;
}

async function navigateQuotedAwayAndBack(page, quotedCase, total) {
  const from = quotedCase.expectedPosition;
  const to = from === 1 ? 2 : from - 1;
  const awayKey = from === 1 ? 'ArrowRight' : 'ArrowLeft';
  const returnKey = from === 1 ? 'ArrowLeft' : 'ArrowRight';
  await page.keyboard.press(awayKey);
  const away = await assertQuotedSelection(page, { position: to, total,
    type: quotedCase.away.type, path: quotedCase.away.path });
  const gallery = page.locator('[data-xeg-gallery-container]');
  const awayOrigin = await assertQuotedOriginLink(gallery, quotedCase.away.origin);
  await page.keyboard.press(returnKey);
  const returned = await assertQuotedSelection(page, { position: from, total,
    type: 'video',
    path: `/ext_tw_video/${quotedCase.owner}/pu/vid/320x180/${quotedCase.media}.mp4` });
  const returnedOrigin = await assertQuotedOriginLink(gallery,
    `https://x.com/${quotedCase.username}/status/${quotedCase.owner}`,
    quotedCase.name === 'linked');
  return { awayKey, returnKey, away, awayOrigin, returned, returnedOrigin };
}

async function assertQuotedGallery(page, quotedCase) {
  const gallery = page.locator('[data-xeg-gallery-container]');
  await gallery.waitFor({ state: 'visible', timeout: 15_000 });
  assert.equal(await gallery.getAttribute('role'), 'dialog');
  assert.equal(await gallery.getAttribute('aria-modal'), 'true');
  const counter = gallery.locator('#xeg-toolbar-counter');
  const expectedTotal = quotedCase.expectedTotal ?? (quotedCase.name === 'linked' ||
    quotedCase.name === 'recognized' ? 2
    : quotedCase.name === 'nested-from-outer' || quotedCase.name === 'nested-direct-quote'
      ? 2 : 3);
  assert.equal(Number(await counter.getAttribute('data-position')),
    quotedCase.expectedPosition, 'Quoted video selection must preserve its collection index');
  assert.equal(Number(await counter.getAttribute('data-total')), expectedTotal,
    'Quoted collection must include only the expected owners');
  const selection = await assertQuotedSelection(page, {
    position: quotedCase.expectedPosition, total: expectedTotal, type: 'video',
    path: `/ext_tw_video/${quotedCase.owner}/pu/vid/320x180/${quotedCase.media}.mp4`,
  });
  assert.equal(await gallery.locator('[data-gallery-element="item"]').count(), expectedTotal);
  const selected = gallery.locator(
    `[data-gallery-element="item"][data-index="${quotedCase.expectedPosition - 1}"]`
  );
  await selected.waitFor({ state: 'visible' });
  const video = selected.locator('video');
  await video.waitFor({ state: 'visible' });
  await page.waitForFunction(({ index }) => {
    const item = document.querySelector(
      `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${index}"]`
    );
    const element = item?.querySelector('video');
    return item?.getAttribute('data-media-loaded') === 'true' &&
      element instanceof HTMLVideoElement && element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      element.videoWidth > 0 && element.videoHeight > 0 && element.error === null;
  }, { index: quotedCase.expectedPosition - 1 }, { timeout: 15_000 });
  const selectedMedia = await video.evaluate((element) => ({
    src: element.currentSrc || element.src,
    readyState: element.readyState,
    width: element.videoWidth,
    height: element.videoHeight,
    duration: element.duration,
    error: element.error?.code ?? null,
  }));
  assert.equal(new URL(selectedMedia.src).hostname, 'video.twimg.com');
  assert.equal(new URL(selectedMedia.src).pathname,
    `/ext_tw_video/${quotedCase.owner}/pu/vid/320x180/${quotedCase.media}.mp4`,
    'The selected video must use the owner-specific API MP4');
  assert.equal(selectedMedia.width, 320);
  assert.equal(selectedMedia.height, 180);
  assert(Number.isFinite(selectedMedia.duration) && selectedMedia.duration > 1);
  assert.equal(selectedMedia.error, null);
  assert.equal(await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').count(), 1);
  assert.equal(await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').count(), 1);
  return { gallery, selected, selectedMedia, selection, total: expectedTotal, video };
}

async function closeQuotedGallery({ gallery, page, method, before, caseName, selector }) {
  if (method === 'button') {
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
  } else {
    await page.keyboard.press('Escape');
  }
  await gallery.waitFor({ state: 'detached', timeout: 15_000 });
  const after = await quotedHostSnapshot(page, caseName, selector);
  assert.equal(after.active, true, `${caseName}: close must restore the exact trigger focus`);
  assert.equal(after.scrollY, before.scrollY, `${caseName}: close must restore host scroll`);
  assert.equal(after.scrollRestoration, before.scrollRestoration);
  assert.deepEqual(after.bodyStyle, before.bodyStyle,
    `${caseName}: close must restore body inline styles`);
  assert.deepEqual(after.background, before.background,
    `${caseName}: close must restore host isolation`);
  assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0);
  return { focusRestored: after.active, scrollRestored: after.scrollY === before.scrollY,
    backgroundRestored: true, bodyStyleRestored: true };
}

async function runOuterVideoControl({ quotedCase, quotedApiResponses, downloads,
  extensionPage, output, page, videoPayloads }) {
  const article = page.locator(`[data-case="${quotedCase.route}"]`);
  const trigger = article.locator('[data-outer-target]');
  await trigger.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await trigger.focus();
  const before = await quotedHostSnapshot(page, quotedCase.route, '[data-outer-target]');
  assert.equal(before.active, true, 'Outer video control must hold focus');
  assert(before.scrollY > 0, 'Outer video control must open at nonzero scroll');
  const hit = await trigger.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return document.elementFromPoint(rect.left + rect.width / 2,
      rect.top + rect.height / 2) === element;
  });
  assert.equal(hit, true, 'Outer video must be the ordinary hit-tested target');
  await page.screenshot({ path: join(output, 'quoted-outer-control-before.png') });
  const apiStart = quotedApiResponses.length;
  await captureQuotedOpeningScroll(trigger);
  await trigger.click();
  before.scrollY = Number(await trigger.getAttribute('data-opening-scroll-y'));
  assert(Number.isFinite(before.scrollY) && before.scrollY > 0);
  const gallery = page.locator('[data-xeg-gallery-container]');
  await gallery.waitFor({ state: 'visible', timeout: 15_000 });
  const outerPath = `/ext_tw_video/${quotedCase.outer}/pu/vid/320x180/outer-unmarked.mp4`;
  const selected = await assertQuotedSelection(page, { position: 3, total: 3,
    type: 'video', path: outerPath });
  const sourceLink = await assertQuotedOriginLink(gallery,
    `https://x.com/${quotedCase.handle}/status/${quotedCase.outer}`);
  assert.deepEqual(quotedApiResponses.slice(apiStart).map(({ tweetId }) => tweetId),
    [quotedCase.outer], 'Outer video must request and select A');
  await page.keyboard.press('ArrowLeft');
  const quoted = await assertQuotedSelection(page, { position: 2, total: 3,
    type: 'video',
    path: `/ext_tw_video/${quotedCase.owner}/pu/vid/320x180/${quotedCase.media}.mp4` });
  await page.keyboard.press('ArrowRight');
  const returned = await assertQuotedSelection(page, { position: 3, total: 3,
    type: 'video', path: outerPath });
  await page.screenshot({ path: join(output, 'quoted-outer-control-gallery.png') });

  const knownIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const filename = `${quotedCase.handle}_${quotedCase.outer}_2.mp4`;
  await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
  const download = await waitForDownload(extensionPage, knownIds, filename);
  const relativeDownload = relative(downloads, download.filename);
  assert(relativeDownload && !relativeDownload.startsWith('..') && !isAbsolute(relativeDownload),
    'Outer video download escaped the task-owned directory');
  const bytes = await readFile(download.filename);
  assert(videoPayloads['nested-c'].equals(bytes),
    'Outer A privileged download must match its routed playable bytes');
  const file = 'quoted-outer-control-download.mp4';
  await copyFile(download.filename, join(output, file));
  const close = await closeQuotedGallery({ gallery, page, method: 'button', before,
    caseName: quotedCase.route, selector: '[data-outer-target]' });
  await page.screenshot({ path: join(output, 'quoted-outer-control-after.png') });
  return { api: quotedApiResponses.slice(apiStart), sourceLink, selected,
    navigation: { awayKey: 'ArrowLeft', returnKey: 'ArrowRight', quoted, returned },
    download: { filename, file, bytes: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex') }, close };
}

async function withControlledFixtureVideoMode(extensionPage, evidence, action) {
  const key = 'xeg-app-settings';
  let prior;
  let mutated = false;
  let result;
  let validationError;
  let cleanupError;
  let restored = false;
  try {
    prior = await extensionPage.evaluate(async (storageKey) => {
      const values = await chrome.storage.local.get(storageKey);
      return { exists: Object.hasOwn(values, storageKey), value: values[storageKey] ?? null };
    }, key);
    evidence.priorStoredMode = prior.value?.gallery?.videoClickMode ?? null;
    const next = createControlledVideoSettings(prior.value, Date.now());
    mutated = true;
    await extensionPage.evaluate(async ({ storageKey, value }) => {
      await chrome.storage.local.set({ [storageKey]: value });
    }, { storageKey: key, value: next });
    const effective = await extensionPage.evaluate(async (storageKey) => {
      const values = await chrome.storage.local.get(storageKey);
      return values[storageKey]?.gallery?.videoClickMode ?? null;
    }, key);
    assert.equal(effective, 'allow-all', 'Preplayer fixture must use the supported allow-all mode');
    evidence.effectiveMode = effective;
    result = await action();
  } catch (error) {
    validationError = error;
  } finally {
    try {
      if (mutated) {
        await extensionPage.evaluate(async ({ storageKey, previous }) => {
          if (previous.exists) await chrome.storage.local.set({ [storageKey]: previous.value });
          else await chrome.storage.local.remove(storageKey);
        }, { storageKey: key, previous: prior });
        restored = await extensionPage.evaluate(async ({ storageKey, previous }) => {
          const values = await chrome.storage.local.get(storageKey);
          return Object.hasOwn(values, storageKey) === previous.exists &&
            (!previous.exists || JSON.stringify(values[storageKey]) === JSON.stringify(previous.value));
        }, { storageKey: key, previous: prior });
      } else restored = true;
      evidence.restored = restored;
      assert.equal(restored, true, 'Preplayer fixture must restore the full prior settings value');
    } catch (error) {
      evidence.restored = false;
      cleanupError = error;
    }
  }
  if (validationError && cleanupError) {
    throw new AggregateError([validationError, cleanupError],
      'Preplayer fixture validation and settings restoration both failed');
  }
  if (validationError) throw validationError;
  if (cleanupError) throw cleanupError;
  return { ...result, controlledSetting: evidence };
}

async function runPublicPreplayerCycle({ quotedCase, quotedApiResponses, apiResponses, downloads,
  extensionPage, output, page, videoPayloads, settingEvidence }) {
  return withControlledFixtureVideoMode(extensionPage, settingEvidence, async () => {
    const pageUrl = `https://x.com/${quotedCase.handle}/status/${quotedCase.outer}`;
    await page.goto(pageUrl);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
      state: 'attached', timeout: 15_000,
    });
    const effective = await extensionPage.evaluate(async () => {
      const values = await chrome.storage.local.get('xeg-app-settings');
      return values['xeg-app-settings']?.gallery?.videoClickMode ?? null;
    });
    assert.equal(effective, 'allow-all', 'Preplayer mode must remain active after page readiness');
    const precondition = await page.evaluate(() => {
      const outer = document.querySelector('[data-case="public-preplayer"]');
      const quote = outer?.querySelector('[role="link"] > article');
      const wrapper = quote?.querySelector('[data-preplayer-wrapper]');
      const media = quote?.querySelector('[data-preplayer-media]');
      const button = media?.querySelector('button');
      const credit = wrapper?.querySelector('.credit a');
      const header = quote?.querySelector('.quote-header a');
      const ownPaths = (article) => [...(article?.querySelectorAll('a[href]') ?? [])]
        .filter((anchor) => anchor.closest('article') === article)
        .map((anchor) => ({ path: new URL(anchor.href).pathname,
          containsTime: anchor.querySelector('time') !== null }));
      return {
        outerStatusAnchors: ownPaths(outer), quoteStatusAnchors: ownPaths(quote),
        nestedArticleCount: outer?.querySelectorAll('article').length ?? 0,
        roleLink: quote?.parentElement?.getAttribute('role') ?? null,
        videoCount: outer?.querySelectorAll('video').length ?? -1,
        totalImageCount: quote?.querySelectorAll('img').length ?? -1,
        trustedThumbnailCount: [...(quote?.querySelectorAll('img') ?? [])]
          .filter((image) => new URL(image.src).hostname === 'pbs.twimg.com' &&
            new URL(image.src).pathname.startsWith('/ext_tw_video_thumb/')).length,
        ordinaryAvatarCount: quote?.querySelectorAll('img.avatar').length ?? -1,
        mediaImageCount: media?.querySelectorAll('img').length ?? -1,
        buttonParentImageCount: button?.parentElement?.querySelectorAll('img').length ?? -1,
        mediaButtonCount: media?.querySelectorAll('button').length ?? -1,
        buttonUnmarked: button?.hasAttribute('data-testid') === false,
        headerOutsideWrapper: !!header && !wrapper?.contains(header),
        creditInsideWrapper: !!credit && wrapper?.contains(credit),
        creditOutsideMedia: !!credit && !media?.contains(credit),
      };
    });
    assert.deepEqual(precondition.outerStatusAnchors, [
      { path: `/${quotedCase.handle}/status/${quotedCase.outer}`, containsTime: false },
      { path: `/${quotedCase.handle}/status/${quotedCase.outer}`, containsTime: false },
    ]);
    assert.deepEqual(precondition.quoteStatusAnchors, [
      { path: `/${quotedCase.username}/status/${quotedCase.owner}`, containsTime: false },
      { path: `/credit_preplay/status/${quotedCase.credit}`, containsTime: false },
    ]);
    assert.equal(precondition.nestedArticleCount, 1);
    assert.equal(precondition.roleLink, 'link');
    assert.equal(precondition.videoCount, 0);
    assert.equal(precondition.totalImageCount, 3);
    assert.equal(precondition.trustedThumbnailCount, 1);
    assert.equal(precondition.ordinaryAvatarCount, 2);
    assert.equal(precondition.mediaImageCount, 3);
    assert.equal(precondition.buttonParentImageCount, 0);
    assert.equal(precondition.mediaButtonCount, 1);
    assert.equal(precondition.buttonUnmarked, true);
    assert.equal(precondition.headerOutsideWrapper, true);
    assert.equal(precondition.creditInsideWrapper, true);
    assert.equal(precondition.creditOutsideMedia, true);

    const trigger = page.locator('[data-case="public-preplayer"] [data-preplayer-media] button');
    await trigger.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -120));
    await trigger.focus();
    const before = await quotedHostSnapshot(page, quotedCase.route,
      '[data-preplayer-media] button');
    assert.equal(before.active, true, 'Preplayer native button must hold focus');
    assert(before.scrollY > 0, 'Preplayer must open at nonzero host scroll');
    const hit = await trigger.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const x = Math.round(rect.left + rect.width * 0.2);
      const y = Math.round(rect.top + rect.height * 0.2);
      const controlSurface = element.parentElement;
      const media = controlSurface?.parentElement;
      const images = [...(media?.querySelectorAll('img') ?? [])];
      return { x, y, topIsButton: document.elementFromPoint(x, y) === element,
        scopeDepth: media?.hasAttribute('data-preplayer-media') ? 2 : null,
        buttonParentImages: controlSurface?.querySelectorAll('img').length ?? -1,
        scopeImages: images.length,
        scopeTrustedThumbs: images.filter((image) =>
          new URL(image.src).hostname === 'pbs.twimg.com' &&
          new URL(image.src).pathname.startsWith('/ext_tw_video_thumb/')).length,
        scopeOrdinaryImages: images.filter((image) =>
          !new URL(image.src).pathname.startsWith('/ext_tw_video_thumb/')).length,
        scopeVideos: media?.querySelectorAll('video').length ?? -1 };
    });
    assert.equal(hit.topIsButton, true, 'Ordinary pointer point must hit the native button');
    assert.equal(hit.scopeDepth, 2, 'Clicked button must reach the exact media shell in two hops');
    assert.equal(hit.buttonParentImages, 0);
    assert.equal(hit.scopeImages, 3);
    assert.equal(hit.scopeTrustedThumbs, 1);
    assert.equal(hit.scopeOrdinaryImages, 2);
    assert.equal(hit.scopeVideos, 0);
    await page.screenshot({ path: join(output, 'quoted-public-preplayer-before.png') });

    const apiStart = quotedApiResponses.length;
    const rejectedApiStart = apiResponses.length;
    await page.mouse.click(hit.x, hit.y);
    const opened = await assertQuotedGallery(page, quotedCase);
    assert.deepEqual(quotedApiResponses.slice(apiStart).map(({ tweetId }) => tweetId),
      [quotedCase.outer], 'Preplayer must request A and derive B from its direct quote');
    assert.deepEqual(apiResponses.slice(rejectedApiStart), [],
      'Preplayer must not request unsupported B or C API targets');
    const originUrl = await assertQuotedOriginLink(opened.gallery,
      `https://x.com/${quotedCase.username}/status/${quotedCase.owner}`);
    await opened.gallery.locator('#tweet-text-button').click();
    const panelText = await opened.gallery.locator('#toolbar-tweet-panel').textContent();
    assert(panelText?.includes(`${quotedCase.username} deterministic installed media`),
      'Selected video text must identify B');
    assert(!panelText.includes('credit_preplay deterministic installed media'),
      'Nested C text must not replace B');
    await opened.gallery.locator('#tweet-text-button').click();
    const navigation = await navigateQuotedAwayAndBack(page, quotedCase, opened.total);
    assert.equal(await opened.gallery.locator('[data-gallery-element="item"] video').count(), 1,
      'Nested C video must not enter the gallery');
    const playbackStart = await opened.video.evaluate((video) => video.currentTime);
    await opened.video.click();
    await page.waitForFunction(({ index, start }) => {
      const video = document.querySelector(
        `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${index}"] video`
      );
      return video instanceof HTMLVideoElement && !video.paused && video.error === null &&
        video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        video.currentTime >= start + 0.15;
    }, { index: quotedCase.expectedPosition - 1, start: playbackStart }, { timeout: 15_000 });
    const playbackEnd = await opened.video.evaluate((video) => video.currentTime);
    await page.screenshot({ path: join(output, 'quoted-public-preplayer-gallery.png') });

    const knownIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    const filename = `${quotedCase.username}_${quotedCase.owner}_${quotedCase.expectedPosition - 1}.mp4`;
    await opened.gallery.locator(
      '[data-gallery-element="toolbar"] button[aria-label="Download"]'
    ).click();
    const download = await waitForDownload(extensionPage, knownIds, filename);
    const relativeDownload = relative(downloads, download.filename);
    assert(relativeDownload && !relativeDownload.startsWith('..') && !isAbsolute(relativeDownload),
      'Preplayer download escaped the task-owned directory');
    const bytes = await readFile(download.filename);
    const sourceBytes = videoPayloads[quotedCase.media];
    assert(sourceBytes.equals(bytes), 'Preplayer bytes must match B video MP4 exactly');
    const file = 'quoted-public-preplayer-download.mp4';
    await copyFile(download.filename, join(output, file));
    const close = await closeQuotedGallery({ gallery: opened.gallery, page,
      method: 'escape', before, caseName: quotedCase.route,
      selector: '[data-preplayer-media] button' });
    assert.deepEqual(quotedApiResponses.slice(apiStart).map(({ tweetId }) => tweetId),
      [quotedCase.outer], 'Preplayer navigation and download must retain the A request');
    assert.deepEqual(apiResponses.slice(rejectedApiStart), [],
      'Preplayer must not add rejected B or C API requests');
    await page.screenshot({ path: join(output, 'quoted-public-preplayer-after.png') });
    return {
      name: quotedCase.name, pageUrl, precondition, hit, requestedTweetId: quotedCase.outer,
      api: quotedApiResponses.slice(apiStart), selectedPosition: quotedCase.expectedPosition,
      selected: opened.selectedMedia, originUrl, textOwner: quotedCase.username,
      navigation, playbackStart, playbackEnd,
      download: { filename, bytes: bytes.length, file,
        sha256: createHash('sha256').update(bytes).digest('hex'),
        sourceSha256: createHash('sha256').update(sourceBytes).digest('hex') },
      close,
    };
  });
}

async function runUnavailableSequence({ apiResponses, extensionPage, output, page,
  sequenceApiResponses, getUnavailableApiOverflow, settingEvidence, evidence }) {
  return withControlledFixtureVideoMode(extensionPage, settingEvidence, async () => {
    const sequence = UNAVAILABLE_SEQUENCE;
    const pageUrl = `https://x.com/${sequence.handle}/status/${sequence.failures[0].outer}`;
    await page.goto(pageUrl);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
      state: 'attached', timeout: 15_000,
    });
    const effectiveMode = await extensionPage.evaluate(async () => {
      const values = await chrome.storage.local.get('xeg-app-settings');
      return values['xeg-app-settings']?.gallery?.videoClickMode ?? null;
    });
    assert.equal(effectiveMode, 'allow-all',
      'Unavailable sequence must retain supported allow-all preview clicks');
    const documentStartedAt = await page.evaluate(() => performance.timeOrigin);
    evidence.pageUrl = pageUrl;
    evidence.documentStartedAt = documentStartedAt;
    evidence.steps = [];
    evidence.mode = 'allow-all';
    const apiStart = sequenceApiResponses.length;
    const rejectedStart = apiResponses.length;
    const sequenceStartedAt = performance.now();
    const assertSameDocument = async () => {
      assert.equal(page.url(), pageUrl, 'Sequence must retain the exact fixture URL');
      assert.equal(await page.evaluate(() => performance.timeOrigin), documentStartedAt,
        'Sequence must retain one document and content-script lifetime');
    };
    for (const failure of sequence.failures) {
      await assertSameDocument();
      const step = { name: failure.name, tweetId: failure.outer, typename: failure.typename,
        status: 'started' };
      evidence.steps.push(step);
      const article = page.locator(`[data-sequence-step="${failure.name}"]`);
      const trigger = article.locator('.media-shell button');
      await trigger.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, -100));
      await trigger.focus();
      const preview = await article.evaluate((element) => {
        const video = element.querySelector('video');
        const button = element.querySelector('button');
        const rect = button?.getBoundingClientRect();
        const x = rect ? Math.round(rect.left + rect.width * 0.2) : -1;
        const y = rect ? Math.round(rect.top + rect.height * 0.2) : -1;
        return { poster: video?.poster ?? null, src: video?.getAttribute('src') ?? null,
          sourceCount: video?.querySelectorAll('source').length ?? -1,
          imageCount: element.querySelectorAll('img').length,
          hit: document.elementFromPoint(x, y) === button, x, y };
      });
      assert.equal(preview.poster,
        `https://pbs.twimg.com/ext_tw_video_thumb/${failure.outer}/pu/img/unavailable.jpg`,
        'Unavailable preview must have one trusted video poster');
      assert.equal(preview.src, null, 'Unavailable preview must have no playable DOM source');
      assert.equal(preview.sourceCount, 0);
      assert.equal(preview.imageCount, 0, 'Unavailable preview must have no DOM image fallback');
      assert.equal(preview.hit, true, 'Failure click must hit the ordinary preview button');
      step.preview = { trustedPoster: true, sourceCount: 0, imageCount: 0, hit: true };
      const knownNotifications = await extensionPage.evaluate(async () =>
        Object.keys(await chrome.notifications.getAll()));
      const requestIndex = sequenceApiResponses.length;
      step.clickedAt = new Date().toISOString();
      await page.mouse.click(preview.x, preview.y);
      const notification = await waitForValue(async () => extensionPage.evaluate(
        async (known) => {
          const active = await chrome.notifications.getAll();
          const entry = Object.entries(active).find(([id]) =>
            id.startsWith('xeg-') && !known.includes(id));
          return entry ? { id: entry[0] } : undefined;
        }, knownNotifications), `${failure.name} extraction completion`);
      step.completedAt = new Date().toISOString();
      step.notification = notification;
      step.api = sequenceApiResponses.slice(requestIndex);
      assert.deepEqual(step.api.map(({ tweetId, status }) => [tweetId, status]),
        [[failure.outer, 200]], `${failure.name} must finish one healthy HTTP response`);
      assert.equal(step.api[0].resultTypename, failure.typename);
      assert.equal(step.api[0].providerErrors, 0);
      assert.equal(step.api[0].fulfilledAt !== undefined, true,
        `${failure.name} response must finish before the next click`);
      assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0,
        `${failure.name} must fail extraction instead of opening DOM fallback media`);
      const recovery = page.locator('[data-xeg-error-boundary]');
      if (await recovery.count()) {
        await recovery.locator('[data-xeg-error-action="close"]').click();
        await recovery.waitFor({ state: 'detached' });
        step.recoveryClosedThroughUi = true;
      }
      await assertSameDocument();
      step.status = 'failed-extraction-completed';
    }
    assert(performance.now() - sequenceStartedAt < 60_000,
      'Available control must run before the circuit reset interval');
    const control = sequence.control;
    const step = { name: 'available-control', tweetId: control.outer, status: 'started' };
    evidence.steps.push(step);
    const trigger = page.locator('[data-sequence-step="control"] [data-preplayer-media] button');
    await trigger.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -100));
    await trigger.focus();
    const before = await quotedHostSnapshot(page, 'control', '[data-preplayer-media] button');
    assert.equal(before.active, true);
    assert(before.scrollY > 0);
    const hit = await trigger.evaluate((button) => {
      const rect = button.getBoundingClientRect();
      const x = Math.round(rect.left + rect.width * 0.2);
      const y = Math.round(rect.top + rect.height * 0.2);
      return { x, y, button: document.elementFromPoint(x, y) === button };
    });
    assert.equal(hit.button, true);
    const requestIndex = sequenceApiResponses.length;
    step.clickedAt = new Date().toISOString();
    await page.mouse.click(hit.x, hit.y);
    const opened = await assertQuotedGallery(page, control);
    step.api = sequenceApiResponses.slice(requestIndex);
    assert.deepEqual(step.api.map(({ tweetId, status }) => [tweetId, status]),
      [[control.outer, 200]], 'Fourth click must make a fresh HTTP request for available A');
    assert.equal(step.api[0].resultTypename, 'Tweet');
    assert.equal(step.api[0].providerErrors, 0);
    assert.equal(step.api[0].fulfilledAt !== undefined, true);
    evidence.durationToFourthRequestMs = step.api[0].requestedAtMonotonicMs - sequenceStartedAt;
    assert(evidence.durationToFourthRequestMs >= 0 && evidence.durationToFourthRequestMs < 60_000,
      'The actual fourth HTTP request must precede the circuit cooldown');
    const originUrl = await assertQuotedOriginLink(opened.gallery,
      `https://x.com/${control.username}/status/${control.owner}`);
    await opened.gallery.locator('#tweet-text-button').click();
    const text = await opened.gallery.locator('#toolbar-tweet-panel').textContent();
    assert(text?.includes(`${control.username} deterministic installed media`),
      'Available control must retain B text');
    assert(!text.includes('credit_preplay deterministic installed media'),
      'Available control must not attribute B video to C');
    await opened.gallery.locator('#tweet-text-button').click();
    const playbackStart = await opened.video.evaluate((video) => video.currentTime);
    await opened.video.click();
    await page.waitForFunction(({ index, start }) => {
      const video = document.querySelector(
        `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${index}"] video`
      );
      return video instanceof HTMLVideoElement && !video.paused && video.error === null &&
        video.videoWidth > 0 && video.videoHeight > 0 &&
        video.currentTime >= start + 0.15;
    }, { index: control.expectedPosition - 1, start: playbackStart }, { timeout: 15_000 });
    const playbackEnd = await opened.video.evaluate((video) => video.currentTime);
    await page.screenshot({ path: join(output, 'quoted-unavailable-sequence-gallery.png') });
    const close = await closeQuotedGallery({ gallery: opened.gallery, page,
      method: 'escape', before, caseName: 'control',
      selector: '[data-preplayer-media] button' });
    await assertSameDocument();
    assert.deepEqual(sequenceApiResponses.slice(apiStart).map(({ tweetId }) => tweetId),
      [...sequence.failures.map(({ outer }) => outer), control.outer],
      'Sequence must make exactly four ordered requests in one document');
    assert.deepEqual(apiResponses.slice(rejectedStart), [],
      'Sequence must not make rejected or unexpected API requests');
    assert.equal(getUnavailableApiOverflow(), 0,
      'Sequence API diagnostic count must stay within its bounded record capacity');
    step.selected = opened.selectedMedia;
    step.selection = opened.selection;
    step.originUrl = originUrl;
    step.textOwner = control.username;
    step.playbackStart = playbackStart;
    step.playbackEnd = playbackEnd;
    step.close = close;
    step.completedAt = new Date().toISOString();
    step.status = 'passed';
    evidence.status = 'passed';
    await page.screenshot({ path: join(output, 'quoted-unavailable-sequence-after.png') });
    return evidence;
  });
}

async function runQuotedVideoCycle({ quotedCase, quotedApiResponses, downloads,
  extensionPage, output, page, videoPayloads }) {
  const pageUrl = `https://x.com/${quotedCase.handle}/status/${quotedCase.outer}`;
  await page.goto(pageUrl);
  await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
    state: 'attached', timeout: 15_000,
  });
  await page.locator('body[data-video-ready="true"]').waitFor({
    state: 'attached', timeout: 15_000,
  });
  const article = page.locator(`[data-case="${quotedCase.route}"]`);
  const shell = article.locator('[data-video-key]');
  const preview = shell.locator('[data-quote-target]');
  await preview.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await preview.focus();
  const previewBefore = await quotedHostSnapshot(page, quotedCase.route, '[data-quote-target]');
  assert.equal(previewBefore.active, true, 'Preview must hold focus before opening');
  assert(previewBefore.scrollY > 0, 'Quote fixture must start at nonzero host scroll');
  const previewState = await preview.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2,
      rect.top + rect.height / 2);
    const video = element.closest('[data-testid="videoPlayer"]')?.querySelector('video');
    return { hit: hit === element, poster: element.getAttribute('src'),
      videoSource: video?.getAttribute('src') ?? null };
  });
  assert.equal(previewState.hit, true, 'Preview must be the ordinary hit-tested click target');
  assert.equal(previewState.videoSource, null, 'Preview check must precede native playback');
  assert(previewState.poster?.endsWith(`/${quotedCase.poster}.jpg`));
  await page.screenshot({ path: join(output, `quoted-${quotedCase.name}-before.png`) });

  const apiStart = quotedApiResponses.length;
  await captureQuotedOpeningScroll(preview);
  await preview.click();
  previewBefore.scrollY = Number(await preview.getAttribute('data-opening-scroll-y'));
  assert(Number.isFinite(previewBefore.scrollY) && previewBefore.scrollY > 0,
    'Preview opening scroll must be observed');
  const initial = await assertQuotedGallery(page, quotedCase);
  const expectedRequest = quotedCase.name === 'linked' ||
    quotedCase.name === 'nested-direct-quote' ? quotedCase.owner : quotedCase.outer;
  assert.deepEqual(quotedApiResponses.slice(apiStart).map(({ tweetId }) => tweetId),
    [expectedRequest], 'Preview must use the exact owning tweet API request');
  const previewOriginUrl = await assertQuotedOriginLink(initial.gallery,
    `https://x.com/${quotedCase.username}/status/${quotedCase.owner}`,
    quotedCase.name === 'linked');
  const previewNavigation = await navigateQuotedAwayAndBack(page, quotedCase, initial.total);
  await page.screenshot({ path: join(output, `quoted-${quotedCase.name}-preview-gallery.png`) });
  const previewClose = await closeQuotedGallery({ gallery: initial.gallery, page,
    method: 'escape', before: previewBefore, caseName: quotedCase.route,
    selector: '[data-quote-target]' });

  const hostPlay = shell.locator('[data-testid="playButton"]');
  const galleryCountBeforePlay = await page.locator('[data-xeg-gallery-container]').count();
  assert.equal(galleryCountBeforePlay, 0);
  await hostPlay.click();
  const hostVideo = shell.locator('video');
  await page.waitForFunction((name) => {
    const shell = document.querySelector(`[data-case="${name}"] [data-video-key]`);
    const video = shell?.querySelector('video');
    return shell?.getAttribute('data-playing') === 'true' &&
      video instanceof HTMLVideoElement && video.currentSrc.startsWith('blob:') &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.currentTime > 0 && !video.paused && video.error === null;
  }, quotedCase.route, { timeout: 15_000 });
  assert.equal(await page.locator('[data-xeg-gallery-container]').count(), 0,
    'Native play control must not open the gallery');
  const hostPlaying = await hostVideo.evaluate((video) => ({
    source: video.currentSrc, time: video.currentTime, width: video.videoWidth,
    height: video.videoHeight, error: video.error?.code ?? null,
  }));
  assert.equal(hostPlaying.width, 320);
  assert.equal(hostPlaying.height, 180);
  assert.equal(hostPlaying.error, null);
  await hostVideo.focus();
  const playingBefore = await quotedHostSnapshot(page, quotedCase.route, '[data-video-key] video');
  assert.equal(playingBefore.active, true, 'Blob-backed host player must hold focus');
  const hostHit = await hostVideo.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return document.elementFromPoint(rect.left + rect.width / 2,
      rect.top + rect.height / 2) === element;
  });
  assert.equal(hostHit, true, 'Blob-backed player must be the ordinary hit-tested click target');
  await captureQuotedOpeningScroll(hostVideo);
  await hostVideo.click();
  playingBefore.scrollY = Number(await hostVideo.getAttribute('data-opening-scroll-y'));
  assert(Number.isFinite(playingBefore.scrollY) && playingBefore.scrollY > 0,
    'Blob-backed opening scroll must be observed');
  const playing = await assertQuotedGallery(page, quotedCase);
  const playingOriginUrl = await assertQuotedOriginLink(playing.gallery,
    `https://x.com/${quotedCase.username}/status/${quotedCase.owner}`,
    quotedCase.name === 'linked');
  const playingNavigation = await navigateQuotedAwayAndBack(page, quotedCase, playing.total);
  const galleryPlaybackStart = await playing.video.evaluate((video) => video.currentTime);
  await playing.video.click();
  await page.waitForFunction(({ index, start }) => {
    const video = document.querySelector(
      `[data-xeg-gallery-container] [data-gallery-element="item"][data-index="${index}"] video`
    );
    return video instanceof HTMLVideoElement && video.currentTime >= start + 0.15 &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !video.paused && video.error === null;
  }, { index: quotedCase.expectedPosition - 1, start: galleryPlaybackStart }, { timeout: 15_000 });
  const galleryPlaybackTime = await playing.video.evaluate((video) => video.currentTime);
  assert(quotedApiResponses.slice(apiStart).every(({ tweetId }) => tweetId === expectedRequest),
    'Blob-backed click must retain the same owner request');
  const latePanel = await page.evaluate(() => {
    const panel = document.createElement('aside');
    panel.id = 'late-quote-panel';
    panel.setAttribute('aria-hidden', 'false');
    panel.textContent = 'Late quote host panel';
    document.body.append(panel);
    return panel.id;
  });
  await page.locator(`#${latePanel}[data-xeg-gallery-hidden]`).waitFor({ state: 'attached' });
  await page.screenshot({ path: join(output, `quoted-${quotedCase.name}-playing-gallery.png`) });

  const knownIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
  const filename = `${quotedCase.username}_${quotedCase.owner}_${quotedCase.expectedPosition - 1}.mp4`;
  await playing.gallery.locator(
    '[data-gallery-element="toolbar"] button[aria-label="Download"]'
  ).click();
  const download = await waitForDownload(extensionPage, knownIds, filename);
  const relativeDownload = relative(downloads, download.filename);
  assert(relativeDownload && !relativeDownload.startsWith('..') && !isAbsolute(relativeDownload),
    'Quoted video download escaped the task-owned directory');
  const bytes = await readFile(download.filename);
  const sourceBytes = videoPayloads[quotedCase.media];
  assert(sourceBytes.equals(bytes), 'Privileged video bytes must match the selected MP4 asset');
  const copiedName = `quoted-${quotedCase.name}-download.mp4`;
  await copyFile(download.filename, join(output, copiedName));
  const lateState = await page.locator(`#${latePanel}`).evaluate((element) => ({
    hiddenMarker: element.hasAttribute('data-xeg-gallery-hidden'),
    inert: element.hasAttribute('inert'),
  }));
  assert.deepEqual(lateState, { hiddenMarker: true, inert: true },
    'Late-added host panel must be isolated while the gallery is open');
  const playingClose = await closeQuotedGallery({ gallery: playing.gallery, page,
    method: quotedCase.close, before: playingBefore, caseName: quotedCase.route,
    selector: '[data-video-key] video' });
  const restoredPanel = await page.locator(`#${latePanel}`).evaluate((element) => ({
    ariaHidden: element.getAttribute('aria-hidden'),
    hiddenMarker: element.hasAttribute('data-xeg-gallery-hidden'),
    inert: element.hasAttribute('inert'),
  }));
  assert.deepEqual(restoredPanel, { ariaHidden: 'false', hiddenMarker: false, inert: false });
  await page.locator(`#${latePanel}`).evaluate((element) => element.remove());
  await page.screenshot({ path: join(output, `quoted-${quotedCase.name}-after.png`) });
  const outerControl = quotedCase.name === 'unmarked'
    ? await runOuterVideoControl({ quotedCase, quotedApiResponses, downloads,
      extensionPage, output, page, videoPayloads })
    : null;
  return {
    name: quotedCase.name, pageUrl, requestedTweetId: expectedRequest,
    api: quotedApiResponses.slice(apiStart), selectedPosition: quotedCase.expectedPosition,
    preview: { source: previewState.poster, selected: initial.selectedMedia,
      originUrl: previewOriginUrl, navigation: previewNavigation,
      close: previewClose },
    hostPlaying: { blobBacked: hostPlaying.source.startsWith('blob:'),
      currentTime: hostPlaying.time, width: hostPlaying.width, height: hostPlaying.height },
    playing: { selected: playing.selectedMedia, originUrl: playingOriginUrl,
      navigation: playingNavigation, galleryPlaybackStart, galleryPlaybackTime,
      closeMethod: quotedCase.close,
      close: playingClose },
    download: { filename, bytes: bytes.length, file: copiedName,
      sha256: createHash('sha256').update(bytes).digest('hex'),
      sourceSha256: createHash('sha256').update(sourceBytes).digest('hex') },
    outerControl,
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
  const progress = gallery.locator('#xeg-toolbar-counter');
  assert.equal(Number(await progress.getAttribute('data-position')), cycle.triggerIndex + 1);

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
        .querySelector('[data-xeg-gallery-container] #xeg-toolbar-counter')
        ?.getAttribute('data-position') === String(expected),
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

async function exerciseInstalledExtension(
  context,
  extensionId,
  root,
  output,
  downloads,
  images,
  browserCdp
) {
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  const cycles = [];
  const quotedVideoCycles = [];
  const unavailableSequence = { status: 'pending' };
  let fixtureVideoAssets;
  const mv3RestartCancellation = {};
  const trustedDownloadInput = {};
  const flowCleanup = {};
  const cleanupErrors = [];
  let fixtureRoutes;
  let extensionPage;
  let page;
  let workerObserver;
  let packagingAssets;
  let notification;
  let publicDom;
  let videoClickConfiguration;
  let zoomSpanish;
  let flowResult;
  let primaryError;
  let primarySeen = false;
  let observationError;
  let observationErrorSeen = false;
  try {
    fixtureRoutes = await installFixtureRoutes(context, root, images);
    fixtureVideoAssets = Object.fromEntries(Object.entries(fixtureRoutes.videoPayloads)
      .map(([name, bytes]) => [name, { bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex') }]));
    extensionPage = await context.newPage();
    page = await context.newPage();
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push({ location: message.location().url, text: message.text() });
      }
    });
    page.on('requestfailed', (request) => {
      const url = new URL(request.url());
      failedRequests.push({
        error: request.failure()?.errorText,
        host: url.hostname,
        path: url.pathname,
      });
    });
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    const pageCdp = await context.newCDPSession(extensionPage);
    workerObserver = await createServiceWorkerObserver(browserCdp, pageCdp);
    assert.equal(
      await extensionPage.evaluate(() => chrome.runtime.getManifest().name),
      'X.com Enhanced Gallery'
    );
    packagingAssets = await verifyPackagedIcons(extensionPage);
    await page.goto(FIXTURE_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({
      state: 'attached',
      timeout: 15_000,
    });
    videoClickConfiguration = await extensionPage.evaluate(async () => {
      const stored = (await chrome.storage.local.get('xeg-app-settings'))['xeg-app-settings'];
      return { storagePresent: stored !== undefined,
        storedMode: stored?.gallery?.videoClickMode ?? null,
        effectiveMode: stored?.gallery?.videoClickMode ?? 'block-controls-only' };
    });
    assert.equal(videoClickConfiguration.effectiveMode, 'block-controls-only',
      'Installed profile must use the configured noncontrol video click mode');
    await verifyTrustedDownloadInput({ context, downloads, extensionId, extensionPage,
      page, evidence: trustedDownloadInput });
    await verifyMv3RestartCancellation({
      downloads,
      evidence: mv3RestartCancellation,
      extensionId,
      extensionPage,
      page,
      workerObserver,
    });
    notification = await verifyDefaultNotification(extensionPage);
    for (const cycle of CYCLES) {
      cycles.push(await runCycle({ cycle, downloads, extensionPage, output, page, images }));
    }
    try {
      zoomSpanish = await runZoomSpanishCycle({ context, downloads, extensionId,
        extensionPage, images, output, page });
    } catch (error) {
      zoomSpanish = { status: 'failed', error: safeError(error) };
      throw error;
    }
    publicDom = await runPublicFixtureCycle({
      apiResponses: fixtureRoutes.apiResponses,
      output,
      page,
    });
    for (const quotedCase of QUOTED_CASES) {
      const settingEvidence = {};
      try {
        const runQuotedCase = quotedCase.name === 'public-preplayer'
          ? runPublicPreplayerCycle : runQuotedVideoCycle;
        quotedVideoCycles.push(await runQuotedCase({
          quotedCase,
          quotedApiResponses: fixtureRoutes.quotedApiResponses,
          apiResponses: fixtureRoutes.apiResponses,
          downloads,
          extensionPage,
          output,
          page,
          videoPayloads: fixtureRoutes.videoPayloads,
          settingEvidence,
        }));
      } catch (error) {
        const diagnostic = { name: quotedCase.name, status: 'failed',
          error: safeError(error),
          ...(quotedCase.name === 'public-preplayer'
            ? { controlledSetting: settingEvidence } : {}),
          api: fixtureRoutes.quotedApiResponses.filter(({ tweetId }) =>
            tweetId === quotedCase.outer || tweetId === quotedCase.owner),
          screenshot: `quoted-${quotedCase.name}-failure.png` };
        const [snapshot, screenshot] = await Promise.allSettled([
          page.evaluate(() => {
            const gallery = document.querySelector('[data-xeg-gallery-container]');
            const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
            const counter = toolbar?.querySelector('#xeg-toolbar-counter');
            return {
              url: location.href,
              activeTag: document.activeElement?.tagName ?? null,
              bodyVideoError: document.body.dataset.videoError ?? null,
              bodyVideoReady: document.body.dataset.videoReady ?? null,
              galleryPresent: gallery !== null,
              position: counter?.getAttribute('data-position') ?? null,
              total: counter?.getAttribute('data-total') ?? null,
              currentIndex: toolbar?.getAttribute('data-current-index') ?? null,
              focusedIndex: toolbar?.getAttribute('data-focused-index') ?? null,
              items: [...(gallery?.querySelectorAll('[data-gallery-element="item"]') ?? [])]
                .map((item) => {
                  const media = item.querySelector('video, img');
                  return { index: item.getAttribute('data-index'),
                    loaded: item.getAttribute('data-media-loaded'),
                    source: media?.currentSrc || media?.src || null,
                    mediaError: media instanceof HTMLVideoElement ? media.error?.code ?? null : null,
                    readyState: media instanceof HTMLVideoElement ? media.readyState : null };
                }),
            };
          }),
          page.screenshot({ path: join(output, diagnostic.screenshot) }),
        ]);
        diagnostic.snapshot = snapshot.status === 'fulfilled' ? snapshot.value
          : { error: safeError(snapshot.reason) };
        if (screenshot.status === 'rejected') {
          diagnostic.screenshotError = safeError(screenshot.reason);
        }
        quotedVideoCycles.push(diagnostic);
        await writeFile(join(output, `quoted-${quotedCase.name}-failure.json`),
          JSON.stringify(diagnostic, null, 2)).catch(() => {});
        throw error;
      }
    }
    const unavailableSetting = {};
    try {
      await runUnavailableSequence({
        apiResponses: fixtureRoutes.apiResponses,
        extensionPage,
        output,
        page,
        sequenceApiResponses: fixtureRoutes.unavailableApiResponses,
        getUnavailableApiOverflow: fixtureRoutes.getUnavailableApiOverflow,
        settingEvidence: unavailableSetting,
        evidence: unavailableSequence,
      });
      unavailableSequence.controlledSetting = unavailableSetting;
    } catch (error) {
      unavailableSequence.status = 'failed';
      unavailableSequence.error = safeError(error);
      unavailableSequence.controlledSetting = unavailableSetting;
      unavailableSequence.api = fixtureRoutes.unavailableApiResponses;
      await page.screenshot({ path: join(output, 'quoted-unavailable-sequence-failure.png') })
        .catch((screenshotError) => {
          unavailableSequence.screenshotError = safeError(screenshotError);
        });
      await writeFile(join(output, 'quoted-unavailable-sequence-failure.json'),
        JSON.stringify(unavailableSequence, null, 2)).catch(() => {});
      throw error;
    }
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
      cleanup: flowCleanup,
      cycles,
      pageErrors,
      consoleErrors,
      fixtureApiResponses: fixtureRoutes.apiResponses,
      mv3RestartCancellation,
      trustedDownloadInput,
      notification,
      packagingAssets,
      publicDom,
      quotedVideoCycles,
      unavailableSequence,
      fixtureVideoAssets,
      videoClickConfiguration,
      zoomSpanish,
    };
  } catch (error) {
    primarySeen = true;
    primaryError = error;
    if (page) {
      await page.screenshot({ path: join(output, 'installed-flow-error.png') }).catch(() => {});
    }
  } finally {
    if (workerObserver) {
      try {
        await workerObserver.dispose();
        flowCleanup.workerObserverDisposed = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    for (const [name, ownedPage] of [
      ['fixturePage', page],
      ['extensionPage', extensionPage],
    ]) {
      if (!ownedPage) continue;
      try {
        await ownedPage.close();
        flowCleanup[`${name}Closed`] = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    if (fixtureRoutes) {
      try {
        await fixtureRoutes.remove();
        flowCleanup.fixtureRoutesRemoved = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    flowCleanup.errorCount = cleanupErrors.length;
    if (cleanupErrors.length) flowCleanup.errors = cleanupErrors.map(safeError);
    try {
      await writeFile(
        join(output, 'installed-flow-observations.json'),
        JSON.stringify(
          {
            cycles,
            pageErrors,
            consoleErrors,
            failedRequests,
            fixtureApiResponses: fixtureRoutes?.apiResponses ?? [],
            quotedApiResponses: fixtureRoutes?.quotedApiResponses ?? [],
            flowCleanup,
            mv3RestartCancellation,
            trustedDownloadInput,
            notification,
            packagingAssets,
            publicDom,
            quotedVideoCycles,
            unavailableSequence,
            fixtureVideoAssets,
            videoClickConfiguration,
            zoomSpanish,
          },
          null,
          2
        )
      );
    } catch (error) {
      observationErrorSeen = true;
      observationError = error;
    }
  }
  const combinedErrors = [
    ...(primarySeen ? [primaryError] : []),
    ...cleanupErrors,
    ...(observationErrorSeen ? [observationError] : []),
  ];
  if (combinedErrors.length > 1) {
    throw new AggregateError(
      combinedErrors,
      `Installed flow stages failed: ${combinedErrors.map(safeError).join('; ')}`
    );
  }
  if (primarySeen) throw primaryError;
  if (cleanupErrors.length) throw cleanupErrors[0];
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
  liveObservation = null,
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
  let browserCdp;
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
    await enableDeveloperMode(context, browserName);
    await verifyDownloadDirectory(context, downloads);
    browserCdp = await context.browser().newBrowserCDPSession();
    // Use Chrome's download manager and this fresh profile's directory preference
    // so the extension's filename selection reaches the normal browser delegate.
    await browserCdp.send('Browser.setDownloadBehavior', {
      behavior: 'default', eventsEnabled: true,
    });
    ({ id: extensionId } = await browserCdp.send('Extensions.loadUnpacked', {
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
      images,
      browserCdp
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
    if (browserCdp && extensionId) {
      try {
        await browserCdp.send('Extensions.uninstall', { id: extensionId });
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
