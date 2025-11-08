/**
 * @fileoverview Local configuration loader (development only)
 * @description Loads environment-specific configuration that may not be committed to version control.
 * This file is skipped in CI environments (see vite.config.ts).
 */

/**
 * Load local configuration
 * @template T - Configuration type
 * @returns {Promise<T | null>} Loaded configuration or null if not found
 *
 * Note: This is a stub implementation for CI/local compatibility.
 * Future versions may accept baseRef and basename parameters to load from
 * environment-specific configuration files (.env.local, etc).
 */
export async function loadLocalConfig() {
  // Stub implementation for CI/local compatibility
  // In actual use, this could load from .env.local or similar
  return null;
}
