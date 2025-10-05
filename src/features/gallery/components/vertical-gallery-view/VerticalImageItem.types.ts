/**
 * @fileoverview Shared type definitions for VerticalImageItem components.
 */

import type { ImageFitMode } from '@shared/types';
import type { MediaInfo } from '@shared/types/media.types';

export interface VerticalImageItemProps {
  readonly media: MediaInfo;
  readonly index: number;

  /**
   * 사용자가 명시적으로 선택한 아이템 여부
   * @remarks
   * Epic A11Y-FOCUS-ROLES: 사용자가 클릭하거나 키보드 네비게이션
   * (ArrowUp/Down, Home/End)으로 선택한 아이템. 명시적 사용자 인터랙션의 결과.
   * CSS: `.active` 클래스 적용 → 강한 시각적 강조 (2px border).
   * 키보드 네비게이션에 따라 동적으로 변경됨.
   */
  readonly isActive: boolean;

  /**
   * 갤러리 열림 시 자동 스크롤 대상 아이템 여부
   * @remarks
   * Epic A11Y-FOCUS-ROLES: 갤러리가 열릴 때 startIndex와 일치하는 아이템.
   * 자동 스크롤 대상을 나타내며, 시각적 주목을 위해 사용.
   * CSS: `.focused` 클래스 적용 → 가벼운 시각적 표시 (1px border).
   * 갤러리가 열릴 때 한 번만 설정되고 이후 변경되지 않음 (정적 마커).
   * isActive와 동시에 true일 수 있음 (startIndex로 열린 경우).
   */
  readonly isFocused?: boolean;

  /**
   * 뷰포트 가시 영역에 있는 아이템 여부 (Soft Focus)
   * @remarks
   * Epic AUTO-FOCUS-UPDATE (Phase 2-1): IntersectionObserver 기반 가시성 추적.
   * 자동 스크롤 없이 시각적 힌트만 제공 (border + shadow + background).
   * CSS: `.visible` 클래스 적용 → 디자인 토큰 기반 시각적 강조.
   * ARIA: `aria-current="true"` 설정 (스크린 리더 피드백).
   * isActive와 독립적으로 동작 (둘 다 동시에 true 가능).
   * @default false
   */
  readonly isVisible?: boolean;

  readonly forceVisible?: boolean;
  readonly fitMode?: ImageFitMode;
  readonly className?: string;

  /**
   * 아이템 클릭 핸들러
   * @remarks
   * Epic DOM-EVENT-CLARITY: 내부 인터랙티브 요소(다운로드 버튼 등)는
   * 이벤트 전파를 차단하므로, 이 핸들러는 컨테이너 직접 클릭 시에만 호출됩니다.
   * data-role="download" 요소의 closest() 체크를 통해 이벤트 격리가 보장됩니다.
   */
  readonly onClick?: () => void;

  /**
   * 다운로드 버튼 클릭 핸들러
   * @remarks
   * Epic DOM-EVENT-CLARITY: stopPropagation()을 사용하여 부모 컨테이너로의
   * 이벤트 버블링을 차단합니다. onClick과 독립적으로 동작합니다.
   */
  readonly onDownload?: () => void;

  readonly onMediaLoad?: (mediaId: string, index: number) => void;
  readonly onFocus?: (event: FocusEvent) => void;
  readonly onBlur?: (event: FocusEvent) => void;
  readonly onKeyDown?: (event: KeyboardEvent) => void;

  /**
   * 이미지/비디오 컨텍스트 메뉴 핸들러
   * @remarks
   * Epic DOM-EVENT-CLARITY: 네이티브 브라우저 컨텍스트 메뉴를 허용하면서,
   * 추가 컨텍스트 정보(미디어 정보)를 부모 컴포넌트로 전달합니다.
   */
  readonly onImageContextMenu?: (event: MouseEvent, media: MediaInfo) => void;

  readonly 'data-testid'?: string;
  readonly 'data-xeg-role'?: string;
  readonly 'aria-label'?: string;
  readonly 'aria-describedby'?: string;
  readonly role?: string;
  readonly tabIndex?: number;
}
