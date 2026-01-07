import { getResolvedGMAPIsCached } from '@shared/external/userscript/adapter';
import type { GMAPIName } from '@shared/external/userscript/environment-detector.types';

/**
 * Mapping of API names to detector functions.
 * Each checker validates if the corresponding Tampermonkey API is available and callable.
 */
const GM_API_CHECKS: Record<
  GMAPIName,
  (gm: ReturnType<typeof getResolvedGMAPIsCached>) => boolean
> = {
  getValue: (gm) => typeof gm.getValue === 'function',
  setValue: (gm) => typeof gm.setValue === 'function',
  download: (gm) => typeof gm.download === 'function',
  notification: (gm) => typeof gm.notification === 'function',
  deleteValue: (gm) => typeof gm.deleteValue === 'function',
  listValues: (gm) => typeof gm.listValues === 'function',
  cookie: (gm) => typeof gm.cookie?.list === 'function',
};

/**
 * Check if a specific Tampermonkey API is available
 *
 * Maps simplified API names to full GM_* function names and verifies availability.
 *
 * **Supported API Names**:
 * - 'getValue', 'setValue', 'download', 'notification'
 * - 'deleteValue', 'listValues', 'cookie'
 *
 * @param apiName - Name of the API to check (e.g., 'download', 'notification')
 * @returns True if the API function is available and is a function
 * @internal
 *
 * @example
 * ```typescript
 * if (isGMAPIAvailable('download')) {
 *   // Can use DownloadService (Tampermonkey required)
 * }
 * ```
 */
export function isGMAPIAvailable(apiName: GMAPIName): boolean {
  const checker = GM_API_CHECKS[apiName];
  try {
    return checker(getResolvedGMAPIsCached());
  } catch {
    return false;
  }
}
