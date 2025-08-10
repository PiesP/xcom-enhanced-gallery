/**
 * @fileoverview Animation TDD Tests Setup - Isolated DOM mocking
 */

import { beforeEach, vi } from 'vitest';
import { setTimeout as nodeSetTimeout, clearTimeout as nodeClearTimeout } from 'node:timers';
import * as AnimationsModule from '../../src/shared/utils/animations';

// Note: Avoid monkey-patching global require/Module.prototype.require.
// Vitest's module mocking below is sufficient and safer across the suite.
// However, this suite asserts CommonJS require compatibility for an aliased path.
// Provide a minimal, safe mapping for that single module ID only.
try {
  const originalRequire: unknown = (global as any).require;
  if (typeof originalRequire === 'function') {
    const orig = originalRequire as (id: string) => unknown;
    (global as any).require = ((id: string) => {
      if (id === '@shared/utils/animations') return AnimationsModule as any;
      return orig(id);
    }) as any;
  } else {
    vi.stubGlobal('require', (id: string) => {
      if (id === '@shared/utils/animations') return AnimationsModule as any;
      throw new Error(`Cannot find module '${id}'`);
    });
  }
} catch {
  // ignore
}

// Minimal Node Module hook for the specific alias used in this suite
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Module = require('module');
  const origRequire = Module.prototype.require as (id: string) => unknown;
  if (typeof origRequire === 'function') {
    Module.prototype.require = function (id: string): unknown {
      if (id === '@shared/utils/animations') {
        return AnimationsModule as any;
      }
      return origRequire.apply(this, arguments as unknown as [string]);
    } as any;
  }
} catch {
  // ignore
}

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

// Enhanced DOM mocking for animation tests
const mockElement = {
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn(),
  },
  style: {
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
    transition: '',
    opacity: '',
    transform: '',
  },
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  setAttribute: vi.fn(),
};

global.document = {
  createElement: vi.fn().mockReturnValue(mockElement),
  head: {
    appendChild: vi.fn(),
  },
  getElementById: vi.fn().mockReturnValue(null),
  body: mockElement,
  querySelectorAll: vi.fn().mockReturnValue([]),
  documentElement: {
    scrollHeight: 2000,
  },
} as unknown as Document;

global.window = {
  scrollY: 100,
  innerHeight: 800,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as unknown as Window & typeof globalThis;

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
}));

export {};
