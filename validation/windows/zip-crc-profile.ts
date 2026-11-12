// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, isAbsolute, join, relative } from 'node:path';

import type { BrowserContext, Page } from '@playwright/test';

import {
  expectedStoredZipBytes,
  readExactDownloadFile,
  verifyStoredZip,
} from './download-memory.ts';
import { startExtensionNativeFixtureLoopback } from './extension-native-loopback.ts';
import { TWEET_ID, type ImageFixtures } from './install-preparation.ts';

const LARGE_TWEET_ID = '4666000000000000534';
const LARGE_URL = `https://x.com/crc_fixture/status/${LARGE_TWEET_ID}`;
const SMALL_URL = `https://x.com/testuser/status/${TWEET_ID}`;
const CLIPS = [
  {
    file: 'crc-owned-clip.mp4',
    bytes: 2_857_140,
    sha256: '352daf37b350f50a069c3911b32248c5adb7684ade30b525f6c25685c3b80f5e',
    width: 640,
    height: 360,
    durationSeconds: 10,
  },
  {
    file: 'crc-owned-motion.mp4',
    bytes: 98_399,
    sha256: '36dd064afeefde15ecceea49109fffee6b17cdf0962de6eb21e0255fdd0cb8f8',
    width: 320,
    height: 180,
    durationSeconds: 3,
  },
  {
    file: 'crc-owned-small.mp4',
    bytes: 5_184,
    sha256: 'de4c15ff513d41c964eadb5d45ce08030b2a94eea501e9f86edfd8a301e1411e',
    width: 160,
    height: 90,
    durationSeconds: 1,
  },
  {
    file: 'crc-owned-markers.mp4',
    bytes: 31_813,
    sha256: 'c93c7e6c6102e36089ee5aa79d9fa9758be8b7f62ac1043247ebb22399770004',
    width: 320,
    height: 180,
    durationSeconds: 1.2,
  },
] as const;
const REPORT_ATTRIBUTE = 'data-xeg-zip-experiment';
const SAMPLE_LIMIT = 3;

type Workload = 'large' | 'small';
type ZipSpan = { phase: string; startMs: number; endMs: number; bytes: number };
type ZipReport = {
  schemaVersion: number;
  outcome: string;
  timeOrigin: number;
  startedMs: number;
  finishedMs: number;
  elapsedMs: number;
  itemCount: number;
  archiveBytes: number;
  maxCrcChunkBytes: number;
  crcChunks: number;
  spanLimit: number;
  spans: ZipSpan[];
  timerPairCalibration: { iterations: number; elapsedMs: number };
};
type NativeDownload = { id: number; filename: string; state: string; error?: string };
type FailedRequest = {
  url: string;
  method: string;
  resourceType: string;
  range: string | null;
  startedAtMs: number;
  phase: string;
  error: string;
};

declare const chrome: {
  runtime: { getManifest(): { version: string } };
  downloads: { search(query: { orderBy: string[] }): Promise<NativeDownload[]> };
};

function sha256(bytes: Buffer) {
  return createHash('sha256').update(bytes).digest('hex');
}

function largeApiResponse() {
  const media = CLIPS.map((clip, index) => ({
    type: 'video',
    id_str: String(BigInt(LARGE_TWEET_ID) + BigInt(index) + 100n),
    media_key: `7_${String(BigInt(LARGE_TWEET_ID) + BigInt(index) + 100n)}`,
    media_url_https: `https://pbs.twimg.com/ext_tw_video_thumb/${LARGE_TWEET_ID}/pu/img/crc-${index}.jpg`,
    expanded_url: `${LARGE_URL}/video/${index + 1}`,
    original_info: { width: clip.width, height: clip.height },
    video_info: {
      aspect_ratio: [clip.width, clip.height],
      variants: [
        {
          content_type: 'video/mp4',
          bitrate: 832000,
          url: `https://video.twimg.com/ext_tw_video/${LARGE_TWEET_ID}/pu/vid/${clip.width}x${clip.height}/crc-${index}.mp4`,
        },
      ],
    },
  }));
  return {
    data: {
      tweetResult: {
        result: {
          __typename: 'Tweet',
          rest_id: LARGE_TWEET_ID,
          core: {
            user_results: {
              result: {
                rest_id: LARGE_TWEET_ID,
                legacy: { screen_name: 'crc_fixture', name: 'CRC Fixture' },
              },
            },
          },
          legacy: {
            id_str: LARGE_TWEET_ID,
            full_text: 'Four distinct owned source clips',
            extended_entities: { media },
          },
        },
      },
    },
  };
}

function largePage() {
  const videos = CLIPS.map((clip, index) => {
    const poster = `https://pbs.twimg.com/ext_tw_video_thumb/${LARGE_TWEET_ID}/pu/img/crc-${index}.jpg`;
    const source = `https://video.twimg.com/ext_tw_video/${LARGE_TWEET_ID}/pu/vid/${clip.width}x${clip.height}/crc-${index}.mp4`;
    return `<a href="/crc_fixture/status/${LARGE_TWEET_ID}/video/${index + 1}"><div data-testid="videoPlayer" data-crc-video="${index}"><div data-testid="previewInterstitial"><img tabindex="0" width="${clip.width}" height="${clip.height}" alt="Owned clip ${index + 1}" src="${poster}"></div><video controls preload="none" muted playsinline poster="${poster}"><source src="${source}" type="video/mp4"></video></div></a>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Owned CRC ZIP clips</title><style>[data-testid="videoPlayer"] video{display:none}</style></head><body><article data-testid="tweet"><a href="/crc_fixture/status/${LARGE_TWEET_ID}"><time datetime="2026-11-12T00:00:00Z">Owned post</time></a><div data-testid="tweetText">Four distinct owned source clips</div>${videos}</article></body></html>`;
}

function smallPage() {
  const markers = ['GkE1234ABCDEF.jpg', 'GkE5678GHIJKL.jpg', 'GkE9012MNOPQR.jpg'];
  const photos = markers
    .map(
      (marker, index) =>
        `<div data-testid="tweetPhoto"><a href="/testuser/status/${TWEET_ID}/photo/${index + 1}"><img tabindex="0" width="${480 + index * 80}" height="${320 + index * 40}" alt="Owned image ${index + 1}" src="https://pbs.twimg.com/media/${marker}?format=jpg&amp;name=large"></a></div>`
    )
    .join('');
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><title>Owned CRC ZIP images</title></head><body><article data-route="classic" data-phase="normal" data-testid="tweet"><a href="/testuser/status/${TWEET_ID}"><time datetime="2026-11-12T00:00:00Z">Owned post</time></a><div data-testid="tweetText">Three owned images</div>${photos}</article></body></html>`;
}

function smallApiResponse() {
  const markers = ['GkE1234ABCDEF.jpg', 'GkE5678GHIJKL.jpg', 'GkE9012MNOPQR.jpg'];
  const media = markers.map((marker, index) => ({
    type: 'photo',
    id_str: `46662${index}`,
    media_key: `3_46662${index}`,
    media_url_https: `https://pbs.twimg.com/media/${marker}`,
    expanded_url: `${SMALL_URL}/photo/${index + 1}`,
    original_info: { width: 480 + index * 80, height: 320 + index * 40 },
  }));
  return {
    data: {
      tweetResult: {
        result: {
          __typename: 'Tweet',
          rest_id: TWEET_ID,
          core: {
            user_results: {
              result: { rest_id: TWEET_ID, legacy: { screen_name: 'testuser', name: 'Test User' } },
            },
          },
          legacy: {
            id_str: TWEET_ID,
            full_text: 'Three owned images',
            extended_entities: { media },
          },
        },
      },
    },
  };
}

async function queryDownloads(extensionPage: Page) {
  return extensionPage.evaluate(() => chrome.downloads.search({ orderBy: ['-startTime'] }));
}

async function waitForDownload(extensionPage: Page, prior: Set<number>) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const created = (await queryDownloads(extensionPage)).filter((item) => !prior.has(item.id));
    assert(created.length <= 1, 'ZIP action created multiple native downloads');
    const item = created[0];
    if (item?.state === 'complete') {
      return item;
    }
    if (item?.state === 'interrupted') {
      throw new Error(`Native ZIP interrupted: ${item.error ?? 'unknown'}`);
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error('Native ZIP download did not complete within 30 seconds');
}

function parseReport(raw: string | null, count: number): ZipReport {
  assert(raw, 'Normal product realm did not publish the ZIP profile report');
  const report: unknown = JSON.parse(raw);
  assert(report && typeof report === 'object');
  assert('schemaVersion' in report && report.schemaVersion === 1);
  assert('outcome' in report && report.outcome === 'owned-blob-ready');
  assert('itemCount' in report && report.itemCount === count);
  assert('spans' in report && Array.isArray(report.spans));
  assert('spanLimit' in report && report.spanLimit === 128);
  assert(report.spans.length <= report.spanLimit, 'ZIP profile span limit was exceeded');
  for (const span of report.spans) {
    assert(span && typeof span === 'object');
    assert('phase' in span && typeof span.phase === 'string');
    assert('startMs' in span && typeof span.startMs === 'number' && Number.isFinite(span.startMs));
    assert('endMs' in span && typeof span.endMs === 'number' && span.endMs >= span.startMs);
    assert('bytes' in span && typeof span.bytes === 'number' && span.bytes >= 0);
  }
  assert(
    'maxCrcChunkBytes' in report &&
      typeof report.maxCrcChunkBytes === 'number' &&
      report.maxCrcChunkBytes <= 1_048_576
  );
  assert('crcChunks' in report && typeof report.crcChunks === 'number' && report.crcChunks > 0);
  assert('startedMs' in report && typeof report.startedMs === 'number');
  assert(
    'finishedMs' in report &&
      typeof report.finishedMs === 'number' &&
      report.finishedMs > report.startedMs
  );
  assert('elapsedMs' in report && typeof report.elapsedMs === 'number' && report.elapsedMs > 0);
  assert('archiveBytes' in report && typeof report.archiveBytes === 'number');
  assert(
    'timerPairCalibration' in report &&
      report.timerPairCalibration &&
      typeof report.timerPairCalibration === 'object'
  );
  assert(
    'iterations' in report.timerPairCalibration && report.timerPairCalibration.iterations === 1000
  );
  assert(
    'elapsedMs' in report.timerPairCalibration &&
      typeof report.timerPairCalibration.elapsedMs === 'number'
  );
  return report as ZipReport;
}

function unionCrcActiveMs(spans: readonly ZipSpan[]) {
  const intervals = spans
    .filter((span) => span.phase === 'crc-active')
    .map(({ startMs, endMs }) => ({ startMs, endMs }))
    .sort((left, right) => left.startMs - right.startMs);
  let total = 0;
  let end = Number.NEGATIVE_INFINITY;
  for (const interval of intervals) {
    total += Math.max(0, interval.endMs - Math.max(interval.startMs, end));
    end = Math.max(end, interval.endMs);
  }
  return total;
}

async function rendererHeap(page: Page) {
  const session = await page.context().newCDPSession(page);
  try {
    const usage = await session.send('Runtime.getHeapUsage');
    return { usedSize: usage.usedSize, totalSize: usage.totalSize };
  } finally {
    await session.detach();
  }
}

async function readVideoObservation(page: Page) {
  return page.evaluate(() => {
    const state = Reflect.get(globalThis, '__xegCrcVideoDiagnostic') as
      | {
          initial: unknown[];
          transitions: unknown[];
          videos: HTMLVideoElement[];
          overflow: boolean;
        }
      | undefined;
    return state
      ? {
          initial: state.initial,
          transitions: state.transitions,
          final: state.videos.map((video) => ({
            src: video.src.slice(0, 240),
            currentSrc: video.currentSrc.slice(0, 240),
            readyState: video.readyState,
          })),
          overflow: state.overflow,
        }
      : null;
  });
}

export async function runZipCrcProfile({
  context,
  extensionId,
  root,
  output,
  downloads,
  images,
  displayImages,
  nativeLoopback,
  workload,
  readContentRealm,
}: {
  context: BrowserContext;
  extensionId: string;
  root: string;
  output: string;
  downloads: string;
  images: ImageFixtures;
  displayImages: ImageFixtures;
  nativeLoopback: Awaited<ReturnType<typeof startExtensionNativeFixtureLoopback>>;
  workload: Workload;
  readContentRealm: (page: Page) => Promise<{ id: number; name: string; origin: string }>;
}) {
  const clips = await Promise.all(
    CLIPS.map(async (expected) => {
      const bytes = await readFile(join(root, 'validation/windows/inputs', expected.file));
      assert.equal(bytes.length, expected.bytes, `Owned clip size differs: ${expected.file}`);
      assert.equal(sha256(bytes), expected.sha256, `Owned clip hash differs: ${expected.file}`);
      return bytes;
    })
  );
  nativeLoopback.setZipCrcProfile({
    smallHtml: smallPage(),
    smallApi: smallApiResponse(),
    largeHtml: largePage(),
    largeApi: largeApiResponse(),
    images,
    displayImages,
    clips,
  });
  const extensionPage = await context.newPage();
  const samples: unknown[] = [];
  const receipt: Record<string, unknown> = {
    status: 'running',
    workload,
    fixture: CLIPS,
    route: 'normal-installed-extension-content-script-over-owned-native-https',
    inputCache:
      'native HTTPS media cacheable for one hour; actual requests and Resource Timing recorded per attempt',
    samples,
  };
  const receiptPath = join(output, 'zip-crc-profile.json');
  let primaryError: unknown;
  const cleanupErrors: unknown[] = [];
  try {
    await mkdir(output, { recursive: true });
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    receipt.extensionVersion = await extensionPage.evaluate(
      () => chrome.runtime.getManifest().version
    );
    const sourceManifestBytes = await readFile(join(root, 'extension/manifest.json'));
    const packagedManifestBytes = await readFile(join(root, 'dist-extension/manifest.json'));
    const sourceManifest = JSON.parse(sourceManifestBytes.toString('utf8')) as {
      content_security_policy?: { extension_pages?: string };
      content_scripts?: Array<{ matches?: string[]; js?: string[]; run_at?: string }>;
    };
    const packagedManifest = JSON.parse(
      packagedManifestBytes.toString('utf8')
    ) as typeof sourceManifest;
    assert.deepEqual(
      packagedManifest.content_scripts,
      sourceManifest.content_scripts,
      'Packaged extension content script differs from source manifest'
    );
    assert(
      sourceManifest.content_scripts?.some(
        ({ matches, js, run_at: runAt }) =>
          matches?.includes('https://x.com/*') &&
          js?.includes('content.js') &&
          runAt === 'document_end'
      ),
      'Source manifest does not declare the normal X.com content script'
    );
    assert.equal(
      packagedManifest.content_security_policy?.extension_pages,
      sourceManifest.content_security_policy?.extension_pages,
      'Packaged extension-page CSP differs from source manifest'
    );
    receipt.sourceManifestExtensionPagesCsp =
      sourceManifest.content_security_policy?.extension_pages ?? null;
    receipt.liveTargetDocumentCsp = 'unknown';
    receipt.realmEvidenceScope =
      'Main-frame nondefault installed content-script identity only; WASM compile permission untested';
    receipt.packagedBytes = {
      sourceManifestSha256: sha256(sourceManifestBytes),
      manifestSha256: sha256(packagedManifestBytes),
      contentJsSha256: sha256(await readFile(join(root, 'dist-extension/content.js'))),
    };
    const expectedEntries =
      workload === 'large'
        ? CLIPS.map((_, index) => ({
            filename: `crc_fixture_${LARGE_TWEET_ID}_${index}.mp4`,
            bytes: clips[index]!,
          }))
        : images.map((bytes, index) => ({ filename: `testuser_${TWEET_ID}_${index}.jpg`, bytes }));
    const expectedBytes = expectedStoredZipBytes(expectedEntries);
    assert(
      expectedBytes <= 4 * 1024 * 1024,
      'Profile ZIP exceeded the existing 4 MiB verification bound'
    );
    for (let index = 0; index < SAMPLE_LIMIT; index++) {
      const condition = index === 0 ? 'fresh-profile-first-use' : 'warm-cache-attempt-fresh-page';
      const page = await context.newPage();
      const sample: Record<string, unknown> = { index, condition, status: 'started' };
      samples.push(sample);
      const pageErrors: string[] = [];
      const consoleErrors: Array<{ text: string; locationUrl: string }> = [];
      const httpErrors: Array<{ url: string; status: number }> = [];
      const failedRequests: FailedRequest[] = [];
      const expectedBlobAborts: string[] = [];
      const classifiedMediaAborts: FailedRequest[] = [];
      const diagnosticOverflow = {
        pageErrors: false,
        consoleErrors: false,
        httpErrors: false,
        failedRequests: false,
        expectedBlobAborts: false,
      };
      let phase = 'navigation';
      page.on('pageerror', (error) => {
        if (pageErrors.length < 32) {
          pageErrors.push(error.message.slice(0, 300));
        } else {
          diagnosticOverflow.pageErrors = true;
        }
      });
      page.on('console', (message) => {
        if (message.type() === 'error') {
          if (consoleErrors.length < 32) {
            consoleErrors.push({
              text: message.text().slice(0, 300),
              locationUrl: message.location().url.slice(0, 300),
            });
          } else {
            diagnosticOverflow.consoleErrors = true;
          }
        }
      });
      page.on('response', (response) => {
        if (response.status() >= 400) {
          if (httpErrors.length < 32) {
            httpErrors.push({ url: response.url().slice(0, 300), status: response.status() });
          } else {
            diagnosticOverflow.httpErrors = true;
          }
        }
      });
      page.on('requestfailed', (request) => {
        const url = new URL(request.url());
        const error = request.failure()?.errorText ?? 'unknown';
        if (url.protocol === 'blob:' && error === 'net::ERR_ABORTED') {
          if (expectedBlobAborts.length < 32) {
            expectedBlobAborts.push(`${request.resourceType()}:blob:`);
          } else {
            diagnosticOverflow.expectedBlobAborts = true;
          }
        } else {
          if (failedRequests.length < 32) {
            failedRequests.push({
              url: request.url().slice(0, 300),
              method: request.method(),
              resourceType: request.resourceType(),
              range: request.headers().range ?? null,
              startedAtMs: request.timing().startTime,
              phase,
              error,
            });
          } else {
            diagnosticOverflow.failedRequests = true;
          }
        }
      });
      sample.diagnostics = {
        pageErrors,
        consoleErrors,
        httpErrors,
        failedRequests,
        expectedBlobAborts,
        classifiedMediaAborts,
        diagnosticOverflow,
      };
      try {
        const pageNativeMark = nativeLoopback.mark();
        const documentResponse = await page.goto(workload === 'large' ? LARGE_URL : SMALL_URL);
        await page
          .locator('html[data-xeg-gallery-ready="true"]')
          .waitFor({ state: 'attached', timeout: 15_000 });
        sample.fixtureDocumentCsp =
          (await documentResponse?.allHeaders())?.['content-security-policy'] ?? null;
        sample.installedContentRealm = await readContentRealm(page);
        phase = 'gallery-opening';
        const trigger =
          workload === 'large'
            ? page.locator('[data-crc-video="0"] img')
            : page
                .locator(
                  'article[data-route="classic"][data-phase="normal"] [data-testid="tweetPhoto"] img'
                )
                .first();
        await trigger.click();
        const gallery = page.locator('[data-xeg-gallery-container]');
        await gallery.waitFor({ state: 'visible', timeout: 15_000 });
        phase = 'before-action';
        sample.videoObservation = await page.evaluate(() => {
          const galleryRoot = document.querySelector('[data-xeg-gallery-container]');
          const videos = Array.from(galleryRoot?.querySelectorAll('video') ?? []).slice(0, 8);
          const describe = (video: HTMLVideoElement) => ({
            src: video.src.slice(0, 240),
            currentSrc: video.currentSrc.slice(0, 240),
            readyState: video.readyState,
          });
          const initial = videos.map(describe);
          const transitions: Array<{
            event: string;
            index: number;
            atMs: number;
            src: string;
            currentSrc: string;
            readyState: number;
          }> = [];
          let overflow = false;
          for (const [videoIndex, video] of videos.entries()) {
            for (const eventName of ['abort', 'error', 'loadedmetadata']) {
              video.addEventListener(eventName, () => {
                if (transitions.length < 32) {
                  transitions.push({
                    event: eventName,
                    index: videoIndex,
                    atMs: performance.now(),
                    ...describe(video),
                  });
                } else {
                  overflow = true;
                }
              });
            }
          }
          Reflect.set(globalThis, '__xegCrcVideoDiagnostic', {
            initial,
            transitions,
            videos,
            get overflow() {
              return overflow;
            },
          });
          return { initial, transitions: [], overflow: false };
        });
        const count = workload === 'large' ? 4 : 3;
        assert.equal(
          await gallery.locator('#xeg-toolbar-counter').getAttribute('data-total'),
          String(count)
        );
        const button = gallery.locator(
          `[data-gallery-element="toolbar"] button[aria-label="Download ${count} shown files as ZIP"]`
        );
        await button.waitFor({ state: 'visible' });
        sample.heapBefore = await rendererHeap(page);
        await page.evaluate(() =>
          document.addEventListener(
            'click',
            (event) => {
              const target = event.target;
              if (
                target instanceof Element &&
                target.closest('button[aria-label$="shown files as ZIP"]')
              ) {
                Reflect.set(globalThis, '__xegZipClickMs', performance.now());
              }
            },
            { capture: true, once: true }
          )
        );
        const prior = new Set((await queryDownloads(extensionPage)).map((item) => item.id));
        const nativeMark = nativeLoopback.mark();
        sample.nativeRequestsBeforeAction = nativeLoopback.since(pageNativeMark);
        phase = 'action';
        await button.click();
        await page.waitForFunction(
          (attribute) => {
            return document.documentElement.hasAttribute(attribute);
          },
          REPORT_ATTRIBUTE,
          { timeout: 120_000 }
        );
        const observed = await page.evaluate(
          (attribute) => ({
            raw: document.documentElement.getAttribute(attribute),
            clickMs: Reflect.get(globalThis, '__xegZipClickMs') as number | undefined,
            timeOrigin: performance.timeOrigin,
          }),
          REPORT_ATTRIBUTE
        );
        sample.rawProfile = observed.raw;
        phase = 'verification';
        const report = parseReport(observed.raw, count);
        assert.equal(report.timeOrigin, observed.timeOrigin);
        assert(typeof observed.clickMs === 'number' && observed.clickMs <= report.startedMs);
        sample.profile = report;
        sample.crcActiveUnionMs = unionCrcActiveMs(report.spans);
        sample.idealCrcRemovalUpperBoundMs = sample.crcActiveUnionMs;
        sample.nativeRequestsAfterAction = nativeLoopback.since(nativeMark);
        sample.resourceTimings = await page.evaluate(() =>
          performance
            .getEntriesByType('resource')
            .filter((entry) => /(?:pbs|video)\.twimg\.com/u.test(entry.name))
            .map((entry) => {
              const resource = entry as PerformanceResourceTiming;
              const deliveryType = Reflect.get(resource, 'deliveryType');
              return {
                path: new URL(resource.name).pathname,
                transferSize: resource.transferSize,
                encodedBodySize: resource.encodedBodySize,
                decodedBodySize: resource.decodedBodySize,
                deliveryType: typeof deliveryType === 'string' ? deliveryType : null,
              };
            })
            .slice(0, 32)
        );
        sample.actionToOwnedBlobReadyMs = report.finishedMs - observed.clickMs;
        sample.handlerToOwnedBlobReadyMs = report.elapsedMs;
        sample.heapAfterReady = await rendererHeap(page);
        const native = await waitForDownload(extensionPage, prior);
        const savedPath = isAbsolute(native.filename)
          ? native.filename
          : join(downloads, native.filename);
        const owned = relative(downloads, savedPath);
        assert(
          owned && !owned.startsWith('..') && !isAbsolute(owned),
          'Native ZIP escaped the owned directory'
        );
        const stem =
          workload === 'large' ? `crc_fixture_${LARGE_TWEET_ID}` : `testuser_${TWEET_ID}`;
        assert(
          new RegExp(`^${stem}(?: \\(\\d+\\))?\\.zip$`).test(basename(native.filename)),
          'Native ZIP name lost its owned source identity'
        );
        const { bytes, identity } = await readExactDownloadFile(savedPath, expectedBytes);
        assert.equal(report.archiveBytes, bytes.length);
        const parsed = verifyStoredZip(bytes, expectedEntries, { physicalOrder: 'commit' });
        sample.saved = {
          filename: basename(native.filename),
          bytes: bytes.length,
          sha256: sha256(bytes),
          identity,
          parsed,
        };
        sample.videoObservation = await readVideoObservation(page);
        sample.nativeRequestsAfterAction = nativeLoopback.since(nativeMark);
        const sourceTransfers = (
          sample.nativeRequestsAfterAction as ReturnType<typeof nativeLoopback.since>
        ).filter(
          (entry) =>
            entry.host === (workload === 'large' ? 'video.twimg.com' : 'pbs.twimg.com') &&
            (workload === 'large'
              ? entry.path.includes(`/ext_tw_video/${LARGE_TWEET_ID}/`)
              : entry.path.startsWith('/media/GkE')) &&
            entry.method === 'GET'
        );
        sample.sourceTransferCount = sourceTransfers.length;
        sample.cacheConditionQualified = index > 0 ? sourceTransfers.length === 0 : null;
        assert.equal(
          nativeLoopback.snapshot().overflow,
          false,
          'Owned native fixture byte/request cap was exceeded'
        );
        assert.equal(
          nativeLoopback.snapshot().unexpectedCount,
          0,
          'Owned native fixture received an undeclared request'
        );
        sample.heapAfterSavedVerification = await rendererHeap(page);
        const servedRanges = (
          sample.nativeRequestsBeforeAction as ReturnType<typeof nativeLoopback.since>
        ).filter(
          ({ host, status, range, result }) =>
            host === 'video.twimg.com' &&
            status === 206 &&
            range?.start === 0 &&
            result === 'served'
        );
        const videoSources =
          (
            sample.videoObservation as {
              initial: Array<{ src: string; currentSrc: string }>;
            } | null
          )?.initial.flatMap(({ src, currentSrc }) => [src, currentSrc]) ?? [];
        const unexplainedFailedRequests = failedRequests.filter((failure) => {
          const url = new URL(failure.url);
          const ownedClip = CLIPS.find(
            (clip, clipIndex) =>
              failure.url ===
              `https://video.twimg.com/ext_tw_video/${LARGE_TWEET_ID}/pu/vid/${clip.width}x${clip.height}/crc-${clipIndex}.mp4`
          );
          if (
            workload === 'large' &&
            failure.method === 'GET' &&
            failure.resourceType === 'media' &&
            failure.error === 'net::ERR_ABORTED' &&
            url.protocol === 'https:' &&
            url.hostname === 'video.twimg.com' &&
            ownedClip !== undefined &&
            servedRanges.some(
              ({ path, range, bytes, sha256: servedSha256 }) =>
                path === url.pathname &&
                range?.end === ownedClip.bytes - 1 &&
                bytes === ownedClip.bytes &&
                servedSha256 === ownedClip.sha256
            ) &&
            videoSources.includes(failure.url)
          ) {
            classifiedMediaAborts.push(failure);
            return false;
          }
          return true;
        });
        sample.unexplainedFailedRequests = unexplainedFailedRequests;
        assert(Object.values(diagnosticOverflow).every((value) => value === false));
        assert.equal(
          (sample.videoObservation as { overflow: boolean } | null)?.overflow,
          false,
          'Video diagnostic transition cap was exceeded'
        );
        assert.deepEqual(pageErrors, []);
        assert.deepEqual(consoleErrors, []);
        assert.deepEqual(httpErrors, []);
        assert.deepEqual(unexplainedFailedRequests, []);
        sample.status = 'passed';
      } catch (error) {
        sample.status = 'failed';
        sample.error = String(error);
        throw error;
      } finally {
        try {
          sample.videoObservation = await readVideoObservation(page);
        } catch (error) {
          sample.videoObservationError = String(error);
        }
        try {
          await page.close();
          sample.pageClosed = true;
        } catch (error) {
          cleanupErrors.push(error);
          sample.pageCloseError = String(error);
        }
        try {
          await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
        } catch (error) {
          cleanupErrors.push(error);
          sample.receiptWriteError = String(error);
        }
      }
    }
    receipt.status = 'passed';
  } catch (error) {
    primaryError = error;
    receipt.status = 'failed';
    receipt.error = String(error);
  } finally {
    try {
      await extensionPage.close();
      receipt.extensionPageClosed = true;
    } catch (error) {
      cleanupErrors.push(error);
      receipt.extensionPageCloseError = String(error);
    }
    receipt.cleanupErrors = cleanupErrors.map(String);
    if (cleanupErrors.length) {
      receipt.status = 'failed';
    }
    try {
      await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`);
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (cleanupErrors.length) {
    throw new AggregateError(
      [...(primaryError === undefined ? [] : [primaryError]), ...cleanupErrors],
      'ZIP CRC profile or cleanup failed'
    );
  }
  if (primaryError !== undefined) {
    throw primaryError;
  }
  return receipt;
}
