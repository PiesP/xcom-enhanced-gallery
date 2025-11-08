/**
 * @fileoverview Gallery HOC System - Higher-order component for gallery components
 * @version 3.0.0 - GalleryMarker feature integration
 * @description Phase 2-3B: Integration complete - Unified HOC system for all gallery components
 * @module @shared/components/hoc
 *
 * This HOC provides:
 * - Unified marking system (data-xeg-gallery attributes)
 * - Type-optimized default values
 * - Event handling with event delegation
 * - Twitter native gallery blocking
 * - Accessibility support (ARIA attributes, roles)
 *
 * @example
 * ```typescript
 * import { withGallery } from '@shared/components/hoc';
 *
 * const GalleryButton = withGallery(Button, {
 *   type: 'control',
 *   className: 'download-btn'
 * });
 * ```
 */

import { logger } from '@shared/logging';
import type {
  ComponentType,
  GalleryComponentProps as BaseGalleryComponentProps,
} from '../../types/app.types'; // Phase 282 Step 3: Direct path import
import { getSolid } from '../../external/vendors';
import {
  createClassName as createComponentClassName,
  createAriaProps,
} from '../../utils/component-utils'; // Phase 284: Direct function import (prevents local createClassName conflict)

const solid = getSolid();
const { mergeProps } = solid;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Gallery marking types
 * @description Categorizes gallery component roles within the system
 */
export type GalleryType = 'container' | 'item' | 'control' | 'overlay' | 'viewer';

/**
 * Gallery HOC configuration options
 * @description Options for customizing gallery component behavior and presentation
 */
export interface GalleryOptions {
  /** Gallery component type - determines default behavior and accessibility */
  readonly type: GalleryType;
  /** Additional CSS class names */
  readonly className?: string;
  /** Event handling configuration */
  readonly events?: {
    /** Prevent click event propagation */
    preventClick?: boolean;
    /** Prevent keyboard event propagation */
    preventKeyboard?: boolean;
    /** Block Twitter native gallery interactions */
    blockTwitterNative?: boolean;
  };
  /** Custom data attributes */
  readonly customData?: Record<string, string>;
  /** Accessibility attributes configuration */
  readonly accessibility?: {
    role?: string;
    ariaLabel?: string;
    tabIndex?: number;
  };
}

/**
 * Gallery component props interface
 * @description Extends base component props with mouse event handlers
 */
export interface GalleryComponentProps extends BaseGalleryComponentProps {
  /** Mouse enter event handler */
  onMouseEnter?: (event: MouseEvent) => void;
  /** Mouse leave event handler */
  onMouseLeave?: (event: MouseEvent) => void;
}

// ============================================================================
// Type-specific Default Options
// ============================================================================

/**
 * Default options per gallery type
 * @description Provides optimal defaults for each gallery component role
 */
const TYPE_DEFAULTS: Record<GalleryType, Partial<GalleryOptions>> = {
  container: {
    events: { preventClick: false, preventKeyboard: false, blockTwitterNative: true },
    accessibility: { role: 'dialog', tabIndex: 0 },
  },
  item: {
    events: { preventClick: true, preventKeyboard: false, blockTwitterNative: true },
    accessibility: { role: 'button', tabIndex: 0 },
  },
  control: {
    events: { preventClick: false, preventKeyboard: false, blockTwitterNative: false },
    accessibility: { role: 'button', tabIndex: 0 },
  },
  overlay: {
    events: { preventClick: false, preventKeyboard: true, blockTwitterNative: true },
    accessibility: { role: 'dialog', tabIndex: -1 },
  },
  viewer: {
    events: { preventClick: false, preventKeyboard: false, blockTwitterNative: true },
    accessibility: { role: 'img', tabIndex: 0 },
  },
};

// ============================================================================
// Main HOC Implementation
// ============================================================================

/**
 * Gallery Higher-Order Component
 *
 * @description
 * Wraps components with gallery-specific behaviors:
 * - Consistent marking system via data-xeg-* attributes
 * - Type-based default values optimization
 * - Enhanced event handling with propagation control
 * - Twitter native gallery blocking capabilities
 * - Full accessibility support
 *
 * @template P - Component props type extending GalleryComponentProps
 * @param Component - Component to wrap
 * @param options - Configuration options
 * @returns Wrapped component with gallery functionality
 *
 * @example
 * ```tsx
 * const GalleryButton = withGallery(Button, {
 *   type: 'control',
 *   className: 'download-btn'
 * });
 * ```
 */
export function withGallery<P extends GalleryComponentProps>(
  Component: ComponentType<P>,
  options: GalleryOptions
): ComponentType<P> {
  // Merge user options with type-specific defaults
  const mergedOptions = mergeOptionsWithDefaults(options);

  const GalleryComponent: ComponentType<P> = (props: P) => {
    // Generate marker attributes
    const markerAttributes = createMarkerAttributes(mergedOptions);

    // Merge class names
    const className = createClassName(props.className, mergedOptions);

    // Create event handlers
    const eventHandlers = createEventHandlers(props, mergedOptions);

    // Generate accessibility attributes
    const accessibilityAttributes = createAccessibilityAttributes(mergedOptions);

    // Compose final props
    const finalProps = mergeProps(props, markerAttributes, eventHandlers, accessibilityAttributes, {
      className,
    });

    logger.debug(`Rendering gallery component: ${mergedOptions.type}`, {
      type: mergedOptions.type,
      className,
      events: mergedOptions.events,
    });

    return Component(finalProps as P);
  };

  // Set component display name
  const componentName = getComponentName(Component);
  (GalleryComponent as { displayName?: string }).displayName = `withGallery(${componentName})`;

  return GalleryComponent;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Merge options with type-specific defaults
 * @description Combines user options with type-based default values
 * @param options - User-provided options
 * @returns Fully populated options object with all required fields
 */
function mergeOptionsWithDefaults(options: GalleryOptions): Required<GalleryOptions> {
  const typeDefaults = TYPE_DEFAULTS[options.type] || {};

  return {
    type: options.type,
    className: options.className || '',
    events: {
      preventClick: false,
      preventKeyboard: false,
      blockTwitterNative: true,
      ...typeDefaults.events,
      ...options.events,
    },
    customData: {
      ...options.customData,
    },
    accessibility: {
      role: 'button',
      ...typeDefaults.accessibility,
      ...options.accessibility,
    },
  };
}

/**
 * Create marker attributes for element identification
 * @description Generates data-xeg-* attributes for gallery element marking
 * @param options - Merged options with all required fields
 * @returns Object of marker attributes
 */
function createMarkerAttributes(options: Required<GalleryOptions>): Record<string, string> {
  const attributes: Record<string, string> = {
    'data-xeg-gallery': 'true',
    'data-xeg-gallery-type': options.type,
    'data-xeg-gallery-version': '2.0',
  };

  // Event prevention flags
  if (options.events.preventClick) {
    attributes['data-xeg-prevent-click'] = 'true';
  }

  if (options.events.preventKeyboard) {
    attributes['data-xeg-prevent-keyboard'] = 'true';
  }

  if (options.events.blockTwitterNative) {
    attributes['data-xeg-block-twitter'] = 'true';
  }

  // Custom data attributes
  Object.entries(options.customData).forEach(([key, value]) => {
    attributes[`data-xeg-${key}`] = value;
  });

  return attributes;
}

/**
 * Generate CSS class names
 * @description Combines component type with user-provided and existing class names
 * @param existingClassName - Existing className from component props
 * @param options - Merged options with all required fields
 * @returns Combined class name string
 */
function createClassName(existingClassName?: string, options?: Required<GalleryOptions>): string {
  const classNames = [
    'xeg-gallery',
    `xeg-gallery-${options?.type}`,
    options?.className,
    existingClassName,
  ].filter(Boolean);

  return classNames.join(' ');
}

/**
 * Create event handlers for gallery components
 * @description Generates click and keyboard event handlers with propagation control
 * @param props - Component props
 * @param options - Merged options with all required fields
 * @returns Object of event handler functions
 */
function createEventHandlers<P extends GalleryComponentProps>(
  props: P,
  options: Required<GalleryOptions>
): Partial<GalleryComponentProps> {
  const handlers: Partial<GalleryComponentProps> = {};

  // Click event handler (always defined to prevent conditional assignment issues)
  handlers.onClick = (event: MouseEvent | undefined): void => {
    // Safety guard: Validate event parameter (Solid.js event delegation compatibility)
    if (!event || typeof event.stopImmediatePropagation !== 'function') {
      if (!event) {
        logger.warn('Gallery click handler received undefined event', {
          type: options.type,
        });
      }
      return;
    }

    logger.debug(`Gallery click handler: ${options.type}`, {
      preventDefault: options.events.preventClick,
      blockTwitter: options.events.blockTwitterNative,
    });

    // Call existing handler
    if (props.onClick) {
      props.onClick(event);
    }

    // Block Twitter native gallery
    if (options.events.blockTwitterNative) {
      event.stopImmediatePropagation();
    }

    // Prevent click event propagation
    if (options.events.preventClick) {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  // Keyboard event handler
  handlers.onKeyDown = (event: KeyboardEvent | undefined): void => {
    // Safety guard: Validate event parameter
    if (!event || typeof event.stopPropagation !== 'function') {
      if (!event) {
        logger.warn('Gallery keyboard handler received undefined event', {
          type: options.type,
        });
      }
      return;
    }

    // Only process if keyboard prevention is enabled
    if (!options.events.preventKeyboard) {
      return;
    }

    logger.debug(`Gallery keyboard handler: ${options.type}`);

    // Call existing handler
    if (props.onKeyDown) {
      props.onKeyDown(event);
    }

    // Block specific keys
    if (['Space', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  return handlers;
}

/**
 * Create accessibility attributes
 * @description Generates ARIA and role attributes for accessibility
 * @param options - Merged options with all required fields
 * @returns Object of accessibility attributes
 */
function createAccessibilityAttributes(
  options: Required<GalleryOptions>
): Record<string, string | number> {
  const attributes: Record<string, string | number> = {};

  if (options.accessibility.role) {
    attributes.role = options.accessibility.role;
  }

  if (options.accessibility.ariaLabel) {
    attributes['aria-label'] = options.accessibility.ariaLabel;
  }

  if (typeof options.accessibility.tabIndex === 'number') {
    attributes.tabIndex = options.accessibility.tabIndex;
  }

  return attributes;
}

/**
 * Extract component name for display purposes
 * @description Gets displayName or name property from component
 * @param Component - React/Solid component
 * @returns Component name string (defaults to 'Component')
 */
function getComponentName<T>(Component: ComponentType<T>): string {
  return (
    (Component as { displayName?: string; name?: string }).displayName ??
    (Component as { displayName?: string; name?: string }).name ??
    'Component'
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if an element is a gallery element
 * @description Validates element has proper gallery marking attributes
 * @param element - DOM element to check
 * @returns true if element is a gallery element
 */
export function isGalleryElement(element: Element): boolean {
  return (
    element.hasAttribute('data-xeg-gallery') &&
    element.getAttribute('data-xeg-gallery-version') === '2.0'
  );
}

/**
 * Get gallery type from element
 * @description Extracts gallery type from element attributes
 * @param element - DOM element to query
 * @returns Gallery type or null if not a gallery element
 */
export function getGalleryType(element: Element): GalleryType | null {
  const type = element.getAttribute('data-xeg-gallery-type');
  return type as GalleryType | null;
}

/**
 * Check if event originated from gallery element
 * @description Determines if event bubbled from a gallery component
 * @param event - Event to check
 * @returns true if event came from gallery element
 */
export function isEventFromGallery(event: Event): boolean {
  const target = event.target as Element | null;
  if (!target) return false;

  const galleryElement = target.closest('[data-xeg-gallery-version="2.0"]');
  return galleryElement !== null;
}

// ============================================================================
// Validation and Integration Utilities
// ============================================================================

/**
 * Validation result object
 * @description Contains validation status, errors, and warnings
 */
export interface HOCValidationResult {
  /** Validation passed */
  isValid: boolean;
  /** List of critical errors */
  errors: string[];
  /** List of non-critical warnings */
  warnings: string[];
}

/**
 * Validate HOC integration for an element
 * @description Phase 3: Comprehensive validation of gallery element structure
 * @param element - DOM element to validate
 * @returns Validation result with errors and warnings
 */
export function validateHOCIntegration(element: Element): HOCValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required gallery marking
  if (!element.hasAttribute('data-xeg-gallery')) {
    errors.push('Missing required data-xeg-gallery attribute');
  }

  // Validate version
  const version = element.getAttribute('data-xeg-gallery-version');
  if (version !== '2.0') {
    if (!version) {
      errors.push('Missing data-xeg-gallery-version attribute');
    } else {
      warnings.push(`Outdated gallery version: ${version}. Expected: 2.0`);
    }
  }

  // Validate type
  const type = element.getAttribute('data-xeg-gallery-type');
  if (!type) {
    errors.push('Missing data-xeg-gallery-type attribute');
  } else if (!['container', 'item', 'control', 'overlay', 'viewer'].includes(type)) {
    errors.push(`Invalid gallery type: ${type}`);
  }

  // Validate accessibility
  const role = element.getAttribute('role');
  if (!role) {
    warnings.push('Missing role attribute for accessibility');
  }

  // Detect legacy markers
  if (element.hasAttribute('data-gallery-marker')) {
    warnings.push('Legacy gallery marker detected. Consider migrating to GalleryHOC');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Create standard props combining HOC and component utilities
 * @description Phase 3: Integrate HOC with StandardProps for unified component development
 * @param baseProps - Base component props
 * @param hocOptions - Gallery HOC configuration
 * @returns Combined props with all gallery and standard attributes
 */
export function createHOCStandardProps<T extends GalleryComponentProps>(
  baseProps: T,
  hocOptions: GalleryOptions
): T & {
  'data-xeg-gallery': string;
  'data-xeg-gallery-type': string;
  'data-xeg-gallery-version': string;
  className: string;
} {
  // Generate marker attributes
  const markerAttributes = createMarkerAttributes(mergeOptionsWithDefaults(hocOptions));

  // Generate standardized class name
  const standardClassName = createComponentClassName(
    baseProps.className,
    hocOptions.className,
    `xeg-gallery-${hocOptions.type}`
  );

  // Generate ARIA properties
  const ariaProps = createAriaProps(baseProps);

  return {
    ...baseProps,
    ...markerAttributes,
    ...ariaProps,
    className: standardClassName,
  } as T & {
    'data-xeg-gallery': string;
    'data-xeg-gallery-type': string;
    'data-xeg-gallery-version': string;
    className: string;
  };
}
