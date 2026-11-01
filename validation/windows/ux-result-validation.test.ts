// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { test } from 'vite-plus/test';
import {
  assertMovedPointerOnTarget,
  assertSelectedResultWheel,
  qualifyOneItemMediaNoOverflow,
  uxStartWheelEventProbe,
  uxStopWheelEventProbe,
} from './ux-result-validation.ts';
import type { OneItemLayout } from './ux-result-validation.ts';

test('result wheel capture binds the actual event to the selected DOM node and its descendants', async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.setContent(`
      <style>
        #panel { height: 260px; width: 320px; overflow: auto; }
        p, button { display: block; height: 55px; width: 250px; margin: 0; }
        #spacer { height: 500px; }
      </style>
      <div id="panel" data-gallery-element="gallery-failure-notice">
        <p id="wanted">Intended paragraph</p>
        <p id="wrong">Other paragraph</p>
        <button id="button"><span id="nested">Nested label</span></button>
        <div id="spacer"></div>
      </div>
    `);
    const panel = page.locator('#panel');
    const pointOf = async (selector: string) => {
      const bounds = await page.locator(selector).boundingBox();
      assert(bounds, `${selector} has no bounding box`);
      return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    };

    await uxStartWheelEventProbe(panel, page.locator('#button'));
    const buttonPoint = await pointOf('#nested');
    await page.mouse.move(buttonPoint.x, buttonPoint.y);
    await page.mouse.wheel(0, 1);
    await page.waitForTimeout(50);
    const nested = await uxStopWheelEventProbe(page);
    const nestedWheel = nested.events.filter((event) => event.kind === 'wheel');
    assert.equal(nested.overflow, false);
    assert.equal(nestedWheel.length, 1);
    assert.equal(nestedWheel[0]?.trusted, true);
    assert.equal(nestedWheel[0]?.targetTag, 'SPAN', JSON.stringify(nestedWheel[0]));
    assertSelectedResultWheel('nested button', nestedWheel[0]);

    await panel.evaluate((element) => (element.scrollTop = 0));
    await uxStartWheelEventProbe(panel, page.locator('#wanted'));
    const wrongPoint = await pointOf('#wrong');
    await page.mouse.move(wrongPoint.x, wrongPoint.y);
    await page.mouse.wheel(0, 1);
    await page.waitForTimeout(50);
    const wrong = await uxStopWheelEventProbe(page);
    const wrongWheel = wrong.events.filter((event) => event.kind === 'wheel');
    assert.equal(wrong.overflow, false);
    assert.equal(wrongWheel.length, 1);
    assert.equal(wrongWheel[0]?.trusted, true);
    assert.equal(wrongWheel[0]?.targetOwner, true);
    assert.equal(wrongWheel[0]?.targetTag, 'P');
    assert.equal(wrongWheel[0]?.targetSelected, false);
    assert.throws(
      () => assertSelectedResultWheel('wrong paragraph', wrongWheel[0]),
      /did not reach its selected target/u
    );
  } finally {
    await page.close();
    await browser.close();
  }
});

test('moved pointer must still hit the chosen element before wheel input', async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.setContent(`
      <style>
        #panel { position: relative; width: 300px; height: 200px; }
        p { width: 250px; height: 50px; }
      </style>
      <div id="panel"><p id="wanted">Intended paragraph</p><p id="wrong">Other paragraph</p></div>
    `);
    const selected = page.locator('#wanted');
    const point = await selected.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      return { x, y, ownsHit: element.contains(document.elementFromPoint(x, y)) };
    });
    assert.equal(point.ownsHit, true);
    await page.evaluate(() => {
      document.addEventListener(
        'pointermove',
        () => {
          const wrong = document.querySelector<HTMLElement>('#wrong');
          if (!wrong) {
            throw new Error('Missing wrong-target control');
          }
          wrong.style.position = 'fixed';
          wrong.style.left = '8px';
          wrong.style.top = '8px';
          wrong.style.zIndex = '5';
        },
        { once: true }
      );
    });
    await uxStartWheelEventProbe(page.locator('#panel'), selected);
    try {
      await page.mouse.move(point.x, point.y);
      const afterMoveOwnsHit = await selected.evaluate((element, position) => {
        const hit = document.elementFromPoint(position.x, position.y);
        return Boolean(hit && element.contains(hit));
      }, point);
      assert.equal(afterMoveOwnsHit, false);
      assert.throws(
        () => assertMovedPointerOnTarget('moved paragraph', afterMoveOwnsHit),
        /moved pointer did not hit its selected target/u
      );
    } finally {
      const probe = await uxStopWheelEventProbe(page);
      assert.equal(probe.events.filter((event) => event.kind === 'wheel').length, 0);
    }
  } finally {
    await page.close();
    await browser.close();
  }
});

const currentOneItemLayout = (): OneItemLayout => ({
  viewport: { width: 1280, height: 900 },
  media: {
    scrollTop: 0,
    scrollHeight: 1014,
    clientHeight: 736,
    bounds: { top: 50, bottom: 786, width: 1100, height: 736 },
    paddingTop: '128px',
  },
  item: {
    fit: 'fitContainer',
    bounds: { top: 178, bottom: 276, width: 900, height: 98 },
  },
  sourceBounds: { top: 800, bottom: 845, width: 350, height: 45 },
  spacerHeight: '772px',
  toolbarClearance: '128px',
});

test('one-item N/A requires measured overflow and the product spacer geometry', () => {
  const current = qualifyOneItemMediaNoOverflow(currentOneItemLayout());
  assert.equal(current.mediaOverflow, 278);
  assert.equal(current.verdict, 'not-applicable-unreachable-with-product-spacer');

  const absent = currentOneItemLayout();
  absent.media.scrollHeight = absent.media.clientHeight;
  assert.equal(
    qualifyOneItemMediaNoOverflow(absent).verdict,
    'reachable-media-no-overflow-changed-prerequisite'
  );

  const missing = currentOneItemLayout();
  missing.spacerHeight = 'auto';
  assert.equal(qualifyOneItemMediaNoOverflow(missing).verdict, 'unverified-invalid-geometry');

  const contradictory = currentOneItemLayout();
  contradictory.media.scrollHeight = 740;
  assert.equal(qualifyOneItemMediaNoOverflow(contradictory).verdict, 'unverified-spacer-premise');

  const noItem = currentOneItemLayout();
  noItem.item.bounds = null;
  assert.equal(qualifyOneItemMediaNoOverflow(noItem).verdict, 'unverified-invalid-geometry');
});
