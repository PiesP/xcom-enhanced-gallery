/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Focus Services Module - 3-stage focus management system
 * @version 1.0.0
 *
 * Barrel export for focus service layer components.
 *
 * **Focus System Architecture**:
 * A 3-stage pipeline for automatic focus management in gallery contexts:
 *
 * ```
 * Visibility Detection (Stage 1)
 *   ↓ (CandidateScore[])
 * Focus Application (Stage 2)
 *   ↓ (Focus index + DOM element)
 * State Synchronization (Stage 3)
 *   ↓ (Debounced updates + container sync)
 * ```
 *
 * **Key Components**:
 *
 * 1. **FocusObserverManager** - Visibility Detection
 *    - IntersectionObserver-based item visibility detection
 *    - Calculates focus priority scores for visible items
 *    - Supports dynamic item observation
 *    - Phase 330: Focus system architecture
 *    - Phase 334: Focus priority scoring algorithm
 *
 * 2. **FocusApplicatorService** - Focus Application
 *    - Auto-focus element application
 *    - Manages focus timers and scheduling
 *    - Handles focus state transitions
 *    - Fallback mechanisms (preventScroll support)
 *    - Phase 330: Focus management framework
 *
 * 3. **FocusStateManagerService** - State Synchronization
 *    - Debounced state updates (50ms by default)
 *    - Container attribute synchronization
 *    - Scroll-aware state management
 *    - Deferred recompute after scroll settles
 *    - Phase 340: Performance optimization (debouncing)
 *
 * **Import Patterns**:
 *
 * Option 1: Specific imports (recommended)
 * ```typescript
 * import {
 *   FocusObserverManager,
 *   createFocusObserverManager,
 * } from '@shared/services/focus';
 *
 * const observer = createFocusObserverManager();
 * ```
 *
 * Option 2: Full namespace import
 * ```typescript
 * import * as FocusServices from '@shared/services/focus';
 *
 * const observer = new FocusServices.FocusObserverManager();
 * ```
 *
 * Option 3: Destructured destructuring
 * ```typescript
 * const { FocusApplicatorService, createFocusApplicatorService } = await import(
 *   '@shared/services/focus'
 * );
 *
 * const applicator = createFocusApplicatorService();
 * ```
 *
 * **Factory Functions**:
 * Each service provides a factory function for clean instantiation:
 * - createFocusObserverManager()
 * - createFocusApplicatorService()
 * - createFocusStateManagerService()
 *
 * Benefits:
 * - Dependency injection support
 * - Testing/mocking friendliness
 * - Consistent instantiation pattern
 * - Clean service layer API
 *
 * **Integration Example**:
 *
 * ```typescript
 * import {
 *   createFocusObserverManager,
 *   createFocusApplicatorService,
 *   createFocusStateManagerService,
 * } from '@shared/services/focus';
 *
 * // Setup 3-stage pipeline
 * const observer = createFocusObserverManager();
 * const applicator = createFocusApplicatorService();
 * const stateManager = createFocusStateManagerService();
 *
 * // Stage 1: Visibility detection
 * observer.setupObserver(container, cache, (candidates) => {
 *   if (candidates.length === 0) return;
 *
 *   // Stage 2: Select best candidate and apply focus
 *   const best = candidates.reduce((a, b) =>
 *     a.intersectionRatio > b.intersectionRatio ? a : b
 *   );
 *
 *   applicator.evaluateAndScheduleAutoFocus(
 *     cache,
 *     stateManager.syncAutoFocus.bind(stateManager),
 *     best.index
 *   );
 * });
 *
 * // Stage 3: State synchronization with debouncing
 * stateManager.setupAutoFocusSync((index) => {
 *   applicator.applyAutoFocus(cache.getElement(index));
 * });
 *
 * stateManager.setupContainerSync((value) => {
 *   container.setAttribute('data-focus-index', value?.toString() || 'none');
 * });
 * ```
 *
 * **Performance Characteristics**:
 * - Observer setup: O(n) where n = visible items (~5-50)
 * - Entry processing: O(1) per entry
 * - Focus application: O(1) amortized (debounced)
 * - Memory: O(n) for observer, O(1) for other services
 * - Typical frequency: 1-2 focus updates/second (debounced)
 *
 * **Key Features**:
 * - Phase 330: Focus management service framework
 * - Phase 334: Focus priority scoring and selection
 * - Phase 340: Performance optimization (debouncing + scroll awareness)
 * - Efficient IntersectionObserver-based visibility detection
 * - Debounced state updates to prevent DOM thrashing
 * - Scroll-aware state synchronization
 * - Comprehensive debug information
 * - Full TypeScript support with type safety
 *
 * **Related Documentation**:
 * - Architecture: docs/ARCHITECTURE.md (Phase 330+)
 * - Design Guidelines: docs/CODING_GUIDELINES.md
 * - Performance Patterns: docs/TDD_REFACTORING_PLAN.md
 *
 * @see {@link FocusObserverManager} for visibility detection API
 * @see {@link FocusApplicatorService} for focus application API
 * @see {@link FocusStateManagerService} for state synchronization API
 * @see Phase 330 for focus system architecture
 * @see Phase 334 for focus priority algorithm
 * @see Phase 340 for performance optimization patterns
 */

/**
 * Focus Observer Manager - IntersectionObserver-based visibility detection
 *
 * Manages visibility detection and focus candidate scoring for gallery items.
 * Part of Stage 1 (Visibility Detection) of the 3-stage focus pipeline.
 */
export { FocusObserverManager, createFocusObserverManager } from './focus-observer-manager';

/**
 * Focus Applicator Service - Auto-focus element application
 *
 * Applies computed focus to DOM elements with proper fallback handling.
 * Part of Stage 2 (Focus Application) of the 3-stage focus pipeline.
 */
export { FocusApplicatorService, createFocusApplicatorService } from './focus-applicator-service';

/**
 * Focus State Manager Service - Debounced state synchronization
 *
 * Synchronizes focus state with debouncing to prevent DOM thrashing.
 * Part of Stage 3 (State Synchronization) of the 3-stage focus pipeline.
 */
export {
  FocusStateManagerService,
  createFocusStateManagerService,
} from './focus-state-manager-service';
