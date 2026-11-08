// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { Tooltip } from '@shared/components/ui/Tooltip/Tooltip';
import { createComponent } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';

describe('Tooltip accessibility and native presentation', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('shows a described manual popover inside its theme scope and restores the trigger', () => {
    vi.useFakeTimers();
    const scope = document.createElement('div');
    scope.className = 'xeg-theme-scope pp-design';
    scope.dataset.ppTheme = 'dark';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Open';
    button.setAttribute('aria-describedby', 'prior-description');
    document.body.append(scope);
    const dispose = render(
      () =>
        createComponent(Tooltip, {
          content: 'Helpful information',
          showDelay: 0,
          hideDelay: 0,
          children: button,
        }),
      scope
    );

    button.focus();
    vi.runAllTimers();
    const tooltip = scope.querySelector<HTMLElement>('[role="tooltip"]');
    expect(tooltip?.matches(':popover-open')).toBe(true);
    expect(tooltip?.closest('.xeg-theme-scope')).toBe(scope);
    expect(tooltip?.parentElement).not.toBe(document.body);
    expect(button.getAttribute('aria-describedby')).toContain(tooltip!.id);
    expect(button.style.getPropertyValue('anchor-name')).toMatch(/^--xeg-tooltip-/);
    expect(getComputedStyle(tooltip!).positionAnchor).toBe(
      button.style.getPropertyValue('anchor-name')
    );

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(tooltip?.matches(':popover-open')).toBe(false);
    expect(button.getAttribute('aria-describedby')).toBe('prior-description');
    expect(button.style.getPropertyValue('anchor-name')).toBe('');
    dispose();
  });

  it('preserves delayed hover, immediate focus, and movement into the tooltip', () => {
    vi.useFakeTimers();
    const scope = document.createElement('div');
    const button = document.createElement('button');
    button.type = 'button';
    document.body.append(scope);
    const dispose = render(
      () =>
        createComponent(Tooltip, {
          content: 'Scoped information',
          showDelay: 300,
          hideDelay: 100,
          children: button,
        }),
      scope
    );
    const tooltip = scope.querySelector<HTMLElement>('[role="tooltip"]')!;

    button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(299);
    expect(tooltip.matches(':popover-open')).toBe(false);
    vi.advanceTimersByTime(1);
    expect(tooltip.matches(':popover-open')).toBe(true);

    button.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    tooltip.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(100);
    expect(tooltip.matches(':popover-open')).toBe(true);
    tooltip.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.advanceTimersByTime(100);
    expect(tooltip.matches(':popover-open')).toBe(false);

    button.focus();
    vi.advanceTimersByTime(0);
    expect(tooltip.matches(':popover-open')).toBe(true);
    dispose();
    expect(scope.querySelector('[role="tooltip"]')).toBeNull();
  });

  it('keeps a max-content Arabic tooltip near its anchor in a narrow modal viewport', async () => {
    const previousViewport = { width: innerWidth, height: innerHeight };
    await page.viewport(420, 600);
    const dialog = document.createElement('dialog');
    dialog.dir = 'rtl';
    dialog.style.cssText =
      'position: fixed; inset: 0; margin: 0; padding: 0; border: 0; width: 420px; height: 600px; max-width: none; max-height: none';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Settings';
    button.style.cssText = 'position: fixed; left: 186px; top: 120px; width: 44px; height: 44px';
    document.body.append(dialog);
    let dispose: (() => void) | undefined;
    try {
      dispose = render(
        () =>
          createComponent(Tooltip, {
            content: 'فتح الإعدادات',
            showDelay: 0,
            children: button,
          }),
        dialog
      );
      dialog.showModal();
      button.focus();
      const tooltip = dialog.querySelector<HTMLElement>('[role="tooltip"]');
      expect(tooltip).not.toBeNull();
      await vi.waitFor(() => expect(tooltip?.matches(':popover-open')).toBe(true));
      expect(getComputedStyle(tooltip!).direction).toBe('rtl');
      expect(getComputedStyle(tooltip!).positionAnchor).toBe(
        button.style.getPropertyValue('anchor-name')
      );
      expect(button.getAttribute('aria-describedby')).toContain(tooltip!.id);
      for (const { left, top, side } of [
        { left: 186, top: 120, side: 'below' },
        { left: 0, top: 120, side: 'below' },
        { left: 376, top: 120, side: 'below' },
        { left: 186, top: 550, side: 'above' },
      ] as const) {
        button.style.left = `${left}px`;
        button.style.top = `${top}px`;
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const triggerRect = button.getBoundingClientRect();
        const tooltipRect = tooltip!.getBoundingClientRect();
        const textRange = document.createRange();
        textRange.selectNodeContents(tooltip!);
        const horizontalGap = Math.max(
          triggerRect.left - tooltipRect.right,
          tooltipRect.left - triggerRect.right,
          0
        );
        const verticalGap = Math.max(
          triggerRect.top - tooltipRect.bottom,
          tooltipRect.top - triggerRect.bottom,
          0
        );
        expect(horizontalGap, `${side} at x=${left}`).toBeLessThanOrEqual(12);
        expect(verticalGap, `${side} at y=${top}`).toBeLessThanOrEqual(12);
        expect(tooltipRect.left).toBeGreaterThanOrEqual(0);
        expect(tooltipRect.right).toBeLessThanOrEqual(420);
        expect(tooltipRect.top).toBeGreaterThanOrEqual(0);
        expect(tooltipRect.bottom).toBeLessThanOrEqual(600);
        expect(tooltipRect.width).toBeGreaterThanOrEqual(triggerRect.width);
        expect(textRange.getClientRects().length).toBeLessThanOrEqual(3);
        if (side === 'above') {
          expect(tooltipRect.bottom).toBeLessThanOrEqual(triggerRect.top);
        } else {
          expect(tooltipRect.top).toBeGreaterThanOrEqual(triggerRect.bottom);
        }
      }
    } finally {
      dispose?.();
      if (dialog.open) {
        dialog.close();
      }
      dialog.remove();
      await page.viewport(previousViewport.width, previousViewport.height);
    }
  });
});
