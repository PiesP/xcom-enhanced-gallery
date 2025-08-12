/**
 * @fileoverview 표준화된 기본 컴포넌트 Props
 * @description TDD Phase 5a: 모든 컴포넌트의 공통 Props 표준화
 * @version 2.0.0 - Component Props Standardization
 */

import type { ComponentChildren } from '@shared/external/vendors';

/**
 * 모든 컴포넌트의 최상위 기본 Props
 * TDD Phase 5a: Props 표준화
 */
export interface BaseComponentProps {
  /** 자식 컴포넌트 */
  children?: ComponentChildren;
  /** 추가 클래스명 */
  className?: string;
  /** 컴포넌트 ID */
  id?: string;
  /** 테스트 ID - 표준화된 camelCase */
  testId?: string;
  /** 테스트 ID - data 속성 호환성 */
  'data-testid'?: string;

  /* === 접근성 Props 표준화 === */
  /** 접근성 레이블 - 표준화된 camelCase */
  ariaLabel?: string;
  /** 접근성 레이블 - kebab-case 호환성 */
  'aria-label'?: string;
  /** ARIA describedby - 표준화된 camelCase */
  ariaDescribedBy?: string;
  /** ARIA describedby - kebab-case 호환성 */
  'aria-describedby'?: string;
  /** ARIA 확장 상태 */
  'aria-expanded'?: boolean;
  /** ARIA 숨김 상태 */
  'aria-hidden'?: boolean;
  /** 접근성 역할 */
  role?: string;
  /** 탭 인덱스 */
  tabIndex?: number;

  /* === 이벤트 핸들러 표준화 === */
  /** 클릭 이벤트 - 표준화된 네이밍 */
  onClick?: (event: MouseEvent) => void;
  /** 키보드 다운 이벤트 */
  onKeyDown?: (event: KeyboardEvent) => void;
  /** 포커스 이벤트 */
  onFocus?: (event: FocusEvent) => void;
  /** 블러 이벤트 */
  onBlur?: (event: FocusEvent) => void;
}

/**
 * 상호작용 가능한 컴포넌트 Props
 */
export interface InteractiveComponentProps extends BaseComponentProps {
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 마우스 이벤트 핸들러들 */
  onMouseEnter?: (event: MouseEvent) => void;
  onMouseLeave?: (event: MouseEvent) => void;
}

/**
 * 로딩 상태를 가진 컴포넌트 Props
 */
export interface LoadingComponentProps extends BaseComponentProps {
  /** 로딩 상태 */
  loading?: boolean;
  /** 로딩 텍스트 */
  loadingText?: string;
}

/**
 * 크기 변형을 가진 컴포넌트 Props
 */
export interface SizedComponentProps extends BaseComponentProps {
  /** 크기 변형 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

/**
 * 색상 변형을 가한 컴포넌트 Props
 */
export interface VariantComponentProps extends BaseComponentProps {
  /** 색상/스타일 변형 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';
}

/**
 * 폼 요소 컴포넌트 Props
 */
export interface FormComponentProps extends InteractiveComponentProps {
  /** HTML 폼 요소 타입 */
  type?: 'button' | 'submit' | 'reset';
  /** 폼 관련 속성 */
  form?: string;
  /** 자동 포커스 */
  autoFocus?: boolean;
}

/**
 * 컨테이너 컴포넌트 Props
 */
export interface ContainerComponentProps extends BaseComponentProps {
  /** 컨테이너 닫기 콜백 */
  onClose?: () => void;
  /** 위치 설정 */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  /** 최대 항목 수 */
  maxItems?: number;
}

/**
 * 갤러리 전용 컴포넌트 Props (기존 GalleryComponentProps 대체)
 */
export interface GalleryComponentProps extends InteractiveComponentProps {
  /** 갤러리 타입 */
  galleryType?: 'container' | 'item' | 'control' | 'overlay' | 'viewer';
  /** 갤러리 관련 커스텀 데이터 */
  'data-xeg-gallery'?: string;
  'data-xeg-gallery-type'?: string;
  'data-xeg-gallery-version'?: string;
}

/**
 * Props 유형별 기본값
 */
export const DEFAULT_PROPS = {
  base: {
    className: '',
    tabIndex: 0,
  },
  interactive: {
    disabled: false,
    tabIndex: 0,
    role: 'button',
  },
  loading: {
    loading: false,
    loadingText: 'Loading...',
  },
  sized: {
    size: 'md' as const,
  },
  variant: {
    variant: 'primary' as const,
  },
  form: {
    type: 'button' as const,
    autoFocus: false,
  },
  container: {
    position: 'top-right' as const,
    maxItems: 5,
  },
  gallery: {
    galleryType: 'item' as const,
    'data-xeg-gallery-version': '2.0',
  },
} as const;

/**
 * Props 유효성 검증 타입 가드
 */
export const isInteractiveProps = (
  props: BaseComponentProps
): props is InteractiveComponentProps => {
  return 'disabled' in props || 'onMouseEnter' in props || 'onMouseLeave' in props;
};

export const isLoadingProps = (props: BaseComponentProps): props is LoadingComponentProps => {
  return 'loading' in props || 'loadingText' in props;
};

export const isGalleryProps = (props: BaseComponentProps): props is GalleryComponentProps => {
  return 'galleryType' in props || 'data-xeg-gallery' in props;
};
