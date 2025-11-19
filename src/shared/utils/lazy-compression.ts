import { logger } from '@shared/logging';

type ZipModule = typeof import('@shared/external/zip');

export type CompressionChunk = Readonly<{
  createZipBytesFromFileMap: ZipModule['createZipBytesFromFileMap'];
}>;

export type LazyCompressionState = 'idle' | 'loading' | 'ready' | 'error';

export type LazyCompressionStatus = Readonly<{
  state: LazyCompressionState;
  hasChunk: boolean;
  lastError?: unknown;
}>;

let state: LazyCompressionState = 'idle';
let chunkPromise: Promise<CompressionChunk> | null = null;
let cachedChunk: CompressionChunk | null = null;
let lastError: unknown;

const debugLog = import.meta.env.DEV
  ? (message: string, ...args: unknown[]) => logger.debug(message, ...args)
  : () => {};

const importCompressionChunk = async (): Promise<CompressionChunk> => {
  const zipModule: ZipModule = await import('@shared/external/zip');

  return Object.freeze({
    createZipBytesFromFileMap: zipModule.createZipBytesFromFileMap,
  });
};

export function loadCompressionChunk(): Promise<CompressionChunk> {
  if (cachedChunk) {
    return Promise.resolve(cachedChunk);
  }

  if (!chunkPromise) {
    state = 'loading';
    lastError = undefined;

    chunkPromise = importCompressionChunk()
      .then(chunk => {
        cachedChunk = chunk;
        state = 'ready';
        debugLog('[lazy-compression] Compression chunk ready');
        return chunk;
      })
      .catch(error => {
        lastError = error;
        state = 'error';
        chunkPromise = null;
        logger.error('[lazy-compression] Failed to load compression chunk', error);
        throw error;
      });
  }

  return chunkPromise;
}

export async function preloadCompressionChunk(): Promise<void> {
  try {
    await loadCompressionChunk();
  } catch (error) {
    debugLog('[lazy-compression] Preload failed (continuing without chunk)', error);
  }
}

export async function withCompressionChunk<T>(
  task: (chunk: CompressionChunk) => Promise<T> | T
): Promise<T> {
  const chunk = await loadCompressionChunk();
  return task(chunk);
}

export function getCompressionChunkSync(): CompressionChunk | null {
  return cachedChunk;
}

export function getLazyCompressionStatus(): LazyCompressionStatus {
  return {
    state,
    hasChunk: Boolean(cachedChunk),
    lastError,
  };
}

export function resetLazyCompressionForTesting(): void {
  chunkPromise = null;
  cachedChunk = null;
  state = 'idle';
  lastError = undefined;
}
