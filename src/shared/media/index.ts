/**
 * @fileoverview Media Extraction & Processing Module
 * @version 1.0.0 - Media extraction and normalization pipeline
 * @phase 401: Enhanced documentation and system overview
 *
 * @section System Purpose
 * Comprehensive media extraction and normalization system for DOM-based media discovery.
 * Converts raw HTML elements into normalized MediaDescriptor objects through
 * multi-stage pipeline processing.
 *
 * **Pipeline Stages**:
 * 1. Collection: Discover candidate elements in DOM
 * 2. Extraction: Extract raw data from elements
 * 3. Normalization: Clean and standardize data
 * 4. Deduplication: Remove duplicate entries
 * 5. Validation: Verify data contracts
 *
 * @section Architecture
 * **Three Tiers**:
 * - **High-Level**: MediaProcessor class - Orchestrates entire pipeline
 * - **Mid-Level**: Pipeline stages - Individual transformation functions
 * - **Low-Level**: Types - Type contracts and data structures
 *
 * **Design Pattern**: Functional pipeline with typed stages
 * **Error Handling**: Result<T, ErrorCode> for safe operations
 * **Immutability**: All data structures use readonly properties
 *
 * @section Exported Components
 *
 * ### Processing Classes
 * - **MediaProcessor**: Main orchestrator for media extraction (currently test-only)
 * - **processMedia()**: Convenience wrapper around MediaProcessor
 *
 * ### Pipeline Functions
 * - **collectNodes()**: Discover media elements in DOM
 * - **extractRawData()**: Extract raw attributes from elements
 * - **normalize()**: Clean and standardize extracted data
 * - **dedupe()**: Remove duplicate media entries
 * - **validate()**: Verify data contracts and integrity
 *
 * ### Type Definitions
 * - **MediaDescriptor**: Normalized media object contract
 * - **MediaVariant**: Quality-specific media variant
 * - **RawMediaCandidate**: Pre-normalized extracted data
 * - **MediaType**: Classification type (image | video | gif)
 * - **Result<T>**: Safe result type for error handling
 *
 * @section Usage Patterns
 *
 * ### Complete Pipeline
 * ```typescript
 * import { MediaProcessor } from '@shared/media';
 *
 * const processor = new MediaProcessor();
 * const result = processor.process(rootElement, {
 *   onStage: event => console.log(`Stage: ${event.stage}`)
 * });
 *
 * if (result.success) {
 *   console.log('Media items:', result.data);
 * } else {
 *   console.error('Processing failed:', result.error);
 * }
 * ```
 *
 * ### Individual Stages
 * ```typescript
 * import {
 *   collectNodes,
 *   extractRawData,
 *   normalize,
 *   dedupe,
 *   validate
 * } from '@shared/media';
 *
 * const nodes = collectNodes(rootElement);
 * const raw = extractRawData(nodes);
 * const normalized = normalize(raw);
 * const deduped = dedupe(normalized);
 * const validated = validate(deduped);
 * ```
 *
 * @section Related Modules
 * - [Types](./types.ts) - Type system and contracts
 * - [MediaProcessor](./media-processor.ts) - Main orchestrator class
 * - [Pipeline](./pipeline.ts) - Stage implementations
 * - [UsernameSource](./username-source.ts) - Username extraction utility
 * - [@shared/types/result.types](../types/result.types.ts) - Result pattern
 * - [@/constants](../../constants.ts) - MediaType definitions
 *
 * @section Design Principles
 * - **Single Responsibility**: Each stage has one transformation
 * - **Composability**: Stages can be used independently
 * - **Type Safety**: Full TypeScript coverage, no `any` types
 * - **Immutability**: No mutations, functional programming style
 * - **Error Safety**: Result pattern for all operations
 * - **Minimal Surface**: No runtime telemetry or instrumentation in production path
 *
 * @section Status Notes
 * - **MediaProcessor**: Maintained for tests, not used in main application
 * - **FilenameService**: Moved to @shared/services/file-naming (not here)
 * - **Username Extraction**: Specialized module (username-source.ts)
 *
 * @author X.com Enhanced Gallery | Phase 401 Optimization
 */

// ─────────────────────────────────────────────────────────────────────────────
// Main Processing Orchestrator
// ─────────────────────────────────────────────────────────────────────────────
export { MediaProcessor, processMedia } from './media-processor';
export { collectNodes, extractRawData, normalize, dedupe, validate } from './pipeline';

// 타입 정의
export type { MediaDescriptor, MediaType, MediaVariant, RawMediaCandidate, Result } from './types';
