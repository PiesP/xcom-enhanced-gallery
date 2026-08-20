// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { HttpResponseSizeLimitError } from '@shared/error/http-response-size-limit-error';

export type BufferedResponseType = 'text' | 'json' | 'blob' | 'arraybuffer' | 'stream';

function parseContentLength(response: Response): number | undefined {
  const value = response.headers.get('content-length');
  if (!value || !/^\d+$/.test(value.trim())) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function validateMaxBytes(maxBytes: number): number {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
    throw new RangeError('maxResponseBytes must be a non-negative safe integer');
  }
  return maxBytes;
}

function createBoundedStream(
  source: ReadableStream<Uint8Array>,
  maxBytes: number,
  abortTransport?: (reason: unknown) => void
): ReadableStream<Uint8Array> {
  const reader = source.getReader();
  let receivedBytes = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        const nextBytes = receivedBytes + value.byteLength;
        if (nextBytes > maxBytes) {
          const error = new HttpResponseSizeLimitError(maxBytes, nextBytes);
          abortTransport?.(error);
          await reader.cancel(error).catch(() => undefined);
          controller.error(error);
          return;
        }
        receivedBytes = nextBytes;
        controller.enqueue(value);
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel(reason) {
      await reader.cancel(reason);
    },
  });
}

async function readBoundedBytes(
  source: ReadableStream<Uint8Array>,
  maxBytes: number,
  abortTransport?: (reason: unknown) => void
): Promise<Uint8Array<ArrayBuffer>> {
  const reader = source.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const nextBytes = receivedBytes + value.byteLength;
      if (nextBytes > maxBytes) {
        const error = new HttpResponseSizeLimitError(maxBytes, nextBytes);
        abortTransport?.(error);
        await reader.cancel(error).catch(() => undefined);
        throw error;
      }
      receivedBytes = nextBytes;
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function decodeBytes(
  bytes: Uint8Array<ArrayBuffer>,
  responseType: BufferedResponseType,
  mimeType: string
): unknown {
  if (responseType === 'arraybuffer') return bytes.buffer;
  if (responseType === 'blob') return new Blob([bytes], { type: mimeType });

  const text = new TextDecoder().decode(bytes);
  return responseType === 'json' ? JSON.parse(text) : text;
}

export async function readResponseBody(
  response: Response,
  responseType: BufferedResponseType,
  maxResponseBytes?: number,
  abortTransport?: (reason: unknown) => void
): Promise<unknown> {
  if (maxResponseBytes === undefined) {
    switch (responseType) {
      case 'json':
        return response.json();
      case 'blob':
        return response.blob();
      case 'arraybuffer':
        return response.arrayBuffer();
      case 'stream':
        return response.body;
      default:
        return response.text();
    }
  }

  const maxBytes = validateMaxBytes(maxResponseBytes);
  const contentLength = parseContentLength(response);
  if (contentLength !== undefined && contentLength > maxBytes) {
    const error = new HttpResponseSizeLimitError(maxBytes, contentLength);
    abortTransport?.(error);
    await response.body?.cancel(error).catch(() => undefined);
    throw error;
  }

  if (!response.body) {
    if (responseType === 'stream') return null;
    return decodeBytes(new Uint8Array(), responseType, response.headers.get('content-type') ?? '');
  }
  if (responseType === 'stream') {
    return createBoundedStream(response.body, maxBytes, abortTransport);
  }

  const bytes = await readBoundedBytes(response.body, maxBytes, abortTransport);
  return decodeBytes(bytes, responseType, response.headers.get('content-type') ?? '');
}
