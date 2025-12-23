import type { ComponentChildren, JSXElement } from '@shared/external/vendors';
import { EventManager } from '@shared/services/event-manager';
import { cx } from '@shared/utils/text/formatting';
import { createEffect, onCleanup } from 'solid-js';
import { render } from 'solid-js/web';

// ============================================================================
// Constants
// ============================================================================

/**
 * Symbol for storing dispose callback on container element
 * @description Prevents accidental overwrites and name collisions
 */
const DISPOSE_SYMBOL = Symbol();

type EscapeCaptureWindow = typeof window & {
  __xegCapturedEscapeListener?: (event: KeyboardEvent) => void;
};

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Gallery container component props
 * @description Configuration for GalleryContainer component
 */
interface GalleryContainerProps {
  /** Child components to render inside container */
  children: ComponentChildren;
  /** Callback fired when container should close (Escape key) */
  onClose?: () => void;
  /** Additional CSS class names */
  className?: string;
  /** Optional hook to observe the Escape key listener (testing utilities) */
  registerEscapeListener?: (listener: (event: KeyboardEvent) => void) => void;
}

type HostElement = HTMLElement & {
  [DISPOSE_SYMBOL]?: () => void;
};

type GalleryRenderable = JSXElement | null | undefined | (() => JSXElement | null | undefined);

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
export function mountGallery(container: Element, element: GalleryRenderable): Element {
  const host = container as HostElement;

  host[DISPOSE_SYMBOL]?.();

  const factory =
    typeof element === 'function'
      ? (element as () => JSXElement | null | undefined)
      : () => element ?? null;

  host[DISPOSE_SYMBOL] = render(factory, host);

  return container;
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
  const host = container as HostElement;

  host[DISPOSE_SYMBOL]?.();
  delete host[DISPOSE_SYMBOL];

  container.replaceChildren();
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
  className,
  registerEscapeListener,
}: GalleryContainerProps): JSXElement {
  const classes = cx('xeg-gallery-overlay', 'xeg-gallery-container', className);
  const hasCloseHandler = typeof onClose === 'function';

  const escapeListener = (event: Event) => {
    if (!hasCloseHandler) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Escape') {
      keyboardEvent.preventDefault();
      keyboardEvent.stopPropagation();
      onClose?.();
    }
  };

  if (__DEV__ && hasCloseHandler && registerEscapeListener && typeof window !== 'undefined') {
    const captureWindow = window as EscapeCaptureWindow;
    const storageKey = '__xegCapturedEscapeListener' as const;
    captureWindow[storageKey] = escapeListener as (event: KeyboardEvent) => void;
    registerEscapeListener(escapeListener as (event: KeyboardEvent) => void);
  }

  // Setup keyboard event handling
  createEffect(() => {
    if (!hasCloseHandler) {
      return;
    }

    // Register Escape key handler
    const eventManager = EventManager.getInstance();

    const listenerId = eventManager.addListener(document, 'keydown', escapeListener);

    // Cleanup listener on component unmount
    onCleanup(() => {
      if (listenerId) {
        eventManager.removeListener(listenerId);
      }
    });
  });

  return (
    <div class={classes} data-xeg-gallery-container="">
      {children}
    </div>
  );
}
