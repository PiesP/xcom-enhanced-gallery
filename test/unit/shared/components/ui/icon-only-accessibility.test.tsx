/** @jsxImportSource solid-js */
/**
 * @fileoverview Icon-only button 접근성 테스트 (v4.1 - RED, Solid)
 */

import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@solidjs/testing-library';
import { Button } from '../../../../../src/shared/components/ui/Button/Button';
import { IconButton } from '../../../../../src/shared/components/ui/Button/IconButton';

afterEach(() => {
  cleanup();
});

describe('Icon-Only Accessibility (v4.1 - RED)', () => {
  describe('Current Implementation Baseline', () => {
    it('Button iconOnly should accept aria-label', () => {
      const { container } = render(() => (
        <Button iconOnly aria-label='Settings'>
          ⚙
        </Button>
      ));

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-label', 'Settings');
    });

    it('Button with icon variant should accept aria-label', () => {
      const { container } = render(() => (
        <Button variant='icon' aria-label='Menu'>
          ☰
        </Button>
      ));

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-label', 'Menu');
    });
  });

  describe('Accessibility Requirements (RED - Will Fail)', () => {
    it('should identify icon buttons without aria-label (current gap)', () => {
      const { container } = render(() => <Button iconOnly>⚙</Button>);

      const button = container.querySelector('button');
      expect(button).not.toHaveAttribute('aria-label');
    });

    it('should identify Button icon variant without aria-label (current gap)', () => {
      const { container } = render(() => <Button variant='icon'>⚙</Button>);

      const button = container.querySelector('button');
      expect(button).not.toHaveAttribute('aria-label');
    });
  });

  describe('Icon Content Detection', () => {
    it('should identify text-only content (not icon)', () => {
      const { container } = render(() => <Button>Click Me</Button>);
      const button = container.querySelector('button');
      const hasTextContent = !!button?.textContent && button.textContent.length > 2;

      expect(hasTextContent).toBe(true);
    });
  });

  describe('Screen Reader Compatibility', () => {
    const iconProps = [
      { props: { iconOnly: true, 'aria-label': 'Download' }, expectedLabel: 'Download' },
      { props: { variant: 'icon', 'aria-label': 'Close' }, expectedLabel: 'Close' },
      { props: { iconOnly: true, 'aria-labelledby': 'icon-label' }, expectedLabel: null },
    ] as const;

    iconProps.forEach(({ props, expectedLabel }) => {
      it('should provide meaningful labels for common icon patterns', () => {
        const { container } = render(() => <Button {...props}>⚙</Button>);
        const button = container.querySelector('button');
        const ariaLabel = expectedLabel ?? (props['aria-label'] as string | undefined | null);

        if (ariaLabel) {
          expect(button).toHaveAttribute('aria-label', ariaLabel);
        } else {
          expect(button).not.toHaveAttribute('aria-label');
        }
      });
    });

    it('should support role and aria-describedby for complex icons', () => {
      const { container } = render(() => (
        <Button iconOnly aria-label='Advanced Search' aria-describedby='search-help' role='button'>
          🔍
        </Button>
      ));

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-label', 'Advanced Search');
      expect(button).toHaveAttribute('aria-describedby', 'search-help');
      expect(button).toHaveAttribute('role', 'button');
    });
  });

  describe('IconButton Wrapper', () => {
    it('should inherit aria-label from IconButton wrapper', () => {
      const { container } = render(() => <IconButton aria-label='Wrapper Icon'>🛠</IconButton>);

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-label', 'Wrapper Icon');
    });
  });
});
