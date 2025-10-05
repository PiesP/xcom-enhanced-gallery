/**
 * @fileoverview MediaItemFactory - 미디어 타입 기반 컴포넌트 선택 Factory
 * Epic: MEDIA-TYPE-ENHANCEMENT Phase 1-4
 *
 * MediaInfo.type에 따라 적절한 렌더링 컴포넌트 타입을 반환합니다:
 * - video → VerticalVideoItem
 * - gif → VerticalGifItem
 * - image → VerticalImageItem
 * - 기타 → VerticalImageItem (fallback)
 */

import type { Component, JSX } from 'solid-js';
import type { MediaInfo } from '@shared/types/media.types';
import type { ImageFitMode } from '@shared/types';
import { SolidVerticalImageItem } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem.solid';
import { VerticalVideoItem } from '@features/gallery/components/vertical-gallery-view/VerticalVideoItem.solid';
import { VerticalGifItem } from '@features/gallery/components/vertical-gallery-view/VerticalGifItem.solid';

/**
 * 미디어 아이템 컴포넌트의 공통 Props 인터페이스
 *
 * VerticalImageItem과 VerticalVideoItem 모두 이 인터페이스를 구현합니다.
 */
export interface MediaItemComponentProps {
  readonly media: MediaInfo;
  readonly index: number;
  readonly isActive: boolean;
  readonly isFocused?: boolean;
  readonly isVisible?: boolean;
  readonly forceVisible?: boolean;
  readonly fitMode?: ImageFitMode;
  readonly onClick?: () => void;
}

/**
 * 미디어 타입에 따라 적절한 컴포넌트 타입을 반환합니다.
 *
 * **사용 패턴**:
 * SolidGalleryShell에서 <Dynamic component={...} />와 함께 사용합니다.
 *
 * @param media - 미디어 정보 (type 필드로 컴포넌트 결정)
 * @returns 선택된 컴포넌트 타입 (Component<MediaItemComponentProps>)
 *
 * @example
 * ```tsx
 * const ComponentType = getMediaItemComponent(media);
 * return (
 *   <Dynamic
 *     component={ComponentType}
 *     media={media}
 *     index={index}
 *     isActive={isActive}
 *     // ... other props
 *   />
 * );
 * ```
 *
 * **타입별 라우팅**:
 * - `video` → VerticalVideoItem (재생 컨트롤, 진행바)
 * - `gif` → VerticalGifItem (재생/일시정지, 반복 제어)
 * - `image` → SolidVerticalImageItem (확대/축소)
 * - 기타 → SolidVerticalImageItem (안전한 fallback)
 *
 * @see {@link VerticalVideoItem} - 비디오 전용 컴포넌트
 * @see {@link VerticalGifItem} - GIF 전용 컴포넌트
 * @see {@link SolidVerticalImageItem} - 이미지 전용 컴포넌트
 * @see {@link MediaItemComponentProps} - Props 인터페이스
 */
export function getMediaItemComponent(media: MediaInfo): Component<MediaItemComponentProps> {
  switch (media.type) {
    case 'video':
      return VerticalVideoItem;
    case 'gif':
      return VerticalGifItem;
    case 'image':
    default:
      return SolidVerticalImageItem;
  }
}

/**
 * 미디어 아이템을 렌더링할 컴포넌트 인스턴스를 생성합니다 (편의 함수).
 *
 * @param media - 미디어 정보
 * @param props - 컴포넌트 Props (media 제외)
 * @returns JSX.Element
 *
 * @example
 * ```tsx
 * const item = createMediaItem(media, {
 *   index: 0,
 *   isActive: true,
 *   fitMode: 'contain',
 * });
 * ```
 */
export function createMediaItem(
  media: MediaInfo,
  props: Omit<MediaItemComponentProps, 'media'>
): JSX.Element {
  const ComponentType = getMediaItemComponent(media);
  return ComponentType({ media, ...props }) as JSX.Element;
}
