/**
 * Safe settings accessor for features layer
 * - Avoids importing ServiceManager directly in features
 * - Uses optional global adapter bridge or lazy getter functions
 */
import type { ISettingsService } from './AppContainer';

/**
 * Attempt to get settings service via legacy adapter if present, otherwise null.
 */
export function tryGetSettingsService(): ISettingsService | null {
  // DEV 전용: 레거시 어댑터 브리지 접근 (prod 번들에 전역 키 문자열이 포함되지 않도록 가드)
  if (!import.meta.env.DEV) return null;
  try {
    const anyGlobal = globalThis as unknown as Record<string, unknown>;
    const LEGACY_KEY = '__XEG_LEGACY_ADAPTER__';
    const adapter = anyGlobal[LEGACY_KEY] as { getService: (key: string) => unknown } | undefined;
    if (adapter) {
      const svc = adapter.getService('SETTINGS') as unknown as ISettingsService;
      return (svc as ISettingsService) ?? null;
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

/**
 * Write a settings key safely; no-op if service is unavailable.
 */
export async function setSetting<T>(key: string, value: T): Promise<void> {
  const svc = tryGetSettingsService();
  if (!svc) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (svc as any).set?.(key as unknown as string, value);
  } catch {
    // ignore in non-browser/test environments
  }
}
