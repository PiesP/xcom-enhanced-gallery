/** @jsxImportSource solid-js */
/**
 * @fileoverview IconButton Tests (TDD - fail first, Solid)
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import { IconButton } from '../../../../../src/shared/components/ui/Button/IconButton';

afterEach(() => {
  cleanup();
});

describe('IconButton', () => {
  it('renders an icon-only button with required aria-label', () => {
    render(() => (
      <IconButton aria-label='Download' data-testid='icon-button' title='Download'>
        ⬇
      </IconButton>
    ));

    const btn = screen.getByTestId('icon-button');
    expect(btn).toHaveAttribute('role', 'button');
    expect(btn).toHaveAttribute('aria-label', 'Download');
    expect(btn.className).toMatch(/_icon_/);
  });

  it('supports sizes sm, md, lg via class names', () => {
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
    sizes.forEach(size => {
      render(() => (
        <IconButton size={size} aria-label={`${size} icon`} data-testid={`icon-${size}`}>
          ⚙
        </IconButton>
      ));

      const btn = screen.getByTestId(`icon-${size}`);
      expect(btn.className).toMatch(new RegExp(`_${size}_`));
      cleanup();
    });
  });

  it('respects disabled and loading states', () => {
    render(() => (
      <IconButton disabled loading aria-label='Loading Icon' data-testid='icon-loading'>
        ⏳
      </IconButton>
    ));

    const btn = screen.getByTestId('icon-loading');
    expect(btn).toBeDisabled();
    expect(btn.className).toMatch(/_loading_/);
  });
});
