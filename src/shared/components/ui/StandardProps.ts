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
  /** 액션 버튼 텍스트 */
  actionText?: string;
  /** 액션 핸들러 */
  onAction?: () => void;
  /** 닫기 핸들러 */
  onClose?: () => void;
  /** 자동 닫기 */
  autoClose?: boolean;
}

/**
 * 표준화된 Toolbar Props
 */
export interface StandardToolbarProps extends BaseUIComponentProps {
  /** 현재 인덱스 */
  currentIndex: number;
  /** 전체 개수 */
  totalCount: number;
  /** 다운로드 상태 */
  isDownloading?: boolean;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 뷰 모드 */
  viewMode?: string;
  /** 위치 */
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
