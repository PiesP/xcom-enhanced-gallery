import { getErrorMessage } from '@shared/error/utils';
import { DEFAULT_BACKOFF_BASE_MS, fetchArrayBufferWithRetry } from '@shared/network/retry-fetch';
import { ensureUniqueFilenameFactory } from '@shared/services/download/download-utils';
import type {
  OrchestratorItem,
  OrchestratorOptions,
  ZipResult,
} from '@shared/services/download/types';

export async function downloadAsZip(
  items: OrchestratorItem[],
  options: OrchestratorOptions = {}
): Promise<ZipResult> {
  const { StreamingZipWriter } = await import('@shared/external/zip');
  const writer = new StreamingZipWriter();

  const concurrency = Math.min(8, Math.max(1, options.concurrency ?? 6));
  const retries = Math.max(0, options.retries ?? 0);
  const abortSignal = options.signal;

  const total = items.length;
  let processed = 0;
  let successful = 0;
  const failures: { url: string; error: string }[] = [];
  const usedFilenames: string[] = [];

  const ensureUniqueFilename = ensureUniqueFilenameFactory();

  // Queue management
  let currentIndex = 0;

  const runNext = async () => {
    while (currentIndex < total) {
      if (abortSignal?.aborted) return;

      const index = currentIndex++;
      const item = items[index];

      options.onProgress?.({
        phase: 'downloading',
        current: processed + 1,
        total,
        percentage: Math.min(100, Math.max(0, Math.round(((processed + 1) / total) * 100))),
        filename: item.desiredName,
      });

      try {
        let data: Uint8Array;
        if (item.blob) {
          const blob = item.blob instanceof Promise ? await item.blob : item.blob;
          data = new Uint8Array(await blob.arrayBuffer());
        } else {
          data = await fetchArrayBufferWithRetry(
            item.url,
            retries,
            abortSignal,
            DEFAULT_BACKOFF_BASE_MS
          );
        }

        const filename = ensureUniqueFilename(item.desiredName);
        writer.addFile(filename, data);

        usedFilenames.push(filename);
        successful++;
      } catch (error) {
        if (abortSignal?.aborted) throw new Error('Download cancelled by user');
        failures.push({ url: item.url, error: getErrorMessage(error) });
      } finally {
        processed++;
      }
    }
  };

  const workers = Array.from({ length: concurrency }, () => runNext());
  await Promise.all(workers);

  const zipBytes = writer.finalize();

  return {
    filesSuccessful: successful,
    failures,
    zipData: zipBytes,
    usedFilenames,
  };
}
