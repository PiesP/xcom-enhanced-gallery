// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';
import { afterEach, beforeEach, test, vi } from 'vite-plus/test';
import {
  beginSourceImagePaintAssertion,
  endSourceImagePaintAssertion,
  finishSourceImageTrace,
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
  const documentTarget = new EventTarget();
  const documentListeners = new Map<string, Set<EventListenerOrEventListenerObject>>();
  const documentAdd = documentTarget.addEventListener.bind(documentTarget);
  const documentRemove = documentTarget.removeEventListener.bind(documentTarget);
  const doc = Object.assign(documentTarget, {
    documentElement: root,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      const members = documentListeners.get(type) ?? new Set();
      members.add(listener);
      documentListeners.set(type, members);
      documentAdd(type, listener);
    },
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject) {
      documentListeners.get(type)?.delete(listener);
      documentRemove(type, listener);
    },
  });
  vi.stubGlobal('document', doc);
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
  return { page, win, attributes, listeners, emit, doc, documentListeners };
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

test('complete assertion coverage does not certify unavailable item identity', async () => {
  const { page } = tracePage();
  await startSourceImageTrace(page, 1);
  await beginSourceImagePaintAssertion(page, {
    id: 'initial',
    startedAtEpochMs: Date.now(),
    deadlineAtEpochMs: Date.now() + 5_000,
  });
  await endSourceImagePaintAssertion(page, {
    id: 'initial',
    endedAtEpochMs: Date.now(),
    status: 'passed',
  });
  const trace = await finishSourceImageTrace(page);
  const snapshot = trace.samples[0]?.state as {
    identityValid: boolean;
    activeMediaId: string | null;
  };
  assert.equal(trace.coverageComplete, true);
  assert.equal(snapshot.identityValid, false);
  assert.equal(snapshot.activeMediaId, null);
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

test('readiness image observer records capture and microtask phases and removes listeners', async () => {
  const { page, doc, documentListeners } = tracePage();
  await startSourceImageTrace(page, 1, true);
  const image = Object.assign(new HTMLImageElement(), {
    src: 'https://pbs.twimg.com/media/test?name=orig',
    currentSrc: '',
    complete: false,
    naturalWidth: 0,
    naturalHeight: 0,
    closest: () => null,
  });
  const event = new Event('load');
  Object.defineProperty(event, 'target', { value: image });
  doc.dispatchEvent(event);
  Object.assign(image, {
    currentSrc: image.src,
    complete: true,
    naturalWidth: 480,
    naturalHeight: 320,
  });
  await Promise.resolve();
  const trace = await finishSourceImageTrace(page);
  assert.deepEqual(
    trace.imageEvents.map(({ phase, complete, trusted }) => ({ phase, complete, trusted })),
    [
      { phase: 'capture', complete: false, trusted: false },
      { phase: 'microtask', complete: true, trusted: false },
    ]
  );
  assert.equal(documentListeners.get('load')?.size, 0);
  assert.equal(documentListeners.get('error')?.size, 0);
  assert.equal(vi.getTimerCount(), 0);
  // Synthetic events test the observer lifecycle, never native product acceptance.
  assert.equal(trace.zeroReadyAtMs, null);
});

test('initial readiness inventory overflow disarms before scheduling any observation work', async () => {
  const { page, doc, attributes, documentListeners } = tracePage();
  Object.assign(doc, {
    querySelectorAll: () =>
      Array.from({ length: 33 }, () => ({
        src: 'fixture',
        currentSrc: '',
        complete: false,
        naturalWidth: 0,
        naturalHeight: 0,
      })),
  });
  await startSourceImageTrace(page, 1, true);
  const trace = await finishSourceImageTrace(page);
  assert.equal(trace.overflow, true);
  assert.equal(trace.imageOverflow, true);
  assert.equal(trace.stopReason, 'image-inventory-overflow');
  assert.equal(trace.coverageComplete, false);
  assert.equal(attributes.size, 0);
  assert.equal(documentListeners.get('load')?.size, 0);
  assert.equal(documentListeners.get('error')?.size, 0);
  assert.equal(vi.getTimerCount(), 0);
});

test('semantic image mutation timestamps observed readiness before a later frame and disconnects', async () => {
  const { page, doc } = tracePage();
  let loaded = 'false';
  const image = Object.assign(new HTMLImageElement(), {
    src: 'https://pbs.twimg.com/media/zero?name=orig',
    currentSrc: 'https://pbs.twimg.com/media/zero?name=orig',
    complete: true,
    naturalWidth: 480,
    naturalHeight: 320,
    getAttribute: () => null,
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      right: 480,
      bottom: 320,
      width: 480,
      height: 320,
    }),
  });
  class ObservedElement {
    firstElementChild = null;
    getAttribute(name: string) {
      return name === 'data-gallery-element'
        ? 'item'
        : name === 'data-index'
          ? '0'
          : name === 'data-media-loaded'
            ? loaded
            : name === 'data-media-id'
              ? 'zero'
              : null;
    }
    querySelector() {
      return image;
    }
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 480, bottom: 320, width: 480, height: 320 };
    }
  }
  const item = new ObservedElement();
  const gallery = { querySelector: () => null, querySelectorAll: () => [item] };
  Object.assign(doc, { querySelector: () => gallery });
  vi.stubGlobal('Element', ObservedElement);
  vi.stubGlobal('getComputedStyle', () => ({ zoom: '1', getPropertyValue: () => '' }));
  let notify: MutationCallback | undefined;
  const disconnect = vi.fn();
  vi.stubGlobal(
    'MutationObserver',
    class {
      constructor(callback: MutationCallback) {
        notify = callback;
      }
      observe() {}
      disconnect = disconnect;
    }
  );
  await startSourceImageTrace(page, 1, true);
  loaded = 'true';
  vi.setSystemTime(origin + 101);
  assert(notify);
  notify([{ target: item } as unknown as MutationRecord], {} as MutationObserver);
  const zeroAt = await page.evaluate(
    () =>
      (window as Window & { __xegSourceImageTrace?: { zeroReadyAtMs: number | null } })
        .__xegSourceImageTrace?.zeroReadyAtMs
  );
  assert.equal(zeroAt, 101);
  const trace = await finishSourceImageTrace(page);
  assert.equal(trace.zeroReadyAtMs, 101);
  assert.equal(
    trace.imageEvents.length,
    0,
    'a semantic DOM change does not invent a native load event'
  );
  assert.equal(disconnect.mock.calls.length, 1);
  assert.equal(vi.getTimerCount(), 0);
});
