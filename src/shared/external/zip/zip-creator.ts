/**
 * ZIP file creation utilities for X.com Enhanced Gallery
 * @version 1.2.0
 */

import { logger } from '@shared/logging';
import { createStoreZipBlob } from './store-zip-writer';
import { safeParseInt } from '@shared/utils/type-safety-helpers';

export interface MediaItemForZip {
  url: string;
  originalUrl?: string;
  filename?: string;
}

export type ZipProgressCallback = (progress: number) => void;

export interface ZipCreationConfig {
  compressionLevel: number;
  maxFileSize: number;
  requestTimeout: number;
  maxConcurrent: number;
}

export interface ZipCreatorOptions extends ZipCreationConfig {
  abortSignal?: AbortSignal;
  zipTimeoutMs?: number;
  zipRetries?: number;
}

const BYTES_PER_KB = 1024;
const BYTES_PER_MB = BYTES_PER_KB * BYTES_PER_KB;
const MAX_FILE_SIZE_MB = 100;
const REQUEST_TIMEOUT_MS = 30000;
const DEFAULT_CONCURRENT_DOWNLOADS = 4;
const NO_COMPRESSION_LEVEL = 0;
const ZIP_TIMEOUT_MS = 30000;

const DEFAULT_ZIP_CONFIG: ZipCreationConfig = {
  compressionLevel: NO_COMPRESSION_LEVEL,
  maxFileSize: MAX_FILE_SIZE_MB * BYTES_PER_MB,
  requestTimeout: REQUEST_TIMEOUT_MS,
  maxConcurrent: DEFAULT_CONCURRENT_DOWNLOADS,
};

const DEFAULT_ZIP_CREATOR_OPTIONS: Required<
  Pick<ZipCreatorOptions, 'zipTimeoutMs' | 'zipRetries'>
> = {
  zipTimeoutMs: ZIP_TIMEOUT_MS,
  zipRetries: 0,
};

type ResolvedZipCreatorConfig = ZipCreationConfig & {
  abortSignal?: AbortSignal;
  zipTimeoutMs: number;
  zipRetries: number;
};

function resolveZipOptions(
  config: Partial<ZipCreatorOptions> & { signal?: AbortSignal } = {}
): ResolvedZipCreatorConfig {
  const resolvedAbort = config.abortSignal ?? config.signal;
  // Merge while preserving strict typing (no any casts)
  const merged = {
    ...DEFAULT_ZIP_CONFIG,
    ...DEFAULT_ZIP_CREATOR_OPTIONS,
    ...config,
  } as Partial<ZipCreatorOptions> &
    ZipCreationConfig &
    Required<Pick<ZipCreatorOptions, 'zipTimeoutMs' | 'zipRetries'>>;

  const out: ResolvedZipCreatorConfig = {
    compressionLevel: merged.compressionLevel,
    maxFileSize: merged.maxFileSize,
    requestTimeout: merged.requestTimeout,
    maxConcurrent: merged.maxConcurrent,
    zipTimeoutMs: merged.zipTimeoutMs,
    zipRetries: merged.zipRetries,
    ...(resolvedAbort ? { abortSignal: resolvedAbort } : {}),
  };
  return out;
}

export async function createZipFromItems(
  items: MediaItemForZip[],
  zipFileName: string,
  onProgress?: ZipProgressCallback,
  config: Partial<ZipCreatorOptions> & { signal?: AbortSignal } = {}
): Promise<Blob> {
  const fullConfig = resolveZipOptions(config);
  // If externally aborted before any work, surface a cancellation error
  if (fullConfig.abortSignal?.aborted) {
    throw new Error('cancelled: AbortError');
  }
  const fileMap = await downloadFilesForZip(items, onProgress, fullConfig);
  if (fileMap.size === 0) {
    // If abortSignal was triggered during downloads, surface as cancellation
    if (fullConfig.abortSignal?.aborted) {
      throw new Error('cancelled: AbortError');
    }
    throw new Error('no_files_downloaded');
  }
  return createZipBlob(fileMap, zipFileName, fullConfig);
}

export async function createZipBlobFromFileMap(
  fileData: Map<string, Uint8Array>,
  config: Partial<ZipCreatorOptions> & { signal?: AbortSignal } = {}
): Promise<Blob> {
  const fullConfig = resolveZipOptions(config);
  if (fileData.size === 0) throw new Error('no_files_downloaded');
  return createZipBlob(fileData, 'bundle.zip', fullConfig);
}

async function downloadFilesForZip(
  items: MediaItemForZip[],
  onProgress: ZipProgressCallback | undefined,
  config: ZipCreationConfig & { abortSignal?: AbortSignal }
): Promise<Map<string, Uint8Array>> {
  const fileData = new Map<string, Uint8Array>();
  const total = items.length;
  let completed = 0;

  const chunks = chunkArray(items, config.maxConcurrent);
  for (const chunk of chunks) {
    const promises = chunk.map(async (item: MediaItemForZip) => {
      try {
        const data = await downloadMediaForZip(item, config);
        const filename = generateUniqueFilename(item.filename ?? 'media', fileData);
        fileData.set(filename, data);
        completed++;
        onProgress?.(completed / Math.max(1, total));
      } catch (error) {
        logger.warn(
          `[ZipCreator] Failed to download ${item.filename ?? item.url}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    });
    await Promise.all(promises);
  }

  return fileData;
}

async function downloadMediaForZip(
  item: MediaItemForZip,
  config: ZipCreationConfig & { abortSignal?: AbortSignal }
): Promise<Uint8Array> {
  const url = item.originalUrl ?? item.url;

  const controller = new AbortController();
  const onExternalAbort = () => controller.abort(new DOMException('Aborted', 'AbortError'));
  const timeoutId = setTimeout(
    () => {
      try {
        controller.abort(new DOMException('Request timed out', 'AbortError'));
      } catch {
        // noop
      }
    },
    Math.max(0, config.requestTimeout)
  );
  if (config.abortSignal) {
    if (config.abortSignal.aborted) onExternalAbort();
    else config.abortSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; XEG/1.0)' },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
    if (config.abortSignal) config.abortSignal.removeEventListener('abort', onExternalAbort);
  }

  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

  const contentLength = response.headers.get('content-length');
  const lenStr = contentLength?.trim();
  if (lenStr) {
    const fileSizeBytes = safeParseInt(lenStr, 10);
    if (!Number.isNaN(fileSizeBytes) && fileSizeBytes > config.maxFileSize) {
      throw new Error(`File too large: ${fileSizeBytes} bytes`);
    }
  }

  const ab = await response.arrayBuffer();
  return new Uint8Array(ab);
}

async function createZipBlob(
  fileData: Map<string, Uint8Array>,
  _zipFileName: string,
  config: ZipCreationConfig & {
    abortSignal?: AbortSignal;
    zipTimeoutMs: number;
    zipRetries: number;
  }
): Promise<Blob> {
  const attempts = Math.max(1, (config.zipRetries ?? 0) + 1);
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      if (config.abortSignal?.aborted) throw new DOMException('Aborted', 'AbortError');
      return await createStoreZipBlob(fileData);
    } catch (e) {
      lastErr = e;
      if (config.abortSignal?.aborted) throw e;
      if (i < attempts) {
        const message = e instanceof Error ? e.message : String(e);
        logger.warn(`[ZipCreator] ZIP attempt ${i} failed, retrying...`, { message });
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function generateUniqueFilename(original: string, existing: Map<string, Uint8Array>): string {
  if (!existing.has(original)) return original;
  const lastDot = original.lastIndexOf('.');
  const name = lastDot > 0 ? original.slice(0, lastDot) : original;
  const ext = lastDot > 0 ? original.slice(lastDot) : '';
  let n = 1;
  while (true) {
    const candidate = `${name}_${n}${ext}`;
    if (!existing.has(candidate)) return candidate;
    n++;
  }
}
