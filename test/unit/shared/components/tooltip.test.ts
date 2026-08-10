// SPDX-License-Identifier: MIT
// Copyright (c) 2026 PiesP

import { Tooltip } from '@shared/components/ui/Tooltip/Tooltip';
import { createComponent } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Tooltip accessibility', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('describes the actual focusable trigger and dismisses on Escape', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Open';
    document.body.appendChild(container);
    const dispose = render(
      () =>
        createComponent(Tooltip, {
          content: 'Helpful information',
          showDelay: 0,
          hideDelay: 0,
          children: button,
        }),
      container
    );

    button.focus();
    vi.runAllTimers();

    const describedBy = button.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(button.parentElement?.hasAttribute('aria-describedby')).toBe(false);
    expect(document.getElementById(describedBy!)?.getAttribute('role')).toBe('tooltip');

    button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(button.hasAttribute('aria-describedby')).toBe(false);
    expect(document.getElementById(describedBy!)).toBeNull();

    dispose();
  });

  it('renders in a body-level portal host that mirrors the gallery theme scope', async () => {
    vi.useFakeTimers();
    const scope = document.createElement('div');
    scope.className = 'xeg-theme-scope pp-design';
    scope.dataset.ppProduct = 'xeg';
    scope.dataset.ppTheme = 'dark';
    scope.dataset.theme = 'dark';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Open';
    document.body.appendChild(scope);
    const dispose = render(
      () =>
        createComponent(Tooltip, {
          content: 'Scoped information',
          showDelay: 0,
          children: button,
        }),
      scope
    );

    button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.runAllTimers();

    const tooltip = document.querySelector('[role="tooltip"]');
    const portalHost = document.querySelector('[data-xeg-tooltip-portal]');
    expect(tooltip).not.toBeNull();
    expect(portalHost?.parentElement).toBe(document.body);
    expect(portalHost).not.toBe(scope);
    expect(portalHost?.className).toBe('xeg-theme-scope pp-design');
    expect(portalHost?.getAttribute('data-pp-product')).toBe('xeg');
    expect(portalHost?.getAttribute('data-pp-theme')).toBe('dark');
    expect(portalHost?.getAttribute('data-theme')).toBe('dark');
    expect(tooltip?.closest('[data-xeg-tooltip-portal]')).toBe(portalHost);

    scope.dataset.ppTheme = 'light';
    scope.dataset.theme = 'light';
    await Promise.resolve();
    expect(portalHost?.getAttribute('data-pp-theme')).toBe('light');
    expect(portalHost?.getAttribute('data-theme')).toBe('light');

    dispose();
    expect(document.querySelector('[data-xeg-tooltip-portal]')).toBeNull();
  });

  it('shows immediately on keyboard focus while preserving the pointer delay', () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Open';
    document.body.appendChild(container);
    const dispose = render(
      () =>
        createComponent(Tooltip, {
          content: 'Helpful information',
          showDelay: 300,
          hideDelay: 0,
          children: button,
        }),
      container
    );

    button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    vi.advanceTimersByTime(299);
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
    vi.advanceTimersByTime(1);
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();

    button.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    vi.runAllTimers();
    expect(document.querySelector('[role="tooltip"]')).toBeNull();

    dispose();
    container.remove();

    const focusContainer = document.createElement('div');
    const focusButton = document.createElement('button');
    focusButton.type = 'button';
    focusButton.textContent = 'Open';
    document.body.appendChild(focusContainer);
    const disposeFocusTooltip = render(
      () =>
        createComponent(Tooltip, {
          content: 'Helpful information',
          showDelay: 300,
          children: focusButton,
        }),
      focusContainer
    );

    focusButton.focus();
    vi.advanceTimersByTime(16);
    expect(document.querySelector('[role="tooltip"]')).not.toBeNull();

    disposeFocusTooltip();
  });
});
