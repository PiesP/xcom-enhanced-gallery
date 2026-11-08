// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

// Protocol/ownership contracts only. The Playwright late-image-layout spec exercises real CSS and native decoding.
import assert from 'node:assert/strict';
import type { Page, Route } from '@playwright/test';
import { afterEach, test, vi } from 'vite-plus/test';
import { waitForRecoveryPaint } from './install-profile.ts';
import {
  createLateImageLayoutProbe,
  lateLayoutProblem,
  type LayoutTraceState,
} from './late-image-layout.ts';

const expected = {
  urls: [
    'https://pbs.twimg.com/media/zero?name=orig',
    'https://pbs.twimg.com/media/selected?name=orig',
    'https://pbs.twimg.com/media/neighbor?name=orig',
  ],
  mediaIds: ['zero', 'selected', 'neighbor'],
} as const;

function trace(loaded: boolean): LayoutTraceState {
  const image = (index: number, ready: boolean) => ({
    src: expected.urls[index]!,
    currentSrc: ready ? expected.urls[index]! : '',
    complete: ready,
    naturalWidth: ready ? 480 : 0,
    naturalHeight: ready ? 320 : 0,
  });
  const anchor = (atMs: number) => ({
    atMs,
    identityValid: true,
    selectedMediaId: 'selected',
    activeMediaId: 'selected',
    focusedMediaId: 'selected',
    selectedIndex: '1',
    currentIndex: '1',
    focusedIndex: '1',
    imageSrc: expected.urls[1],
    itemTop: 128,
    portTop: 0,
    portBottom: 800,
    scrollTop: 354,
    clearance: 128,
  });
  const frame = (atMs: number) => ({
    atMs,
    state: {
      itemCount: 3,
      items: [0, 1, 2].map((index) => ({
        index: String(index),
        mediaId: expected.mediaIds[index]!,
        loaded: loaded && index === 0 ? 'true' : 'false',
        item: { width: 498, height: 338 },
        wrapper: { width: 480, height: 320 },
        image: image(index, loaded && index === 0),
      })),
      hostImageCount: 15,
      hostImages: Array.from({ length: 15 }, () => image(0, true)),
      fitMode: 'fitWidth',
      viewport: {
        width: 1280,
        height: 800,
        devicePixelRatio: 1,
        visualViewportScale: 1,
        htmlZoom: '1',
      },
    },
  });
  const decision = (at: number) => ({
    event: 'viewport-decision',
    at,
    index: 1,
    currentIndex: 1,
    focusedIndex: 1,
    decision: 'accepted',
    reason: 'eligible',
    visible: true,
    userAt: 0,
    programmaticAt: 1,
  });
  return {
    startedAtMs: 0,
    nowMs: loaded ? 200 : 100,
    stopped: false,
    stopReason: null,
    overflow: false,
    productOverflow: false,
    productMalformedCount: 0,
    imageOverflow: false,
    zeroReadyAtMs: loaded ? 150 : null,
    productEvents: [decision(20), decision(40), { event: 'align-done', at: 41, index: 1 }],
    imageEvents: loaded
      ? [
          {
            event: 'load',
            phase: 'capture',
            atMs: 149,
            trusted: true,
            complete: true,
            index: '0',
            mediaId: 'zero',
            src: expected.urls[0],
            currentSrc: expected.urls[0],
            naturalWidth: 480,
            naturalHeight: 320,
          },
        ]
      : [],
    alignmentFrames: [anchor(loaded ? 160 : 60), anchor(loaded ? 180 : 70)],
    readinessFrames: [frame(loaded ? 160 : 60), frame(loaded ? 180 : 70)],
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

test('behavioral readiness accepts a preserved anchor without inventing a post-load alignment', () => {
  const initial = trace(false),
    after = trace(true);
  assert.equal(lateLayoutProblem(initial, expected, 'initial'), null);
  assert.equal(lateLayoutProblem(after, expected, 'loaded', initial), null);
  assert(after.productEvents.every((event) => Number(event.at) < after.zeroReadyAtMs!));
});

test('native browser anchoring cannot conceal the pending-versus-loaded reservation mismatch', () => {
  const initial = trace(false),
    after = trace(true);
  for (const frame of initial.readinessFrames) {
    frame.state.items[0]!.item = { width: 1272, height: 854 };
    frame.state.items[0]!.wrapper = { width: 1254, height: 836 };
  }
  assert.equal(
    lateLayoutProblem(after, expected, 'loaded', initial),
    'index0-pending-loaded-footprint-mismatch'
  );
});

test('missing native provenance, semantic frames and borrowed identities remain invalid separately', () => {
  const initial = trace(false),
    after = trace(true);
  after.imageEvents[0]!.trusted = false;
  assert.equal(
    lateLayoutProblem(after, expected, 'loaded', initial),
    'trusted-index0-native-load-missing'
  );
  after.imageEvents[0]!.trusted = true;
  after.zeroReadyAtMs = 170;
  assert.equal(
    lateLayoutProblem(after, expected, 'loaded', initial),
    'two-post-semantic-layout-frames-missing'
  );
  after.zeroReadyAtMs = 150;
  after.alignmentFrames[1]!.focusedMediaId = 'neighbor';
  assert.equal(
    lateLayoutProblem(after, expected, 'loaded', initial),
    'selected-identity-or-geometry-not-aligned'
  );
});

test('fixture/viewport drift, early selected completion and incomplete observation are rejected', () => {
  for (const change of [
    (state: LayoutTraceState) => {
      state.readinessFrames[0]!.state.hostImages[0]!.complete = false;
    },
    (state: LayoutTraceState) => {
      state.readinessFrames[0]!.state.viewport.htmlZoom = '1.25';
    },
    (state: LayoutTraceState) => {
      state.readinessFrames[0]!.state.items[1]!.image!.complete = true;
    },
    (state: LayoutTraceState) => {
      state.overflow = true;
    },
    (state: LayoutTraceState) => {
      state.productMalformedCount = 1;
    },
  ]) {
    const state = trace(true);
    change(state);
    assert.notEqual(lateLayoutProblem(state, expected, 'loaded', trace(false)), null);
  }
});

function harness(failSecondInstall = false, initialNow = 100, postNow = 200) {
  let observed = trace(false),
    now = initialNow;
  const handlers = new Map<string, (route: Route) => Promise<void>>();
  const unroute = vi.fn(async () => {});
  const page = {
    route: vi.fn(async (url: string, handler: (route: Route) => Promise<void>) => {
      if (failSecondInstall && url === expected.urls[2]) {
        throw new Error('second registration denied');
      }
      handlers.set(url, handler);
    }),
    unroute,
    evaluate: async <T>(fn: () => T) => fn(),
  } as unknown as Page;
  const win = {};
  Object.defineProperty(win, '__xegSourceImageTrace', { get: () => observed });
  vi.stubGlobal('window', win);
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (callback: () => void) => {
    now += 16;
    callback();
  });
  const probe = createLateImageLayoutProbe({ page, ...expected });
  const request = (index: 0 | 2) => {
    const fallback = vi.fn(async () => {
      if (index === 0) {
        observed = trace(true);
        now = postNow;
      }
    });
    const pending = handlers.get(expected.urls[index])!({
      request: () => ({ resourceType: () => 'image' }),
      fallback,
    } as unknown as Route);
    return { pending, fallback };
  };
  return { probe, request, unroute };
}

test('two owned holds release zero after initial alignment and keep neighbor pending through the transition', async () => {
  const { probe, request, unroute } = harness();
  await probe.install();
  const zero = request(0),
    neighbor = request(2);
  const outcome = await probe.waitForTransition();
  assert.equal(outcome.status, 'passed');
  assert.equal(outcome.alignment, 'preserved');
  assert.equal(zero.fallback.mock.calls.length, 1);
  assert.equal(neighbor.fallback.mock.calls.length, 0);
  probe.releaseNeighbor();
  await neighbor.pending;
  const closed = await probe.close();
  await zero.pending;
  assert.equal(closed.pendingRoutes, 0);
  assert.deepEqual(closed.errors, []);
  assert(closed.routes.every((route) => route.removed));
  assert.equal(unroute.mock.calls.length, 2);
  assert.deepEqual(await probe.close(), closed);
});

test('partial route installation is safely retired without claiming an unacquired owner', async () => {
  const { probe, unroute } = harness(true);
  await assert.rejects(probe.install(), /second registration denied/);
  const closed = await probe.close();
  assert.equal(closed.routes[0]!.removed, true);
  assert.equal(closed.routes[1]!.installed, false);
  assert.equal(closed.routes[1]!.removed, false);
  assert.equal(unroute.mock.calls.length, 1);
});

test.each(['initial', 'loaded'] as const)(
  'the five-second bound precedes %s qualification and response release',
  async (phase) => {
    const { probe, request } = harness(false, phase === 'initial' ? 5000 : 100, 5000);
    await probe.install();
    const zero = request(0),
      neighbor = request(2);
    const result = await probe.waitForTransition();
    assert.equal(result.status, 'inconclusive');
    assert.equal(result.reason, 'readiness-deadline');
    assert.equal(zero.fallback.mock.calls.length, phase === 'initial' ? 0 : 1);
    assert.equal(neighbor.fallback.mock.calls.length, 0);
    await probe.close();
    await Promise.all([zero.pending, neighbor.pending]);
  }
);

test('the unchanged five-second paint owner retains its exact failed snapshot', async () => {
  vi.useFakeTimers();
  const last = { painted: false, targets: [{ hitTarget: false, bounds: { top: -379 } }] };
  const page = { evaluate: vi.fn(async () => last) } as unknown as Page;
  const observed = waitForRecoveryPaint(page, 1, 'retained failed recovery').catch(
    (error: unknown) => error
  );
  await vi.advanceTimersByTimeAsync(5000);
  const failure = await observed;
  assert(failure instanceof Error && 'paintSnapshot' in failure);
  assert.equal(failure.paintSnapshot, last);
});
