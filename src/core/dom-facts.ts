/**
 * @fileoverview DOM facts type definitions for page state inspection
 * @module core/dom-facts
 */

/** Discriminator for DOM facts variants. */
export type DomFactsKind = 'XComGallery';

/**
 * Immutable snapshot of DOM state at a specific point in time
 *
 * @remarks
 * DomFacts represents a structured, type-safe snapshot of page state extracted from the DOM.
 * Facts are immutable (all properties readonly) to ensure they remain consistent after creation,
 * enabling safe caching, comparison, and sharing across application layers.
 *
 * ## Fields
 *
 * ### kind: DomFactsKind
 * Type discriminator for exhaustive pattern matching. Currently only `'XComGallery'` is supported.
 * Future extensions will add more kinds for different page contexts (timeline, profile, etc.).
 *
 * ### url: string
 * Current page URL at the time of fact extraction. Used for:
 * - Correlating facts with specific pages
 * - Detecting navigation changes
 * - Debugging and logging context
 *
 * Format: Full URL including protocol, domain, path, and query parameters
 * Example: `'https://x.com/user/status/123456789'`
 *
 * ### hasXegOverlay: boolean
 * Indicates whether the enhanced gallery overlay is currently present in the DOM.
 * - `true`: Gallery overlay is mounted and visible
 * - `false`: Gallery overlay is not present (native X.com view)
 *
 * Use case: Prevent duplicate gallery initialization, detect existing gallery state.
 *
 * ### hasXComMediaViewer: boolean
 * Indicates whether X.com's native media viewer/lightbox is currently open.
 * - `true`: Native media viewer is active (user opened an image/video)
 * - `false`: Native media viewer is closed (timeline/tweet view)
 *
 * Use case: Coordinate with native viewer, avoid conflicts, trigger gallery on viewer open.
 *
 * ### mediaElementsCount: number
 * Count of media elements (images, videos) found in the current context.
 * - `>= 0`: Number of extractable media elements
 * - `0`: No media found (text-only tweet or non-media page)
 *
 * Use case: Determine if gallery should be initialized, show media count in UI.
 *
 * ## Immutability Contract
 * All properties are `readonly` at compile time. Runtime code must not modify fact objects.
 * Create new facts for updated state instead of mutating existing facts.
 *
 * ## Serialization
 * DomFacts is plain-old-data (POD) and can be safely serialized to JSON for:
 * - IPC (inter-process communication)
 * - State persistence
 * - Logging and debugging
 *
 * @example
 * ```typescript
 * // Creating facts (runtime adapter)
 * const facts: DomFacts = {
 *   kind: 'XComGallery',
 *   url: window.location.href,
 *   hasXegOverlay: !!document.querySelector('.xeg-gallery-overlay'),
 *   hasXComMediaViewer: !!document.querySelector('[data-testid="photoViewer"]'),
 *   mediaElementsCount: document.querySelectorAll('[data-testid="tweetPhoto"]').length,
 * };
 *
 * // Consuming facts (business logic)
 * function shouldInitGallery(facts: DomFacts): boolean {
 *   return (
 *     !facts.hasXegOverlay &&           // Gallery not already present
 *     facts.hasXComMediaViewer &&       // Native viewer is open
 *     facts.mediaElementsCount > 0      // Media elements available
 *   );
 * }
 *
 * // Pattern matching by kind
 * function logFacts(facts: DomFacts): void {
 *   switch (facts.kind) {
 *     case 'XComGallery':
 *       console.log('Gallery Facts:', {
 *         url: facts.url,
 *         overlay: facts.hasXegOverlay,
 *         viewer: facts.hasXComMediaViewer,
 *         mediaCount: facts.mediaElementsCount,
 *       });
 *       break;
 *     default:
 *       const _exhaustive: never = facts.kind;
 *       throw new Error(`Unknown facts kind: ${_exhaustive}`);
 *   }
 * }
 *
 * // Fact comparison (detect changes)
 * function factsChanged(prev: DomFacts, next: DomFacts): boolean {
 *   return (
 *     prev.url !== next.url ||
 *     prev.hasXegOverlay !== next.hasXegOverlay ||
 *     prev.hasXComMediaViewer !== next.hasXComMediaViewer ||
 *     prev.mediaElementsCount !== next.mediaElementsCount
 *   );
 * }
 * ```
 *
 * @see {@link DomFactsKind} for supported fact kinds
 */
export interface DomFacts {
  readonly kind: DomFactsKind;
  readonly url: string;
  readonly hasXegOverlay: boolean;
  readonly hasXComMediaViewer: boolean;
  readonly mediaElementsCount: number;
}

// ============================================================================
// Type Helpers
// ============================================================================

/**
 * Type helper: Extract specific facts variant by kind discriminator
 *
 * @remarks
 * Currently all facts share the same structure (only `XComGallery` kind exists),
 * but this helper is prepared for future extensions with different fact variants.
 *
 * When adding new fact kinds with different fields, this helper will enable
 * type-safe extraction of specific variants from a DomFacts union type.
 *
 * @example
 * ```typescript
 * // Future usage (when multiple kinds exist)
 * type GalleryFacts = ExtractDomFacts<'XComGallery'>;
 * type TimelineFacts = ExtractDomFacts<'XComTimeline'>;
 *
 * // Type-safe fact handling
 * function handleGalleryFacts(facts: ExtractDomFacts<'XComGallery'>): void {
 *   console.log('Gallery overlay:', facts.hasXegOverlay);
 *   console.log('Media count:', facts.mediaElementsCount);
 * }
 *
 * // Pattern matching with extracted types
 * function processFacts(facts: DomFacts): void {
 *   switch (facts.kind) {
 *     case 'XComGallery': {
 *       const galleryFacts: ExtractDomFacts<'XComGallery'> = facts;
 *       handleGalleryFacts(galleryFacts);
 *       break;
 *     }
 *     default:
 *       const _exhaustive: never = facts.kind;
 *       throw new Error(`Unhandled facts kind: ${_exhaustive}`);
 *   }
 * }
 * ```
 */
export type ExtractDomFacts<K extends DomFactsKind> = Extract<DomFacts, { kind: K }>;

/**
 * Type helper: Create partial facts object for updates or defaults
 *
 * @remarks
 * Utility type for creating partial fact objects during construction or testing.
 * Useful when you want to provide only a subset of fields and let defaults fill the rest.
 *
 * Note: In practice, DomFacts objects should be complete when created by runtime adapters.
 * This helper is primarily for testing and internal construction utilities.
 *
 * @example
 * ```typescript
 * // Testing helper: Create facts with defaults
 * function createTestFacts(overrides?: PartialDomFacts): DomFacts {
 *   return {
 *     kind: 'XComGallery',
 *     url: 'https://x.com/test',
 *     hasXegOverlay: false,
 *     hasXComMediaViewer: false,
 *     mediaElementsCount: 0,
 *     ...overrides,
 *   };
 * }
 *
 * // Usage in tests
 * const factsWithOverlay = createTestFacts({
 *   hasXegOverlay: true,
 *   mediaElementsCount: 5,
 * });
 *
 * // Partial update pattern (if needed in future)
 * function updateFacts(
 *   base: DomFacts,
 *   updates: PartialDomFacts
 * ): DomFacts {
 *   return { ...base, ...updates };
 * }
 * ```
 */
export type PartialDomFacts = Partial<DomFacts>;

/**
 * Type helper: Type predicate for runtime DomFacts validation
 *
 * @remarks
 * Enables runtime validation of objects to ensure they conform to DomFacts structure.
 * Useful when receiving data from external sources (IPC, storage, network) where
 * compile-time type safety is not available.
 *
 * @example
 * ```typescript
 * // Runtime validation implementation
 * function isDomFacts(value: unknown): value is DomFacts {
 *   if (typeof value !== 'object' || value === null) return false;
 *
 *   const obj = value as Record<string, unknown>;
 *
 *   return (
 *     typeof obj.kind === 'string' &&
 *     obj.kind === 'XComGallery' &&
 *     typeof obj.url === 'string' &&
 *     typeof obj.hasXegOverlay === 'boolean' &&
 *     typeof obj.hasXComMediaViewer === 'boolean' &&
 *     typeof obj.mediaElementsCount === 'number' &&
 *     obj.mediaElementsCount >= 0
 *   );
 * }
 *
 * // Usage with external data
 * function processPossibleFacts(data: unknown): void {
 *   if (isDomFacts(data)) {
 *     // TypeScript knows data is DomFacts here
 *     console.log('Valid facts:', data.kind, data.mediaElementsCount);
 *   } else {
 *     console.error('Invalid facts structure:', data);
 *   }
 * }
 *
 * // IPC handler with validation
 * function handleIPCMessage(message: unknown): void {
 *   if (isDomFacts(message)) {
 *     updateUIWithFacts(message);
 *   }
 * }
 * ```
 */
export type DomFactsPredicate = (value: unknown) => value is DomFacts;
