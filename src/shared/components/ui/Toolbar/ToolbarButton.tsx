/**
 * @fileoverview ToolbarButton Foundation Component (Phase P2)
 * @description 통합된 툴바 버튼 컴포넌트 - 모든 버튼 스타일 일관성 보장
 */

import { getPreact, type VNode, type ComponentChildren } from '@shared/external/vendors';
import styles from './UnifiedToolbarButton.module.css';

export type ToolbarButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ToolbarButtonSize = 'sm' | 'md' | 'lg';
export type ToolbarButtonType = 'button' | 'submit' | 'reset';

export interface ToolbarButtonProps {
  /** 버튼 변형 */
  variant?: ToolbarButtonVariant;
  /** 버튼 크기 */
  size?: ToolbarButtonSize;
  /** 버튼 타입 */
  type?: ToolbarButtonType;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** 활성화 상태 (토글 버튼용) */
  active?: boolean;
  /** 아이콘 전용 버튼 */
  iconOnly?: boolean;
  /** 아이콘 + 텍스트 */
  hasIcon?: boolean;
  /** 클릭 이벤트 */
  onClick?: ((event: Event) => void) | undefined;
  /** 포커스 이벤트 */
  onFocus?: ((event: FocusEvent) => void) | undefined;
  /** 블러 이벤트 */
  onBlur?: ((event: FocusEvent) => void) | undefined;
  /** 키다운 이벤트 */
  onKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  /** 추가 클래스명 */
  className?: string;
  /** 테스트 ID */
  'data-testid'?: string;
  /** 접근성 레이블 */
  'aria-label'?: string;
  /** ARIA pressed (토글 버튼용) */
  'aria-pressed'?: boolean | 'true' | 'false';
  /** ARIA expanded (드롭다운 버튼용) */
  'aria-expanded'?: boolean | 'true' | 'false';
  /** ARIA haspopup (드롭다운 버튼용) */
  'aria-haspopup'?: 'true' | 'false' | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  /** ARIA described by */
  'aria-describedby'?: string;
  /** 제목 (툴팁) */
  title?: string;
  /** 탭 인덱스 */
  tabIndex?: number;
  /** 자식 요소 */
  children?: ComponentChildren;
  /** 갤러리 요소 타입 (data-gallery-element) */
  'data-gallery-element'?: string;
  /** 비활성화 상태 (data-disabled) */
  'data-disabled'?: boolean;
  /** 로딩 상태 (data-loading) */
  'data-loading'?: boolean;
}

/**
 * 통합 ToolbarButton 컴포넌트
 * 모든 툴바 버튼의 스타일과 동작을 표준화
 */
export function ToolbarButton({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  active = false,
  iconOnly = false,
  hasIcon = false,
  onClick,
  onFocus,
  onBlur,
  onKeyDown,
  className = '',
  'data-testid': testId,
  'data-gallery-element': galleryElement,
  'data-disabled': dataDisabled,
  'data-loading': dataLoading,
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
  'aria-expanded': ariaExpanded,
  'aria-haspopup': ariaHaspopup,
  'aria-describedby': ariaDescribedBy,
  title,
  tabIndex,
  children,
}: ToolbarButtonProps): VNode {
  const { h } = getPreact();

  // 클래스명 조합
  const buttonClasses = [
    styles.toolbarButton,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    iconOnly && styles.iconOnly,
    hasIcon && styles.hasIcon,
    loading && styles.loading,
    active && styles.active,
    disabled && styles.disabled,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // 이벤트 핸들러
  const handleClick = (event: Event) => {
    if (disabled || loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onClick?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (disabled || loading) return;

    // Enter/Space 키 처리
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (onClick) {
        onClick(event as Event);
      }
    }

    onKeyDown?.(event);
  };

  // exactOptionalPropertyTypes 호환을 위한 타입 우회
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (h as any)(
    'button',
    {
      type,
      role: 'button',
      className: buttonClasses,
      disabled: disabled || loading,
      onClick: handleClick,
      onFocus,
      onBlur,
      onKeyDown: handleKeyDown,
      'data-testid': testId,
      'data-gallery-element': galleryElement,
      'data-disabled': dataDisabled,
      'data-loading': dataLoading,
      'data-variant': variant,
      'data-size': size,
      'data-active': active,
      'data-icon-only': iconOnly,
      'aria-label': ariaLabel,
      'aria-pressed': ariaPressed,
      'aria-expanded': ariaExpanded,
      'aria-haspopup': ariaHaspopup,
      'aria-describedby': ariaDescribedBy,
      'aria-disabled': disabled || loading,
      title,
      tabIndex: disabled ? -1 : tabIndex,
    },
    [
      // 로딩 스피너
      loading &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (h as any)(
          'span',
          {
            className: styles.loadingSpinner,
            'aria-hidden': 'true',
            key: 'loading-spinner',
          },
          '⟳'
        ),
      // 자식 요소 (아이콘/텍스트)
      children,
    ]
  );
}
export default ToolbarButton;
