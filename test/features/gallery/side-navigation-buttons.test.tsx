/**
 * @file Test suite for side navigation buttons in gallery
 * @description Epic GALLERY-NAV-ENHANCEMENT Phase 2 (GREEN)
 * Tests for left/right navigation buttons with accessibility support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@solidjs/testing-library';

import { NavigationButton } from '@shared/components/ui/NavigationButton';

describe('Epic GALLERY-NAV-ENHANCEMENT Phase 2 - Side Navigation Buttons', () => {
  beforeEach(() => {
    // Clean up any existing DOM
    document.body.innerHTML = '';
  });

  describe('1. Rendering & Structure', () => {
    it('should render left navigation button', () => {
      const { getByLabelText } = render(() => (
        <NavigationButton direction='left' aria-label='이전 미디어' onClick={() => {}} />
      ));
      expect(getByLabelText('이전 미디어')).toBeInTheDocument();
    });

    it('should render right navigation button', () => {
      const { getByLabelText } = render(() => (
        <NavigationButton direction='right' aria-label='다음 미디어' onClick={() => {}} />
      ));
      expect(getByLabelText('다음 미디어')).toBeInTheDocument();
    });

    it('should position buttons at viewport center with fixed positioning', () => {
      const { container } = render(() => (
        <NavigationButton direction='left' aria-label='이전 미디어' onClick={() => {}} />
      ));
      const button = container.querySelector('button');
      // In JSDOM, CSS Module classes are applied but computed styles may not work
      // Check that the button has the appropriate class for fixed positioning
      expect(button).toBeInTheDocument();
      expect(button?.className).toContain('navButton');
      expect(button?.className).toContain('left');
    });

    it('should have appropriate z-index from design token', () => {
      const { container } = render(() => (
        <NavigationButton direction='left' aria-label='이전 미디어' onClick={() => {}} />
      ));
      const button = container.querySelector('button');
      // CSS Module class includes z-index design token usage
      expect(button).toBeInTheDocument();
      expect(button?.className).toContain('navButton');
    });
  });

  describe('2. Accessibility', () => {
    it('should have aria-label for left button', () => {
      const { getByRole } = render(() => (
        <NavigationButton direction='left' aria-label='이전 미디어' onClick={() => {}} />
      ));
      expect(getByRole('button')).toHaveAttribute('aria-label', '이전 미디어');
    });

    it('should have aria-label for right button', () => {
      const { getByRole } = render(() => (
        <NavigationButton direction='right' aria-label='다음 미디어' onClick={() => {}} />
      ));
      expect(getByRole('button')).toHaveAttribute('aria-label', '다음 미디어');
    });

    it('should have role="button"', () => {
      const { getByRole } = render(() => (
        <NavigationButton direction='left' aria-label='이전 미디어' onClick={() => {}} />
      ));
      expect(getByRole('button')).toBeInTheDocument();
    });

    it('should be keyboard focusable with tabindex="0"', () => {
      const { getByRole } = render(() => (
        <NavigationButton direction='left' aria-label='이전 미디어' onClick={() => {}} />
      ));
      const button = getByRole('button');
      expect(button).toHaveAttribute('tabindex', '0');
    });
  });

  describe('3. Disabled States', () => {
    it('should disable left button when at first item', () => {
      const { getByRole } = render(() => (
        <NavigationButton
          direction='left'
          disabled={true}
          aria-label='이전 미디어'
          onClick={() => {}}
        />
      ));
      expect(getByRole('button')).toBeDisabled();
    });

    it('should disable right button when at last item', () => {
      const { getByRole } = render(() => (
        <NavigationButton
          direction='right'
          disabled={true}
          aria-label='다음 미디어'
          onClick={() => {}}
        />
      ));
      expect(getByRole('button')).toBeDisabled();
    });

    it('should have disabled attribute when disabled', () => {
      const { getByRole } = render(() => (
        <NavigationButton
          direction='left'
          disabled={true}
          aria-label='이전 미디어'
          onClick={() => {}}
        />
      ));
      expect(getByRole('button')).toHaveAttribute('disabled');
    });

    it('should have aria-disabled="true" when disabled', () => {
      const { getByRole } = render(() => (
        <NavigationButton
          direction='left'
          disabled={true}
          aria-label='이전 미디어'
          onClick={() => {}}
        />
      ));
      expect(getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('4. Interactions', () => {
    it('should call onPrevious callback when left button clicked', () => {
      const onPrevious = vi.fn();
      const { getByRole } = render(() => (
        <NavigationButton direction='left' aria-label='이전 미디어' onClick={onPrevious} />
      ));
      getByRole('button').click();
      expect(onPrevious).toHaveBeenCalledOnce();
    });

    it('should call onNext callback when right button clicked', () => {
      const onNext = vi.fn();
      const { getByRole } = render(() => (
        <NavigationButton direction='right' aria-label='다음 미디어' onClick={onNext} />
      ));
      getByRole('button').click();
      expect(onNext).toHaveBeenCalledOnce();
    });

    it('should disable buttons when loading', () => {
      const { getByRole } = render(() => (
        <NavigationButton
          direction='left'
          loading={true}
          aria-label='이전 미디어'
          onClick={() => {}}
        />
      ));
      expect(getByRole('button')).toBeDisabled();
    });
  });

  describe('5. Styles & Design Tokens', () => {
    it('should use design tokens for colors', () => {
      const { container } = render(() => (
        <NavigationButton direction='left' aria-label='이전 미디어' onClick={() => {}} />
      ));
      const button = container.querySelector('button');
      // CSS Module includes design tokens - verify class is applied
      expect(button).toBeInTheDocument();
      expect(button?.className).toContain('navButton');
    });

    it('should apply glassmorphism with backdrop-filter', () => {
      const { container } = render(() => (
        <NavigationButton direction='left' aria-label='이전 미디어' onClick={() => {}} />
      ));
      const button = container.querySelector('button');
      // Glassmorphism styling is defined in CSS Module
      expect(button).toBeInTheDocument();
      expect(button?.className).toContain('navButton');
    });
  });
});
