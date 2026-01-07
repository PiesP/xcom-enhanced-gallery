/**
 * @fileoverview HTTP adapter for Edge layer runtime integration
 *
 * ## Purpose
 * Provides a dual-strategy HTTP client for the command-runtime effect system:
 * - **Primary**: Userscript HTTP (`GM_xmlhttpRequest`) for CORS-free requests
 * - **Fallback**: Standard `fetch` API for test environments and unsupported request shapes
 *
 * ## Key Responsibilities
 * - **Adapter Pattern**: Bridge between command-runtime and HTTP transports (GM_* or fetch)
 * - **Automatic Fallback**: Detect unavailable GM_* APIs and gracefully degrade to fetch
 * - **Request Dispatch**: Route HTTP methods (GET/POST/PUT/PATCH/DELETE) to appropriate handlers
 * - **Response Normalization**: Unify GM_xmlhttpRequest and fetch responses into common shape
 * - **Error Classification**: Distinguish recoverable errors (unavailable GM_*) from fatal failures
 *
 * ## Architecture Context
 * **Layer**: Edge Adapter (integrates with external runtime APIs)
 * **Command System**: Executes HttpRequested commands from `src/core/cmd.ts`
 * **Service Dependency**: Uses `HttpRequestService` (singleton wrapping GM_xmlhttpRequest)
 * **Transport Strategy**:
 *   1. Try userscript transport (avoids CORS, works in production)
 *   2. If GM_* unavailable → fall back to fetch (test/development)
 *   3. If request shape unsupported by GM_* → fall back to fetch
 *   4. All other errors propagate (no double-dispatch risk)
 *
 * ## Design Principles
 * 1. **Safety First**: Never double-dispatch non-idempotent requests (POST/PUT/PATCH/DELETE)
 * 2. **Minimal Surface**: No retry/backoff/caching logic (belongs in higher layers)
 * 3. **Explicit Fallback**: Only fall back for known-safe error categories
 * 4. **Type Safety**: Exhaustive switch for HttpMethod, type-safe response normalization
 * 5. **Test-Friendly**: Automatic fetch fallback enables unit testing without GM_* mocks
 *
 * ## Usage Pattern
 * ```typescript
 * import { httpRequest } from '@edge/adapters/http';
 *
 * // GET request (userscript or fetch)
 * const response = await httpRequest({
 *   url: 'https://api.example.com/data',
 *   method: 'GET',
 *   headers: { 'Accept': 'application/json' },
 *   responseType: 'json',
 * });
 * console.log(response.status, response.body);
 *
 * // POST request with body
 * const postResponse = await httpRequest({
 *   url: 'https://api.example.com/create',
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ name: 'example' }),
 *   responseType: 'json',
 * });
 *
 * // In production: Uses GM_xmlhttpRequest (bypasses CORS)
 * // In tests: Automatically falls back to fetch
 * ```
 *
 * ## Error Handling
 * - **Recoverable Errors**: `GM_xmlhttpRequest unavailable` → fallback to fetch
 * - **Unsupported Request**: `DELETE with body` → fallback to fetch
 * - **Fatal Errors**: Network failures, invalid responses → propagate to caller
 *
 * @module edge/adapters/http
 */

import type { HttpMethod, HttpResponseType } from '@core/cmd';
import { HttpRequestService } from '@shared/services/http-request-service';

/**
 * HTTP request input parameters
 *
 * Represents the minimal information needed to dispatch an HTTP request through
 * either GM_xmlhttpRequest or fetch APIs. This interface abstracts the differences
 * between userscript and standard web platform APIs.
 *
 * @remarks
 * **Design Decisions**:
 * - `url`: Absolute URL required (no relative path resolution)
 * - `method`: Constrained to 5 safe HTTP methods (no HEAD, OPTIONS, TRACE)
 * - `headers`: Optional map for request headers (case-insensitive keys in fetch)
 * - `body`: String only (caller must serialize objects to JSON/form data)
 * - `responseType`: Determines parsing strategy ('json' → parse as JSON, 'text' → raw string)
 *
 * **Immutability**: All fields readonly to prevent accidental mutation during async dispatch
 *
 * **Body Semantics**:
 * - GET requests: `body` should be undefined (ignored if present)
 * - DELETE requests: `body` may be undefined (userscript adapter rejects DELETE with body)
 * - POST/PUT/PATCH: `body` typically required (application-specific)
 *
 * @example
 * ```typescript
 * // JSON GET request
 * const getInput: HttpRequestInput = {
 *   url: 'https://api.example.com/users/123',
 *   method: 'GET',
 *   headers: { 'Accept': 'application/json' },
 *   responseType: 'json',
 * };
 *
 * // POST with JSON body
 * const postInput: HttpRequestInput = {
 *   url: 'https://api.example.com/users',
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Accept': 'application/json',
 *   },
 *   body: JSON.stringify({ name: 'John Doe', email: 'john@example.com' }),
 *   responseType: 'json',
 * };
 * ```
 *
 * @see {@link HttpMethod} for allowed HTTP method values
 * @see {@link HttpResponseType} for response parsing strategies
 */
interface HttpRequestInput {
  /** Absolute URL to request (must include protocol and host) */
  readonly url: string;

  /** HTTP method to use (GET/POST/PUT/PATCH/DELETE) */
  readonly method: HttpMethod;

  /** Optional HTTP headers (case-insensitive keys, string values) */
  readonly headers?: Readonly<Record<string, string>>;

  /** Optional request body (must be pre-serialized string) */
  readonly body?: string;

  /** Response parsing strategy ('json' or 'text') */
  readonly responseType: HttpResponseType;
}

/**
 * Normalized HTTP response output
 *
 * Represents the unified response format returned by both userscript and fetch
 * transports. This interface hides implementation differences and provides a
 * consistent shape for command-runtime consumers.
 *
 * @remarks
 * **Response Normalization**:
 * - Both GM_xmlhttpRequest and fetch APIs return responses with different shapes
 * - This adapter normalizes both into `{ status, body }` format
 * - `body` type depends on `responseType` input parameter
 *
 * **Body Typing**:
 * - `responseType: 'json'` → `body` is parsed JSON (type `unknown`, caller must validate)
 * - `responseType: 'text'` → `body` is raw string
 * - Parsing errors propagate as exceptions (not reflected in output type)
 *
 * **Status Codes**:
 * - HTTP status code range: 100-599 (standard RFC 7231 semantics)
 * - 2xx: Success (body typically present)
 * - 4xx/5xx: Error (body may contain error details)
 * - Non-2xx responses do NOT throw exceptions (caller must check `status`)
 *
 * @example
 * ```typescript
 * // Successful JSON response
 * const output: HttpRequestOutput = {
 *   status: 200,
 *   body: { id: 123, name: 'John Doe' }, // unknown type, needs validation
 * };
 *
 * // Error response with JSON body
 * const errorOutput: HttpRequestOutput = {
 *   status: 404,
 *   body: { error: 'User not found', code: 'USER_NOT_FOUND' },
 * };
 *
 * // Text response
 * const textOutput: HttpRequestOutput = {
 *   status: 200,
 *   body: '<html>...</html>', // string when responseType='text'
 * };
 *
 * // Usage pattern
 * const response = await httpRequest(input);
 * if (response.status >= 200 && response.status < 300) {
 *   // Success: validate and use response.body
 *   const data = response.body as { id: number; name: string };
 * } else {
 *   // Error: handle non-2xx status
 *   console.error('Request failed:', response.status, response.body);
 * }
 * ```
 *
 * @see {@link HttpRequestInput} for corresponding input structure
 */
interface HttpRequestOutput {
  /** HTTP status code (100-599) */
  readonly status: number;

  /** Response body (parsed JSON or raw text depending on responseType) */
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

/**
 * Check if error indicates userscript adapter cannot represent request shape
 *
 * Detects errors thrown by this adapter when `HttpRequestService` cannot handle
 * a specific request configuration (e.g., DELETE with body). These errors are
 * thrown BEFORE dispatching the userscript request, making fetch fallback safe.
 *
 * @param error - Error thrown by userscript request attempt
 * @returns `true` if error indicates unsupported request shape, `false` otherwise
 *
 * @remarks
 * **When This Error Occurs**:
 * - DELETE requests with non-undefined `body` (GM_xmlhttpRequest DELETE doesn't accept body)
 * - Future cases where HttpRequestService API limitations prevent dispatching a request
 *
 * **Why Fallback is Safe**:
 * - Error is thrown BEFORE `GM_xmlhttpRequest` is invoked
 * - No network request has been dispatched yet
 * - Falling back to fetch will NOT cause double-dispatch
 * - Idempotency concerns do not apply (request never reached network)
 *
 * **Error Message Pattern**:
 * - Matches: `"Userscript ... not supported"` (case-insensitive)
 * - Example: `"Userscript DELETE with body is not supported"`
 * - Specific enough to avoid matching unrelated errors
 *
 * @example
 * ```typescript
 * // DELETE with body (not supported by GM_xmlhttpRequest)
 * const error1 = new Error('Userscript DELETE with body is not supported');
 * isUserscriptUnsupportedRequestShapeError(error1); // → true
 *
 * // Hypothetical future case
 * const error2 = new Error('Userscript multipart/form-data not supported');
 * isUserscriptUnsupportedRequestShapeError(error2); // → true
 *
 * // Network error (not shape-related)
 * const error3 = new Error('Network request failed');
 * isUserscriptUnsupportedRequestShapeError(error3); // → false
 *
 * // Non-Error value
 * isUserscriptUnsupportedRequestShapeError('error string'); // → false
 * ```
 *
 * @see {@link httpRequestViaUserscript} for where this error is thrown
 * @see {@link shouldFallbackToFetch} for complete fallback decision logic
 */
function isUserscriptUnsupportedRequestShapeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  // Thrown by this adapter when HttpRequestService cannot represent a request.
  // In these cases the userscript request was not dispatched, so falling back
  // to fetch is safe.
  return /\bUserscript\b.*\bnot supported\b/i.test(error.message);
}

/**
 * Determine if error justifies fallback from userscript to fetch transport
 *
 * Combines all safe fallback conditions into a single decision function. Only
 * errors that indicate "request was never dispatched" justify fallback, preventing
 * accidental double-dispatch of non-idempotent operations (POST/PUT/PATCH/DELETE).
 *
 * @param error - Error thrown by userscript request attempt
 * @returns `true` if fetch fallback is safe, `false` if error should propagate
 *
 * @remarks
 * **Safe Fallback Conditions** (both prevent double-dispatch):
 * 1. **GM_* API Unavailable**: `GM_xmlhttpRequest` not defined (test environment)
 *    - Request was never dispatched to network
 *    - Fallback will be the FIRST attempt, not a duplicate
 *
 * 2. **Unsupported Request Shape**: HttpRequestService cannot represent request
 *    - Request validation failed before `GM_xmlhttpRequest` invocation
 *    - No network side effects occurred yet
 *
 * **Unsafe Fallback Conditions** (will NOT fallback):
 * - Network failures (timeout, connection refused, DNS errors)
 * - HTTP error responses (4xx, 5xx status codes)
 * - Parsing errors (invalid JSON in response)
 * - Any error AFTER request dispatch started
 *
 * **Why This Matters**:
 * - Non-idempotent operations (POST creating resource, DELETE removing resource)
 *   must NOT be dispatched twice
 * - Safe fallback: "GM missing" → request never sent → fallback is first attempt
 * - Unsafe fallback: "Network timeout" → request may have reached server → retry
 *   could duplicate operation
 *
 * @example
 * ```typescript
 * // Safe fallback: GM unavailable (never dispatched)
 * const error1 = new Error('GM_xmlhttpRequest unavailable');
 * shouldFallbackToFetch(error1); // → true (safe to try fetch)
 *
 * // Safe fallback: Unsupported shape (never dispatched)
 * const error2 = new Error('Userscript DELETE with body is not supported');
 * shouldFallbackToFetch(error2); // → true (safe to try fetch)
 *
 * // Unsafe fallback: Network error (may have been dispatched)
 * const error3 = new Error('Network request failed');
 * shouldFallbackToFetch(error3); // → false (must propagate error)
 *
 * // Unsafe fallback: Timeout (may have reached server)
 * const error4 = new Error('Request timeout after 30s');
 * shouldFallbackToFetch(error4); // → false (must propagate error)
 * ```
 *
 * @see {@link isLikelyUserscriptUnavailableError} for GM_* detection
 * @see {@link isUserscriptUnsupportedRequestShapeError} for shape validation errors
 * @see {@link httpRequest} for usage in main adapter function
 */
function shouldFallbackToFetch(error: unknown): boolean {
  return (
    isLikelyUserscriptUnavailableError(error) || isUserscriptUnsupportedRequestShapeError(error)
  );
}

/**
 * Execute HTTP request using userscript transport (GM_xmlhttpRequest)
 *
 * Dispatches HTTP requests through `HttpRequestService` singleton, which wraps
 * the `GM_xmlhttpRequest` API provided by userscript managers. This transport
 * bypasses browser CORS restrictions, enabling cross-origin requests in production.
 *
 * @param input - Request parameters (url, method, headers, body, responseType)
 * @returns Promise resolving to normalized response (status, body)
 * @throws {Error} If GM_xmlhttpRequest unavailable or request shape unsupported
 * @throws {Error} If network request fails or response parsing fails
 *
 * @remarks
 * **Transport Details**:
 * - Uses `HttpRequestService.getInstance()` singleton (wraps GM_xmlhttpRequest)
 * - Supports GET, POST, PUT, PATCH, DELETE methods
 * - Normalizes GM_xmlhttpRequest response into `{ status, body }` format
 * - Automatically parses response based on `responseType` parameter
 *
 * **Method-Specific Behavior**:
 * - **GET**: No body allowed (ignored if present)
 * - **POST/PUT/PATCH**: Body passed to corresponding HttpRequestService method
 * - **DELETE**: Body must be undefined (throws if body present, as GM API doesn't support it)
 *
 * **Error Cases**:
 * 1. **GM Unavailable**: `HttpRequestService` throws if `GM_xmlhttpRequest` not defined
 * 2. **Unsupported Shape**: DELETE with body throws "not supported" error
 * 3. **Network Failure**: HTTP layer errors (timeout, connection refused) propagate
 * 4. **Parse Failure**: JSON parsing errors propagate from HttpRequestService
 *
 * **Exhaustiveness Check**:
 * - Switch statement covers all `HttpMethod` values
 * - Default case has `never` type guard ensuring compile-time exhaustiveness
 * - Adding new HTTP method requires updating this function (TypeScript error otherwise)
 *
 * @example
 * ```typescript
 * // GET request
 * const getResponse = await httpRequestViaUserscript({
 *   url: 'https://api.example.com/users/123',
 *   method: 'GET',
 *   headers: { 'Accept': 'application/json' },
 *   responseType: 'json',
 * });
 * // → { status: 200, body: { id: 123, name: 'John' } }
 *
 * // POST with body
 * const postResponse = await httpRequestViaUserscript({
 *   url: 'https://api.example.com/users',
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ name: 'Jane' }),
 *   responseType: 'json',
 * });
 * // → { status: 201, body: { id: 124, name: 'Jane' } }
 *
 * // DELETE without body (allowed)
 * const deleteResponse = await httpRequestViaUserscript({
 *   url: 'https://api.example.com/users/123',
 *   method: 'DELETE',
 *   responseType: 'text',
 * });
 * // → { status: 204, body: '' }
 *
 * // DELETE with body (throws error, falls back to fetch)
 * try {
 *   await httpRequestViaUserscript({
 *     url: 'https://api.example.com/users/123',
 *     method: 'DELETE',
 *     body: JSON.stringify({ reason: 'spam' }),
 *     responseType: 'json',
 *   });
 * } catch (error) {
 *   // → Error: "Userscript DELETE with body is not supported"
 *   // httpRequest() will catch this and fallback to fetch
 * }
 * ```
 *
 * @see {@link HttpRequestService} for GM_xmlhttpRequest wrapper implementation
 * @see {@link HttpRequestInput} for input parameter structure
 * @see {@link HttpRequestOutput} for response structure
 */
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

/**
 * Execute HTTP request using standard fetch API
 *
 * Dispatches HTTP requests through the browser's native `fetch` API. This transport
 * is subject to CORS restrictions but works in all modern browsers and test
 * environments. Used as fallback when GM_xmlhttpRequest is unavailable.
 *
 * @param input - Request parameters (url, method, headers, body, responseType)
 * @returns Promise resolving to normalized response (status, body)
 * @throws {Error} If fetch API not available (very old browsers)
 * @throws {Error} If network request fails (CORS, timeout, DNS errors)
 * @throws {Error} If response parsing fails (invalid JSON)
 *
 * @remarks
 * **Transport Details**:
 * - Uses global `fetch()` function (standard Web API)
 * - Subject to browser CORS policies (unlike GM_xmlhttpRequest)
 * - Normalizes fetch Response into `{ status, body }` format
 * - Parses response based on `responseType` parameter
 *
 * **Response Parsing**:
 * - `responseType: 'json'` → calls `response.json()`, returns parsed object
 * - `responseType: 'text'` → calls `response.text()`, returns raw string
 * - Parse failures throw errors (e.g., invalid JSON when expecting json)
 *
 * **CORS Implications**:
 * - fetch respects browser CORS policy
 * - Cross-origin requests require proper CORS headers from server
 * - GM_xmlhttpRequest bypasses CORS (why it's preferred in production)
 * - Test environments typically don't enforce CORS (why fetch works there)
 *
 * **Availability Check**:
 * - Checks `typeof fetch === 'function'` before use
 * - Throws explicit error if fetch unavailable (very rare in modern runtimes)
 * - All target browsers (Chrome 117+, Firefox 119+, Safari 17+) support fetch
 *
 * @example
 * ```typescript
 * // GET request with JSON response
 * const getResponse = await httpRequestViaFetch({
 *   url: 'https://api.example.com/users/123',
 *   method: 'GET',
 *   headers: { 'Accept': 'application/json' },
 *   responseType: 'json',
 * });
 * // → { status: 200, body: { id: 123, name: 'John' } }
 *
 * // POST with body
 * const postResponse = await httpRequestViaFetch({
 *   url: 'https://api.example.com/users',
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'Accept': 'application/json',
 *   },
 *   body: JSON.stringify({ name: 'Jane' }),
 *   responseType: 'json',
 * });
 * // → { status: 201, body: { id: 124, name: 'Jane' } }
 *
 * // DELETE with body (allowed by fetch, unlike GM_xmlhttpRequest)
 * const deleteResponse = await httpRequestViaFetch({
 *   url: 'https://api.example.com/users/123',
 *   method: 'DELETE',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ reason: 'spam' }),
 *   responseType: 'json',
 * });
 * // → { status: 200, body: { deleted: true } }
 *
 * // Text response
 * const htmlResponse = await httpRequestViaFetch({
 *   url: 'https://example.com/page.html',
 *   method: 'GET',
 *   responseType: 'text',
 * });
 * // → { status: 200, body: '<html>...</html>' }
 * ```
 *
 * @see {@link HttpRequestInput} for input parameter structure
 * @see {@link HttpRequestOutput} for response structure
 * @see {@link httpRequest} for primary adapter that uses this as fallback
 */
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
 * Execute HTTP request with automatic transport selection and fallback
 *
 * Primary HTTP adapter function that dispatches requests using a dual-transport
 * strategy: prefer userscript transport (GM_xmlhttpRequest) for CORS bypass,
 * fallback to fetch when GM APIs unavailable or request shape unsupported.
 *
 * @param input - Request parameters (url, method, headers, body, responseType)
 * @returns Promise resolving to normalized response (status, body)
 * @throws {Error} If both transports fail or error indicates unsafe fallback
 *
 * @remarks
 * **Transport Strategy**:
 * 1. **Try Userscript First**: Attempt `httpRequestViaUserscript()` (GM_xmlhttpRequest)
 *    - Bypasses CORS restrictions (production advantage)
 *    - Userscript manager provides additional capabilities
 *
 * 2. **Fallback to Fetch**: If userscript fails with safe error category
 *    - GM_xmlhttpRequest unavailable (test environment, non-userscript context)
 *    - Request shape unsupported by GM API (e.g., DELETE with body)
 *
 * 3. **Propagate Fatal Errors**: Network failures, parse errors, etc. throw immediately
 *    - No fallback for errors after request dispatch started
 *    - Prevents double-dispatch of non-idempotent operations
 *
 * **Safety Guarantees**:
 * - **No Double-Dispatch**: Fallback only occurs when request was never sent to network
 * - **Idempotency Preservation**: POST/PUT/PATCH/DELETE never dispatched twice
 * - **Error Transparency**: Fatal errors propagate unchanged to caller
 *
 * **When Fallback Occurs** (safe scenarios):
 * - Test environments without GM_* APIs → automatic fetch usage
 * - DELETE requests with body → userscript rejects, fetch handles
 * - Future unsupported request shapes → userscript validation fails, fetch tries
 *
 * **When Fallback Does NOT Occur** (unsafe scenarios):
 * - Network timeouts → may have reached server, must not retry
 * - Connection failures → may have partial transmission, must not retry
 * - HTTP error responses (4xx/5xx) → server received request, must not duplicate
 * - Response parsing failures → request completed, body issue not transport issue
 *
 * **Design Philosophy**:
 * - **Minimal Adapter**: No retry logic, backoff, or caching (higher layers handle this)
 * - **Transparent Errors**: Preserves error semantics from underlying transports
 * - **Test-Friendly**: Automatic fetch fallback enables testing without GM_* mocks
 * - **Production-Optimized**: GM_xmlhttpRequest preferred for CORS bypass capability
 *
 * @example
 * ```typescript
 * // Production environment (GM_xmlhttpRequest available)
 * const response1 = await httpRequest({
 *   url: 'https://api.example.com/data',
 *   method: 'GET',
 *   headers: { 'Accept': 'application/json' },
 *   responseType: 'json',
 * });
 * // → Uses GM_xmlhttpRequest (no CORS restrictions)
 *
 * // Test environment (GM_xmlhttpRequest unavailable)
 * const response2 = await httpRequest({
 *   url: 'https://api.example.com/data',
 *   method: 'GET',
 *   headers: { 'Accept': 'application/json' },
 *   responseType: 'json',
 * });
 * // → Catches "GM unavailable" error, falls back to fetch
 *
 * // DELETE with body (unsupported by GM_xmlhttpRequest)
 * const response3 = await httpRequest({
 *   url: 'https://api.example.com/users/123',
 *   method: 'DELETE',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ reason: 'spam' }),
 *   responseType: 'json',
 * });
 * // → Userscript throws "not supported", falls back to fetch
 *
 * // Network failure (no fallback, error propagates)
 * try {
 *   await httpRequest({
 *     url: 'https://nonexistent.example.com/data',
 *     method: 'GET',
 *     responseType: 'json',
 *   });
 * } catch (error) {
 *   // → Error propagates from GM_xmlhttpRequest/fetch
 *   // → No fallback attempted (unsafe to retry network errors)
 * }
 *
 * // Error response handling (caller's responsibility)
 * const response4 = await httpRequest({
 *   url: 'https://api.example.com/users/999999',
 *   method: 'GET',
 *   responseType: 'json',
 * });
 * if (response4.status === 404) {
 *   // Handle not found (not an exception, normal HTTP semantics)
 * }
 * ```
 *
 * @see {@link httpRequestViaUserscript} for GM_xmlhttpRequest transport
 * @see {@link httpRequestViaFetch} for fetch API transport
 * @see {@link shouldFallbackToFetch} for fallback decision logic
 * @see {@link HttpRequestInput} for input parameter structure
 * @see {@link HttpRequestOutput} for response structure
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
