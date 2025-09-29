/** @jsxImportSource solid-js */
/**
 * @fileoverview ARIA Attributes Migration Checklist (Phase 1 RED - v4.1)
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import { Button } from '../../../../../src/shared/components/ui/Button/Button';

afterEach(() => {
  cleanup();
});

describe('ARIA Attributes Migration (v4.1 - RED)', () => {
  it('should support aria-label, aria-labelledby, aria-describedby', () => {
    render(() => (
      <Button aria-label='Primary Action' aria-labelledby='label-id' aria-describedby='desc-id'>
        Action
      </Button>
    ));

    const button = screen.getByRole('button', { name: 'Primary Action' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-labelledby', 'label-id');
    expect(button).toHaveAttribute('aria-describedby', 'desc-id');
  });

  it('should respect aria-haspopup and aria-expanded', () => {
    render(() => (
      <Button aria-haspopup='menu' aria-expanded data-testid='menu-trigger'>
        Menu
      </Button>
    ));

    const button = screen.getByTestId('menu-trigger');
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('should propagate aria-controls and aria-pressed', () => {
    render(() => (
      <Button aria-controls='panel' aria-pressed data-testid='toggle-button'>
        Toggle
      </Button>
    ));

    const button = screen.getByTestId('toggle-button');
    expect(button).toHaveAttribute('aria-controls', 'panel');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('should allow overriding data attributes', () => {
    render(() => (
      <Button
        data-gallery-element='download'
        data-disabled='true'
        data-selected='false'
        data-loading='false'
        data-testid='data-button'
      >
        Download
      </Button>
    ));

    const button = screen.getByTestId('data-button');
    expect(button).toHaveAttribute('data-gallery-element', 'download');
    expect(button).toHaveAttribute('data-disabled', 'true');
    expect(button).toHaveAttribute('data-selected', 'false');
    expect(button).toHaveAttribute('data-loading', 'false');
  });
});
