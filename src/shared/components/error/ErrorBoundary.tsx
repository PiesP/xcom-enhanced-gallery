/**
 * TDD Phase 5b - ErrorBoundary 컴포넌트
 * React 스타일 에러 경계 (Preact 호환)
 */

import { getPreact, type ComponentChildren } from '@shared/external/vendors';
import { ErrorLogger } from '../../error/ErrorLogger';

/**
 * ErrorBoundary Props
 */
export interface ErrorBoundaryProps {
  /** 에러 발생 시 콜백 */
  onError?: (error: Error, errorInfo: { componentStack: string }) => void;
  /** Fallback UI */
  fallback?: unknown;
  /** 자식 컴포넌트 */
  children: ComponentChildren;
}

/**
 * ErrorBoundary State
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary 컴포넌트
 * React componentDidCatch 패턴을 Preact에서 구현
 */
const { Component } = getPreact();

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * 에러 캐치 및 처리
   */
  override componentDidCatch(error: Error, errorInfo: { componentStack: string }): void {
    // 상태 업데이트
    this.setState({
      hasError: true,
      error,
    });

    // 외부 콜백 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // ErrorLogger를 통한 로깅
    const logger = ErrorLogger.getInstance();
    logger.logError(error, { context: 'ErrorBoundary' });
  }

  /**
   * 에러 상태 리셋
   */
  resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI 렌더링
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <div className='error-boundary'>
          <h2>Something went wrong</h2>
          <button onClick={this.resetError}>Try again</button>
        </div>
      );
    }

    return this.props.children;
  }
}
