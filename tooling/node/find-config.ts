/**
 * Entry point for Node-only config discovery utilities.
 *
 * Provides utilities to locate configuration files by searching upward through
 * the directory tree. Intended for tooling and test setup (Node.js only) and
 * must never be imported by browser/runtime code.
 *
 * Functions:
 * - `findConfigFilePath` (alias: `findConfig`): Search for a single config file by name
 * - `findFirstConfigFilePath` (alias: `findConfigAny`): Search for the first matching
 *   file from multiple candidates (useful when multiple config names are acceptable)
 */
export {
  findConfigFilePath,
  findConfigFilePath as findConfig,
  findFirstConfigFilePath,
  findFirstConfigFilePath as findConfigAny,
} from './utils/find-config.node';
