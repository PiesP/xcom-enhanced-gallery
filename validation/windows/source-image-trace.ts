// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import type { Page } from '@playwright/test';

type AlignmentFrame = {
  atMs: number;
  selectedIndex: string | null;
  currentIndex: string | null;
  focusedIndex: string | null;
  imageSrc: string | null;
  itemTop: number | null;
  portTop: number | null;
  portBottom: number | null;
  scrollTop: number | null;
  clearance: number | null;
};

type PaintAssertion = {
  id: string;
  startedAtEpochMs: number;
  deadlineAtEpochMs: number;
  beganAtMs: number;
  activeAtStart: boolean;
  endedAtEpochMs: number | null;
  endedAtMs: number | null;
  activeAtEnd: boolean | null;
  status: 'passed' | 'failed' | null;
};

type TraceOwner = Window & {
  __xegSourceImageTrace?: {
    stop: (reason?: string) => void;
    stopped: boolean;
    stopReason: string | null;
    stoppedAtMs: number | null;
    overflow: boolean;
    timeOrigin: number;
    startedAtMs: number;
    limit: number;
    frameLimit: number;
    productLimit: number;
    lifetimeLimitMs: number;
    frameCount: number;
    samples: Array<{ atMs: number; event: string; state: unknown }>;
    productEvents: Array<Record<string, unknown>>;
    productOverflow: boolean;
    productMalformedCount: number;
    alignmentFrames: AlignmentFrame[];
    paintAssertions: PaintAssertion[];
  };
};

export function observedSelectedAlignment(
  productEvents: ReadonlyArray<Record<string, unknown>>,
  frames: ReadonlyArray<AlignmentFrame>,
  originalUrl: string
) {
  const guards = productEvents.filter(
    (event) =>
      event.event === 'viewport-realign-guard' &&
      event.visible === true &&
      event.currentIndex === 1 &&
      event.focusedIndex === 1 &&
      typeof event.userAt === 'number' &&
      typeof event.programmaticAt === 'number' &&
      event.userAt <= event.programmaticAt
  );
  const second = guards[1];
  const secondAt = second?.at;
  if (typeof secondAt !== 'number') {
    return null;
  }
  const aligned = productEvents.find(
    (event) =>
      event.event === 'align-done' &&
      event.index === 1 &&
      typeof event.at === 'number' &&
      event.at >= secondAt
  );
  if (!aligned || typeof aligned.at !== 'number') {
    return null;
  }
  const [before, after] = frames;
  if (!before || !after || before.atMs <= aligned.at || after.atMs <= before.atMs) {
    return null;
  }
  for (const frame of [before, after]) {
    if (
      frame.selectedIndex !== '1' ||
      frame.currentIndex !== '1' ||
      frame.focusedIndex !== '1' ||
      frame.imageSrc !== originalUrl ||
      frame.itemTop === null ||
      frame.portTop === null ||
      frame.portBottom === null ||
      frame.scrollTop === null ||
      frame.clearance === null ||
      !Number.isFinite(frame.clearance) ||
      frame.itemTop < frame.portTop ||
      frame.itemTop >= frame.portBottom ||
      Math.abs(frame.itemTop - (frame.portTop + frame.clearance)) > 2
    ) {
      return null;
    }
  }
  const beforeTop = before.itemTop;
  const afterTop = after.itemTop;
  if (
    beforeTop === null ||
    afterTop === null ||
    Math.abs(beforeTop - afterTop) > 0.5 ||
    before.scrollTop !== after.scrollTop
  ) {
    return null;
  }
  return { secondGuardAtMs: secondAt, alignDoneAtMs: aligned.at, frames: [before, after] };
}

/** Diagnostic-only DOM observations. Extension content-script decisions need their own source probe. */
export async function startSourceImageTrace(page: Page, index: number) {
  await page.evaluate((itemIndex) => {
    const limit = 192;
    const frameLimit = 1_800;
    const productLimit = 512;
    const lifetimeLimitMs = 15_000;
    const start = performance.now();
    const state = {
      timeOrigin: performance.timeOrigin,
      startedAtMs: start,
      limit,
      frameLimit,
      productLimit,
      lifetimeLimitMs,
      overflow: false,
      samples: [] as Array<{ atMs: number; event: string; state: unknown }>,
      alignmentFrames: [] as AlignmentFrame[],
      productEvents: [] as Array<Record<string, unknown>>,
      productOverflow: false,
      productMalformedCount: 0,
      paintAssertions: [] as PaintAssertion[],
      frameCount: 0,
      stopped: false,
      stopReason: null as string | null,
      stoppedAtMs: null as number | null,
      timer: 0,
      frame: 0,
      mark: (_event: string) => {},
      stop: (_reason?: string) => {},
    };
    const owner = window as TraceOwner;
    if (owner.__xegSourceImageTrace) {
      throw new Error('Source image trace already installed');
    }
    owner.__xegSourceImageTrace = state;
    document.documentElement.setAttribute('data-xeg-scroll-trace', '');
    const onProductEvent = (event: Event) => {
      if (state.stopped) {
        return;
      }
      if (!(event instanceof CustomEvent) || typeof event.detail !== 'string') {
        return;
      }
      if (state.productEvents.length === productLimit) {
        state.productOverflow = true;
        state.stop('product-overflow');
        return;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(event.detail);
      } catch {
        state.productMalformedCount += 1;
        state.stop('malformed-product');
        return;
      }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        state.productMalformedCount += 1;
        state.stop('malformed-product');
        return;
      }
      state.productEvents.push(parsed as Record<string, unknown>);
    };
    window.addEventListener('xeg:gallery-scroll-trace', onProductEvent);
    const bounds = (element: Element | null) => {
      if (!element) {
        return null;
      }
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      };
    };
    const snapshot = () => {
      const gallery = document.querySelector('[data-xeg-gallery-container]');
      const toolbar = gallery?.querySelector('[data-gallery-element="toolbar"]');
      const port = gallery?.querySelector('[data-gallery-element="items"]');
      const item = gallery?.querySelector(
        `[data-gallery-element="item"][data-index="${itemIndex}"]`
      );
      const image = item?.querySelector('img');
      const alert = item?.querySelector('[role="alert"]');
      const wrapper = alert?.parentElement ?? null;
      const currentIndex = toolbar?.getAttribute('data-current-index') ?? null;
      const focusedIndex = toolbar?.getAttribute('data-focused-index') ?? null;
      const items = Array.from(gallery?.querySelectorAll('[data-gallery-element="item"]') ?? []);
      const mediaIdAt = (index: string | null) =>
        index === null
          ? null
          : (items
              .find((candidate) => candidate.getAttribute('data-index') === index)
              ?.getAttribute('data-media-id') ?? null);
      return {
        currentIndex,
        focusedIndex,
        activeMediaId: mediaIdAt(currentIndex),
        focusedMediaId: mediaIdAt(focusedIndex),
        selectedIndex: item?.getAttribute('data-index') ?? null,
        fitMode: item?.getAttribute('data-fit-mode') ?? null,
        displayUrl: item?.getAttribute('data-media-display-url') ?? null,
        mediaError: item?.getAttribute('data-media-error') ?? null,
        loaded: item?.getAttribute('data-media-loaded') ?? null,
        image:
          image instanceof HTMLImageElement
            ? {
                src: image.src,
                currentSrc: image.currentSrc,
                complete: image.complete,
                width: image.naturalWidth,
                height: image.naturalHeight,
              }
            : null,
        documentScroll: { x: scrollX, y: scrollY },
        scrollport: port
          ? {
              top: port.scrollTop,
              left: port.scrollLeft,
              height: port.scrollHeight,
              clientHeight: port.clientHeight,
              rect: bounds(port),
              scrollPaddingTop: Number.parseFloat(getComputedStyle(port).scrollPaddingTop),
            }
          : null,
        viewport: {
          width: innerWidth,
          height: innerHeight,
          devicePixelRatio,
          visualViewportScale: visualViewport?.scale ?? null,
          htmlZoom: getComputedStyle(document.documentElement).zoom,
        },
        galleryCss: port
          ? {
              toolbarClearance: getComputedStyle(port)
                .getPropertyValue('--xeg-toolbar-clearance')
                .trim(),
              constrainedHeight: getComputedStyle(port)
                .getPropertyValue('--xeg-viewport-height-constrained')
                .trim(),
              fitHeightTarget: item
                ? getComputedStyle(item).getPropertyValue('--xeg-gallery-fit-height-target').trim()
                : null,
            }
          : null,
        item: bounds(item ?? null),
        wrapper: bounds(wrapper),
        alert: bounds(alert ?? null),
        targets: alert
          ? Array.from(alert.querySelectorAll('span, button, a')).map((target) => {
              const rect = target.getBoundingClientRect();
              const x = rect.left + rect.width / 2;
              const y = rect.top + rect.height / 2;
              const hit = document.elementFromPoint(x, y);
              return {
                text: (target.textContent ?? '').trim().slice(0, 80),
                tag: target.tagName,
                rect: bounds(target),
                hit: hit?.tagName ?? null,
                hitTarget: !!hit && target.contains(hit),
              };
            })
          : [],
        wrapperStyle: wrapper
          ? {
              display: getComputedStyle(wrapper).display,
              position: getComputedStyle(wrapper).position,
              contain: getComputedStyle(wrapper).contain,
            }
          : null,
      };
    };
    let previous = '';
    const record = (event: string, current = snapshot()) => {
      if (state.stopped && event !== 'stop') {
        return;
      }
      const signature = JSON.stringify(current);
      if (event === 'frame' && signature === previous) {
        return;
      }
      previous = signature;
      if (state.samples.length === limit) {
        state.overflow = true;
        state.stop('sample-overflow');
        return;
      }
      state.samples.push({ atMs: performance.now(), event, state: current });
    };
    const frame = () => {
      if (state.stopped) {
        return;
      }
      state.frameCount += 1;
      if (state.frameCount > frameLimit) {
        state.overflow = true;
        state.stop('frame-bound');
        return;
      }
      const current = snapshot();
      state.alignmentFrames.push({
        atMs: performance.now(),
        selectedIndex: current.selectedIndex,
        currentIndex: current.currentIndex,
        focusedIndex: current.focusedIndex,
        imageSrc: current.image?.src ?? null,
        itemTop: current.item?.top ?? null,
        portTop: current.scrollport?.rect?.top ?? null,
        portBottom: current.scrollport?.rect?.bottom ?? null,
        scrollTop: current.scrollport?.top ?? null,
        clearance: current.scrollport?.scrollPaddingTop ?? null,
      });
      if (state.alignmentFrames.length > 2) {
        state.alignmentFrames.shift();
      }
      record('frame', current);
      if (!state.stopped) {
        state.frame = requestAnimationFrame(frame);
      }
    };
    state.mark = record;
    state.stop = (reason = 'finished') => {
      if (state.stopped) {
        return;
      }
      state.stopped = true;
      state.stopReason = reason;
      state.stoppedAtMs = performance.now();
      window.clearTimeout(state.timer);
      window.cancelAnimationFrame(state.frame);
      document.documentElement.removeAttribute('data-xeg-scroll-trace');
      window.removeEventListener('xeg:gallery-scroll-trace', onProductEvent);
      if (state.samples.length < limit) {
        record('stop');
      }
    };
    record('before-click');
    state.timer = window.setTimeout(() => state.stop('lifetime-bound'), lifetimeLimitMs);
    state.frame = window.requestAnimationFrame(frame);
  }, index);
}

/** Mark the actual assertion interval without changing its wait budget. */
export async function beginSourceImagePaintAssertion(
  page: Page,
  interval: { id: string; startedAtEpochMs: number; deadlineAtEpochMs: number }
): Promise<void> {
  await page.evaluate((input) => {
    const state = (window as TraceOwner).__xegSourceImageTrace;
    if (!state) {
      throw new Error('Source image paint assertion has no trace');
    }
    if (state.paintAssertions.some((assertion) => assertion.id === input.id)) {
      throw new Error(`Duplicate source image paint assertion: ${input.id}`);
    }
    state.paintAssertions.push({
      ...input,
      beganAtMs: performance.now(),
      activeAtStart: !state.stopped,
      endedAtEpochMs: null,
      endedAtMs: null,
      activeAtEnd: null,
      status: null,
    });
  }, interval);
}

export async function endSourceImagePaintAssertion(
  page: Page,
  result: { id: string; endedAtEpochMs: number; status: 'passed' | 'failed' }
): Promise<void> {
  await page.evaluate((input) => {
    const state = (window as TraceOwner).__xegSourceImageTrace;
    if (!state) {
      throw new Error('Source image paint assertion has no trace');
    }
    const assertion = state.paintAssertions.find((entry) => entry.id === input.id);
    if (!assertion || assertion.endedAtMs !== null) {
      throw new Error(`Source image paint assertion cannot end: ${input.id}`);
    }
    assertion.endedAtEpochMs = input.endedAtEpochMs;
    assertion.endedAtMs = performance.now();
    assertion.activeAtEnd = !state.stopped;
    assertion.status = input.status;
  }, result);
}

export async function finishSourceImageTrace(page: Page) {
  const trace = await page.evaluate(() => {
    const owner = window as TraceOwner;
    const current = owner.__xegSourceImageTrace;
    if (!current) {
      throw new Error('Source image trace was not installed');
    }
    current.stop();
    delete owner.__xegSourceImageTrace;
    const paintAssertions = current.paintAssertions.map((assertion) => ({
      ...assertion,
      budgetMs: assertion.deadlineAtEpochMs - assertion.startedAtEpochMs,
      deadlineReached:
        assertion.endedAtEpochMs !== null &&
        assertion.endedAtEpochMs >= assertion.deadlineAtEpochMs,
      traceStartedAtEpochMs: current.timeOrigin + current.startedAtMs,
      coverageComplete:
        assertion.activeAtStart &&
        assertion.activeAtEnd === true &&
        assertion.startedAtEpochMs >= current.timeOrigin + current.startedAtMs &&
        assertion.endedAtMs !== null &&
        assertion.endedAtMs >= assertion.beganAtMs &&
        assertion.endedAtEpochMs !== null &&
        assertion.endedAtEpochMs >= assertion.startedAtEpochMs &&
        !current.overflow &&
        !current.productOverflow &&
        current.productMalformedCount === 0,
    }));
    return {
      timeOrigin: current.timeOrigin,
      startedAtMs: current.startedAtMs,
      limit: current.limit,
      frameLimit: current.frameLimit,
      productLimit: current.productLimit,
      lifetimeLimitMs: current.lifetimeLimitMs,
      frameCount: current.frameCount,
      overflow: current.overflow,
      stopReason: current.stopReason,
      stoppedAtMs: current.stoppedAtMs,
      samples: current.samples,
      productEvents: current.productEvents,
      productOverflow: current.productOverflow,
      productMalformedCount: current.productMalformedCount,
      alignmentFrames: current.alignmentFrames,
      paintAssertions,
      coverageComplete:
        paintAssertions.length > 0 &&
        paintAssertions.every((assertion) => assertion.coverageComplete),
    };
  });
  return trace;
}

/** Hold only the first diagnostic fault response until the observed selected alignment settles. */
export async function waitForSelectedAlignmentBeforeFault(page: Page, originalUrl: string) {
  for (let observation = 0; observation < 720; observation += 1) {
    const state = await page.evaluate(() => {
      const owner = window as Window & {
        __xegSourceImageTrace?: {
          startedAtMs: number;
          stopped: boolean;
          overflow: boolean;
          productOverflow: boolean;
          productEvents: Array<Record<string, unknown>>;
          alignmentFrames: AlignmentFrame[];
        };
      };
      const trace = owner.__xegSourceImageTrace;
      if (!trace) {
        throw new Error('Source image alignment gate has no active trace');
      }
      return {
        startedAtMs: trace.startedAtMs,
        nowMs: performance.now(),
        stopped: trace.stopped,
        overflow: trace.overflow,
        productOverflow: trace.productOverflow,
        productEvents: trace.productEvents,
        alignmentFrames: trace.alignmentFrames,
      };
    });
    if (state.overflow || state.productOverflow) {
      throw new Error('Source image alignment gate trace overflowed');
    }
    const gate = observedSelectedAlignment(state.productEvents, state.alignmentFrames, originalUrl);
    if (gate) {
      return {
        ...gate,
        observedAtEpochMs: Date.now(),
        originalUrl,
        selectedIndex: 1,
      };
    }
    if (state.stopped || state.nowMs - state.startedAtMs >= 5_000) {
      throw new Error('Source image alignment gate expired before selected item settled');
    }
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          const backup = window.setTimeout(resolve, 100);
          window.requestAnimationFrame(() => {
            window.clearTimeout(backup);
            resolve();
          });
        })
    );
  }
  throw new Error('Source image alignment gate exceeded its frame observation bound');
}
