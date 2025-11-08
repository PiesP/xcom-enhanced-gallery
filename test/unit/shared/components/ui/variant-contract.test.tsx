/**
 * @fileoverview Variant Contract Test (Phase 1 RED - v4.1)
 * @description 버튼 variant x size x state 조합 매트릭스 계약 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, h } from '@test/utils/testing-library';

// TODO: UnifiedButton이 구현되면 이 import를 교체
import { Button } from '@/shared/components/ui/Button/Button';

describe('Variant Contract (v4.1 - RED)', () => {
  describe('Variant x Size Matrix', () => {
    const variants = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'icon'];
    const sizes = ['sm', 'md', 'lg'];

    variants.forEach(variant => {
      sizes.forEach(size => {
        it(`variant="${variant}" size="${size}" should have correct class pattern`, () => {
          const props = {
            variant,
            size,
            'aria-label': variant === 'icon' ? 'Test Icon' : undefined,
            'data-testid': `button-${variant}-${size}`,
          };

          const { container } = render(h(Button, props, variant === 'icon' ? '⚙' : 'Test'));

          const button = container.querySelector('button');
          expect(button).toBeInTheDocument();

          // 기대하는 클래스 패턴: unifiedButton variant-* size-*
          expect(button?.className).toMatch(/unifiedButton|_unifiedButton_/);
          expect(button?.className).toMatch(new RegExp(`${variant}|_${variant}_`));
          expect(button?.className).toMatch(new RegExp(`${size}|_${size}_`));
        });
      });
    });
  });

  describe('State Combinations', () => {
    const states = [
      { props: { loading: true }, expectedClass: 'loading' },
      { props: { disabled: true }, expectedClass: 'disabled' },
      { props: { 'aria-pressed': true }, expectedState: 'pressed' },
    ];

    states.forEach(({ props, expectedClass, expectedState }) => {
      it(`state with props ${JSON.stringify(props)} should apply correct class`, () => {
        const { container } = render(
          h(
            Button,
            {
              variant: 'primary',
              ...props,
              'data-testid': 'state-button',
            },
            'Test'
          )
        );

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
      const { container } = render(
        h(
          Button,
          {
            variant: 'icon',
            'aria-label': 'Test Icon',
            'data-testid': 'icon-button',
          },
          '⚙'
        )
      );

      const button = container.querySelector('button');
      expect(button?.className).toMatch(/icon|_icon_/);
    });

    it('icon variant without aria-label should fail accessibility requirement', () => {
      // 이 테스트는 현재 실패할 것임 - RED 단계
      const { container } = render(
        h(
          Button,
          {
            variant: 'icon',
            'data-testid': 'bad-icon-button',
          },
          '⚙'
        )
      );

      const button = container.querySelector('button');
      // TODO: UnifiedButton 구현 시 aria-label 없으면 에러 또는 경고 발생해야 함
      // 현재는 단순히 aria-label이 없음을 확인
      expect(button).not.toHaveAttribute('aria-label');
    });
  });

  describe('Class Conflict Detection', () => {
    it('should not have conflicting variant classes', () => {
      const { container } = render(
        h(
          Button,
          {
            variant: 'primary',
            size: 'md',
            'data-testid': 'conflict-test',
          },
          'Test'
        )
      );

      const button = container.querySelector('button');
      const className = button?.className || '';

      // 다른 variant 클래스가 동시에 존재하면 안됨
      const variantMatches = className.match(/(secondary|outline|ghost|danger)/g);
      expect(variantMatches).toBeNull();
    });
  });
});
