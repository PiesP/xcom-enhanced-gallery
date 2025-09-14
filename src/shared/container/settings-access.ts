/**
 * Safe settings accessor for features layer
 * - Avoids importing ServiceManager directly in features
 * - Uses ServiceManager bridge getters (no legacy globals)
 */
import { bridgeTryGet } from './service-bridge';
import { SERVICE_KEYS } from '@/constants';

// Minimal settings service contract used by accessors (avoid AppContainer types)
interface SettingsServiceLike {
  get<T = unknown>(key: string): T;
  set<T = unknown>(key: string, value: T): Promise<void>;
  cleanup?: () => void;
}

/**
 * Attempt to get settings service via legacy adapter if present, otherwise null.
 */
export function tryGetSettingsService(): SettingsServiceLike | null {
  // Prefer ServiceManager bridge (works in runtime and test when settings registered)
  const svc = bridgeTryGet<SettingsServiceLike>(SERVICE_KEYS.SETTINGS);
  return svc ?? null;
}

/**
 * Read a settings key safely; returns defaultValue if unavailable.
 */
export function getSetting<T>(key: string, defaultValue: T): T {
  const svc = tryGetSettingsService();
  if (!svc) return defaultValue;
  try {
    return (svc.get<T>(key) ?? defaultValue) as T;
  } catch {
    return defaultValue;
  }
}

/**
 * Write a settings key safely; no-op if service is unavailable.
 */
export async function setSetting<T>(key: string, value: T): Promise<void> {
  const svc = tryGetSettingsService();
  if (!svc) return;
  try {
    await svc.set?.(key, value);
  } catch {
    // ignore in non-browser/test environments
  }
}
