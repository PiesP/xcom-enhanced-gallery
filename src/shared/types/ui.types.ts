/**
 * UI 관련 공통 타입 정의
 *
 * 사용자 인터페이스 컴포넌트에서 사용되는 공통 타입들을 정의합니다.
 */

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
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/** 버튼 크기 타입 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** 애니메이션 설정 타입 */
export interface AnimationConfig {
  /** 지속 시간 (ms) */
  duration: number;
  /** 이징 함수 */
  easing?: string;
  /** 지연 시간 (ms) */
  delay?: number;
}
