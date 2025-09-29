/**
 * @fileoverview Shared type definitions for VerticalImageItem components.
 */

import type { ImageFitMode } from '@shared/types';
import type { MediaInfo } from '@shared/types/media.types';

export interface VerticalImageItemProps {
  readonly media: MediaInfo;
  readonly index: number;
  readonly isActive: boolean;
  readonly isFocused?: boolean;
  readonly forceVisible?: boolean;
  readonly fitMode?: ImageFitMode;
  readonly className?: string;
  readonly onClick?: () => void;
  readonly onDownload?: () => void;
  readonly onMediaLoad?: (mediaId: string, index: number) => void;
  readonly onFocus?: (event: FocusEvent) => void;
  readonly onBlur?: (event: FocusEvent) => void;
  readonly onKeyDown?: (event: KeyboardEvent) => void;
  readonly onImageContextMenu?: (event: MouseEvent, media: MediaInfo) => void;
  readonly 'data-testid'?: string;
  readonly 'data-xeg-role'?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-describedby'?: string;
  readonly role?: string;
  readonly tabIndex?: number;
}
