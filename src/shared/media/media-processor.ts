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
import { logger } from '../logging';

/**
 * @interface MediaProcessStageEvent
 * Performance and progress event emitted at each pipeline stage
 *
 * Provides real-time feedback on pipeline progress when a callback is supplied.
 *
 * @property {string} stage - Pipeline stage identifier
 *   Values: 'collect' | 'extract' | 'normalize' | 'dedupe' | 'validate' | 'complete'
 *   Identifies which stage completed or is in progress
 *
 * @property {number} [count] - Item count after stage completion
 *   Number of items after processing this stage
 *   May be less than input due to filtering/deduplication
 *
 * @property {number} [count] - Item count after stage completion
 *   Number of items after processing this stage
 *   May be less than input due to filtering/deduplication
 *
 * @example
 * processor.process(element, {
 *   onStage: (event) => {
 *     console.log(`${event.stage}: ${event.count} items (${event.stageMs}ms)`);
 *     // Output: "collect: 24 items (12ms)"
 *     // Output: "extract: 18 items (8ms)"
 *     // Output: "normalize: 18 items (15ms)"
 *     // Output: "complete: 12 items (45ms total)"
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
 * @property {Function} [onStage] - Progress callback function
 *   Called after each pipeline stage with MediaProcessStageEvent
 *   Useful for lightweight UI updates or logging
 *
 * @example
 * const options: MediaProcessOptions = {
 *   telemetry: true,  // Enable timing metrics
 *   onStage: (event) => {
 *     if (event.stageMs && event.stageMs > 100) {
 *       console.warn(`Slow stage: ${event.stage} (${event.stageMs}ms)`);
 *     }
 *   }
 * };
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
 * event emission without collecting timing information.
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
 * const result = await processor.process(rootElement, {
 *   telemetry: true,
 *   onStage: (event) => console.log(`${event.stage}: ${event.count} items`)
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
   * Process HTML element to extract and normalize media items
   *
   * Orchestrates five-stage pipeline: collect → extract → normalize → dedupe → validate
   * Emits progress events at each stage via onStage callback if provided.
   *
   * **Performance Characteristics**:
   * - Without telemetry: Minimal overhead (~1-2ms for typical pages)
   * - With telemetry: Adds performance.now() calls (~2-3ms additional overhead)
   * - Memory: O(n) where n is number of media items found
   *
   * **Error Handling**:
   * Catches exceptions at each stage and returns Result with error code.
   * Partial failures are handled gracefully (later stages skip failed items).
   *
   * @param {HTMLElement} root - Root DOM element to search for media
   *   Typically document.body or specific container element
   *   Used as base for querySelectorAll operations
   *
   * @param {MediaProcessStageEvent & MediaProcessOptions} [options] - Configuration
   *   - onStage: Callback fired after each stage completes
   *
   * @returns {Result<MediaDescriptor[]>} Pipeline result
   *   - success: Result.data contains MediaDescriptor array
   *   - failure: Result.error contains ErrorCode with context
   *
   * @example
   * // Basic usage
   * const processor = new MediaProcessor();
   * const result = processor.process(document.body);
   *
   * if (result.success) {
   *   media = result.data;
   * }
   *
   * @example
   * // With progress monitoring
   * processor.process(document.body, {
   *   onStage: (event) => {
   *     console.log(`[${event.stage}] Items: ${event.count}, Time: ${event.totalMs}ms`);
   *   },
   *   telemetry: true
   * });
   *
   * @throws None - All errors caught and returned via Result type
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
      logger.debug('MediaProcessor: Starting media extraction');

      // Stage 1: Collection - Discover media candidate elements
      const elements = collectNodes(root);
      logger.debug(`MediaProcessor: Collected ${elements.length} candidate elements`);
      record('collect', elements.length);

      // Stage 2: Extraction - Extract raw data from elements
      const rawCandidates = elements
        .map(extractRawData)
        .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null);
      logger.debug(`MediaProcessor: Extracted ${rawCandidates.length} raw candidates`);
      record('extract', rawCandidates.length);

      // Stage 3: Normalization - Standardize and clean extracted data
      const normalized = normalize(rawCandidates);
      logger.debug(`MediaProcessor: Normalized ${normalized.length} items`);
      record('normalize', normalized.length);

      // Stage 4: Deduplication - Remove duplicate entries
      const unique = dedupe(normalized);
      logger.debug(`MediaProcessor: Deduplicated to ${unique.length} unique items`);
      record('dedupe', unique.length);

      // Stage 5: Validation - Verify data contracts and integrity
      const result = validate(unique);
      record('validate', isSuccess(result) ? result.data.length : 0);

      if (isSuccess(result)) {
        logger.info(`✅ MediaProcessor: Successfully extracted ${result.data.length} media items`);
      } else {
        logger.error('❌ MediaProcessor: Validation stage failed');
      }

      record('complete', isSuccess(result) ? result.data.length : 0);

      return result;
    } catch (error) {
      logger.error('❌ MediaProcessor: Error during processing:', error);
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

// 기본 export
export default MediaProcessor;
