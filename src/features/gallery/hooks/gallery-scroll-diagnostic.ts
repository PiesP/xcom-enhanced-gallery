// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { untrack } from 'solid-js';

type ViewportDecision =
  | {
      decision: 'accepted';
      reason: 'eligible';
      visible: boolean;
      userAt: number;
      programmaticAt: number;
      index: number;
      currentIndex: number;
      focusedIndex: number | null;
    }
  | { decision: 'rejected'; reason: 'hidden'; visible: boolean }
  | {
      decision: 'rejected';
      reason: 'user-scroll';
      visible: boolean;
      userAt: number;
      programmaticAt: number;
    };

/** Opt-in #502 observations; the collecting trace owns bounds and disarms on teardown. */
function emit(event: string, snapshot: () => object): void {
  if (!document.documentElement.hasAttribute('data-xeg-scroll-trace')) {
    return;
  }
  window.dispatchEvent(
    new CustomEvent('xeg:gallery-scroll-trace', {
      detail: JSON.stringify({ event, at: performance.now(), ...untrack(snapshot) }),
    })
  );
}

export function traceViewportDecision(snapshot: () => ViewportDecision): void {
  emit('viewport-decision', snapshot);
}

export function traceItemAlignment(index: number): void {
  emit('align-done', () => ({ index }));
}
