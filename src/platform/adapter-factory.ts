// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { IS_MV3 } from './detect';

/**
 * Creates a lazy singleton adapter factory that dispatches between MV3 and
 * userscript (GM) platform implementations.
 *
 * The factory memoizes the adapter instance on first call, ensuring each
 * platform creates exactly one instance per application lifecycle.
 *
 * @typeParam T - The adapter interface type.
 * @param mv3Factory - Factory function for the MV3 extension adapter.
 * @param gmFactory - Factory function for the userscript (GM) adapter.
 * @returns A function that returns the singleton adapter instance.
 *
 * @example
 * ```ts
 * export const getStorageAdapter = createAdapter(
 *   () => new MV3StorageAdapter(),
 *   () => new GMStorageAdapter(),
 * );
 * ```
 */
export function createAdapter<T>(mv3Factory: () => T, gmFactory: () => T): () => T {
  let instance: T | null = null;
  return () => {
    if (!instance) {
      instance = IS_MV3 ? mv3Factory() : gmFactory();
    }
    return instance;
  };
}
