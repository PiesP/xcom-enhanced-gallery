/**
 * Store-only ZIP writer (legacy adapter)
 * @file src/shared/external/zip/store-zip-writer.ts
 * @deprecated Use createZipFromFiles from zip-creator-native.ts instead
 *
 * This file provides backward compatibility for the existing API.
 * It wraps the native ZIP implementation to maintain the same interface.
 */

import { createZipFromFiles } from './zip-creator-native';

/**
 * Create a Store-only ZIP blob from file data map
 *
 * @param fileData - Map of filename to Uint8Array data
 * @returns Promise resolving to ZIP Blob
 *
 * @deprecated This is a legacy adapter. Use createZipFromFiles directly.
 */
export async function createStoreZipBlob(fileData: Map<string, Uint8Array>): Promise<Blob> {
  // Convert Map to Record for native implementation
  const filesRecord: Record<string, Uint8Array> = {};
  for (const [filename, data] of fileData.entries()) {
    filesRecord[filename] = data;
  }

  // Call native implementation
  const zipBytes = createZipFromFiles(filesRecord);

  // Return as Blob for compatibility (slice() creates a new Uint8Array with proper type)
  return new Blob([zipBytes.slice()], { type: 'application/zip' });
}

/**
 * Create a Store-only ZIP Uint8Array from file data map
 *
 * @param fileData - Map of filename to Uint8Array data
 * @returns ZIP Uint8Array
 *
 * @deprecated This is a legacy adapter. Use createZipFromFiles directly.
 */
export function createStoreZipUint8Array(fileData: Map<string, Uint8Array>): Uint8Array {
  if (fileData.size === 0) {
    throw new Error('Cannot create ZIP archive without files');
  }

  // Convert Map to Record for native implementation
  const filesRecord: Record<string, Uint8Array> = {};
  for (const [filename, data] of fileData.entries()) {
    filesRecord[filename] = data;
  }

  // Call native implementation
  return createZipFromFiles(filesRecord);
}
