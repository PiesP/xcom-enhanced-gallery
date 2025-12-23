/**
 * Safe location helpers.
 *
 * This module centralizes best-effort access to location fields in environments
 * where `window`/`location` may be unavailable (tests, SSR-like contexts).
 */

interface SafeLocationHeaders {
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

function getSafeLocationValue<K extends keyof LocationLike>(key: K): LocationLike[K] | undefined {
  const location = getLocationLike();
  if (!location) return undefined;
  try {
    return location[key];
  } catch {
    return undefined;
  }
}

export function getSafeHref(): string | undefined {
  return getSafeLocationValue('href');
}

function getSafeOrigin(): string | undefined {
  return getSafeLocationValue('origin');
}

export function getSafeHostname(): string | undefined {
  return getSafeLocationValue('hostname');
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
