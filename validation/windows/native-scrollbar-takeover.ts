// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

/** Small input seam shared by the installed Chromium and Firefox transports. */
export interface NativeScrollbarDriver {
  evaluate(expression: string): Promise<unknown>;
  waitFor(expression: string, description: string, timeoutMs?: number): Promise<void>;
  press(key: 'Home' | 'End'): Promise<void>;
  drag(
    from: { x: number; y: number },
    to: { x: number; y: number },
    afterDown: () => Promise<void>
  ): Promise<void>;
  resize(width: number, height: number): Promise<void>;
  screenshot(filename: string): Promise<void>;
}

const PROBE = '__xegNativeScrollbarTakeover';

/** Fixture-only observation: no product state, wheel, or scroll-position writes. */
const INSTALL = `(() => {
  if (window.${PROBE}) throw new Error('Scrollbar probe already installed');
  const items = document.querySelector('[data-gallery-element="items"]');
  const gallery = document.querySelector('dialog[data-xeg-gallery-container]');
  if (!(items instanceof HTMLElement) || !(gallery instanceof HTMLDialogElement)) {
    throw new Error('Scrollbar probe requires the open native gallery');
  }
  const prior = { behavior: items.style.scrollBehavior,
    marker: document.documentElement.getAttribute('data-xeg-scroll-trace') };
  const rows = [], frames = [], product = [];
  let overflow = false, stopped = false, raf = 0, lastTop = null;
  const started = performance.now();
  const snapshot = () => {
    const rect = items.getBoundingClientRect();
    const toolbar = gallery.querySelector('[data-gallery-element="toolbar"]');
    const media = [...items.querySelectorAll('[data-gallery-element="item"]')];
    const active = media.filter(item => item.getAttribute('data-media-active') === 'true');
    const focused = media.filter(item => item.getAttribute('data-media-focused') === 'true');
    return { at: performance.now(), top: items.scrollTop, height: items.clientHeight,
      scrollHeight: items.scrollHeight, width: innerWidth, viewportHeight: innerHeight,
      current: active.length === 1 ? active[0].getAttribute('data-index') : null,
      focused: focused.length === 1 ? focused[0].getAttribute('data-index') : null,
      identityValid: active.length === 1 && focused.length <= 1,
      toolbarCurrent: toolbar?.getAttribute('data-current-index') ?? null,
      toolbarDisplayed: toolbar?.getAttribute('data-focused-index') ?? null,
      itemRects: media.map(item => {
        const box = item.getBoundingClientRect();
        return { index: item.getAttribute('data-index'), top: box.top, height: box.height,
          id: item.getAttribute('data-media-id'),
          visible: Math.max(0, Math.min(box.bottom, rect.bottom) - Math.max(box.top, rect.top)) };
      }) };
  };
  const append = (list, row, cap) => {
    if (list.length < cap) list.push(row); else overflow = true;
  };
  const event = e => append(rows, { event: e.type, trusted: e.isTrusted, ...snapshot() }, 256);
  const trace = e => {
    try { append(product, JSON.parse(e.detail), 128); }
    catch { overflow = true; }
  };
  for (const name of ['scroll', 'scrollend', 'pointerdown', 'pointerup', 'wheel']) {
    items.addEventListener(name, event, { capture: true, passive: true });
  }
  window.addEventListener('xeg:gallery-scroll-trace', trace);
  document.documentElement.setAttribute('data-xeg-scroll-trace', '');
  const sample = () => {
    if (stopped) return;
    const now = performance.now();
    if (now - started > 12000) { overflow = true; stopped = true; return; }
    if (items.scrollTop !== lastTop) {
      append(frames, snapshot(), 512); lastTop = items.scrollTop;
    }
    raf = requestAnimationFrame(sample);
  };
  raf = requestAnimationFrame(sample);
  const probe = { rows, frames, product, snapshot,
    naturalBehavior: getComputedStyle(items).scrollBehavior,
    programStart: 0, dragStart: 0, pointerHeld: 0, dragMoveStart: 0, dragEnd: 0,
    mark(name) { this[name] = performance.now(); append(rows, { event: name, ...snapshot() }, 256); return null; },
    geometry() {
      const rect = items.getBoundingClientRect();
      const max = items.scrollHeight - items.clientHeight;
      const gutter = items.offsetWidth - items.clientWidth;
      const length = Math.max(20, items.clientHeight * items.clientHeight / items.scrollHeight);
      const track = items.clientHeight - length;
      const media = items.querySelectorAll('[data-gallery-element="item"]');
      const last = media.item(media.length - 1)?.getBoundingClientRect();
      const clearance = parseFloat(getComputedStyle(items).scrollPaddingBlockStart) || 0;
      const target = last ? Math.min(max, items.scrollTop + last.top - rect.top - clearance) : max;
      return { gutter, max, target, top: items.scrollTop, scrollbarWidth: getComputedStyle(items).scrollbarWidth,
        scrollendsBeforeInput: rows.filter(row => row.event === 'scrollend' && row.at >= this.programStart).length,
        from: { x: Math.floor(rect.left + items.clientLeft + items.clientWidth + gutter / 2),
          y: Math.floor(rect.top + items.clientTop + track * items.scrollTop / max + length / 2) },
        to: { x: Math.floor(rect.left + items.clientLeft + items.clientWidth + gutter / 2),
          y: Math.floor(rect.top + items.clientTop + track * 0.4 + length / 2) } };
    },
    enableSmooth() { items.style.scrollBehavior = 'smooth'; return null; },
    read() { return { naturalBehavior: this.naturalBehavior, programStart: this.programStart,
      dragStart: this.dragStart, pointerHeld: this.pointerHeld, dragMoveStart: this.dragMoveStart,
      dragEnd: this.dragEnd, rows, frames, product, overflow,
      current: snapshot() }; },
    stop() {
      stopped = true; cancelAnimationFrame(raf);
      for (const name of ['scroll', 'scrollend', 'pointerdown', 'pointerup', 'wheel']) {
        items.removeEventListener(name, event, true);
      }
      window.removeEventListener('xeg:gallery-scroll-trace', trace);
      items.style.scrollBehavior = prior.behavior;
      if (prior.marker === null) document.documentElement.removeAttribute('data-xeg-scroll-trace');
      else document.documentElement.setAttribute('data-xeg-scroll-trace', prior.marker);
      delete window.${PROBE};
      return null;
    }
  };
  window.${PROBE} = probe;
  gallery.focus({ preventScroll: true });
  return snapshot();
})()`;

type Sample = {
  at: number;
  top: number;
  width: number;
  viewportHeight: number;
  current: string | null;
  focused: string | null;
  identityValid: boolean;
};

type Tape = {
  naturalBehavior: string;
  programStart: number;
  dragStart: number;
  pointerHeld: number;
  dragMoveStart: number;
  dragEnd: number;
  overflow: boolean;
  rows: Array<Sample & { event: string; trusted?: boolean }>;
  frames: Sample[];
  product: Array<{
    event: string;
    at: number;
    decision?: string;
    reason?: string;
    userAt?: number;
    programmaticAt?: number;
  }>;
  current: Sample;
};

/** Resolves a runtime hypothesis; failure receipts retain the full bounded event tape. */
export async function runNativeScrollbarTakeover(
  driver: NativeScrollbarDriver,
  output: string
): Promise<Record<string, unknown>> {
  const receipt: Record<string, unknown> = { status: 'failed' };
  let viewport: Sample | undefined;
  let failure: unknown;
  let installed = false;
  try {
    viewport = (await driver.evaluate(INSTALL)) as Sample;
    installed = true;
    receipt.phase = 'baseline-navigation';
    await driver.press('Home');
    await driver.waitFor(
      `(() => { const p = window.${PROBE}; const last = p.rows.filter(row => row.event === 'scroll').at(-1);
        return p.snapshot().current === '0' && performance.now() - (last?.at ?? 0) > 180; })()`,
      'initial product Home identity and settled position'
    );
    receipt.baseline = await driver.evaluate(`window.${PROBE}.snapshot()`);
    await driver.evaluate(`window.${PROBE}.enableSmooth()`);
    await driver.screenshot('native-scrollbar-before.png');
    receipt.phase = 'programmatic-smooth-scroll';
    await driver.evaluate(`window.${PROBE}.mark('programStart')`);
    await driver.press('End');
    await driver.waitFor(
      `window.${PROBE}.frames.filter(row => row.at > window.${PROBE}.programStart && row.top > 10).length >= 3`,
      'native smooth scroll across multiple frames',
      2000
    );
    const geometry = (await driver.evaluate(`window.${PROBE}.geometry()`)) as {
      gutter: number;
      max: number;
      target: number;
      top: number;
      scrollendsBeforeInput: number;
      from: { x: number; y: number };
      to: { x: number; y: number };
    };
    receipt.dragGeometry = geometry;
    assert(geometry.gutter > 0, 'No exposed native scrollbar gutter');
    assert(geometry.max > 1000, 'Fixture does not provide a sufficiently long scroll');
    assert(geometry.target - geometry.top > 300, 'Programmatic scroll finished before takeover');
    assert.equal(
      geometry.scrollendsBeforeInput,
      0,
      'Programmatic scroll completed before native input'
    );
    receipt.phase = 'native-thumb-drag';
    await driver.evaluate(`window.${PROBE}.mark('dragStart')`);
    await driver.drag(geometry.from, geometry.to, async () => {
      await driver.evaluate(`window.${PROBE}.mark('pointerHeld')`);
      await delay(60);
      await driver.evaluate(`window.${PROBE}.mark('dragMoveStart')`);
    });
    await driver.evaluate(`window.${PROBE}.mark('dragEnd')`);
    await driver.waitFor(
      `(() => { const p = window.${PROBE}; const last = p.rows.filter(row => row.event === 'scroll').at(-1);
        const end = p.rows.filter(row => row.event === 'scrollend').at(-1);
        return last && end && end.at >= last.at && performance.now() - last.at > 180; })()`,
      'native thumb movement completion',
      2500
    );
    const manual = (await driver.evaluate(`window.${PROBE}.snapshot()`)) as Sample;
    receipt.manual = manual;
    await driver.screenshot('native-scrollbar-manual.png');
    receipt.phase = 'viewport-layout-correction';
    const resizeAt = (await driver.evaluate('performance.now()')) as number;
    await driver.resize(viewport.width, viewport.viewportHeight - 80);
    await driver.waitFor(
      `window.${PROBE}.product.some(row => row.event === 'viewport-decision' && row.at > ${resizeAt})`,
      'actual viewport correction decision'
    );
    await driver.waitFor(
      `(() => { const p = window.${PROBE}; const rows = p.rows.filter(row => row.event === 'scroll');
        return performance.now() - (rows.at(-1)?.at ?? p.dragEnd) > 180; })()`,
      'viewport/layout settling'
    );
    const tape = (await driver.evaluate(`window.${PROBE}.read()`)) as Tape;
    receipt.tape = tape;
    receipt.fixtureCondition = {
      naturalScrollBehavior: tape.naturalBehavior,
      smoothScroll: 'fixture scrollport CSS; product Home/End input invokes native scrollIntoView',
      input: 'native scrollbar gutter pointer drag; no wheel or scroll-position writes',
    };
    const decisions = tape.product.filter(
      (row) => row.event === 'viewport-decision' && row.at > resizeAt
    );
    const protectedIntent = decisions.some(
      (row) =>
        row.reason === 'user-scroll' &&
        typeof row.userAt === 'number' &&
        typeof row.programmaticAt === 'number' &&
        row.userAt > row.programmaticAt
    );
    const movedByDrag = tape.rows.some(
      (row) => row.event === 'scroll' && row.at >= tape.dragMoveStart && row.at <= tape.dragEnd
    );
    const thumbReachedTarget = Math.abs(manual.top - geometry.max * 0.4) < geometry.max * 0.1;
    const firstDisplacement = tape.rows.find(
      (row) => row.event === 'scroll' && row.at >= tape.dragMoveStart
    );
    receipt.analysis = {
      scrollendEvents: tape.rows
        .filter((row) => row.event === 'scrollend' && row.at >= tape.programStart)
        .map((row) => ({ at: row.at, top: row.top, duringDrag: row.at <= tape.dragEnd })),
      scrollendBeforePointerMove: tape.rows.some(
        (row) =>
          row.event === 'scrollend' && row.at >= tape.programStart && row.at < tape.dragMoveStart
      ),
      scrollendBeforeFirstDisplacementAfterPointerMove:
        firstDisplacement !== undefined &&
        tape.rows.some(
          (row) =>
            row.event === 'scrollend' &&
            row.at >= tape.programStart &&
            row.at < firstDisplacement.at
        ),
      nativeEventReason:
        'scrollend has no programmatic/cancellation reason; raw tape retains ordering',
      wheelEvents: tape.rows.filter((row) => row.event === 'wheel').length,
      displacementDuringNativePointerMove: movedByDrag,
      nativeThumbReachedRequestedTrackFraction: thumbReachedTarget,
      userIntentProtected: protectedIntent,
      positionDeltaAfterResize: tape.current.top - manual.top,
      ownershipObservation:
        'inferred from product viewport-decision timestamps and displayed focus',
    };
    await driver.screenshot('native-scrollbar-after-resize.png');
    assert(!tape.overflow, 'Native scrollbar observation exceeded its bounds');
    assert(movedByDrag, 'Native scrollbar drag did not establish manual displacement');
    assert(thumbReachedTarget, 'Pointer input did not establish the requested native thumb drag');
    assert.equal(tape.rows.filter((row) => row.event === 'wheel').length, 0);
    assert(
      manual.identityValid && tape.current.identityValid,
      'Media ownership markers are ambiguous'
    );
    assert.notEqual(manual.focused, null, 'Manual thumb movement did not establish focused media');
    assert.notEqual(
      manual.focused,
      manual.current,
      'Manual thumb movement did not update displayed focus'
    );
    assert(protectedIntent, 'Native thumb takeover did not update the product user-intent guard');
    assert.equal(
      tape.current.focused,
      manual.focused,
      'Layout correction changed the displayed item'
    );
    assert(
      Math.abs(tape.current.top - manual.top) <= 2,
      'Layout correction reclaimed the manual position'
    );
    receipt.status = 'passed';
  } catch (error) {
    failure = error;
    receipt.error = error instanceof Error ? error.message : String(error);
    if (installed) {
      try {
        receipt.tape = await driver.evaluate(`window.${PROBE}.read()`);
        await driver.screenshot('native-scrollbar-failure.png');
      } catch (observationError) {
        receipt.observationError = String(observationError);
      }
    }
  } finally {
    const cleanupErrors: string[] = [];
    if (installed) {
      try {
        await driver.evaluate(`window.${PROBE}.stop()`);
      } catch (error) {
        cleanupErrors.push(String(error));
      }
    }
    if (viewport) {
      try {
        await driver.resize(viewport.width, viewport.viewportHeight);
      } catch (error) {
        cleanupErrors.push(String(error));
      }
    }
    receipt.cleanupErrors = cleanupErrors;
    if (cleanupErrors.length) {
      receipt.status = 'failed';
    }
    await writeFile(
      join(output, 'native-scrollbar-takeover.json'),
      JSON.stringify(receipt, null, 2)
    );
    if (cleanupErrors.length && !failure) {
      failure = new Error('Scrollbar probe cleanup failed');
    }
  }
  if (failure) {
    throw failure;
  }
  return receipt;
}
