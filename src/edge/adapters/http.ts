/**
 * HTTP adapter for Edge layer. Provides dual-strategy HTTP client:
 * userscript (`GM_xmlhttpRequest`) with fetch fallback.
 *
 * @module edge/adapters/http
 */

import type { HttpMethod, HttpResponseType } from '@core/cmd';
import { HttpRequestService } from '@shared/services/http-request-service';

/**
 * HTTP request input parameters
 */
interface HttpRequestInput {
  /** Absolute URL to request */
  readonly url: string;

  /** HTTP method (GET/POST/PUT/PATCH/DELETE) */
  readonly method: HttpMethod;

  /** Optional HTTP headers */
  readonly headers?: Readonly<Record<string, string>>;

  /** Optional request body (pre-serialized string) */
  readonly body?: string;

  /** Response parsing strategy ('json' or 'text') */
  readonly responseType: HttpResponseType;
}

/**
 * Normalized HTTP response output
 */
interface HttpRequestOutput {
  /** HTTP status code */
  readonly status: number;

  /** Response body (parsed JSON or raw text) */
  readonly body: unknown;
}

/**
 * Check if error indicates GM_xmlhttpRequest is unavailable
 *
 * Detects runtime errors thrown when userscript APIs (GM_*) are not available,
 * typically in test environments or non-userscript contexts. This function enables
 * safe fallback to fetch without risking double-dispatch of requests.
 *
 * @param error - Error thrown by userscript request attempt
 * @returns `true` if error indicates GM_* unavailability, `false` otherwise
 *
 * @remarks
 * **Detection Strategy**:
 * - Checks for `Error` instance (non-Error values return `false`)
 * - Matches error message against known GM_* unavailability patterns
 * - Patterns: `"GM_* unavailable"` or `"GM_xmlhttpRequest is not defined"`
 * - Case-insensitive regex for robustness across runtime implementations
 *
 * **Why Broad Patterns**:
 * - Different userscript managers (Tampermonkey, Violentmonkey) may phrase errors differently
 * - Test frameworks may throw synthetic errors with similar messages
 * - Broad patterns catch all "GM is missing" scenarios while staying specific enough
 *   to avoid treating genuine network failures as "GM unavailable"
 *
 * **False Positive Risk**:
 * - Low risk: Network errors typically have messages like "Failed to fetch" or "Network error"
 * - These do NOT match the `GM_*` pattern, so no false fallback occurs
 *
 * @example
 * ```typescript
 * // GM_xmlhttpRequest unavailable (test environment)
 * const error1 = new Error('GM_xmlhttpRequest unavailable');
 * isLikelyUserscriptUnavailableError(error1); // → true
 *
 * // Alternative phrasing
 * const error2 = new Error('GM_xmlhttpRequest is not defined');
 * isLikelyUserscriptUnavailableError(error2); // → true
 *
 * // Generic GM_* API unavailable
 * const error3 = new Error('GM_getValue unavailable');
 * isLikelyUserscriptUnavailableError(error3); // → true (safe to generalize)
 *
 * // Network error (not GM-related)
 * const error4 = new Error('Failed to fetch');
 * isLikelyUserscriptUnavailableError(error4); // → false
 *
 * // Non-Error value
 * isLikelyUserscriptUnavailableError('string error'); // → false
 * isLikelyUserscriptUnavailableError(null); // → false
 * ```
 *
 * @see {@link shouldFallbackToFetch} for complete fallback decision logic
 */
function isLikelyUserscriptUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message;

  // Userscript adapter errors are surfaced as plain Error with stable messages.
  // Keep this check broad enough for tests/alternate runtimes, but explicit
  // enough to avoid treating genuine request failures as "GM is missing".
  return (
    /\bGM_[A-Za-z0-9_]+\s+unavailable\b/i.test(message) ||
    /\bGM_xmlhttpRequest\s+is\s+not\s+defined\b/i.test(message)
  );
}

/** Check if error indicates userscript adapter cannot represent request shape */
function isUserscriptUnsupportedRequestShapeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  // Thrown by this adapter when HttpRequestService cannot represent a request.
  // In these cases the userscript request was not dispatched, so falling back
  // to fetch is safe.
  return /\bUserscript\b.*\bnot supported\b/i.test(error.message);
}

/**
 * Determine if error justifies fallback from userscript to fetch transport
 */
function shouldFallbackToFetch(error: unknown): boolean {
  return (
    isLikelyUserscriptUnavailableError(error) || isUserscriptUnsupportedRequestShapeError(error)
  );
}

/** Execute HTTP request using userscript transport (GM_xmlhttpRequest) */
async function httpRequestViaUserscript(input: HttpRequestInput): Promise<HttpRequestOutput> {
  const http = HttpRequestService.getInstance();

  const options = {
    ...(input.headers !== undefined ? { headers: { ...input.headers } } : {}),
    responseType: input.responseType,
  } as const;

  const method: HttpMethod = input.method;
  const url = input.url;

  switch (method) {
    case 'GET': {
      const res = await http.get(url, options);
      return { status: res.status, body: res.data };
    }
    case 'POST': {
      const res = await http.post(url, input.body, options);
      return { status: res.status, body: res.data };
    }
    case 'PUT': {
      const res = await http.put(url, input.body, options);
      return { status: res.status, body: res.data };
    }
    case 'PATCH': {
      const res = await http.patch(url, input.body, options);
      return { status: res.status, body: res.data };
    }
    case 'DELETE': {
      // HttpRequestService.delete() does not accept a request body. If a body is present,
      // fall back to fetch behavior below.
      if (input.body !== undefined) {
        throw new Error('Userscript DELETE with body is not supported');
      }
      const res = await http.delete(url, options);
      return { status: res.status, body: res.data };
    }
    default: {
      // Exhaustive guard: HttpMethod is already constrained.
      const _never: never = method;
      throw new Error(`Unsupported method: ${_never}`);
    }
  }
}

/** Execute HTTP request using standard fetch API */
async function httpRequestViaFetch(input: HttpRequestInput): Promise<HttpRequestOutput> {
  if (typeof fetch !== 'function') {
    throw new Error('fetch is not available');
  }

  const init: RequestInit = {
    method: input.method,
    ...(input.headers !== undefined ? { headers: input.headers } : {}),
    ...(input.body !== undefined ? { body: input.body } : {}),
  };

  const res = await fetch(input.url, init);

  if (input.responseType === 'json') {
    const body = (await res.json()) as unknown;
    return { status: res.status, body };
  }

  const body = await res.text();
  return { status: res.status, body };
}

/**
 * Execute HTTP request with automatic transport selection and fallback.
 * Prefers userscript transport (GM_xmlhttpRequest) for CORS bypass, falls back to fetch.
 */
export async function httpRequest(input: HttpRequestInput): Promise<HttpRequestOutput> {
  // Prefer Userscript HTTP (GM_xmlhttpRequest) to avoid CORS limitations when available.
  // Fall back to fetch for environments like unit tests or when GM_* APIs are unavailable.
  //
  // Note: This adapter is intentionally minimal. Higher-level retry/backoff policies live elsewhere.
  try {
    return await httpRequestViaUserscript(input);
  } catch (error) {
    // If GM_xmlhttpRequest is unavailable (common in tests), fall back to fetch.
    // Also fall back when HttpRequestService doesn't support a specific request shape.
    //
    // Important: Do NOT fall back for arbitrary errors, otherwise non-idempotent
    // requests (POST/PUT/PATCH/DELETE) could be dispatched twice.
    if (shouldFallbackToFetch(error)) {
      return await httpRequestViaFetch(input);
    }
    throw error;
  }
}
