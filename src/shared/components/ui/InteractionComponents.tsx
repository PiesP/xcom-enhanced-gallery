/**
 * @fileoverview InteractionComponents - UI/UX 최적화된 상호작용 컴포넌트들
 * @description 접근성과 사용자 경험을 고려한 인터랙티브 요소들
 * - 키보드 접근성 보장
 * - 터치/마우스 최적화
 * - 애니메이션 및 피드백
 * - 반응형 디자인
 */

import { getPreactHooks } from '@shared/external/vendors';
import { getAccessibilityManager } from '@shared/utils/accessibility/AccessibilityManager';
import { styleUtils } from '@shared/styles';

const { useState, useEffect, useRef, useCallback } = getPreactHooks();

/**
 * 버튼 Props 인터페이스
 */
export interface AccessibleButtonProps {
  children: preact.ComponentChildren;
  onClick?: (event: MouseEvent | KeyboardEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  testId?: string;
}

/**
 * 접근성 최적화 버튼 컴포넌트
 * WCAG 2.1.1 Keyboard + 2.4.7 Focus Visible 준수
 */
export function AccessibleButton(props: AccessibleButtonProps) {
  const {
    children,
    onClick,
    onFocus,
    onBlur,
    disabled = false,
    variant = 'primary',
    size = 'md',
    ariaLabel,
    ariaDescribedBy,
    className = '',
    type = 'button',
    testId,
  } = props;

  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // 클릭 핸들러 (마우스 + 키보드)
  const handleActivation = useCallback(
    (event: MouseEvent | KeyboardEvent) => {
      if (disabled) return;

      if (event instanceof KeyboardEvent) {
        // Enter 또는 Space만 허용
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
      }

      onClick?.(event);
    },
    [onClick, disabled]
  );

  // 포커스 관리
  const handleFocus = useCallback(
    (event: FocusEvent) => {
      setIsFocused(true);
      onFocus?.(event);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (event: FocusEvent) => {
      setIsFocused(false);
      setIsPressed(false);
      onBlur?.(event);
    },
    [onBlur]
  );

  // 키보드 상호작용
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      setIsPressed(true);
    }
  }, []);

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        setIsPressed(false);
        handleActivation(event);
      }
    },
    [handleActivation]
  );

  // 마우스 상호작용
  const handleMouseDown = useCallback(() => {
    setIsPressed(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsPressed(false);
  }, []);

  // 동적 클래스 생성
  const computedClassName = [
    'xeg-button',
    `xeg-button--${variant}`,
    `xeg-button--${size}`,
    isFocused && 'xeg-button--focused',
    isPressed && 'xeg-button--pressed',
    disabled && 'xeg-button--disabled',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={buttonRef}
      type={type}
      className={computedClassName}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      data-testid={testId}
      onClick={handleActivation}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </button>
  );
}

/**
 * 툴팁 Props 인터페이스
 */
export interface TooltipProps {
  children: preact.ComponentChildren;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * 접근성 최적화 툴팁 컴포넌트
 * WCAG 1.4.13 Content on Hover or Focus 준수
 */
export function Tooltip(props: TooltipProps) {
  const {
    children,
    content,
    position = 'top',
    delay = 500,
    disabled = false,
    className = '',
  } = props;

  const [isVisible, setIsVisible] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  // 툴팁 표시 로직
  const showTooltip = useCallback(() => {
    if (disabled) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setShouldShow(true);
      setIsVisible(true);
    }, delay);
  }, [disabled, delay]);

  // 툴팁 숨김 로직
  const hideTooltip = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setShouldShow(false);
    setIsVisible(false);
  }, []);

  // ESC 키로 툴팁 닫기
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        hideTooltip();
      }
    },
    [hideTooltip]
  );

  useEffect(() => {
    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isVisible, handleKeyDown]);

  // 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const tooltipClassName = [
    'xeg-tooltip',
    `xeg-tooltip--${position}`,
    isVisible && 'xeg-tooltip--visible',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className='xeg-tooltip-wrapper' style={{ position: 'relative', display: 'inline-block' }}>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        style={{ display: 'contents' }}
      >
        {children}
      </div>
      {shouldShow && (
        <div
          ref={tooltipRef}
          role='tooltip'
          className={tooltipClassName}
          aria-live='polite'
          style={{
            position: 'absolute',
            zIndex: 9999,
            pointerEvents: 'none',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
}

/**
 * 모달 Props 인터페이스
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: preact.ComponentChildren;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  testId?: string;
}

/**
 * 접근성 최적화 모달 컴포넌트
 * WCAG 2.4.3 Focus Order + 2.1.2 No Keyboard Trap 준수
 */
export function Modal(props: ModalProps) {
  const {
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    closeOnBackdrop = true,
    closeOnEscape = true,
    className = '',
    testId,
  } = props;

  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const accessibilityManager = getAccessibilityManager();

  // 모달 열기/닫기 효과
  useEffect(() => {
    if (isOpen) {
      // 현재 포커스 저장
      previousFocusRef.current = document.activeElement as HTMLElement;

      // 모달에 포커스 설정
      if (modalRef.current) {
        modalRef.current.focus();

        // 접근성 관리자에 모달 등록
        accessibilityManager.initializeGalleryAccessibility(modalRef.current);
        accessibilityManager.announceGalleryStateChange('opened', title);
      }

      // 바디 스크롤 방지
      document.body.style.overflow = 'hidden';
    } else {
      // 이전 포커스 복원
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }

      // 바디 스크롤 복원
      document.body.style.overflow = '';

      // 접근성 알림
      accessibilityManager.announceGalleryStateChange('closed');
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, title, accessibilityManager]);

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  // 백드롭 클릭 처리
  const handleBackdropClick = useCallback(
    (event: MouseEvent) => {
      if (closeOnBackdrop && event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose, closeOnBackdrop]
  );

  if (!isOpen) return null;

  const modalClassName = ['xeg-modal', `xeg-modal--${size}`, className].filter(Boolean).join(' ');

  return (
    <div
      className='xeg-modal-backdrop'
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        ref={modalRef}
        role='dialog'
        aria-modal='true'
        aria-label={title}
        className={modalClassName}
        tabIndex={-1}
        data-testid={testId}
        style={{
          backgroundColor: 'var(--xeg-color-surface)',
          borderRadius: 'var(--xeg-radius-lg)',
          boxShadow: 'var(--xeg-shadow-xl)',
          maxHeight: '90vh',
          overflow: 'auto',
          outline: 'none',
        }}
      >
        {title && (
          <div className='xeg-modal-header' style={{ padding: 'var(--xeg-spacing-lg)' }}>
            <h2 style={{ margin: 0, fontSize: 'var(--xeg-font-size-xl)' }}>{title}</h2>
            <AccessibleButton
              variant='ghost'
              size='sm'
              onClick={onClose}
              ariaLabel='모달 닫기'
              className='xeg-modal-close'
            >
              ✕
            </AccessibleButton>
          </div>
        )}
        <div className='xeg-modal-body' style={{ padding: 'var(--xeg-spacing-lg)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * 프로그레스 바 Props 인터페이스
 */
export interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

/**
 * 접근성 최적화 프로그레스 바
 * WCAG 4.1.2 Name, Role, Value 준수
 */
export function ProgressBar(props: ProgressBarProps) {
  const {
    value,
    max = 100,
    size = 'md',
    variant = 'default',
    showLabel = false,
    label,
    className = '',
    animated = false,
  } = props;

  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const accessibilityManager = getAccessibilityManager();

  useEffect(() => {
    if (showLabel && label) {
      accessibilityManager.announceGalleryStateChange(
        'loading',
        `${label}: ${Math.round(percentage)}%`
      );
    }
  }, [percentage, label, showLabel, accessibilityManager]);

  const progressClassName = [
    'xeg-progress',
    `xeg-progress--${size}`,
    `xeg-progress--${variant}`,
    animated && 'xeg-progress--animated',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={progressClassName}>
      {showLabel && label && (
        <div className='xeg-progress-label' style={{ marginBottom: 'var(--xeg-spacing-xs)' }}>
          {label} ({Math.round(percentage)}%)
        </div>
      )}
      <div
        role='progressbar'
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `${Math.round(percentage)}% 완료`}
        className='xeg-progress-track'
        style={{
          width: '100%',
          height: size === 'sm' ? '4px' : size === 'lg' ? '12px' : '8px',
          backgroundColor: 'var(--xeg-color-surface-variant)',
          borderRadius: 'var(--xeg-radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          className='xeg-progress-fill'
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: `var(--xeg-color-${variant === 'default' ? 'primary' : variant})`,
            borderRadius: 'var(--xeg-radius-full)',
            transition: animated ? 'width 0.3s ease-in-out' : 'none',
          }}
        />
      </div>
    </div>
  );
}

/**
 * 로딩 스피너 Props 인터페이스
 */
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

/**
 * 접근성 최적화 로딩 스피너
 * WCAG 4.1.3 Status Messages 준수
 */
export function LoadingSpinner(props: LoadingSpinnerProps) {
  const { size = 'md', label = '로딩 중...', className = '' } = props;

  const spinnerClassName = ['xeg-spinner', `xeg-spinner--${size}`, className]
    .filter(Boolean)
    .join(' ');

  const spinnerSize = size === 'sm' ? '16px' : size === 'lg' ? '32px' : '24px';

  return (
    <div
      role='status'
      aria-live='polite'
      aria-label={label}
      className={spinnerClassName}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--xeg-spacing-sm)',
      }}
    >
      <div
        className='xeg-spinner-icon'
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: '2px solid var(--xeg-color-surface-variant)',
          borderTop: '2px solid var(--xeg-color-primary)',
          borderRadius: '50%',
          animation: 'xeg-spin 1s linear infinite',
        }}
      />
      <span className='sr-only'>{label}</span>
    </div>
  );
}

// CSS 애니메이션을 동적으로 추가
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes xeg-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;
  document.head.appendChild(style);
}
