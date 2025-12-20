/**
 * Entry point for Node-only config discovery utilities.
 *
 * This module is intended for tooling and tests (Node.js only).
 */

export {
  findConfigFilePath,
  findConfigFilePath as findConfig,
  findFirstConfigFilePath,
  findFirstConfigFilePath as findConfigAny,
} from './utils/find-config.node';
