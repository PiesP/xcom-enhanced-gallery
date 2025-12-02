/**
 * @fileoverview Additional mutation tests for Button component
 * @description Tests targeting state changes, event handling, and edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { Button } from '@shared/components/ui/Button/Button';

describe('Button component mutation tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading state behavior', () => {
    it('should set aria-busy to true when loading', () => {
      const { container } = render(() => <Button loading>Loading</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.getAttribute('aria-busy')).toBe('true');
    });

    it('should prevent click events when loading', async () => {
      const onClick = vi.fn();
      const { container } = render(() => (
        <Button loading onClick={onClick}>
          Loading
        </Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      await fireEvent.click(btn);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should set tabIndex to -1 when disabled', () => {
      const { container } = render(() => <Button disabled>Disabled</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.tabIndex).toBe(-1);
    });

    it('should preserve tabIndex when enabled', () => {
      const { container } = render(() => <Button tabIndex={3}>Normal</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.tabIndex).toBe(3);
    });
  });

  describe('Disabled state behavior', () => {
    it('should set aria-disabled attribute when disabled', () => {
      const { container } = render(() => <Button disabled>Disabled</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.getAttribute('aria-disabled')).toBe('true');
    });

    it('should prevent onMouseDown when disabled', async () => {
      const onMouseDown = vi.fn();
      const { container } = render(() => (
        <Button disabled onMouseDown={onMouseDown}>
          Disabled
        </Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      await fireEvent.mouseDown(btn);

      expect(onMouseDown).not.toHaveBeenCalled();
    });

    it('should prevent onMouseUp when disabled', async () => {
      const onMouseUp = vi.fn();
      const { container } = render(() => (
        <Button disabled onMouseUp={onMouseUp}>
          Disabled
        </Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      await fireEvent.mouseUp(btn);

      expect(onMouseUp).not.toHaveBeenCalled();
    });

    it('should prevent onKeyDown when disabled', async () => {
      const onKeyDown = vi.fn();
      const { container } = render(() => (
        <Button disabled onKeyDown={onKeyDown}>
          Disabled
        </Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      await fireEvent.keyDown(btn, { key: 'Enter' });

      expect(onKeyDown).not.toHaveBeenCalled();
    });
  });

  describe('Event propagation', () => {
    it('should prevent default when disabled and clicked', async () => {
      const onClick = vi.fn();
      const { container } = render(() => (
        <Button disabled onClick={onClick}>Disabled</Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      await fireEvent.click(btn);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should call onClick when enabled', async () => {
      const onClick = vi.fn();
      const { container } = render(() => <Button onClick={onClick}>Click</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      await fireEvent.click(btn);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Mouse events when enabled', () => {
    it('should call onMouseDown when enabled', async () => {
      const onMouseDown = vi.fn();
      const { container } = render(() => <Button onMouseDown={onMouseDown}>Btn</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      await fireEvent.mouseDown(btn);

      expect(onMouseDown).toHaveBeenCalled();
    });

    it('should call onMouseUp when enabled', async () => {
      const onMouseUp = vi.fn();
      const { container } = render(() => <Button onMouseUp={onMouseUp}>Btn</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      await fireEvent.mouseUp(btn);

      expect(onMouseUp).toHaveBeenCalled();
    });

    it('should call onKeyDown when enabled', async () => {
      const onKeyDown = vi.fn();
      const { container } = render(() => <Button onKeyDown={onKeyDown}>Btn</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      await fireEvent.keyDown(btn, { key: 'Enter' });

      expect(onKeyDown).toHaveBeenCalled();
    });

    it('should call onFocus when enabled', async () => {
      const onFocus = vi.fn();
      const { container } = render(() => <Button onFocus={onFocus}>Btn</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      await fireEvent.focus(btn);

      expect(onFocus).toHaveBeenCalled();
    });

    it('should call onBlur when enabled', async () => {
      const onBlur = vi.fn();
      const { container } = render(() => <Button onBlur={onBlur}>Btn</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      await fireEvent.blur(btn);

      expect(onBlur).toHaveBeenCalled();
    });

    it('should call onMouseEnter', async () => {
      const onMouseEnter = vi.fn();
      const { container } = render(() => <Button onMouseEnter={onMouseEnter}>Btn</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      await fireEvent.mouseEnter(btn);

      expect(onMouseEnter).toHaveBeenCalled();
    });

    it('should call onMouseLeave', async () => {
      const onMouseLeave = vi.fn();
      const { container } = render(() => <Button onMouseLeave={onMouseLeave}>Btn</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      await fireEvent.mouseLeave(btn);

      expect(onMouseLeave).toHaveBeenCalled();
    });
  });

  describe('Variant classes', () => {
    it('should apply primary variant class by default', () => {
      const { container } = render(() => <Button>Primary</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('variant-primary');
    });

    it('should apply secondary variant class', () => {
      const { container } = render(() => <Button variant="secondary">Secondary</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('variant-secondary');
    });

    it('should apply icon variant class', () => {
      const { container } = render(() => (
        <Button variant="icon" aria-label="Icon">
          Icon
        </Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('variant-icon');
    });

    it('should apply danger variant class', () => {
      const { container } = render(() => <Button variant="danger">Danger</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('variant-danger');
    });

    it('should apply ghost variant class', () => {
      const { container } = render(() => <Button variant="ghost">Ghost</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('variant-ghost');
    });

    it('should apply toolbar variant class', () => {
      const { container } = render(() => <Button variant="toolbar">Toolbar</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('variant-toolbar');
    });

    it('should apply navigation variant class', () => {
      const { container } = render(() => <Button variant="navigation">Navigation</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('variant-navigation');
    });

    it('should apply action variant class', () => {
      const { container } = render(() => <Button variant="action">Action</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('variant-action');
    });
  });

  describe('Size classes', () => {
    it('should apply md size class by default', () => {
      const { container } = render(() => <Button>Medium</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('size-md');
    });

    it('should apply sm size class', () => {
      const { container } = render(() => <Button size="sm">Small</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('size-sm');
    });

    it('should apply lg size class', () => {
      const { container } = render(() => <Button size="lg">Large</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('size-lg');
    });

    it('should apply toolbar size class', () => {
      const { container } = render(() => <Button size="toolbar">Toolbar</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('size-toolbar');
    });
  });

  describe('Intent classes', () => {
    it('should apply intent class when provided', () => {
      const { container } = render(() => <Button intent="danger">Danger</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('intent-danger');
    });

    it('should apply success intent class', () => {
      const { container } = render(() => <Button intent="success">Success</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('intent-success');
    });

    it('should apply warning intent class', () => {
      const { container } = render(() => <Button intent="warning">Warning</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('intent-warning');
    });

    it('should not apply intent class when not provided', () => {
      const { container } = render(() => <Button>No Intent</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).not.toContain('intent-');
    });
  });

  describe('Icon-only accessibility', () => {
    it('should not warn when icon-only button has aria-label', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      render(() => (
        <Button iconOnly aria-label="Test">
          Icon
        </Button>
      ));

      // Should not have logged warning about missing label
      const accessibilityWarnings = warnSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' && call[0].includes('accessible labels'),
      );
      expect(accessibilityWarnings).toHaveLength(0);

      warnSpy.mockRestore();
    });

    it('should not warn when icon-only button has aria-labelledby', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      render(() => (
        <Button iconOnly aria-labelledby="some-id">
          Icon
        </Button>
      ));

      const accessibilityWarnings = warnSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' && call[0].includes('accessible labels'),
      );
      expect(accessibilityWarnings).toHaveLength(0);

      warnSpy.mockRestore();
    });

    it('should not warn when icon-only button has title', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      render(() => (
        <Button iconOnly title="Test Title">
          Icon
        </Button>
      ));

      const accessibilityWarnings = warnSpy.mock.calls.filter(
        (call) =>
          typeof call[0] === 'string' && call[0].includes('accessible labels'),
      );
      expect(accessibilityWarnings).toHaveLength(0);

      warnSpy.mockRestore();
    });

    it('should apply iconOnly class when iconOnly is true', () => {
      const { container } = render(() => (
        <Button iconOnly aria-label="Icon">
          <span>Icon</span>
        </Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('iconOnly');
    });
  });

  describe('ARIA attributes', () => {
    it('should pass aria-pressed attribute', () => {
      const { container } = render(() => (
        <Button aria-pressed="true">Pressed</Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.getAttribute('aria-pressed')).toBe('true');
    });

    it('should pass aria-expanded attribute', () => {
      const { container } = render(() => (
        <Button aria-expanded="true">Expanded</Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.getAttribute('aria-expanded')).toBe('true');
    });

    it('should pass aria-controls attribute', () => {
      const { container } = render(() => (
        <Button aria-controls="menu-1">Controls</Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.getAttribute('aria-controls')).toBe('menu-1');
    });

    it('should pass aria-haspopup attribute', () => {
      const { container } = render(() => (
        <Button aria-haspopup="true">HasPopup</Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.getAttribute('aria-haspopup')).toBe('true');
    });

    it('should pass aria-describedby attribute', () => {
      const { container } = render(() => (
        <Button aria-describedby="desc-1">Described</Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.getAttribute('aria-describedby')).toBe('desc-1');
    });
  });

  describe('Data attributes', () => {
    it('should pass data-testid attribute', () => {
      const { container } = render(() => (
        <Button data-testid="test-btn">Test</Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.getAttribute('data-testid')).toBe('test-btn');
    });

    it('should pass data-gallery-element attribute', () => {
      const { container } = render(() => (
        <Button data-gallery-element="nav-btn">Gallery</Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.getAttribute('data-gallery-element')).toBe('nav-btn');
    });
  });

  describe('Button type', () => {
    it('should default to type="button"', () => {
      const { container } = render(() => <Button>Default</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.type).toBe('button');
    });

    it('should respect type="submit"', () => {
      const { container } = render(() => <Button type="submit">Submit</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.type).toBe('submit');
    });

    it('should respect type="reset"', () => {
      const { container } = render(() => <Button type="reset">Reset</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.type).toBe('reset');
    });
  });

  describe('Ref handling', () => {
    it('should call ref callback with button element', () => {
      const refCallback = vi.fn();
      render(() => <Button ref={refCallback}>Ref</Button>);

      expect(refCallback).toHaveBeenCalledWith(expect.any(HTMLButtonElement));
    });

    it('should call ref callback with null on cleanup', () => {
      const refCallback = vi.fn();
      const { unmount } = render(() => <Button ref={refCallback}>Ref</Button>);

      unmount();

      expect(refCallback).toHaveBeenLastCalledWith(null);
    });
  });

  describe('Spinner rendering', () => {
    it('should render spinner element when loading', () => {
      const { container } = render(() => <Button loading>Loading</Button>);

      expect(container.querySelector('.xeg-spinner')).toBeInTheDocument();
    });

    it('should not render spinner element when not loading', () => {
      const { container } = render(() => <Button>Not Loading</Button>);

      expect(container.querySelector('.xeg-spinner')).not.toBeInTheDocument();
    });

    it('should set aria-hidden on spinner', () => {
      const { container } = render(() => <Button loading>Loading</Button>);
      const spinner = container.querySelector('.xeg-spinner');

      expect(spinner?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  describe('Class name merging', () => {
    it('should merge custom className', () => {
      const { container } = render(() => (
        <Button className="custom-class">Custom</Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('custom-class');
    });

    it('should merge custom class attribute', () => {
      const { container } = render(() => <Button class="alt-class">Alt</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.className).toContain('alt-class');
    });
  });

  describe('Loading combined with disabled', () => {
    it('should be disabled when loading even if disabled prop is false', () => {
      const { container } = render(() => (
        <Button loading disabled={false}>
          Loading
        </Button>
      ));
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.disabled).toBe(true);
    });
  });

  describe('ID attribute', () => {
    it('should pass id attribute', () => {
      const { container } = render(() => <Button id="my-button">ID</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.id).toBe('my-button');
    });
  });

  describe('Title attribute', () => {
    it('should pass title attribute', () => {
      const { container } = render(() => <Button title="My Title">Title</Button>);
      const btn = container.querySelector('button') as HTMLButtonElement;

      expect(btn.title).toBe('My Title');
    });
  });
});
