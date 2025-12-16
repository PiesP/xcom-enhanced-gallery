/**
 * @fileoverview Pure host selection for Twitter API requests.
 *
 * This module is intentionally side-effect free.
 */

export type TwitterApiHost = 'x.com' | 'twitter.com';

export interface SelectTwitterApiHostArgs<TSupported extends string> {
  hostname: string | undefined;
  supportedHosts: readonly TSupported[];
  defaultHost: TSupported;
}

function pickCandidateHost(hostname: string): TwitterApiHost | null {
  // Handle subdomains (e.g., mobile.twitter.com)
  if (hostname.includes('twitter.com')) {
    return 'twitter.com';
  }

  if (hostname.includes('x.com')) {
    return 'x.com';
  }

  return null;
}

/**
 * Select a supported base host from a (possibly subdomain) hostname.
 */
export function selectTwitterApiHostFromHostname<TSupported extends string>(
  args: SelectTwitterApiHostArgs<TSupported>
): TSupported {
  const { hostname, supportedHosts, defaultHost } = args;

  if (!hostname) {
    return defaultHost;
  }

  const candidate = pickCandidateHost(hostname);
  if (!candidate) {
    return defaultHost;
  }

  return supportedHosts.includes(candidate as TSupported) ? (candidate as TSupported) : defaultHost;
}
