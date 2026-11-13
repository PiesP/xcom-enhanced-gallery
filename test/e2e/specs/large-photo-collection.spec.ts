// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import {
  readExactDownloadFile,
  expectedStoredZipBytes,
} from '../../../validation/windows/download-memory';
import {
  inspectLiveStoredZip,
  openCurrentStatusImage,
} from '../../../validation/windows/live-acceptance';
import {
  createInstalledLargePhotoFixture,
  largePhotoFixtureMedia,
} from '../../../validation/windows/installed-large-photo-fixture';
import {
  observePhotoGallery,
  finishManagerPhotoApiCapture,
  verifyDomPhotoCollection,
  verifyPhotoCollection,
  verifyBoundaryPhotoSelections,
} from '../../../validation/windows/live-photo-collection';
import { summarizeTweetResultResponse } from '../../../validation/windows/live-page';
import { createManagerPhotoApiObserver } from '../../../validation/windows/userscript-install';
import { DEV_USERSCRIPT_PATH } from '../fixtures/artifacts';
import { installGMMock } from '../fixtures/gm-mock';
import { injectDevUserscript, waitForGalleryApp } from '../fixtures/userscript-harness';
import {
  LARGE_PHOTO_OWNERS,
  installLargePhotoGmTransport,
  photoExpectations,
  setupLargePhotoFixture,
  type PhotoExpectation,
} from '../fixtures/large-photo-collection';

async function select(page: Page, index: number): Promise<void> {
  const counter = page.locator('#xeg-toolbar-counter');
  let current = Number(await counter.getAttribute('data-position')) - 1;
  while (current !== index) {
    await page.keyboard.press(current < index ? 'ArrowRight' : 'ArrowLeft');
    current += current < index ? 1 : -1;
    await expect(counter).toHaveAttribute('data-position', String(current + 1));
  }
  await expect(
    page.locator(`[data-gallery-element="item"][data-index="${index}"]`)
  ).toHaveAttribute('data-media-loaded', 'true');
}

async function expectRendered(
  page: Page,
  index: number,
  expected: PhotoExpectation
): Promise<void> {
  const row = page.locator(`[data-gallery-element="item"][data-index="${index}"]`);
  await expect(row).toHaveAttribute('data-media-active', 'true');
  await expect(row).toHaveAttribute('data-media-focused', 'true');
  await expect(row.locator('img')).toBeVisible();
  await expect
    .poll(() =>
      row.locator('img').evaluate((image: HTMLImageElement) => ({
        source: (image.currentSrc || image.src)
          .split('/')
          .at(-1)
          ?.split('?')[0]
          ?.replace(/\.(?:jpg|webp)$/u, ''),
        loaded: image.complete && image.naturalWidth === 54 && image.naturalHeight === 1080,
      }))
    )
    .toEqual({ source: expected.sourceKey, loaded: true });
}

async function saveSingle(page: Page, expected: PhotoExpectation): Promise<void> {
  const completed = page.waitForEvent('download');
  await page
    .locator('[data-gallery-element="toolbar"]')
    .getByRole('button', { name: 'Download', exact: true })
    .click();
  const download = await completed;
  expect(download.suggestedFilename()).toBe(expected.filename);
  const path = test.info().outputPath('saved', download.suggestedFilename());
  mkdirSync(dirname(path), { recursive: true });
  await download.saveAs(path);
  const saved = await readExactDownloadFile(path, expected.bytes.length);
  expect(saved.bytes.equals(expected.bytes)).toBe(true);
  await test.info().attach(`saved-${expected.ownerId}-${expected.ordinal}`, {
    body: JSON.stringify({
      channel: 'controlled-browser-fixture',
      ownerId: expected.ownerId,
      ordinal: expected.ordinal,
      mediaId: expected.mediaId,
      sourceUrl: expected.url,
      filename: expected.filename,
      bytes: saved.bytes.length,
      sha256: createHash('sha256').update(saved.bytes).digest('hex'),
      savedPath: path,
    }),
    contentType: 'application/json',
  });
}

async function saveZip(page: Page, expected: readonly PhotoExpectation[]): Promise<void> {
  const entries = expected.map(({ filename, bytes }) => ({ filename, bytes }));
  const completed = page.waitForEvent('download');
  await page
    .locator('[data-gallery-element="toolbar"]')
    .getByRole('button', { name: /shown files as ZIP/iu })
    .click();
  const download = await completed;
  expect(download.suggestedFilename()).toMatch(/\.zip$/u);
  const path = test.info().outputPath('saved', download.suggestedFilename());
  mkdirSync(dirname(path), { recursive: true });
  await download.saveAs(path);
  const saved = await readExactDownloadFile(path, expectedStoredZipBytes(entries));
  const archive = inspectLiveStoredZip(saved.bytes, expected.length, 40);
  for (const actual of archive.entries) {
    const source = expected.find(({ filename }) => filename === actual.filename);
    expect(source, `Unexpected saved member ${actual.filename}`).toBeDefined();
    expect(actual.bytes).toBe(source!.bytes.length);
    expect(actual.sha256).toBe(createHash('sha256').update(source!.bytes).digest('hex'));
  }
  await test.info().attach('saved-zip-members', {
    body: JSON.stringify({
      channel: 'controlled-browser-fixture',
      filename: download.suggestedFilename(),
      bytes: saved.bytes.length,
      sha256: createHash('sha256').update(saved.bytes).digest('hex'),
      savedPath: path,
      entries: expected.map(({ ownerId, ordinal, mediaId, url, filename, bytes }) => ({
        ownerId,
        ordinal,
        mediaId,
        sourceUrl: url,
        filename,
        bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex'),
      })),
      centralDirectoryAndCrcVerified: true,
    }),
    contentType: 'application/json',
  });
  expect(new Set(archive.entries.map(({ filename }) => filename))).toEqual(
    new Set(entries.map(({ filename }) => filename))
  );
  expect(
    new Set(archive.entries.map(({ filename }) => filename.replace(/\.[^.]+$/u, '').toLowerCase()))
      .size
  ).toBe(expected.length);
}

for (const count of [1, 4, 5, 10, 20, 40]) {
  test(`source-known ${count}-photo collection retains owner ordinals and actual supported save bytes`, async ({
    page,
  }) => {
    const expected = await setupLargePhotoFixture(page, {
      count: count === 40 ? 20 : count,
      quote: count === 40,
    });
    const ownCount = count === 40 ? 20 : count;
    await page.locator(`#photo-${LARGE_PHOTO_OWNERS[0]}-${ownCount - 1}`).click();
    await expect(page.locator('#xeg-toolbar-counter')).toHaveAttribute('data-total', String(count));
    await expect(page.locator('#xeg-toolbar-counter')).toHaveAttribute(
      'data-position',
      String(count)
    );
    const indices = [
      ...new Set(
        [0, 3, 4, 9, 11, 12, 19, 20, 23, 24, 29, 31, 32, 39].filter((index) => index < count)
      ),
    ];
    for (const index of indices) {
      await select(page, index);
      await expect(
        page.locator(`[data-gallery-element="item"][data-index="${index}"]`)
      ).toHaveAttribute(
        'data-media-display-url',
        new RegExp(`${expected[index]!.sourceKey}\\.jpg`)
      );
      await expectRendered(page, index, expected[index]!);
      await saveSingle(page, expected[index]!);
    }
    if (count > 1) {
      await saveZip(page, expected);
    } else {
      await expect(
        page
          .locator('[data-gallery-element="toolbar"]')
          .getByRole('button', { name: /shown files as ZIP/iu })
      ).toHaveCount(0);
    }
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-xeg-gallery-container]')).toHaveCount(0);
  });
}

test('API-failed twenty-WebP DOM recovery resolves late JPEG save and complete collected ZIP with unknown total', async ({
  page,
}) => {
  const expected = await setupLargePhotoFixture(page, { count: 20, domFallback: true });
  await page.locator(`#photo-${LARGE_PHOTO_OWNERS[0]}-19`).click();
  await expect(page.locator('#xeg-toolbar-counter')).toHaveAttribute('data-total', '20');
  await expect(page.locator('#xeg-toolbar-counter')).toHaveAttribute('data-position', '20');
  await select(page, 12);
  await expectRendered(page, 12, expected[12]!);
  await saveSingle(page, expected[12]!);
  await saveZip(page, expected);
  await expect(page.locator('[data-gallery-element="bulk-download-outcome"]')).toContainText(
    /post may contain more/iu
  );
});

test('nested owner click selects C without flattening sixty and native non-media status links remain native', async ({
  page,
}) => {
  await setupLargePhotoFixture(page, { count: 20, quote: true, nested: true });
  await page.locator(`#photo-${LARGE_PHOTO_OWNERS[0]}-19`).click();
  await expect(page.locator('#xeg-toolbar-counter')).toHaveAttribute('data-total', '40');
  await page.keyboard.press('Escape');
  await page.locator(`#photo-${LARGE_PHOTO_OWNERS[1]}-19`).click();
  await expect(page.locator('#xeg-toolbar-counter')).toHaveAttribute('data-total', '40');
  await page.keyboard.press('Escape');
  await page.locator(`#photo-${LARGE_PHOTO_OWNERS[2]}-19`).click();
  await expect(page.locator('#xeg-toolbar-counter')).toHaveAttribute('data-total', '20');
  await expect(page.locator('#xeg-toolbar-counter')).toHaveAttribute('data-position', '20');
  await expect(page.locator('[data-gallery-element="item"][data-index="19"]')).toHaveAttribute(
    'data-media-display-url',
    /LargePhotoC19/u
  );
  await expectRendered(page, 19, photoExpectations(2, 20)[19]!);
  await saveSingle(page, photoExpectations(2, 20)[19]!);
  await saveZip(page, photoExpectations(2, 20));
  await page.keyboard.press('Escape');
  await page.locator(`#status-${LARGE_PHOTO_OWNERS[2]}`).click();
  await expect(page).toHaveURL(new RegExp(`/status/${LARGE_PHOTO_OWNERS[2]}$`));
  await expect(page.locator('[data-xeg-gallery-container]')).toHaveCount(0);
});

test('source-known virtualized article reports only three observed tiles and preserves ordinal gaps in ZIP', async ({
  page,
}) => {
  const originals = await setupLargePhotoFixture(page, {
    count: 20,
    domFallback: true,
    visibleOrdinals: [0, 4, 19],
  });
  const observed = [originals[0]!, originals[4]!, originals[19]!];
  await page.locator(`#photo-${LARGE_PHOTO_OWNERS[0]}-19`).click();
  await expect(page.locator('#xeg-toolbar-counter')).toHaveAttribute('data-total', '3');
  await expect(page.locator('#xeg-toolbar-counter')).toHaveAttribute('data-position', '3');
  await expectRendered(page, 2, observed[2]!);
  await saveSingle(page, observed[2]!);
  await saveZip(page, observed);
  await expect(page.locator('[data-gallery-element="bulk-download-outcome"]')).toContainText(
    /post may contain more/iu
  );
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-xeg-gallery-container]')).toHaveCount(0);
});

test('installed narrow-photo fixture actions own a real hit-tested click surface', async ({
  page,
}) => {
  const fixture = createInstalledLargePhotoFixture(
    readFileSync(resolve(import.meta.dirname, '../fixtures/large-photo-narrow.jpg'))
  );
  const photos = [...fixture.photos, ...fixture.dom.photos];
  await page.route('https://pbs.twimg.com/**', async (route) => {
    const photo = photos.find((item) => item.displayUrl === route.request().url());
    expect(photo).toBeDefined();
    await route.fulfill({ status: 200, contentType: 'image/jpeg', body: photo!.previewBytes });
  });
  await page.route('https://x.com/**', async (route) => {
    const html =
      fixture.pages.get(route.request().url()) ?? fixture.dom.pages.get(route.request().url());
    expect(html).toBeDefined();
    await route.fulfill({ status: 200, contentType: 'text/html', body: html! });
  });
  for (const owner of [fixture.contract.directQuote!, fixture.dom.contract.requested]) {
    await page.goto(`https://x.com/${owner.handle}/status/${owner.statusId}`);
    for (const ordinal of [0, 19]) {
      const image = page.locator('[data-testid="tweetPhoto"] img').nth(ordinal);
      await image.scrollIntoViewIfNeeded();
      await expect(image).toBeVisible();
      const surface = await image.evaluate((element: HTMLImageElement) => {
        const action = element.closest('a');
        if (!action) {
          throw new Error('Fixture image lost its action');
        }
        const previousDisplay = action.style.display;
        action.style.display = 'inline';
        const inlineClientWidth = action.clientWidth;
        action.style.display = previousDisplay;
        const bounds = element.getBoundingClientRect();
        const x = Math.max(0, Math.min(innerWidth - 1, bounds.left + bounds.width / 2));
        const y = Math.max(0, Math.min(innerHeight - 1, bounds.top + bounds.height / 2));
        const actionBounds = action.getBoundingClientRect();
        const offsetX = x - actionBounds.left - action.clientLeft;
        const offsetY = y - actionBounds.top - action.clientTop;
        return {
          href: action.href,
          inlineClientWidth,
          loaded: element.complete && element.naturalWidth === 54 && element.naturalHeight === 1080,
          admitted:
            document.elementFromPoint(x, y)?.closest('a') === action &&
            offsetX >= 0 &&
            offsetY >= 0 &&
            offsetX < action.clientWidth &&
            offsetY < action.clientHeight,
        };
      });
      expect(surface).toEqual({
        href: `https://x.com/${owner.handle}/status/${owner.statusId}/photo/${ordinal + 1}`,
        inlineClientWidth: 0,
        loaded: true,
        admitted: true,
      });
    }
  }
});

test('source-known photo fixture API20 and API40 open through the strict selected-image verifier', async ({
  page,
}) => {
  const fixture = createInstalledLargePhotoFixture(
    readFileSync(resolve(import.meta.dirname, '../fixtures/large-photo-narrow.jpg'))
  );
  await page.route('https://pbs.twimg.com/**', async (route) => {
    const media = largePhotoFixtureMedia(
      fixture.photos,
      route.request().url(),
      route.request().resourceType(),
      route.request().method()
    );
    expect(['preview', 'display-original', 'original']).toContain(media.purpose);
    await route.fulfill({ status: 200, contentType: 'image/jpeg', body: media.bytes });
  });
  await page.route('https://x.com/**', async (route) => {
    const html = fixture.pages.get(route.request().url());
    expect(html).toBeDefined();
    await route.fulfill({ status: 200, contentType: 'text/html', body: html! });
  });
  for (const [owner, count] of [
    [fixture.contract.directQuote!, 20],
    [fixture.contract.requested, 40],
  ] as const) {
    const url = `https://x.com/${owner.handle}/status/${owner.statusId}`;
    await page.goto(url);
    await installGMMock(page, {
      downloadApi: false,
      mediaResponses: Object.fromEntries(
        fixture.photos.map((photo) => [photo.reference.originalUrl, [...photo.bytes]])
      ),
      apiResponses: Object.fromEntries(
        [...fixture.apiResponses].map(([id, bytes]) => [id, bytes.toString('utf8')])
      ),
    });
    await page.evaluate(() => {
      document.cookie = 'ct0=source-known-fixture; path=/';
    });
    await injectDevUserscript(page);
    await waitForGalleryApp(page);
    const body = fixture.apiResponses.get(owner.statusId)!;
    const observedSummaries: NonNullable<ReturnType<typeof summarizeTweetResultResponse>>[] = [];
    const managerApiObserver = createManagerPhotoApiObserver(
      page.context(),
      'a'.repeat(32),
      readFileSync(DEV_USERSCRIPT_PATH, 'utf8')
    );
    const managerApiTrace = await managerApiObserver(page, owner.statusId, (response) => {
      const summary = summarizeTweetResultResponse(
        response.url,
        response.status,
        JSON.parse(response.bodyText) as unknown,
        40
      );
      if (summary) {
        observedSummaries.push(summary);
      }
    });
    const observation: Record<string, unknown> = {};
    let apiTraceSnapshot: ReturnType<typeof managerApiTrace.snapshot>;
    try {
      await openCurrentStatusImage(page, url, observation);
      apiTraceSnapshot = await finishManagerPhotoApiCapture(
        managerApiTrace,
        Date.now() + 10_000,
        async () => {}
      );
    } finally {
      await managerApiTrace.stop();
    }
    expect(apiTraceSnapshot.sourceBinding).toMatchObject({
      installedSha256: createHash('sha256').update(readFileSync(DEV_USERSCRIPT_PATH)).digest('hex'),
      scriptId: expect.any(String),
      executionContextId: expect.any(Number),
    });
    expect(apiTraceSnapshot.responses).toEqual([
      {
        requestedId: owner.statusId,
        status: 200,
        bytes: body.length,
        sha256: createHash('sha256').update(body).digest('hex'),
      },
    ]);
    await expect(page.locator('[data-gallery-element="source-details"]')).toHaveCount(0);
    await expect(page.locator('#xeg-toolbar-counter')).toHaveAttribute('data-total', String(count));
    const contract =
      count === 40
        ? fixture.contract
        : { requested: owner, directQuote: null, expected: fixture.contract.expected.slice(0, 20) };
    const expectedSummary = summarizeTweetResultResponse(
      `https://x.com/i/api/graphql/fixture/TweetResultByRestId?variables=${encodeURIComponent(JSON.stringify({ tweetId: owner.statusId }))}`,
      200,
      JSON.parse(body.toString('utf8')),
      40
    )!;
    expect(observedSummaries).toEqual([expectedSummary]);
    const verified = verifyPhotoCollection(
      contract,
      observedSummaries,
      await observePhotoGallery(page, count)
    );
    const selections = await verifyBoundaryPhotoSelections(page, verified);
    expect(selections.visits).toHaveLength(count === 40 ? 14 : 7);
    const selectedIndex = count === 40 ? 20 : 19;
    await select(page, selectedIndex);
    const saved = page.waitForEvent('download');
    await page.locator('[data-gallery-element="toolbar"] button[aria-label="Download"]').click();
    const download = await saved;
    const expected = contract.expected[selectedIndex]!;
    expect(download.suggestedFilename()).toBe(expected.filename);
    const path = await download.path();
    expect(path).not.toBeNull();
    const bytes = await readExactDownloadFile(path!, expected.bytes);
    expect(createHash('sha256').update(bytes.bytes).digest('hex')).toBe(expected.sha256);
    await test.info().attach(`source-known-click-${count}`, {
      body: JSON.stringify(observation),
      contentType: 'application/json',
    });
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-xeg-gallery-container]')).toHaveCount(0);
  }
});

test('source-known installed DOM20 fixture verifies late clicked JPEG and every selected boundary', async ({
  page,
}) => {
  const fixture = createInstalledLargePhotoFixture(
    readFileSync(resolve(import.meta.dirname, '../fixtures/large-photo-narrow.jpg'))
  );
  const owner = fixture.dom.contract.requested;
  const url = `https://x.com/${owner.handle}/status/${owner.statusId}`;
  const probes: Array<{ key: string; purpose: string; method: string }> = [];
  await page.route('https://pbs.twimg.com/**', async (route) => {
    const method = route.request().method();
    const media = largePhotoFixtureMedia(
      fixture.dom.photos,
      route.request().url(),
      route.request().resourceType(),
      method
    );
    probes.push({ key: media.key, purpose: media.purpose, method });
    await route.fulfill({
      status: media.purpose === 'missing-original' ? 404 : 200,
      contentType: media.purpose === 'missing-original' ? 'image/webp' : 'image/jpeg',
      body: media.purpose === 'missing-original' || method === 'HEAD' ? '' : media.bytes,
    });
  });
  await page.route('https://x.com/**', async (route) => {
    const html = fixture.dom.pages.get(route.request().url());
    expect(html).toBeDefined();
    await route.fulfill({ status: 200, contentType: 'text/html', body: html! });
  });
  await page.goto(url);
  await installGMMock(page, { downloadApi: false });
  await installLargePhotoGmTransport(page, {}, true);
  await injectDevUserscript(page);
  await waitForGalleryApp(page);
  await page.locator('html[data-xeg-gallery-ready="true"]').waitFor();
  const tiles = await page
    .locator('article[data-testid="tweet"] a[href*="/photo/"]:has(img)')
    .evaluateAll((anchors) =>
      anchors.map((anchor) => ({
        href: (anchor as HTMLAnchorElement).href,
        displayUrl: anchor.querySelector('img')?.getAttribute('src') ?? '',
      }))
    );
  expect(tiles).toHaveLength(20);
  const late = page.locator('article[data-testid="tweet"] a[href$="/photo/20"] img');
  await late.scrollIntoViewIfNeeded();
  await late.click();
  await page.locator('[data-xeg-gallery-container]').waitFor();
  const gallery = await observePhotoGallery(page, 20);
  expect(gallery.initialIndex).toBe(19);
  const verified = verifyDomPhotoCollection(fixture.dom.contract, tiles, gallery);
  const selections = await verifyBoundaryPhotoSelections(page, verified);
  expect(selections.visits.map((visit) => visit.currentIndex)).toEqual([0, 3, 4, 9, 11, 12, 19]);
  const selected = fixture.dom.photos[19]!;
  await saveSingle(page, {
    ownerId: selected.reference.ownerId,
    ordinal: selected.ordinal,
    mediaId: selected.mediaId,
    sourceKey: selected.reference.sourceKey,
    url: selected.reference.originalUrl,
    filename: selected.reference.filename,
    bytes: selected.bytes,
  });
  expect(probes).toContainEqual({ key: 'XegDom19', purpose: 'missing-original', method: 'HEAD' });
  expect(probes).toContainEqual({ key: 'XegDom19', purpose: 'original', method: 'HEAD' });
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-xeg-gallery-container]')).toHaveCount(0);
});
