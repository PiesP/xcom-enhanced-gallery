/**
 * @fileoverview Tooltip Component
 * Epic CUSTOM-TOOLTIP-COMPONENT: 커스텀 툴팁 컴포넌트
 *
 * 목적: 키보드 단축키 시각적 강조 + 브랜드 일관성 + 완전한 다국어 지원
 *
 * Features:
 * - PC 전용 이벤트 (mouseenter/focus, mouseleave/blur)
 * - 단순 텍스트 및 HTML 마크업 지원 (JSX.Element)
 * - aria-describedby 연결
 * - placement (top/bottom)
 * - delay 설정 (기본 500ms)
 * - WCAG 2.1 Level AA 준수
 * - 디자인 토큰 기반 스타일
 *
 * @version 1.0.0
 */

import type { JSX, ParentComponent } from 'solid-js';
import { getSolidCore } from '@shared/external/vendors';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  /** 툴팁에 표시할 콘텐츠 (문자열 또는 JSX) */
  readonly content: string | JSX.Element;
  /** 툴팁 표시 여부 */
  readonly show: boolean;
  /** 툴팁 위치 (기본값: 'top') */
  readonly placement?: 'top' | 'bottom';
  /** 표시 지연 시간 (ms, 기본값: 500) */
  readonly delay?: number;
  /** 툴팁 ID (aria-describedby 연결용) */
  readonly id?: string;
  /** 트리거 요소 (children) */
  readonly children: JSX.Element;
}

export const Tooltip: ParentComponent<TooltipProps> = props => {
  const solid = getSolidCore();
  const { createMemo, createSignal, createEffect, onCleanup } = solid;

  const [tooltipEl, setTooltipEl] = createSignal<HTMLDivElement | undefined>(undefined);
  const [triggerEl, setTriggerEl] = createSignal<HTMLElement | undefined>(undefined);

  // 초기값: delay=0이고 show=true이면 즉시 true로 시작
  const initialShow = props.delay === 0 && props.show;
  const [internalShow, setInternalShow] = createSignal(initialShow);

  const tooltipId = createMemo(() => props.id ?? `tooltip-${Math.random().toString(36).slice(2)}`);
  const placement = createMemo(() => props.placement ?? 'top');
  const delay = createMemo(() => props.delay ?? 500);

  // show prop이 변경되면 delay 후 내부 상태 업데이트
  createEffect(() => {
    const shouldShow = props.show;
    const delayMs = delay();
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    if (shouldShow) {
      if (delayMs === 0) {
        // delay가 0이면 즉시 표시 (테스트 용이성)
        setInternalShow(true);
      } else {
        timeoutId = setTimeout(() => {
          setInternalShow(true);
        }, delayMs);
      }
    } else {
      setInternalShow(false);
    }

    onCleanup(() => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    });
  });

  // Trigger 요소에 aria-describedby 설정
  createEffect(() => {
    const triggerWrapper = triggerEl();
    if (!triggerWrapper) return;

    // Find the actual trigger element (첫 번째 자식 요소)
    const trigger = triggerWrapper.firstElementChild as HTMLElement;
    if (!trigger) return;

    if (internalShow()) {
      trigger.setAttribute('aria-describedby', tooltipId());
    } else {
      trigger.removeAttribute('aria-describedby');
    }
  });

  // Tooltip 포지셔닝 (트리거 요소 기준)
  createEffect(() => {
    const tooltip = tooltipEl();
    const trigger = triggerEl();

    if (!tooltip || !trigger || !internalShow()) {
      return;
    }

    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    const placementValue = placement();

    let top = 0;
    let left = 0;

    if (placementValue === 'top') {
      top = triggerRect.top - tooltipRect.height - 8;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    } else if (placementValue === 'bottom') {
      top = triggerRect.bottom + 8;
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
    }

    // 뷰포트 경계 확인 (간단한 fallback)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < 0) {
      left = 8;
    } else if (left + tooltipRect.width > viewportWidth) {
      left = viewportWidth - tooltipRect.width - 8;
    }

    if (top < 0) {
      top = 8;
    } else if (top + tooltipRect.height > viewportHeight) {
      top = viewportHeight - tooltipRect.height - 8;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  });

  return (
    <span ref={el => setTriggerEl(el)}>
      {props.children}
      <div
        ref={el => setTooltipEl(el)}
        role='tooltip'
        id={tooltipId()}
        class={styles.tooltip}
        data-placement={placement()}
        aria-hidden={!internalShow() ? 'true' : undefined}
        style={{
          display: internalShow() ? 'block' : 'none',
        }}
      >
        {props.content}
      </div>
    </span>
  );
};

export default Tooltip;
