import { getResolvedGMAPIsCached } from '@shared/external/userscript/adapter';
import type { GMAPIName } from '@shared/external/userscript/environment-detector.types';

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

export function isGMAPIAvailable(apiName: GMAPIName): boolean {
  const checker = GM_API_CHECKS[apiName];
  return checker(getResolvedGMAPIsCached());
}
