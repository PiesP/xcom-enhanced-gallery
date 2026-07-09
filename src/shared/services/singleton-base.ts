// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Singleton accessor interface and factory.
 *
 * Provides a consistent singleton pattern with `getInstance()` and `resetForTests()`.
 * Uses a module-level closure variable and delegates to the accessor helpers.
 *
 * Usage:
 * ```
 * export class MyService {
 *   constructor() {}
 *   destroy(): void { ... }
 * }
 *
 * const { getInstance, resetForTests } = createSingleton(() => new MyService());
 * export { getInstance as getMyService, resetForTests as resetMyServiceForTests };
 * ```
 */

export interface SingletonAccessors<T extends { destroy(): void }> {
  getInstance: () => T;
  resetForTests: () => void;
}

/**
 * Create a singleton service with automatic instance management.
 * Eliminates the boilerplate of module-level `_instance` variables
 * and static `getInstance()`/`resetForTests()` methods.
 */
export function createSingleton<T extends { destroy(): void }>(
  factory: () => T
): SingletonAccessors<T> {
  let instance: T | null = null;
  return {
    getInstance() {
      const inst = instance;
      if (inst) return inst;
      const newInst = factory();
      instance = newInst;
      return newInst;
    },
    resetForTests() {
      instance?.destroy();
      instance = null;
    },
  };
}
