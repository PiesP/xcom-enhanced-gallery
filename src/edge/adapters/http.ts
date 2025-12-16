/**
 * @fileoverview HTTP adapter for the Edge layer
 * @description Provides a minimal fetch-based implementation for command-runtime network commands.
 */

import type { HttpMethod, HttpResponseType } from '@core/cmd';

export interface HttpRequestInput {
  readonly url: string;
  readonly method: HttpMethod;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
  readonly responseType: HttpResponseType;
}

export interface HttpRequestOutput {
  readonly status: number;
  readonly body: unknown;
}

export async function httpRequest(input: HttpRequestInput): Promise<HttpRequestOutput> {
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
