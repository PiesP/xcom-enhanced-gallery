/**
 * @fileoverview Safe location helpers
 */

interface SafeLocationHeaders {
  readonly referer?: string;
  readonly origin?: string;
}

export function getSafeHref(): string | undefined {
  return globalThis.location?.href;
}

export function getSafeHostname(): string | undefined {
  return globalThis.location?.hostname;
}

export function getSafeLocationHeaders(): SafeLocationHeaders {
  const referer = getSafeHref();
  const origin = globalThis.location?.origin;

  if (!referer && !origin) return {};

  return {
    ...(referer ? { referer } : {}),
    ...(origin ? { origin } : {}),
  };
}
