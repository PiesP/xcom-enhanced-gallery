// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { Tooltip } from '@shared/components/ui/Tooltip/Tooltip';
import { createComponent } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

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
});
