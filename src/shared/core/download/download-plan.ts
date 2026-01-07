/**
 * @fileoverview Download planning utilities (functional core)
 * @description Pure functions that convert inputs (media, options, capabilities)
 *              into executable download plans.
 */

import { generateMediaFilename, generateZipFilename } from '@shared/core/filename/filename-utils';
import type { MediaInfo } from '@shared/types/media.types';

/**
 * Available download methods
 * @typedef {'gm_download' | 'none'} DownloadMethod
 */
type DownloadMethod = 'gm_download' | 'none';

/**
 * Input parameters for planning a single file download
 * @interface SingleDownloadPlanningInput
 */
interface SingleDownloadPlanningInput {
  readonly method: DownloadMethod;
  readonly mediaUrl: string;
  readonly filename: string;
  readonly hasProvidedBlob: boolean;
}

/**
 * Result of single download planning
 * @typedef SingleDownloadPlan
 * @description Union type representing either a successful download plan or a failure state
 */
export type SingleDownloadPlan =
  | {
      readonly strategy: 'gm_download';
      readonly url: string;
      readonly filename: string;
      readonly useBlobUrl: boolean;
    }
  | {
      readonly strategy: 'none';
      readonly filename: string;
      readonly error: string;
    };

/**
 * Plan the download strategy for a single item.
 *
 * @param input - Configuration for single download planning
 * @returns Download plan with strategy and metadata
 *
 * @remarks
 * - This function is pure by design and performs no IO.
 * - URL.createObjectURL is an effect and must be done by the caller.
 * - For GM_download method, returns a plan with URL and blob usage flag.
 * - For unsupported methods, returns a failure plan with error message.
 *
 * @example
 * ```typescript
 * const plan = planSingleDownload({
 *   method: 'gm_download',
 *   mediaUrl: 'https://example.com/image.jpg',
 *   filename: 'photo.jpg',
 *   hasProvidedBlob: false,
 * });
 * // Returns: { strategy: 'gm_download', url: '...', filename: 'photo.jpg', useBlobUrl: false }
 * ```
 */
export function planSingleDownload(input: SingleDownloadPlanningInput): SingleDownloadPlan {
  const { method, mediaUrl, filename, hasProvidedBlob } = input;

  if (method === 'gm_download') {
    return {
      strategy: 'gm_download',
      url: mediaUrl,
      filename,
      useBlobUrl: hasProvidedBlob,
    };
  }

  return { strategy: 'none', filename, error: 'No download method' };
}

/**
 * Planned item for ZIP archive inclusion
 * @interface PlannedZipItem
 */
interface PlannedZipItem {
  readonly url: string;
  readonly desiredName: string;
  readonly blob?: Blob | Promise<Blob> | undefined;
}

/**
 * Input parameters for planning bulk (ZIP) downloads
 * @interface BulkDownloadPlanningInput
 */
interface BulkDownloadPlanningInput {
  readonly mediaItems: readonly MediaInfo[];
  readonly prefetchedBlobs?: Map<string, Blob | Promise<Blob>> | undefined;
  readonly zipFilename?: string | undefined;
  /**
   * Injected time source for filename fallbacks (keeps planning pure).
   * When undefined, current system time will be used.
   */
  readonly nowMs?: number | undefined;
}

/**
 * Result of bulk download planning
 * @interface BulkDownloadPlan
 */
interface BulkDownloadPlan {
  readonly items: readonly PlannedZipItem[];
  readonly zipFilename: string;
}

/**
 * Plan the ZIP download: resolve desired names and associate optional prefetched blobs.
 *
 * @param input - Configuration for bulk download planning
 * @returns Plan containing items with URLs, filenames, and optional blobs, plus ZIP filename
 *
 * @remarks
 * - Pure function that does not perform IO operations
 * - Generates filenames for each media item using filename utilities
 * - Associates prefetched blobs if available in the provided map
 * - Uses provided zipFilename or generates one from media items
 * - Supports injected time source (nowMs) for reproducible filename generation
 *
 * @example
 * ```typescript
 * const plan = planBulkDownload({
 *   mediaItems: [media1, media2],
 *   prefetchedBlobs: new Map([[media1.url, blob1]]),
 *   zipFilename: 'gallery.zip',
 *   nowMs: 1234567890000,
 * });
 * // Returns: { items: [...], zipFilename: 'gallery.zip' }
 * ```
 */
export function planBulkDownload(input: BulkDownloadPlanningInput): BulkDownloadPlan {
  const items: PlannedZipItem[] = input.mediaItems.map((media) => ({
    url: media.url,
    desiredName:
      input.nowMs === undefined
        ? generateMediaFilename(media)
        : generateMediaFilename(media, { nowMs: input.nowMs }),
    blob: input.prefetchedBlobs?.get(media.url),
  }));

  const zipFilename =
    input.zipFilename ??
    (input.nowMs === undefined
      ? generateZipFilename(input.mediaItems)
      : generateZipFilename(input.mediaItems, { nowMs: input.nowMs }));

  return { items, zipFilename };
}

/**
 * Available ZIP save strategies
 * @typedef {'gm_download' | 'none'} ZipSaveStrategy
 */
type ZipSaveStrategy = 'gm_download' | 'none';

/**
 * Plan how to persist a prepared ZIP blob.
 *
 * @param method - Available download method
 * @returns Strategy for saving the ZIP file
 *
 * @remarks
 * - Pure mapping function from download method to save strategy
 * - Currently supports GM_download or no-op fallback
 * - Future methods can be added without changing the interface
 *
 * @example
 * ```typescript
 * const strategy = planZipSave('gm_download');
 * // Returns: 'gm_download'
 * ```
 */
export function planZipSave(method: DownloadMethod): ZipSaveStrategy {
  if (method === 'gm_download') {
    return 'gm_download';
  }
  return 'none';
}
