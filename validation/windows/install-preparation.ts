// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { BrowserContext, Request, Route } from '@playwright/test';
import {
  CREDIT_CONTROLS_CASE,
  QUOTED_CASES,
  quotedVideoApiResponse,
  RAPID_CLICK_A,
  UNAVAILABLE_SEQUENCE,
} from './fixtures/installed-quoted-video-api.ts';

declare const chrome: {
  settingsPrivate: {
    getPref(key: string, callback: (preference: { value: string }) => void): void;
  };
};

export type ApiRecord = {
  tweetId?: string;
  method: string;
  status: number;
  url?: string;
  requestedAt?: string;
  requestedAtMonotonicMs?: number;
  fulfilledAt?: string;
  fulfilledAtMonotonicMs?: number | null;
  routeSettledAtMonotonicMs?: number | null;
  transportState?: string;
  transportSettledAtMonotonicMs?: number | null;
  abortedAfterNavigation?: boolean;
  resultTypename?: string | null;
  rootMediaCount?: number | null;
  providerErrors?: number;
};

export type QualityRequest = {
  path: string;
  name: string | null;
  resourceType: string;
  bytes: number;
  sha256: string;
};

type DelayedFailureGate = {
  tweetId: string;
  fail: boolean;
  promise: Promise<void>;
  release: () => void;
};

export type ImageFixtures = [Buffer, Buffer, Buffer];

export type CompactImages = { display: Buffer; original: Buffer };

export const TWEET_ID = '1234567890123456789';

export const DELAYED_FAILURE_ID = '8777777777777777777';

export const DELAYED_NAVIGATION_ID = '8777777777777777778';

export const QUALITY_TWEET_ID = '4666000000000000001';

export const QUALITY_FIXTURE_URL = `https://x.com/qualityuser/status/${QUALITY_TWEET_ID}`;

export const QUALITY_IMAGE_PATHS = ['GkE1234ABCDEF', 'GkE5678GHIJKL.jpg', 'GkE9012MNOPQR.jpg'];

export const EXPERIENCE_TWEET_ID = '4666000000000000002';

export const EXPERIENCE_FIXTURE_URL = `https://x.com/experience/status/${EXPERIENCE_TWEET_ID}`;

export const EXPERIENCE_IMAGES = [
  { path: 'XegExperienceTall.jpg', width: 300, height: 900, label: 'Tall' },
  { path: 'XegExperiencePanorama.jpg', width: 1200, height: 200, label: 'Panorama' },
  { path: 'XegExperienceSmall.jpg', width: 120, height: 80, label: 'Small' },
] as const;

const EXPERIENCE_CAPTION =
  'A deliberately long gallery caption with several clauses, a link-shaped token https://example.invalid/long-caption, and multilingual text: 길게 이어지는 문장과 日本語の説明. The panel must keep its own scroll while the selected media and toolbar remain usable.';

export const SOURCE_IMAGE_FAULTS = ['404', 'empty', 'corrupt'] as const;

const MAX_QUALITY_API_RESPONSES = 8 + SOURCE_IMAGE_FAULTS.length * 2;

const MAX_QUALITY_IMAGE_REQUESTS = 200 + SOURCE_IMAGE_FAULTS.length * 16;

const PUBLIC_TWEET_ID = '9876543210987654321';

export const PUBLIC_FIXTURE_URL = `https://x.com/public_user/status/${PUBLIC_TWEET_ID}`;

const COMPACT_OUTER_ID = '8555555555555555555';

export const COMPACT_MIDDLE_ID = '9555555555555555555';

export const COMPACT_INNER_ID = '7555555555555555555';

export const COMPACT_FIXTURE_URL = `https://x.com/outer_fixture/status/${COMPACT_OUTER_ID}`;

export const COMPACT_DISPLAY_URL =
  'https://pbs.twimg.com/media/CompactQuoteSelected?format=webp&name=medium';

const COMPACT_FIRST_URL = 'https://pbs.twimg.com/media/GkE1234ABCDEF?format=jpg&name=medium';

export const IMAGE_URL_MARKERS = ['GkE1234', 'GkE5678', 'GkE9012'];

const MAX_UNAVAILABLE_API_RECORDS = 8;

export function imageReceipt(bytes: Uint8Array) {
  return { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

export async function enableDeveloperMode(context: BrowserContext, browserName: string) {
  const page = await context.newPage();
  try {
    await page.goto(browserName === 'msedge' ? 'edge://extensions/' : 'chrome://extensions/');
    const toggle = page.locator(browserName === 'msedge' ? '#dev-switch:visible' : '#devMode');
    await toggle.waitFor({ state: 'visible' });
    if (!(await toggle.evaluate((element) => 'checked' in element && element.checked))) {
      await toggle.click();
    }
    assert(
      await toggle.evaluate((element) => 'checked' in element && element.checked),
      'Extension developer mode is disabled'
    );
  } finally {
    await page.close();
  }
}

export async function verifyDownloadDirectory(context: BrowserContext, downloads: string) {
  const page = await context.newPage();
  try {
    await page.goto('chrome://settings/downloads');
    const directory = await page.evaluate(
      () =>
        new Promise<string>((resolveDirectory) => {
          chrome.settingsPrivate.getPref('download.default_directory', (preference) => {
            resolveDirectory(preference.value);
          });
        })
    );
    assert.equal(
      resolve(directory),
      resolve(downloads),
      'Chrome must use the task-owned download directory'
    );
  } finally {
    await page.close();
  }
}

export async function createImageFixtures(
  context: BrowserContext,
  scale = 1
): Promise<ImageFixtures> {
  const page = await context.newPage();
  try {
    await page.goto('about:blank');
    const encoded = await page.evaluate(
      (scale) =>
        [
          { color: '#155a91', label: 'Fixture 1' },
          { color: '#9a5d16', label: 'Fixture 2' },
          { color: '#27764b', label: 'Fixture 3' },
        ].map(({ color, label }, index) => {
          const canvas = document.createElement('canvas');
          canvas.width = (480 + index * 80) * scale;
          canvas.height = (320 + index * 40) * scale;
          const drawing = canvas.getContext('2d');
          if (!drawing) {
            throw new Error('Canvas 2D context unavailable');
          }
          drawing.fillStyle = color;
          drawing.fillRect(0, 0, canvas.width, canvas.height);
          drawing.fillStyle = '#ffffff';
          drawing.font = `bold ${36 * scale}px Segoe UI`;
          drawing.fillText(label, 36 * scale, 72 * scale);
          return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        }),
      scale
    );
    const images = encoded.map((value) => {
      assert(value, 'Fixture image encoding failed');
      return Buffer.from(value, 'base64');
    });
    const [first, second, third] = images;
    assert(first && second && third, 'Expected three fixture images');
    return [first, second, third];
  } finally {
    await page.close();
  }
}

function compactPhotoApiResponse(tweetId: string) {
  const photo = (id: string, url: string) => ({
    type: 'photo',
    id_str: id,
    media_url_https: url,
    original_info: { width: 480, height: 320 },
  });
  const tweet = (
    id: string,
    handle: string,
    text: string,
    media: ReturnType<typeof photo>[],
    quoted?: object
  ) => ({
    __typename: 'Tweet',
    rest_id: id,
    core: { user_results: { result: { legacy: { screen_name: handle, name: handle } } } },
    legacy: { id_str: id, full_text: text, extended_entities: { media } },
    ...(quoted ? { quoted_status_result: { result: quoted } } : {}),
  });
  const inner = tweet(COMPACT_INNER_ID, 'inner_fixture', 'C verified API caption', [
    photo('compact-c-shared', COMPACT_DISPLAY_URL),
  ]);
  const result =
    tweetId === COMPACT_INNER_ID
      ? tweet(COMPACT_INNER_ID, 'inner_fixture', 'C verified API caption', [
          photo('compact-c-first', COMPACT_FIRST_URL),
          photo('compact-c-selected', COMPACT_DISPLAY_URL),
        ])
      : tweet(
          COMPACT_MIDDLE_ID,
          'middle_fixture',
          'B verified API caption',
          [photo('compact-b-shared', COMPACT_DISPLAY_URL)],
          inner
        );
  return { data: { tweetResult: { result } } };
}

function imageIndex(url: string) {
  const index = IMAGE_URL_MARKERS.findIndex((marker) => url.includes(marker));
  return index < 0 ? 0 : index;
}

export async function installFixtureRoutes(
  context: BrowserContext,
  root: string,
  images: ImageFixtures,
  displayImages: ImageFixtures,
  compactImages?: CompactImages,
  experienceImages?: Buffer[],
  options: { classicTweetApi?: boolean } = {}
) {
  const html = await readFile(join(root, 'test/e2e/fixtures/installed-gallery-page.html'), 'utf8');
  const experienceHtml = experienceImages
    ? await readFile(join(root, 'test/e2e/fixtures/installed-gallery-experience-page.html'), 'utf8')
    : '';
  const extensionHtml = QUALITY_IMAGE_PATHS.reduce((page, path) => {
    const sharedPath = path.endsWith('.jpg') ? path : `${path}.jpg`;
    const sharedSource = `https://pbs.twimg.com/media/${sharedPath}?format=jpg&amp;name=large`;
    assert(page.includes(sharedSource), 'Expected shared fixture image source is missing');
    return page.replace(
      sharedSource,
      `https://pbs.twimg.com/media/${path}?format=jpg&amp;name=small`
    );
  }, html);
  const quotedHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-quoted-video-page.html'),
    'utf8'
  );
  const noOuterCase = QUOTED_CASES.find(({ name }) => name === 'unmarked-no-outer');
  assert(noOuterCase, 'Unmarked no-outer fixture case is missing');
  const outerStartMarker = '<!-- unmarked outer media start -->';
  const outerEndMarker = '<!-- unmarked outer media end -->';
  const outerStart = quotedHtml.indexOf(outerStartMarker);
  const outerEnd = quotedHtml.indexOf(outerEndMarker);
  assert(
    outerStart >= 0 &&
      outerEnd > outerStart &&
      outerStart === quotedHtml.lastIndexOf(outerStartMarker) &&
      outerEnd === quotedHtml.lastIndexOf(outerEndMarker),
    'Unmarked outer media markers must enclose exactly one fixture section'
  );
  const outerLink = '<a href="/outer_two/status/8222222222222222222"><time>Outer two</time></a>';
  assert.equal(quotedHtml.split(outerLink).length, 2, 'Unmarked A permalink must occur once');
  const noOuterHtml = (
    quotedHtml.slice(0, outerStart) + quotedHtml.slice(outerEnd + outerEndMarker.length)
  ).replace(
    outerLink,
    `<a href="/${noOuterCase.handle}/status/${noOuterCase.outer}"><time>Outer without media</time></a>`
  );
  const compactHtml = compactImages
    ? await readFile(
        join(root, 'test/e2e/fixtures/installed-compact-quote-photo-page.html'),
        'utf8'
      )
    : '';
  const preplayerHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-public-preplayer-page.html'),
    'utf8'
  );
  const unavailableHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-unavailable-sequence-page.html'),
    'utf8'
  );
  const unmarkedVideoHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-unmarked-video-page.html'),
    'utf8'
  );
  const rapidVideoHtml = await readFile(
    join(root, 'test/e2e/fixtures/installed-rapid-video-page.html'),
    'utf8'
  );
  const videoPayloads: Record<string, Buffer> = Object.fromEntries(
    await Promise.all(
      ['quote-one', 'quote-two', 'linked-four', 'quote-three', 'nested-c'].map(async (name) => [
        name,
        await readFile(join(root, `test/e2e/fixtures/installed-${name}.mp4`)),
      ])
    )
  );
  const own12RapidBPath = '/ext_tw_video/8888888888888888882/pu/vid/320x180/quote-two.mp4';
  const own12RapidBAvPayload = await readFile(
    join(root, 'test/e2e/fixtures/installed-native-controls-av.mp4')
  );
  let own12RapidBPayload: Buffer | null = null;
  const apiResponses: ApiRecord[] = [];
  const classicApiResponses: ApiRecord[] = [];
  const unhandledRequests: Array<{ host: string; path: string; resourceType: string }> = [];
  const quotedApiResponses: ApiRecord[] = [];
  const unavailableApiResponses: ApiRecord[] = [];
  const qualityApiResponses: ApiRecord[] = [];
  const qualityRequests: QualityRequest[] = [];
  const compactApiResponses: ApiRecord[] = [];
  const compactImageRequests: QualityRequest[] = [];
  let compactMode: 'healthy' | 'middle' | 'denied' | null = null;
  let unavailableApiOverflow = 0;
  let sequenceRouteActive = false;
  let delayedFailureGate: DelayedFailureGate | null = null;
  const delayedRequests = new Map<Request, ApiRecord>();
  const recordDelayedTransport = (request: Request, state: string) => {
    const record = delayedRequests.get(request);
    if (record) {
      record.transportState = state;
      record.transportSettledAtMonotonicMs = performance.now();
    }
  };
  const delayedRequestFinished = (request: Request) => recordDelayedTransport(request, 'finished');
  const delayedRequestFailed = (request: Request) => recordDelayedTransport(request, 'failed');
  context.on('requestfinished', delayedRequestFinished);
  context.on('requestfailed', delayedRequestFailed);
  const routeHandler = async (route: Route) => {
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
      let tweetId: string | undefined;
      try {
        const variables: unknown = JSON.parse(url.searchParams.get('variables') ?? '{}');
        tweetId =
          typeof variables === 'object' &&
          variables !== null &&
          'tweetId' in variables &&
          typeof variables.tweetId === 'string'
            ? variables.tweetId
            : undefined;
      } catch {
        tweetId = undefined;
      }
      if (
        compactImages &&
        compactMode &&
        (tweetId === COMPACT_INNER_ID || tweetId === COMPACT_MIDDLE_ID)
      ) {
        assert(compactApiResponses.length < 12, 'Compact API observation overflow');
        const denied = compactMode === 'denied';
        const record: ApiRecord = {
          tweetId,
          method: route.request().method(),
          status: denied ? 403 : 200,
          requestedAtMonotonicMs: performance.now(),
        };
        compactApiResponses.push(record);
        await route.fulfill({
          status: record.status,
          contentType: 'application/json',
          body: JSON.stringify(denied ? {} : compactPhotoApiResponse(tweetId)),
        });
        record.fulfilledAtMonotonicMs = performance.now();
        return;
      }
      if (
        tweetId === DELAYED_FAILURE_ID ||
        tweetId === DELAYED_NAVIGATION_ID ||
        tweetId === RAPID_CLICK_A
      ) {
        const rapidResponse = tweetId === RAPID_CLICK_A ? quotedVideoApiResponse(tweetId) : null;
        const record: ApiRecord = {
          tweetId,
          method: route.request().method(),
          status: 403,
          requestedAtMonotonicMs: performance.now(),
          fulfilledAtMonotonicMs: null,
          routeSettledAtMonotonicMs: null,
          transportState: 'pending',
          transportSettledAtMonotonicMs: null,
        };
        delayedRequests.set(route.request(), record);
        if (rapidResponse && !delayedFailureGate?.fail) {
          record.status = 200;
        }
        quotedApiResponses.push(record);
        assert(
          delayedFailureGate?.tweetId === tweetId,
          'Delayed extraction request must match its owned response gate'
        );
        await delayedFailureGate.promise;
        try {
          await route.fulfill({
            status: record.status,
            contentType: 'application/json',
            body: record.status === 200 && rapidResponse ? JSON.stringify(rapidResponse) : '{}',
          });
          record.fulfilledAtMonotonicMs = performance.now();
        } catch (error) {
          if (tweetId !== DELAYED_NAVIGATION_ID && tweetId !== RAPID_CLICK_A) {
            throw error;
          }
          record.abortedAfterNavigation = true;
        } finally {
          record.routeSettledAtMonotonicMs = performance.now();
        }
        return;
      }
      if (tweetId === QUALITY_TWEET_ID) {
        assert(
          qualityApiResponses.length < MAX_QUALITY_API_RESPONSES,
          'Source-quality API observation overflow'
        );
        const record: ApiRecord = {
          tweetId,
          method: route.request().method(),
          status: 200,
          requestedAtMonotonicMs: performance.now(),
        };
        qualityApiResponses.push(record);
        const media = QUALITY_IMAGE_PATHS.map((path, index) => ({
          type: 'photo',
          id_str: `46660${index}`,
          media_url_https: `https://pbs.twimg.com/media/${path}?format=jpg&name=small`,
          original_info: { width: 480 + index * 80, height: 320 + index * 40 },
        }));
        const result = {
          __typename: 'Tweet',
          rest_id: QUALITY_TWEET_ID,
          core: {
            user_results: {
              result: { legacy: { screen_name: 'qualityuser', name: 'qualityuser' } },
            },
          },
          legacy: {
            id_str: QUALITY_TWEET_ID,
            full_text: 'Three source-quality fixtures',
            extended_entities: { media },
          },
        };
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: { tweetResult: { result } } }),
        });
        record.fulfilledAtMonotonicMs = performance.now();
        return;
      }
      if (
        tweetId === TWEET_ID &&
        options.classicTweetApi &&
        url.pathname.startsWith('/i/api/graphql/')
      ) {
        assert.equal(route.request().method(), 'GET', 'Classic fixture API must use GET');
        assert(classicApiResponses.length < 3, 'Classic fixture API observation overflow');
        const record: ApiRecord = {
          tweetId,
          method: route.request().method(),
          status: 200,
          url: url.pathname,
          requestedAtMonotonicMs: performance.now(),
          resultTypename: 'Tweet',
          rootMediaCount: QUALITY_IMAGE_PATHS.length,
        };
        classicApiResponses.push(record);
        const media = QUALITY_IMAGE_PATHS.map((path, index) => ({
          type: 'photo',
          id_str: `46662${index}`,
          media_url_https: `https://pbs.twimg.com/media/${path}?format=jpg&name=small`,
          original_info: { width: 480 + index * 80, height: 320 + index * 40 },
        }));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              tweetResult: {
                result: {
                  __typename: 'Tweet',
                  rest_id: TWEET_ID,
                  core: {
                    user_results: {
                      result: { legacy: { screen_name: 'testuser', name: 'Test User' } },
                    },
                  },
                  legacy: {
                    id_str: TWEET_ID,
                    full_text: 'Three installed-extension fixtures.',
                    extended_entities: { media },
                  },
                },
              },
            },
          }),
        });
        record.fulfilledAtMonotonicMs = performance.now();
        return;
      }
      if (tweetId === EXPERIENCE_TWEET_ID && experienceImages) {
        const media = EXPERIENCE_IMAGES.map(({ path, width, height }, index) => ({
          type: 'photo',
          id_str: `46661${index}`,
          media_url_https: `https://pbs.twimg.com/media/${path}?format=jpg&name=orig`,
          original_info: { width, height },
        }));
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              tweetResult: {
                result: {
                  __typename: 'Tweet',
                  rest_id: EXPERIENCE_TWEET_ID,
                  core: {
                    user_results: {
                      result: { legacy: { screen_name: 'experience', name: 'experience' } },
                    },
                  },
                  legacy: {
                    id_str: EXPERIENCE_TWEET_ID,
                    full_text: EXPERIENCE_CAPTION,
                    extended_entities: { media },
                  },
                },
              },
            },
          }),
        });
        return;
      }
      const quotedResponse = tweetId === undefined ? undefined : quotedVideoApiResponse(tweetId);
      if (tweetId !== undefined && quotedResponse) {
        const quotedResult = quotedResponse.data?.tweetResult?.result;
        const record: ApiRecord = {
          method: route.request().method(),
          status: 200,
          tweetId,
          url: url.pathname,
          requestedAt: new Date().toISOString(),
          requestedAtMonotonicMs: performance.now(),
          resultTypename: quotedResult?.__typename ?? null,
          rootMediaCount:
            quotedResult && 'legacy' in quotedResult
              ? quotedResult.legacy.extended_entities.media.length
              : null,
          providerErrors:
            'errors' in quotedResponse && Array.isArray(quotedResponse.errors)
              ? quotedResponse.errors.length
              : 0,
        };
        quotedApiResponses.push(record);
        if (sequenceRouteActive) {
          if (unavailableApiResponses.length < MAX_UNAVAILABLE_API_RECORDS) {
            unavailableApiResponses.push(record);
          } else {
            unavailableApiOverflow += 1;
          }
        }
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(quotedResponse),
        });
        record.fulfilledAt = new Date().toISOString();
        return;
      }
      apiResponses.push({ method: route.request().method(), status: 403, url: url.pathname });
      await route.fulfill({ status: 403, contentType: 'application/json', body: '{}' });
      return;
    }
    if (url.hostname === 'x.com' && route.request().isNavigationRequest()) {
      compactMode =
        compactImages && url.pathname === new URL(COMPACT_FIXTURE_URL).pathname
          ? url.searchParams.get('compact') === 'denied'
            ? 'denied'
            : url.searchParams.get('compact') === 'middle'
              ? 'middle'
              : 'healthy'
          : null;
      const quotedCase = QUOTED_CASES.find(
        ({ handle, outer }) => url.pathname === `/${handle}/status/${outer}`
      );
      const creditControlsRoute =
        url.pathname === `/${CREDIT_CONTROLS_CASE.handle}/status/${CREDIT_CONTROLS_CASE.outer}`;
      const unavailableRoute =
        url.pathname ===
        `/${UNAVAILABLE_SEQUENCE.handle}/status/${UNAVAILABLE_SEQUENCE.failures[0]?.outer}`;
      sequenceRouteActive = unavailableRoute;
      await route.fulfill({
        contentType: 'text/html',
        body: compactMode
          ? compactHtml.replace(
              '<div id="b-media-slot"></div>',
              `${compactMode === 'middle' ? `<div id="b-media-slot"><a href="/middle_fixture/status/${COMPACT_MIDDLE_ID}"><img src="${COMPACT_DISPLAY_URL.replaceAll('&', '&amp;')}" alt="Middle photo"></a><a id="b-overlay" href="/middle_fixture/status/${COMPACT_MIDDLE_ID}" aria-label="Open middle quote photo"></a></div>` : '<div id="b-media-slot"></div>'}<div data-testid="tweetText">B parent caption must not leak to C</div>`
            )
          : unavailableRoute
            ? unavailableHtml
            : [DELAYED_FAILURE_ID, DELAYED_NAVIGATION_ID].some(
                  (id) => url.pathname === `/delayed_host/status/${id}`
                )
              ? quotedHtml
                  .replaceAll('8111111111111111111', url.pathname.split('/').at(-1) ?? '')
                  .replaceAll('9111111111111111111', '9777777777777777777')
                  .replaceAll('/outer_one/status/', '/delayed_host/status/')
              : url.pathname === '/quote_one/status/9111111111111111111'
                ? unmarkedVideoHtml
                : url.pathname === `/rapid_a/status/${RAPID_CLICK_A}`
                  ? rapidVideoHtml
                  : creditControlsRoute
                    ? quotedHtml.replace(
                        '<body data-quote-case="recognized">',
                        `<body data-quote-case="${CREDIT_CONTROLS_CASE.route}">`
                      )
                    : quotedCase
                      ? quotedCase.name === 'public-preplayer'
                        ? preplayerHtml
                        : (quotedCase.name === 'unmarked-no-outer'
                            ? noOuterHtml
                            : quotedHtml
                          ).replace(
                            '<body data-quote-case="recognized">',
                            `<body data-quote-case="${quotedCase.route}">`
                          )
                      : url.pathname === new URL(EXPERIENCE_FIXTURE_URL).pathname &&
                          experienceImages
                        ? experienceHtml
                        : url.pathname === new URL(QUALITY_FIXTURE_URL).pathname
                          ? extensionHtml
                              .replaceAll(TWEET_ID, QUALITY_TWEET_ID)
                              .replaceAll('testuser', 'qualityuser')
                          : url.pathname === new URL(PUBLIC_FIXTURE_URL).pathname
                            ? html.replace(
                                '<body data-fixture-route="classic">',
                                '<body data-fixture-route="public">'
                              )
                            : extensionHtml,
      });
      return;
    }
    if (url.hostname === 'video.twimg.com') {
      const name = url.pathname
        .split('/')
        .at(-1)
        ?.replace(/\.mp4$/u, '');
      const payload =
        (url.pathname === own12RapidBPath ? own12RapidBPayload : null) ??
        (name === undefined ? undefined : videoPayloads[name]) ??
        (name?.startsWith('outer-') ? videoPayloads['nested-c'] : undefined);
      if (!payload) {
        await route.abort('blockedbyclient');
        return;
      }
      const range = route.request().headers().range;
      const match = range?.match(/^bytes=(\d+)-(\d*)$/u);
      const start = match ? Number(match[1]) : 0;
      const requestedEnd = match?.[2] ? Number(match[2]) : payload.length - 1;
      const end = Math.min(requestedEnd, payload.length - 1);
      if (match && (start >= payload.length || end < start)) {
        await route.fulfill({
          status: 416,
          headers: {
            'Content-Range': `bytes */${payload.length}`,
          },
        });
        return;
      }
      const selectedBytes = match ? payload.subarray(start, end + 1) : payload;
      await route.fulfill({
        status: match ? 206 : 200,
        contentType: 'video/mp4',
        body: selectedBytes,
        headers: {
          'Access-Control-Allow-Origin': 'https://x.com',
          'Access-Control-Allow-Credentials': 'true',
          'Accept-Ranges': 'bytes',
          'Content-Length': String(selectedBytes.length),
          ...(match ? { 'Content-Range': `bytes ${start}-${end}/${payload.length}` } : {}),
        },
      });
      return;
    }
    if (url.hostname === 'pbs.twimg.com') {
      const experienceIndex = EXPERIENCE_IMAGES.findIndex(
        ({ path }) => url.pathname === `/media/${path}`
      );
      if (experienceImages && experienceIndex >= 0) {
        const body = experienceImages[experienceIndex];
        assert(body, 'Experience image route is missing its exact payload');
        await route.fulfill({
          contentType: 'image/jpeg',
          body,
          headers: {
            'Access-Control-Allow-Origin': 'https://x.com',
            'Access-Control-Allow-Credentials': 'true',
          },
        });
        return;
      }
      if (compactImages && url.pathname === '/media/CompactQuoteSelected') {
        const body =
          url.searchParams.get('name') === 'orig' ? compactImages.original : compactImages.display;
        assert(compactImageRequests.length < 40, 'Compact WebP observation overflow');
        compactImageRequests.push({
          path: url.pathname,
          name: url.searchParams.get('name'),
          resourceType: route.request().resourceType(),
          ...imageReceipt(body),
        });
        await route.fulfill({
          contentType: 'image/webp',
          body,
          headers: {
            'Access-Control-Allow-Origin': 'https://x.com',
            'Access-Control-Allow-Credentials': 'true',
          },
        });
        return;
      }
      const index = imageIndex(url.href);
      const original = url.searchParams.get('name') === 'orig';
      const body = original ? images[index] : displayImages[index];
      assert(body, 'Fixture image index must resolve to a loaded image');
      if (
        url.pathname.startsWith('/media/') &&
        IMAGE_URL_MARKERS.some((marker) => url.pathname.includes(marker))
      ) {
        assert(
          qualityRequests.length < MAX_QUALITY_IMAGE_REQUESTS,
          'Source-quality request observation overflow'
        );
        qualityRequests.push({
          path: url.pathname,
          name: url.searchParams.get('name'),
          resourceType: route.request().resourceType(),
          ...imageReceipt(body),
        });
      }
      await route.fulfill({
        contentType: 'image/jpeg',
        body,
        headers: {
          'Access-Control-Allow-Origin': 'https://x.com',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
      return;
    }
    unhandledRequests.push({
      host: url.hostname,
      path: url.pathname,
      resourceType: route.request().resourceType(),
    });
    await route.abort('blockedbyclient');
  };
  await context.route('**/*', routeHandler);
  return {
    apiResponses,
    classicApiResponses,
    unhandledRequests,
    qualityApiResponses,
    quotedApiResponses,
    unavailableApiResponses,
    qualityRequests,
    compactApiResponses,
    compactImageRequests,
    getUnavailableApiOverflow: () => unavailableApiOverflow,
    videoPayloads,
    armOwn12RapidBAudioVideo() {
      assert.equal(own12RapidBPayload, null, 'OWN-12 A/V transport is already armed');
      own12RapidBPayload = own12RapidBAvPayload;
      return {
        path: own12RapidBPath,
        original: imageReceipt(videoPayloads['quote-two']!),
        audioVideo: imageReceipt(own12RapidBAvPayload),
        restored: false,
      };
    },
    clearOwn12RapidBAudioVideo() {
      own12RapidBPayload = null;
    },
    armDelayedFailure(tweetId: string, fail = false) {
      assert.equal(delayedFailureGate, null, 'Only one delayed extraction may own the gate');
      assert([DELAYED_FAILURE_ID, DELAYED_NAVIGATION_ID, RAPID_CLICK_A].includes(tweetId));
      let release = () => {};
      const promise = new Promise<void>((resolve) => {
        release = resolve;
      });
      delayedFailureGate = { tweetId, fail, promise, release };
    },
    releaseDelayedFailure() {
      delayedFailureGate?.release();
      delayedFailureGate = null;
    },
    async remove() {
      own12RapidBPayload = null;
      delayedFailureGate?.release();
      delayedFailureGate = null;
      context.off('requestfinished', delayedRequestFinished);
      context.off('requestfailed', delayedRequestFailed);
      delayedRequests.clear();
      await context.unroute('**/*', routeHandler);
    },
  };
}
