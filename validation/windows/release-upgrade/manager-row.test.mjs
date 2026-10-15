// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { chromium } from '@playwright/test';
import { managerRowShowsVersion, requireInstalledManagerRow } from '../userscript-install.mjs';

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

const entry = (version) => `
  <tr class="scripttr"><td>
    <span class="nameNname16">X.com Enhanced Gallery</span>
    <span class="script_version">${version}</span>
    <table><tr><td>X.com Enhanced Gallery</td></tr></table>
  </td></tr>`;

test('manager row version is an exact token, not a regular expression', () => {
  assert.equal(managerRowShowsVersion('X.com Enhanced Gallery 2.3.7', '2.3.7'), true);
  assert.equal(managerRowShowsVersion('X.com Enhanced Gallery 2x3x7', '2.3.7'), false);
  assert.equal(managerRowShowsVersion('X.com Enhanced Gallery 2.3.7', '2.3.7|2.3.6'), false);
});

test('manager identity selects its installed entry despite a nested matching row', async () => {
  const page = await browser.newPage();
  try {
    await page.setContent(`<table>${entry('2.3.6')}</table>`);
    assert.equal(
      await page.locator('tr:visible').filter({ hasText: 'X.com Enhanced Gallery' }).count(),
      2
    );
    const row = await requireInstalledManagerRow(page, tmpdir(), 'single');
    assert.match(await row.innerText(), /2\.3\.6/u);
  } finally {
    await page.close();
  }
});

test('manager identity rejects two real installed entries and preserves a screenshot', async () => {
  const page = await browser.newPage();
  const output = await mkdtemp(join(tmpdir(), 'xeg-manager-identity-'));
  try {
    await page.setContent(`<table>${entry('2.3.6')}${entry('2.3.7')}</table>`);
    await assert.rejects(
      requireInstalledManagerRow(page, output, 'duplicate'),
      /exactly one installed script identity.*2\.3\.6.*2\.3\.7/u
    );
    assert((await stat(join(output, 'userscript-duplicate-identity.png'))).size > 0);
  } finally {
    await page.close();
    await rm(output, { recursive: true, force: true });
  }
});
