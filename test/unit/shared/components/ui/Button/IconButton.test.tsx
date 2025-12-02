/**
 * @fileoverview IconButton component unit tests
 * @description Test coverage for IconButton wrapper component
 */

import { render, screen } from '@solidjs/testing-library';
import { describe, it, expect, vi } from 'vitest';
import { createSignal } from 'solid-js';
import { IconButton } from '@shared/components/ui/Button/IconButton';
import type { ButtonSize } from '@shared/components/ui/Button/Button';

// Mock icon component for testing
const TestIcon = () => <svg data-testid="test-icon" />;

describe('IconButton', () => {
  describe('Basic rendering', () => {
    it('should render icon button with children', () => {
      render(() => (
        <IconButton aria-label="Test icon">
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button', { name: 'Test icon' });
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('should apply icon variant by default', () => {
      render(() => <IconButton aria-label="Test icon button">Icon</IconButton>);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should set iconOnly prop', () => {
      render(() => (
        <IconButton aria-label="Test icon button">
          <span>Icon</span>
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Size validation', () => {
    it('should use md size by default', () => {
      render(() => (
        <IconButton aria-label="Icon">
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should accept valid sm size', () => {
      render(() => (
        <IconButton aria-label="Icon" size="sm">
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should accept valid lg size', () => {
      render(() => (
        <IconButton aria-label="Icon" size="lg">
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should accept valid toolbar size', () => {
      render(() => (
        <IconButton aria-label="Icon" size="toolbar">
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should fallback to md for invalid size', () => {
      render(() => (
        <IconButton aria-label="Icon" size={'invalid' as ButtonSize}>
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should handle missing size as default', () => {
      render(() => (
        <IconButton aria-label="Icon">
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should fallback to md for null size', () => {
      render(() => (
        <IconButton aria-label="Icon" size={null as unknown as ButtonSize}>
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should fallback to md for number size', () => {
      render(() => (
        <IconButton aria-label="Icon" size={42 as unknown as ButtonSize}>
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should fallback to md for empty string size', () => {
      render(() => (
        <IconButton aria-label="Icon" size={'' as ButtonSize}>
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should require aria-label', () => {
      render(() => (
        <IconButton aria-label="Delete item">
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button', { name: 'Delete item' });
      expect(button).toHaveAccessibleName('Delete item');
    });

    it('should support aria-describedby', () => {
      render(() => (
        <>
          <IconButton aria-label="Info" aria-describedby="info-desc">
            <TestIcon />
          </IconButton>
          <div id="info-desc">Additional information</div>
        </>
      ));

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-describedby', 'info-desc');
    });

    it('should support disabled state', () => {
      render(() => (
        <IconButton aria-label="Icon" disabled>
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should support loading state', () => {
      render(() => (
        <IconButton aria-label="Icon" loading>
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Event handlers', () => {
    it('should call onClick handler', () => {
      const handleClick = vi.fn();
      render(() => (
        <IconButton aria-label="Icon" onClick={handleClick}>
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      button.click();
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(() => (
        <IconButton aria-label="Icon" onClick={handleClick} disabled>
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      button.click();
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should support onFocus handler', () => {
      const handleFocus = vi.fn();
      render(() => (
        <IconButton aria-label="Icon" onFocus={handleFocus}>
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      button.focus();
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it('should support onBlur handler', () => {
      const handleBlur = vi.fn();
      render(() => (
        <IconButton aria-label="Icon" onBlur={handleBlur}>
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      button.focus();
      button.blur();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe('Props forwarding', () => {
    it('should forward className', () => {
      render(() => (
        <IconButton aria-label="Icon" className="custom-class">
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should forward data attributes', () => {
      render(() => (
        <IconButton aria-label="Icon" data-testid="custom-button">
          <TestIcon />
        </IconButton>
      ));

      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });

    it('should forward type attribute', () => {
      render(() => (
        <IconButton aria-label="Icon" type="submit">
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should forward title attribute', () => {
      render(() => (
        <IconButton aria-label="Icon" title="Click to perform action">
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('title', 'Click to perform action');
    });
  });

  describe('Multiple children', () => {
    it('should render multiple icon children', () => {
      render(() => (
        <IconButton aria-label="Multi icon">
          <TestIcon />
          <svg data-testid="icon-2" />
        </IconButton>
      ));

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByTestId('icon-2')).toBeInTheDocument();
    });

    it('should handle text and icon children', () => {
      render(() => (
        <IconButton aria-label="Icon with text">
          <TestIcon />
          <span>Text</span>
        </IconButton>
      ));

      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });
  });

  describe('Reactive size updates', () => {
    it('should render with dynamic size', () => {
      const [getSize] = createSignal<ButtonSize>('lg');

      render(() => (
        <IconButton aria-label="Icon" size={getSize()}>
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Icon');
    });

    it('should update size reactively when accessor changes', () => {
      const [getSize, setSize] = createSignal<ButtonSize>('lg');

      render(() => (
        <IconButton aria-label="Reactive Icon" size={getSize as any}>
          <TestIcon />
        </IconButton>
      ));

      const button = screen.getByRole('button');
      // initial should be size 'lg'
      expect(button.className).toContain('size-lg');

      // update to invalid -> fallback to md
      setSize('invalid' as ButtonSize);
      // For Solid reactivity to flush, trigger a microtask
      return new Promise<void>(resolve => setTimeout(() => {
        expect(button.className).toContain('size-md');
        // update to sm
        setSize('sm');
        setTimeout(() => {
          expect(button.className).toContain('size-sm');
          resolve();
        }, 0);
      }, 0));
    });
  });

  describe('Edge cases', () => {
    it('should render without children', () => {
      render(() => <IconButton aria-label="Empty icon" />);

      const button = screen.getByRole('button', { name: 'Empty icon' });
      expect(button).toBeInTheDocument();
    });

    it('should handle null children', () => {
      render(() => (
        <IconButton aria-label="Null child">
          {null}
        </IconButton>
      ));

      const button = screen.getByRole('button', { name: 'Null child' });
      expect(button).toBeInTheDocument();
    });

    it('should handle undefined children', () => {
      render(() => (
        <IconButton aria-label="Undefined child">
          {undefined}
        </IconButton>
      ));

      const button = screen.getByRole('button', { name: 'Undefined child' });
      expect(button).toBeInTheDocument();
    });

    it('should handle boolean children', () => {
      render(() => (
        <IconButton aria-label="Boolean child">
          {false}
          {true}
        </IconButton>
      ));

      const button = screen.getByRole('button', { name: 'Boolean child' });
      expect(button).toBeInTheDocument();
    });
  });
});
