/**
 * Enhanced Tooltip Component
 * 핏 모드 버튼들의 직관성 개선을 위한 향상된 툴팁
 */

import { getPreact, getPreactHooks, type VNode } from '@shared/external/vendors';
import styles from './EnhancedTooltip.module.css';

export interface EnhancedTooltipProps {
  /** 툴팁 텍스트 */
  text: string;
  /** 설명 텍스트 (선택사항) */
  description?: string;
  /** 툴팁 위치 */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** 지연 시간 (ms) */
  delay?: number;
  /** 자식 요소 */
  children: VNode;
  /** 코치 마크 활성화 여부 */
  showCoachMark?: boolean;
  /** 코치 마크 텍스트 */
  coachMarkText?: string;
}

export function EnhancedTooltip({
  text,
  description,
  position = 'top',
  delay = 300,
  children,
  showCoachMark = false,
  coachMarkText,
}: EnhancedTooltipProps): VNode {
  const { h } = getPreact();
  const { useState, useEffect, useRef } = getPreactHooks();
  const [isVisible, setIsVisible] = useState(false);
  const [showCoach, setShowCoach] = useState(showCoachMark);
  const timeoutRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  const handleCoachMarkClose = () => {
    setShowCoach(false);
    // 코치 마크 표시 여부를 localStorage에 저장
    localStorage.setItem('xeg-fit-mode-guide-shown', 'true');
  };

  useEffect(() => {
    // 컴포넌트 정리 시 타이머 클리어
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return h(
    'div',
    {
      className: styles.tooltipContainer,
      ref: containerRef,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    [
      // 자식 요소
      children,

      // 향상된 툴팁
      isVisible &&
        h(
          'div',
          {
            className: `${styles.tooltip} ${styles[`tooltip--${position}`]}`,
            role: 'tooltip',
            'aria-hidden': !isVisible,
          },
          [
            h('div', { className: styles.tooltipTitle }, text),
            description && h('div', { className: styles.tooltipDescription }, description),
            // 화살표
            h('div', { className: `${styles.tooltipArrow} ${styles[`arrow--${position}`]}` }),
          ]
        ),

      // 코치 마크
      showCoach &&
        coachMarkText &&
        h(
          'div',
          {
            className: styles.coachMark,
            role: 'dialog',
            'aria-label': '기능 안내',
          },
          [
            h('div', { className: styles.coachMarkContent }, [
              h('div', { className: styles.coachMarkText }, coachMarkText),
              h(
                'button',
                {
                  className: styles.coachMarkClose,
                  onClick: handleCoachMarkClose,
                  'aria-label': '안내 닫기',
                },
                '✕'
              ),
            ]),
            h('div', { className: styles.coachMarkArrow }),
          ]
        ),
    ]
  );
}
