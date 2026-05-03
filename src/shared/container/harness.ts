/**
 * Test harness for service registry management.
 * Simplifies mock injection and service registration in tests.
 */

import { registerRenderer, registerSettings } from '@shared/container/container';

export interface TestHarness {
  registerRenderer: (r: unknown) => void;
  registerSettings: (s: unknown) => void;
  reset: () => void;
}

export function createTestHarness(): TestHarness {
  return {
    registerRenderer: (r: unknown): void => {
      registerRenderer(r as Parameters<typeof registerRenderer>[0]);
    },
    registerSettings: (s: unknown): void => {
      registerSettings(s as Parameters<typeof registerSettings>[0]);
    },
    reset: (): void => {
      // Module-level vars are reset by re-importing in tests
    },
  };
}
