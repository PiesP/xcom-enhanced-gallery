/**
 * X.com Enhanced Gallery - 전역 타입 정의
 *
 * 애플리케이션 전체에서 사용되는 전역 타입들을 정의합니다.
 * 외부 라이브러리 타입은 vendors 모듈을 통해 re-export됩니다.
 */

// Vendor 타입들 - 직접 정의하여 순환 참조 방지
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VNode = any;
export type ComponentType<P = {}> = (props: P) => VNode | null;
export type ComponentChildren =
  | VNode
  | string
  | number
  | boolean
  | null
  | undefined
  | ComponentChildren[];

/** CSS 속성 인터페이스 */
export interface CSSProperties {
  [key: string]: string | number | undefined;
  color?: string;
  backgroundColor?: string;
  fontSize?: string | number;
  display?: 'block' | 'inline' | 'flex' | 'grid' | 'none';
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  width?: string | number;
  height?: string | number;
  margin?: string | number;
  padding?: string | number;
  border?: string;
  borderRadius?: string | number;
  opacity?: number;
  transform?: string;
  transition?: string;
  zIndex?: number;
}

/** 기본 컴포넌트 Props */
export interface BaseComponentProps {
  /** CSS 클래스명 */
  className?: string;
  /**
   * 인라인 스타일 속성
   *
   * CSS 속성을 camelCase로 작성하여 인라인 스타일을 정의합니다.
   *
   * @example
   * ```typescript
   * // 기본 스타일 적용
   * <div style={{ color: 'red', fontSize: '16px' }}>내용</div>
   *
   * // 조건부 스타일
   * const dynamicStyle = {
   *   display: isVisible ? 'block' : 'none',
   *   backgroundColor: theme === 'dark' ? '#333' : '#fff'
   * };
   * <div style={dynamicStyle}>내용</div>
   * ```
   */
  style?: CSSProperties;
  /** 자식 요소 */
  children?: ComponentChildren;
  /** 데이터 속성들 (data-* 형태) */
  [key: `data-${string}`]: string | number | boolean | undefined;
  /** 접근성 속성들 */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  'aria-expanded'?: boolean;
  'aria-pressed'?: boolean;
  'aria-selected'?: boolean;
  'aria-disabled'?: boolean;
  /** 역할 속성 */
  role?: string;
  /** 탭 인덱스 */
  tabIndex?: number;
  /** ID 속성 */
  id?: string;
}

/** 이벤트 핸들러 타입 */
export type EventHandler<T = Event> = (event: T) => void;
export type MouseEventHandler = EventHandler<MouseEvent>;
export type KeyboardEventHandler = EventHandler<KeyboardEvent>;
export type TouchEventHandler = EventHandler<TouchEvent>;

/** 비동기 함수 타입 */
export type AsyncFunction<T = void> = () => Promise<T>;
export type AsyncCallback<T = void, R = void> = (arg: T) => Promise<R>;

/** 옵셔널 콜백 타입 */
export type OptionalCallback<T = void> = ((arg: T) => void) | undefined;

/** 에러 핸들러 타입 */
export type ErrorHandler = (error: Error | ApiError) => void;
export type AsyncErrorHandler = (error: Error | ApiError) => Promise<void>;

/** 진행률 콜백 타입 */
export type ProgressCallback = (progress: number) => void;

/** 제네릭 상태 타입 */
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

/** API 응답 타입 */
export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
  timestamp?: string;
}

/** 구체적인 API 에러 타입 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string | number | boolean>;
  statusCode?: number;
  timestamp: string;
}

/** 네트워크 요청 옵션 */
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | FormData | URLSearchParams;
  timeout?: number;
  retries?: number;
  credentials?: 'omit' | 'same-origin' | 'include';
}

/** 페이지네이션 타입 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/** 파일 정보 타입 */
export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

/** 위치 정보 타입 */
export interface Position {
  x: number;
  y: number;
}

/** 크기 정보 타입 */
export interface Size {
  width: number;
  height: number;
}

/** 영역 정보 타입 */
export interface Rect extends Position, Size {}

/** 유틸리티 타입들 */
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** 브랜드 타입 (타입 안전성을 위한) */
export type Brand<T, B> = T & { __brand: B };

/** ID 타입들 */
export type MediaId = Brand<string, 'MediaId'>;
export type TweetId = Brand<string, 'TweetId'>;
export type UserId = Brand<string, 'UserId'>;

/** 전역 설정 타입 */
export interface GlobalConfig {
  debug: boolean;
  version: string;
  environment: 'development' | 'production' | 'test';
}

/**
 * Gallery Signals 인터페이스
 */
export interface GallerySignals {
  galleryStateSignal: {
    value: {
      isOpen: boolean;
      currentIndex: number;
      totalItems: number;
      viewMode: 'verticalList' | 'grid' | 'list';
      isLoading: boolean;
      error?: string;
    };
  };
  galleryActions: {
    openGallery: (items: unknown[], startIndex?: number) => void;
    closeGallery: () => void;
    goToNext: () => void;
    goToPrevious: () => void;
    goToIndex: (index: number) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
  };
}

/**
 * Window 인터페이스 확장
 */
declare global {
  interface Window {
    gallerySignals?: GallerySignals;
  }
}

// 모듈로 인식되도록 export 추가
export {};
