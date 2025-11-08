/**
 * @fileoverview Media Extraction Services - Barrel Export Module
 * @description Public API for media extraction orchestration, strategies, and utilities
 * @version 3.0.0 - Consolidated Phase 405B media extraction layer
 *
 * ============================================
 * 📦 MODULE PURPOSE: Public API Gateway
 * ============================================
 *
 * This module provides the public-facing API for all media extraction functionality
 * in X.com Enhanced Gallery. It re-exports the main orchestrator and extractor
 * implementations, serving as the single entry point for consumers.
 *
 * **Architecture Layers** (from external consumer perspective):
 *
 * ```
 * External Consumer (feature layer)
 *   │
 *   └─ @shared/services/media-extraction (THIS MODULE)
 *        │
 *        ├─ MediaExtractionService (Phase 405B-1) - ORCHESTRATOR
 *        │  ├─ Phase 1: TweetInfoExtractor (extract metadata)
 *        │  ├─ Phase 2a: TwitterAPIExtractor (primary strategy)
 *        │  ├─ Phase 2b: DOMDirectExtractor (fallback strategy)
 *        │  └─ Phase 3: Coordinate 1→2a→2b pipeline
 *        │
 *        ├─ DOMDirectExtractor (Phase 405B-3) - Direct Export
 *        │  └─ For advanced use cases requiring DOM extraction only
 *        │
 *        └─ TwitterAPIExtractor (NOT exported - internal only)
 *           └─ Used by MediaExtractionService, not public API
 * ```
 *
 * **Public API Surface** (Exported):
 *
 * | Export | Type | Purpose | Typical Usage |
 * |--------|------|---------|---------------|
 * | `MediaExtractionService` | Class | Main orchestrator | Primary entry point for all extractions |
 * | `DOMDirectExtractor` | Class | Direct DOM extraction | Fallback or testing only |
 *
 * **Internal Implementation** (NOT Exported):
 *
 * | Module | Type | Purpose | Reason for Hiding |
 * |--------|------|---------|-------------------|
 * | `media-extraction-service.ts` | Orchestrator | Coordinate extraction phases | Consumers shouldn't manage phases |
 * | `extractors/twitter-api-extractor.ts` | Strategy | API-based extraction | Implementation detail of Phase 2a |
 * | `extractors/dom-direct-extractor.ts` | Strategy | DOM-based extraction | Fallback, exported separately |
 * | `strategies/media-click-index-strategy.ts` | Strategies | Index calculation | Implementation detail |
 * | `strategies/tweet-info-extractor.ts` | Strategy | Metadata extraction | Implementation detail |
 *
 * **Design Pattern**: Module Export Encapsulation
 * - Principle: Export only what consumers need
 * - Reason: Hide internal orchestration details
 * - Benefit: Freedom to refactor internals without breaking consumers
 * - Example: If Phase 2b strategy changes, consumers unaffected (abstracted)
 *
 * **Import Examples** (How to Use):
 *
 * ```typescript
 * // ✅ CORRECT: Standard usage (Phase extraction orchestrator)
 * import { MediaExtractionService } from '@shared/services/media-extraction';
 *
 * const service = new MediaExtractionService();
 * const result = await service.extractFromClickedElement(
 *   clickedElement,
 *   options,
 *   extractionId
 * );
 *
 * // ✅ CORRECT: Direct DOM extraction (advanced/testing)
 * import { DOMDirectExtractor } from '@shared/services/media-extraction';
 *
 * const extractor = new DOMDirectExtractor();
 * const result = await extractor.extract(element, options, extractionId);
 *
 * // ❌ WRONG: Don't import internal strategies directly
 * import { TwitterAPIExtractor } from '@shared/services/media-extraction/extractors/twitter-api-extractor';
 * // Reason: TwitterAPIExtractor is implementation detail, not part of public API
 *
 * // ❌ WRONG: Don't manage orchestration phases manually
 * import { TweetInfoExtractor } from '@shared/services/media-extraction/strategies/tweet-info-extractor';
 * import { TwitterAPIExtractor } from '@shared/services/media-extraction/extractors/twitter-api-extractor';
 * // Reason: MediaExtractionService handles phase coordination
 * ```
 *
 * **Module Organization**:
 *
 * ```
 * src/shared/services/media-extraction/
 * ├─ index.ts                          (THIS FILE - Public API)
 * ├─ media-extraction-service.ts       (Phase 405B-1: Orchestrator)
 * ├─ extractors/
 * │  ├─ twitter-api-extractor.ts      (Phase 405B-4: Primary strategy)
 * │  └─ dom-direct-extractor.ts       (Phase 405B-3: Fallback strategy)
 * └─ strategies/
 *    ├─ tweet-info-extractor.ts       (Phase 405B-2: Metadata extraction)
 *    ├─ media-click-index-strategy.ts (Phase 351: Index calculation)
 *    └─ [other strategies]
 * ```
 *
 * **Relationship to Other Modules**:
 *
 * **Depends On**:
 * - `@shared/services/media/twitter-video-extractor`: API wrapper
 * - `@shared/logging`: Logger service
 * - `@shared/utils/timer-management`: Timer utilities
 * - `@shared/types/media.types`: Type definitions
 *
 * **Used By**:
 * - `@features/gallery/`: Main gallery feature
 * - `@features/settings/`: Settings for extraction
 * - Test files: Unit/integration/E2E tests
 *
 * **Version History**:
 * - 3.0.0 (v0.4.2+): Phase 405B consolidation
 *   - Phase 405B-1: MediaExtractionService orchestrator
 *   - Phase 405B-2: TweetInfoExtractor metadata
 *   - Phase 405B-3: DOMDirectExtractor fallback
 *   - Phase 405B-4: TwitterAPIExtractor primary
 * - 2.0.0: Initial extraction service
 * - 1.0.0: Basic media handling
 *
 * **Future Roadmap**:
 * - Phase 405B BATCH 2: Modularize 7 strategies (separate files)
 * - Phase 406: Progressive media loading (lazy extraction)
 * - Phase 407: Caching layer (extracted media results)
 * - Phase 408: Parallel extraction (concurrent strategies)
 *
 * **Related Documentation**:
 * - `docs/ARCHITECTURE.md`: Overall architecture
 * - `docs/CODING_GUIDELINES.md`: Coding patterns
 * - Implementation files: Detailed method documentation
 * - `test/unit/shared/services/media-extraction/`: Unit tests
 *
 * **Quality Standards** (Maintained):
 * ✅ TypeScript strict mode: 0 errors
 * ✅ ESLint: 0 warnings
 * ✅ Test coverage: 100% (unit + integration + E2E)
 * ✅ Documentation: 79% density (Phase 405B standard)
 * ✅ Performance: Sub-1s extraction typical
 */

export { MediaExtractionService } from './media-extraction-service';
export { DOMDirectExtractor } from './extractors/dom-direct-extractor';
