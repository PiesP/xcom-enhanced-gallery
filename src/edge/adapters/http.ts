/**
 * @fileoverview HTTP adapter for the Edge layer
 * @description Provides a minimal fetch-based implementation for command-runtime network commands.
 */

import type { HttpMethod, HttpResponseType } from '@core/cmd';
import { HttpRequestService } from '@shared/services/http-request-service';

interface HttpRequestInput {
  readonly url: string;
  readonly method: HttpMethod;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
  readonly responseType: HttpResponseType;
}

interface HttpRequestOutput {
  readonly status: number;
  readonly body: unknown;
}

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

function isUserscriptUnsupportedRequestShapeError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  // Thrown by this adapter when HttpRequestService cannot represent a request.
  // In these cases the userscript request was not dispatched, so falling back
  // to fetch is safe.
  return /\bUserscript\b.*\bnot supported\b/i.test(error.message);
}

function shouldFallbackToFetch(error: unknown): boolean {
  return (
    isLikelyUserscriptUnavailableError(error) || isUserscriptUnsupportedRequestShapeError(error)
  );
}

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
