// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { chromium } from '@playwright/test';
import { runInstalledMediaApiReuseProfile } from './media-api-reuse-profile.ts';

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
