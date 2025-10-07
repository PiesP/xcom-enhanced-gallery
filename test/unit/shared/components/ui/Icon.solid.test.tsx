/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { render } from '@solidjs/testing-library';
import { Icon } from '@shared/components/ui/Icon/Icon.solid';

describe('Icon.solid (TDD - Phase 4.1)', () => {
  describe('Basic Rendering', () => {
    it('should render an icon component', () => {
      const { container } = render(() => (
        <Icon>
          <path d='M0 0h24v24H0z' />
        </Icon>
      ));

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('should accept standard icon props', () => {
      const { container } = render(() => (
        <Icon size={20} class='test-icon'>
          <path d='M0 0h24v24H0z' />
        </Icon>
      ));

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('width')).toBe('20px');
      expect(svg?.getAttribute('class')).toBe('test-icon');
    });

    it('should apply size prop correctly', () => {
      const { container } = render(() => (
        <Icon size={16}>
          <path d='M0 0h24v24H0z' />
        </Icon>
      ));

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('16px');
      expect(svg?.getAttribute('height')).toBe('16px');
    });

    it('should apply custom className', () => {
      const { container } = render(() => (
        <Icon class='custom-icon'>
          <path d='M0 0h24v24H0z' />
        </Icon>
      ));

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')).toBe('custom-icon');
    });
  });

  describe('Accessibility', () => {
    it('should have role="img" when aria-label is provided', () => {
      const { container } = render(() => (
        <Icon aria-label='Download'>
          <path d='M0 0h24v24H0z' />
        </Icon>
      ));

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('role')).toBe('img');
      expect(svg?.getAttribute('aria-label')).toBe('Download');
    });

    it('should support aria-label for screen readers', () => {
      const { container } = render(() => (
        <Icon aria-label='Settings icon'>
          <path d='M0 0h24v24H0z' />
        </Icon>
      ));

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('aria-label')).toBe('Settings icon');
    });

    it('should support aria-hidden when decorative', () => {
      const { container } = render(() => (
        <Icon>
          <path d='M0 0h24v24H0z' />
        </Icon>
      ));

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('SVG Integration', () => {
    it('should render inline SVG content', () => {
      const { container } = render(() => (
        <Icon>
          <path d='M18 6l-12 12' />
          <path d='M6 6l12 12' />
        </Icon>
      ));

      const paths = container.querySelectorAll('path');
      expect(paths.length).toBe(2);
    });

    it('should preserve viewBox attribute', () => {
      const { container } = render(() => (
        <Icon>
          <path d='M0 0h24v24H0z' />
        </Icon>
      ));

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    });

    it('should apply fill/stroke props', () => {
      const { container } = render(() => (
        <Icon>
          <path d='M0 0h24v24H0z' />
        </Icon>
      ));

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('fill')).toBe('none');
      expect(svg?.getAttribute('stroke')).toBe('var(--xeg-icon-color, currentColor)');
    });
  });

  describe('Design Tokens', () => {
    it('should use only design tokens for colors', () => {
      const { container } = render(() => (
        <Icon>
          <path d='M0 0h24v24H0z' />
        </Icon>
      ));

      const svg = container.querySelector('svg');
      const stroke = svg?.getAttribute('stroke');

      // Should use CSS variable, not hardcoded color
      expect(stroke).toMatch(/var\(--xeg-icon-color/);
    });

    it('should not use hardcoded color values', () => {
      const { container } = render(() => (
        <Icon>
          <path d='M0 0h24v24H0z' />
        </Icon>
      ));

      const svg = container.querySelector('svg');
      const stroke = svg?.getAttribute('stroke');

      // Should not contain hex colors, rgb(), etc.
      expect(stroke).not.toMatch(/#[0-9a-fA-F]{3,6}/);
      expect(stroke).not.toMatch(/rgb\(/);
    });
  });
});
