/**
 * Host validation utilities to prevent substring-based URL checks.
 *
 * Provides helpers for parsing URLs safely (with protocol-relative and
 * relative support) and matching against allow-listed hostnames.
 */

const ABSOLUTE_PROTOCOL_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const FALLBACK_BASE_URL = 'https://x.com';

export interface HostMatchOptions {
  /**
   * Allow matching subdomains of the provided hostnames.
   * For example, allowing `images.example.com` when `example.com` is provided.
   */
  readonly allowSubdomains?: boolean;
}

/**
 * Attempt to parse any URL-like value into a `URL` instance.
 *
 * - Supports absolute URLs
 * - Supports protocol-relative URLs (//cdn.example.com/...)
 * - Supports relative paths resolved against https://x.com
 */
export function tryParseUrl(
  value: string | URL | null | undefined,
  base: string = FALLBACK_BASE_URL,
): URL | null {
  if (value instanceof URL) {
    return value;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  try {
    if (trimmed.startsWith('//')) {
      return new URL(`https:${trimmed}`);
    }

    if (ABSOLUTE_PROTOCOL_REGEX.test(trimmed)) {
      return new URL(trimmed);
    }

    return new URL(trimmed, base);
  } catch {
    return null;
  }
}

/**
 * Convenience helper to extract the hostname from a URL-like value.
 */
export function getHostname(value: string | URL | null | undefined): string | null {
  const parsed = tryParseUrl(value);
  return parsed?.hostname ?? null;
}

/**
 * Determine whether a URL belongs to a trusted host list without relying on substring checks.
 */
export function isHostMatching(
  value: string | URL | null | undefined,
  allowedHosts: readonly string[],
  options: HostMatchOptions = {},
): boolean {
  if (!Array.isArray(allowedHosts) || allowedHosts.length === 0) {
    return false;
  }

  const parsed = tryParseUrl(value);
  if (!parsed) {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  const allowSubdomains = options.allowSubdomains === true;

  return allowedHosts.some((host) => {
    const normalized = host.toLowerCase();
    if (hostname === normalized) {
      return true;
    }

    return allowSubdomains && hostname.endsWith(`.${normalized}`);
  });
}
