/**
 * @fileoverview Safe location helpers for test/SSR environments
 */

interface SafeLocationHeaders {
  readonly referer?: string;
  readonly origin?: string;
}

function getLocation(): Location | undefined {
  try {
    return globalThis.location;
  } catch {
    return undefined;
  }
}

export function getSafeHref(): string | undefined {
  try {
    return getLocation()?.href;
  } catch {
    return undefined;
  }
}

export function getSafeHostname(): string | undefined {
  try {
    return getLocation()?.hostname;
  } catch {
    return undefined;
  }
}

export function getSafeLocationHeaders(): SafeLocationHeaders {
  const referer = getSafeHref();
  const origin = getLocation()?.origin;

  if (!referer && !origin) return {};

  return {
    ...(referer ? { referer } : {}),
    ...(origin ? { origin } : {}),
  };
}
