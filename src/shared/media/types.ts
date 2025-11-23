/**
 * @fileoverview Media Processing Type System
 * @version 1.0.0 - Comprehensive media descriptor and variant definitions
 * @phase 401: Enhanced documentation for type contracts and architecture
 *
 * @section System Purpose
 * Defines the complete type system for media processing pipeline. Media flows
 * through multiple normalization stages, each with distinct type contracts.
 *
 * **Type Flow**: RawMediaCandidate → MediaDescriptor → MediaVariant
 * **Source**: HTML DOM elements, extracted URLs, and metadata attributes
 * **Consumers**: Gallery rendering, download orchestration, UI updates
 *
 * @section Architecture
 * **Immutable by Contract**: All interfaces use `readonly` modifiers
 * **Type Safety**: Discriminated unions for MediaType (via @/constants)
 * **Null Safety**: Optional properties clearly marked with `?` operator
 * **Variants**: Quality-based variants for responsive media handling
 *
 * @section Type Hierarchy
 * ```
 * RawMediaCandidate (DOM-level data)
 *   ↓ extraction & normalization
 * MediaDescriptor (normalized media object)
 *   └─ MediaVariant[] (quality variations)
 * ```
 *
 * @section Type Contracts
 *
 * ### RawMediaCandidate
 * Pre-parsing media data extracted from DOM. Contains raw element reference
 * and extracted attributes before normalization.
 *
 * ### MediaDescriptor
 * Fully normalized media object after pipeline processing. Canonical format
 * used throughout gallery system for consistency.
 *
 * ### MediaVariant
 * Quality-specific variant of a single media item. Supports responsive
 * loading strategies (orig, large, small).
 *
 * @section Constants Integration
 * **SSOT Principle**: MediaType sourced from @/constants for single source of truth
 * **Re-export Strategy**: MediaType imported and re-exported for accessibility
 * **Quality Levels**: 'orig' (original), 'large', 'small' for responsive delivery
 *
 * @section Design Patterns
 * - **Readonly Everything**: Ensures immutability, prevents accidental mutations
 * - **Discriminated Unions**: MediaType determines processing strategy
 * - **Optional Metadata**: width, height, alt, variants marked as optional
 * - **Result Pattern**: All operations return Result<T, ErrorCode>
 *
 * @section Related Documentation
 * - [@/constants](../../constants.ts) - MediaType definitions (SSOT)
 * - [@shared/types/result.types](../types/result.types.ts) - Result pattern
 * - [Media Pipeline](./pipeline.ts) - Normalization stages
 * - [Media Processor](./media-processor.ts) - Main processing orchestrator
 *
 * @author X.com Enhanced Gallery | Phase 401 Optimization
 */

// MediaType is @/constants source of truth for all media classifications
// Re-exported here for convenience and to maintain single import point
import type { MediaType } from "@/constants";
export type { MediaType };

/**
 * Result pattern type re-export
 * All media operations return Result<T, E> for safe error handling
 * @see {@link @shared/types/result.types} - Full Result implementation details
 */
export type { Result } from "@shared/types/result.types";

/**
 * @interface MediaVariant
 * Single media item with specific quality level
 *
 * Represents a quality-specific rendering of media content. Multiple variants
 * per item enable responsive loading strategies and optimization.
 *
 * @property {('orig'|'large'|'small')} quality - Quality tier identifier
 *   - **'orig'**: Original resolution, highest quality, largest file
 *   - **'large'**: Large preview, suitable for fullscreen display
 *   - **'small'**: Thumbnail variant, minimal bandwidth
 *
 * @property {string} url - Fully qualified media URL (http/https)
 *   Must be publicly accessible, validated during normalization
 *
 * @property {number} [width] - Width in pixels (optional metadata)
 *   Used for layout calculations and aspect ratio preservation
 *
 * @property {number} [height] - Height in pixels (optional metadata)
 *   Used for layout calculations and aspect ratio preservation
 *
 * @example
 * const originalVariant: MediaVariant = {
 *   quality: 'orig',
 *   url: 'https://pbs.twimg.com/media/ABC123_orig.jpg',
 *   width: 1920,
 *   height: 1080
 * };
 *
 * @immutable All properties readonly to prevent accidental mutations
 */
export interface MediaVariant {
  readonly quality: "orig" | "large" | "small";
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
}

/**
 * @interface MediaDescriptor
 * Canonical normalized representation of a media item
 *
 * After pipeline processing, all media items conform to this contract.
 * Used consistently throughout gallery system for rendering, download,
 * and metadata tracking.
 *
 * **Processing Origin**: Extracted from DOM elements, validated, normalized
 * **Immutability Contract**: All properties readonly, safe for shared state
 *
 * @property {string} id - Unique identifier for media item
 *   Format: Typically derived from element or URL hash
 *   Usage: Keys for deduplication, tracking, caching
 *
 * @property {MediaType} type - Classification of media content
 *   Values: 'image' | 'video' | 'gif' (from @/constants)
 *   Determines rendering strategy and processing pipeline
 *
 * @property {string} url - Primary media URL (typically highest quality)
 *   Must be fully qualified and publicly accessible
 *   Validated during normalization against URL patterns
 *
 * @property {number} [width] - Width in pixels (optional)
 *   Provided when available from DOM or metadata
 *   Used for layout and aspect ratio calculations
 *
 * @property {number} [height] - Height in pixels (optional)
 *   Provided when available from DOM or metadata
 *   Used for layout and aspect ratio calculations
 *
 * @property {ReadonlyArray<MediaVariant>} [variants] - Quality alternatives
 *   Multiple URLs at different quality levels (orig, large, small)
 *   Enables responsive loading and progressive enhancement
 *   Empty or absent if only primary URL available
 *
 * @property {string} [alt] - Alternative text for accessibility
 *   Required for WCAG 2.1 AA compliance
 *   Used for screen readers and text-mode rendering
 *
 * @example
 * const mediaItem: MediaDescriptor = {
 *   id: 'media_12345',
 *   type: 'image',
 *   url: 'https://pbs.twimg.com/media/ABC123_large.jpg',
 *   width: 1200,
 *   height: 675,
 *   alt: 'Product screenshot showing gallery feature',
 *   variants: [
 *     { quality: 'orig', url: 'https://pbs.twimg.com/media/ABC123_orig.jpg' },
 *     { quality: 'large', url: 'https://pbs.twimg.com/media/ABC123_large.jpg' },
 *     { quality: 'small', url: 'https://pbs.twimg.com/media/ABC123_small.jpg' }
 *   ]
 * };
 *
 * @immutable All properties readonly and deeply immutable
 * @see MediaVariant for variant structure details
 */
export interface MediaDescriptor {
  readonly id: string;
  readonly type: MediaType;
  readonly url: string;
  readonly width?: number;
  readonly height?: number;
  readonly variants?: ReadonlyArray<MediaVariant>;
  readonly alt?: string;
}

/**
 * @interface RawMediaCandidate
 * Pre-normalized media data extracted from DOM elements
 *
 * Represents the intermediate state between DOM extraction and pipeline
 * normalization. Contains raw element reference and extracted attributes.
 *
 * **Processing Stage**: First stage of media extraction pipeline
 * **Consumers**: Pipeline normalization functions
 * **Lifecycle**: Temporary data structure, replaced by MediaDescriptor
 *
 * @property {Element} element - Reference to original DOM element
 *   Can be <img>, <video>, <canvas>, or other media container
 *   Used for attribute extraction and metadata collection
 *   Discarded after extraction (doesn't persist in final descriptor)
 *
 * @property {string} url - Extracted media URL (may not be fully validated)
 *   Extracted from src, href, data-* attributes
 *   May be relative URL or require normalization
 *
 * @property {string} type - Initial media type classification
 *   Derived from element tagName, src extension, or mime type
 *   May require normalization (e.g., 'img' → 'image')
 *
 * @property {Record<string, string>} attributes - Element attributes
 *   All HTML attributes from source element as key-value pairs
 *   Used for metadata extraction (title, alt, data-*)
 *   Raw values, may contain whitespace or special characters
 *
 * @example
 * const raw: RawMediaCandidate = {
 *   element: imgElement,
 *   url: 'media/photo.jpg',
 *   type: 'img',
 *   attributes: {
 *     src: 'media/photo.jpg',
 *     alt: 'Photo description',
 *     class: 'gallery-image',
 *     'data-width': '1200'
 *   }
 * };
 *
 * @note Not intended for application use - intermediate pipeline stage
 * @see MediaDescriptor - Final normalized form after pipeline processing
 */
export interface RawMediaCandidate {
  readonly element: Element;
  readonly url: string;
  readonly type: string;
  readonly attributes: Record<string, string>;
}
