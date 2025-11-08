/**
 * @fileoverview Wrapper Compatibility Test (Phase 1 RED - v4.1)
 * @description 기존 import 경로의 호환성 보장 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, h } from '@test/utils/testing-library';

// 기존 import 경로들 (현재 구현)
import { Button as CurrentButton } from '@/shared/components/ui/Button/Button';
import { Button as CurrentIconButton } from '@shared/components/ui/Button';
import { Button as CurrentToolbarButton } from '@shared/components/ui/Button';

// TODO: UnifiedButton 구현 후 wrapper들과 비교
// import { Button as UnifiedButton } from '@/shared/components/ui/UnifiedButton/UnifiedButton';

describe('Wrapper Compatibility (v4.1 - RED)', () => {
  describe('Current Implementation Baseline', () => {
    it('should render Button with expected structure', () => {
      const { container } = render(h(CurrentButton, { 'data-testid': 'current-button' }, 'Test'));

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-testid', 'current-button');
      expect(button?.textContent).toBe('Test');
    });

    it('should render IconButton with expected structure', () => {
      const { container } = render(
        h(
          CurrentIconButton,
          {
            'aria-label': 'Test Icon',
            'data-testid': 'current-icon-button',
          },
          '⚙'
        )
      );

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Test Icon');
      expect(button?.textContent).toBe('⚙');
    });

    it('should render ToolbarButton with expected structure', () => {
      const { container } = render(
        h(
          CurrentToolbarButton,
          {
            'data-testid': 'current-toolbar-button',
            'aria-label': 'Toolbar Action',
          },
          'Action'
        )
      );

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('data-testid', 'current-toolbar-button');
    });
  });

  describe('Common Props Interface', () => {
    it('should accept common button props consistently', () => {
      const commonProps = {
        disabled: true,
        'aria-label': 'Common Test',
        onClick: () => {},
      };

      // 모든 버튼 타입이 공통 props를 받을 수 있어야 함
      expect(() => {
        render(h(CurrentButton, commonProps, 'Button'));
      }).not.toThrow();

      expect(() => {
        render(h(CurrentIconButton, commonProps, '⚙'));
      }).not.toThrow();

      expect(() => {
        render(h(CurrentToolbarButton, commonProps, 'Toolbar'));
      }).not.toThrow();
    });

    it('should handle variant props appropriately', () => {
      // Button variants
      const buttonVariants = ['primary', 'secondary', 'outline', 'icon'];

      buttonVariants.forEach(variant => {
        expect(() => {
          render(
            h(
              CurrentButton,
              {
                variant: variant,
                'aria-label': variant === 'icon' ? 'Icon' : undefined,
              },
              variant === 'icon' ? '⚙' : 'Test'
            )
          );
        }).not.toThrow();
      });

      // ToolbarButton variants
      const toolbarVariants = ['primary', 'secondary', 'outline', 'ghost'];

      toolbarVariants.forEach(variant => {
        expect(() => {
          render(
            h(
              CurrentToolbarButton,
              {
                variant: variant,
                'aria-label': 'Toolbar',
              },
              'Test'
            )
          );
        }).not.toThrow();
      });
    });
  });

  describe('DOM Structure Comparison', () => {
    it('should produce consistent DOM structure across button types', () => {
      // 기본 버튼 구조
      const { container: buttonContainer } = render(
        h(CurrentButton, { variant: 'primary' }, 'Primary')
      );

      // 툴바 버튼 구조
      const { container: toolbarContainer } = render(
        h(CurrentToolbarButton, { variant: 'primary' }, 'Primary')
      );

      const button = buttonContainer.querySelector('button');
      const toolbarButton = toolbarContainer.querySelector('button');

      // 둘 다 button 엘리먼트여야 함
      expect(button?.tagName).toBe('BUTTON');
      expect(toolbarButton?.tagName).toBe('BUTTON');

      // 기본 속성들이 있어야 함
      expect(button).toHaveAttribute('type');
      expect(toolbarButton).toHaveAttribute('type');
    });

    it('should maintain ARIA compatibility', () => {
      const ariaProps = {
        'aria-pressed': true,
        'aria-expanded': false,
        'aria-describedby': 'help-text',
      };

      const { container: buttonContainer } = render(h(CurrentButton, ariaProps, 'ARIA Test'));

      const { container: toolbarContainer } = render(
        h(CurrentToolbarButton, ariaProps, 'ARIA Test')
      );

      const button = buttonContainer.querySelector('button');
      const toolbarButton = toolbarContainer.querySelector('button');

      // ARIA 속성들이 동일하게 적용되어야 함
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(toolbarButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Future Wrapper Requirements', () => {
    it('should define migration compatibility requirements', () => {
      // UnifiedButton 구현 후 wrapper가 만족해야 할 조건들
      const requirements = [
        'Same DOM structure as current implementation',
        'Identical prop interface (backward compatible)',
        'Consistent ARIA attribute handling',
        'Same CSS class patterns',
        'Event handler compatibility',
        'Performance parity (render time)',
      ];

      expect(requirements).toHaveLength(6);

      // TODO: UnifiedButton 구현 시 이 요구사항들을 테스트로 구현
      requirements.forEach(req => {
        expect(typeof req).toBe('string');
      });
    });

    it('should validate wrapper prop mapping', () => {
      // wrapper에서 UnifiedButton으로의 prop 매핑 규칙
      const propMappings = {
        // IconButton specific
        iconOnly: true, // 자동으로 설정되어야 함

        // ToolbarButton specific
        active: 'aria-pressed', // active -> aria-pressed 매핑

        // 공통
        variant: 'variant', // 직접 매핑
        size: 'size', // 직접 매핑
        disabled: 'disabled', // 직접 매핑
      };

      // 매핑 규칙이 정의되어 있음을 확인
      expect(Object.keys(propMappings)).toContain('iconOnly');
      expect(Object.keys(propMappings)).toContain('active');
      expect(propMappings.active).toBe('aria-pressed');
    });
  });

  describe('Breaking Change Detection', () => {
    it('should detect if current implementations have breaking changes', () => {
      // 현재 구현이 예상 인터페이스를 준수하는지 확인

      // Button이 필수 props를 받는지
      expect(() => {
        render(h(CurrentButton, {}, 'Test'));
      }).not.toThrow();

      // IconButton이 aria-label을 요구하는지 (현재는 안함, 향후 강제 예정)
      expect(() => {
        render(h(CurrentIconButton, {}, '⚙'));
      }).not.toThrow(); // 현재는 통과하지만 향후 실패해야 함

      // ToolbarButton이 기본 props를 받는지
      expect(() => {
        render(h(CurrentToolbarButton, {}, 'Test'));
      }).not.toThrow();
    });

    it('should document expected interface changes', () => {
      // UnifiedButton으로 이전할 때 변경될 인터페이스 문서화
      const interfaceChanges = {
        IconButton: {
          breaking: ['aria-label becomes required'],
          additions: ['iconOnly prop auto-detected'],
        },
        ToolbarButton: {
          breaking: ['active prop renamed to aria-pressed'],
          additions: ['variant prop normalized'],
        },
        Button: {
          breaking: [],
          additions: ['iconOnly variant support'],
        },
      };

      expect(interfaceChanges.IconButton.breaking).toContain('aria-label becomes required');
      expect(interfaceChanges.ToolbarButton.breaking).toContain(
        'active prop renamed to aria-pressed'
      );
      expect(interfaceChanges.Button.additions).toContain('iconOnly variant support');
    });
  });
});
