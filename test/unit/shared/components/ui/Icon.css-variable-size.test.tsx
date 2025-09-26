/**
 * @file Icon CSS variable size handling tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/preact';
import { h } from 'preact';
import { Icon } from '@shared/components/ui/Icon/Icon';

describe('Icon — CSS variable sizing', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    cleanup();
  });

  it('applies CSS variable size via style instead of width/height attributes', () => {
    const sizeToken = 'var(--xeg-icon-size-lg)';

    render(
      h(Icon, {
        size: sizeToken,
        'aria-label': 'Test Icon',
        'data-testid': 'icon',
      })
    );

    const icon = screen.getByTestId('icon');

    expect(icon.getAttribute('width')).toBeNull();
    expect(icon.getAttribute('height')).toBeNull();

    expect(icon).toHaveStyle({
      width: sizeToken,
      height: sizeToken,
    });
  });
});
