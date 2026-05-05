import type { ComponentChildren } from '@shared/external/vendors';

export interface GalleryContainerProps {
  readonly children: ComponentChildren;
  readonly onClose?: () => void;
  readonly className?: string;
}
