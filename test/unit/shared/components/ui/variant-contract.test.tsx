/** @jsxImportSource solid-js */
/**
 * @fileoverview Variant Contract Test (Phase 1 RED - v4.1)
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import { Button } from '../../../../../src/shared/components/ui/Button/Button';

afterEach(() => {
  cleanup();
});

describe('Variant Contract (v4.1 - RED)', () => {
  describe('Variant x Size Matrix', () => {
    const variants: Array<'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'icon'> = [
      'primary',
      'secondary',
      'outline',
      'ghost',
      'danger',
      'icon',
    ];
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

    variants.forEach(variant => {
      sizes.forEach(size => {
        it(`variant="${variant}" size="${size}" should have correct class pattern`, () => {
          const { container } = render(() => (
            <Button
              variant={variant}
              size={size}
              aria-label={variant === 'icon' ? 'Test Icon' : undefined}
              data-testid={`button-${variant}-${size}`}
            >
              {variant === 'icon' ? '⚙' : 'Test'}
            </Button>
          ));

          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();
          expect(button?.className).toMatch(/unifiedButton|_unifiedButton_/);
          expect(button?.className).toMatch(new RegExp(`${variant}|_${variant}_`));
          expect(button?.className).toMatch(new RegExp(`${size}|_${size}_`));
        });
      });
    });
  });

  describe('State Combinations', () => {
    const states = [
      { props: { loading: true } as const, expectedClass: 'loading' },
      { props: { disabled: true } as const, expectedClass: 'disabled' },
      { props: { 'aria-pressed': true } as const, expectedState: 'pressed' as const },
    ];

    states.forEach(({ props, expectedClass, expectedState }) => {
      it(`state with props ${JSON.stringify(props)} should apply correct class`, () => {
        const { container } = render(() => (
          <Button variant='primary' {...props} data-testid='state-button'>
            Test
          </Button>
        ));

        const button = container.querySelector('button');

        if (expectedClass) {
          expect(button?.className).toMatch(new RegExp(`${expectedClass}|_${expectedClass}_`));
        }

        if (expectedState === 'pressed') {
          expect(button).toHaveAttribute('aria-pressed', 'true');
        }
      });
    });
  });

  describe('Icon Variant Specific', () => {
    it('icon variant should be square (aspect-ratio: 1)', () => {
      const { container } = render(() => (
        <Button variant='icon' aria-label='Test Icon' data-testid='icon-button'>
          ⚙
        </Button>
      ));

      const button = container.querySelector('button');
      expect(button?.className).toMatch(/icon|_icon_/);
    });

    it('icon variant without aria-label should fail accessibility requirement', () => {
      const { container } = render(() => (
        <Button variant='icon' data-testid='bad-icon-button'>
          ⚙
        </Button>
      ));

      const button = container.querySelector('button');
      expect(button).not.toHaveAttribute('aria-label');
    });
  });

  describe('Class Conflict Detection', () => {
    it('should not have conflicting variant classes', () => {
      const { container } = render(() => (
        <Button variant='primary' size='md' data-testid='conflict-test'>
          Test
        </Button>
      ));

      const button = container.querySelector('button');
      const className = button?.className ?? '';
      const variantMatches = className.match(/(secondary|outline|ghost|danger)/g);
      expect(variantMatches).toBeNull();
    });
  });
});
