/**
 * Safe settings accessor for features layer
 * - Avoids importing ServiceManager directly in features
 * - Uses optional global adapter bridge or lazy getter functions
 */
import { SERVICE_KEYS } from '@/constants';
import type { ISettingsService } from './AppContainer';

/**
 * Attempt to get settings service via legacy adapter if present, otherwise null.
 */
export function tryGetSettingsService(): ISettingsService | null {
  // Prefer global legacy adapter bridge installed by AppContainer when enabled
  const anyGlobal = globalThis as unknown as {
    __XEG_LEGACY_ADAPTER__?: { getService: (key: string) => unknown };
  };

  try {
    const adapter = anyGlobal.__XEG_LEGACY_ADAPTER__;
    if (adapter) {
      const svc = adapter.getService(
        SERVICE_KEYS.SETTINGS as unknown as string
      ) as unknown as ISettingsService;
      return svc ?? null;
    }
  } catch {
    // ignore and fallback
  }

  return null;
}

/**
 * Read a settings key safely; returns defaultValue if unavailable.
 */
export function getSetting<T>(key: string, defaultValue: T): T {
  const svc = tryGetSettingsService();
  if (!svc) return defaultValue;
  try {
    return (svc.get<T>(key as unknown as string) ?? defaultValue) as T;
  } catch {
    return defaultValue;
  }
}
