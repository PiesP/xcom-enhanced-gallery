/**
 * Copyright (c) 2024 X.com Enhanced Gallery Team
 * Licensed under the MIT License
 *
 * @fileoverview Item Scroll Services Module - Gallery item scroll management layer
 * @version 1.0.0
 *
 * Centralized scroll management for gallery items with state synchronization
 * and behavior configuration.
 *
 * **Module Overview**:
 * Item scroll services provide comprehensive scroll management for gallery navigation,
 * including positioning calculations, state tracking, and behavior configuration.
 *
 * **Core Components**:
 * - **ItemPositioningService**: Calculates and executes scroll operations to gallery items
 *   - Finds target elements by index
 *   - Applies scrollIntoView with custom options
 *   - Handles offset adjustments
 *   - Implements retry logic with exponential backoff
 *   - Supports smooth scroll animations
 *
 * - **ItemScrollStateManager**: Manages scroll state signals and polling
 *   - Maintains current item index and total items state
 *   - Polls index changes at configurable intervals
 *   - Coordinates scroll timeouts
 *   - Tracks user-initiated scrolls
 *   - Provides resource cleanup
 *
 * - **ScrollBehaviorConfigurator**: Configures scroll behavior options
 *   - Normalizes scroll behavior (smooth/auto)
 *   - Manages block position (start/center/end)
 *   - Handles offset calculations
 *   - Respects prefers-reduced-motion accessibility setting
 *   - Provides media query caching for performance
 *
 * **Integration Architecture**:
 * - Uses Solid.js signals for reactive state management
 * - Leverages globalTimerManager for consistent timing
 * - Integrates with logger for debugging
 * - Follows PC-only event guidelines (Phase 242-243)
 *
 * **Performance Characteristics**:
 * - Scroll positioning: O(n) where n = items before target (DOM search)
 * - State updates: O(1) signals
 * - Media query cache: O(1) lookups
 * - Polling interval: Configurable, default 32ms
 *
 * **Accessibility Features**:
 * - Respects prefers-reduced-motion for motion-sensitive users
 * - Supports both smooth and auto scroll behaviors
 * - Configurable scroll offset for custom positioning
 * - Center alignment option for better visibility
 *
 * **Usage Patterns**:
 * ```typescript
 * // 1. Configure scroll behavior
 * const configurator = new ScrollBehaviorConfigurator({
 *   behavior: 'smooth',
 *   block: 'center',
 *   offset: 50,
 *   respectReducedMotion: true,
 * });
 *
 * // 2. Setup positioning service
 * const positioning = new ItemPositioningService();
 *
 * // 3. Create state manager
 * const stateManager = new ItemScrollStateManager();
 *
 * // 4. Execute scroll
 * await positioning.scrollToItem(
 *   container,
 *   targetIndex,
 *   totalItems,
 *   configurator.getResolvedBehavior()
 * );
 * ```
 *
 * **Related Services**:
 * - GalleryApp: High-level gallery orchestration
 * - EventManager: Event delegation and coordination
 * - TimerManagement: Consistent timing across services
 *
 * **See Also**:
 * - {@link ItemPositioningService} for scroll positioning
 * - {@link ItemScrollStateManager} for state management
 * - {@link ScrollBehaviorConfigurator} for behavior configuration
 * - Phase 242-243 for PC-only guidelines
 * - Phase 309 for Service Layer pattern
 *
 * @since v0.4.2
 */

export { ItemPositioningService, createItemPositioningService } from './item-positioning-service';
export type { ScrollOptions } from './item-positioning-service';

export { ItemScrollStateManager, createItemScrollStateManager } from './item-scroll-state-manager';

export {
  ScrollBehaviorConfigurator,
  createScrollBehaviorConfigurator,
} from './scroll-behavior-configurator';
export type { ScrollBehaviorConfig, ResolvedScrollBehavior } from './scroll-behavior-configurator';
