// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import type { BrowserContext, Page } from '@playwright/test';
import {
  expectedStoredZipBytes,
  readExactDownloadFile,
  verifyStoredZip,
  waitForRemovedDownloadFile,
  type DownloadFileIdentity,
} from './download-memory.ts';
import type { startExtensionNativeFixtureLoopback } from './extension-native-loopback.ts';
import {
  installFixtureRoutes,
  VIDEO_FORMAT_API_CASES,
  VIDEO_FORMAT_DIRECT_SOURCE,
  VIDEO_FORMAT_FIXTURE_URL,
  type ImageFixtures,
} from './install-preparation.ts';

type NativeLoopback = Awaited<ReturnType<typeof startExtensionNativeFixtureLoopback>>;
type DownloadItem = {
  id: number;
  url: string;
  filename: string;
  state: string;
  error?: string;
};

declare const chrome: {
  downloads: {
    search(query: { orderBy?: string[] }): Promise<DownloadItem[]>;
    removeFile(id: number): Promise<void>;
    erase(query: { id: number }): Promise<number[]>;
  };
};

const OWNER = '4666000000000000484';
const digest = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');

async function queryDownloads(page: Page) {
  return page.evaluate(() => chrome.downloads.search({ orderBy: ['-startTime'] }));
}

async function waitForDownload(page: Page, before: ReadonlySet<number>, filename: string) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const added = (await queryDownloads(page)).filter((item) => !before.has(item.id));
    assert(added.length <= 1, 'Unexpected additional native download in the format fixture');
    const item = added[0];
    if (item?.state === 'interrupted') {
      throw new Error(`Native format fixture download interrupted: ${item.error ?? 'unknown'}`);
    }
    if (item?.state === 'complete') {
      return item;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  throw new Error(`Timed out waiting for native format fixture download ${filename}`);
}

async function assertNoNativeDownload(page: Page, before: ReadonlySet<number>, kind: string) {
  const settleMs = 500;
  const deadline = Date.now() + settleMs;
  while (Date.now() < deadline) {
    const added = (await queryDownloads(page)).filter(({ id }) => !before.has(id));
    assert.deepEqual(added, [], `${kind}: rejected video started a native save`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
  }
  const added = (await queryDownloads(page)).filter(({ id }) => !before.has(id));
  assert.deepEqual(added, [], `${kind}: rejected video started a native save`);
  return settleMs;
}

export async function runInstalledVideoSaveFormatProbe({
  context,
  downloads,
  extensionId,
  nativeLoopback,
  output,
  root,
  images,
  displayImages,
}: {
  context: BrowserContext;
  downloads: string;
  extensionId: string;
  nativeLoopback: NativeLoopback;
  output: string;
  root: string;
  images: ImageFixtures;
  displayImages: ImageFixtures;
}) {
  const routes = await installFixtureRoutes(context, root, images, displayImages);
  nativeLoopback.setPayloads(images, routes.videoPayloads);
  const videoBytes = routes.videoPayloads['quote-one'];
  const imageBytes = images[0];
  assert(videoBytes && imageBytes, 'Declared format fixture bytes are missing');
  assert.equal(videoBytes.toString('ascii', 4, 8), 'ftyp', 'Video fixture is not an MP4 container');
  const receipt: Record<string, unknown> = {
    status: 'pending',
    scope: 'installed Chrome/Edge extension on one owned X fixture; no live X',
    fixtureUrl: VIDEO_FORMAT_FIXTURE_URL,
    cases: [],
    cleanup: {},
  };
  const cases = receipt.cases as Array<Record<string, unknown>>;
  const cleanup = receipt.cleanup as Record<string, unknown>;
  const extensionPage = await context.newPage();
  const page = await context.newPage();
  const verified = new Map<number, { item: DownloadItem; identity: DownloadFileIdentity }>();
  let primaryError: unknown;
  let primarySeen = false;
  const cleanupErrors: unknown[] = [];
  try {
    await extensionPage.goto(`chrome-extension://${extensionId}/manifest.json`);
    const initialIds = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    assert.equal(initialIds.size, 0, 'Focused format fixture requires a fresh download profile');
    await page.goto(VIDEO_FORMAT_FIXTURE_URL);
    await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
    const direct = page.locator('[data-format-case="direct-mp4"] video');
    await direct.click();
    const gallery = page.locator('[data-xeg-gallery-container]');
    await gallery.waitFor({ state: 'visible' });
    assert.equal(await gallery.locator('[data-gallery-element="item"]').count(), 2);
    const selectedSource = await gallery.locator('video').first().getAttribute('src');
    assert.equal(selectedSource, VIDEO_FORMAT_DIRECT_SOURCE, 'Gallery chose a different source');

    const beforeSingle = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
    const single = await waitForDownload(
      extensionPage,
      beforeSingle,
      `format_fixture_${OWNER}_source-433f260a01b3e905.mp4`
    );
    const singleCase: Record<string, unknown> = {
      kind: 'direct-mp4',
      nativeId: single.id,
      expectedFilename: `format_fixture_${OWNER}_source-433f260a01b3e905.mp4`,
      filename: basename(single.filename),
      sourceUrl: single.url,
    };
    cases.push(singleCase);
    assert.equal(dirname(resolve(single.filename)), resolve(downloads));
    const savedVideo = await readExactDownloadFile(single.filename, videoBytes.length);
    verified.set(single.id, { item: single, identity: savedVideo.identity });
    await writeFile(join(output, 'format-direct.mp4'), savedVideo.bytes, { flag: 'wx' });
    singleCase.bytes = savedVideo.bytes.length;
    singleCase.sha256 = digest(savedVideo.bytes);
    assert.equal(singleCase.filename, singleCase.expectedFilename, 'Saved MP4 name differs');
    assert.equal(
      single.url,
      VIDEO_FORMAT_DIRECT_SOURCE,
      'Native MP4 source differs from the selected URL'
    );
    assert(savedVideo.bytes.equals(videoBytes), 'Native MP4 bytes differ from the owned fixture');

    const expectedEntries = [
      { filename: `format_fixture_${OWNER}_source-b44cfa31f709d13f.jpg`, bytes: imageBytes },
      { filename: `format_fixture_${OWNER}_source-433f260a01b3e905.mp4`, bytes: videoBytes },
    ];
    const beforeZip = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
    await gallery
      .locator(
        '[data-gallery-element="toolbar"] button[aria-label="Download 2 shown files as ZIP"]'
      )
      .click();
    const zip = await waitForDownload(extensionPage, beforeZip, `format_fixture_${OWNER}.zip`);
    const zipCase: Record<string, unknown> = {
      kind: 'direct-mp4-with-image-zip',
      nativeId: zip.id,
      expectedFilename: `format_fixture_${OWNER}.zip`,
      filename: basename(zip.filename),
    };
    cases.push(zipCase);
    assert.equal(dirname(resolve(zip.filename)), resolve(downloads));
    const savedZip = await readExactDownloadFile(
      zip.filename,
      expectedStoredZipBytes(expectedEntries)
    );
    verified.set(zip.id, { item: zip, identity: savedZip.identity });
    await writeFile(join(output, 'format-direct.zip'), savedZip.bytes, { flag: 'wx' });
    zipCase.bytes = savedZip.bytes.length;
    zipCase.sha256 = digest(savedZip.bytes);
    assert.equal(zipCase.filename, zipCase.expectedFilename, 'Saved ZIP name differs');
    zipCase.entries = verifyStoredZip(savedZip.bytes, expectedEntries);
    await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
    await gallery.waitFor({ state: 'detached' });

    for (const kind of ['playlist', 'unknown', 'conflict']) {
      const before = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
      const apiStart = routes.apiResponses.length;
      const notice = page.locator('[data-xeg-entry-failure]');
      assert.equal(await notice.count(), 0, `${kind}: prior failure notice was not dismissed`);
      await page.locator(`[data-format-case="${kind}"] video`).click();
      await notice.waitFor({ state: 'visible' });
      assert.equal(await notice.count(), 1, `${kind}: expected one terminal failure notice`);
      assert.equal(routes.apiResponses.length, apiStart + 1, `${kind}: expected one API denial`);
      assert.equal(routes.apiResponses[apiStart]?.status, 403);
      assert.equal(await gallery.count(), 0, `${kind}: unsupported video opened a gallery`);
      const nativeSettleMs = await assertNoNativeDownload(extensionPage, before, kind);
      cases.push({
        kind,
        status: 'save-rejected',
        notice: (await notice.locator('[role="status"]').textContent())?.trim() ?? '',
        apiStatus: 403,
        nativeDownloads: 0,
        nativeSettleMs,
      });
      await notice.locator('button').click();
      await notice.waitFor({ state: 'detached' });
      if (kind === 'unknown') {
        // The three intentional API denials open this page's extraction circuit.
        await page.goto(VIDEO_FORMAT_FIXTURE_URL);
        await page.locator('html[data-xeg-gallery-ready="true"]').waitFor({ state: 'attached' });
      }
    }
    for (const fixture of VIDEO_FORMAT_API_CASES) {
      const before = new Set((await queryDownloads(extensionPage)).map(({ id }) => id));
      const apiStart = routes.videoFormatApiResponses.length;
      const notice = page.locator('[data-xeg-entry-failure]');
      assert.equal(await notice.count(), 0, `${fixture.name}: prior failure notice remains`);
      await page.locator(`[data-format-case="${fixture.name}"] video`).click();
      const apiDeadline = Date.now() + 10_000;
      while (routes.videoFormatApiResponses.length === apiStart && Date.now() < apiDeadline) {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
      }
      const records = routes.videoFormatApiResponses.slice(apiStart);
      assert.equal(records.length, 1, `${fixture.name}: expected one successful API response`);
      assert.equal(records[0]?.tweetId, fixture.tweetId);
      assert.equal(records[0]?.status, 200);
      const source = `${VIDEO_FORMAT_DIRECT_SOURCE}${fixture.query}`;
      if (!fixture.accepted) {
        await notice.waitFor({ state: 'visible' });
        assert.equal(await notice.count(), 1, `${fixture.name}: expected one terminal failure`);
        assert.equal(await gallery.count(), 0, `${fixture.name}: sibling photo replaced the video`);
        const nativeSettleMs = await assertNoNativeDownload(extensionPage, before, fixture.name);
        cases.push({
          kind: fixture.name,
          status: 'save-rejected',
          ownerTweetId: fixture.tweetId,
          selectedSource: source,
          apiStatus: 200,
          apiRootMediaCount: records[0]?.rootMediaCount,
          notice: (await notice.locator('[role="status"]').textContent())?.trim() ?? '',
          nativeDownloads: 0,
          nativeSettleMs,
        });
        await notice.locator('button').click();
        await notice.waitFor({ state: 'detached' });
        continue;
      }

      await gallery.waitFor({ state: 'visible' });
      assert.equal(await gallery.locator('[data-gallery-element="item"]').count(), 1);
      assert.equal(await gallery.locator('video').first().getAttribute('src'), source);
      const expectedFilename = `format_fixture_${fixture.tweetId}_0.mp4`;
      await gallery
        .locator('[data-gallery-element="toolbar"] button[aria-label="Download"]')
        .click();
      const saved = await waitForDownload(extensionPage, before, expectedFilename);
      const savedCase: Record<string, unknown> = {
        kind: fixture.name,
        ownerTweetId: fixture.tweetId,
        selectedSource: source,
        apiStatus: 200,
        nativeId: saved.id,
        expectedFilename,
        filename: basename(saved.filename),
        sourceUrl: saved.url,
      };
      cases.push(savedCase);
      assert.equal(dirname(resolve(saved.filename)), resolve(downloads));
      const file = await readExactDownloadFile(saved.filename, videoBytes.length);
      verified.set(saved.id, { item: saved, identity: file.identity });
      await writeFile(join(output, `${fixture.name}.mp4`), file.bytes, { flag: 'wx' });
      savedCase.bytes = file.bytes.length;
      savedCase.sha256 = digest(file.bytes);
      assert.equal(savedCase.filename, expectedFilename);
      assert.equal(saved.url, source);
      assert(file.bytes.equals(videoBytes), `${fixture.name}: saved MP4 bytes differ`);
      await gallery.locator('[data-gallery-element="toolbar"] button[aria-label="Close"]').click();
      await gallery.waitFor({ state: 'detached' });
    }
    const transport = nativeLoopback.snapshot();
    assert.equal(transport.unexpectedCount, 0, 'Native fixture received an unknown CDN request');
    assert.equal(transport.overflow, false, 'Native fixture exceeded its request budget');
    receipt.transport = {
      requestCount: transport.requests,
      unexpectedCount: transport.unexpectedCount,
      overflow: transport.overflow,
    };
    routes.assertNoQualityRequestOverflow();
    receipt.status = 'passed';
  } catch (error) {
    primarySeen = true;
    primaryError = error;
    receipt.status = 'failed';
    receipt.error = error instanceof Error ? error.message : String(error);
  } finally {
    for (const [id, { item, identity }] of verified) {
      try {
        await extensionPage.evaluate(async (ownedId) => {
          await chrome.downloads.removeFile(ownedId);
          const erased = await chrome.downloads.erase({ id: ownedId });
          if (erased.length !== 1 || erased[0] !== ownedId) {
            throw new Error('Owned download history entry was not removed');
          }
        }, id);
        await waitForRemovedDownloadFile(item.filename, identity);
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    cleanup.verifiedDownloadIdsRemoved = verified.size - cleanupErrors.length;
    for (const [name, close] of [
      ['fixture page', () => page.close()],
      ['extension page', () => extensionPage.close()],
      ['fixture routes', () => routes.remove()],
    ] as const) {
      try {
        await close();
        cleanup[name] = true;
      } catch (error) {
        cleanupErrors.push(error);
      }
    }
    cleanup.errorCount = cleanupErrors.length;
    if (cleanupErrors.length) {
      receipt.status = 'failed';
      cleanup.errors = cleanupErrors.map((error) =>
        error instanceof Error ? error.message : String(error)
      );
    }
    try {
      await writeFile(join(output, 'video-save-format.json'), JSON.stringify(receipt, null, 2), {
        flag: 'wx',
      });
    } catch (error) {
      cleanupErrors.push(error);
    }
  }
  if (primarySeen || cleanupErrors.length) {
    throw new AggregateError(
      [...(primarySeen ? [primaryError] : []), ...cleanupErrors],
      'Installed video save format fixture or owned cleanup failed'
    );
  }
  return receipt;
}
