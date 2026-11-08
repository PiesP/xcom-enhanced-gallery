// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

import { TOOLTIP_HIDE_DELAY_MS, TOOLTIP_SHOW_DELAY_MS } from '@constants/performance';
import type { JSXElement } from 'solid-js';
import { createUniqueId, onCleanup, splitProps } from 'solid-js';
import styles from './Tooltip.module.css';
import type { TooltipProps } from './Tooltip.types';

/** A manual popover remains in its gallery dialog's subtree and inherits its theme. */
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
  const anchorName = `--xeg-tooltip-${tooltipId.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const showDelay = local.showDelay ?? TOOLTIP_SHOW_DELAY_MS;
  const hideDelay = local.hideDelay ?? TOOLTIP_HIDE_DELAY_MS;

  let triggerRef!: HTMLSpanElement;
  let tooltipRef!: HTMLDivElement;
  let showTimer: ReturnType<typeof setTimeout> | undefined;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let describedElement: HTMLElement | undefined;
  let previousDescribedBy: string | null = null;
  let anchorElement: HTMLElement | undefined;
  let previousAnchorName = '';

  const clearTimers = (): void => {
    if (showTimer !== undefined) {
      clearTimeout(showTimer);
      showTimer = undefined;
    }
    if (hideTimer !== undefined) {
      clearTimeout(hideTimer);
      hideTimer = undefined;
    }
  };

  const restoreAnchor = (): void => {
    if (anchorElement) {
      if (previousAnchorName) {
        anchorElement.style.setProperty('anchor-name', previousAnchorName);
      } else {
        anchorElement.style.removeProperty('anchor-name');
      }
      anchorElement = undefined;
    }
  };

  const restoreDescription = (): void => {
    if (describedElement) {
      if (previousDescribedBy === null) {
        describedElement.removeAttribute('aria-describedby');
      } else {
        describedElement.setAttribute('aria-describedby', previousDescribedBy);
      }
      describedElement = undefined;
      previousDescribedBy = null;
    }
  };

  const dismiss = (): void => {
    clearTimers();
    if (tooltipRef.matches(':popover-open')) {
      tooltipRef.hidePopover();
    }
    restoreDescription();
    restoreAnchor();
  };

  const resolveTrigger = (event?: Event): HTMLElement | null => {
    if (event?.target instanceof HTMLElement && event.target !== triggerRef) {
      return event.target.closest('button, select, input, textarea, a[href], [tabindex]');
    }
    const firstChild = triggerRef.firstElementChild;
    return firstChild instanceof HTMLElement ? firstChild : null;
  };

  const present = (element: HTMLElement): void => {
    restoreAnchor();
    anchorElement = element;
    previousAnchorName = element.style.getPropertyValue('anchor-name');
    element.style.setProperty('anchor-name', anchorName);
    try {
      tooltipRef.showPopover();
    } catch {
      restoreAnchor();
      return;
    }
    describedElement = element;
    previousDescribedBy = element.getAttribute('aria-describedby');
    const ids = new Set(previousDescribedBy?.split(/\s+/).filter(Boolean) ?? []);
    ids.add(tooltipId);
    element.setAttribute('aria-describedby', [...ids].join(' '));
  };

  const show = (event?: Event, delay = showDelay): void => {
    clearTimers();
    const element = resolveTrigger(event);
    if (!element || tooltipRef.matches(':popover-open')) {
      return;
    }
    showTimer = setTimeout(() => present(element), delay);
  };

  const hide = (): void => {
    clearTimers();
    hideTimer = setTimeout(dismiss, hideDelay);
  };

  onCleanup(dismiss);

  return (
    <span
      ref={(element) => {
        triggerRef = element;
      }}
      class={styles.trigger}
      onMouseEnter={(event) => show(event)}
      onMouseLeave={hide}
      onFocusIn={(event) => show(event, 0)}
      onFocusOut={(event) => {
        if (!triggerRef.contains(event.relatedTarget as Node | null)) {
          hide();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && tooltipRef.matches(':popover-open')) {
          dismiss();
        }
      }}
    >
      {local.children}
      <div
        ref={(element) => {
          tooltipRef = element;
        }}
        id={tooltipId}
        popover="manual"
        role="tooltip"
        class={styles.content}
        data-placement={local.placement ?? 'bottom'}
        style={{ 'position-anchor': anchorName, '--xeg-tooltip-offset': `${local.offset ?? 6}px` }}
        onMouseEnter={() => {
          if (hideTimer !== undefined) {
            clearTimeout(hideTimer);
            hideTimer = undefined;
          }
        }}
        onMouseLeave={hide}
      >
        {local.content}
      </div>
    </span>
  );
}
