// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Global test setup for xcom-enhanced-gallery
 *
 * Provides mocks for the userscript environment (GM_* APIs),
 * DOM polyfills missing from jsdom, and logger suppression.
 *
 * Architecture: test/ is a standalone pnpm workspace.
 * Source code is imported via `@bootstrap`, `@constants`,
 * `@features`, `@shared` path aliases mapped to `../src/`.
 */

/* ------------------------------------------------------------------ */
/*  Section 1: GM_* API mocks                                         */
/* ------------------------------------------------------------------ */

/** In-memory storage simulating GM_getValue/GM_setValue */
const gmStorage = new Map<string, unknown>();

// @ts-expect-error - Attach global GM_* mocks for the userscript adapter
globalThis.GM_getValue = (key: string, defaultValue?: unknown): unknown => {
  if (gmStorage.has(key)) return gmStorage.get(key);
  return defaultValue;
};

// @ts-expect-error
globalThis.GM_setValue = (key: string, value: unknown): void => {
  gmStorage.set(key, value);
};

// @ts-expect-error
globalThis.GM_deleteValue = (key: string): void => {
  gmStorage.delete(key);
};

// @ts-expect-error
globalThis.GM_listValues = (): string[] => {
  return Array.from(gmStorage.keys());
};

// @ts-expect-error
globalThis.GM_xmlhttpRequest = (_details: unknown): { abort: () => void } => {
  return { abort: () => {} };
};

// @ts-expect-error
globalThis.GM_download = (
  _urlOrDetails: unknown,
  _name?: string,
): void => {};

// @ts-expect-error
globalThis.GM_notification = (
  _details: unknown,
  _ondone?: () => void,
): void => {};

// @ts-expect-error
globalThis.GM_cookie = undefined;

// @ts-expect-error
globalThis.GM_info = {
  script: {
    version: "2.1.1",
    name: "X.com Enhanced Gallery",
  },
};

/* ------------------------------------------------------------------ */
/*  Section 2: DOM API polyfills (missing/incomplete in jsdom)        */
/* ------------------------------------------------------------------ */

// requestAnimationFrame / cancelAnimationFrame
// jsdom may not provide these; fall back to setTimeout(..., 16ms)

if (typeof globalThis.requestAnimationFrame === "undefined") {
  // @ts-expect-error
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    return setTimeout(cb, 16) as unknown as number;
  };
}

if (typeof globalThis.cancelAnimationFrame === "undefined") {
  // @ts-expect-error
  globalThis.cancelAnimationFrame = (id: number): void => {
    clearTimeout(id);
  };
}

// ResizeObserver (not fully implemented in jsdom)

if (typeof globalThis.ResizeObserver === "undefined") {
  class MockResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  // @ts-expect-error
  globalThis.ResizeObserver = MockResizeObserver;
}

// IntersectionObserver (not fully implemented in jsdom)

if (typeof globalThis.IntersectionObserver === "undefined") {
  class MockIntersectionObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }
  // @ts-expect-error
  globalThis.IntersectionObserver = MockIntersectionObserver;
}

// matchMedia (not fully implemented in jsdom)

if (typeof globalThis.matchMedia === "undefined") {
  // @ts-expect-error
  globalThis.matchMedia = (): MediaQueryList => {
    return {
      matches: false,
      media: "",
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  };
}

/* ------------------------------------------------------------------ */
/*  Section 3: Logger mock (suppress log noise during tests)          */
/* ------------------------------------------------------------------ */

import { vi } from "vitest";

// Mock @shared/logging to suppress log output
vi.mock("@shared/logging", () => {
  const noop = () => {};
  // prettier-ignore
  const logger = {
    debug: vi.fn(noop), info: vi.fn(noop),
    warn: vi.fn(noop), error: vi.fn(noop),
  };
  return { createLogger: () => logger, defaultLogger: logger };
});

/* ------------------------------------------------------------------ */
/*  Section 4: Lifecycle hooks                                        */
/* ------------------------------------------------------------------ */

beforeEach(() => {
  gmStorage.clear();
  if (typeof document !== 'undefined' && document.body) {
    document.body.innerHTML = '';
  }
});

afterAll(() => {
  gmStorage.clear();
});
