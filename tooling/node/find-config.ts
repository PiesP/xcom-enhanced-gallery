/**
 * Entry point for Node-only config discovery utilities.
 *
 * This module provides utilities to locate configuration files by searching
 * upward through the directory tree. It's intended for tooling and test setup
 * (Node.js only) and must never be imported by browser/runtime code.
 *
 * Functions:
 * - `findConfigFilePath`: Search for a single config file by name
 * - `findFirstConfigFilePath`: Search for the first matching file from multiple candidates
 *
 * Aliases are provided for conciseness:
 * - `findConfig` as shorthand for `findConfigFilePath`
 * - `findConfigAny` as shorthand for `findFirstConfigFilePath`
 */

/**
 * Search upwards for a config file by relative path.
 * Returns the first matching file found, or a fallback path if none exists.
 *
 * Find the first matching config file from a list of candidates.
 * Useful when multiple config file names are acceptable (e.g., tsconfig.json, tsconfig.build.json).
 */
export {
  findConfigFilePath,
  findConfigFilePath as findConfig,
  findFirstConfigFilePath,
  findFirstConfigFilePath as findConfigAny,
} from './utils/find-config.node';
