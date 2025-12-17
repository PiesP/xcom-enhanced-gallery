/**
 * Copyright (c) 2024 X.com Enhanced Gallery
 * Licensed under the MIT License
 *
 * @fileoverview VerticalImageItem Component Types
 * @description Type definitions for vertical gallery image item component
 * @module features/gallery/components/vertical-gallery-view/VerticalImageItem.types
 *
 * **Types**:
 * - {@link FitModeProp} - Image fit mode type (direct or function)
 * - {@link VerticalImageItemProps} - Component props interface
 *
 * @version 1.1.0 - Enhanced documentation and type clarity (Phase 354+)
 */

import type { BaseComponentProps, ImageFitMode } from '@shared/types';
import type { MediaInfo } from '@shared/types/media.types';

/**
 * Fit mode prop that can be either a direct value or a function that returns it
 * @type {(ImageFitMode | (() => ImageFitMode | undefined))}
 *
 * **Usage**:
 * - Direct: `fitMode="original"`
 * - Function: `fitMode={() => settings.fitMode()}`
 */
export type FitModeProp = ImageFitMode | (() => ImageFitMode | undefined);

/**
 * Props for VerticalImageItem component
 * @interface VerticalImageItemProps
 *
 * **Extends**: {@link BaseComponentProps}
 *
 * **Media Data**:
 * - {@link VerticalImageItemProps.media} - MediaInfo object
 * - {@link VerticalImageItemProps.index} - Position in gallery
 *
 * **State**:
 * - {@link VerticalImageItemProps.isActive} - Current visible item
 * - {@link VerticalImageItemProps.isFocused} - Keyboard focus state
 * - {@link VerticalImageItemProps.forceVisible} - Override visibility (preload)
 *
 * **Callbacks**:
 * - {@link VerticalImageItemProps.onClick} - Item click handler
 * - {@link VerticalImageItemProps.onMediaLoad} - Media load completion
 * - {@link VerticalImageItemProps.onImageContextMenu} - Right-click handler
 *
 * **Layout**:
 * - {@link VerticalImageItemProps.fitMode} - Image fit mode (original, fitWidth, fitHeight, fitContainer)
 * - {@link VerticalImageItemProps.className} - Additional CSS classes
 * - {@link VerticalImageItemProps.registerContainer} - DOM ref callback
 *
 * **Accessibility**:
 * - {@link VerticalImageItemProps.role} - ARIA role attribute
 * - {@link VerticalImageItemProps.tabIndex} - Keyboard navigation index
 * - {@link VerticalImageItemProps.aria-label} - Screen reader label
 * - {@link VerticalImageItemProps.aria-describedby} - Description element ID
 * - {@link VerticalImageItemProps.onFocus} - Focus event handler
 * - {@link VerticalImageItemProps.onBlur} - Blur event handler
 * - {@link VerticalImageItemProps.onKeyDown} - Keyboard event handler
 *
 * **Testing**:
 * - {@link VerticalImageItemProps.data-testid} - Test identifier
 */
export interface VerticalImageItemProps extends Omit<BaseComponentProps, 'onClick'> {
  /**
   * Media item data to render
   */
  readonly media: MediaInfo;

  /**
   * Zero-based position in gallery array
   */
  readonly index: number;

  /**
   * True if this is the currently visible/active item
   */
  readonly isActive: boolean;

  /**
   * True if item has keyboard focus
   * @optional
   */
  readonly isFocused?: boolean;

  /**
   * Force visibility regardless of viewport position (for preloading)
   * @optional
   */
  readonly forceVisible?: boolean;

  /**
   * Callback invoked when item is clicked
   */
  readonly onClick: () => void;

  /**
   * Image fit mode: how to scale image to container
   * @optional
   * @default undefined (use component default)
   */
  readonly fitMode?: FitModeProp;

  /**
   * Callback invoked when media finishes loading
   * @param mediaId - Unique media identifier
   * @param index - Item position in gallery
   * @optional
   */
  readonly onMediaLoad?: (mediaId: string, index: number) => void;

  /**
   * Callback invoked on right-click (context menu)
   * @param event - Mouse event
   * @param media - Media info object
   * @optional
   */
  readonly onImageContextMenu?: (event: MouseEvent, media: MediaInfo) => void;

  /**
   * Additional CSS class names to apply
   * @optional
   */
  readonly className?: string;

  /**
   * Callback to register container DOM reference
   * @param element - Container div element or null on unmount
   * @optional
   */
  readonly registerContainer?: (element: HTMLElement | null) => void;

  /**
   * Test identifier for automated testing
   * @optional
   */
  readonly 'data-testid'?: string;

  /**
   * Accessible name for screen readers
   * @optional
   */
  readonly 'aria-label'?: string;

  /**
   * ID of description element for accessibility
   * @optional
   */
  readonly 'aria-describedby'?: string;

  /**
   * ARIA role attribute
   * @optional
   */
  readonly role?: string;

  /**
   * Tab index for keyboard navigation (-1, 0, or positive)
   * @optional
   */
  readonly tabIndex?: number;

  /**
   * Callback when item receives focus
   * @optional
   */
  readonly onFocus?: (event: FocusEvent) => void;

  /**
   * Callback when item loses focus
   * @optional
   */
  readonly onBlur?: (event: FocusEvent) => void;

  /**
   * Callback for keyboard events
   * @optional
   */
  readonly onKeyDown?: (event: KeyboardEvent) => void;
}
