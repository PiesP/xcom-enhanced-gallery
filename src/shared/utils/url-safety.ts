import { logger } from '@shared/logging/logger';

export interface TrustedHostnameGuardOptions {
  /** 허용할 프로토콜 목록 (기본: https/http) */
  allowedProtocols?: readonly string[];
  /** 서브도메인을 허용할지 여부 (기본: false) */
  allowSubdomains?: boolean;
  /** 상대 경로를 허용할지 여부 (기본: false) */
  allowRelative?: boolean;
}

/** HTTPS만 허용 (기본값, 보안 권장) */
const STRICT_PROTOCOLS = Object.freeze(['https:'] as const);
/**
 * 참고: 이전에는 DEFAULT_PROTOCOLS = ['https:', 'http:']를 기본값으로 사용했으나,
 * 보안 강화를 위해 STRICT_PROTOCOLS (HTTPS만)를 기본값으로 변경했습니다.
 * HTTP를 허용하려면 명시적으로 allowedProtocols 옵션을 전달하세요.
 */
type HostnameAllowlistInput = ReadonlyArray<string> | ReadonlySet<string>;

let hasLoggedMissingUrlConstructor = false;
let hasLoggedUrlParseFailure = false;

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

export interface ParsedTrustedUrl {
  href: string;
  hostname: string;
}

export type ParseTrustedUrlOptions = TrustedHostnameGuardOptions;

function sanitizeResult(result: ParsedTrustedUrl): ParsedTrustedUrl {
  Object.setPrototypeOf(result, null);
  return Object.freeze(result);
}

/*#__PURE__*/ export function parseTrustedUrl(
  candidate: string,
  allowlist: HostnameAllowlistInput,
  options: ParseTrustedUrlOptions = {}
): ParsedTrustedUrl | null {
  if (!candidate || typeof candidate !== 'string') {
    return null;
  }

  const normalizedAllowlist = normalizeAllowlist(allowlist);
  if (normalizedAllowlist.size === 0) {
    return null;
  }

  const trimmed = candidate.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (!options.allowRelative) {
    if (trimmed.startsWith('/') || trimmed.startsWith('//')) {
      return null;
    }
  }

  const allowedProtocols = options.allowedProtocols ?? STRICT_PROTOCOLS;
  const allowSubdomains = options.allowSubdomains ?? false;

  let parsedUrl: URL | null = null;
  let hostname: string | null = null;
  let protocol: string | null = null;

  const URLConstructor =
    typeof globalThis !== 'undefined' && typeof globalThis.URL === 'function'
      ? (globalThis.URL as typeof URL)
      : undefined;

  if (URLConstructor) {
    try {
      parsedUrl = new URLConstructor(trimmed);
      hostname = parsedUrl.hostname.toLowerCase();
      protocol = parsedUrl.protocol.toLowerCase();
    } catch (error) {
      if (!hasLoggedUrlParseFailure) {
        logger.debug('[url-safety] Failed to parse candidate via URL constructor:', error);
        hasLoggedUrlParseFailure = true;
      }
    }
  } else if (!hasLoggedMissingUrlConstructor) {
    logger.debug('[url-safety] URL constructor unavailable, falling back to manual parsing');
    hasLoggedMissingUrlConstructor = true;
  }

  if (!hostname) {
    hostname = extractHostname(trimmed);
  }

  if (!protocol) {
    protocol = trimmed.match(/^(\w+:)/)?.[1]?.toLowerCase() ?? null;
  }

  if (!hostname) {
    return null;
  }

  if (protocol) {
    if (!allowedProtocols.includes(protocol)) {
      return null;
    }
  } else if (!options.allowRelative) {
    return null;
  }

  let isAllowed = false;

  for (const trusted of normalizedAllowlist) {
    const normalizedTrusted = trusted.toLowerCase();
    if (hostname === normalizedTrusted) {
      isAllowed = true;
      break;
    }

    if (allowSubdomains && hostname.endsWith(`.${normalizedTrusted}`)) {
      isAllowed = true;
      break;
    }
  }

  if (!isAllowed) {
    return null;
  }

  if (!parsedUrl) {
    return sanitizeResult({ href: trimmed, hostname });
  }

  return sanitizeResult({ href: parsedUrl.href, hostname });
}

/**
 * 허용된 호스트명인지 검사합니다.
 * 기본적으로 HTTPS만 허용합니다 (보안 강화).
 */
/*#__PURE__*/ export function isTrustedHostname(
  url: string,
  allowlist: ReadonlyArray<string> | ReadonlySet<string>,
  options: TrustedHostnameGuardOptions = {}
): boolean {
  const parsed = parseTrustedUrl(url, allowlist, {
    ...options,
    allowedProtocols: options.allowedProtocols ?? STRICT_PROTOCOLS,
  });

  return parsed !== null;
}

/*#__PURE__*/ export function createTrustedHostnameGuard(
  allowlist: HostnameAllowlistInput,
  options: TrustedHostnameGuardOptions = {}
): (candidate: string) => boolean {
  return (candidate: string) => isTrustedHostname(candidate, allowlist, options);
}

export const TWITTER_MEDIA_HOSTS = Object.freeze(['pbs.twimg.com', 'video.twimg.com'] as const);
export const TWITTER_APP_HOSTS = Object.freeze(['twitter.com', 'x.com'] as const);
