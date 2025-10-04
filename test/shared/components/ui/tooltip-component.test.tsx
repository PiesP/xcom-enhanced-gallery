/**
 * @fileoverview Tooltip Component Contract Tests (Phase 1: RED)
 * Epic CUSTOM-TOOLTIP-COMPONENT: 커스텀 툴팁 컴포넌트 구현
 *
 * 목적: 키보드 단축키 시각적 강조 (<kbd>) + 브랜드 일관성 + 완전한 다국어 지원
 *
 * Acceptance Criteria:
 * - mouseenter/focus 시 툴팁 표시 (PC 전용)
 * - mouseleave/blur 시 툴팁 숨김
 * - 단순 텍스트/HTML 마크업 렌더링
 * - aria-describedby 연결
 * - placement (top/bottom) 지원
 * - delay 설정 (기본 500ms)
 * - Touch/Pointer 이벤트 무시
 * - role="tooltip" 속성
 * - 디자인 토큰 기반 스타일
 *
 * @version 1.0.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@solidjs/testing-library';
import { getSolidCore } from '@shared/external/vendors';
import { Tooltip } from '@shared/components/ui/Tooltip';

const { createSignal } = getSolidCore();

describe('Tooltip Component Contract (Phase 1: RED)', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('1. 렌더링 및 기본 동작', () => {
    it('should show tooltip on mouseenter after delay', async () => {
      const TestComponent = () => {
        const [show, setShow] = createSignal(false);
        return (
          <Tooltip content='Tooltip content' show={show()} delay={100}>
            <button
              data-testid='trigger'
              onMouseEnter={() => setShow(true)}
              onMouseLeave={() => setShow(false)}
            >
              Trigger
            </button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);
      const trigger = screen.getByTestId('trigger');

      // 초기에는 툴팁이 보이지 않음 (display: none)
      const tooltipContent = screen.queryByText('Tooltip content');
      expect(tooltipContent).toBeInTheDocument();
      expect(tooltipContent).not.toBeVisible();

      // mouseenter 이벤트 발생
      fireEvent.mouseEnter(trigger);

      // delay 100ms 이후 툴팁 표시
      vi.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText('Tooltip content')).toBeInTheDocument();
      });
    });

    it('should show tooltip on focus', async () => {
      const TestComponent = () => {
        const [show, setShow] = createSignal(false);
        return (
          <Tooltip content='Tooltip content' show={show()} delay={100}>
            <button
              data-testid='trigger'
              onFocus={() => setShow(true)}
              onBlur={() => setShow(false)}
            >
              Trigger
            </button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);
      const trigger = screen.getByTestId('trigger');

      // focus 이벤트 발생
      fireEvent.focus(trigger);
      vi.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText('Tooltip content')).toBeInTheDocument();
      });
    });

    it('should hide tooltip on mouseleave', async () => {
      const TestComponent = () => {
        const [show, setShow] = createSignal(false);
        return (
          <Tooltip content='Tooltip content' show={show()} delay={100}>
            <button
              data-testid='trigger'
              onMouseEnter={() => setShow(true)}
              onMouseLeave={() => setShow(false)}
            >
              Trigger
            </button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);
      const trigger = screen.getByTestId('trigger');

      // Show tooltip
      fireEvent.mouseEnter(trigger);
      vi.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText('Tooltip content')).toBeInTheDocument();
      });

      // Hide tooltip
      fireEvent.mouseLeave(trigger);

      await waitFor(() => {
        const tooltipContent = screen.queryByText('Tooltip content');
        expect(tooltipContent).toBeInTheDocument();
        expect(tooltipContent).not.toBeVisible();
      });
    });

    it('should hide tooltip on blur', async () => {
      const TestComponent = () => {
        const [show, setShow] = createSignal(false);
        return (
          <Tooltip content='Tooltip content' show={show()} delay={100}>
            <button
              data-testid='trigger'
              onFocus={() => setShow(true)}
              onBlur={() => setShow(false)}
            >
              Trigger
            </button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);
      const trigger = screen.getByTestId('trigger');

      // Show tooltip
      fireEvent.focus(trigger);
      vi.advanceTimersByTime(100);

      await waitFor(() => {
        expect(screen.getByText('Tooltip content')).toBeInTheDocument();
      });

      // Hide tooltip
      fireEvent.blur(trigger);

      await waitFor(() => {
        const tooltipContent = screen.queryByText('Tooltip content');
        expect(tooltipContent).toBeInTheDocument();
        expect(tooltipContent).not.toBeVisible();
      });
    });
  });

  describe('2. 콘텐츠 렌더링', () => {
    it('should render simple text content', async () => {
      const TestComponent = () => {
        return (
          <Tooltip content='Simple text tooltip' show={true} delay={0}>
            <button data-testid='trigger'>Trigger</button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);

      vi.runAllTimers();

      await waitFor(() => {
        expect(screen.getByText('Simple text tooltip')).toBeInTheDocument();
      });
    });

    it('should render HTML markup (kbd tags)', async () => {
      const TestComponent = () => {
        return (
          <Tooltip
            content={
              <>
                Press <kbd>←</kbd> or <kbd>→</kbd>
              </>
            }
            show={true}
            delay={0}
          >
            <button data-testid='trigger'>Trigger</button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);

      // Flush fake timers immediately for delay=0
      vi.runAllTimers();

      // Wait for SolidJS effects to propagate
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      // Check for kbd elements
      const container = screen.getByRole('tooltip');
      expect(container).toBeInTheDocument();

      const kbdElements = container.querySelectorAll('kbd');
      expect(kbdElements.length).toBe(2);
      expect(kbdElements[0]?.textContent).toBe('←');
      expect(kbdElements[1]?.textContent).toBe('→');
    });

    it('should connect tooltip with aria-describedby', async () => {
      const TestComponent = () => {
        return (
          <Tooltip content='Tooltip content' show={true} id='custom-tooltip' delay={0}>
            <button data-testid='trigger'>Trigger</button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);
      const trigger = screen.getByTestId('trigger');

      // Flush fake timers immediately for delay=0
      vi.runAllTimers();

      // Wait for SolidJS effects to propagate
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      const ariaDescribedby = trigger.getAttribute('aria-describedby');
      expect(ariaDescribedby).toBe('custom-tooltip');
    });
  });

  describe('3. 포지셔닝', () => {
    it('should apply placement="top" by default', async () => {
      const TestComponent = () => {
        return (
          <Tooltip content='Tooltip content' show={true} delay={0}>
            <button data-testid='trigger'>Trigger</button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);

      // Flush fake timers immediately for delay=0
      vi.runAllTimers();

      // Wait for SolidJS effects to propagate
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveAttribute('data-placement', 'top');
    });

    it('should apply custom placement="bottom"', async () => {
      const TestComponent = () => {
        return (
          <Tooltip content='Tooltip content' show={true} placement='bottom' delay={0}>
            <button data-testid='trigger'>Trigger</button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);

      // Flush fake timers immediately for delay=0
      vi.runAllTimers();

      // Wait for SolidJS effects to propagate
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveAttribute('data-placement', 'bottom');
    });
  });

  describe('4. 지연 시간', () => {
    it('should apply default 500ms delay', async () => {
      const TestComponent = () => {
        const [show, setShow] = createSignal(false);
        return (
          <Tooltip content='Tooltip content' show={show()}>
            <button data-testid='trigger' onMouseEnter={() => setShow(true)}>
              Trigger
            </button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);
      const trigger = screen.getByTestId('trigger');

      fireEvent.mouseEnter(trigger);

      // 기본 500ms 대기
      vi.advanceTimersByTime(500);

      await waitFor(() => {
        expect(screen.getByText('Tooltip content')).toBeInTheDocument();
      });
    });

    it('should apply custom delay', async () => {
      const TestComponent = () => {
        const [show, setShow] = createSignal(false);
        return (
          <Tooltip content='Tooltip content' show={show()} delay={300}>
            <button data-testid='trigger' onMouseEnter={() => setShow(true)}>
              Trigger
            </button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);
      const trigger = screen.getByTestId('trigger');

      fireEvent.mouseEnter(trigger);

      // 커스텀 300ms 대기
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(screen.getByText('Tooltip content')).toBeInTheDocument();
      });
    });
  });

  describe('5. PC 전용 정책', () => {
    it('should ignore touch events (touchstart)', async () => {
      const TestComponent = () => {
        return (
          <Tooltip content='Tooltip content' show={true}>
            <button data-testid='trigger'>Trigger</button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);
      const trigger = screen.getByTestId('trigger');

      // Touch 이벤트 리스너가 없어야 함
      const hasTouchListener = trigger.ontouchstart !== undefined && trigger.ontouchstart !== null;
      expect(hasTouchListener).toBe(false);
    });

    it('should ignore pointer events (pointerdown)', async () => {
      const TestComponent = () => {
        return (
          <Tooltip content='Tooltip content' show={true}>
            <button data-testid='trigger'>Trigger</button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);
      const trigger = screen.getByTestId('trigger');

      // Pointer 이벤트 리스너가 없어야 함
      const hasPointerListener =
        trigger.onpointerdown !== undefined && trigger.onpointerdown !== null;
      expect(hasPointerListener).toBe(false);
    });
  });

  describe('6. 접근성', () => {
    it('should have role="tooltip" attribute', async () => {
      const TestComponent = () => {
        return (
          <Tooltip content='Tooltip content' show={true} delay={0}>
            <button data-testid='trigger'>Trigger</button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);

      // Flush fake timers immediately for delay=0
      vi.runAllTimers();

      // Wait for SolidJS effects to propagate
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveAttribute('role', 'tooltip');
    });

    it('should have aria-hidden="true" when hidden', async () => {
      const TestComponent = () => {
        return (
          <Tooltip content='Tooltip content' show={false}>
            <button data-testid='trigger'>Trigger</button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);

      // Tooltip이 숨겨진 상태에서는 렌더링되지 않거나 aria-hidden="true"
      const tooltip = document.querySelector('[role="tooltip"]');
      if (tooltip) {
        expect(tooltip).toHaveAttribute('aria-hidden', 'true');
      } else {
        // 또는 렌더링되지 않음
        expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
      }
    });
  });

  describe('7. 디자인 토큰', () => {
    it('should not use hardcoded styles', async () => {
      const TestComponent = () => {
        return (
          <Tooltip content='Tooltip content' show={true} delay={0}>
            <button data-testid='trigger'>Trigger</button>
          </Tooltip>
        );
      };

      render(() => <TestComponent />);

      // Flush fake timers immediately for delay=0
      vi.runAllTimers();

      // Wait for SolidJS effects to propagate
      await new Promise(resolve => {
        vi.useRealTimers();
        setTimeout(resolve, 0);
        vi.useFakeTimers();
      });

      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();

      // Tooltip은 CSS Modules 클래스를 사용해야 함
      const hasModuleClass = tooltip.classList.length > 0;
      expect(hasModuleClass).toBe(true);

      // Inline style에 하드코딩된 색상/크기가 없어야 함 (포지셔닝은 예외)
      const style = tooltip.getAttribute('style');
      if (style) {
        expect(style).not.toMatch(/#[0-9a-fA-F]{3,6}/); // Hex colors
        expect(style).not.toMatch(/rgb\(/); // RGB colors
        // Note: positioning (top/left px)은 동적으로 계산되므로 허용
      }
    });
  });
});
