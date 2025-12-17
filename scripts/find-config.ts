/**
 * Entry point for Node-only config discovery utilities.
 *
 * This module is intended for tooling and tests (Node.js only).
 */

export {
  findConfig,
  findConfigAny,
  findConfigFilePath,
  findFirstConfigFilePath,
} from './utils/find-config';
