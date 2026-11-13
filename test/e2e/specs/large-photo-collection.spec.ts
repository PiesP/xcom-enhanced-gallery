// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { createHash } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import {
  readExactDownloadFile,
  expectedStoredZipBytes,
} from '../../../validation/windows/download-memory';
import { inspectLiveStoredZip } from '../../../validation/windows/live-acceptance';
import {
  LARGE_PHOTO_OWNERS,
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
    const indices = [...new Set([0, 3, 4, 9, 11, 12, 19, 20, 39].filter((index) => index < count))];
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
