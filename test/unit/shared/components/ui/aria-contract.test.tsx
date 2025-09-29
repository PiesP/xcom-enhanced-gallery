/** @jsxImportSource solid-js */
/**
 * @fileoverview ARIA Contract Test (Phase 1 RED - v4.1)
 * @description 버튼 ARIA 속성 계약 테스트 - 접근성 회귀 방지
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import { Button as UnifiedButton } from '../../../../../src/shared/components/ui/Button/Button';

afterEach(() => {
  cleanup();
});

describe('ARIA Contract (v4.1 - RED)', () => {
  describe('Basic ARIA Attributes', () => {
    it('should have role="button" by default', () => {
      const { container } = render(() => (
        <UnifiedButton data-testid='basic-button'>Test</UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('role', 'button');
    });

    it('should support custom aria-label', () => {
      const { container } = render(() => (
        <UnifiedButton aria-label='Custom Label' data-testid='labeled-button'>
          Test
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-label', 'Custom Label');
    });
  });

  describe('Loading State ARIA', () => {
    it('should set aria-busy="true" when loading', () => {
      const { container } = render(() => (
        <UnifiedButton loading data-testid='loading-button'>
          Test
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });

    it('should set aria-disabled="true" when loading', () => {
      const { container } = render(() => (
        <UnifiedButton loading data-testid='loading-disabled'>
          Test
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Disabled State ARIA', () => {
    it('should set aria-disabled="true" when disabled', () => {
      const { container } = render(() => (
        <UnifiedButton disabled data-testid='disabled-button'>
          Test
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have tabIndex="-1" when disabled', () => {
      const { container } = render(() => (
        <UnifiedButton disabled data-testid='disabled-tab'>
          Test
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Pressed State ARIA', () => {
    it('should set aria-pressed="true" when aria-pressed prop is true', () => {
      const { container } = render(() => (
        <UnifiedButton aria-pressed data-testid='pressed-button'>
          Test
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
    });

    it('should set aria-pressed="false" when aria-pressed prop is false', () => {
      const { container } = render(() => (
        <UnifiedButton aria-pressed={false} data-testid='unpressed-button'>
          Test
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Icon Button ARIA Requirements', () => {
    it('icon variant should require aria-label', () => {
      const { container } = render(() => (
        <UnifiedButton variant='icon' data-testid='icon-no-label'>
          ⚙
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).not.toHaveAttribute('aria-label');
    });

    it('icon variant with aria-label should be valid', () => {
      const { container } = render(() => (
        <UnifiedButton variant='icon' aria-label='Settings' data-testid='icon-with-label'>
          ⚙
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-label', 'Settings');
    });
  });

  describe('Expanded State ARIA', () => {
    it('should support aria-expanded for dropdown buttons', () => {
      const { container } = render(() => (
        <UnifiedButton aria-expanded data-testid='expanded-button'>
          Dropdown
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('should support aria-haspopup for dropdown buttons', () => {
      const { container } = render(() => (
        <UnifiedButton aria-haspopup='menu' data-testid='popup-button'>
          Menu
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-haspopup', 'menu');
    });
  });

  describe('ARIA Combinations', () => {
    it('should handle multiple ARIA states correctly', () => {
      const { container } = render(() => (
        <UnifiedButton
          aria-pressed
          aria-expanded={false}
          aria-label='Toggle and Expand'
          data-testid='multi-aria-button'
        >
          Complex
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-pressed', 'true');
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-label', 'Toggle and Expand');
    });

    it('should not have conflicting ARIA states', () => {
      const { container } = render(() => (
        <UnifiedButton loading disabled data-testid='conflict-aria'>
          Conflict
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Describedby Support', () => {
    it('should support aria-describedby', () => {
      const { container } = render(() => (
        <UnifiedButton aria-describedby='help-text' data-testid='described-button'>
          Help
        </UnifiedButton>
      ));
      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-describedby', 'help-text');
    });
  });
});
