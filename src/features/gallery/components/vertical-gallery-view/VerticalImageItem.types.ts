/** Type definitions for vertical gallery image item component. */

import type { BaseComponentProps } from '@shared/types/component.types';
import type { MediaInfo } from '@shared/types/media.types';
import type { ImageFitMode } from '@shared/types/ui.types';

/** Fit mode prop: ImageFitMode value or function returning it. */
export type FitModeProp = ImageFitMode | (() => ImageFitMode | undefined);

/** Props for VerticalImageItem component. */
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
  readonly registerContainer?: (element: HTMLDivElement | null) => void;

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
