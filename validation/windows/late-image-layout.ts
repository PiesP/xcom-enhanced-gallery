// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import type { Page, Route } from '@playwright/test';
import { observedSelectedAlignment } from './source-image-trace.ts';

type AlignmentFrame = Parameters<typeof observedSelectedAlignment>[1][number];
interface Rect {
  width: number;
  height: number;
}
interface ImageState {
  src: string;
  currentSrc: string;
  complete: boolean;
  naturalWidth: number;
  naturalHeight: number;
}
interface ItemState {
  index: string | null;
  mediaId: string | null;
  loaded: string | null;
  item: Rect;
  wrapper: Rect | null;
  image: ImageState | null;
}
interface Frame {
  atMs: number;
  state: {
    itemCount: number;
    items: ItemState[];
    hostImageCount: number;
    hostImages: ImageState[];
    fitMode: string | null;
    viewport: {
      width: number;
      height: number;
      devicePixelRatio: number;
      visualViewportScale: number;
      htmlZoom: string;
    };
  };
}
export interface LayoutTraceState {
  startedAtMs: number;
  nowMs: number;
  stopped: boolean;
  stopReason: string | null;
  overflow: boolean;
  productOverflow: boolean;
  productMalformedCount: number;
  imageOverflow: boolean;
  zeroReadyAtMs: number | null;
  imageEvents: Array<Record<string, unknown>>;
  productEvents: Array<Record<string, unknown>>;
  alignmentFrames: AlignmentFrame[];
  readinessFrames: Frame[];
}
interface Expected {
  urls: readonly [string, string, string];
  mediaIds: readonly [string, string, string];
}
interface HeldResponse {
  index: 0 | 2;
  url: string;
  requests: number;
  heldAtEpochMs: number | null;
  resourceType: string | null;
  releasedAtEpochMs: number | null;
  settled: boolean;
  installed: boolean;
  removed: boolean;
}
export interface LateLayoutReceipt {
  status: 'pending' | 'passed' | 'inconclusive';
  reason: string | null;
  initial: LayoutTraceState | null;
  after: LayoutTraceState | null;
  examined: LayoutTraceState | null;
  alignment: 'preserved' | 'eligible-product-alignment' | null;
  postLoadAlignmentCalls: number;
  routes: HeldResponse[];
  pendingRoutes: number;
  closed: boolean;
  errors: string[];
}

/** Existing identity/geometry gate plus complete fixture state; never triggers scrolling. */
export function lateLayoutProblem(
  state: LayoutTraceState,
  expected: Expected,
  phase: 'initial' | 'loaded',
  initial?: LayoutTraceState
): string | null {
  if (state.nowMs - state.startedAtMs >= 5_000) {
    return 'readiness-deadline';
  }
  if (state.stopped) {
    return `trace-stopped:${state.stopReason}`;
  }
  if (state.overflow || state.productOverflow || state.imageOverflow) {
    return 'trace-overflow';
  }
  if (state.productMalformedCount !== 0) {
    return 'malformed-product-event';
  }
  if (!observedSelectedAlignment(state.productEvents, state.alignmentFrames, expected.urls[1])) {
    return 'selected-identity-or-geometry-not-aligned';
  }
  if (state.readinessFrames.length !== 2) {
    return 'two-layout-frames-missing';
  }
  for (const frame of state.readinessFrames) {
    const { items, hostImages, viewport } = frame.state;
    if (
      frame.state.itemCount !== 3 ||
      items.length !== 3 ||
      items.some(
        (item, index) => item.index !== String(index) || item.mediaId !== expected.mediaIds[index]
      )
    ) {
      return 'three-item-identity-mismatch';
    }
    if (
      frame.state.hostImageCount !== 15 ||
      hostImages.length !== 15 ||
      hostImages.some(
        (image) => !image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0
      )
    ) {
      return 'host-image-inventory-not-ready';
    }
    if (
      frame.state.fitMode !== 'fitWidth' ||
      viewport.width !== 1280 ||
      viewport.height !== 800 ||
      viewport.devicePixelRatio !== 1 ||
      viewport.visualViewportScale !== 1 ||
      viewport.htmlZoom !== '1'
    ) {
      return 'viewport-or-fit-drift';
    }
    for (const index of [0, 1, 2]) {
      const item = items[index]!;
      const image = item.image;
      if (!image || image.src !== expected.urls[index]) {
        return 'image-source-mismatch';
      }
      if (phase === 'loaded' && index === 0) {
        if (
          item.loaded !== 'true' ||
          !image.complete ||
          image.currentSrc !== expected.urls[0] ||
          image.naturalWidth !== 480 ||
          image.naturalHeight !== 320
        ) {
          return 'index0-not-semantically-loaded';
        }
      } else if (
        item.loaded !== 'false' ||
        image.complete ||
        image.naturalWidth !== 0 ||
        image.naturalHeight !== 0 ||
        (image.currentSrc !== '' && image.currentSrc !== expected.urls[index])
      ) {
        return `index${index}-original-not-pending`;
      }
    }
  }
  if (phase === 'initial') {
    return null;
  }
  const zeroAt = state.zeroReadyAtMs;
  if (zeroAt === null || state.readinessFrames.some((frame) => frame.atMs <= zeroAt)) {
    return 'two-post-semantic-layout-frames-missing';
  }
  const nativeLoad = state.imageEvents.find(
    (event) =>
      event.event === 'load' &&
      event.phase === 'capture' &&
      event.trusted === true &&
      event.index === '0' &&
      event.mediaId === expected.mediaIds[0] &&
      event.src === expected.urls[0] &&
      event.currentSrc === expected.urls[0] &&
      event.complete === true &&
      event.naturalWidth === 480 &&
      event.naturalHeight === 320 &&
      typeof event.atMs === 'number' &&
      initial !== undefined &&
      event.atMs >= initial.nowMs &&
      event.atMs <= zeroAt
  );
  if (!nativeLoad) {
    return 'trusted-index0-native-load-missing';
  }
  if (state.imageEvents.some((event) => event.index === '1' || event.index === '2')) {
    return 'selected-or-neighbor-completed-before-transition';
  }
  const before = initial?.readinessFrames.at(-1)?.state.items[0];
  if (!before?.wrapper) {
    return 'initial-footprint-missing';
  }
  for (const frame of state.readinessFrames) {
    const after = frame.state.items[0]!;
    if (
      !after.wrapper ||
      ['width', 'height'].some((key) => {
        const axis = key as 'width' | 'height';
        return (
          Math.abs(before.item[axis] - after.item[axis]) > 2 ||
          Math.abs(before.wrapper![axis] - after.wrapper![axis]) > 2
        );
      })
    ) {
      return 'index0-pending-loaded-footprint-mismatch';
    }
  }
  const beforeAnchor = initial?.alignmentFrames.at(-1);
  const afterAnchor = state.alignmentFrames.at(-1);
  if (
    beforeAnchor &&
    afterAnchor &&
    beforeAnchor.scrollTop !== null &&
    afterAnchor.scrollTop !== null &&
    Math.abs(beforeAnchor.scrollTop - afterAnchor.scrollTop) > 2
  ) {
    const decision = state.productEvents.find(
      (event) =>
        event.event === 'viewport-decision' &&
        event.decision === 'accepted' &&
        event.reason === 'eligible' &&
        event.index === 1 &&
        event.currentIndex === 1 &&
        event.focusedIndex === 1 &&
        event.visible === true &&
        typeof event.userAt === 'number' &&
        typeof event.programmaticAt === 'number' &&
        event.userAt <= event.programmaticAt &&
        typeof event.at === 'number' &&
        event.at > zeroAt
    );
    if (
      !decision ||
      !state.productEvents.some(
        (event) =>
          event.event === 'align-done' &&
          event.index === 1 &&
          typeof event.at === 'number' &&
          event.at >= (decision.at as number) &&
          event.at < state.alignmentFrames[0]!.atMs
      )
    ) {
      return 'anchor-changed-without-eligible-product-repair';
    }
  }
  // A post-load alignment event is unnecessary when consistent sizing preserves the existing anchor.
  return null;
}

/** Own two exact response holds; release index 0 after genuine initial product alignment. */
export function createLateImageLayoutProbe(options: Expected & { page: Page }) {
  const { page } = options;
  const records: HeldResponse[] = ([0, 2] as const).map((index) => ({
    index,
    url: options.urls[index],
    requests: 0,
    heldAtEpochMs: null,
    resourceType: null,
    releasedAtEpochMs: null,
    settled: false,
    installed: false,
    removed: false,
  }));
  const holds = records.map(() => Promise.withResolvers<void>());
  const tasks = new Set<Promise<void>>();
  const state: LateLayoutReceipt = {
    status: 'pending',
    reason: null,
    initial: null,
    after: null,
    examined: null,
    alignment: null,
    postLoadAlignmentCalls: 0,
    routes: records,
    pendingRoutes: 0,
    closed: false,
    errors: [],
  };
  let installed = false;
  let waiting: Promise<LateLayoutReceipt> | null = null;
  let closing: Promise<LateLayoutReceipt> | null = null;
  const snapshot = (): LateLayoutReceipt =>
    structuredClone({ ...state, pendingRoutes: tasks.size });
  const release = (position: number): void => {
    const record = records[position]!;
    if (record.releasedAtEpochMs !== null) {
      return;
    }
    record.releasedAtEpochMs = Date.now();
    holds[position]!.resolve();
  };
  const handlers = records.map((record, position) => (route: Route): Promise<void> => {
    record.requests += 1;
    if (record.requests > 8) {
      state.errors.push(`index${record.index}-request-bound`);
      return route.abort();
    }
    const first = record.requests === 1 && !state.closed;
    if (first) {
      record.heldAtEpochMs = Date.now();
      record.resourceType = route.request().resourceType();
    }
    const task = (async () => {
      try {
        if (first) {
          await holds[position]!.promise;
        }
        await route.fallback();
        if (first) {
          record.settled = true;
        }
      } catch (error) {
        state.errors.push(`index${record.index}-route:${String(error)}`);
      }
    })();
    tasks.add(task);
    void task.finally(() => tasks.delete(task));
    return task;
  });
  const install = async (): Promise<void> => {
    if (installed || state.closed) {
      throw new Error('Late-layout probe has already been installed or closed');
    }
    // Mark ownership before registration so partial installation is retired by close().
    installed = true;
    for (let position = 0; position < records.length; position += 1) {
      await page.route(records[position]!.url, handlers[position]!);
      records[position]!.installed = true;
    }
  };
  const read = (): Promise<LayoutTraceState> =>
    page.evaluate(() => {
      const trace = (window as Window & { __xegSourceImageTrace?: LayoutTraceState })
        .__xegSourceImageTrace;
      if (!trace) {
        throw new Error('Late-layout trace is missing');
      }
      return {
        startedAtMs: trace.startedAtMs,
        nowMs: performance.now(),
        stopped: trace.stopped,
        stopReason: trace.stopReason,
        overflow: trace.overflow,
        productOverflow: trace.productOverflow,
        productMalformedCount: trace.productMalformedCount,
        imageOverflow: trace.imageOverflow,
        zeroReadyAtMs: trace.zeroReadyAtMs,
        imageEvents: trace.imageEvents,
        productEvents: trace.productEvents,
        alignmentFrames: trace.alignmentFrames,
        readinessFrames: trace.readinessFrames,
      };
    });
  const waitForTransition = (): Promise<LateLayoutReceipt> => {
    if (waiting) {
      return waiting;
    }
    waiting = (async () => {
      try {
        for (let observation = 0; observation < 720; observation += 1) {
          if (state.closed) {
            throw new Error('probe-closed-before-transition');
          }
          const observed = await read();
          state.examined = observed;
          const phase = state.initial ? 'loaded' : 'initial';
          if (phase === 'loaded') {
            state.after = observed;
          }
          if (observed.nowMs - observed.startedAtMs >= 5_000) {
            state.reason = 'readiness-deadline';
            break;
          }
          state.reason = state.errors.length
            ? 'owned-route-error'
            : records.some(
                  (record) =>
                    record.requests !== 1 ||
                    record.resourceType !== 'image' ||
                    record.heldAtEpochMs === null
                )
              ? 'two-exact-image-requests-not-held'
              : lateLayoutProblem(observed, options, phase, state.initial ?? undefined);
          if (state.reason === null) {
            if (phase === 'initial') {
              state.initial = observed;
              release(0);
            } else {
              state.status = 'passed';
              state.postLoadAlignmentCalls = observed.productEvents.filter(
                (event) =>
                  event.event === 'align-done' &&
                  event.index === 1 &&
                  typeof event.at === 'number' &&
                  event.at > observed.zeroReadyAtMs!
              ).length;
              const before = state.initial!.alignmentFrames.at(-1)!;
              const after = observed.alignmentFrames.at(-1)!;
              state.alignment =
                before.scrollTop === after.scrollTop &&
                Math.abs(before.itemTop! - after.itemTop!) <= 2
                  ? 'preserved'
                  : 'eligible-product-alignment';
              return snapshot();
            }
          }
          if (
            observed.stopped ||
            observed.overflow ||
            observed.productOverflow ||
            observed.imageOverflow ||
            observed.productMalformedCount ||
            observed.nowMs - observed.startedAtMs >= 5_000
          ) {
            break;
          }
          await page.evaluate(
            () =>
              new Promise<void>((resolve) => {
                const timer = setTimeout(resolve, 100);
                requestAnimationFrame(() => {
                  clearTimeout(timer);
                  resolve();
                });
              })
          );
        }
        state.status = 'inconclusive';
      } catch (error) {
        state.status = 'inconclusive';
        state.reason = String(error);
      }
      return snapshot();
    })();
    return waiting;
  };
  const close = (): Promise<LateLayoutReceipt> => {
    if (closing) {
      return closing;
    }
    state.closed = true;
    release(0);
    release(1);
    closing = (async () => {
      await Promise.allSettled([...tasks]);
      if (installed) {
        for (let position = 0; position < records.length; position += 1) {
          if (!records[position]!.installed) {
            continue;
          }
          try {
            await page.unroute(records[position]!.url, handlers[position]!);
            records[position]!.removed = true;
          } catch (error) {
            state.errors.push(`unroute:${String(error)}`);
          }
        }
      }
      await Promise.allSettled([...tasks]);
      if (waiting) {
        await waiting;
      }
      return snapshot();
    })();
    return closing;
  };
  return { install, waitForTransition, snapshot, close, releaseNeighbor: () => release(1) };
}
