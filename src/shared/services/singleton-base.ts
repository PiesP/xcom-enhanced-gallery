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
 *     return SingletonBase.get(_instance, () => { _instance = new MyService(); return _instance; });
 *   }
 *
 *   static resetForTests(): void {
 *     SingletonBase.reset(_instance, () => { _instance = null; });
 *   }
 *
 *   destroy(): void { ... }
 * }
 * ```
 */

export class SingletonBase {
  static get<T extends { destroy(): void }>(instanceRef: T | null, create: () => T): T {
    if (!instanceRef) {
      const instance = create();
      return instance;
    }
    return instanceRef;
  }

  static reset<T extends { destroy(): void }>(instance: T | null, setNull: () => void): void {
    instance?.destroy();
    setNull();
  }
}
