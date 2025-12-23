/**
 * @fileoverview Centralized URL safety utilities
 * @description Provides canonical sanitization + policy enforcement for user-controlled URLs
 */

// Control character regex patterns for URL sanitization
// These patterns intentionally match control characters (U+0000-U+001F, U+007F)
const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;
const SCHEME_WHITESPACE_REGEX = /[\u0000-\u001F\u007F\s]+/g;
const EXPLICIT_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const MAX_DECODE_ITERATIONS = 3;
const MAX_SCHEME_PROBE_LENGTH = 64;

const DEFAULT_BLOCKED_PROTOCOL_HINTS = Object.freeze([
  'javascript:',
  'vbscript:',
  'file:',
  'filesystem:',
  'ms-appx:',
  'ms-appx-web:',
  'about:',
  'intent:',
  'mailto:',
  'tel:',
  'sms:',
  'wtai:',
  'chrome:',
  'chrome-extension:',
  'opera:',
  'resource:',
  'data:text',
  'data:application',
  'data:video',
  'data:audio',
]);

const MEDIA_SAFE_PROTOCOLS = new Set(['http:', 'https:', 'blob:']) as ReadonlySet<string>;
const DATA_IMAGE_MIME_PREFIXES = Object.freeze([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/avif',
]);

interface UrlSafetyPolicy {
  readonly allowedProtocols: ReadonlySet<string>;
  readonly allowRelative?: boolean;
  readonly allowProtocolRelative?: boolean;
  readonly allowFragments?: boolean;
  readonly allowDataUrls?: boolean;
  readonly allowedDataMimePrefixes?: readonly string[];
  readonly blockedProtocolHints?: readonly string[];
}

export const MEDIA_URL_POLICY: UrlSafetyPolicy = {
  allowedProtocols: MEDIA_SAFE_PROTOCOLS,
  allowRelative: true,
  allowProtocolRelative: true,
  allowFragments: false,
  allowDataUrls: true,
  allowedDataMimePrefixes: DATA_IMAGE_MIME_PREFIXES,
} as const;

export function isUrlAllowed(rawUrl: string | null | undefined, policy: UrlSafetyPolicy): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return false;
  }

  const normalized = rawUrl.replace(CONTROL_CHARS_REGEX, '').trim();
  if (!normalized) {
    return false;
  }

  const blockedHints = policy.blockedProtocolHints ?? DEFAULT_BLOCKED_PROTOCOL_HINTS;
  if (startsWithBlockedProtocolHint(normalized, blockedHints)) {
    return false;
  }

  const lower = normalized.toLowerCase();

  if (lower.startsWith('data:')) {
    return policy.allowDataUrls === true && isAllowedDataUrl(lower, policy.allowedDataMimePrefixes);
  }

  if (lower.startsWith('//')) {
    return handleProtocolRelative(normalized, policy);
  }

  if (policy.allowFragments && lower.startsWith('#')) {
    return true;
  }

  const hasScheme = EXPLICIT_SCHEME_REGEX.test(normalized);
  if (!hasScheme) {
    return policy.allowRelative === true;
  }

  try {
    const parsed = new URL(normalized);
    return policy.allowedProtocols.has(parsed.protocol);
  } catch {
    return false;
  }
}

function startsWithBlockedProtocolHint(value: string, hints: readonly string[]): boolean {
  const probe = value.slice(0, MAX_SCHEME_PROBE_LENGTH);

  // If the probe contains an invalid percent-encoding sequence (e.g., '%ZZ'),
  // consider it suspicious and treat it as a blocked hint. This prevents
  // malicious obfuscation with invalid sequences from bypassing detection.
  if (/%(?![0-9A-Fa-f]{2})/.test(probe)) {
    return true;
  }
  const variants = buildProbeVariants(probe);

  return variants.some((candidate) => hints.some((hint) => candidate.startsWith(hint)));
}

function buildProbeVariants(value: string): string[] {
  const variants = new Set<string>();
  const base = value.toLowerCase();
  variants.add(base);
  variants.add(base.replace(SCHEME_WHITESPACE_REGEX, ''));

  let decoded = base;
  for (let i = 0; i < MAX_DECODE_ITERATIONS; i += 1) {
    try {
      decoded = decodeURIComponent(decoded);
      variants.add(decoded);
      variants.add(decoded.replace(SCHEME_WHITESPACE_REGEX, ''));
    } catch {
      break;
    }
  }

  return Array.from(variants.values());
}

function isAllowedDataUrl(
  lowerCaseValue: string,
  allowedPrefixes: readonly string[] | undefined
): boolean {
  if (!allowedPrefixes || allowedPrefixes.length === 0) {
    return false;
  }

  const metaSection = lowerCaseValue.slice('data:'.length);
  const [mime] = metaSection.split(';', 1);

  if (!mime) {
    return false;
  }

  return allowedPrefixes.some((prefix) => mime.startsWith(prefix));
}

function handleProtocolRelative(url: string, policy: UrlSafetyPolicy): boolean {
  if (!policy.allowProtocolRelative) {
    return false;
  }

  const fallbackProtocol = policy.allowedProtocols.has('https:')
    ? 'https:'
    : policy.allowedProtocols.has('http:')
      ? 'http:'
      : 'https:';

  try {
    const resolved = new URL(`${fallbackProtocol}${url}`);
    return policy.allowedProtocols.has(resolved.protocol);
  } catch {
    return false;
  }
}
