/**
 * Browser-safe config path helpers.
 *
 * @deprecated
 * This module historically exported `findConfig*` names which are misleading
 * in browser/runtime code because no filesystem probing happens here.
 *
 * Prefer importing from `@/utils/config-path` and using `joinConfigPath*`.
 */

/**
 * @deprecated Use `joinConfigPath`.
 */
/**
 * @deprecated Use `joinFirstConfigPath`.
 */
export {
  joinConfigPath,
  joinConfigPath as findConfig,
  joinFirstConfigPath,
  joinFirstConfigPath as findConfigAny,
} from './config-path';
