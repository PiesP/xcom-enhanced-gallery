/**
 * @fileoverview Gallery Container - Light DOM based gallery rendering
 * @version 4.0.0 - Phase 384: Style isolation via Cascade Layers
 * @description Light DOM based gallery container with style isolation using CSS Cascade Layers
 * @module @shared/components/isolation
 *
 * This module provides:
 * - Light DOM mounting/unmounting with Solid.js integration
 * - Style isolation through Cascade Layers (not Shadow DOM)
 * - Twitter scroll restoration compatibility (Phase 294, 300.1)
 * - Event management via EventManager service
 * - Keyboard event handling (Escape key to close)
 *
 * @example
 * ```typescript
 * import { GalleryContainer, mountGallery, unmountGallery } from '@shared/components/isolation';
 *
 * // Mount gallery
 * const element = () => <GalleryContainer onClose={handleClose}>Content</GalleryContainer>;
 * mountGallery(container, element);
 *
 * // Unmount gallery
 * unmountGallery(container);
 * ```
 */

import { getSolid, type ComponentChildren, type JSXElement } from '../../external/vendors';
import { logger } from '../../logging';
import { EventManager } from '../../services/event-manager';

// ============================================================================
// Constants
// ============================================================================

/**
 * Symbol for storing dispose callback on container element
 * @description Prevents accidental overwrites and name collisions
 */
const DISPOSE_SYMBOL = Symbol('xeg-gallery-container-dispose');

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Gallery container component props
 * @description Configuration for GalleryContainer component
 */
export interface GalleryContainerProps {
  /** Child components to render inside container */
  children: ComponentChildren;
  /** Callback fired when container should close (Escape key) */
  onClose?: () => void;
  /** Additional CSS class names */
  className?: string;
}

// ============================================================================
// Gallery Mounting and Unmounting
// ============================================================================

/**
 * Mount gallery to Light DOM container
 * @description Creates and renders gallery component in Light DOM (not Shadow DOM)
 * Uses Cascade Layers for style isolation instead of Shadow DOM encapsulation
 *
 * @param container - DOM element to mount gallery into
 * @param element - Solid.js JSXElement factory or element to render
 * @returns The container element
 * @throws Error if mounting fails
 *
 * @note Phase 294: Light DOM approach preferred over Shadow DOM for Twitter compatibility
 * @note Phase 300.1: Cascade Layers provide style isolation without Shadow DOM overhead
 *
 * @example
 * ```typescript
 * const element = () => <div>Gallery content</div>;
 * mountGallery(container, element);
 * ```
 */
export function mountGallery(container: Element, element: unknown): Element {
  const solid = getSolid();

  try {
    const host = container as HTMLElement & {
      [DISPOSE_SYMBOL]?: () => void;
    };

    // Clean up existing gallery if present
    host[DISPOSE_SYMBOL]?.();

    // Create factory function from element
    const factory: () => JSXElement =
      typeof element === 'function' ? (element as () => JSXElement) : () => element as JSXElement;

    // Mount Solid.js component and store dispose function
    host[DISPOSE_SYMBOL] = solid.render(factory, host);
    logger.debug('Gallery mounted with Light DOM (Cascade Layers for style isolation)');
    return container;
  } catch (error) {
    logger.error('Failed to mount gallery:', error);
    throw error;
  }
}

/**
 * Unmount gallery from Light DOM container
 * @description Safely removes gallery component and cleans up DOM
 *
 * @param container - DOM element containing the gallery
 * @throws Error if unmounting fails
 *
 * @note Phase 294: Twitter navigation compatibility - complete DOM cleanup
 * @note Phase 300.1: Reflow optimization - conditional execution for performance
 *
 * Cleanup steps:
 * 1. Call Solid.js dispose function
 * 2. Remove all child DOM nodes
 *
 * @example
 * ```typescript
 * unmountGallery(container);
 * ```
 */
export function unmountGallery(container: Element): void {
  try {
    const host = container as HTMLElement & {
      [DISPOSE_SYMBOL]?: () => void;
    };

    // Step 1: Call Solid.js dispose function
    host[DISPOSE_SYMBOL]?.();
    delete host[DISPOSE_SYMBOL];

    // Step 2: Phase 294 - Complete DOM cleanup for Twitter scroll restoration compatibility
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    logger.debug('Gallery unmounted successfully (Phase 300.1: DOM cleaned)');
  } catch (error) {
    logger.error('Failed to unmount gallery:', error);
    throw error;
  }
}

// ============================================================================
// Gallery Container Component
// ============================================================================

/**
 * Gallery Container Component - Light DOM based rendering
 * @description Renders gallery overlay with keyboard event handling
 *
 * Features:
 * - Light DOM based (not Shadow DOM) for Twitter compatibility
 * - Style isolation via CSS Cascade Layers
 * - Escape key handling to close gallery
 * - EventManager integration for event lifecycle management
 *
 * @param props - Component props
 * @returns Solid.js JSXElement
 *
 * @note Cascade Layers ensure styles don't leak while avoiding Shadow DOM complexity
 * @note EventManager ensures proper cleanup on component unmount
 *
 * @example
 * ```tsx
 * <GalleryContainer onClose={handleClose} className="custom-class">
 *   <img src="..." alt="..." />
 * </GalleryContainer>
 * ```
 */
export function GalleryContainer({
  children,
  onClose,
  className = '',
}: GalleryContainerProps): JSXElement {
  const { createEffect, onCleanup } = getSolid();

  // Setup keyboard event handling
  createEffect(() => {
    if (!onClose) {
      return;
    }

    // Register Escape key handler
    const listenerId = EventManager.getInstance().addListener(document, 'keydown', event => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === 'Escape') {
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        onClose();
      }
    });

    // Cleanup listener on component unmount
    onCleanup(() => {
      EventManager.getInstance().removeListener(listenerId);
    });
  });

  return (
    <div
      class={`xeg-gallery-overlay xeg-gallery-container gallery-container ${className}`.trim()}
      data-xeg-gallery-container=''
    >
      {children}
    </div>
  );
}

export default GalleryContainer;
