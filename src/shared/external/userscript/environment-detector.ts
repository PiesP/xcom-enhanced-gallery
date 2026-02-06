/**
 * @fileoverview Tampermonkey API availability detector
 * @description Check which GM_* APIs are available in runtime
 */

import { getResolvedGMAPIsCached } from '@shared/external/userscript/adapter';
import type { GMAPIName } from '@shared/external/userscript/environment-detector.types';

/**
 * Detector functions for GM API availability
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
 * Check if specific Tampermonkey API is available
 * @param apiName - API name to check (e.g., 'download', 'notification')
 * @returns true if API is available and callable
 * @internal
 */
export function isGMAPIAvailable(apiName: GMAPIName): boolean {
  const checker = GM_API_CHECKS[apiName];
  try {
    return checker(getResolvedGMAPIsCached());
  } catch {
    return false;
  }
}
