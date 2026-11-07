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
    const start = performance.now();
    const state = {
      timeOrigin: performance.timeOrigin,
      startedAtMs: start,
      limit,
      overflow: false,
      samples: [] as Array<{ atMs: number; event: string; state: unknown }>,
      alignmentFrames: [] as AlignmentFrame[],
      productEvents: [] as Array<Record<string, unknown>>,
      productOverflow: false,
      frameCount: 0,
      stopped: false,
      timer: 0,
      frame: 0,
      mark: (_event: string) => {},
      stop: () => {},
    };
    const owner = window as Window & { __xegSourceImageTrace?: typeof state };
    if (owner.__xegSourceImageTrace) {
      throw new Error('Source image trace already installed');
    }
    owner.__xegSourceImageTrace = state;
    document.documentElement.setAttribute('data-xeg-scroll-trace', '');
    const onProductEvent = (event: Event) => {
      if (!(event instanceof CustomEvent) || typeof event.detail !== 'string') {
        return;
      }
      if (state.productEvents.length === 256) {
        state.productOverflow = true;
        return;
      }
      const parsed: unknown = JSON.parse(event.detail);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        state.productOverflow = true;
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
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
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
      return {
        currentIndex: toolbar?.getAttribute('data-current-index') ?? null,
        focusedIndex: toolbar?.getAttribute('data-focused-index') ?? null,
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
      const signature = JSON.stringify(current);
      if (event === 'frame' && signature === previous) {
        return;
      }
      previous = signature;
      if (state.samples.length === limit) {
        state.overflow = true;
        state.stop();
        return;
      }
      state.samples.push({ atMs: performance.now(), event, state: current });
    };
    const frame = () => {
      if (state.stopped) {
        return;
      }
      state.frameCount += 1;
      if (state.frameCount > 720) {
        state.overflow = true;
        state.stop();
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
      state.frame = requestAnimationFrame(frame);
    };
    state.mark = record;
    state.stop = () => {
      if (state.stopped) {
        return;
      }
      state.stopped = true;
      window.clearTimeout(state.timer);
      window.cancelAnimationFrame(state.frame);
      document.documentElement.removeAttribute('data-xeg-scroll-trace');
      window.removeEventListener('xeg:gallery-scroll-trace', onProductEvent);
      record('stop');
    };
    record('before-click');
    state.timer = window.setTimeout(state.stop, 5_000);
    state.frame = window.requestAnimationFrame(frame);
  }, index);
}

export async function finishSourceImageTrace(page: Page) {
  const trace = await page.evaluate(() => {
    const owner = window as Window & {
      __xegSourceImageTrace?: {
        stop: () => void;
        overflow: boolean;
        timeOrigin: number;
        startedAtMs: number;
        limit: number;
        frameCount: number;
        samples: Array<{ atMs: number; event: string; state: unknown }>;
        productEvents: Array<Record<string, unknown>>;
        productOverflow: boolean;
        alignmentFrames: AlignmentFrame[];
      };
    };
    const current = owner.__xegSourceImageTrace;
    if (!current) {
      throw new Error('Source image trace was not installed');
    }
    current.stop();
    delete owner.__xegSourceImageTrace;
    return {
      timeOrigin: current.timeOrigin,
      startedAtMs: current.startedAtMs,
      limit: current.limit,
      frameCount: current.frameCount,
      overflow: current.overflow,
      samples: current.samples,
      productEvents: current.productEvents,
      productOverflow: current.productOverflow,
      alignmentFrames: current.alignmentFrames,
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
