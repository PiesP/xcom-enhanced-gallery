import { logger } from '@shared/logging/logger';

export interface TrustedHostnameGuardOptions {
  /** 허용할 프로토콜 목록 (기본: https/http) */
  allowedProtocols?: readonly string[];
  /** 서브도메인을 허용할지 여부 (기본: false) */
  allowSubdomains?: boolean;
  /** 상대 경로를 허용할지 여부 (기본: false) */
  allowRelative?: boolean;
}

const DEFAULT_PROTOCOLS = Object.freeze(['https:', 'http:'] as const);
type HostnameAllowlistInput = ReadonlyArray<string> | ReadonlySet<string>;

/** 문자열 allowlist를 Set으로 정규화 */
function normalizeAllowlist(allowlist: HostnameAllowlistInput): ReadonlySet<string> {
  if (allowlist instanceof Set) {
    return allowlist;
  }
  return new Set(allowlist);
}

/**
 * URL에서 hostname을 추출하는 보조 함수. URL API가 없으면 정규식 폴백 사용.
 */
function extractHostname(url: string): string | null {
  const URLCtor =
    typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function'
      ? globalThis.URL
      : undefined;

  if (URLCtor) {
    try {
      const parsed = new URLCtor(url);
      return parsed.hostname.toLowerCase();
    } catch (error) {
      logger.debug('[url-safety] URL parsing failed, falling back to regex:', error);
    }
  }

  const match = url.match(/^https?:\/\/([^/?#]+)/i);
  const hostname = match?.[1]?.toLowerCase() ?? null;
  if (!hostname) {
    return null;
  }

  // IPv6 literal은 [ ] 로 둘러싸이므로 제거
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    return hostname.slice(1, -1);
  }

  return hostname;
}

/**
 * 허용된 호스트명인지 검사합니다.
 */
export function isTrustedHostname(
  url: string,
  allowlist: ReadonlyArray<string> | ReadonlySet<string>,
  options: TrustedHostnameGuardOptions = {}
): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return false;
  }

  if (!options.allowRelative) {
    if (trimmed.startsWith('/') || trimmed.startsWith('//')) {
      return false;
    }
  }

  const normalizedAllowlist = normalizeAllowlist(allowlist);
  if (normalizedAllowlist.size === 0) {
    return false;
  }

  const hostname = extractHostname(trimmed);
  if (!hostname) {
    return false;
  }

  const protocols = options.allowedProtocols ?? DEFAULT_PROTOCOLS;
  if (typeof URL !== 'undefined') {
    try {
      const parsed = new URL(trimmed);
      if (!protocols.includes(parsed.protocol)) {
        return false;
      }
    } catch {
      // URL 생성 실패 시 프로토콜은 정규식으로 유추 (이미 extractHostname 성공)
      const matches = trimmed.match(/^(\w+:)/);
      const fallbackProtocol = matches?.[1]?.toLowerCase();
      if (fallbackProtocol && !protocols.includes(fallbackProtocol)) {
        return false;
      }
    }
  }

  for (const trusted of normalizedAllowlist) {
    const normalizedTrusted = trusted.toLowerCase();
    if (hostname === normalizedTrusted) {
      return true;
    }

    if (options.allowSubdomains && hostname.endsWith(`.${normalizedTrusted}`)) {
      return true;
    }
  }

  return false;
}

export function createTrustedHostnameGuard(
  allowlist: HostnameAllowlistInput,
  options: TrustedHostnameGuardOptions = {}
): (candidate: string) => boolean {
  return (candidate: string) => isTrustedHostname(candidate, allowlist, options);
}

export const TWITTER_MEDIA_HOSTS = Object.freeze(['pbs.twimg.com', 'video.twimg.com'] as const);
export const TWITTER_APP_HOSTS = Object.freeze(['twitter.com', 'x.com'] as const);
