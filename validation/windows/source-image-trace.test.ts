// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import { afterEach, beforeEach, test, vi } from 'vite-plus/test';
import {
  beginSourceImagePaintAssertion,
  endSourceImagePaintAssertion,
  finishSourceImageTrace,
  observedSelectedAlignment,
  startSourceImageTrace,
} from './source-image-trace.ts';

const origin = 1_700_000_000_000;

function tracePage() {
  const attributes = new Set<string>();
  const listeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  const target = new EventTarget();
  const nativeAdd = target.addEventListener.bind(target);
  const nativeRemove = target.removeEventListener.bind(target);
  const win = Object.assign(target, {
    setTimeout: globalThis.setTimeout.bind(globalThis),
    clearTimeout: globalThis.clearTimeout.bind(globalThis),
    requestAnimationFrame: (callback: FrameRequestCallback) =>
      globalThis.setTimeout(() => callback(Date.now() - origin), 16),
    cancelAnimationFrame: (id: number) => globalThis.clearTimeout(id),
    addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      const members = listeners.get(type) ?? new Set();
      members.add(listener);
      listeners.set(type, members);
      nativeAdd(type, listener);
    },
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      listeners.get(type)?.delete(listener);
      nativeRemove(type, listener);
    },
  });
  const root = {
    setAttribute: (name: string) => attributes.add(name),
    removeAttribute: (name: string) => attributes.delete(name),
  };
  vi.stubGlobal('window', win);
  vi.stubGlobal('document', { documentElement: root, querySelector: () => null });
  vi.stubGlobal('performance', { timeOrigin: origin, now: () => Date.now() - origin });
  vi.stubGlobal('requestAnimationFrame', win.requestAnimationFrame);
  vi.stubGlobal('scrollX', 0);
  vi.stubGlobal('scrollY', 0);
  vi.stubGlobal('innerWidth', 1000);
  vi.stubGlobal('innerHeight', 700);
  vi.stubGlobal('devicePixelRatio', 1);
  vi.stubGlobal('visualViewport', null);
  vi.stubGlobal('getComputedStyle', () => ({ zoom: '1' }));
  vi.stubGlobal('HTMLImageElement', class {});
  vi.stubGlobal(
    'CustomEvent',
    class<T> extends Event {
      detail: T;
      constructor(type: string, init: { detail: T }) {
        super(type);
        this.detail = init.detail;
      }
    }
  );
  const page = {
    evaluate: async <T, A>(callback: (arg: A) => T, arg: A) => callback(arg),
  } as unknown as Page;
  const emit = (detail: string) =>
    win.dispatchEvent(new CustomEvent('xeg:gallery-scroll-trace', { detail }));
  return { page, win, attributes, listeners, emit };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(origin);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test('actual trace covers a paint deadline that extends beyond the old before-click timeout', async () => {
  const { page, win, attributes, listeners, emit } = tracePage();
  await startSourceImageTrace(page, 1);
  assert(attributes.has('data-xeg-scroll-trace'));
  assert.equal(listeners.get('xeg:gallery-scroll-trace')?.size, 1);
  await vi.advanceTimersByTimeAsync(5_500);
  const startedAtEpochMs = Date.now();
  await beginSourceImagePaintAssertion(page, {
    id: 'initial',
    startedAtEpochMs,
    deadlineAtEpochMs: startedAtEpochMs + 5_000,
  });
  emit('{"event":"viewport-realign-guard","index":1}');
  await vi.advanceTimersByTimeAsync(5_000);
  await endSourceImagePaintAssertion(page, {
    id: 'initial',
    endedAtEpochMs: Date.now(),
    status: 'failed',
  });
  await beginSourceImagePaintAssertion(page, {
    id: 'exhausted',
    startedAtEpochMs: Date.now(),
    deadlineAtEpochMs: Date.now() + 5_000,
  });
  await endSourceImagePaintAssertion(page, {
    id: 'exhausted',
    endedAtEpochMs: Date.now(),
    status: 'passed',
  });
  const trace = await finishSourceImageTrace(page);
  assert.equal(trace.stopReason, 'finished');
  assert.equal(trace.stoppedAtMs, 10_500);
  assert.equal(trace.coverageComplete, true);
  assert.deepEqual(
    trace.paintAssertions.map(({ id, status, coverageComplete }) => ({
      id,
      status,
      coverageComplete,
    })),
    [
      { id: 'initial', status: 'failed', coverageComplete: true },
      { id: 'exhausted', status: 'passed', coverageComplete: true },
    ]
  );
  assert.equal(trace.paintAssertions[0]?.deadlineAtEpochMs, origin + 10_500);
  assert.equal(trace.paintAssertions[0]?.traceStartedAtEpochMs, origin);
  assert.equal(trace.paintAssertions[0]?.budgetMs, 5_000);
  assert.equal(trace.paintAssertions[0]?.deadlineReached, true);
  assert.equal(trace.paintAssertions[1]?.deadlineReached, false);
  assert.deepEqual(trace.productEvents, [{ event: 'viewport-realign-guard', index: 1 }]);
  assert.equal(attributes.size, 0);
  assert.equal(listeners.get('xeg:gallery-scroll-trace')?.size, 0);
  assert.equal(vi.getTimerCount(), 0);
  assert.equal(
    (win as typeof win & { __xegSourceImageTrace?: unknown }).__xegSourceImageTrace,
    undefined
  );
});

test('active marker cannot claim coverage of an assertion started before trace installation', async () => {
  const { page } = tracePage();
  await startSourceImageTrace(page, 1);
  await beginSourceImagePaintAssertion(page, {
    id: 'initial',
    startedAtEpochMs: origin - 1,
    deadlineAtEpochMs: origin + 4_999,
  });
  await endSourceImagePaintAssertion(page, {
    id: 'initial',
    endedAtEpochMs: Date.now(),
    status: 'passed',
  });
  const trace = await finishSourceImageTrace(page);
  assert.equal(trace.paintAssertions[0]?.activeAtStart, true);
  assert.equal(trace.paintAssertions[0]?.activeAtEnd, true);
  assert.equal(trace.paintAssertions[0]?.coverageComplete, false);
  assert.equal(trace.coverageComplete, false);
});

test('snapshot binds active and focused indices to their DOM media identities', async () => {
  const { page } = tracePage();
  const documentElement = document.documentElement;
  const item = (index: string, mediaId: string) => ({
    getAttribute: (name: string) =>
      name === 'data-index' ? index : name === 'data-media-id' ? mediaId : null,
    querySelector: () => null,
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
    }),
  });
  const first = item('1', 'selected-media');
  const second = item('2', 'focused-media');
  const gallery = {
    querySelector: (selector: string) =>
      selector === '[data-gallery-element="toolbar"]'
        ? {
            getAttribute: (name: string) =>
              name === 'data-current-index' ? '1' : name === 'data-focused-index' ? '2' : null,
          }
        : selector === '[data-gallery-element="item"][data-index="1"]'
          ? first
          : null,
    querySelectorAll: () => [first, second],
  };
  vi.stubGlobal('document', {
    documentElement,
    querySelector: (selector: string) =>
      selector === '[data-xeg-gallery-container]' ? gallery : null,
  });
  await startSourceImageTrace(page, 1);
  const trace = await finishSourceImageTrace(page);
  const snapshot = trace.samples[0]?.state as {
    activeMediaId: string | null;
    focusedMediaId: string | null;
  };
  assert.equal(snapshot.activeMediaId, 'selected-media');
  assert.equal(snapshot.focusedMediaId, 'focused-media');
});

test('lifetime bound preserves partial assertion and tears down observation', async () => {
  const { page, attributes, listeners } = tracePage();
  await startSourceImageTrace(page, 1);
  await vi.advanceTimersByTimeAsync(12_000);
  await beginSourceImagePaintAssertion(page, {
    id: 'initial',
    startedAtEpochMs: Date.now(),
    deadlineAtEpochMs: Date.now() + 5_000,
  });
  await vi.advanceTimersByTimeAsync(3_000);
  await endSourceImagePaintAssertion(page, {
    id: 'initial',
    endedAtEpochMs: Date.now(),
    status: 'failed',
  });
  const trace = await finishSourceImageTrace(page);
  assert.equal(trace.stopReason, 'lifetime-bound');
  assert.equal(trace.stoppedAtMs, 15_000);
  assert.equal(trace.paintAssertions[0]?.activeAtEnd, false);
  assert.equal(trace.coverageComplete, false);
  assert.equal(attributes.size, 0);
  assert.equal(listeners.get('xeg:gallery-scroll-trace')?.size, 0);
  assert.equal(vi.getTimerCount(), 0);
});

test('missing end and malformed product event remain visible in the receipt', async () => {
  const { page, emit } = tracePage();
  await startSourceImageTrace(page, 1);
  await beginSourceImagePaintAssertion(page, {
    id: 'initial',
    startedAtEpochMs: Date.now(),
    deadlineAtEpochMs: Date.now() + 5_000,
  });
  emit('{invalid-json');
  const trace = await finishSourceImageTrace(page);
  assert.equal(trace.stopReason, 'malformed-product');
  assert.equal(trace.productMalformedCount, 1);
  assert.equal(trace.paintAssertions[0]?.endedAtMs, null);
  assert.equal(trace.coverageComplete, false);
});

test('product event cap retains bounded observations and reports overflow', async () => {
  const { page, emit } = tracePage();
  await startSourceImageTrace(page, 1);
  for (let index = 0; index <= 512; index += 1) {
    emit(JSON.stringify({ event: 'correction', index }));
  }
  const trace = await finishSourceImageTrace(page);
  assert.equal(trace.productLimit, 512);
  assert.equal(trace.productEvents.length, 512);
  assert.equal(trace.productEvents.at(-1)?.index, 511);
  assert.equal(trace.productOverflow, true);
  assert.equal(trace.stopReason, 'product-overflow');
  assert.equal(trace.coverageComplete, false);
});

test('DOM sample cap stops the actual owner and leaves no observation timers', async () => {
  const { page, win, attributes, listeners } = tracePage();
  await startSourceImageTrace(page, 1);
  const owner = win as typeof win & { __xegSourceImageTrace: { mark: (event: string) => void } };
  for (let index = 0; index < 192; index += 1) {
    owner.__xegSourceImageTrace.mark(`marker-${index}`);
  }
  const trace = await finishSourceImageTrace(page);
  assert.equal(trace.limit, 192);
  assert.equal(trace.samples.length, 192);
  assert.equal(trace.overflow, true);
  assert.equal(trace.stopReason, 'sample-overflow');
  assert.equal(attributes.size, 0);
  assert.equal(listeners.get('xeg:gallery-scroll-trace')?.size, 0);
  assert.equal(vi.getTimerCount(), 0);
});

test('alignment gate accepts actual eligible viewport decisions but rejects rejected decisions', () => {
  const decision = (at: number, accepted: boolean) => ({
    event: 'viewport-decision',
    decision: accepted ? 'accepted' : 'rejected',
    reason: 'eligible',
    visible: true,
    currentIndex: 1,
    focusedIndex: 1,
    userAt: 0,
    programmaticAt: 1,
    at,
  });
  const frame = (atMs: number) => ({
    atMs,
    selectedIndex: '1',
    currentIndex: '1',
    focusedIndex: '1',
    imageSrc: 'original',
    itemTop: 20,
    portTop: 10,
    portBottom: 100,
    scrollTop: 0,
    clearance: 10,
  });
  const frames = [frame(22), frame(23)];
  assert.equal(
    observedSelectedAlignment(
      [decision(10, true), decision(20, false), { event: 'align-done', index: 1, at: 21 }],
      frames,
      'original'
    ),
    null
  );
  const observed = observedSelectedAlignment(
    [decision(10, true), decision(20, true), { event: 'align-done', index: 1, at: 21 }],
    frames,
    'original'
  );
  assert.equal(observed?.secondGuardAtMs, 20);
});
