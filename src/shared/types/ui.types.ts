/**
 * UI 관련 공통 타입 정의
 *
 * 사용자 인터페이스 컴포넌트에서 사용되는 공통 타입들을 정의합니다.
 */

import type { MediaItem } from '@shared/types/media.types';

/** 기본 컴포넌트 Props */
export interface BaseComponentProps {
  /** CSS 클래스명 */
  className?: string;
  /** 인라인 스타일 */
  style?: Record<string, string | number>;
  /** 데이터 테스트 ID */
  'data-testid'?: string;
}

/** 테마 설정 타입 */
export type Theme = 'light' | 'dark' | 'auto';

/** 갤러리 테마 설정 타입 (시스템 테마 포함) */
export type GalleryTheme = 'light' | 'dark' | 'auto' | 'system';

/** 토스트 메시지 타입 */
export type ToastType = 'info' | 'warning' | 'error' | 'success';

/** 컴포넌트 크기 설정 */
export type Size = 'small' | 'medium' | 'large';

/** 색상 변형 타입 */
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/** 버튼 변형 타입 */
export type ButtonVariant = 'filled' | 'outlined' | 'text' | 'icon';

/** 버튼 Props */
export interface ButtonProps extends BaseComponentProps {
  /** 버튼 변형 */
  variant?: ButtonVariant;
  /** 색상 */
  color?: ColorVariant;
  /** 크기 */
  size?: Size;
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** 클릭 핸들러 */
  onClick?: (event: MouseEvent) => void;
  /** 버튼 타입 */
  type?: 'button' | 'submit' | 'reset';
  /** 아이콘 (선택적) */
  icon?: string;
  /** 전체 너비 사용 여부 */
  fullWidth?: boolean;
}

/** 모달 Props */
export interface ModalProps extends BaseComponentProps {
  /** 모달 열림 상태 */
  open: boolean;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 제목 */
  title?: string;
  /** 크기 */
  size?: Size;
  /** 배경 클릭으로 닫기 방지 */
  disableBackdropClick?: boolean;
  /** ESC 키로 닫기 방지 */
  disableEscapeKeyDown?: boolean;
}

/** 오버레이 Props */
export interface OverlayProps extends BaseComponentProps {
  /** 표시 여부 */
  visible: boolean;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 배경 색상 투명도 */
  opacity?: number;
  /** z-index 값 */
  zIndex?: number;
}

/** 썸네일바 Props */
export interface ThumbnailBarProps extends BaseComponentProps {
  /** 썸네일 목록 */
  items: MediaItem[];
  /** 현재 선택된 인덱스 */
  selectedIndex: number;
  /** 썸네일 클릭 핸들러 */
  onThumbnailClick: (index: number) => void;
  /** 표시 여부 */
  visible: boolean;
}

// ThumbnailItem은 MediaItem으로 대체됨 (core/types/media.types.ts 참조)
// 중복 제거: MediaItem을 사용하세요

/** 로딩 스피너 Props */
export interface LoadingSpinnerProps extends BaseComponentProps {
  /** 크기 */
  size?: Size;
  /** 색상 */
  color?: string;
  /** 두께 */
  thickness?: number;
}

/** 아이콘 Props */
export interface IconProps extends BaseComponentProps {
  /** 아이콘 이름 */
  name: string;
  /** 크기 */
  size?: Size | number;
  /** 색상 */
  color?: string;
}

/** 애니메이션 설정 타입 */
export interface AnimationConfig {
  /** 지속 시간 (ms) */
  duration: number;
  /** 이징 함수 */
  easing?: string;
  /** 지연 시간 (ms) */
  delay?: number;
}
