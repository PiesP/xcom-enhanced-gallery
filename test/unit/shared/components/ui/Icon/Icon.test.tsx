import { Icon } from '@shared/components/ui/Icon/Icon';
import { render, screen } from '@solidjs/testing-library';
import { describe, expect, it } from 'vitest';

describe('Icon', () => {
  describe('Rendering', () => {
    it('should render an SVG element', () => {
      const { container } = render(() => <Icon />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have correct namespace', () => {
      const { container } = render(() => <Icon />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('xmlns', 'http://www.w3.org/2000/svg');
    });

    it('should have correct viewBox', () => {
      const { container } = render(() => <Icon />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it('should have fill set to none', () => {
      const { container } = render(() => <Icon />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'none');
    });

    it('should have correct stroke attributes', () => {
      const { container } = render(() => <Icon />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('stroke', 'var(--xeg-icon-color, currentColor)');
      expect(svg).toHaveAttribute('stroke-width', 'var(--xeg-icon-stroke-width)');
      expect(svg).toHaveAttribute('stroke-linecap', 'round');
      expect(svg).toHaveAttribute('stroke-linejoin', 'round');
    });

    it('should render children inside SVG', () => {
      const { container } = render(() => (
        <Icon>
          <path d="M0 0L10 10" data-testid="test-path" />
        </Icon>
      ));

      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
      expect(path).toHaveAttribute('d', 'M0 0L10 10');
    });
  });

  describe('Size Handling', () => {
    it('should use default size from CSS variable', () => {
      const { container } = render(() => <Icon />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', 'var(--xeg-icon-size)');
      expect(svg).toHaveAttribute('height', 'var(--xeg-icon-size)');
    });

    it('should convert number size to px', () => {
      const { container } = render(() => <Icon size={24} />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '24px');
      expect(svg).toHaveAttribute('height', '24px');
    });

    it('should use string size as-is', () => {
      const { container } = render(() => <Icon size="2em" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '2em');
      expect(svg).toHaveAttribute('height', '2em');
    });

    it('should handle CSS variable as size', () => {
      const { container } = render(() => <Icon size="var(--xeg-icon-size-lg)" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', 'var(--xeg-icon-size-lg)');
      expect(svg).toHaveAttribute('height', 'var(--xeg-icon-size-lg)');
    });

    it('should handle zero size', () => {
      const { container } = render(() => <Icon size={0} />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '0px');
      expect(svg).toHaveAttribute('height', '0px');
    });
  });

  describe('ClassName Handling', () => {
    it('should apply empty className by default', () => {
      const { container } = render(() => <Icon />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('class', '');
    });

    it('should apply provided className', () => {
      const { container } = render(() => <Icon className="custom-icon" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('custom-icon');
    });

    it('should apply multiple classNames', () => {
      const { container } = render(() => <Icon className="icon-primary icon-large" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('icon-primary');
      expect(svg).toHaveClass('icon-large');
    });
  });

  describe('Accessibility', () => {
    it('should be decorative (aria-hidden) when no aria-label', () => {
      const { container } = render(() => <Icon />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).not.toHaveAttribute('role');
      expect(svg).not.toHaveAttribute('aria-label');
    });

    it('should have role="img" when aria-label is provided', () => {
      render(() => <Icon aria-label="Close button" />);

      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('aria-label', 'Close button');
      expect(svg).not.toHaveAttribute('aria-hidden');
    });

    it('should set correct aria-label value', () => {
      render(() => <Icon aria-label="Download icon" />);

      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('aria-label', 'Download icon');
    });
  });

  describe('Additional Props', () => {
    it('should spread additional props to SVG', () => {
      const { container } = render(() => <Icon data-testid="my-icon" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('data-testid', 'my-icon');
    });

    it('should allow overriding stroke-width', () => {
      const { container } = render(() => <Icon stroke-width="3" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('stroke-width', '3');
    });

    it('should allow custom fill', () => {
      const { container } = render(() => <Icon fill="currentColor" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'currentColor');
    });

    it('should allow custom id', () => {
      const { container } = render(() => <Icon id="unique-icon" />);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('id', 'unique-icon');
    });

    it('should pass through style prop', () => {
      const { container } = render(() => <Icon style={{ color: 'red' }} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Style is applied through props spread
    });
  });

  describe('Complex Scenarios', () => {
    it('should render icon with all props', () => {
      const { container } = render(() => (
        <Icon
          size={32}
          className="icon-custom"
          aria-label="Custom icon"
          data-testid="full-icon"
          stroke-width="2.5"
        >
          <circle cx="12" cy="12" r="10" />
        </Icon>
      ));

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('width', '32px');
      expect(svg).toHaveAttribute('height', '32px');
      expect(svg).toHaveClass('icon-custom');
      expect(svg).toHaveAttribute('aria-label', 'Custom icon');
      expect(svg).toHaveAttribute('role', 'img');
      expect(svg).toHaveAttribute('data-testid', 'full-icon');
      expect(svg).toHaveAttribute('stroke-width', '2.5');

      const circle = svg?.querySelector('circle');
      expect(circle).toBeInTheDocument();
    });

    it('should correctly handle empty children', () => {
      const { container } = render(() => <Icon>{undefined}</Icon>);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.children.length).toBe(0);
    });
  });
});
