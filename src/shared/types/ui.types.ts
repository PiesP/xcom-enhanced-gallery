/**
 * @fileoverview UI/테마 관련 타입 정의
 * @version 1.0.0 - Phase 196: app.types.ts에서 분할
 * @description 테마, 토스트, 버튼 스타일, 애니메이션 등 UI 관련 타입 통합
 */

/**
 * 테마 선택
 *
 * - 'light': 라이트 모드 강제
 * - 'dark': 다크 모드 강제
 * - 'auto': 시스템 설정 자동 적용
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * 갤러리 전용 테마 선택 (Theme의 확장)
 *
 * @see {@link Theme} - 기본 테마 타입
 */
export type GalleryTheme = 'light' | 'dark' | 'auto' | 'system';

/**
 * 토스트 알림 종류
 */
export type ToastType = 'info' | 'warning' | 'error' | 'success';

/**
 * 버튼 변형 (variant)
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

/**
 * 버튼 크기
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * 색상 변형
 */
export type ColorVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

/**
 * 로딩 상태 (async 작업 진행 상황)
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * 비동기 상태 객체
 *
 * @template T 데이터 타입
 *
 * @example
 * ```typescript
 * const [state, setState] = createSignal<AsyncState<User>>({
 *   data: null,
 *   loading: false,
 *   error: null,
 * });
 * ```
 */
export interface AsyncState<T> {
  /** 현재 데이터 (로딩 중이면 null, 에러면 이전 데이터 유지 가능) */
  data: T | null;
  /** 로딩 중 여부 */
  loading: boolean;
  /** 에러 메시지 (성공하면 null) */
  error: string | null;
}

/**
 * 애니메이션 설정
 *
 * @description CSS 애니메이션 옵션을 정의
 */
export interface AnimationConfig {
  /** 애니메이션 지속 시간 (ms) */
  duration?: number;
  /** 이징 함수 (ease, ease-in, ease-out, etc.) */
  easing?: string;
  /** 애니메이션 지연 시간 (ms) */
  delay?: number;
}

/**
 * 이미지 적합 모드
 *
 * @description 컨테이너 내 이미지 렌더링 방식
 *
 * - 'original': 원본 크기 유지
 * - 'fitWidth': 너비에 맞춤
 * - 'fitHeight': 높이에 맞춤
 * - 'fitContainer': 컨테이너에 가득 채우기
 */
export type ImageFitMode = 'original' | 'fitWidth' | 'fitHeight' | 'fitContainer';

/**
 * 이미지 적합 옵션
 *
 * @description ImageFitMode와 함께 사용하는 세부 옵션
 */
export interface ImageFitOptions {
  /** 적합 모드 */
  mode: ImageFitMode;
  /** 최대 너비 (px 또는 em) */
  maxWidth?: number;
  /** 최대 높이 (px 또는 em) */
  maxHeight?: number;
  /** 이미지 품질 (0-1) */
  quality?: number;
  /** 콜백 함수들 */
  callbacks?: ImageFitCallbacks;
}

/**
 * 이미지 적합 콜백 함수들
 */
export interface ImageFitCallbacks {
  /** 크기 변경 시 호출 */
  onResize?: (size: { width: number; height: number }) => void;
  /** 에러 발생 시 호출 */
  onError?: (error: Error) => void;
}

/**
 * 파일명 생성 전략
 *
 * - 'simple': 단순 파일명 (예: image_001)
 * - 'detailed': 상세 파일명 (예: @username_description_20250101)
 * - 'timestamp': 타임스탬프 포함 (예: 20250101_120000_media)
 * - 'custom': 사용자 정의 형식
 */
export type FilenameStrategy = 'simple' | 'detailed' | 'timestamp' | 'custom';

/**
 * 미디어 파일 확장자
 */
export type MediaFileExtension = 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp' | 'mp4' | 'mov';

/**
 * 전역 설정
 *
 * @description 애플리케이션 전역 UI/UX 설정
 */
export interface GlobalConfig {
  /** 테마 설정 */
  theme: Theme;
  /** 언어 설정 (ISO 639-1 코드) */
  language: string;
  /** 디버그 모드 */
  debug: boolean;
  /** 성능 관련 설정 */
  performance: {
    /** 성능 지표 추적 활성화 */
    enableMetrics: boolean;
    /** 최대 캐시 크기 (MB) */
    maxCacheSize: number;
  };
}
