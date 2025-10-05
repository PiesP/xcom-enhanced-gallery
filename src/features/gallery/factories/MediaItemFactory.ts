/**
 * @fileoverview MediaItemFactory - 미디어 타입 기반 컴포넌트 선택 Factory
 * Epic: MEDIA-TYPE-ENHANCEMENT Phase 1-3
 *
 * MediaInfo.type에 따라 적절한 렌더링 컴포넌트를 반환합니다:
 * - video → VerticalVideoItem
 * - image → VerticalImageItem
 * - gif → VerticalImageItem (GIF는 이미지로 처리)
 * - 기타 → VerticalImageItem (fallback)
 */

import type { JSX } from 'solid-js/jsx-runtime';
import type { MediaInfo } from '@shared/types/media.types';
import type { ImageFitMode } from '@shared/types';
import { SolidVerticalImageItem } from '@features/gallery/components/vertical-gallery-view/VerticalImageItem.solid';
import { VerticalVideoItem } from '@features/gallery/components/vertical-gallery-view/VerticalVideoItem.solid';

/**
 * 미디어 아이템 렌더링에 공통으로 사용되는 Props
 *
 * 모든 미디어 컴포넌트(VerticalImageItem, VerticalVideoItem)가 공유하는 기본 속성입니다.
 * 선택적 속성은 Factory 내부에서 적절한 기본값으로 정규화됩니다.
 */
export interface CommonMediaItemProps {
  /** 갤러리 내 순서 인덱스 (0부터 시작) */
  readonly index: number;

  /**
   * 사용자가 명시적으로 선택한 아이템 여부
   *
   * Epic A11Y-FOCUS-ROLES: 클릭/키보드 네비게이션으로 선택된 아이템
   * - true: 현재 포커스된 아이템 (접근성 aria-current="true")
   * - false: 비활성 아이템
   */
  readonly isActive: boolean;

  /**
   * 갤러리 열림 시 자동 스크롤 대상 아이템 여부 (선택적)
   *
   * Epic A11Y-FOCUS-ROLES: startIndex와 일치하는 아이템 (정적 마커)
   * - true: 초기 포커스 대상 (스크롤 타겟)
   * - false: 일반 아이템
   * - undefined: false로 정규화
   *
   * @default false
   */
  readonly isFocused?: boolean;

  /**
   * 뷰포트 내 가시성 여부 (windowing, 선택적)
   *
   * - true: 현재 뷰포트에 표시됨
   * - false: 뷰포트 밖 (로딩 지연 가능)
   * - undefined: true로 정규화 (안전 기본값)
   *
   * @default true
   */
  readonly isVisible?: boolean;

  /**
   * 강제 표시 여부 (선택적)
   *
   * - true: windowing 무시하고 항상 렌더링
   * - false: windowing 정책 준수
   * - undefined: false로 정규화
   *
   * @default false
   */
  readonly forceVisible?: boolean;

  /**
   * 이미지 피팅 모드 (선택적)
   *
   * - 'original': 원본 크기 유지
   * - 'fitWidth': 너비 맞춤
   * - 'fitHeight': 높이 맞춤
   * - 'fitContainer': 컨테이너에 맞춤
   * - undefined: 'fitContainer'로 정규화
   *
   * @default 'fitContainer'
   */
  readonly fitMode?: ImageFitMode;
}

/**
 * 미디어 타입에 따라 적절한 컴포넌트를 반환하는 Factory 함수
 *
 * **타입별 라우팅 규칙**:
 * - `video`: VerticalVideoItem (재생 컨트롤, 진행바, 볼륨 조절)
 * - `image`: VerticalImageItem (확대/축소, 피팅 모드)
 * - `gif`: VerticalImageItem (GIF는 `<img>` 태그로 처리 가능)
 * - 기타: VerticalImageItem (안전한 fallback)
 *
 * **Props 정규화**:
 * - 선택적 Props는 안전한 기본값으로 자동 변환
 * - TypeScript strict mode 호환 (exactOptionalPropertyTypes: true)
 *
 * @param media - 미디어 정보 (url, type, originalUrl, index 등)
 * @param props - 공통 Props (index, isActive, isFocused?, isVisible?, forceVisible?, fitMode?)
 * @returns SolidJS 컴포넌트 (JSX.Element)
 *
 * @example
 * ```tsx
 * // 비디오 아이템 생성
 * const videoItem = createMediaItem(
 *   { url: 'https://video.twimg.com/test.mp4', type: 'video', index: 0 },
 *   { index: 0, isActive: true }
 * );
 * // → <VerticalVideoItem media={...} isFocused={false} isVisible={true} ... />
 *
 * // 이미지 아이템 생성 (커스텀 fitMode)
 * const imageItem = createMediaItem(
 *   { url: 'https://pbs.twimg.com/media/test.jpg', type: 'image', index: 1 },
 *   { index: 1, isActive: false, fitMode: 'fitWidth' }
 * );
 * // → <VerticalImageItem media={...} fitMode='fitWidth' ... />
 * ```
 *
 * @see {@link VerticalVideoItem} - 비디오 전용 컴포넌트
 * @see {@link SolidVerticalImageItem} - 이미지/GIF 전용 컴포넌트
 * @see {@link CommonMediaItemProps} - Props 인터페이스 상세
 */
export function createMediaItem(media: MediaInfo, props: CommonMediaItemProps): JSX.Element {
  // Props 정규화: 선택적 속성을 기본값으로 변환
  const normalized = {
    index: props.index,
    isActive: props.isActive,
    isFocused: props.isFocused ?? false,
    isVisible: props.isVisible ?? true,
    forceVisible: props.forceVisible ?? false,
    fitMode: props.fitMode ?? ('fitContainer' as ImageFitMode),
  };

  switch (media.type) {
    case 'video':
      // 비디오: 재생 컨트롤, 진행바, 볼륨 조절 지원
      return VerticalVideoItem({
        media,
        ...normalized,
      });

    case 'image':
    case 'gif': // GIF는 <img> 태그로 처리 (자동 재생)
    default:
      // 알 수 없는 타입은 안전하게 이미지로 fallback
      return SolidVerticalImageItem({
        media,
        index: normalized.index,
        isActive: normalized.isActive,
        isFocused: normalized.isFocused,
        forceVisible: normalized.forceVisible,
        fitMode: normalized.fitMode,
      });
  }
}
