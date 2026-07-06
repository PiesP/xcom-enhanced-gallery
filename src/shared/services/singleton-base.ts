// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Singleton base class for services.
 *
 * Provides a consistent singleton pattern with `getInstance()` and `resetForTests()`.
 * Subclasses use a module-level `_instance` variable and delegate to the base helpers.
 *
 * Usage:
 * ```
 * let _instance: MyService | null = null;
 *
 * export class MyService {
 *   private constructor() {}
 *
 *   static getInstance(): MyService {
 *     return SingletonBase.get(
 *       () => _instance,
 *       (inst) => { _instance = inst; },
 *       () => new MyService(),
 *     );
 *   }
 *
 *   static resetForTests(): void {
 *     SingletonBase.reset(() => _instance, (inst) => { _instance = inst; });
 *   }
 *
 *   destroy(): void { ... }
 * }
 * ```
 */

export class SingletonBase {
  static get<T extends { destroy(): void }>(
    getInstance: () => T | null,
    setInstance: (instance: T) => void,
    create: () => T
  ): T {
    const existing = getInstance();
    if (existing) return existing;
    const instance = create();
    setInstance(instance);
    return instance;
  }

  static reset<T extends { destroy(): void }>(
    getInstance: () => T | null,
    setInstance: (instance: T | null) => void
  ): void {
    const existing = getInstance();
    existing?.destroy();
    setInstance(null);
  }
}

export interface SingletonAccessors<T extends { destroy(): void }> {
  getInstance: () => T;
  resetForTests: () => void;
}

/**
 * Create a singleton service with automatic instance management.
 * Eliminates the boilerplate of module-level `_instance` variables
 * and static `getInstance()`/`resetForTests()` methods.
 *
 * Usage:
 * ```
 * export class MyService {
 *   constructor() {}  // public constructor
 *   destroy(): void { ... }
 * }
 *
 * const { getInstance, resetForTests } = createSingleton(() => new MyService());
 * export { getInstance as getMyService, resetForTests as resetMyServiceForTests };
 * ```
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
