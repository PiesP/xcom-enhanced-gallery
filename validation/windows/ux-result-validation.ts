// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import assert from 'node:assert/strict';
import type { Locator, Page } from '@playwright/test';

/** Capture the real wheel event before the result panel consumes it. */
export async function uxStartWheelEventProbe(
  owner: Locator,
  selectedTarget?: Locator
): Promise<void> {
  const selectedHandle = selectedTarget ? await selectedTarget.elementHandle() : null;
  if (selectedTarget) {
    assert(selectedHandle, 'Selected UX wheel target is missing');
  }
  try {
    await owner.evaluate((element, selected) => {
      const scoped = window as Window & {
        __xegUxWheelProbe?: {
          controller: AbortController;
          events: Array<Record<string, unknown>>;
          overflow: boolean;
        };
      };
      if (scoped.__xegUxWheelProbe) {
        throw new Error('A prior UX wheel observer was not removed');
      }
      if (selected && !element.contains(selected)) {
        throw new Error('Selected UX wheel target is outside its result panel');
      }
      const controller = new AbortController();
      const events: Array<Record<string, unknown>> = [];
      const probe = { controller, events, overflow: false };
      scoped.__xegUxWheelProbe = probe;
      const media = document.querySelector<HTMLElement>('[data-gallery-element="items"]');
      const toolbar = document.querySelector<HTMLElement>('[data-gallery-element="toolbar"]');
      const record = (event: Record<string, unknown>) => {
        if (events.length < 24) {
          events.push({ atMs: performance.now(), ...event });
        } else {
          probe.overflow = true;
        }
      };
      const state = () => ({
        ownerTop: element.scrollTop,
        ownerConnected: element.isConnected,
        mediaTop: media?.scrollTop ?? null,
        current: toolbar?.getAttribute('data-current-index') ?? null,
        focused: toolbar?.getAttribute('data-focused-index') ?? null,
        activeTag: document.activeElement?.tagName ?? null,
      });
      window.addEventListener(
        'wheel',
        (event) => {
          const target = event.target instanceof Element ? event.target : null;
          const path = event.composedPath();
          const row: Record<string, unknown> = {
            kind: 'wheel',
            trusted: event.isTrusted,
            deltaX: event.deltaX,
            deltaY: event.deltaY,
            deltaMode: event.deltaMode,
            targetTag: target?.tagName ?? null,
            targetOwner: Boolean(target && element.contains(target)),
            // DOM identity accepts a nested span, but never another panel descendant.
            targetSelected: selected ? path.includes(selected) : null,
            targetMedia: Boolean(target && media?.contains(target)),
            path: path
              .filter((node): node is Element => node instanceof Element)
              .slice(0, 8)
              .map((node) => ({
                tag: node.tagName,
                galleryElement: node.getAttribute('data-gallery-element'),
              })),
            ...state(),
          };
          record(row);
          queueMicrotask(() => {
            row.defaultPreventedAfterDispatch = event.defaultPrevented;
          });
        },
        { capture: true, passive: true, signal: controller.signal }
      );
      for (const [name, target] of [
        ['owner', element],
        ['media', media],
      ] as const) {
        target?.addEventListener(
          'scroll',
          () => record({ kind: 'scroll', surface: name, ...state() }),
          { passive: true, signal: controller.signal }
        );
      }
      document.addEventListener(
        'focusin',
        (event) => {
          const target = event.target instanceof Element ? event.target : null;
          record({
            kind: 'focus',
            targetTag: target?.tagName ?? null,
            targetGalleryElement:
              target?.closest('[data-gallery-element]')?.getAttribute('data-gallery-element') ??
              null,
            ...state(),
          });
        },
        { capture: true, signal: controller.signal }
      );
    }, selectedHandle);
  } finally {
    await selectedHandle?.dispose();
  }
}

export async function uxStopWheelEventProbe(
  page: Page
): Promise<{ events: Array<Record<string, unknown>>; overflow: boolean }> {
  return page.evaluate(() => {
    const scoped = window as Window & {
      __xegUxWheelProbe?: {
        controller: AbortController;
        events: Array<Record<string, unknown>>;
        overflow: boolean;
      };
    };
    const probe = scoped.__xegUxWheelProbe;
    if (!probe) {
      throw new Error('UX wheel observer was missing');
    }
    probe.controller.abort();
    delete scoped.__xegUxWheelProbe;
    return { events: probe.events, overflow: probe.overflow };
  });
}

export function assertSelectedResultWheel(
  label: string,
  event: Record<string, unknown> | undefined
): void {
  assert.equal(event?.targetSelected, true, `${label} wheel did not reach its selected target`);
}

export function assertMovedPointerOnTarget(label: string, ownsHit: boolean): void {
  assert.equal(ownsHit, true, `${label} moved pointer did not hit its selected target`);
}

type Bounds = {
  top: number;
  bottom: number;
  width: number;
  height: number;
};

export type OneItemLayout = {
  viewport: { width: number; height: number };
  media: {
    scrollTop: number;
    scrollHeight: number;
    clientHeight: number;
    bounds: Bounds;
    paddingTop: string;
  };
  item: { fit: string | null; bounds: Bounds | null };
  sourceBounds: Bounds | null;
  spacerHeight: string;
  toolbarClearance: string;
};

type MediaNoOverflowVerdict =
  | 'not-applicable-unreachable-with-product-spacer'
  | 'reachable-media-no-overflow-changed-prerequisite'
  | 'unverified-invalid-geometry'
  | 'unverified-spacer-premise';

const cssPixels = (value: string): number | null => {
  const match = /^(?:\d+(?:\.\d*)?|\.\d+)px$/u.exec(value.trim());
  return match ? Number(match[0].slice(0, -2)) : null;
};

const finitePositive = (value: number): boolean => Number.isFinite(value) && value > 0;

const usableBounds = (bounds: Bounds | null): bounds is Bounds =>
  bounds !== null &&
  Number.isFinite(bounds.top) &&
  Number.isFinite(bounds.bottom) &&
  finitePositive(bounds.width) &&
  finitePositive(bounds.height) &&
  Math.abs(bounds.bottom - bounds.top - bounds.height) <= 2;

/** Distinguish the current spacer-backed N/A from a reachable or unmeasured case. */
export function qualifyOneItemMediaNoOverflow(layout: OneItemLayout): {
  verdict: MediaNoOverflowVerdict;
  mediaOverflow: number | null;
  paddingTop: number | null;
  spacerHeight: number | null;
  toolbarClearance: number | null;
} {
  const { media, item, sourceBounds, viewport } = layout;
  const paddingTop = cssPixels(media.paddingTop);
  const spacerHeight = cssPixels(layout.spacerHeight);
  const toolbarClearance = cssPixels(layout.toolbarClearance);
  const mediaOverflow =
    Number.isFinite(media.scrollHeight) && Number.isFinite(media.clientHeight)
      ? media.scrollHeight - media.clientHeight
      : null;
  const record = { mediaOverflow, paddingTop, spacerHeight, toolbarClearance };
  if (
    !finitePositive(viewport.width) ||
    !finitePositive(viewport.height) ||
    !finitePositive(media.scrollHeight) ||
    !finitePositive(media.clientHeight) ||
    !Number.isFinite(media.scrollTop) ||
    mediaOverflow === null ||
    mediaOverflow < -2 ||
    media.scrollTop < -2 ||
    media.scrollTop > Math.max(0, mediaOverflow) + 2 ||
    !usableBounds(media.bounds) ||
    Math.abs(media.bounds.height - media.clientHeight) > 2 ||
    !usableBounds(item.bounds) ||
    !usableBounds(sourceBounds) ||
    paddingTop === null ||
    spacerHeight === null ||
    toolbarClearance === null ||
    paddingTop <= 0 ||
    spacerHeight <= 0 ||
    toolbarClearance <= 0 ||
    item.fit !== 'fitContainer'
  ) {
    return { ...record, verdict: 'unverified-invalid-geometry' };
  }
  if (mediaOverflow <= 2) {
    return { ...record, verdict: 'reachable-media-no-overflow-changed-prerequisite' };
  }
  if (
    Math.abs(paddingTop - toolbarClearance) > 2 ||
    item.bounds.top < media.bounds.top + paddingTop - 2 ||
    item.bounds.bottom > media.bounds.bottom + 2 ||
    spacerHeight < media.clientHeight - 2 ||
    media.scrollHeight + 2 < paddingTop + item.bounds.height + spacerHeight
  ) {
    return { ...record, verdict: 'unverified-spacer-premise' };
  }
  return { ...record, verdict: 'not-applicable-unreachable-with-product-spacer' };
}
