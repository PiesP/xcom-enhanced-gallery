/**
 * @fileoverview Centralized URL safety utilities
 * @description Provides canonical sanitization + policy enforcement for user-controlled URLs.
 *              Handles control characters, protocol validation, data URL MIME type checking,
 *              and recursive decoding attacks.
 */

// ============================================================================
// REGEX PATTERNS - URL SANITIZATION AND VALIDATION
// ============================================================================

/** Matches control characters (U+0000-U+001F, U+007F) for sanitization */
const CONTROL_CHARS_REGEX = /[\u0000-\u001F\u007F]/g;

/** Matches control characters and whitespace for scheme normalization */
const SCHEME_WHITESPACE_REGEX = /[\u0000-\u001F\u007F\s]+/g;

/** Matches explicit URL schemes (e.g., 'http:', 'javascript:') */
const EXPLICIT_SCHEME_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

// ============================================================================
// CONSTANTS - SECURITY LIMITS AND THRESHOLDS
// ============================================================================

/** Maximum URL decode iterations to prevent recursive decoding attacks */
const MAX_DECODE_ITERATIONS = 3;

/** Maximum length of URL scheme probe for efficient blocked hint detection */
const MAX_SCHEME_PROBE_LENGTH = 64;

// ============================================================================
// BLOCKED PROTOCOL HINTS - MALICIOUS SCHEMES TO DENY
// ============================================================================

/** Default blocked protocol hints to prevent malicious URL schemes */
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

// ============================================================================
// MEDIA PROTOCOL AND MIME TYPE CONFIGURATION
// ============================================================================

/** Safe protocols allowed for media resources (HTTP/HTTPS/Blob) */
const MEDIA_SAFE_PROTOCOLS = Object.freeze(
  new Set(['http:', 'https:', 'blob:'])
) as ReadonlySet<string>;

/** Allowed MIME type prefixes for data: URLs (image formats only) */
const DATA_IMAGE_MIME_PREFIXES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'image/avif',
] as const;

// ============================================================================
// URL SAFETY POLICY INTERFACE
// ============================================================================

/**
 * Configuration for URL validation and safety checks.
 * Allows customization of allowed protocols, relative URL support, and data URL handling.
 *
 * @property allowedProtocols - Set of allowed URL schemes (e.g., 'https:', 'http:')
 * @property allowRelative - Whether relative URLs (e.g., './image.jpg') are allowed
 * @property allowProtocolRelative - Whether protocol-relative URLs (e.g., '//example.com') are allowed
 * @property allowFragments - Whether fragment identifiers (e.g., '#section') are allowed
 * @property allowDataUrls - Whether data: URLs are allowed
 * @property allowedDataMimePrefixes - MIME type prefixes permitted for data URLs
 * @property blockedProtocolHints - Custom blocked protocol hints (overrides default)
 */
interface UrlSafetyPolicy {
  readonly allowedProtocols: ReadonlySet<string>;
  readonly allowRelative?: boolean;
  readonly allowProtocolRelative?: boolean;
  readonly allowFragments?: boolean;
  readonly allowDataUrls?: boolean;
  readonly allowedDataMimePrefixes?: readonly string[];
  readonly blockedProtocolHints?: readonly string[];
}

// ============================================================================
// PRESET POLICIES - COMMON USE CASES
// ============================================================================

/**
 * Preset safety policy for media URLs (images, videos).
 * Allows HTTP/HTTPS/Blob protocols, relative and protocol-relative URLs,
 * and image data URLs. Blocks fragments and malicious schemes.
 */
export const MEDIA_URL_POLICY = {
  allowedProtocols: MEDIA_SAFE_PROTOCOLS,
  allowRelative: true,
  allowProtocolRelative: true,
  allowFragments: false,
  allowDataUrls: true,
  allowedDataMimePrefixes: DATA_IMAGE_MIME_PREFIXES,
} as const;

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validates whether a URL is safe according to the provided security policy.
 *
 * Performs the following checks in order:
 * 1. Null/undefined/non-string type checking
 * 2. Control character removal and trimming
 * 3. Blocked protocol hint detection (with obfuscation resistance)
 * 4. Data URL validation (MIME type checking)
 * 5. Protocol-relative URL handling
 * 6. Fragment identifier validation
 * 7. Explicit protocol validation against allowed list
 * 8. Relative URL support
 * 9. URL.parse() validation for absolute URLs
 *
 * @param rawUrl - The raw URL string to validate (can be null/undefined)
 * @param policy - Security policy defining allowed URL types and schemes
 * @returns True if the URL passes all security checks, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = isUrlAllowed('https://example.com/image.jpg', MEDIA_URL_POLICY);
 * const isInvalid = isUrlAllowed('javascript:alert("XSS")', MEDIA_URL_POLICY); // false
 * ```
 */
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
    // URL parsing failed (invalid structure)
    return false;
  }
}

// ============================================================================
// INTERNAL HELPER FUNCTIONS
// ============================================================================

/**
 * Checks if a URL string starts with any blocked protocol hint,
 * accounting for obfuscation techniques (encoding, whitespace).
 *
 * Detects and prevents:
 * - Direct blocked schemes (e.g., 'javascript:')
 * - Whitespace-padded schemes (e.g., 'java [tab][tab] script:')
 * - Percent-encoded schemes (e.g., 'java%73cript:')
 * - Invalid percent sequences (e.g., 'java%ZZscript:')
 * - Mixed obfuscation (e.g., 'jav%61script:')
 *
 * @param value - The normalized URL string (lowercase)
 * @param hints - Array of blocked protocol hints to match
 * @returns True if the URL starts with a blocked hint, false otherwise
 *
 * @internal
 */
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

/**
 * Builds URL variants to detect obfuscated blocking schemes.
 *
 * Generates alternatives with whitespace removed and iteratively decoded
 * percent-encoded characters to catch variations like 'jav%61script:'.
 *
 * @param value - The probe string to build variants for
 * @returns Array of URL variants to check against blocked hints
 *
 * @internal
 */
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
      // Stop if percent-decoding fails (invalid sequence)
      break;
    }
  }

  return Array.from(variants.values());
}

/**
 * Validates data: URLs by checking their MIME type against allowed prefixes.
 *
 * Data URLs must match one of the allowed MIME type prefixes.
 * Example: data:image/png;base64,... matches 'image/png'
 *
 * @param lowerCaseValue - The lowercase data: URL string (should start with 'data:')
 * @param allowedPrefixes - Array of allowed MIME type prefixes (e.g., 'image/png', 'image/jpeg')
 * @returns True if the data URL's MIME type is in the allowed list, false otherwise
 *
 * @internal
 */
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

/**
 * Handles protocol-relative URLs (e.g., '//example.com/image.jpg').
 * Resolves them with a fallback protocol and validates the result.
 *
 * @param url - The protocol-relative URL string
 * @param policy - Security policy with allowed protocols
 * @returns True if the resolved URL uses an allowed protocol, false otherwise
 *
 * @internal
 */
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
    // URL parsing failed
    return false;
  }
}
