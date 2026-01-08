/**
 * @fileoverview Safe location helpers for test/SSR environments
 * @description Centralized access to location fields when unavailable.
 */

interface SafeLocationHeaders {
  readonly referer?: string;
  readonly origin?: string;
}

type LocationLike = {
  readonly href?: string;
  readonly origin?: string;
  readonly hostname?: string;
};

/**
 * Retrieve the global location object if available.
 * @returns Location-like object, or undefined if unavailable
 */
function getLocationLike(): LocationLike | undefined {
  try {
    const anyGlobal = globalThis as unknown as { location?: LocationLike };
    return anyGlobal.location;
  } catch {
    return undefined;
  }
}

/**
 * Safely retrieve a specific location property.
 * @template K - Key of LocationLike
 * @param key - Property name to retrieve
 * @returns Property value, or undefined if unavailable
 */
function getSafeLocationValue<K extends keyof LocationLike>(key: K): LocationLike[K] | undefined {
  const location = getLocationLike();
  if (!location) {
    return undefined;
  }
  try {
    return location[key];
  } catch {
    return undefined;
  }
}

/**
 * Retrieve the origin property.
 * @returns Origin string, or undefined if unavailable
 */
function getSafeOrigin(): string | undefined {
  return getSafeLocationValue('origin');
}

/**
 * Safely retrieve the current page URL.
 * @returns Current href, or undefined in test/SSR contexts
 */
export function getSafeHref(): string | undefined {
  return getSafeLocationValue('href');
}

/**
 * Safely retrieve the current hostname.
 * @returns Hostname, or undefined in test/SSR contexts
 */
export function getSafeHostname(): string | undefined {
  return getSafeLocationValue('hostname');
}

/**
 * Build HTTP headers from location properties for API requests.
 * @returns Object containing available location-based headers
 */
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
