/**
 * @fileoverview IconButton Tests (TDD - fail first)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { h } from 'preact';
import { IconButton } from '../../../../../src/shared/components/ui/Button/IconButton';

describe('IconButton', () => {
  it('renders an icon-only button with required aria-label', () => {
    render(
      h(
        IconButton,
        {
          'aria-label': 'Download',
          'data-testid': 'icon-button',
          title: 'Download',
        },
        '⬇'
      )
    );

    const btn = screen.getByTestId('icon-button');
    expect(btn).toHaveAttribute('role', 'button');
    expect(btn).toHaveAttribute('aria-label', 'Download');
    // should carry icon-related classes from underlying Button (variant icon)
    expect(btn.className).toMatch(/_icon_/);
  });

  it('supports sizes sm, md, lg via class names', () => {
    const sizes = ['sm', 'md', 'lg'];
    sizes.forEach(size => {
      render(
        h(
          IconButton,
          {
            size,
            'aria-label': `${size} icon`,
            'data-testid': `icon-${size}`,
          },
          '⚙'
        )
      );

      const btn = screen.getByTestId(`icon-${size}`);
      expect(btn.className).toMatch(new RegExp(`_${size}_`));
    });
  });

  it('respects disabled and loading states', () => {
    render(
      h(
        IconButton,
        {
          disabled: true,
          loading: true,
          'aria-label': 'Loading Icon',
          'data-testid': 'icon-loading',
        },
        '⏳'
      )
    );

    const btn = screen.getByTestId('icon-loading');
    expect(btn).toBeDisabled();
    expect(btn.className).toMatch(/_loading_/);
  });
});
