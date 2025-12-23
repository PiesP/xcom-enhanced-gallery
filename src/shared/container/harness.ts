/**
 * Test harness utilities.
 *
 * This module is intended for tests and local development tooling.
 */

import { CoreService } from '@shared/services/service-manager';

export interface TestHarness {
  register: <T>(key: string, instance: T) => void;
  get: <T>(key: string) => T;
  tryGet: <T>(key: string) => T | null;
  reset: () => void;
}

export function createTestHarness(): TestHarness {
  const registry = CoreService.getInstance();

  return {
    register: (key, instance) => {
      registry.register(key, instance);
    },
    get: (key) => registry.get(key),
    tryGet: (key) => registry.tryGet(key),
    reset: () => {
      registry.reset();
    },
  };
}
