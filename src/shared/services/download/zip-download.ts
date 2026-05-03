import { getUserCancelledAbortErrorFromSignal } from '@shared/error/cancellation';
import { getErrorMessage } from '@shared/error/normalize';
import { StreamingZipWriter } from '@shared/external/zip/streaming-zip-writer';
import { DEFAULT_BACKOFF_BASE_MS, fetchArrayBufferWithRetry } from '@shared/network/retry-fetch';
import type { OrchestratorItem, OrchestratorOptions } from './types';

// Inlined from types.ts (moved from download-orchestrator to avoid circular dep)
export interface ZipResult {
  filesSuccessful: number;
  failures: Array<{ url: string; error: string }>;
  zipData: Uint8Array;
}

export interface BulkDownloadResult {
  success: boolean;
  status: 'success' | 'partial' | 'error';
  filesProcessed: number;
  filesSuccessful: number;
  filename?: string;
  error?: string;
  failures?: Array<{ url: string; error: string }>;
  code: string;
}

// Inlined from download-utils.ts
type UniqueFilenameFactory = (desired: string) => string;

const ensureUniqueFilenameFactory = (): UniqueFilenameFactory => {
  const usedNames = new Set<string>();
  const baseCounts = new Map<string, number>();
  return (desired: string): string => {
    if (!usedNames.has(desired)) {
      usedNames.add(desired);
      baseCounts.set(desired, 0);
      return desired;
    }
    const lastDot = desired.lastIndexOf('.');
    const name = lastDot > 0 ? desired.slice(0, lastDot) : desired;
    const ext = lastDot > 0 ? desired.slice(lastDot) : '';
    const baseKey = desired;
    let count = baseCounts.get(baseKey) ?? 0;
    let candidate = '';
    do {
      count += 1;
      candidate = `${name}-${count}${ext}`;
    } while (usedNames.has(candidate));
    baseCounts.set(baseKey, count);
    usedNames.add(candidate);
    return candidate;
  };
};

const MAX_CONCURRENCY = 8;
const MIN_CONCURRENCY = 1;
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_RETRIES = 3;

type ProgressCallback = OrchestratorOptions['onProgress'];
type ProgressPayload = Parameters<NonNullable<ProgressCallback>>[0];

const clampConcurrency = (value: number | undefined): number => {
  const resolved = value ?? DEFAULT_CONCURRENCY;
  return Math.min(MAX_CONCURRENCY, Math.max(MIN_CONCURRENCY, resolved));
};

const clampRetries = (value: number | undefined): number => Math.max(0, value ?? DEFAULT_RETRIES);

const calculatePercentage = (current: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((current / total) * 100)));
};

const reportProgress = (
  onProgress: ProgressCallback | undefined,
  payload: Omit<ProgressPayload, 'percentage'> & { percentage?: number }
): void => {
  if (!onProgress) return;

  const percentage = payload.percentage ?? calculatePercentage(payload.current, payload.total);
  onProgress({
    ...payload,
    percentage,
  });
};

const throwIfAborted = (signal?: AbortSignal): void => {
  if (signal?.aborted) {
    throw getUserCancelledAbortErrorFromSignal(signal);
  }
};

export async function downloadAsZip(
  items: readonly OrchestratorItem[],
  options: OrchestratorOptions = {}
): Promise<ZipResult> {
  const writer = new StreamingZipWriter();

  const concurrency = clampConcurrency(options.concurrency);
  const retries = clampRetries(options.retries);
  const abortSignal = options.signal;
  const onProgress = options.onProgress;

  throwIfAborted(abortSignal);

  const total = items.length;
  let processed = 0;
  let successful = 0;
  const failures: { url: string; error: string }[] = [];

  const ensureUniqueFilename = ensureUniqueFilenameFactory();
  const assignedFilenames = items.map((item) => ensureUniqueFilename(item.desiredName));

  // Queue management
  let currentIndex = 0;

  const runNext = async (): Promise<void> => {
    while (currentIndex < total) {
      throwIfAborted(abortSignal);

      const index = currentIndex++;
      const item = items[index];
      if (!item) continue;

      const filename = assignedFilenames[index] ?? item.desiredName;

      try {
        let data: Uint8Array;
        if (item.blob) {
          const blob = item.blob instanceof Promise ? await item.blob : item.blob;
          throwIfAborted(abortSignal);
          data = new Uint8Array(await blob.arrayBuffer());
        } else {
          data = await fetchArrayBufferWithRetry(
            item.url,
            retries,
            abortSignal,
            DEFAULT_BACKOFF_BASE_MS
          );
        }

        throwIfAborted(abortSignal);

        writer.addFile(filename, data);

        successful++;
      } catch (error) {
        throwIfAborted(abortSignal);
        failures.push({ url: item.url, error: getErrorMessage(error) });
      } finally {
        processed++;
        reportProgress(onProgress, {
          phase: 'downloading',
          current: processed,
          total,
          filename,
        });
      }
    }
  };

  const workerCount = Math.min(concurrency, total);
  const workers = Array.from({ length: workerCount }, () => runNext());
  await Promise.all(workers);

  reportProgress(onProgress, {
    phase: 'complete',
    current: processed,
    total,
  });

  const zipBytes = writer.finalize();

  return {
    filesSuccessful: successful,
    failures,
    zipData: zipBytes,
  };
}
