import type { ComponentChildren } from '@shared/types/component.types';

export interface GalleryContainerProps {
  readonly children: ComponentChildren;
  readonly onClose?: () => void;
  readonly className?: string;
}
