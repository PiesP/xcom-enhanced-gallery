/**
 * @fileoverview IconButton Tests (Phase P3)
 */

import { describe, it, expect } from 'vitest';
import { render, screen, h } from '@test/utils/testing-library';
import { IconButton } from '@/shared/components/ui/Button/IconButton';
import styles from '@/shared/components/ui/Button/Button.module.css';

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

    const btn = screen.getByRole('button', { name: 'Download' });
    expect(btn).toBeInstanceOf(HTMLButtonElement);
    expect(btn).toHaveRole('button');
    expect(btn).toHaveAccessibleName('Download');
    expect(btn).toHaveAttribute('aria-label', 'Download');
    expect(btn.classList.contains(styles.unifiedButton)).toBe(true);
    expect(btn.classList.contains(styles['variant-icon'])).toBe(true);
    expect(btn.classList.contains(styles.iconOnly)).toBe(true);
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

      const btn = screen.getByRole('button', { name: `${size} icon` });
      expect(btn.classList.contains(styles[`size-${size}`])).toBe(true);
      expect(btn.classList.contains(styles.iconOnly)).toBe(true);
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

    const btn = screen.getByRole('button', { name: 'Loading Icon' });
    expect(btn).toBeDisabled();
    expect(btn.classList.contains(styles.loading)).toBe(true);
  });
});
