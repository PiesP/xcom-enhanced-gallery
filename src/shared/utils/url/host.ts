/**
 * Host validation utilities to prevent substring-based URL checks.
 *
 * Provides helpers for parsing URLs safely (with protocol-relative and
 * relative support) and matching against allow-listed hostnames.
 */

const FALLBACK_BASE_URL = 'https://x.com';

interface HostMatchOptions {
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
  base: string = FALLBACK_BASE_URL
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

    return new URL(trimmed, base);
  } catch {
    return null;
  }
}

/**
 * Determine whether a URL belongs to a trusted host list without relying on substring checks.
 */
export function isHostMatching(
  value: string | URL | null | undefined,
  allowedHosts: readonly string[],
  options: HostMatchOptions = {}
): boolean {
  if (!Array.isArray(allowedHosts)) {
    return false;
  }

  const parsed = value instanceof URL ? value : tryParseUrl(value);
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

/** Reserved Twitter/X.com paths that are not usernames */
const RESERVED_TWITTER_PATHS = new Set([
  'home',
  'explore',
  'notifications',
  'messages',
  'search',
  'settings',
  'i',
  'intent',
  'compose',
  'hashtag',
]);

/** Valid Twitter username pattern: 1-15 alphanumeric or underscore characters */
const TWITTER_USERNAME_PATTERN = /^[a-zA-Z0-9_]{1,15}$/;

/** Trusted Twitter/X.com hosts */
const TWITTER_HOSTS = ['twitter.com', 'x.com'] as const;

interface ExtractUsernameOptions {
  /**
   * Require strict host validation (only twitter.com/x.com)
   * @default false
   */
  readonly strictHost?: boolean;
}

/**
 * Extract Twitter username from a URL path.
 *
 * Supports both absolute URLs (https://twitter.com/user/status/123)
 * and relative paths (/user/status/123).
 *
 * Only extracts username when path follows the pattern /username/status/id
 * where 'status' is the second segment.
 *
 * @param url - URL or path to extract username from
 * @param options - Extraction options
 * @returns Username or null if not found/invalid
 */
export function extractUsernameFromUrl(
  url: string | null | undefined,
  options: ExtractUsernameOptions = {}
): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  try {
    // Determine path based on URL type
    let path: string;

    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      // Absolute or protocol-relative URL
      const parsed = tryParseUrl(url);
      if (!parsed) {
        return null;
      }

      // Strict host validation if requested
      if (options.strictHost) {
        if (!isHostMatching(parsed, TWITTER_HOSTS, { allowSubdomains: true })) {
          return null;
        }
      }

      path = parsed.pathname;
    } else {
      // Relative path
      path = url;
    }

    // Extract username from path segments
    const segments = path.split('/').filter(Boolean);

    // Pattern: /username/status/id (strict pattern matching)
    // Only extract username when 'status' is the second segment
    if (segments.length >= 3 && segments[1] === 'status') {
      const username = segments[0];
      if (!username) {
        return null;
      }

      // Check for reserved paths
      if (RESERVED_TWITTER_PATHS.has(username.toLowerCase())) {
        return null;
      }

      // Validate username format
      if (TWITTER_USERNAME_PATTERN.test(username)) {
        return username;
      }
    }

    return null;
  } catch {
    return null;
  }
}
