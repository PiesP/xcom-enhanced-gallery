/**
 * @fileoverview 갤러리 컨테이너 (하위 호환성 re-export)
 * @deprecated Use GalleryContainer from './GalleryContainer' instead
 */

// 하위 호환성을 위한 re-export
export {
  GalleryContainer as UnifiedGalleryContainer,
  compareGalleryContainerProps as compareUnifiedGalleryContainerProps,
  default as default,
} from './GalleryContainer';
export type { GalleryContainerProps as UnifiedGalleryContainerProps } from './GalleryContainer';

// 추가 기능들을 위한 임시 구현 (하위 호환성)
import { getPreact } from '@shared/external/vendors';
import type { ComponentChildren } from '@shared/external/vendors';
import { GalleryContainer } from './GalleryContainer';

/**
 * 통합된 갤러리를 DOM에 마운트하는 헬퍼 함수
 * @param container 마운트할 DOM 컨테이너
 * @param children 렌더링할 자식 컴포넌트
 * @param onClose 갤러리 닫기 콜백
 */
export function mountUnifiedGallery(
  container: HTMLElement,
  children: ComponentChildren,
  onClose: () => void
): void {
  const { render, h } = getPreact();

  const galleryElement = h(GalleryContainer, {
    children,
    onClose,
    'data-testid': 'unified-gallery-mount',
  });

  render(galleryElement, container);
}

/**
 * 통합된 갤러리를 DOM에서 언마운트하는 헬퍼 함수
 * @param container 언마운트할 DOM 컨테이너
 */
export function unmountUnifiedGallery(container: HTMLElement): void {
  const { render } = getPreact();
  render(null, container);
}
