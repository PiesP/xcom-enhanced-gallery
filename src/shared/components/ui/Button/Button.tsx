/**
 * Button 컴포넌트 for X.com Enhanced Gallery
 *
 * X.com Enhanced Gallery에서 사용되는 재사용 가능한 버튼 컴포넌트입니다.
 * 다양한 스타일, 크기, 상태를 지원하며 접근성을 고려하여 설계되었습니다.
 *
 * @fileoverview
 * 이 파일은 갤러리 UI 전반에서 사용되는 범용 Button 컴포넌트를 정의합니다.
 *
 * @module Button
 * @since 1.0.0
 */

import type { ComponentChildren } from '@shared/types/global.types';
import { getPreact, getPreactHooks } from '@shared/utils/external';
import styles from './Button.module.css';

const { h } = getPreact();
const { forwardRef } = getPreactHooks();

/**
 * Button 컴포넌트의 Props 인터페이스
 *
 * @interface ButtonProps
 * @description Button 컴포넌트에서 사용 가능한 모든 속성들을 정의합니다.
 *
 * @example
 * ```tsx
 * const buttonProps: ButtonProps = {
 *   variant: 'primary',
 *   size: 'medium',
 *   loading: true,
 *   onClick: handleClick,
 *   children: '로딩 중...'
 * };
 * ```
 */
export interface ButtonProps {
  /** 버튼 내용 (텍스트, 아이콘 등) */
  children: ComponentChildren;
  /** 버튼 변형 스타일 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** 버튼 크기 */
  size?: 'small' | 'medium' | 'large';
  /** 버튼 비활성화 여부 */
  disabled?: boolean;
  /**
   * 로딩 상태 여부
   *
   * @description
   * true일 때 버튼에 스피너가 표시되고 클릭이 비활성화됩니다.
   * 비동기 작업(파일 다운로드, API 호출 등) 진행 중임을 사용자에게 알립니다.
   *
   * @example
   * ```tsx
   * // 다운로드 진행 중 로딩 상태 표시
   * <Button loading={isDownloading} onClick={handleDownload}>
   *   {isDownloading ? '다운로드 중...' : '다운로드'}
   * </Button>
   * ```
   *
   * @default false
   */
  loading?: boolean;
  /** 클릭 이벤트 핸들러 */
  onClick?: (event: MouseEvent) => void;
  /** 버튼 타입 */
  type?: 'button' | 'submit' | 'reset';
  /** 추가 CSS 클래스 */
  className?: string;
  /** 접근성 레이블 */
  'aria-label'?: string;
  /** 텍스트 앞에 표시할 아이콘 */
  icon?: ComponentChildren;
  /** 아이콘만 표시 여부 (텍스트 숨김) */
  iconOnly?: boolean;
}

/**
 * Button 컴포넌트
 *
 * X.com Enhanced Gallery에서 사용되는 재사용 가능한 버튼 컴포넌트입니다.
 * 다양한 스타일, 크기, 상태를 지원하며 접근성을 고려하여 설계되었습니다.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'medium',
      disabled = false,
      loading = false,
      type = 'button',
      className = '',
      'aria-label': ariaLabel,
      icon,
      iconOnly = false,
      onClick,
      ...props
    },
    ref
  ) => {
    /**
     * 버튼 클릭 이벤트 핸들러
     *
     * @description
     * 버튼이 비활성화되거나 로딩 중일 때는 클릭을 방지하고,
     * 그렇지 않으면 전달받은 onClick 핸들러를 실행합니다.
     *
     * @param event - 클릭 이벤트 객체
     */
    const handleClick = (event: Event) => {
      if (disabled || loading) {
        event.preventDefault();
        return;
      }
      onClick?.(event as MouseEvent);
    };

    const buttonClasses = [
      styles.button,
      styles[variant],
      styles[size],
      loading && styles.loading,
      disabled && styles.disabled,
      iconOnly && styles.iconOnly,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses}
        disabled={disabled || loading}
        onClick={handleClick}
        aria-label={ariaLabel}
        {...props}
      >
        {loading ? (
          <span className={styles.spinner} aria-hidden='true' />
        ) : (
          <>
            {icon && <span className={styles.icon}>{icon}</span>}
            {!iconOnly && <span className={styles.text}>{children}</span>}
          </>
        )}
      </button>
    );
  }
);

// displayName 설정을 안전한 방법으로 변경
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(Button as any).displayName = 'Button';

export default Button;
