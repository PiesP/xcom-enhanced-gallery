// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

/**
 * @fileoverview Tooltip component with intelligent positioning.
 *
 * Renders a custom tooltip on hover/focus via Portal to document.body.
 * Supports auto-flip between top/bottom placement, configurable delay,
 * and full accessibility (aria-describedby, role="tooltip").
 *
 * @module shared/components/ui/Tooltip/Tooltip
 */

import { TOOLTIP_HIDE_DELAY_MS, TOOLTIP_SHOW_DELAY_MS } from '@constants/performance';
import { cx } from '@shared/utils/text/formatting';
import type { JSXElement } from 'solid-js';
import { createMemo, createSignal, createUniqueId, onCleanup, splitProps } from 'solid-js';
import { Portal } from 'solid-js/web';
import styles from './Tooltip.module.css';
import type { TooltipPlacement, TooltipPosition, TooltipProps } from './Tooltip.types';

/** Default show delay (ms) — short enough to feel responsive, long enough to not flicker */
const DEFAULT_SHOW_DELAY = TOOLTIP_SHOW_DELAY_MS;
/** Default hide delay (ms) — prevents flicker when moving between adjacent tooltip targets */
const DEFAULT_HIDE_DELAY = TOOLTIP_HIDE_DELAY_MS;
/** Gap between tooltip and trigger element (px) */
const DEFAULT_OFFSET = 6;
/** Minimum distance from viewport edge (px) */
const VIEWPORT_PADDING = 8;

/**
 * Compute tooltip position relative to a trigger element.
 * Auto-flips between bottom/top based on available viewport space.
 */
function computePosition(
  triggerRect: DOMRect,
  preferredPlacement: TooltipPlacement,
  offset: number
): TooltipPosition {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const centerX = triggerRect.left + triggerRect.width / 2;

  // Determine actual placement based on available space
  const spaceBelow = viewportHeight - triggerRect.bottom - offset - VIEWPORT_PADDING;
  const spaceAbove = triggerRect.top - offset - VIEWPORT_PADDING;
  const useTop = preferredPlacement === 'top' || spaceBelow < 0;

  let y: number;
  let actualPlacement: TooltipPlacement;

  if (useTop && spaceAbove > 0) {
    actualPlacement = 'top';
    y = triggerRect.top - offset;
  } else {
    actualPlacement = 'bottom';
    y = triggerRect.bottom + offset;
  }

  // Clamp X to viewport bounds
  const x = Math.max(VIEWPORT_PADDING, Math.min(centerX, viewportWidth - VIEWPORT_PADDING));

  return { x, y, actualPlacement };
}

/**
 * Tooltip component.
 *
 * Wraps child elements with hover/focus handlers and renders a positioned
 * tooltip in a Portal. Uses `display: contents` on the trigger wrapper
 * so it does not affect layout.
 *
 * @example
 * ```tsx
 * <Tooltip content="Close gallery">
 *   <button>✕</button>
 * </Tooltip>
 * ```
 */
export function Tooltip(props: TooltipProps): JSXElement {
  const [local] = splitProps(props, [
    'offset',
    'showDelay',
    'hideDelay',
    'placement',
    'children',
    'content',
  ]);
  const tooltipId = createUniqueId();
  const [visible, setVisible] = createSignal(false);
  const [position, setPosition] = createSignal<TooltipPosition | null>(null);

  const offset = local.offset ?? DEFAULT_OFFSET;
  const showDelay = local.showDelay ?? DEFAULT_SHOW_DELAY;
  const hideDelay = local.hideDelay ?? DEFAULT_HIDE_DELAY;
  const preferredPlacement = local.placement ?? 'bottom';

  let triggerRef!: HTMLSpanElement;
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let positionRafId: ReturnType<typeof requestAnimationFrame> | undefined;

  const clearTimers = () => {
    if (showTimer !== undefined) {
      clearTimeout(showTimer);
      showTimer = undefined;
    }
    if (hideTimer !== undefined) {
      clearTimeout(hideTimer);
      hideTimer = undefined;
    }
    if (positionRafId !== undefined) {
      cancelAnimationFrame(positionRafId);
      positionRafId = undefined;
    }
  };

  const updatePosition = () => {
    if (!triggerRef) return;

    // Find the first child element (skip text nodes)
    const firstChild = triggerRef.firstElementChild;
    if (!(firstChild instanceof HTMLElement)) return;

    positionRafId = requestAnimationFrame(() => {
      const rect = firstChild.getBoundingClientRect();
      setPosition(computePosition(rect, preferredPlacement, offset));
    });
  };

  const show = () => {
    clearTimers();
    updatePosition();
    showTimer = setTimeout(() => {
      // Re-check position before showing (element may have moved)
      updatePosition();
      setVisible(true);
    }, showDelay);
  };

  const hide = () => {
    clearTimers();
    hideTimer = setTimeout(() => {
      setVisible(false);
      setPosition(null);
    }, hideDelay);
  };

  // Derived: only non-null when tooltip should render
  const activePosition = createMemo<TooltipPosition | null>(() => {
    const pos = position();
    return visible() && pos !== null ? pos : null;
  });

  // Derived: CSS style for tooltip positioning
  const tooltipStyle = createMemo((): Record<string, string> => {
    const pos = activePosition();
    if (pos === null) return {};
    return {
      left: `${pos.x}px`,
      top: `${pos.y}px`,
    } as Record<string, string>;
  });

  // Derived: combined class string using cx() (avoids classList computed-key TS issues)
  const tooltipClass = createMemo(() => {
    const pos = activePosition();
    if (pos === null) return styles.content;
    const placementClass =
      pos.actualPlacement === 'bottom' ? styles.placementBottom : styles.placementTop;
    return cx(styles.content, styles.visible, placementClass);
  });

  // Derived: arrow class
  const arrowClass = createMemo(() => {
    const pos = activePosition();
    if (pos === null) return styles.arrow;
    const placementClass =
      pos.actualPlacement === 'bottom' ? styles.placementBottomArrow : styles.placementTopArrow;
    return cx(styles.arrow, placementClass);
  });

  // Derived: arrow inner fill class
  const arrowInnerClass = createMemo(() => {
    const pos = activePosition();
    if (pos === null) return styles.arrowInner;
    const placementClass =
      pos.actualPlacement === 'bottom'
        ? styles.placementBottomArrowInner
        : styles.placementTopArrowInner;
    return cx(styles.arrowInner, placementClass);
  });

  // Derived: visibility for aria-describedby
  const describeById = createMemo(() => (activePosition() !== null ? tooltipId : undefined));

  onCleanup(() => {
    clearTimers();
  });

  return (
    <span
      ref={triggerRef!}
      class={styles.trigger}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusIn={show}
      onFocusOut={(event) => {
        // Only hide if focus left the trigger entirely (not moved to a child)
        if (!triggerRef.contains(event.relatedTarget as Node | null)) {
          hide();
        }
      }}
      aria-describedby={describeById()}
    >
      {local.children}

      {activePosition() !== null && (
        <Portal mount={document.body}>
          <div id={tooltipId} role="tooltip" class={tooltipClass()} style={tooltipStyle()}>
            {/* Arrow (border) */}
            <span class={arrowClass()} aria-hidden="true" />
            {/* Arrow inner fill */}
            <span class={arrowInnerClass()} aria-hidden="true" />
            {local.content}
          </div>
        </Portal>
      )}
    </span>
  );
}
