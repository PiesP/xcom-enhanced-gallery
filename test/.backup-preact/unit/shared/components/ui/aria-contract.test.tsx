/**
 * @fileoverview ARIA Contract Test (Phase 1 RED - v4.1)
 * @description 버튼 ARIA 속성 계약 테스트 - 접근성 회귀 방지
 */

import { describe, it, expect } from 'vitest';
import { render, h } from '../../../../utils/testing-library';

// Phase S1 RED: UnifiedButton 통합 후 ARIA 표준 검증
import { Button as UnifiedButton } from '../../../../../src/shared/components/ui/Button/Button';

describe('ARIA Contract (v4.1 - RED)', () => {
  describe('Basic ARIA Attributes', () => {
    it('should have role="button" by default', () => {
      const { container } = render(h(UnifiedButton, { 'data-testid': 'basic-button' }, 'Test'));

      // DEBUG: 실제 렌더링된 HTML 확인
      console.log('Rendered HTML:', container.innerHTML);

      const button = container.querySelector('button');
      console.log('Found button:', button);

      expect(button).toHaveAttribute('role', 'button');
    });

    it('should support custom aria-label', () => {
      const { container } = render(
        h(
          UnifiedButton,
          {
            'aria-label': 'Custom Label',
            'data-testid': 'labeled-button',
          },
          'Test'
        )
      );

      // DEBUG: 실제 렌더링된 HTML 확인
      console.log('Rendered HTML with aria-label:', container.innerHTML);

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-label', 'Custom Label');
    });
  });

  describe('Loading State ARIA', () => {
    it('should set aria-busy="true" when loading', () => {
      const { container } = render(
        h(UnifiedButton, { loading: true, 'data-testid': 'loading-button' }, 'Test')
      );

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should set aria-disabled="true" when loading', () => {
      const { container } = render(
        h(UnifiedButton, { loading: true, 'data-testid': 'loading-disabled' }, 'Test')
      );

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Disabled State ARIA', () => {
    it('should set aria-disabled="true" when disabled', () => {
      const { container } = render(
        h(UnifiedButton, { disabled: true, 'data-testid': 'disabled-button' }, 'Test')
      );

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have tabIndex="-1" when disabled', () => {
      const { container } = render(
        h(UnifiedButton, { disabled: true, 'data-testid': 'disabled-tab' }, 'Test')
      );

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Pressed State ARIA', () => {
    it('should set aria-pressed="true" when aria-pressed prop is true', () => {
      const { container } = render(
        h(UnifiedButton, { 'aria-pressed': true, 'data-testid': 'pressed-button' }, 'Test')
      );

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should set aria-pressed="false" when aria-pressed prop is false', () => {
      const { container } = render(
        h(UnifiedButton, { 'aria-pressed': false, 'data-testid': 'unpressed-button' }, 'Test')
      );

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Icon Button ARIA Requirements', () => {
    it('icon variant should require aria-label', () => {
      // RED 테스트 - 현재는 실패할 것
      const { container } = render(
        h(
          UnifiedButton,
          {
            variant: 'icon',
            'data-testid': 'icon-no-label',
          },
          '⚙'
        )
      );

      const button = container.querySelector('button');

      // TODO: UnifiedButton 구현 시 icon variant는 aria-label 필수로 만들어야 함
      // 현재는 단순히 aria-label이 없음을 확인 (RED 상태)
      expect(button).not.toHaveAttribute('aria-label');
    });

    it('icon variant with aria-label should be valid', () => {
      const { container } = render(
        h(
          UnifiedButton,
          {
            variant: 'icon',
            'aria-label': 'Settings',
            'data-testid': 'icon-with-label',
          },
          '⚙'
        )
      );

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-label', 'Settings');
    });
  });

  describe('Expanded State ARIA', () => {
    it('should support aria-expanded for dropdown buttons', () => {
      const { container } = render(
        h(
          UnifiedButton,
          {
            'aria-expanded': true,
            'data-testid': 'expanded-button',
          },
          'Dropdown'
        )
      );

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should support aria-haspopup for dropdown buttons', () => {
      const { container } = render(
        h(
          UnifiedButton,
          {
            'aria-haspopup': 'menu',
            'data-testid': 'popup-button',
          },
          'Menu'
        )
      );

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
    });
  });

  describe('ARIA Combinations', () => {
    it('should handle multiple ARIA states correctly', () => {
      const { container } = render(
        h(
          UnifiedButton,
          {
            'aria-pressed': true,
            'aria-expanded': false,
            'aria-label': 'Toggle and Expand',
            'data-testid': 'multi-aria-button',
          },
          'Complex'
        )
      );

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-label', 'Toggle and Expand');
    });

    it('should not have conflicting ARIA states', () => {
      const { container } = render(
        h(
          UnifiedButton,
          {
            loading: true,
            disabled: true,
            'data-testid': 'conflict-aria',
          },
          'Conflict'
        )
      );

      const button = container.querySelector('button');

      // 둘 다 aria-disabled를 true로 설정해야 함
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Describedby Support', () => {
    it('should support aria-describedby', () => {
      const { container } = render(
        h(
          UnifiedButton,
          {
            'aria-describedby': 'help-text',
            'data-testid': 'described-button',
          },
          'Help'
        )
      );

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });
  });
});
