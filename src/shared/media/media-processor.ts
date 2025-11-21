/**
 * @fileoverview MediaProcessor - Main Processing Orchestrator
 * @version 1.0.0 - Media extraction and normalization orchestration
 * @phase 379: Media Processing Module Optimization
 *
 * @section System Purpose
 * Primary orchestrator for converting raw HTML elements into normalized
 * MediaDescriptor objects. Coordinates multi-stage pipeline without any
 * telemetry collection or runtime instrumentation.
 *
 * **Processing Flow**: HTML Element → Collection → Extraction → Normalization →
 * Deduplication → Validation → MediaDescriptor[]
 *
 * **Progress Hooks**: Optional per-stage callbacks without timing metrics
 *
 * @section Architecture
 * **Pattern**: Functional pipeline orchestrator with Observable-style callbacks
 * **Result Type**: All operations return Result<T, ErrorCode> for safe error handling
 * **Progress Hooks**: Optional callbacks for stage completion notifications
 *
 * @section Related Modules
 * - [Pipeline](./pipeline.ts) - Individual transformation stages
 * - [Types](./types.ts) - Type definitions and contracts
 * - [Index](./index.ts) - Barrel export and system overview
 *
 * @author X.com Enhanced Gallery | Phase 379
 */

import type { MediaDescriptor } from './types';
import type { Result } from '@shared/types/result.types';
import { failure, ErrorCode, isSuccess } from '@shared/types/result.types';
import { collectNodes, extractRawData, normalize, dedupe, validate } from './pipeline';

/**
 * @interface MediaProcessStageEvent
 * Performance and progress event emitted at each pipeline stage
 *
 * Provides lightweight feedback on pipeline progress when a callback is supplied.
 *
 * @property {string} stage - Pipeline stage identifier
 *   Values: 'collect' | 'extract' | 'normalize' | 'dedupe' | 'validate' | 'complete'
 *   Identifies which stage completed or is in progress
 *
 * @property {number} [count] - Item count after stage completion
 *   Number of items after processing this stage (may shrink due to filtering)
 *
 * @example
 * processor.process(element, {
 *   onStage: (event) => {
 *     console.log(`${event.stage}: ${event.count} items`);
 *     // Output: "collect: 24 items"
 *     // Output: "extract: 18 items"
 *     // Output: "normalize: 18 items"
 *     // Output: "complete: 12 items"
 *   }
 * });
 */
export interface MediaProcessStageEvent {
  readonly stage: 'collect' | 'extract' | 'normalize' | 'dedupe' | 'validate' | 'complete';
  readonly count?: number;
}

/**
 * @interface MediaProcessOptions
 * Configuration options for media processing pipeline
 *
 * Allows customization of processing behavior including progress events.
 *
 * @property {Function} [onStage] - Progress callback function invoked after each stage
 *   Useful for lightweight UI updates or diagnostics outside production builds
 */
export interface MediaProcessOptions {
  readonly onStage?: (event: MediaProcessStageEvent) => void;
}

/**
 * @class MediaProcessor
 * Primary orchestrator for media extraction and normalization pipeline
 *
 * Coordinates multi-stage transformation from raw HTML elements to
 * normalized MediaDescriptor objects. Provides optional progress
 * event emission without collecting timing metrics.
 *
 * **Pipeline Stages**:
 * 1. Collection: Discover candidate elements in DOM
 * 2. Extraction: Extract raw data from elements
 * 3. Normalization: Clean and standardize data
 * 4. Deduplication: Remove duplicate entries
 * 5. Validation: Verify data contracts
 *
 * **Usage Pattern**:
 * ```typescript
 * const processor = new MediaProcessor();
 * const result = processor.process(rootElement, {
 *   onStage: event => console.log(`${event.stage}: ${event.count} items`),
 * });
 *
 * if (result.success) {
 *   console.log('Extracted media:', result.data);
 * }
 * ```
 *
 * @note Currently maintained for test scenarios; production uses inline pipeline
 * @internal Implementation detail; use processMedia() convenience function for general use
 *
 * @see processMedia - Convenience wrapper function
 * @see pipeline.ts - Individual stage implementations
 */
export class MediaProcessor {
  /**
   * Run the five-stage media pipeline against the provided root element.
   *
   * @param root Root DOM element to search for media nodes.
   * @param options Optional callback configuration.
   * @returns Result containing normalized media descriptors or an error payload.
   *
   * @example
   * const processor = new MediaProcessor();
   * const result = processor.process(document.body, {
   *   onStage: event => console.log(`${event.stage}: ${event.count ?? 0}`),
   * });
   */
  process(root: HTMLElement, options?: MediaProcessOptions): Result<MediaDescriptor[]> {
    const onStage = options?.onStage;

    /**
     * @internal Record stage metrics and emit event
     * @param {string} stage - Stage identifier
     * @param {number} count - Item count at this stage
     */
    const record = (stage: MediaProcessStageEvent['stage'], count: number): void => {
      onStage?.({ stage, count });
    };

    try {
      // Stage 1: Collection - Discover media candidate elements
      const elements = collectNodes(root);
      record('collect', elements.length);

      // Stage 2: Extraction - Extract raw data from elements
      const rawCandidates = elements
        .map(extractRawData)
        .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null);
      record('extract', rawCandidates.length);

      // Stage 3: Normalization - Standardize and clean extracted data
      const normalized = normalize(rawCandidates);
      record('normalize', normalized.length);

      // Stage 4: Deduplication - Remove duplicate entries
      const unique = dedupe(normalized);
      record('dedupe', unique.length);

      // Stage 5: Validation - Verify data contracts and integrity
      const result = validate(unique);
      record('validate', isSuccess(result) ? result.data.length : 0);

      record('complete', isSuccess(result) ? result.data.length : 0);

      return result;
    } catch (error) {
      const err = failure<MediaDescriptor[]>(
        error instanceof Error ? error.message : String(error),
        ErrorCode.UNKNOWN,
        {
          cause: error instanceof Error ? error : undefined,
        }
      );
      record('complete', 0);
      return err;
    }
  }
}

/**
 * Convenience function for media extraction
 *
 * Provides simple one-call interface to complete media extraction pipeline.
 * Creates temporary MediaProcessor instance and executes full pipeline.
 *
 * **Usage**:
 * ```typescript
 * const result = processMedia(document.body);
 * if (result.success) {
 *   gallery.setMedia(result.data);
 * }
 * ```
 *
 * @param {HTMLElement} root - Root element to search for media
 *   Typically document.body or media container
 *
 * @returns {Result<MediaDescriptor[]>} Extraction result
 *   success: Array of normalized media descriptors
 *   failure: Error code with context
 *
 * @throws None - All errors caught and returned via Result
 *
 * @internal Wrapper function; use for general-purpose extraction
 * @see MediaProcessor.process - Full-featured version with options
 *
 * @example
 * const media = processMedia(element);
 * if (media.success) {
 *   console.log(`Found ${media.data.length} media items`);
 * }
 */
export function processMedia(root: HTMLElement): Result<MediaDescriptor[]> {
  // Null check for root element
  if (!root) {
    return failure('processMedia: Root element is null', ErrorCode.INVALID_ELEMENT, {
      meta: { rootElementType: typeof root },
    });
  }

  const processor = new MediaProcessor();
  return processor.process(root);
}
