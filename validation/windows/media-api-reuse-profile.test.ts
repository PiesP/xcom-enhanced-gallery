// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { chromium } from '@playwright/test';
import {
  assertRedirectProtocolAttribution,
  runInstalledMediaApiReuseProfile,
} from './media-api-reuse-profile.ts';

const REDIRECT_TWEET_ID = '8111111111111111111';
const REDIRECT_API_URL =
  'https://x.com/i/api/graphql/contract/TweetResultByRestId?variables=' +
  encodeURIComponent(JSON.stringify({ tweetId: REDIRECT_TWEET_ID }));
const REDIRECT_RECEIVER = 'https://pbs.twimg.com/media/xeg-metadata-redirect.json';

function ownedRedirectObservations(): Parameters<typeof assertRedirectProtocolAttribution>[0] {
  const ids = ['owned-a', 'owned-b'];
  const text = 'Failed to load resource: net::ERR_FAILED';
  return {
    tweetId: REDIRECT_TWEET_ID,
    protocol: {
      pageIndex: 1,
      variant: 'redirect',
      requests: ids.map((requestId, index) => ({
        requestId,
        url: REDIRECT_API_URL,
        requestedAtMonotonicMs: 100 + index * 100,
      })),
      hops: [],
      failures: ids.map((requestId, index) => ({
        requestId,
        error: 'net::ERR_FAILED',
        failedAtMonotonicMs: 101 + index * 100,
      })),
      logs: ids.map((requestId, index) => ({
        requestId,
        source: 'network',
        level: 'error',
        text,
        url: REDIRECT_RECEIVER,
        observedAtMonotonicMs: 102 + index * 100,
      })),
      overflow: false,
    },
    failedRequests: ids.map((_, index) => ({
      pageIndex: 1,
      url: REDIRECT_API_URL,
      error: 'net::ERR_FAILED',
      failedAtMonotonicMs: 101 + index * 100,
    })),
    consoleErrors: ids.map((_, index) => ({
      variant: 'redirect',
      text,
      expected: false,
      pageIndex: 1,
      apiLocation: false,
      location: {
        url: REDIRECT_RECEIVER,
        line: 0,
        column: 0,
        lineNumber: 0,
        columnNumber: 0,
      },
      observedAtMonotonicMs: 103 + index * 100,
    })),
  };
}

test('redirect console attribution requires exact failed API IDs and destination', () => {
  assert.equal(assertRedirectProtocolAttribution(ownedRedirectObservations()).length, 2);
  for (const [name, mutate] of [
    [
      'missing ID',
      (input: ReturnType<typeof ownedRedirectObservations>) => {
        input.protocol.logs[1]!.requestId = undefined;
      },
    ],
    [
      'wrong ID',
      (input: ReturnType<typeof ownedRedirectObservations>) => {
        input.protocol.logs[1]!.requestId = 'foreign';
      },
    ],
    [
      'duplicate ID',
      (input: ReturnType<typeof ownedRedirectObservations>) => {
        input.protocol.logs[1]!.requestId = 'owned-a';
      },
    ],
    [
      'unrelated console location',
      (input: ReturnType<typeof ownedRedirectObservations>) => {
        input.consoleErrors[1]!.location.url = 'https://x.com/unrelated-resource';
      },
    ],
    [
      'missing CDP log URL',
      (input: ReturnType<typeof ownedRedirectObservations>) => {
        input.protocol.logs[1]!.url = undefined;
      },
    ],
  ] satisfies [string, (input: ReturnType<typeof ownedRedirectObservations>) => void][]) {
    const input = ownedRedirectObservations();
    mutate(input);
    assert.throws(() => assertRedirectProtocolAttribution(input), name);
  }
});

test('installed API reuse preserves a falsy navigation rejection after cleanup', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const output = await mkdtemp(join(tmpdir(), 'xeg-api-reuse-rejection-'));
  const originalGoto = page.goto;
  try {
    page.goto = async () => Promise.reject(undefined);
    let rejected = false;
    await runInstalledMediaApiReuseProfile({
      context,
      page,
      qualityFixtureUrl: 'https://x.com/qualityuser/status/8111111111111111111',
      qualityTweetId: '8111111111111111111',
      qualityImagePaths: ['one.jpg', 'two.jpg', 'three.jpg'],
      output,
      videoPayloads: {},
    }).then(
      () => {},
      (error: unknown) => {
        rejected = true;
        assert.equal(error, undefined);
      }
    );
    assert.equal(rejected, true, 'A falsy primary rejection must not resolve');
    const evidence = JSON.parse(
      await readFile(join(output, 'api-reuse-observations.json'), 'utf8')
    );
    assert.equal(evidence.status, 'failed');
    assert.deepEqual(evidence.redirectFailedRequests, []);
    assert.deepEqual(evidence.redirectProtocol, []);
    assert.deepEqual(evidence.cleanup, {
      routesRemoved: true,
      pagesClosed: true,
      pageRestored: true,
      errors: [],
    });
  } finally {
    page.goto = originalGoto;
    await context.close();
    await browser.close();
    await rm(output, { recursive: true, force: true });
  }
});
