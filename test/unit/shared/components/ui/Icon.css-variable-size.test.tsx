/** @jsxImportSource solid-js */
/**
 * @fileoverview Icon CSS variable size tests (Solid)
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import { Icon } from '../../../../../src/shared/components/ui/Icon/Icon';

afterEach(() => {
  cleanup();
});

describe('Icon CSS variable sizing', () => {
  it('applies numeric size via width/height attributes', () => {
    render(() => (
      <Icon size={32} data-testid='icon-numeric'>
        <path d='M0 0h24v24H0z' />
      </Icon>
    ));

    const icon = screen.getByTestId('icon-numeric');
    expect(icon).toHaveAttribute('width', '32px');
    expect(icon).toHaveAttribute('height', '32px');
  });

  it('applies string size via inline style', () => {
    render(() => (
      <Icon size='2rem' data-testid='icon-string'>
        <circle cx='12' cy='12' r='10' />
      </Icon>
    ));

    const icon = screen.getByTestId('icon-string');
    expect(icon.getAttribute('style')).toContain('width:2rem');
    expect(icon.getAttribute('style')).toContain('height:2rem');
  });

  it('falls back to CSS variables when size undefined', () => {
    render(() => (
      <Icon data-testid='icon-default'>
        <rect x='4' y='4' width='16' height='16' />
      </Icon>
    ));

    const icon = screen.getByTestId('icon-default');
    expect(icon.getAttribute('style')).not.toContain('width');
    expect(icon.getAttribute('style')).not.toContain('height');
    expect(icon).toHaveAttribute('stroke', 'var(--xeg-icon-color, currentColor)');
  });
});
