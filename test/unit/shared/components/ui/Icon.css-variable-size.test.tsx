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
    // SolidJS는 스타일을 렌더링할 때 공백을 추가할 수 있음 (width: 2rem)
    const style = icon.getAttribute('style') ?? '';
    expect(style).toMatch(/width:\s*2rem/);
    expect(style).toMatch(/height:\s*2rem/);
  });

  it('falls back to CSS variables when size undefined', () => {
    render(() => (
      <Icon data-testid='icon-default'>
        <rect x='4' y='4' width='16' height='16' />
      </Icon>
    ));

    const icon = screen.getByTestId('icon-default');
    // size가 undefined일 때도 CSS 변수를 통해 width/height가 설정됨
    const style = icon.getAttribute('style') ?? '';
    expect(style).toMatch(/width:\s*var\(--xeg-icon-size\)/);
    expect(style).toMatch(/height:\s*var\(--xeg-icon-size\)/);
    expect(icon).toHaveAttribute('stroke', 'var(--xeg-icon-color, currentColor)');
  });
});
