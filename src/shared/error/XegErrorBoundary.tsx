/**
 * @fileoverview XegErrorBoundary - Preact Error Boundary 컴포넌트
 * @description UI 레벨 에러 경계 + fallback UI + 로깅 통합
 * @version 1.0.0 - TDD GREEN 구현
 */

import { Component, type ComponentChildren, type VNode } from 'preact';
import { logger } from '@shared/logging/logger';
import { getPreact } from '@shared/external/vendors';

const { h } = getPreact();

/**
 * ErrorBoundary Props
 */
export interface XegErrorBoundaryProps {
  /** 에러 발생 시 표시할 fallback UI */
  fallback?: VNode;
  /** 에러 정보를 받아 fallback을 렌더링하는 함수 */
  fallbackRender?: (error: Error) => VNode;
  /** 에러 발생 시 호출될 콜백 */
  onError?: (error: Error, errorInfo: Record<string, unknown>) => void;
  /** children */
  children: ComponentChildren;
}

/**
 * ErrorBoundary State
 */
interface XegErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * 기본 에러 fallback UI
 */
function DefaultErrorFallback({ onRetry }: { error: Error; onRetry: () => void }): VNode {
  return h(
    'div',
    {
      role: 'alert',
      className: 'xeg-error-boundary',
      style: {
        padding: '24px',
        border: '1px solid #f87171',
        borderRadius: '8px',
        backgroundColor: '#fef2f2',
        color: '#dc2626',
        textAlign: 'center' as const,
        margin: '16px',
      },
    },
    [
      h('h3', { style: { margin: '0 0 12px 0', fontSize: '18px' } }, 'Something went wrong'),
      h(
        'p',
        { style: { margin: '0 0 16px 0', fontSize: '14px', color: '#7f1d1d' } },
        'An unexpected error occurred. Please try again.'
      ),
      h(
        'button',
        {
          onClick: onRetry,
          style: {
            padding: '8px 16px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          },
        },
        'Retry'
      ),
    ]
  );
}

/**
 * XegErrorBoundary - Preact Error Boundary
 */
export class XegErrorBoundary extends Component<XegErrorBoundaryProps, XegErrorBoundaryState> {
  constructor(props: XegErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * 에러 발생 시 상태 업데이트
   */
  static override getDerivedStateFromError(error: Error): Partial<XegErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * 에러 캐치 시 로깅 및 콜백 실행
   */
  override componentDidCatch(error: Error, errorInfo: Record<string, unknown>): void {
    // 로깅
    logger.error('[XegErrorBoundary] Component error caught:', error, {
      errorInfo,
      timestamp: Date.now(),
    });

    // 사용자 정의 에러 핸들러 호출
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (callbackError) {
        logger.error('[XegErrorBoundary] Error in onError callback:', callbackError);
      }
    }
  }

  /**
   * 에러 상태 재설정 (재시도)
   */
  private readonly resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  /**
   * 렌더링
   */
  render(): VNode | ComponentChildren {
    const { hasError, error } = this.state;
    const { children, fallback, fallbackRender } = this.props;

    // 에러가 없으면 children 렌더링
    if (!hasError || !error) {
      return children;
    }

    // 커스텀 fallbackRender 함수가 있으면 사용
    if (fallbackRender) {
      try {
        return fallbackRender(error);
      } catch (renderError) {
        logger.error('[XegErrorBoundary] Error in fallbackRender:', renderError);
        // fallback으로 기본 UI 표시
      }
    }

    // 커스텀 fallback이 있으면 사용
    if (fallback) {
      return fallback;
    }

    // 기본 에러 UI
    return h(DefaultErrorFallback, {
      error,
      onRetry: this.resetError,
    });
  }
}

/**
 * 함수형 래퍼 (편의 함수)
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: (props: P) => VNode,
  errorBoundaryProps?: Omit<XegErrorBoundaryProps, 'children'>
) {
  return function ErrorBoundaryWrapper(props: P): VNode {
    return h(XegErrorBoundary, { ...errorBoundaryProps, children: h(WrappedComponent, props) });
  };
}

export default XegErrorBoundary;
