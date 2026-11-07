// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import type { Page } from '@playwright/test';

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
            }
          : null,
        viewport: { width: innerWidth, height: innerHeight },
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
            }
          : null,
      };
    };
    let previous = '';
    const record = (event: string) => {
      const current = snapshot();
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
      record('frame');
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
    };
  });
  assert.equal(trace.overflow, false, 'Source image trace observation exceeded its bound');
  assert.equal(
    trace.productOverflow,
    false,
    'Source image product event observation exceeded its bound'
  );
  return trace;
}
