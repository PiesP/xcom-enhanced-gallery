import type { ComponentChildren } from '@shared/external/vendors';

/**
 * Gallery container component props
 * @description Configuration for GalleryContainer component
 */
export interface GalleryContainerProps {
  /** Child components to render inside container */
  readonly children: ComponentChildren;
  /** Callback fired when container should close (Escape key) */
  readonly onClose?: () => void;
  /** Additional CSS class names */
  readonly className?: string;
  /** Optional hook to observe the Escape key listener (testing utilities) */
  readonly registerEscapeListener?: (listener: (event: KeyboardEvent) => void) => void;
}
