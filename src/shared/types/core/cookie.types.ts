/**
 * @fileoverview Cookie-related type definitions
 */

/** Cookie partition key for advanced cookie storage scenarios */
interface CookiePartitionKey {
  readonly topLevelSite?: string;
}

/** Single cookie record with complete metadata */
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

/** Query options for listing cookies */
export interface CookieListOptions {
  readonly url?: string;
  readonly domain?: string;
  readonly name?: string;
  readonly path?: string;
  readonly partitionKey?: CookiePartitionKey;
}

/** Options for setting a new cookie */
export interface CookieSetOptions extends CookieListOptions {
  readonly value: string;
  readonly secure?: boolean;
  readonly httpOnly?: boolean;
  readonly expirationDate?: number;
  readonly firstPartyDomain?: string;
}

/** Options for deleting a cookie */
export interface CookieDeleteOptions {
  readonly name: string;
  readonly url?: string;
  readonly firstPartyDomain?: string;
  readonly partitionKey?: CookiePartitionKey;
}

/** Callback signature for cookie list operations */
type CookieListCallback = (cookies: readonly CookieRecord[], error: string | null) => void;

/** Callback signature for cookie set/delete operations */
type CookieOperationCallback = (error?: string) => void;

/** Cookie API contract for browser extension cookie access */
export interface CookieAPI {
  /** List cookies matching the given options */
  readonly list: (details?: CookieListOptions, callback?: CookieListCallback) => void;
  /** Set a new cookie or update an existing one */
  readonly set?: (details: CookieSetOptions, callback?: CookieOperationCallback) => void;
  /** Delete a cookie by name and optional domain */
  readonly delete?: (details: CookieDeleteOptions, callback?: CookieOperationCallback) => void;
}
