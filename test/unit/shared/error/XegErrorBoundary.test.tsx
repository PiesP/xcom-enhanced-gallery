/**
 * @fileoverview XegErrorBoundary 테스트
 * @description TDD RED → GREEN → REFACTOR 방식으로 ErrorBoundary 구현
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { h } from 'preact';

// 테스트 대상 (아직 구현되지 않음)
import { XegErrorBoundary } from '@shared/error/XegErrorBoundary';

// 에러를 발생시킬 테스트 컴포넌트
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return h('div', { 'data-testid': 'success' }, 'Success');
}

describe('XegErrorBoundary (TDD)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 콘솔 에러 숨기기 (테스트 목적)
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('RED: 기본 ErrorBoundary 기능', () => {
    test('에러가 없을 때 children을 정상 렌더링해야 함', () => {
      render(h(XegErrorBoundary, { children: h(ThrowError, { shouldThrow: false }) }));

      expect(screen.getByTestId('success')).toBeInTheDocument();
    });

    test('에러 발생 시 fallback UI를 표시해야 함', () => {
      render(h(XegErrorBoundary, { children: h(ThrowError, { shouldThrow: true }) }));

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    test('커스텀 fallback 컴포넌트를 지원해야 함', () => {
      const customFallback = h('div', { 'data-testid': 'custom-fallback' }, 'Custom Error');

      render(
        h(XegErrorBoundary, {
          fallback: customFallback,
          children: h(ThrowError, { shouldThrow: true }),
        })
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });

    test('에러 정보를 fallback render function에 전달해야 함', () => {
      const fallbackRender = vi.fn((error: Error) =>
        h('div', { 'data-testid': 'error-info' }, `Error: ${error.message}`)
      );

      render(
        h(XegErrorBoundary, { fallbackRender, children: h(ThrowError, { shouldThrow: true }) })
      );

      expect(fallbackRender).toHaveBeenCalledWith(expect.any(Error));
      expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    });
  });

  describe('GREEN: 로깅 통합', () => {
    test('에러를 logger에 기록해야 함', async () => {
      // logger mock 설정
      const mockLogger = vi.hoisted(() => ({
        error: vi.fn(),
      }));

      vi.mock('@shared/logging/logger', () => ({
        logger: mockLogger,
      }));

      render(h(XegErrorBoundary, { children: h(ThrowError, { shouldThrow: true }) }));

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[XegErrorBoundary] Component error caught:',
        expect.any(Error),
        expect.objectContaining({
          errorInfo: expect.any(Object),
          timestamp: expect.any(Number),
        })
      );
    });
  });

  describe('REFACTOR: 사용자 경험 개선', () => {
    test('재시도 버튼을 제공해야 함', () => {
      render(h(XegErrorBoundary, { children: h(ThrowError, { shouldThrow: true }) }));

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    test('재시도 시 에러 상태를 초기화해야 함', async () => {
      const { rerender } = render(
        h(XegErrorBoundary, { children: h(ThrowError, { shouldThrow: true }) })
      );

      // 에러 상태 확인
      expect(screen.getByRole('alert')).toBeInTheDocument();

      // 재시도 버튼 클릭
      const retryButton = screen.getByRole('button', { name: /retry/i });
      retryButton.click();

      // children 다시 렌더링하되 에러 없이
      rerender(h(XegErrorBoundary, { children: h(ThrowError, { shouldThrow: false }) }));

      expect(screen.getByTestId('success')).toBeInTheDocument();
    });
  });
});
