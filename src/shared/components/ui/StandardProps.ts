/**
 * @fileoverview 표준화된 컴포넌트 Props 인터페이스
 * @description Phase 2 컴포넌트 통합 - 공통 Props 표준화
 * @version 1.0.0
 */

import type { ComponentChildren } from '@shared/external/vendors';

/**
 * 모든 UI 컴포넌트의 기본 Props
 */
export interface BaseUIComponentProps {
  /** 자식 컴포넌트 */
  children?: ComponentChildren;
  /** 추가 클래스명 */
  className?: string;
  /** 테스트 ID */
  'data-testid'?: string;
  /** 접근성 레이블 */
  'aria-label'?: string;
  /** ARIA 속성들 */
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  /** 접근성 역할 */
  role?: string;
  /** 탭 인덱스 */
  tabIndex?: number;
}

/**
 * 상호작용 가능한 컴포넌트의 기본 Props
 */
export interface InteractiveComponentProps extends BaseUIComponentProps {
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 클릭 이벤트 핸들러 */
  onClick?: (event?: Event) => void;
  /** 키보드 이벤트 핸들러 */
  onKeyDown?: (event: KeyboardEvent) => void;
  /** 포커스 이벤트 핸들러 */
  onFocus?: (event: FocusEvent) => void;
  /** 블러 이벤트 핸들러 */
  onBlur?: (event: FocusEvent) => void;
}

/**
 * 로딩 상태를 가진 컴포넌트 Props
 */
export interface LoadingComponentProps {
  /** 로딩 상태 */
  loading?: boolean;
  /** 로딩 텍스트 */
  loadingText?: string;
}

/**
 * 크기 변형을 가진 컴포넌트 Props
 */
export interface SizedComponentProps {
  /** 크기 변형 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * 색상 변형을 가진 컴포넌트 Props
 */
export interface VariantComponentProps {
  /** 색상/스타일 변형 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
}

/**
 * 표준화된 Button Props
 */
export interface StandardButtonProps
  extends InteractiveComponentProps,
    LoadingComponentProps,
    SizedComponentProps,
    VariantComponentProps {
  /** 버튼 타입 */
  type?: 'button' | 'submit' | 'reset';
  /** 폼 관련 속성 */
  form?: string;
  /** 자동 포커스 */
  autoFocus?: boolean;
}

/**
 * 표준화된 Toast Props
 */
export interface StandardToastProps extends BaseUIComponentProps {
  /** Toast 타입 */
  type: 'info' | 'warning' | 'error' | 'success';
  /** 제목 */
  title: string;
  /** 메시지 */
  message: string;
  /** 지속 시간 (ms) */
  duration?: number;
  /** 자동 닫기 여부 */
  autoClose?: boolean;
  /** Toast 닫기 콜백 */
  onClose?: () => void;
  /** ARIA role */
  role?: 'alert' | 'status' | 'log';
}

/**
 * 표준화된 ToastContainer Props
 */
export interface StandardToastContainerProps extends BaseUIComponentProps {
  /** Toast 목록 */
  toasts?: unknown[];
  /** 최대 Toast 수 */
  maxToasts?: number;
  /** 컨테이너 위치 */
  position?:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'top-center'
    | 'bottom-center';
}

/**
 * 표준화된 Toolbar Props
 */
export interface StandardToolbarProps extends BaseUIComponentProps {
  /** 현재 인덱스 */
  currentIndex: number;
  /** 전체 개수 */
  totalCount: number;
  /** 다운로드 진행 상태 */
  isDownloading?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 현재 뷰 모드 */
  currentViewMode?: string;
  /** 뷰 모드 변경 콜백 */
  onViewModeChange?: (mode: string) => void;
  /** 이전 버튼 콜백 */
  onPrevious: () => void;
  /** 다음 버튼 콜백 */
  onNext: () => void;
  /** 현재 항목 다운로드 콜백 */
  onDownloadCurrent: () => void;
  /** 전체 다운로드 콜백 */
  onDownloadAll: () => void;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 설정 열기 콜백 */
  onOpenSettings?: () => void;
  /** 툴바 위치 */
  position?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * 컴포넌트 표준화 유틸리티
 */
export const ComponentStandards = {
  /**
   * 표준 클래스명 생성
   */
  createClassName: (...classes: (string | undefined | null)[]): string => {
    return classes.filter(Boolean).join(' ');
  },

  /**
   * 표준 ARIA 속성 생성
   */
  createAriaProps: (
    props: Partial<BaseUIComponentProps>
  ): Record<string, string | boolean | number | undefined> => {
    const ariaProps: Record<string, string | boolean | number | undefined> = {};

    if (props['aria-label']) ariaProps['aria-label'] = props['aria-label'];
    if (props['aria-describedby']) ariaProps['aria-describedby'] = props['aria-describedby'];
    if (props['aria-expanded'] !== undefined) ariaProps['aria-expanded'] = props['aria-expanded'];
    if (props['aria-hidden'] !== undefined) ariaProps['aria-hidden'] = props['aria-hidden'];
    if (props.role) ariaProps.role = props.role;
    if (props.tabIndex !== undefined) ariaProps.tabIndex = props.tabIndex;

    return ariaProps;
  },

  /**
   * 표준 테스트 속성 생성
   */
  createTestProps: (testId?: string): Record<string, string | undefined> => {
    return testId ? { 'data-testid': testId } : {};
  },

  /**
   * 로딩 상태 처리
   */
  handleLoadingState: (loading?: boolean, disabled?: boolean): boolean => {
    return Boolean(loading || disabled);
  },

  /**
   * Props 병합 유틸리티
   */
  mergeProps: <T extends BaseUIComponentProps>(baseProps: T, overrideProps: Partial<T>): T => {
    // 클래스명 병합
    const mergedClassName = ComponentStandards.createClassName(
      baseProps.className,
      overrideProps.className
    );

    // 이벤트 핸들러 병합
    const mergedEventHandlers: Partial<T> = {};

    // 공통 이벤트 핸들러들
    const eventHandlers = [
      'onClick',
      'onFocus',
      'onBlur',
      'onKeyDown',
      'onMouseEnter',
      'onMouseLeave',
    ] as const;

    eventHandlers.forEach(handler => {
      const baseHandler = baseProps[handler as keyof T] as unknown;
      const overrideHandler = overrideProps[handler as keyof T] as unknown;

      if (typeof baseHandler === 'function' && typeof overrideHandler === 'function') {
        mergedEventHandlers[handler as keyof T] = ((event: Event) => {
          (baseHandler as (event: Event) => void)(event);
          (overrideHandler as (event: Event) => void)(event);
        }) as T[keyof T];
      } else {
        mergedEventHandlers[handler as keyof T] = (overrideHandler || baseHandler) as T[keyof T];
      }
    });

    return {
      ...baseProps,
      ...overrideProps,
      ...mergedEventHandlers,
      className: mergedClassName || undefined,
    };
  },

  /**
   * Props 유효성 검증
   */
  validateProps: <T extends BaseUIComponentProps>(
    props: T,
    requiredProps: (keyof T)[] = [],
    validationRules: Partial<Record<keyof T, (value: unknown) => boolean>> = {}
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 필수 props 검증
    requiredProps.forEach(propName => {
      if (props[propName] === undefined || props[propName] === null) {
        errors.push(`Required prop '${String(propName)}' is missing`);
      }
    });

    // 커스텀 유효성 규칙 검증
    Object.entries(validationRules).forEach(([propName, validator]) => {
      const value = props[propName as keyof T];
      if (value !== undefined && validator && !validator(value)) {
        errors.push(`Invalid value for prop '${propName}': ${value}`);
      }
    });

    // ARIA 속성 검증
    if (props['aria-label'] && typeof props['aria-label'] !== 'string') {
      errors.push('aria-label must be a string');
    }

    if (props.role && typeof props.role !== 'string') {
      errors.push('role must be a string');
    }

    if (props.tabIndex !== undefined && typeof props.tabIndex !== 'number') {
      errors.push('tabIndex must be a number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
} as const;

// 기본 사이즈 맵
export const DEFAULT_SIZES = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
  xl: 'extra-large',
} as const;

// 기본 변형 맵
export const DEFAULT_VARIANTS = {
  primary: 'primary',
  secondary: 'secondary',
  ghost: 'ghost',
  danger: 'danger',
  success: 'success',
  warning: 'warning',
} as const;

// 기본 타입 맵
export const DEFAULT_TOAST_TYPES = {
  info: 'info',
  warning: 'warning',
  error: 'error',
  success: 'success',
} as const;
