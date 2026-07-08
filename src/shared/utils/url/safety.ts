// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Centralized URL safety utilities
 */

// S6: Extended to include zero-width characters (U+200B-U+200F, U+2060, U+FEFF)
// that can be used for injection or visual spoofing attacks.
const CONTROL_CHARS_REGEX = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2060\ufeff]/g;
const SCHEME_WHITESPACE_REGEX = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2060\ufeff\s]+/g;
const EXPLICIT_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const MAX_DECODE_ITERATIONS = 3;
const MAX_SCHEME_PROBE_LENGTH = 64;

const DEFAULT_BLOCKED_PROTOCOL_HINTS = [
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
] as const;

const MEDIA_SAFE_PROTOCOLS = Object.freeze(new Set(['http:', 'https:'])) as ReadonlySet<string>;

const DATA_IMAGE_MIME_PREFIXES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/avif',
] as const;

export interface UrlSafetyPolicy {
  readonly allowedProtocols: ReadonlySet<string>;
  readonly allowRelative?: boolean;
  readonly allowProtocolRelative?: boolean;
  readonly allowFragments?: boolean;
  readonly allowDataUrls?: boolean;
  readonly allowedDataMimePrefixes?: readonly string[];
  readonly blockedProtocolHints?: readonly string[];
}

export const MEDIA_URL_POLICY = {
  allowedProtocols: MEDIA_SAFE_PROTOCOLS,
  allowRelative: true,
  allowProtocolRelative: true,
  allowFragments: false,
  allowDataUrls: true,
  allowedDataMimePrefixes: DATA_IMAGE_MIME_PREFIXES,
} as const;

/**
 * ⚠️ MEDIA_URL_POLICY is for media rendering sinks ONLY (<img>, <video>).
 * Do NOT reuse for <iframe>, <a href>, or any script-injectable context.
 * The allowDataUrls flag is safe for media elements but dangerous if applied
 * to other sinks. For non-media URL validation, create a separate policy
 * with allowDataUrls: false.
 */

/**
 * Check whether a raw URL value is allowed under the given safety policy.
 *
 * Performs control-character stripping, blocked-protocol-hint detection,
 * data URL MIME filtering, and protocol allow-listing.
 *
 * @param rawUrl - The URL string to check (null/undefined returns false)
 * @param policy - The safety policy to enforce
 * @returns True if the URL is allowed, false otherwise
 */
export function isUrlAllowed(rawUrl: string | null | undefined, policy: UrlSafetyPolicy): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;

  const normalized = rawUrl.replace(CONTROL_CHARS_REGEX, '').trim();
  if (!normalized) return false;

  const blockedHints = policy.blockedProtocolHints ?? DEFAULT_BLOCKED_PROTOCOL_HINTS;
  if (startsWithBlockedProtocolHint(normalized, blockedHints)) return false;

  const lower = normalized.toLowerCase();

  if (lower.startsWith('data:')) {
    return policy.allowDataUrls === true && isAllowedDataUrl(lower, policy.allowedDataMimePrefixes);
  }

  if (lower.startsWith('//')) return handleProtocolRelative(normalized, policy);

  if (policy.allowFragments && lower.startsWith('#')) return true;

  const hasScheme = EXPLICIT_SCHEME_REGEX.test(normalized);
  if (!hasScheme) return policy.allowRelative === true;

  try {
    const parsed = new URL(normalized);
    return policy.allowedProtocols.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Check whether a value begins with a blocked protocol hint.
 *
 * Decodes URL-encoded characters up to MAX_DECODE_ITERATIONS times
 * to catch obfuscated protocol identifiers (e.g., "jav%61script:").
 *
 * @param value - The string to probe
 * @param hints - Protocol hint prefixes to check against
 * @returns True if a blocked protocol hint is detected
 */
export function startsWithBlockedProtocolHint(value: string, hints: readonly string[]): boolean {
  const probe = value.slice(0, MAX_SCHEME_PROBE_LENGTH);

  // M9: Scope malformed-% check to the scheme region (before first ':')
  // to avoid false positives like '?q=100%off' in query strings.
  // If no scheme separator exists, check the whole probe.
  const schemeEnd = probe.indexOf(':');
  const schemeRegion = schemeEnd >= 0 ? probe.slice(0, schemeEnd) : probe;
  if (/%(?![0-9A-Fa-f]{2})/.test(schemeRegion)) return true;

  const variants = buildProbeVariants(probe);
  return variants.some((candidate) => hints.some((hint) => candidate.startsWith(hint)));
}

function buildProbeVariants(value: string): string[] {
  const variants = new Set<string>();
  const base = value.toLowerCase();
  variants.add(base);
  variants.add(base.replace(SCHEME_WHITESPACE_REGEX, ''));

  let decoded = base;
  for (let i = 0; i < MAX_DECODE_ITERATIONS; i++) {
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
  if (!allowedPrefixes || allowedPrefixes.length === 0) return false;

  const metaSection = lowerCaseValue.slice('data:'.length);
  const [mime] = metaSection.split(';', 1);
  if (!mime) return false;

  // MED-6: Strict MIME match — startsWith('image/png') matches 'image/png123'.
  // Use exact match or ensure the prefix is followed by a delimiter (+/-/; or EOS).
  return allowedPrefixes.some(
    (prefix) => mime === prefix || mime.startsWith(`${prefix}+`) || mime.startsWith(`${prefix}-`)
  );
}

function handleProtocolRelative(url: string, policy: UrlSafetyPolicy): boolean {
  if (!policy.allowProtocolRelative) return false;

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
