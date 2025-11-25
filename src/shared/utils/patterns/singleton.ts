/**
 * @fileoverview Singleton Factory Utility
 * @description Provides a type-safe singleton pattern implementation
 *              to reduce boilerplate across services.
 */

/**
 * Singleton holder for lazy initialization
 */
interface SingletonHolder<T> {
    instance: T | null;
}

/**
 * Creates a singleton factory function with lazy initialization.
 *
 * @example
 * ```typescript
 * class MyService {
 *   private constructor() {}
 *   static readonly getInstance = createSingleton(() => new MyService());
 * }
 * ```
 *
 * @param factory - Factory function to create the instance
 * @returns A function that returns the singleton instance
 */
export function createSingleton<T>(factory: () => T): () => T {
    const holder: SingletonHolder<T> = { instance: null };

    return (): T => {
        if (holder.instance === null) {
            holder.instance = factory();
        }
        return holder.instance;
    };
}

/**
 * Creates a resettable singleton factory (useful for testing).
 *
 * @example
 * ```typescript
 * const [getInstance, resetInstance] = createResettableSingleton(() => new MyService());
 * ```
 *
 * @param factory - Factory function to create the instance
 * @returns Tuple of [getInstance, resetInstance] functions
 */
export function createResettableSingleton<T>(
    factory: () => T,
): [() => T, () => void] {
    const holder: SingletonHolder<T> = { instance: null };

    const getInstance = (): T => {
        if (holder.instance === null) {
            holder.instance = factory();
        }
        return holder.instance;
    };

    const resetInstance = (): void => {
        holder.instance = null;
    };

    return [getInstance, resetInstance];
}

/**
 * Type helper for extracting instance type from singleton getter
 */
export type SingletonInstance<T extends () => unknown> = ReturnType<T>;
