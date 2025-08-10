/**
 * @fileoverview Animation TDD Tests Setup - Isolated DOM mocking
 */

import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { setTimeout as nodeSetTimeout, clearTimeout as nodeClearTimeout } from 'node:timers';
import * as AnimationsModule from '../../src/shared/utils/animations';

// Scoped Node Module hook for the specific alias used in this suite
let __origRequire: Function | null = null;
let __Module: any = null;
beforeAll(() => {
  try {
    __Module = require('module');
    __origRequire = __Module.prototype.require as Function;
    if (typeof __origRequire === 'function') {
      __Module.prototype.require = function (id: string): unknown {
        if (id === '@shared/utils/animations') {
          return AnimationsModule as any;
        }
        return __origRequire!.apply(this, arguments as unknown as unknown[]);
      } as any;
    }
  } catch {
    // ignore
  }
});

afterAll(() => {
  try {
    if (__origRequire && __Module) {
      __Module.prototype.require = __origRequire;
    }
  } catch {
    // ignore
  } finally {
    __origRequire = null;
    __Module = null;
  }
});

// Provide a CommonJS-friendly shim for '@shared/utils/animations' used by require()
// This avoids relying on alias resolution for CJS and directly maps to AnimationService statics.
vi.mock('@shared/utils/animations', async () => {
  const mod = await import('../../src/shared/services/animation-service');
  const AnimationService = (mod as any)
    .AnimationService as typeof import('../../src/shared/services/animation-service').AnimationService;
  return {
    // static re-exports
    animateCustom: AnimationService.animateCustom,
    animateParallel: AnimationService.animateParallel,
    setupScrollAnimation: AnimationService.setupScrollAnimation,
    setupInViewAnimation: AnimationService.setupInViewAnimation,
    transformValue: AnimationService.transformValue,
    ANIMATION_PRESETS: AnimationService.ANIMATION_PRESETS,
    // instance conveniences (minimal surface for compatibility)
    default: {
      // no default instance needed by these tests, but export a placeholder to be safe
    },
  };
});

// Ensure timers exist to avoid test environment timeouts
global.setTimeout = (global.setTimeout || (nodeSetTimeout as unknown as typeof setTimeout)) as any;
global.clearTimeout = (global.clearTimeout ||
  (nodeClearTimeout as unknown as typeof clearTimeout)) as any;
// ensure window timers mirror globals when available
try {
  if (typeof window !== 'undefined') {
    (window as any).setTimeout = global.setTimeout as any;
    (window as any).clearTimeout = global.clearTimeout as any;
  }
} catch {
  // ignore window timer sync failures in non-browser workers
}

// Force real timers for this suite to avoid global fake timers hook timeouts
beforeEach(() => {
  vi.useRealTimers();
});

// Provide IntersectionObserver mock if missing in environment
if (typeof global.IntersectionObserver === 'undefined') {
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
  })) as any;
}

export {};
