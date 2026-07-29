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
});
