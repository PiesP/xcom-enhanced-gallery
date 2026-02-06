/**
 * Core Layer - UserScript Types (moved from Infrastructure)
 *
 * Provides type definitions specialized for UserScript API and browser environment.
 * These are interfaces with external systems (UserScript environment), so positioned in Core Layer.
 *
 * @module shared/types/core/userscript
 */

import type { CookieAPI } from './cookie.types';

/**
 * GM storage value type - JSON-serializable values supported by UserScript storage.
 *
 * Represents any value that can be serialized to JSON and stored in the UserScript
 * persistent storage. The actual serialization is handled internally by GM_setValue.
 *
 * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_setValue}
 */
export type GMStorageValue = unknown;

declare global {
  /**
   * Download a file from the given URL.
   *
   * @param url - The URL to download from
   * @param filename - The filename to save as
   * @throws May throw network or file system errors
   */
  function GM_download(url: string, filename: string): void;

  /**
   * Get a value from userscript persistent storage.
   *
   * Retrieved values are automatically deserialized from JSON format.
   * Returns the stored value or the provided default if the key doesn't exist.
   *
   * @template T - Expected return type of the stored value
   * @param name - Storage key name
   * @param defaultValue - Default value if key doesn't exist
   * @returns The stored value, deserialized, or the default value
   * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_getValue}
   */
  function GM_getValue<T = unknown>(name: string, defaultValue?: T): T;

  /**
   * Set a value in userscript persistent storage.
   *
   * The provided value is automatically serialized to JSON format before storage.
   * Supported types: string, number, boolean, object, array, null, and undefined.
   *
   * @param name - Storage key name
   * @param value - Value to store (must be JSON-serializable)
   * @throws May throw if value cannot be serialized to JSON
   * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_setValue}
   */
  function GM_setValue(name: string, value: GMStorageValue): void;

  /**
   * Delete a value from userscript persistent storage.
   *
   * @param name - Storage key name to delete
   * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_deleteValue}
   */
  function GM_deleteValue(name: string): void;

  /**
   * List all keys currently stored in userscript persistent storage.
   *
   * @returns Array of storage key names
   * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_listValues}
   */
  function GM_listValues(): string[];

  /**
   * Inject CSS into the current page.
   *
   * Creates a new style element and injects it into the document.
   *
   * @param css - CSS rule text to inject
   * @returns The created HTMLStyleElement
   * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_addStyle}
   */
  function GM_addStyle(css: string): HTMLStyleElement;

  /**
   * Make an asynchronous HTTP request.
   *
   * Provides fine-grained control over HTTP requests with support for multiple
   * response types, authentication, timeouts, and progress events.
   *
   * @param details - Request configuration object
   * @returns A control object with abort() method
   * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_xmlhttpRequest}
   */
  function GM_xmlhttpRequest(details: GMXMLHttpRequestDetails): GMXMLHttpRequestControl;

  /**
   * Display a notification to the user.
   *
   * Method signature 1: Detailed configuration object
   * @overload
   * @param details - Notification configuration
   * @param ondone - Optional callback when notification is dismissed
   * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_notification}
   */
  function GM_notification(details: GMNotificationDetails, ondone?: () => void): void;

  /**
   * Display a notification to the user.
   *
   * Method signature 2: Simple string parameters
   * @overload
   * @param text - Notification text
   * @param title - Optional notification title
   * @param image - Optional notification icon URL
   * @param onclick - Optional callback when notification is clicked
   * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_notification}
   */
  function GM_notification(
    text: string,
    title?: string,
    image?: string,
    onclick?: () => void
  ): void;

  /**
   * Cookie manipulation API.
   *
   * Provides access to document cookies with full control over cookie attributes.
   *
   * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_cookie}
   */
  const GM_cookie: CookieAPI;

  /**
   * Metadata and information about the running userscript.
   *
   * Contains script manifest data, environment information, and runtime state.
   */
  const GM_info: UserScriptInfo;

  /**
   * Window interface extension for accessing GM functions from window object.
   *
   * Used when direct global access to GM functions is not available or when
   * accessing from contexts where global scope is restricted.
   */
  interface Window {
    /**
     * Window-accessible GM_getValue function
     */
    GM_getValue?: typeof GM_getValue;

    /**
     * Window-accessible GM_setValue function
     */
    GM_setValue?: typeof GM_setValue;

    /**
     * Window-accessible GM_deleteValue function
     */
    GM_deleteValue?: typeof GM_deleteValue;

    /**
     * Window-accessible GM_download function
     */
    GM_download?: typeof GM_download;

    /**
     * Window-accessible GM_notification function
     */
    GM_notification?: typeof GM_notification;
  }
}

/**
 * UserScript script information interface.
 *
 * Contains metadata about the currently running script, including manifest information,
 * version details, and runtime environment configuration.
 *
 * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_info}
 */
export interface UserScriptInfo {
  /**
   * Script manifest data extracted from the \@-header comments.
   */
  readonly script: {
    /**
     * Script author name(s)
     */
    readonly author: string;

    /**
     * Copyright information for the script
     */
    readonly copyright: string;

    /**
     * Human-readable script description
     */
    readonly description: string;

    /**
     * Array of URL patterns where the script should NOT run
     */
    readonly excludes: readonly string[];

    /**
     * Script homepage URL
     */
    readonly homepage: string;

    /**
     * Icon image URL
     */
    readonly icon: string;

    /**
     * Large icon image URL (64x64)
     */
    readonly icon64: string;

    /**
     * Array of URL patterns where the script should run (\@include)
     */
    readonly includes: readonly string[];

    /**
     * Unix timestamp of last modification
     */
    readonly lastModified: number;

    /**
     * Array of URL patterns where the script matches (\@match)
     */
    readonly matches: readonly string[];

    /**
     * Script name
     */
    readonly name: string;

    /**
     * Unique namespace for the script
     */
    readonly namespace: string;

    /**
     * Script load order position
     */
    readonly position: number;

    /**
     * Array of resources declared in the script (\@resource)
     */
    readonly resources: readonly Array<{
      /**
       * Resource identifier name
       */
      readonly name: string;

      /**
       * Resource URL
       */
      readonly url: string;

      /**
       * Error message if resource failed to load
       */
      readonly error?: string;

      /**
       * Cached resource content (if successfully loaded)
       */
      readonly content?: string;
    }>;

    /**
     * Execution timing (\@run-at)
     */
    readonly 'run-at': string;

    /**
     * URL for support/issues related to the script
     */
    readonly supportURL: string;

    /**
     * Whether this is a system script
     */
    readonly system?: boolean;

    /**
     * Whether to unwrap the script
     */
    readonly unwrap: boolean;

    /**
     * Script version number
     */
    readonly version: string;
  };

  /**
   * Raw metadata string from \@-header comments
   */
  readonly scriptMetaStr: string;

  /**
   * Full source code of the running script
   */
  readonly scriptSource: string;

  /**
   * URL for automatic script updates
   */
  readonly scriptUpdateURL: string;

  /**
   * Whether an update is available for the script
   */
  readonly scriptWillUpdate: boolean;

  /**
   * UserScript manager that is running the script (e.g., "Tampermonkey")
   */
  readonly scriptHandler: string;

  /**
   * Whether the script is running in private/incognito mode
   */
  readonly isIncognito: boolean;

  /**
   * Download mode configuration
   */
  readonly downloadMode: string;

  /**
   * UserScript manager version
   */
  readonly version: string;
}

/**
 * Browser environment detection utilities.
 *
 * Runtime information about the browser and UserScript manager environment.
 * Used for feature detection and conditional behavior based on platform.
 */
export interface BrowserEnvironment {
  /**
   * Identifies which UserScript manager is currently running the script.
   * Useful for manager-specific workarounds or feature detection.
   */
  readonly userscriptManager: 'tampermonkey' | 'greasemonkey' | 'violentmonkey' | 'unknown';

  /**
   * Identifies the browser engine.
   * Useful for browser-specific CSS/API detection.
   */
  readonly browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown';

  /**
   * Whether the script is running in development mode.
   * Typically controlled via environment variables or build configuration.
   */
  readonly isDevelopment: boolean;
}

/**
 * Configuration object for notification display.
 *
 * Used when creating notifications with detailed control over appearance and behavior.
 *
 * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_notification}
 */
export interface GMNotificationDetails {
  /**
   * Notification title text
   */
  title?: string | undefined;

  /**
   * Notification body text
   */
  text?: string | undefined;

  /**
   * Icon image URL
   */
  image?: string | undefined;

  /**
   * How long the notification stays visible (milliseconds).
   * If omitted, uses default timeout.
   */
  timeout?: number | undefined;

  /**
   * Callback function when the notification is clicked
   */
  onclick?: (() => void) | undefined;
}

/**
 * Configuration object for an HTTP request made via GM_xmlhttpRequest.
 *
 * Provides comprehensive control over request parameters, headers, authentication,
 * timeouts, and response handling through callback functions.
 *
 * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_xmlhttpRequest}
 */
export interface GMXMLHttpRequestDetails {
  /**
   * HTTP method
   * @default 'GET'
   */
  method?: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

  /**
   * Request URL
   */
  readonly url: string;

  /**
   * Request headers as key-value pairs
   */
  headers?: Record<string, string>;

  /**
   * Request body data.
   * Automatically converted to appropriate format based on type.
   */
  data?: string | FormData | Blob | ArrayBuffer | URLSearchParams | ReadableStream;

  /**
   * Cookie string to send with the request
   */
  cookie?: string;

  /**
   * Whether to treat response as binary
   * @default false
   */
  binary?: boolean;

  /**
   * Prevent caching of the response
   * @default false
   */
  nocache?: boolean;

  /**
   * Force revalidation of cached responses
   * @default false
   */
  revalidate?: boolean;

  /**
   * Request timeout in milliseconds.
   * If exceeded, triggers ontimeout callback.
   */
  timeout?: number;

  /**
   * Custom context object passed through to all response callbacks.
   * Allows associating request metadata with responses.
   */
  context?: unknown;

  /**
   * Expected response MIME type.
   * Influences how response is parsed.
   */
  responseType?: 'text' | 'json' | 'blob' | 'arraybuffer' | 'stream';

  /**
   * Override the MIME type of the response
   */
  overrideMimeType?: string;

  /**
   * Whether to send request in anonymous mode (no credentials)
   * @default false
   */
  anonymous?: boolean;

  /**
   * Use Fetch API instead of XMLHttpRequest
   * @default false
   */
  fetch?: boolean;

  /**
   * Username for HTTP authentication
   */
  user?: string;

  /**
   * Password for HTTP authentication
   */
  password?: string;

  /**
   * Callback when the request is aborted
   */
  onabort?: (response: GMXMLHttpRequestResponse) => void;

  /**
   * Callback when the request encounters an error
   */
  onerror?: (response: GMXMLHttpRequestResponse) => void;

  /**
   * Callback when the request completes successfully
   */
  onload?: (response: GMXMLHttpRequestResponse) => void;

  /**
   * Callback when the request completes (success or failure)
   */
  onloadend?: (response: GMXMLHttpRequestResponse) => void;

  /**
   * Callback when the request begins
   */
  onloadstart?: (response: GMXMLHttpRequestResponse) => void;

  /**
   * Callback for download progress updates
   */
  onprogress?: (response: GMXMLHttpRequestProgressResponse) => void;

  /**
   * Callback when the ready state changes
   */
  onreadystatechange?: (response: GMXMLHttpRequestResponse) => void;

  /**
   * Callback when the request times out
   */
  ontimeout?: (response: GMXMLHttpRequestResponse) => void;
}

/**
 * HTTP response from GM_xmlhttpRequest.
 *
 * Contains response data and metadata. The response body type depends on
 * the `responseType` setting in the request configuration.
 *
 * @template TResponse - Response body type (depends on responseType in request)
 * @template TContext - Type of context object passed from the request
 * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_xmlhttpRequest}
 */
export interface GMXMLHttpRequestResponse<TResponse = unknown, TContext = unknown> {
  /**
   * Final URL of the response (after redirects)
   */
  readonly finalUrl: string;

  /**
   * XMLHttpRequest ready state
   */
  readonly readyState: number;

  /**
   * HTTP status code
   */
  readonly status: number;

  /**
   * HTTP status text (e.g., "OK", "Not Found")
   */
  readonly statusText: string;

  /**
   * Response headers as a string
   */
  readonly responseHeaders: string;

  /**
   * Response body.
   * Type depends on the `responseType` setting:
   * - 'text' or undefined: string
   * - 'json': parsed JSON object
   * - 'blob': Blob object
   * - 'arraybuffer': ArrayBuffer
   * - 'stream': ReadableStream
   */
  readonly response: TResponse;

  /**
   * Response as XML/DOM document (if applicable).
   * Only available if response is valid XML.
   */
  readonly responseXML?: Document | null;

  /**
   * Response body as text string
   */
  readonly responseText: string;

  /**
   * Custom context object passed from the request configuration.
   * Used to associate metadata or state with the response.
   */
  readonly context: TContext;
}

/**
 * HTTP response with progress information from GM_xmlhttpRequest.
 *
 * Extends the base response with download progress data.
 * Sent to onprogress callback during request/response streaming.
 *
 * @see {@link https://www.tampermonkey.net/documentation.php#api:GM_xmlhttpRequest}
 */
export interface GMXMLHttpRequestProgressResponse extends GMXMLHttpRequestResponse {
  /**
   * Whether the total size is known
   */
  readonly lengthComputable: boolean;

  /**
   * Bytes downloaded/uploaded so far
   */
  readonly loaded: number;

  /**
   * Total bytes to download/upload
   */
  readonly total: number;
}

/**
 * Abort controller for a running GM_xmlhttpRequest.
 *
 * Returned by GM_xmlhttpRequest to allow cancellation of in-flight requests.
 */
export interface GMXMLHttpRequestControl {
  /**
   * Abort the ongoing request.
   * Triggers the onabort callback.
   */
  abort(): void;
}

/**
 * UserScript @grant directive values.
 *
 * Specifies which privileged operations the script is allowed to perform.
 * Each grant must be explicitly declared in the script header.
 *
 * @see {@link https://www.tampermonkey.net/documentation.php#meta:grant}
 */
export type UserScriptGrant =
  | 'GM_setValue'
  | 'GM_getValue'
  | 'GM_download'
  | 'GM_notification'
  | 'GM_addStyle'
  | 'GM_cookie'
  | 'GM_xmlhttpRequest';

/**
 * UserScript @connect directive values.
 *
 * Specifies which external hosts the script is allowed to make XHR/fetch requests to.
 * The host must be declared in the script header for requests to succeed.
 *
 * @see {@link https://www.tampermonkey.net/documentation.php#meta:connect}
 */
export type UserScriptConnect = 'pbs.twimg.com' | 'video.twimg.com' | '*.x.com' | 'x.com';

/**
 * UserScript execution timing.
 *
 * Determines when the script runs relative to document loading.
 *
 * @see {@link https://www.tampermonkey.net/documentation.php#meta:run-at}
 */
export type UserScriptRunAt = 'document-start' | 'document-body' | 'document-end' | 'document-idle';

/**
 * Complete UserScript metadata configuration.
 *
 * Represents the script's manifest information typically declared in the
 * \@-header comments of a UserScript. All properties are marked readonly
 * as they represent static script configuration.
 *
 * @see {@link https://www.tampermonkey.net/documentation.php#meta:header}
 */
export interface UserScriptMetadata {
  /**
   * Script name (\@name)
   */
  readonly name: string;

  /**
   * Script namespace (\@namespace) - should be unique
   */
  readonly namespace: string;

  /**
   * Script version (\@version) - typically semantic versioning
   */
  readonly version: string;

  /**
   * Human-readable script description (\@description)
   */
  readonly description: string;

  /**
   * Script author name(s) (\@author)
   */
  readonly author: string;

  /**
   * URL patterns where script should run (\@match)
   */
  readonly match: readonly string[];

  /**
   * Privileged operations the script can perform (\@grant)
   */
  readonly grant: readonly UserScriptGrant[];

  /**
   * External hosts allowed for XHR/fetch (\@connect)
   */
  readonly connect: readonly UserScriptConnect[];

  /**
   * Execution timing (\@run-at)
   */
  readonly 'run-at': UserScriptRunAt;

  /**
   * Support/issues URL (\@supportURL)
   */
  readonly supportURL: string;

  /**
   * URL to download the latest script version (\@downloadURL)
   */
  readonly downloadURL: string;

  /**
   * URL to check for updates (\@updateURL)
   */
  readonly updateURL: string;

  /**
   * Whether the script should not run in frames (\@noframes)
   * @default false
   */
  readonly noframes?: boolean;
}
