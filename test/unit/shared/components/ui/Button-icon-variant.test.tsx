/** @jsxImportSource solid-js */
/**
 * @fileoverview Button Icon Variant Tests (Phase P2)
 * @description Button 컴포넌트의 icon variant 기능 테스트 (Solid)
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@solidjs/testing-library';
import { Button } from '../../../../../src/shared/components/ui/Button/Button';

afterEach(() => {
  cleanup();
});

describe('Button Icon Variant (P2)', () => {
  describe('Icon Variant 기본 동작', () => {
    it('icon variant가 올바른 클래스를 적용해야 함', () => {
      render(() => (
        <Button variant='icon' data-testid='icon-button' aria-label='Test Icon'>
          Icon
        </Button>
      ));

      const button = screen.getByTestId('icon-button');
      expect(button.className).toContain('_icon_');
    });

    it('icon variant with iconVariant sub-type이 올바른 클래스를 적용해야 함', () => {
      render(() => (
        <Button
          variant='icon'
          iconVariant='primary'
          data-testid='icon-button-primary'
          aria-label='Primary Icon'
        >
          Icon
        </Button>
      ));

      const button = screen.getByTestId('icon-button-primary');
      expect(button.className).toContain('_icon_');
      expect(button.className).toContain('_primary_');
    });

    it('icon variant가 정사각형 형태여야 함', () => {
      render(() => (
        <Button variant='icon' data-testid='square-icon-button' aria-label='Square Icon'>
          ⚙
        </Button>
      ));

      const button = screen.getByTestId('square-icon-button');
      expect(button.className).toContain('_icon_');
    });
  });

  describe('Icon Variant Sub-types', () => {
    const iconVariants = [
      { iconVariant: 'primary', expectedClass: 'primary' },
      { iconVariant: 'success', expectedClass: 'success' },
      { iconVariant: 'danger', expectedClass: 'danger' },
    ] as const;

    iconVariants.forEach(({ iconVariant, expectedClass }) => {
      it(`iconVariant="${iconVariant}"가 올바른 클래스를 적용해야 함`, () => {
        render(() => (
          <Button
            variant='icon'
            iconVariant={iconVariant}
            data-testid={`icon-button-${iconVariant}`}
            aria-label={`${iconVariant} Icon`}
          >
            ⚙
          </Button>
        ));

        const button = screen.getByTestId(`icon-button-${iconVariant}`);
        expect(button.className).toContain('_icon_');
        expect(button.className).toContain(`_${expectedClass}_`);
      });
    });
  });

  describe('Icon Variant 접근성', () => {
    it('icon variant 버튼이 aria-label을 가져야 함', () => {
      render(() => (
        <Button variant='icon' aria-label='Settings' data-testid='accessible-icon-button'>
          ⚙
        </Button>
      ));

      const button = screen.getByTestId('accessible-icon-button');
      expect(button).toHaveAttribute('aria-label', 'Settings');
    });

    it('icon variant 버튼이 role="button"을 가져야 함', () => {
      render(() => (
        <Button variant='icon' aria-label='Menu' data-testid='role-icon-button'>
          ☰
        </Button>
      ));

      const button = screen.getByTestId('role-icon-button');
      expect(button).toHaveAttribute('role', 'button');
    });
  });

  describe('Icon Variant 상태', () => {
    it('disabled 상태가 올바르게 적용되어야 함', () => {
      render(() => (
        <Button
          variant='icon'
          disabled
          aria-label='Disabled Icon'
          data-testid='disabled-icon-button'
        >
          ⚙
        </Button>
      ));

      const button = screen.getByTestId('disabled-icon-button');
      expect(button).toBeDisabled();
      expect(button.className).toContain('_disabled_');
    });

    it('loading 상태가 올바르게 적용되어야 함', () => {
      render(() => (
        <Button variant='icon' loading aria-label='Loading Icon' data-testid='loading-icon-button'>
          ⚙
        </Button>
      ));

      const button = screen.getByTestId('loading-icon-button');
      expect(button.className).toContain('_loading_');
      const spinner = button.querySelector('[aria-hidden="true"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Icon Variant 이벤트', () => {
    it('onClick 이벤트가 올바르게 호출되어야 함', () => {
      const mockClick = vi.fn();
      render(() => (
        <Button
          variant='icon'
          onClick={mockClick}
          aria-label='Clickable Icon'
          data-testid='clickable-icon-button'
        >
          ⚙
        </Button>
      ));

      const button = screen.getByTestId('clickable-icon-button');
      button.click();
      expect(mockClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Icon Variant 크기', () => {
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

    sizes.forEach(size => {
      it(`size="${size}"가 올바르게 적용되어야 함`, () => {
        render(() => (
          <Button
            variant='icon'
            size={size}
            aria-label={`${size} Icon`}
            data-testid={`icon-button-${size}`}
          >
            ⚙
          </Button>
        ));

        const button = screen.getByTestId(`icon-button-${size}`);
        expect(button.className).toContain(`_${size}_`);
      });
    });
  });

  describe('Toolbar 호환성', () => {
    it('기존 toolbarButton과 동일한 동작을 해야 함', () => {
      render(() => (
        <Button
          variant='icon'
          iconVariant='primary'
          size='md'
          aria-label='Download'
          data-testid='toolbar-compatible-button'
        >
          ⬇
        </Button>
      ));

      const button = screen.getByTestId('toolbar-compatible-button');
      expect(button.className).toContain('_icon_');
      expect(button.className).toContain('_primary_');
      expect(button.className).toContain('_md_');
      expect(button).toHaveAttribute('aria-label', 'Download');
    });
  });
});
