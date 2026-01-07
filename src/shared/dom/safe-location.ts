/**
 * Safe location helpers.
 *
 * This module centralizes best-effort access to location fields in environments
 * where `window`/`location` may be unavailable (tests, SSR-like contexts).
 *
 * @module safe-location
 */

/**
 * HTTP headers derived from location properties.
 */
interface SafeLocationHeaders {
  readonly referer?: string;
  readonly origin?: string;
}

/**
 * Subset of Location API properties.
 */
type LocationLike = {
  readonly href?: string;
  readonly origin?: string;
  readonly hostname?: string;
};

/**
 * Attempts to retrieve the global location object.
 *
 * @returns Location-like object if available, undefined otherwise.
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
 * Safely retrieves a specific location property.
 *
 * @template K - Key of LocationLike
 * @param key - Property name to retrieve
 * @returns Property value if available, undefined otherwise.
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
 * Internal helper to retrieve the origin property.
 *
 * @returns Origin string if available, undefined otherwise.
 */
function getSafeOrigin(): string | undefined {
  return getSafeLocationValue('origin');
}

/**
 * Safely retrieves the current page URL.
 *
 * @returns Current href if available, undefined in test/SSR contexts.
 *
 * @example
 * ```typescript
 * const url = getSafeHref();
 * if (url) {
 *   console.log('Current URL:', url);
 * }
 * ```
 */
export function getSafeHref(): string | undefined {
  return getSafeLocationValue('href');
}

/**
 * Safely retrieves the current hostname.
 *
 * @returns Hostname if available, undefined in test/SSR contexts.
 *
 * @example
 * ```typescript
 * const host = getSafeHostname();
 * if (host === 'x.com') {
 *   // X.com-specific logic
 * }
 * ```
 */
export function getSafeHostname(): string | undefined {
  return getSafeLocationValue('hostname');
}

/**
 * Builds HTTP headers from location properties.
 *
 * Useful for API requests that require referrer/origin headers.
 *
 * @returns Object containing available location-based headers.
 *
 * @example
 * ```typescript
 * const headers = getSafeLocationHeaders();
 * fetch(url, { headers: { ...headers, 'Content-Type': 'application/json' } });
 * ```
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
