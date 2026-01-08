/**
 * @fileoverview Runtime command type definitions for effect system.
 *
 * Defines discriminated union types for all runtime commands (side effects).
 * Commands represent I/O operations dispatched from pure business logic.
 *
 * @module core/cmd
 */

import type { DomFactsKind } from '@core/dom-facts';

/** Log severity levels */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** HTTP request methods */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** HTTP response content type (json or text) */
export type HttpResponseType = 'json' | 'text';

/** Navigation mode: assign (current window) or open (new window) */
export type NavigateMode = 'assign' | 'open';

/** MVU effect command union: DOM read, storage, HTTP, navigation, logging, scheduling */
export type RuntimeCommand =
  | {
      readonly type: 'TAKE_DOM_FACTS';
      readonly requestId: string;
      readonly kind: DomFactsKind;
    }
  | {
      readonly type: 'STORE_GET';
      readonly requestId: string;
      readonly key: string;
    }
  | {
      readonly type: 'STORE_SET';
      readonly requestId: string;
      readonly key: string;
      readonly value: unknown;
    }
  | {
      readonly type: 'HTTP_REQUEST';
      readonly requestId: string;
      readonly url: string;
      readonly method: HttpMethod;
      readonly headers?: Readonly<Record<string, string>>;
      readonly body?: string;
      readonly responseType: HttpResponseType;
    }
  | {
      readonly type: 'NAVIGATE';
      readonly requestId: string;
      readonly url: string;
      readonly mode: NavigateMode;
      readonly target?: '_self' | '_blank';
    }
  | {
      readonly type: 'LOG';
      readonly level: LogLevel;
      readonly message: string;
      readonly context?: Readonly<Record<string, unknown>>;
    }
  | {
      readonly type: 'SCHEDULE_TICK';
      readonly id: string;
      readonly intervalMs: number;
    }
  | { readonly type: 'CANCEL_TICK'; readonly id: string };

// ============================================================================
// Type Helpers
// ============================================================================

/** Union of all command type strings */
export type RuntimeCommandType = RuntimeCommand['type'];

/** Extracts specific command variant by type discriminator */
export type ExtractCommand<T extends RuntimeCommandType> = Extract<RuntimeCommand, { type: T }>;

/** Filters to command variants with requestId (async/correlated) */
export type AsyncRuntimeCommand = Extract<RuntimeCommand, { requestId: string }>;

/** Filters to command variants without requestId (fire-and-forget) */
export type SyncRuntimeCommand = Exclude<RuntimeCommand, { requestId: string }>;
