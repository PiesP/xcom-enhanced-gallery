/**
 * Safe location helpers.
 *
 * This module centralizes best-effort access to location fields in environments
 * where `window`/`location` may be unavailable (tests, SSR-like contexts).
 */

export interface SafeLocationHeaders {
  readonly referer?: string;
  readonly origin?: string;
}

type LocationLike = {
  href?: string;
  origin?: string;
  hostname?: string;
};

function getLocationLike(): LocationLike | undefined {
  try {
    const anyGlobal = globalThis as unknown as { location?: LocationLike };
    return anyGlobal.location;
  } catch {
    return undefined;
  }
}

export function getSafeHref(): string | undefined {
  try {
    return getLocationLike()?.href;
  } catch {
    return undefined;
  }
}

export function getSafeOrigin(): string | undefined {
  try {
    return getLocationLike()?.origin;
  } catch {
    return undefined;
  }
}

export function getSafeHostname(): string | undefined {
  try {
    return getLocationLike()?.hostname;
  } catch {
    return undefined;
  }
}

export function getSafeLocationHeaders(): SafeLocationHeaders {
  const referer = getSafeHref();
  const origin = getSafeOrigin();

  if (!referer && !origin) {
    return {};
  }

  return {
    ...(referer ? { referer } : {}),
    ...(origin ? { origin } : {}),
  };
}
