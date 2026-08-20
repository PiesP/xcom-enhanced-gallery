// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

export class HttpResponseSizeLimitError extends Error {
  override readonly name = 'HttpResponseSizeLimitError';

  constructor(
    readonly maxBytes: number,
    readonly receivedBytes?: number
  ) {
    super(
      receivedBytes === undefined
        ? `Response exceeds the ${maxBytes}-byte limit`
        : `Response requires ${receivedBytes} bytes (limit ${maxBytes})`
    );
  }
}

export function isHttpResponseSizeLimitError(error: unknown): boolean {
  return (
    error instanceof HttpResponseSizeLimitError ||
    (error instanceof Error && error.name === 'HttpResponseSizeLimitError')
  );
}
