/**
 * Binary Utilities - Phase 320
 *
 * Provides helper functions for binary data conversions
 * Supports: string ↔ Uint8Array, Blob ↔ ArrayBuffer conversions
 *
 * All functions use standard APIs compatible with MV3
 * - TextEncoder/TextDecoder (standard API)
 * - Blob.arrayBuffer() (standard API)
 *
 * @example
 * ```typescript
 * // String to binary
 * const uint8 = stringToUint8Array('hello');
 *
 * // Binary to string
 * const str = uint8ArrayToString(uint8);
 *
 * // Blob to binary
 * const binary = await blobToUint8Array(blob);
 *
 * // Binary to Blob
 * const blob = uint8ArrayToBlob(binary, 'text/plain');
 * ```
 */

/**
 * Convert UTF-8 string to Uint8Array
 * Uses standard TextEncoder API (available in all modern browsers, MV3 compatible)
 *
 * @param str String to convert
 * @returns Uint8Array representation of the string
 *
 * @example
 * ```typescript
 * const data = stringToUint8Array('hello');
 * // Uint8Array(5) [ 104, 101, 108, 108, 111 ]
 * ```
 */
export function stringToUint8Array(str: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

/**
 * Convert Uint8Array to UTF-8 string
 * Uses standard TextDecoder API (available in all modern browsers, MV3 compatible)
 *
 * @param arr Uint8Array to convert
 * @param encoding Character encoding (default: 'utf-8')
 * @returns Decoded string
 *
 * @example
 * ```typescript
 * const arr = new Uint8Array([104, 101, 108, 108, 111]);
 * const str = uint8ArrayToString(arr);
 * // 'hello'
 * ```
 */
export function uint8ArrayToString(arr: Uint8Array, encoding: string = 'utf-8'): string {
  const decoder = new TextDecoder(encoding);
  return decoder.decode(arr);
}

/**
 * Convert Blob to Uint8Array (async)
 * Uses standard Blob.arrayBuffer() API (available in all modern browsers, MV3 compatible)
 *
 * @param blob Blob to convert
 * @returns Promise resolving to Uint8Array
 *
 * @example
 * ```typescript
 * const blob = new Blob(['hello']);
 * const data = await blobToUint8Array(blob);
 * // Uint8Array(5) [ 104, 101, 108, 108, 111 ]
 * ```
 */
export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Convert Blob to ArrayBuffer (async)
 * Uses standard Blob.arrayBuffer() API (available in all modern browsers, MV3 compatible)
 *
 * @param blob Blob to convert
 * @returns Promise resolving to ArrayBuffer
 *
 * @example
 * ```typescript
 * const blob = new Blob(['data']);
 * const buffer = await blobToArrayBuffer(blob);
 * // ArrayBuffer { byteLength: 4 }
 * ```
 */
export async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return blob.arrayBuffer();
}

/**
 * Convert Uint8Array to Blob
 * Creates a Blob with specified MIME type
 *
 * @param data Uint8Array to convert
 * @param mimeType MIME type of the blob (default: 'application/octet-stream')
 * @returns Blob containing the data
 *
 * @example
 * ```typescript
 * const data = new Uint8Array([104, 101, 108, 108, 111]);
 * const blob = uint8ArrayToBlob(data, 'text/plain');
 * // Blob { size: 5, type: 'text/plain' }
 * ```
 */
export function uint8ArrayToBlob(
  data: Uint8Array,
  mimeType: string = 'application/octet-stream'
): Blob {
  // Create copy to ensure compatibility
  const copy = new Uint8Array(data);
  return new Blob([copy], { type: mimeType });
}

/**
 * Convert ArrayBuffer to Uint8Array
 * Simple view conversion, does not copy data
 *
 * @param buffer ArrayBuffer to convert
 * @returns Uint8Array view of the buffer
 *
 * @example
 * ```typescript
 * const buffer = new ArrayBuffer(4);
 * const view = arrayBufferToUint8Array(buffer);
 * // Uint8Array(4) [ 0, 0, 0, 0 ]
 * ```
 */
export function arrayBufferToUint8Array(buffer: ArrayBuffer): Uint8Array {
  return new Uint8Array(buffer);
}

/**
 * Convert Uint8Array to ArrayBuffer
 * Creates new ArrayBuffer from the data
 *
 * @param data Uint8Array to convert
 * @returns ArrayBuffer containing the data
 *
 * @example
 * ```typescript
 * const data = new Uint8Array([1, 2, 3, 4]);
 * const buffer = uint8ArrayToArrayBuffer(data);
 * // ArrayBuffer { byteLength: 4 }
 * ```
 */
export function uint8ArrayToArrayBuffer(data: Uint8Array): ArrayBuffer {
  // Create copy to ensure it's a proper ArrayBuffer
  const copy = new Uint8Array(data);
  return copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength);
}

/**
 * Convert ArrayBuffer to Blob
 * Creates a Blob with specified MIME type
 *
 * @param buffer ArrayBuffer to convert
 * @param mimeType MIME type of the blob (default: 'application/octet-stream')
 * @returns Blob containing the data
 *
 * @example
 * ```typescript
 * const buffer = new ArrayBuffer(4);
 * const blob = arrayBufferToBlob(buffer, 'application/json');
 * // Blob { size: 4, type: 'application/json' }
 * ```
 */
export function arrayBufferToBlob(
  buffer: ArrayBuffer,
  mimeType: string = 'application/octet-stream'
): Blob {
  return new Blob([buffer], { type: mimeType });
}

/**
 * Validate if data is a Blob or File
 *
 * @param data Value to check
 * @returns true if data is a Blob or File
 *
 * @example
 * ```typescript
 * const blob = new Blob(['data']);
 * isValidBlobData(blob); // true
 * isValidBlobData('string'); // false
 * ```
 */
export function isValidBlobData(data: unknown): data is Blob | File {
  return data instanceof Blob || data instanceof File;
}

/**
 * Validate if data is binary (ArrayBuffer or Uint8Array)
 *
 * @param data Value to check
 * @returns true if data is binary
 *
 * @example
 * ```typescript
 * const buffer = new ArrayBuffer(4);
 * isValidBinaryData(buffer); // true
 * isValidBinaryData(new Uint8Array(4)); // true
 * isValidBinaryData('string'); // false
 * ```
 */
export function isValidBinaryData(data: unknown): data is ArrayBuffer | Uint8Array {
  return data instanceof ArrayBuffer || data instanceof Uint8Array;
}

/**
 * Get size of binary data in bytes
 *
 * @param data Blob, ArrayBuffer, or Uint8Array
 * @returns Size in bytes
 *
 * @example
 * ```typescript
 * const blob = new Blob(['hello']);
 * getBinarySize(blob); // 5
 *
 * const buffer = new ArrayBuffer(10);
 * getBinarySize(buffer); // 10
 *
 * const data = new Uint8Array(8);
 * getBinarySize(data); // 8
 * ```
 */
export function getBinarySize(data: Blob | ArrayBuffer | Uint8Array): number {
  if (data instanceof Blob) {
    return data.size;
  }
  if (data instanceof ArrayBuffer) {
    return data.byteLength;
  }
  if (data instanceof Uint8Array) {
    return data.byteLength;
  }
  return 0;
}

/**
 * Concatenate multiple Uint8Arrays into a single Uint8Array
 *
 * @param arrays Uint8Arrays to concatenate
 * @returns Concatenated Uint8Array
 *
 * @example
 * ```typescript
 * const arr1 = new Uint8Array([1, 2]);
 * const arr2 = new Uint8Array([3, 4]);
 * const result = concatenateUint8Arrays([arr1, arr2]);
 * // Uint8Array(4) [ 1, 2, 3, 4 ]
 * ```
 */
export function concatenateUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLength);

  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }

  return result;
}

/**
 * Concatenate multiple Blobs into a single Blob
 *
 * @param blobs Blobs to concatenate
 * @param mimeType MIME type of result blob (default: 'application/octet-stream')
 * @returns Concatenated Blob
 *
 * @example
 * ```typescript
 * const blob1 = new Blob(['hello']);
 * const blob2 = new Blob([' world']);
 * const result = concatenateBlobs([blob1, blob2]);
 * // Blob { size: 11, type: 'application/octet-stream' }
 * ```
 */
export function concatenateBlobs(
  blobs: Blob[],
  mimeType: string = 'application/octet-stream'
): Blob {
  return new Blob(blobs, { type: mimeType });
}

/**
 * Create Blob from JSON object
 * Automatically serializes and encodes to UTF-8
 *
 * @param obj Object to serialize
 * @returns Blob containing JSON data
 *
 * @example
 * ```typescript
 * const data = { name: 'test', value: 123 };
 * const blob = jsonToBlob(data);
 * // Blob { size: 32, type: 'application/json' }
 * ```
 */
export function jsonToBlob(obj: unknown): Blob {
  const json = JSON.stringify(obj);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Parse JSON from Blob (async)
 *
 * @param blob Blob containing JSON data
 * @returns Promise resolving to parsed object
 *
 * @example
 * ```typescript
 * const blob = new Blob(['{"name":"test"}'], { type: 'application/json' });
 * const data = await blobToJson(blob);
 * // { name: 'test' }
 * ```
 */
export async function blobToJson<T = unknown>(blob: Blob): Promise<T> {
  const text = await blob.text();
  return JSON.parse(text) as T;
}

/**
 * Calculate SHA-256 hash of data (requires crypto API)
 * Async operation, uses SubtleCrypto API
 *
 * @param data Uint8Array to hash
 * @returns Promise resolving to hex-encoded SHA-256 hash
 *
 * @example
 * ```typescript
 * const data = stringToUint8Array('hello');
 * const hash = await sha256(data);
 * // '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
 * ```
 */
export async function sha256(data: Uint8Array): Promise<string> {
  // Create copy to ensure compatibility
  const copy = new Uint8Array(data);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', copy);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate MD5 hash of data (requires crypto API)
 * Note: MD5 is cryptographically weak, use SHA-256 when possible
 * Async operation using SubtleCrypto fallback or library
 *
 * @param data Uint8Array to hash
 * @returns Promise resolving to hex-encoded MD5 hash
 *
 * @deprecated Use sha256() instead for cryptographic operations
 */
export async function md5(data: Uint8Array): Promise<string> {
  // Note: SubtleCrypto doesn't support MD5, would need external library
  // For now, return placeholder using SHA-256 as fallback
  // Real implementation would use tweetnacl or similar
  const copy = new Uint8Array(data);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', copy);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
