/**
 * Cookie-related type definitions shared across the service and external adapters.
 */

/**
 * Represents a cookie partition key for advanced cookie storage scenarios.
 * Used in browsers supporting First-Party Sets or similar privacy features.
 */
interface CookiePartitionKey {
  readonly topLevelSite?: string;
}

/**
 * Represents a single cookie record with complete metadata.
 * Includes standard cookie properties and browser-specific extensions.
 */
export interface CookieRecord {
  readonly name: string;
  readonly value: string;
  readonly domain?: string;
  readonly path?: string;
  readonly secure?: boolean;
  readonly httpOnly?: boolean;
  readonly sameSite?: string;
  readonly session?: boolean;
  readonly expirationDate?: number;
  readonly firstPartyDomain?: string;
  readonly partitionKey?: CookiePartitionKey;
}

/**
 * Query options for listing cookies.
 * Filter cookies by URL, domain, name, path, or partition.
 */
export interface CookieListOptions {
  readonly url?: string;
  readonly domain?: string;
  readonly name?: string;
  readonly path?: string;
  readonly partitionKey?: CookiePartitionKey;
}

/**
 * Options for setting a new cookie.
 * Extends CookieListOptions with required value and optional cookie attributes.
 */
export interface CookieSetOptions extends CookieListOptions {
  readonly value: string;
  readonly secure?: boolean;
  readonly httpOnly?: boolean;
  readonly expirationDate?: number;
  readonly firstPartyDomain?: string;
}

/**
 * Options for deleting a cookie.
 * Requires cookie name and optional URL/domain for specificity.
 */
export interface CookieDeleteOptions {
  readonly name: string;
  readonly url?: string;
  readonly firstPartyDomain?: string;
  readonly partitionKey?: CookiePartitionKey;
}

/**
 * Callback signature for cookie list operations.
 * @param cookies - Array of cookie records matching the query
 * @param error - Error message if operation failed, null on success
 */
type CookieListCallback = (cookies: readonly CookieRecord[], error: string | null) => void;

/**
 * Callback signature for cookie set/delete operations.
 * @param error - Error message if operation failed, undefined on success
 */
type CookieOperationCallback = (error?: string) => void;

/**
 * Cookie API contract for browser extension cookie access.
 * Provides methods to query, set, and delete cookies with callback-based results.
 */
export interface CookieAPI {
  /**
   * List cookies matching the given options.
   * @param details - Filter options for the cookie query
   * @param callback - Callback invoked with results or error
   */
  readonly list: (details?: CookieListOptions, callback?: CookieListCallback) => void;

  /**
   * Set a new cookie or update an existing one.
   * @param details - Cookie properties to set
   * @param callback - Callback invoked on completion
   */
  readonly set?: (details: CookieSetOptions, callback?: CookieOperationCallback) => void;

  /**
   * Delete a cookie by name and optional domain.
   * @param details - Cookie identifier and optional scope
   * @param callback - Callback invoked on completion
   */
  readonly delete?: (details: CookieDeleteOptions, callback?: CookieOperationCallback) => void;
}
