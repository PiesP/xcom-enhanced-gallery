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
