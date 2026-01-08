/**
 * Test harness for service registry management.
 * Simplifies mock injection and service registration in tests.
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
    register: <T>(key: string, instance: T): void => {
      registry.register<T>(key, instance);
    },
    get: <T>(key: string): T => registry.get<T>(key),
    tryGet: <T>(key: string): T | null => registry.tryGet<T>(key),
    reset: (): void => {
      registry.reset();
    },
  };
}
