/**
 * Cookie-related type definitions shared across the service and external adapters.
 */

export interface CookiePartitionKey {
  topLevelSite?: string;
}

export interface CookieRecord {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
  session?: boolean;
  expirationDate?: number;
  firstPartyDomain?: string;
  partitionKey?: CookiePartitionKey;
}

export interface CookieListOptions {
  url?: string;
  domain?: string;
  name?: string;
  path?: string;
  partitionKey?: CookiePartitionKey;
}

export interface CookieSetOptions extends CookieListOptions {
  value: string;
  secure?: boolean;
  httpOnly?: boolean;
  expirationDate?: number;
  firstPartyDomain?: string;
}

export interface CookieDeleteOptions {
  name: string;
  url?: string;
  firstPartyDomain?: string;
  partitionKey?: CookiePartitionKey;
}

export type CookieListCallback = (cookies: CookieRecord[], error: string | null) => void;

export type CookieOperationCallback = (error?: string) => void;

export interface CookieAPI {
  list(details?: CookieListOptions, callback?: CookieListCallback): void;
  set?(details: CookieSetOptions, callback?: CookieOperationCallback): void;
  delete?(details: CookieDeleteOptions, callback?: CookieOperationCallback): void;
}
