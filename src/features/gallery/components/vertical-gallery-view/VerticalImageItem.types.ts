/**
 * @file VerticalImageItem 타입 정의
 */

import type { GalleryComponentProps } from '@shared/components/hoc';
import type { ImageFitMode } from '@shared/types';
import type { MediaInfo } from '@shared/types/media.types';

export type FitModeProp = ImageFitMode | (() => ImageFitMode | undefined);

export interface VerticalImageItemProps extends GalleryComponentProps {
  readonly media: MediaInfo;
  readonly index: number;
  readonly isActive: boolean;
  readonly isFocused?: boolean;
  readonly isVisible?: boolean;
  readonly forceVisible?: boolean;
  readonly onClick: () => void;
  readonly onDownload?: () => void;
  readonly fitMode?: FitModeProp;
  readonly onMediaLoad?: (mediaId: string, index: number) => void;
  readonly onImageContextMenu?: (event: MouseEvent, media: MediaInfo) => void;
  readonly className?: string;
  readonly registerContainer?: (element: HTMLDivElement | null) => void;
  readonly 'data-testid'?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-describedby'?: string;
  readonly role?: string;
  readonly tabIndex?: number;
  readonly onFocus?: (event: FocusEvent) => void;
  readonly onBlur?: (event: FocusEvent) => void;
  readonly onKeyDown?: (event: KeyboardEvent) => void;
}
