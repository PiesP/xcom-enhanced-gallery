/**
 * DownloadOrchestrator
 * - Centralizes concurrency, retry, and ZIP assembly for media downloads
 * - Pure service with no UI side-effects. Vendors accessed only via getters.
 * @version 2.0.0 - Phase 2025-10-27: base-service로 마이그레이션, 구현 완성
 */

import { BaseServiceImpl } from '../base-service';
import { getErrorMessage } from '../../utils/error-handling';
import { globalTimerManager } from '../../utils/timer-management';

export interface OrchestratorItem {
  url: string;
  /** desired filename (before collision resolution) */
  desiredName: string;
}

export interface OrchestratorOptions {
  concurrency?: number; // 1..8
  retries?: number; // >= 0
  signal?: AbortSignal;
  onProgress?: (progress: {
    phase: 'preparing' | 'downloading' | 'complete';
    current: number;
    total: number;
    percentage: number;
    filename?: string;
  }) => void;
}

export interface ZipResult {
  filesSuccessful: number;
  failures: Array<{ url: string; error: string }>;
  zipData: Uint8Array; // raw zip bytes
  usedFilenames: string[]; // in order of completion
}

export class DownloadOrchestrator extends BaseServiceImpl {
  static readonly DEFAULT_BACKOFF_BASE_MS = 200;
  private static instance: DownloadOrchestrator | null = null;
  private activeTimers: ReturnType<typeof globalTimerManager.setTimeout>[] = [];

  private constructor() {
    super('DownloadOrchestrator');
  }

  public static getInstance(): DownloadOrchestrator {
    if (!DownloadOrchestrator.instance) {
      DownloadOrchestrator.instance = new DownloadOrchestrator();
    }
    return DownloadOrchestrator.instance;
  }

  protected async onInitialize(): Promise<void> {
    // No special initialization needed
  }

  protected onDestroy(): void {
    // Clean up any lingering timers
    this.activeTimers.forEach(timer => {
      globalTimerManager.clearTimeout(timer);
    });
    this.activeTimers = [];
  }

  private async sleep(ms: number, signal?: AbortSignal): Promise<void> {
    if (ms <= 0) return;
    return new Promise<void>((resolve, reject) => {
      const timer = globalTimerManager.setTimeout(() => {
        cleanup();
        resolve();
      }, ms);
      this.activeTimers.push(timer);

      const onAbort = () => {
        cleanup();
        reject(new Error('Download cancelled by user'));
      };
      const cleanup = () => {
        globalTimerManager.clearTimeout(timer);
        this.activeTimers = this.activeTimers.filter(t => t !== timer);
        signal?.removeEventListener('abort', onAbort);
      };
      if (signal) signal.addEventListener('abort', onAbort);
    });
  }

  private async fetchArrayBufferWithRetry(
    url: string,
    retries: number,
    signal?: AbortSignal,
    backoffBaseMs: number = DownloadOrchestrator.DEFAULT_BACKOFF_BASE_MS
  ): Promise<Uint8Array> {
    let attempt = 0;
    // total tries = retries + 1
    while (true) {
      if (signal?.aborted) throw new Error('Download cancelled by user');
      try {
        const response = await fetch(url, { ...(signal ? { signal } : {}) } as RequestInit);
        // Some tests/mock responses may omit the "ok" property. In that case, assume OK.
        if ('ok' in response && !response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
      } catch (err) {
        if (attempt >= retries) throw err;
        attempt += 1;
        const delay = Math.max(0, Math.floor(backoffBaseMs * 2 ** (attempt - 1)));
        await this.sleep(delay, signal);
      }
    }
  }

  /**
   * Ensure unique filename by suffixing -1, -2, ... when collision occurs
   */
  private ensureUniqueFilenameFactory() {
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
      // start suffixing at 1
      while (true) {
        count += 1;
        const candidate = `${name}-${count}${ext}`;
        if (!usedNames.has(candidate)) {
          baseCounts.set(baseKey, count);
          usedNames.add(candidate);
          return candidate;
        }
      }
    };
  }

  /**
   * Download items concurrently with retry and return ZIP payload
   */
  public async zipMediaItems(
    items: OrchestratorItem[],
    options: OrchestratorOptions = {}
  ): Promise<ZipResult> {
    const files: Record<string, Uint8Array> = {};
    const failures: Array<{ url: string; error: string }> = [];

    const ensureUniqueFilename = this.ensureUniqueFilenameFactory();

    const total = items.length;
    const concurrency = Math.max(1, Math.min(options.concurrency ?? 2, 8));
    const retries = Math.max(0, options.retries ?? 0);
    const abortSignal = options.signal;
    const isAborted = () => !!abortSignal?.aborted;

    options.onProgress?.({ phase: 'preparing', current: 0, total, percentage: 0 });

    let processed = 0;
    let successful = 0;
    const usedFilenames: string[] = [];
    let index = 0;

    const runNext = async (): Promise<void> => {
      while (true) {
        if (isAborted()) throw new Error('Download cancelled by user');
        const i = index++;
        if (i >= total) return;
        const item = items[i];
        if (!item) {
          processed++;
          continue;
        }

        options.onProgress?.({
          phase: 'downloading',
          current: Math.min(processed + 1, total),
          total,
          percentage: Math.min(100, Math.max(0, Math.round(((processed + 1) / total) * 100))),
          filename: item.desiredName,
        });

        try {
          const data = await this.fetchArrayBufferWithRetry(item.url, retries, abortSignal);
          const filename = ensureUniqueFilename(item.desiredName);
          files[filename] = data;
          usedFilenames.push(filename);
          successful++;
        } catch (error) {
          if (isAborted()) throw new Error('Download cancelled by user');
          failures.push({ url: item.url, error: getErrorMessage(error) });
        } finally {
          processed++;
        }
      }
    };

    const workers = Array.from({ length: concurrency }, () => runNext());
    await Promise.all(workers);

    const { createZipBytesFromFileMap } = await import('../../external/zip/zip-creator');
    const zipBytes = await createZipBytesFromFileMap(files);
    return {
      filesSuccessful: successful,
      failures,
      zipData: new Uint8Array(zipBytes),
      usedFilenames,
    };
  }
}

export default DownloadOrchestrator;
