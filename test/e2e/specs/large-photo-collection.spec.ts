// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { expect, type Page, test } from '@playwright/test';
import {
  readExactDownloadFile,
  expectedStoredZipBytes,
  verifyStoredZip,
} from '../../../validation/windows/download-memory';
import {
  LARGE_PHOTO_OWNERS,
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

async function saveSingle(page: Page, expected: PhotoExpectation): Promise<void> {
  const completed = page.waitForEvent('download');
  await page
    .locator('[data-gallery-element="toolbar"]')
    .getByRole('button', { name: 'Download', exact: true })
    .click();
  const download = await completed;
  expect(download.suggestedFilename()).toBe(expected.filename);
  const path = await download.path();
  expect(path).not.toBeNull();
  const saved = await readExactDownloadFile(path!, expected.bytes.length);
  expect(saved.bytes.equals(expected.bytes)).toBe(true);
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
  const path = await download.path();
  expect(path).not.toBeNull();
  const saved = await readExactDownloadFile(path!, expectedStoredZipBytes(entries));
  const archive = verifyStoredZip(saved.bytes, entries);
  expect(new Set(archive.entries.map(({ filename }) => filename))).toEqual(
    new Set(entries.map(({ filename }) => filename))
  );
  expect(
    new Set(archive.entries.map(({ filename }) => filename.replace(/\.[^.]+$/u, '').toLowerCase()))
      .size
  ).toBe(expected.length);
}

for (const count of [1, 4, 5, 10, 20, 40]) {
  test(`source-known ${count}-photo collection retains owner ordinals and actual single/ZIP bytes`, async ({
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
      await saveSingle(page, expected[index]!);
    }
    await saveZip(page, expected);
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
  await page.locator(`#photo-${LARGE_PHOTO_OWNERS[2]}-19`).click();
  await expect(page.locator('#xeg-toolbar-counter')).toHaveAttribute('data-total', '20');
  await expect(page.locator('#xeg-toolbar-counter')).toHaveAttribute('data-position', '20');
  await expect(page.locator('[data-gallery-element="item"][data-index="19"]')).toHaveAttribute(
    'data-media-display-url',
    /LargePhotoC19/u
  );
  await page.keyboard.press('Escape');
  await page.locator(`#status-${LARGE_PHOTO_OWNERS[2]}`).click();
  await expect(page).toHaveURL(new RegExp(`/status/${LARGE_PHOTO_OWNERS[2]}$`));
  await expect(page.locator('[data-xeg-gallery-container]')).toHaveCount(0);
});
