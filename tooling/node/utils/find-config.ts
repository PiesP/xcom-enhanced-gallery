/**
 * Node-only config discovery utilities.
 *
 * @deprecated
 * Prefer importing from `./find-config.node` for a clearer signal that this is
 * Node-only filesystem probing.
 */

/**
 * @deprecated Use `findConfigFilePath`.
 */
/**
 * @deprecated Use `findFirstConfigFilePath`.
 */
export {
  findConfigFilePath,
  findConfigFilePath as findConfig,
  findFirstConfigFilePath,
  findFirstConfigFilePath as findConfigAny,
} from './find-config.node';
