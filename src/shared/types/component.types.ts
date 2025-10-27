/**
 * @fileoverview 컴포넌트 Props 및 관련 타입 정의
 * @version 1.0.0 - Phase 196: app.types.ts에서 분할
 * @description 모든 컴포넌트의 기본 Props와 확장 Props 정의
 *
 * 설계 패턴:
 * - BaseComponentProps: 모든 컴포넌트의 최상위 기본 props
 * - SpecificComponentProps: BaseComponentProps를 확장한 역할별 props
 */

import type { JSXElement } from '../external/vendors';

// ================================
// 기본 타입 정의
// ================================

/**
 * JSX 요소 타입 별칭
 */
export type VNode = JSXElement;

/**
 * 컴포넌트 타입 (함수형 컴포넌트)
 *
 * @template P 컴포넌트 props 타입
 */
export type ComponentType<P = Record<string, unknown>> = (props: P) => JSXElement | null;

/**
 * 컴포넌트 자식 요소 타입
 *
 * @description JSX 자식으로 사용 가능한 모든 타입
 */
export type ComponentChildren =
  | JSXElement
  | string
  | number
  | boolean
  | null
  | undefined
  | ComponentChildren[];

/**
 * CSS 속성 객체
 */
export interface CSSProperties {
  [key: string]: string | number | undefined;
}

// ================================
// 기본 컴포넌트 Props
// ================================

/**
 * 모든 컴포넌트의 최상위 기본 Props
 *
 * @description Phase 2-3A: 통합 (이전 base/BaseComponentProps.ts에서 마이그레이션)
 *
 * 포함 사항:
 * - 기본 HTML 속성 (className, style, 등)
 * - 접근성 속성 (aria-*, role)
 * - 데이터 속성 (data-*)
 * - 이벤트 핸들러 (onClick, onKeyDown 등)
 *
 * @example
 * ```typescript
 * interface MyComponentProps extends BaseComponentProps {
 *   variant?: 'primary' | 'secondary';
 * }
 *
 * const MyComponent = (props: MyComponentProps) => (
 *   <button
 *     className={props.className}
 *     aria-label={props['aria-label']}
 *     data-testid={props['data-testid']}
 *   >
 *     {props.children}
 *   </button>
 * );
 * ```
 */
export interface BaseComponentProps {
  /** 자식 요소들 */
  children?: ComponentChildren;
  /** CSS 클래스명 */
  className?: string;
  /** 인라인 스타일 */
  style?: CSSProperties;
  /** 테스트 식별자 */
  'data-testid'?: string;
  /** 접근성: 요소 설명 */
  'aria-label'?: string;
  /** 접근성: 상세 설명 요소 ID */
  'aria-describedby'?: string;
  /** 접근성: 펼침/닫음 상태 */
  'aria-expanded'?: boolean;
  /** 접근성: 숨김 상태 */
  'aria-hidden'?: boolean;
  /** 접근성: 비활성화 상태 */
  'aria-disabled'?: boolean | 'true' | 'false';
  /** 접근성: 작업 중 상태 */
  'aria-busy'?: boolean | 'true' | 'false';
  /** 접근성: 토글 상태 */
  'aria-pressed'?: boolean | 'true' | 'false';
  /** 접근성: 팝업 타입 */
  'aria-haspopup'?: boolean | 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  /** HTML 역할 */
  role?: string;
  /** 탭 순서 */
  tabIndex?: number;
  /** 클릭 이벤트 핸들러 */
  onClick?: (event: MouseEvent) => void;
  /** 키보드 누름 이벤트 핸들러 */
  onKeyDown?: (event: KeyboardEvent) => void;
  /** 포커스 획득 이벤트 핸들러 */
  onFocus?: (event: FocusEvent) => void;
  /** 포커스 손실 이벤트 핸들러 */
  onBlur?: (event: FocusEvent) => void;
  /** 동적 data 속성 */
  [key: `data-${string}`]: string | number | boolean | undefined;
}

// ================================
// 역할별 컴포넌트 Props (BaseComponentProps 확장)
// ================================

/**
 * 상호작용 가능한 컴포넌트 Props
 *
 * @description 클릭/마우스 이벤트를 처리하는 컴포넌트용
 *
 * @example 버튼, 링크, 클릭 가능한 항목
 */
export interface InteractiveComponentProps extends BaseComponentProps {
  /** 비활성화 여부 */
  disabled?: boolean;
  /** 마우스 진입 시 이벤트 */
  onMouseEnter?: (event: MouseEvent) => void;
  /** 마우스 이탈 시 이벤트 */
  onMouseLeave?: (event: MouseEvent) => void;
}

/**
 * 로딩 상태를 가진 컴포넌트 Props
 *
 * @description 비동기 작업 진행 상황을 표시하는 컴포넌트용
 *
 * @example 로딩 버튼, 진행률 표시기
 */
export interface LoadingComponentProps extends BaseComponentProps {
  /** 로딩 중 여부 */
  loading?: boolean;
  /** 로딩 중 표시 텍스트 */
  loadingText?: string;
}

/**
 * 크기 변형을 가진 컴포넌트 Props
 *
 * @description 여러 크기 옵션이 있는 컴포넌트용
 *
 * @example 버튼, 뱃지, 아이콘
 */
export interface SizedComponentProps extends BaseComponentProps {
  /** 크기 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * 색상 변형을 가한 컴포넌트 Props
 *
 * @description 여러 스타일 변형이 있는 컴포넌트용
 *
 * @example 버튼, 뱃지, 알림
 */
export interface VariantComponentProps extends BaseComponentProps {
  /** 변형 스타일 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'icon';
}

/**
 * 폼 요소 컴포넌트 Props
 *
 * @description input, button 등 폼 요소용
 */
export interface FormComponentProps extends InteractiveComponentProps {
  /** 버튼 타입 */
  type?: 'button' | 'submit' | 'reset';
  /** form 요소 ID 연결 */
  form?: string;
  /** 자동 포커스 */
  autoFocus?: boolean;
}

/**
 * 컨테이너 컴포넌트 Props
 *
 * @description 토스트, 모달 등 컨테이너 요소용
 */
export interface ContainerComponentProps extends BaseComponentProps {
  /** 닫기 콜백 */
  onClose?: () => void;
  /** 위치 */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  /** 최대 아이템 수 */
  maxItems?: number;
}

/**
 * 갤러리 전용 컴포넌트 Props
 *
 * @description 갤러리 관련 모든 컴포넌트용 데이터 속성 포함
 */
export interface GalleryComponentProps extends InteractiveComponentProps {
  /** 갤러리 컴포넌트 타입 */
  galleryType?: 'container' | 'item' | 'control' | 'overlay' | 'viewer';
  /** 갤러리 마크 (data attribute) */
  'data-xeg-gallery'?: string;
  /** 갤러리 타입 (data attribute) */
  'data-xeg-gallery-type'?: string;
  /** 갤러리 버전 (data attribute) */
  'data-xeg-gallery-version'?: string;
}

// ================================
// 이벤트 핸들러 타입들
// ================================

/**
 * 일반 이벤트 핸들러
 *
 * @template T 이벤트 타입
 */
export type EventHandler<T = Event> = (event: T) => void;

/**
 * 마우스 이벤트 핸들러
 */
export type MouseEventHandler = EventHandler<MouseEvent>;

/**
 * 키보드 이벤트 핸들러
 */
export type KeyboardEventHandler = EventHandler<KeyboardEvent>;

/**
 * 비동기 함수 타입
 *
 * @template T 반환 타입
 */
export type AsyncFunction<T = void> = () => Promise<T>;

/**
 * 비동기 콜백 함수 타입
 *
 * @template T 입력 타입
 * @template R 반환 타입
 */
export type AsyncCallback<T = void, R = void> = (arg: T) => Promise<R>;

/**
 * 선택적 콜백 함수 타입 (undefined 허용)
 *
 * @template T 입력 타입
 */
export type OptionalCallback<T = void> = ((arg: T) => void) | undefined;

/**
 * 에러 핸들러 (동기)
 */
export type ErrorHandler = (error: Error | ApiError) => void;

/**
 * 에러 핸들러 (비동기)
 */
export type AsyncErrorHandler = (error: Error | ApiError) => Promise<void>;

/**
 * 진행률 콜백 (0-1)
 */
export type ProgressCallback = (progress: number) => void;

// ================================
// API 관련 타입들
// ================================

/**
 * API 응답 래퍼
 *
 * @template T 데이터 타입
 */
export interface ApiResponse<T = Record<string, unknown>> {
  /** 성공 여부 */
  success: boolean;
  /** 응답 데이터 */
  data?: T;
  /** 에러 메시지 */
  error?: string;
  /** 메시지 */
  message?: string;
}

/**
 * API 에러
 */
export interface ApiError {
  /** 에러 코드 */
  code: string;
  /** 에러 메시지 */
  message: string;
  /** 상세 정보 */
  details?: unknown;
}

/**
 * API 요청 옵션
 */
export interface RequestOptions {
  /** 타임아웃 (ms) */
  timeout?: number;
  /** 재시도 횟수 */
  retries?: number;
  /** 요청 헤더 */
  headers?: Record<string, string>;
}

/**
 * 페이지네이션 정보
 */
export interface PaginationInfo {
  /** 현재 페이지 */
  page: number;
  /** 페이지당 항목 수 */
  limit: number;
  /** 전체 항목 수 */
  total: number;
  /** 다음 페이지 여부 */
  hasNext: boolean;
  /** 이전 페이지 여부 */
  hasPrev: boolean;
}

/**
 * 파일 정보
 */
export interface FileInfo {
  /** 파일 이름 */
  name: string;
  /** 파일 크기 (바이트) */
  size: number;
  /** MIME 타입 */
  type: string;
  /** 마지막 수정 시간 (타임스탬프) */
  lastModified: number;
}
