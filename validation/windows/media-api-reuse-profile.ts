// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  BrowserContext,
  CDPSession,
  ConsoleMessage,
  Page,
  Request,
  Route,
} from '@playwright/test';

type Variant =
  | 'healthy'
  | 'denied'
  | 'rate-limited'
  | 'unreadable-retry'
  | 'provider-error'
  | 'malformed'
  | 'capacity'
  | RedirectVariant
  | 'malformed-wrapper';
type Cleanup = {
  routesRemoved: boolean;
  pagesClosed: boolean;
  pageRestored: boolean;
  errors?: string[];
};
type ApiRequest = {
  variant: Variant;
  method: string;
  status: number;
  requestedAtMonotonicMs: number;
  fulfilledAtMonotonicMs?: number;
  encodedBytes?: number;
  redirectDestination?: string;
};
type ApiCase = {
  case: string;
  apiRequests?: number;
  immediateApiRequests?: number;
  afterWaitApiRequests?: number;
  elapsedMs?: number;
  index?: number;
  clickedAtMonotonicMs?: number;
  path?: string;
  original?: boolean;
  width?: number;
  height?: number;
};
type MediaEvidence = {
  status: string;
  cases: ApiCase[];
  requests: ApiRequest[];
  pageErrors: string[];
  consoleErrors: {
    variant: Variant;
    text: string;
    expected: boolean;
    pageIndex: number;
    apiLocation: boolean;
    location: ReturnType<ConsoleMessage['location']>;
    observedAtMonotonicMs: number;
  }[];
  cleanup: Cleanup;
  responseAccounting?: AccountingEvidence;
  redirectReceiverRequests?: number;
  redirectReceiverRequestsByDestination?: Record<string, number>;
  redirectCases?: {
    variant: RedirectVariant;
    status: number;
    destination: string;
    requests: number;
  }[];
  redirectFailedRequests?: {
    pageIndex: number;
    url: string;
    error: string;
    failedAtMonotonicMs: number;
  }[];
  redirectProtocol?: RedirectProtocolEvidence[];
  reuseElapsedMs?: number;
  retryAfterSeconds?: number;
  untested?: string[];
  error?: string;
};
type AccountingRecord = {
  sequence: string;
  ordinal: number;
  requestedId: string;
  step: number;
  status: number;
  fixtureResponseKind: string;
  method: string;
  requestedAtMonotonicMs: number;
  fulfilledAtMonotonicMs: number | null;
};
type AccountingCase = {
  name: string;
  expectedRequests: number;
  requestedIds: string[];
  status: string;
  actions: {
    index: number;
    requestedId: string;
    clickedAtMonotonicMs: number;
    observedAtMonotonicMs: number;
  }[];
  videoRequests: { url: string; atMonotonicMs: number }[];
  documentBefore?: { href: string; timeOrigin: number };
  documentAfter?: { href: string; timeOrigin: number };
  control?: {
    position: string | null | undefined;
    total: string | null | undefined;
    canonical: string | null | undefined;
    source: string | undefined;
    error: number | null;
  };
  actualRequests?: number;
  error?: string;
};
type AccountingEvidence = {
  status: string;
  cases: AccountingCase[];
  requests: AccountingRecord[];
  threshold: number;
  cooldownMs: number;
  settleMs: number;
  suppressedObservationMs: number;
  cleanup: { routeRemoved: boolean; pagesClosed: boolean; errors?: string[] };
  pageErrors: { sequence: string; error: string }[];
  consoleErrors: { sequence: string; text: string; expected: boolean }[];
  error?: string;
};
type AccountingState = {
  name: string;
  expectedRequests: number;
  ids: string[];
  url: string;
  videoRequests: { url: string; atMonotonicMs: number }[];
};

type RedirectProtocolEvidence = {
  pageIndex: number;
  variant: RedirectVariant;
  requests: { requestId: string; url: string; requestedAtMonotonicMs: number }[];
  hops: { requestId: string; url: string }[];
  failures: { requestId: string; error: string; failedAtMonotonicMs: number }[];
  logs: {
    requestId: string | undefined;
    source: string;
    level: string;
    text: string;
    url: string | undefined;
    observedAtMonotonicMs: number;
  }[];
  overflow: boolean;
};

const API_ROUTE = '**/TweetResultByRestId*';
const REDIRECT_RECEIVER = 'https://pbs.twimg.com/media/xeg-metadata-redirect.json';
const REDIRECT_CASES = {
  redirect: { status: 302, url: REDIRECT_RECEIVER },
  'redirect-302-api': {
    status: 302,
    url: 'https://x.com/i/api/graphql/xeg-redirect/TweetResultByRestId',
  },
  'redirect-307-api': {
    status: 307,
    url: 'https://x.com/i/api/graphql/xeg-redirect/TweetResultByRestId',
  },
  'redirect-302-non-api': { status: 302, url: 'https://x.com/xeg-metadata-redirect.json' },
  'redirect-307-non-api': { status: 307, url: 'https://x.com/xeg-metadata-redirect.json' },
  'redirect-302-foreign': {
    status: 302,
    url: 'https://xeg-metadata-redirect.invalid/metadata.json',
  },
  'redirect-307-foreign': {
    status: 307,
    url: 'https://xeg-metadata-redirect.invalid/metadata.json',
  },
} as const;
type RedirectVariant = keyof typeof REDIRECT_CASES;
const REDIRECT_RECEIVERS = [...new Set(Object.values(REDIRECT_CASES).map(({ url }) => url))];
const MAX_REDIRECT_REQUESTS = Object.keys(REDIRECT_CASES).length * 2;
function isRedirectVariant(value: Variant): value is RedirectVariant {
  return Object.hasOwn(REDIRECT_CASES, value);
}
const GALLERY = '[data-xeg-gallery-container]';
const READY = 'html[data-xeg-gallery-ready="true"]';
const MAX_OBSERVATIONS = 32;
const RETRY_AFTER_SECONDS = 3;

function targetRequestUrl(value: string, tweetId: string) {
  const url = new URL(value);
  if (url.hostname !== 'x.com' || !url.pathname.endsWith('/TweetResultByRestId')) {
    return false;
  }
  try {
    const variables: unknown = JSON.parse(url.searchParams.get('variables') ?? '{}');
    return (
      typeof variables === 'object' &&
      variables !== null &&
      'tweetId' in variables &&
      variables.tweetId === tweetId
    );
  } catch {
    return false;
  }
}

/** @testOnly Validate transport-error attribution without trusting a same-page console string. */
export function assertRedirectProtocolAttribution({
  protocol,
  consoleErrors,
  failedRequests,
  tweetId,
}: {
  protocol: RedirectProtocolEvidence;
  consoleErrors: MediaEvidence['consoleErrors'];
  failedRequests: NonNullable<MediaEvidence['redirectFailedRequests']>;
  tweetId: string;
}) {
  assert.equal(protocol.overflow, false, 'Redirect protocol observations overflowed');
  assert.equal(protocol.requests.length, 2, 'Redirect page must make two owned API requests');
  assert.deepEqual(protocol.hops, [], 'Redirected API request made an unexpected network hop');
  const ids = protocol.requests.map(({ requestId, url }) => {
    assert.equal(targetRequestUrl(url, tweetId), true, 'CDP request must be the owned API URL');
    return requestId;
  });
  assert.equal(new Set(ids).size, 2, 'Redirect CDP request IDs must be distinct');
  assert.equal(protocol.failures.length, 2, 'Both owned CDP requests must fail');
  assert.deepEqual(
    protocol.failures.map(({ requestId }) => requestId).sort(),
    [...ids].sort(),
    'CDP failures must match the exact owned API request IDs'
  );
  for (const failure of protocol.failures) {
    const request = protocol.requests.find(({ requestId }) => requestId === failure.requestId);
    assert(request);
    assert.match(failure.error, /^net::ERR_(?:FAILED|UNSAFE_REDIRECT)$/u);
    assert(
      failure.failedAtMonotonicMs >= request.requestedAtMonotonicMs &&
        failure.failedAtMonotonicMs - request.requestedAtMonotonicMs < 15_000,
      'CDP request failure fell outside its bounded request window'
    );
  }
  assert.equal(protocol.logs.length, 2, 'Both owned CDP failures must have network logs');
  assert.deepEqual(
    protocol.logs.map(({ requestId }) => requestId).sort(),
    [...ids].sort(),
    'Network logs must identify the exact failed API request IDs'
  );
  for (const log of protocol.logs) {
    assert.equal(log.source, 'network');
    assert.equal(log.level, 'error');
    assert.match(log.text, /^Failed to load resource: net::ERR_(?:FAILED|UNSAFE_REDIRECT)$/u);
    const failure = protocol.failures.find(({ requestId }) => requestId === log.requestId);
    assert(failure);
    assert.equal(log.text.slice('Failed to load resource: '.length), failure.error);
  }
  const pageFailures = failedRequests.filter(({ pageIndex }) => pageIndex === protocol.pageIndex);
  assert.equal(pageFailures.length, 2, 'Both owned Playwright requests must fail');
  assert(pageFailures.every(({ url }) => targetRequestUrl(url, tweetId)));
  assert.deepEqual(
    pageFailures.map(({ error }) => error).sort(),
    protocol.failures.map(({ error }) => error).sort(),
    'Playwright and CDP failures must agree on this page'
  );
  const pageConsole = consoleErrors.filter(({ pageIndex }) => pageIndex === protocol.pageIndex);
  assert.equal(pageConsole.length, 2, 'Both owned failures must have public console records');
  assert(pageConsole.every(({ variant }) => variant === protocol.variant));
  const unmatchedLogs = [...protocol.logs];
  for (const observed of pageConsole) {
    const index = unmatchedLogs.findIndex(
      (log) =>
        typeof log.url === 'string' &&
        log.url.length > 0 &&
        log.url === observed.location.url &&
        log.text === observed.text &&
        Math.abs(log.observedAtMonotonicMs - observed.observedAtMonotonicMs) < 5_000
    );
    assert(index >= 0, 'Public console error must match one owned CDP network log');
    unmatchedLogs.splice(index, 1);
  }
  assert.equal(unmatchedLogs.length, 0);
  return pageConsole;
}

function targetRequest(route: Route, tweetId: string) {
  return targetRequestUrl(route.request().url(), tweetId);
}

async function readyPage(page: Page, url: string) {
  await page.goto(url);
  await page.locator(READY).waitFor({ state: 'attached', timeout: 15_000 });
}

async function openAndClose(
  page: Page,
  index: number,
  imagePaths: string[],
  expectedUrl: string,
  original: boolean,
  verifyOrigin = true
) {
  const trigger = page
    .locator('[data-route="classic"][data-phase="normal"] [data-testid="tweetPhoto"] img')
    .nth(index);
  assert.equal(await trigger.count(), 1, 'Expected quality fixture photo is missing');
  const clickedAtMonotonicMs = performance.now();
  await trigger.click();
  const gallery = page.locator(GALLERY);
  await gallery.waitFor({ state: 'visible', timeout: 15_000 });
  const selection = await page
    .waitForFunction(
      ({ index: selectedIndex }) => {
        const root = document.querySelector('[data-xeg-gallery-container]');
        const toolbar = root?.querySelector('[data-gallery-element="toolbar"]');
        const counter = toolbar?.querySelector('#xeg-toolbar-counter');
        const item = root?.querySelector(
          `[data-gallery-element="item"][data-index="${selectedIndex}"]`
        );
        const image = item?.querySelector('img');
        if (
          counter?.getAttribute('data-position') !== String(selectedIndex + 1) ||
          counter?.getAttribute('data-total') !== '3' ||
          counter?.getAttribute('data-focused-index') !== String(selectedIndex) ||
          toolbar?.getAttribute('data-current-index') !== String(selectedIndex) ||
          toolbar?.getAttribute('data-focused-index') !== String(selectedIndex) ||
          !(image instanceof HTMLImageElement) ||
          !image.complete ||
          image.naturalWidth === 0 ||
          item?.getAttribute('data-media-loaded') !== 'true'
        ) {
          return false;
        }
        return {
          source: image.currentSrc || image.src,
          width: image.naturalWidth,
          height: image.naturalHeight,
        };
      },
      { index },
      { timeout: 15_000 }
    )
    .then((handle) => handle.jsonValue());
  assert(selection && typeof selection === 'object', 'Selected quality photo did not become ready');
  const source = new URL(selection.source);
  assert.equal(source.hostname, 'pbs.twimg.com');
  assert.equal(
    source.pathname,
    `/media/${imagePaths[index]}`,
    'Selected photo belongs to another attachment'
  );
  assert.equal(
    source.searchParams.get('format'),
    'jpg',
    'Selected fixture photo has an unexpected file format'
  );
  if (original) {
    assert.equal(
      source.searchParams.get('name'),
      'orig',
      'Healthy API selection must use its original photo'
    );
    assert.equal(selection.width, 480 + index * 80);
    assert.equal(selection.height, 320 + index * 40);
  }
  if (verifyOrigin) {
    const sourceButton = gallery.locator('#tweet-text-button');
    assert.equal(await sourceButton.count(), 1);
    await sourceButton.click();
    const origin = gallery.locator('#toolbar-tweet-panel a[href^="https://x.com/"]');
    await origin.waitFor({ state: 'visible' });
    assert.equal(
      await origin.getAttribute('href'),
      expectedUrl,
      'Selected attachment has the wrong originating post'
    );
    await sourceButton.click();
  }
  await page.keyboard.press('Escape');
  await gallery.waitFor({ state: 'detached', timeout: 15_000 });
  return {
    index,
    clickedAtMonotonicMs,
    path: source.pathname,
    original: source.searchParams.get('name') === 'orig',
    width: selection.width,
    height: selection.height,
  };
}

/**
 * Optional native installed-extension acceptance, called after installFixtureRoutes.
 * The caller owns the installed context, extension and three-photo quality fixture.
 * This helper intercepts only the fixture's API requests and owns its new pages.
 */
export async function runInstalledMediaApiReuseProfile({
  context,
  page,
  qualityFixtureUrl,
  qualityTweetId,
  qualityImagePaths,
  output,
  videoPayloads,
}: {
  context: BrowserContext;
  page: Page;
  qualityFixtureUrl: string;
  qualityTweetId: string;
  qualityImagePaths: string[];
  output: string;
  videoPayloads: Record<string, Buffer>;
}) {
  assert(context && page, 'Installed browser context and page are required');
  assert.equal(qualityImagePaths?.length, 3, 'Three quality fixture paths are required');
  assert.equal(
    new URL(qualityFixtureUrl).pathname,
    `/qualityuser/status/${qualityTweetId}`,
    'Expected installed quality fixture route'
  );

  const requests: ApiRequest[] = [];
  const ownedPages: Page[] = [];
  const observedPages: {
    page: Page;
    onPageError: (error: Error) => void;
    onConsole: (message: ConsoleMessage) => void;
    onRequestFailed: (request: Request) => void;
    protocol?: CDPSession;
    removeProtocolHandlers?: () => void;
  }[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: MediaEvidence['consoleErrors'] = [];
  let errorOverflow = false;
  let activePage = page;
  const originalPageUrl = page.url();
  let variant: Variant = 'healthy';
  let redirectReceiverRequests = 0;
  const redirectReceiverRequestsByDestination = Object.fromEntries(
    REDIRECT_RECEIVERS.map((url) => [url, 0])
  );
  const redirectFailedRequests: NonNullable<MediaEvidence['redirectFailedRequests']> = [];
  const redirectProtocol: RedirectProtocolEvidence[] = [];
  const redirectReceiver = async (route: Route) => {
    redirectReceiverRequests += 1;
    const destination = route.request().url();
    assert(Object.hasOwn(redirectReceiverRequestsByDestination, destination));
    const previous = redirectReceiverRequestsByDestination[destination];
    assert(previous !== undefined);
    redirectReceiverRequestsByDestination[destination] = previous + 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  };
  const routeHandler = async (route: Route) => {
    if (!targetRequest(route, qualityTweetId)) {
      return route.fallback();
    }
    assert(requests.length < MAX_OBSERVATIONS, 'API reuse observation overflow');
    const statuses: Record<Exclude<Variant, RedirectVariant>, number> = {
      healthy: 200,
      denied: 403,
      'rate-limited': 429,
      'unreadable-retry': 503,
      'provider-error': 200,
      malformed: 200,
      capacity: 200,
      'malformed-wrapper': 200,
    };
    const record: ApiRequest = {
      variant,
      method: route.request().method(),
      status: isRedirectVariant(variant) ? REDIRECT_CASES[variant].status : statuses[variant],
      requestedAtMonotonicMs: performance.now(),
    };
    requests.push(record);
    assert.equal(record.method, 'GET');
    if (variant === 'healthy') {
      return route.fallback();
    }
    if (variant === 'denied') {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        headers: { 'Retry-After': String(RETRY_AFTER_SECONDS) },
        body: '{}',
      });
    } else if (variant === 'rate-limited') {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: { 'Retry-After': String(RETRY_AFTER_SECONDS) },
        body: '{}',
      });
    } else if (variant === 'unreadable-retry') {
      // The installed MV3 adapter retains 503 and Retry-After on JSON body-read failure.
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        headers: { 'Retry-After': String(RETRY_AFTER_SECONDS) },
        body: '{',
      });
    } else if (variant === 'provider-error') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ errors: [{ code: 88, message: 'fixture provider error' }] }),
      });
    } else if (variant === 'capacity') {
      // A small, finite boundary fixture; no exhaustion or native-memory claim.
      const body = JSON.stringify({ padding: 'x'.repeat(2 * 1024 * 1024) });
      record.encodedBytes = Buffer.byteLength(body);
      await route.fulfill({ status: 200, contentType: 'application/json', body });
    } else if (isRedirectVariant(variant)) {
      const controlled = REDIRECT_CASES[variant];
      record.redirectDestination = controlled.url;
      await route.fulfill({
        status: controlled.status,
        headers: { location: controlled.url },
        body: '',
      });
    } else if (variant === 'malformed') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    } else if (variant === 'malformed-wrapper') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            tweetResult: {
              result: {
                __typename: 'UnexpectedFixtureWrapper',
                tweet: { __typename: 'Tweet' },
              },
            },
          },
        }),
      });
    } else {
      throw new Error('Unknown API reuse fixture variant');
    }
    record.fulfilledAtMonotonicMs = performance.now();
  };
  const observePage = async (observed: Page) => {
    const observedVariant = variant;
    const pageIndex = observedPages.length;
    const onPageError = (error: Error) => {
      if (pageErrors.length < MAX_OBSERVATIONS) {
        pageErrors.push(error.message.slice(0, 500));
      } else {
        errorOverflow = true;
      }
    };
    const onConsole = (message: ConsoleMessage) => {
      if (message.type() !== 'error') {
        return;
      }
      let apiLocation = false;
      try {
        const url = new URL(message.location().url);
        apiLocation =
          url.hostname === 'x.com' &&
          url.pathname.endsWith('/TweetResultByRestId') &&
          JSON.parse(url.searchParams.get('variables') ?? '{}').tweetId === qualityTweetId;
      } catch {
        /* A missing location cannot identify an expected transport error. */
      }
      const text = message.text().slice(0, 500);
      const status =
        /Failed to load resource: the server responded with a status of (403|429|503)(?:\D|$)/u.exec(
          text
        )?.[1];
      const expected =
        apiLocation &&
        status !== undefined &&
        requests.some(
          (request) => request.variant === observedVariant && request.status === Number(status)
        );
      if (consoleErrors.length < MAX_OBSERVATIONS) {
        consoleErrors.push({
          variant: observedVariant,
          text,
          expected,
          pageIndex,
          apiLocation,
          location: message.location(),
          observedAtMonotonicMs: performance.now(),
        });
      } else {
        errorOverflow = true;
      }
    };
    const onRequestFailed = (request: Request) => {
      if (!isRedirectVariant(observedVariant)) {
        return;
      }
      if (!targetRequestUrl(request.url(), qualityTweetId)) {
        return;
      }
      if (redirectFailedRequests.length < MAX_REDIRECT_REQUESTS) {
        redirectFailedRequests.push({
          pageIndex,
          url: request.url(),
          error: request.failure()?.errorText ?? 'missing-failure',
          failedAtMonotonicMs: performance.now(),
        });
      } else {
        errorOverflow = true;
      }
    };
    observed.on('pageerror', onPageError);
    observed.on('console', onConsole);
    observed.on('requestfailed', onRequestFailed);
    const observer: (typeof observedPages)[number] = {
      page: observed,
      onPageError,
      onConsole,
      onRequestFailed,
    };
    observedPages.push(observer);
    if (!isRedirectVariant(observedVariant)) {
      return;
    }
    const protocol = await context.newCDPSession(observed);
    observer.protocol = protocol;
    const record: RedirectProtocolEvidence = {
      pageIndex,
      variant: observedVariant,
      requests: [],
      hops: [],
      failures: [],
      logs: [],
      overflow: false,
    };
    redirectProtocol.push(record);
    const knownIds = new Set<string>();
    const onRequestWillBeSent = (event: {
      requestId: string;
      request: { url: string };
      redirectResponse?: object;
    }) => {
      if (
        knownIds.has(event.requestId) ||
        REDIRECT_RECEIVERS.some((receiver) => receiver === event.request.url)
      ) {
        if (record.hops.length < MAX_OBSERVATIONS) {
          record.hops.push({ requestId: event.requestId, url: event.request.url });
        } else {
          record.overflow = true;
        }
      } else if (targetRequestUrl(event.request.url, qualityTweetId)) {
        if (record.requests.length < MAX_OBSERVATIONS) {
          knownIds.add(event.requestId);
          record.requests.push({
            requestId: event.requestId,
            url: event.request.url,
            requestedAtMonotonicMs: performance.now(),
          });
          if (event.redirectResponse) {
            record.hops.push({ requestId: event.requestId, url: event.request.url });
          }
        } else {
          record.overflow = true;
        }
      }
    };
    const onLoadingFailed = (event: { requestId: string; errorText: string }) => {
      if (!knownIds.has(event.requestId)) {
        return;
      }
      if (record.failures.length < MAX_OBSERVATIONS) {
        record.failures.push({
          requestId: event.requestId,
          error: event.errorText,
          failedAtMonotonicMs: performance.now(),
        });
      } else {
        record.overflow = true;
      }
    };
    const onLogEntryAdded = (event: {
      entry: {
        networkRequestId?: string;
        source: string;
        level: string;
        text: string;
        url?: string;
      };
    }) => {
      const { entry } = event;
      if (entry.source !== 'network' || entry.level !== 'error') {
        return;
      }
      if (record.logs.length < MAX_OBSERVATIONS) {
        record.logs.push({
          requestId: entry.networkRequestId,
          source: entry.source,
          level: entry.level,
          text: entry.text.slice(0, 500),
          url: entry.url,
          observedAtMonotonicMs: performance.now(),
        });
      } else {
        record.overflow = true;
      }
    };
    protocol.on('Network.requestWillBeSent', onRequestWillBeSent);
    protocol.on('Network.loadingFailed', onLoadingFailed);
    protocol.on('Log.entryAdded', onLogEntryAdded);
    observer.removeProtocolHandlers = () => {
      protocol.off('Network.requestWillBeSent', onRequestWillBeSent);
      protocol.off('Network.loadingFailed', onLoadingFailed);
      protocol.off('Log.entryAdded', onLogEntryAdded);
    };
    await protocol.send('Network.enable');
    await protocol.send('Log.clear');
    await protocol.send('Log.enable');
  };
  const count = (name: Variant) => requests.filter((request) => request.variant === name).length;
  const newFixturePage = async (url = qualityFixtureUrl) => {
    const owned = await context.newPage();
    ownedPages.push(owned);
    await observePage(owned);
    activePage = owned;
    await readyPage(owned, url);
    return owned;
  };
  const cases: ApiCase[] = [];
  const evidence: MediaEvidence = {
    status: 'running',
    cases,
    requests,
    pageErrors,
    consoleErrors,
    redirectFailedRequests,
    redirectProtocol,
    redirectReceiverRequestsByDestination,
    cleanup: { routesRemoved: false, pagesClosed: false, pageRestored: false },
  };
  let primaryError: unknown;
  let caughtPrimaryError = false;
  const cleanupErrors: unknown[] = [];

  try {
    await observePage(page);
    await context.route(API_ROUTE, routeHandler);
    for (const receiver of REDIRECT_RECEIVERS) {
      await context.route(receiver, redirectReceiver);
    }
    await readyPage(page, qualityFixtureUrl);
    const reuseStarted = performance.now();
    for (const index of [1, 2]) {
      const selection = await openAndClose(page, index, qualityImagePaths, qualityFixtureUrl, true);
      assert.equal(
        count('healthy'),
        1,
        'Different attachments reopened within the reuse window must share one API request'
      );
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
      ['denied', 2],
      ['rate-limited', 1],
      ['unreadable-retry', 1],
      ['provider-error', 2],
      ['malformed', 2],
      ['malformed-wrapper', 2],
      ['capacity', 2],
      ['redirect', 2],
      ['redirect-302-api', 2],
      ['redirect-307-api', 2],
      ['redirect-302-non-api', 2],
      ['redirect-307-non-api', 2],
      ['redirect-302-foreign', 2],
      ['redirect-307-foreign', 2],
    ] satisfies [Variant, number][]) {
      variant = name;
      const failurePage = await newFixturePage();
      const started = performance.now();
      await openAndClose(failurePage, 1, qualityImagePaths, qualityFixtureUrl, false, false);
      assert.equal(count(name), 1, `${name} must first make one API request`);
      const second = await openAndClose(
        failurePage,
        2,
        qualityImagePaths,
        qualityFixtureUrl,
        false,
        false
      );
      const elapsedMs = performance.now() - started;
      if (expectedRequests === 1) {
        const firstFulfilled = requests.find(
          (request) => request.variant === name
        )?.fulfilledAtMonotonicMs;
        assert(
          firstFulfilled !== undefined &&
            second.clickedAtMonotonicMs - firstFulfilled < RETRY_AFTER_SECONDS * 1_000,
          `${name} second click missed the bounded Retry-After window`
        );
      }
      assert.equal(
        count(name),
        expectedRequests,
        `${name} made an unexpected number of physical API requests`
      );
      const immediateApiRequests = count(name);
      if (expectedRequests === 1) {
        const firstRequest = requests.find((request) => request.variant === name);
        assert(firstRequest);
        const firstFulfilled = firstRequest.fulfilledAtMonotonicMs;
        assert(firstFulfilled !== undefined);
        const remainingMs = Math.max(
          0,
          firstFulfilled + RETRY_AFTER_SECONDS * 1_000 + 100 - performance.now()
        );
        if (remainingMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, remainingMs));
        }
        await openAndClose(failurePage, 0, qualityImagePaths, qualityFixtureUrl, false, false);
        assert.equal(count(name), 2, `${name} must retry after the server wait`);
      }
      cases.push({
        case: name,
        immediateApiRequests,
        afterWaitApiRequests: count(name),
        elapsedMs,
      });
    }
    assert.equal(errorOverflow, false, 'API reuse error observations overflowed');
    assert.equal(
      redirectReceiverRequests,
      0,
      'Installed fetch must not follow the controlled redirect'
    );
    evidence.redirectReceiverRequests = redirectReceiverRequests;
    assert.deepEqual(
      redirectReceiverRequestsByDestination,
      Object.fromEntries(REDIRECT_RECEIVERS.map((url) => [url, 0])),
      'No allowed, non-API or foreign destination may receive a redirected request'
    );
    evidence.redirectReceiverRequestsByDestination = redirectReceiverRequestsByDestination;
    evidence.redirectCases = [];
    for (const request of requests) {
      if (!isRedirectVariant(request.variant)) {
        continue;
      }
      const controlled = REDIRECT_CASES[request.variant];
      assert.equal(request.status, controlled.status);
      assert.equal(request.redirectDestination, controlled.url);
      if (!evidence.redirectCases.some(({ variant }) => variant === request.variant)) {
        assert.equal(count(request.variant), 2);
        evidence.redirectCases.push({
          variant: request.variant,
          status: controlled.status,
          destination: controlled.url,
          requests: count(request.variant),
        });
      }
    }
    assert.equal(evidence.redirectCases.length, Object.keys(REDIRECT_CASES).length);
    assert.equal(
      redirectFailedRequests.length,
      MAX_REDIRECT_REQUESTS,
      'Every redirected API fetch must fail'
    );
    const redirectRequests = requests.filter((request) => isRedirectVariant(request.variant));
    assert.equal(redirectRequests.length, MAX_REDIRECT_REQUESTS);
    assert(
      redirectFailedRequests.every(
        ({ error, failedAtMonotonicMs }, index) =>
          /net::ERR_(?:FAILED|UNSAFE_REDIRECT)/u.test(error) &&
          failedAtMonotonicMs >= (redirectRequests[index]?.requestedAtMonotonicMs ?? Infinity) &&
          failedAtMonotonicMs - (redirectRequests[index]?.requestedAtMonotonicMs ?? 0) < 15_000
      ),
      'Redirected API fetches failed for another reason or outside the bounded request window'
    );
    const redirectConsoleErrors = consoleErrors.filter(({ variant }) => isRedirectVariant(variant));
    assert.equal(
      redirectConsoleErrors.length,
      MAX_REDIRECT_REQUESTS,
      'Every redirect failure must have a console record'
    );
    assert.equal(
      redirectProtocol.length,
      Object.keys(REDIRECT_CASES).length,
      'Every redirect page must have its own CDP observer'
    );
    const attributed = redirectProtocol.flatMap((protocol) =>
      assertRedirectProtocolAttribution({
        protocol,
        consoleErrors: redirectConsoleErrors,
        failedRequests: redirectFailedRequests,
        tweetId: qualityTweetId,
      })
    );
    assert.equal(
      attributed.length,
      MAX_REDIRECT_REQUESTS,
      'Every redirect console error must belong to one owned CDP request'
    );
    for (const record of attributed) {
      record.expected = true;
    }
    assert.deepEqual(pageErrors, [], 'API reuse pages raised unexpected script errors');
    assert.deepEqual(
      consoleErrors.filter((record) => !record.expected),
      [],
      'API reuse pages logged errors beyond their exact controlled HTTP failures'
    );
    evidence.responseAccounting = await runResponseAccountingCases({
      context,
      output,
      videoPayloads,
    });
    Object.assign(evidence, {
      status: 'passed',
      reuseElapsedMs,
      retryAfterSeconds: RETRY_AFTER_SECONDS,
      untested: ['HLS-only media requires a video fixture'],
    });
  } catch (error) {
    caughtPrimaryError = true;
    primaryError = error;
    evidence.status = 'failed';
    evidence.error = error instanceof Error ? error.message : String(error);
    if (output && !activePage.isClosed()) {
      await activePage
        .screenshot({ path: join(output, 'api-reuse-failure.png'), fullPage: true })
        .catch(() => {});
    }
  } finally {
    try {
      await context.unroute(API_ROUTE, routeHandler);
      for (const receiver of REDIRECT_RECEIVERS) {
        await context.unroute(receiver, redirectReceiver);
      }
      evidence.cleanup.routesRemoved = true;
    } catch (error) {
      cleanupErrors.push(error);
    }
    for (const observed of observedPages) {
      observed.page.off('pageerror', observed.onPageError);
      observed.page.off('console', observed.onConsole);
      observed.page.off('requestfailed', observed.onRequestFailed);
      try {
        observed.removeProtocolHandlers?.();
      } catch (error) {
        cleanupErrors.push(error);
      }
      if (observed.protocol) {
        const disabled = await Promise.allSettled([
          observed.protocol.send('Log.disable'),
          observed.protocol.send('Network.disable'),
        ]);
        for (const result of disabled) {
          if (result.status === 'rejected') {
            cleanupErrors.push(result.reason);
          }
        }
        try {
          await observed.protocol.detach();
        } catch (error) {
          cleanupErrors.push(error);
        }
      }
    }
    const pageCleanup = await Promise.allSettled(ownedPages.map((owned) => owned.close()));
    evidence.cleanup.pagesClosed = pageCleanup.every((result) => result.status === 'fulfilled');
    for (const result of pageCleanup) {
      if (result.status === 'rejected') {
        cleanupErrors.push(result.reason);
      }
    }
    try {
      if (!page.isClosed() && (await page.locator(GALLERY).count())) {
        await page.keyboard.press('Escape');
      }
      if (!page.isClosed() && originalPageUrl !== page.url()) {
        await page.goto(originalPageUrl);
      }
      evidence.cleanup.pageRestored = !page.isClosed() && page.url() === originalPageUrl;
    } catch (error) {
      cleanupErrors.push(error);
    }
    if (cleanupErrors.length > 0) {
      evidence.status = 'failed';
    }
    evidence.cleanup.errors = cleanupErrors.map((error) =>
      error instanceof Error ? error.message : String(error)
    );
    if (output) {
      await writeFile(
        join(output, 'api-reuse-observations.json'),
        JSON.stringify(evidence, null, 2)
      );
    }
  }
  if (cleanupErrors.length > 0) {
    throw new AggregateError(
      caughtPrimaryError ? [primaryError, ...cleanupErrors] : cleanupErrors,
      'Installed API reuse cleanup failed'
    );
  }
  if (caughtPrimaryError) {
    throw primaryError;
  }
  return evidence;
}

const ACCOUNTING_SETTLE_MS = 500;
const SUPPRESSED_OBSERVATION_MS = 750;
const ACCOUNTING_POSTER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl4bRkAAAAASUVORK5CYII=',
  'base64'
);

function accountingPoster(id: string) {
  return `https://pbs.twimg.com/ext_tw_video_thumb/${id}/pu/img/contract.png`;
}

function accountingVideo(id: string) {
  return `https://video.twimg.com/ext_tw_video/${id}/pu/vid/320x180/contract.mp4`;
}

function accountingResponse(id: string, mediaId = id) {
  return {
    data: {
      tweetResult: {
        result: {
          __typename: 'Tweet',
          rest_id: id,
          core: {
            user_results: {
              result: {
                rest_id: id,
                legacy: { screen_name: 'contractseq', name: 'Contract sequence' },
              },
            },
          },
          legacy: {
            id_str: id,
            full_text: 'Bounded response accounting control',
            extended_entities: {
              media: [
                {
                  type: 'video',
                  id_str: mediaId,
                  media_key: `7_${mediaId}`,
                  media_url_https: accountingPoster(mediaId),
                  original_info: { width: 320, height: 180 },
                  video_info: {
                    aspect_ratio: [16, 9],
                    variants: [
                      { content_type: 'video/mp4', bitrate: 256000, url: accountingVideo(mediaId) },
                    ],
                  },
                },
              ],
            },
          },
        },
      },
    },
  };
}

function accountingHtml(ids: string[]) {
  return `<!doctype html><html lang="en"><meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>API response accounting fixture</title><style>
    body{margin:0;padding:20px;background:#000;color:#fff;font:16px Segoe UI,sans-serif}
    article{width:320px;margin:24px}.player{width:320px;height:180px}
    img{width:320px;height:180px}video{display:none}</style><body>
    ${ids
      .map(
        (id, index) => `<article data-testid="tweet" data-contract-step="${index}">
      <a href="/contractseq/status/${id}"><time>Contract step ${index + 1}</time></a>
      <div data-testid="tweetText">Bounded contract fixture</div>
      <div data-testid="videoPlayer" class="player">
        <div data-testid="previewInterstitial"><img tabindex="0" data-contract-trigger="${index}"
          src="${accountingPoster(id)}" alt="Controlled video preview ${index + 1}"></div>
        <video controls poster="${accountingPoster(id)}"></video>
      </div></article>`
      )
      .join('')}
    </body></html>`;
}

/** Real installed extension requests in one document per sequence; no app state injection. */
async function runResponseAccountingCases({
  context,
  output,
  videoPayloads,
}: {
  context: BrowserContext;
  output: string;
  videoPayloads: Record<string, Buffer>;
}) {
  const valid = videoPayloads?.['quote-one'];
  assert(
    Buffer.isBuffer(valid) && valid.length > 0 && valid.length <= 256 * 1024,
    'A bounded declared MP4 control is required for API accounting'
  );
  const descriptions = [
    { name: 'foreign-root', expectedRequests: 3 },
    { name: '503-503-foreign', expectedRequests: 3 },
    { name: 'missing-envelope', expectedRequests: 3 },
    { name: 'healthy-unavailable', expectedRequests: 4 },
    { name: 'healthy-local-mismatch-after-503', expectedRequests: 4 },
  ];
  const records: AccountingRecord[] = [];
  const cases: AccountingCase[] = [];
  const evidence: AccountingEvidence = {
    status: 'running',
    cases,
    requests: records,
    threshold: 3,
    cooldownMs: 60_000,
    settleMs: ACCOUNTING_SETTLE_MS,
    suppressedObservationMs: SUPPRESSED_OBSERVATION_MS,
    cleanup: { routeRemoved: false, pagesClosed: false },
    pageErrors: [],
    consoleErrors: [],
  };
  const ownedPages: Page[] = [];
  let active: AccountingState | undefined;
  let primaryError: unknown;
  let caughtPrimaryError = false;
  const errors: unknown[] = [];
  const routeHandler = async (route: Route) => {
    if (!active) {
      return route.fallback();
    }
    const target = new URL(route.request().url());
    if (route.request().isNavigationRequest() && target.href === active.url) {
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: accountingHtml(active.ids),
      });
    }
    if (
      target.hostname === 'pbs.twimg.com' &&
      active.ids.some((id) => target.href === accountingPoster(id))
    ) {
      return route.fulfill({ status: 200, contentType: 'image/png', body: ACCOUNTING_POSTER });
    }
    if (
      target.hostname === 'video.twimg.com' &&
      active.ids.some((id) => target.href === accountingVideo(id))
    ) {
      active.videoRequests.push({ url: target.href, atMonotonicMs: performance.now() });
      return route.fulfill({ status: 200, contentType: 'video/mp4', body: valid });
    }
    if (target.hostname !== 'x.com' || !target.pathname.endsWith('/TweetResultByRestId')) {
      return route.fallback();
    }
    let id: string | undefined;
    try {
      const variables: unknown = JSON.parse(target.searchParams.get('variables') ?? '{}');
      if (
        typeof variables === 'object' &&
        variables !== null &&
        'tweetId' in variables &&
        typeof variables.tweetId === 'string'
      ) {
        id = variables.tweetId;
      }
    } catch {
      return route.fallback();
    }
    if (!id) {
      return route.fallback();
    }
    const step = active.ids.indexOf(id);
    if (step < 0) {
      return route.fallback();
    }
    assert(records.length < MAX_OBSERVATIONS, 'API accounting record cap exceeded');
    let status = 200;
    let response: unknown;
    let classification: string;
    if (step === 3) {
      response = accountingResponse(id);
      classification = 'valid-owner-control';
    } else if (active.name === 'healthy-unavailable') {
      response = {
        data: {
          tweetResult: {
            result: {
              __typename: step === 1 ? 'TweetTombstone' : 'TweetUnavailable',
              rest_id: id,
            },
          },
        },
      };
      classification = 'supported-unavailable';
    } else if (active.name === 'missing-envelope') {
      response = {};
      classification = 'missing-response-envelope';
    } else if (
      (active.name === '503-503-foreign' || active.name === 'healthy-local-mismatch-after-503') &&
      step < 2
    ) {
      status = 503;
      response = {};
      classification = 'controlled-http-503';
    } else if (active.name === 'healthy-local-mismatch-after-503') {
      response = accountingResponse(id, '4999000111222333444');
      classification = 'valid-owner-local-source-mismatch';
    } else {
      response = {
        data: { tweetResult: { result: { __typename: 'Tweet', rest_id: '4999999999999999999' } } },
      };
      classification = 'foreign-root';
    }
    const record: AccountingRecord = {
      sequence: active.name,
      ordinal: records.length + 1,
      requestedId: id,
      step,
      status,
      fixtureResponseKind: classification,
      method: route.request().method(),
      requestedAtMonotonicMs: performance.now(),
      fulfilledAtMonotonicMs: null,
    };
    assert.equal(record.method, 'GET');
    records.push(record);
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
    record.fulfilledAtMonotonicMs = performance.now();
  };
  await context.route('**/*', routeHandler);
  try {
    for (const [sequenceIndex, descriptor] of descriptions.entries()) {
      const ids = Array.from(
        { length: 4 },
        (_, index) =>
          `47770001112223${String(sequenceIndex).padStart(2, '0')}${String(index + 1).padStart(3, '0')}`
      );
      const state: AccountingState = {
        ...descriptor,
        ids,
        url: `https://x.com/contractseq/status/${ids[0]}`,
        videoRequests: [],
      };
      active = state;
      const owned = await context.newPage();
      ownedPages.push(owned);
      const pageError = (error: Error) => {
        assert(evidence.pageErrors.length < MAX_OBSERVATIONS);
        evidence.pageErrors.push({ sequence: state.name, error: error.message.slice(0, 500) });
      };
      const consoleError = (message: ConsoleMessage) => {
        if (message.type() !== 'error') {
          return;
        }
        assert(evidence.consoleErrors.length < MAX_OBSERVATIONS);
        const text = message.text().slice(0, 500);
        let id: string | undefined;
        try {
          const location = new URL(message.location().url);
          if (location.hostname === 'x.com' && location.pathname.endsWith('/TweetResultByRestId')) {
            const variables: unknown = JSON.parse(location.searchParams.get('variables') ?? '{}');
            if (
              typeof variables === 'object' &&
              variables !== null &&
              'tweetId' in variables &&
              typeof variables.tweetId === 'string'
            ) {
              id = variables.tweetId;
            }
          }
        } catch {
          /* Unknown locations cannot establish an expected error. */
        }
        evidence.consoleErrors.push({
          sequence: state.name,
          text,
          expected:
            id !== undefined &&
            state.ids.includes(id) &&
            /status of 503(?:\D|$)/u.test(text) &&
            records.some((record) => record.requestedId === id && record.status === 503),
        });
      };
      owned.on('pageerror', pageError);
      owned.on('console', consoleError);
      const observed: AccountingCase = {
        name: state.name,
        expectedRequests: state.expectedRequests,
        requestedIds: ids,
        status: 'running',
        actions: [],
        videoRequests: state.videoRequests,
      };
      cases.push(observed);
      try {
        await readyPage(owned, state.url);
        const controlId = ids[3];
        assert(controlId);
        observed.documentBefore = await owned.evaluate(() => ({
          href: location.href,
          timeOrigin: performance.timeOrigin,
        }));
        for (let index = 0; index < 4; index++) {
          const clickedAtMonotonicMs = performance.now();
          await owned.locator(`[data-contract-trigger="${index}"]`).click();
          if (index < 3) {
            const deadline = performance.now() + 5_000;
            while (
              !records.some(
                (record) =>
                  record.sequence === state.name &&
                  record.requestedId === ids[index] &&
                  record.fulfilledAtMonotonicMs !== null
              )
            ) {
              assert(
                performance.now() < deadline,
                'A required physical API response did not complete'
              );
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
            await owned.waitForTimeout(ACCOUNTING_SETTLE_MS);
            assert.equal(
              await owned.locator(GALLERY).count(),
              0,
              'Rejected or unavailable response must not open unrelated media'
            );
          } else if (state.expectedRequests === 4) {
            await owned.locator(GALLERY).waitFor({ state: 'visible', timeout: 15_000 });
            await owned.waitForFunction(
              (expected) => {
                const item = document.querySelector(
                  '[data-xeg-gallery-container] [data-gallery-element="item"][data-index="0"]'
                );
                const video = item?.querySelector('video');
                return (
                  video instanceof HTMLVideoElement &&
                  video.readyState >= 1 &&
                  video.videoWidth === 320 &&
                  video.videoHeight === 180 &&
                  !video.error &&
                  video.currentSrc === expected
                );
              },
              accountingVideo(controlId),
              { timeout: 15_000 }
            );
            const gallery = owned.locator(GALLERY);
            observed.control = await owned.evaluate(() => {
              const root = document.querySelector('[data-xeg-gallery-container]');
              const counter = root?.querySelector('#xeg-toolbar-counter');
              const item = root?.querySelector('[data-gallery-element="item"][data-index="0"]');
              const video = item?.querySelector('video');
              return {
                position: counter?.getAttribute('data-position'),
                total: counter?.getAttribute('data-total'),
                canonical: item?.getAttribute('data-media-display-url'),
                source: video?.currentSrc,
                error: video?.error?.code ?? null,
              };
            });
            assert.equal(observed.control.position, '1');
            assert.equal(observed.control.total, '1');
            assert.equal(observed.control.canonical, accountingVideo(controlId));
            await gallery.locator('#tweet-text-button').click();
            assert.equal(
              await gallery
                .locator('#toolbar-tweet-panel a[href^="https://x.com/"]')
                .getAttribute('href'),
              `https://x.com/contractseq/status/${controlId}`
            );
            await gallery.locator('#tweet-text-button').click();
          } else {
            await owned.waitForTimeout(SUPPRESSED_OBSERVATION_MS);
            assert.equal(
              await owned.locator(GALLERY).count(),
              0,
              'Open circuit must not produce a gallery from the queued fourth response'
            );
          }
          const requestedId: string | undefined = ids[index];
          assert(requestedId);
          observed.actions.push({
            index,
            requestedId,
            clickedAtMonotonicMs,
            observedAtMonotonicMs: performance.now(),
          });
        }
        observed.documentAfter = await owned.evaluate(() => ({
          href: location.href,
          timeOrigin: performance.timeOrigin,
        }));
        assert.deepEqual(
          observed.documentAfter,
          observed.documentBefore,
          'API accounting sequence must retain one document and service lifetime'
        );
        const actual = records.filter((record) => record.sequence === state.name);
        observed.actualRequests = actual.length;
        assert.equal(
          actual.length,
          state.expectedRequests,
          `${state.name} has incorrect failed-versus-healthy physical accounting`
        );
        assert.deepEqual(
          actual.map((record) => record.requestedId),
          ids.slice(0, state.expectedRequests)
        );
        const third = actual.find((record) => record.step === 2);
        const fourthAction = observed.actions[3];
        assert(
          third?.fulfilledAtMonotonicMs !== null &&
            third?.fulfilledAtMonotonicMs !== undefined &&
            fourthAction
        );
        assert(
          fourthAction.clickedAtMonotonicMs - third.fulfilledAtMonotonicMs < 60_000,
          'Fourth action must precede the unchanged cooldown'
        );
        observed.status = 'passed';
      } catch (error) {
        observed.status = 'failed';
        observed.error = error instanceof Error ? error.message : String(error);
        observed.actualRequests = records.filter((record) => record.sequence === state.name).length;
      } finally {
        if (output && !owned.isClosed()) {
          await owned.screenshot({ path: join(output, `api-contract-${state.name}.png`) });
        }
        if (!owned.isClosed() && (await owned.locator(GALLERY).count())) {
          await owned.keyboard.press('Escape');
        }
        owned.off('pageerror', pageError);
        owned.off('console', consoleError);
        await owned.close();
      }
    }
    assert.deepEqual(evidence.pageErrors, [], 'API accounting fixtures raised page errors');
    assert.deepEqual(
      evidence.consoleErrors.filter((record) => !record.expected),
      [],
      'API accounting fixture logged an unexpected error'
    );
    const failed = cases.filter((item) => item.status !== 'passed');
    assert.deepEqual(
      failed.map((item) => ({ name: item.name, error: item.error })),
      [],
      'Required installed API response-accounting cases failed'
    );
    evidence.status = 'passed';
  } catch (error) {
    caughtPrimaryError = true;
    primaryError = error;
    evidence.status = 'failed';
    evidence.error = error instanceof Error ? error.message : String(error);
  } finally {
    await context
      .unroute('**/*', routeHandler)
      .then(() => {
        evidence.cleanup.routeRemoved = true;
      })
      .catch((error) => errors.push(error));
    const closing = await Promise.allSettled(
      ownedPages.filter((owned) => !owned.isClosed()).map((owned) => owned.close())
    );
    evidence.cleanup.pagesClosed = ownedPages.every((owned) => owned.isClosed());
    errors.push(
      ...closing.filter((result) => result.status === 'rejected').map((result) => result.reason)
    );
    evidence.cleanup.errors = errors.map((error) =>
      error instanceof Error ? error.message : String(error)
    );
    if (errors.length) {
      evidence.status = 'failed';
    }
    if (output) {
      await writeFile(
        join(output, 'api-contract-accounting-observations.json'),
        JSON.stringify(evidence, null, 2)
      );
    }
  }
  if (errors.length) {
    throw new AggregateError(
      caughtPrimaryError ? [primaryError, ...errors] : errors,
      'API accounting fixture cleanup failed'
    );
  }
  if (caughtPrimaryError) {
    throw primaryError;
  }
  return evidence;
}
