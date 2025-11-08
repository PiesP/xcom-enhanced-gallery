/**
 * @fileoverview Type definitions for local configuration loader
 */

/**
 * Load local configuration
 * @template T - Configuration type
 * @returns Loaded configuration or null if not found
 *
 * Note: This is a stub implementation for CI/local compatibility.
 * Future versions may accept parameters to load environment-specific configuration.
 */
export declare function loadLocalConfig<T = unknown>(): Promise<T | null>;
