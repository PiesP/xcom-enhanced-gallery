import { render, screen, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Button, type ButtonProps, type ButtonSize } from '@shared/components/ui/Button/Button';
import { logger } from '@shared/logging';
import { createSignal } from 'solid-js';
import styles from '@shared/components/ui/Button/Button.module.css';

// Mock logger to check for warnings
vi.mock('@shared/logging', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Define types locally to avoid undefined issues in tests
type ButtonVariant = NonNullable<ButtonProps['variant']>;
type ButtonIntent = NonNullable<ButtonProps['intent']>;

describe('Button Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders with default props', () => {
    render(() => <Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    expect(button).toBeInTheDocument();
    expect(button).toHaveClass(styles.unifiedButton!);
    expect(button).toHaveClass(styles['variant-primary']!); // Default variant
    expect(button).toHaveClass(styles['size-md']!); // Default size
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('renders with different variants', () => {
    const variants: ButtonVariant[] = ['secondary', 'danger', 'ghost', 'icon', 'toolbar'];

    variants.forEach(variant => {
      const { unmount } = render(() => <Button variant={variant}>{variant}</Button>);
      const button = screen.getByRole('button', { name: variant });
      expect(button).toHaveClass(styles[`variant-${variant}`]!);
      unmount();
    });
  });

  it('renders with different sizes', () => {
    const sizes: ButtonSize[] = ['sm', 'lg', 'toolbar'];

    sizes.forEach(size => {
      const { unmount } = render(() => <Button size={size}>{size}</Button>);
      const button = screen.getByRole('button', { name: size });
      expect(button).toHaveClass(styles[`size-${size}`]!);
      unmount();
    });
  });

  it('renders with intents', () => {
    const intents: ButtonIntent[] = ['success', 'warning', 'danger'];

    intents.forEach(intent => {
      const { unmount } = render(() => <Button intent={intent}>{intent}</Button>);
      const button = screen.getByRole('button', { name: intent });
      expect(button).toHaveClass(styles[`intent-${intent}`]!);
      unmount();
    });
  });

  it('handles disabled state', () => {
    const handleClick = vi.fn();
    render(() => <Button disabled onClick={handleClick}>Disabled</Button>);

    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveClass(styles.disabled!);

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('handles loading state', () => {
    const handleClick = vi.fn();
    render(() => <Button loading onClick={handleClick}>Loading</Button>);

    const button = screen.getByRole('button', { name: /loading/i });
    // Loading implies disabled for interaction
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveClass(styles.loading!);

    // Should show spinner (implementation detail: check for spinner class)
    const spinner = button.querySelector('.xeg-spinner');
    expect(spinner).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('handles iconOnly prop and logs warning if no label', () => {
    render(() => <Button variant="icon" iconOnly>Icon</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass(styles.iconOnly!);

    // Should warn because no aria-label provided
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Icon-only buttons must have accessible labels'),
      expect.any(Object)
    );
  });

  it('does not log warning for iconOnly if label provided', () => {
    render(() => <Button variant="icon" iconOnly aria-label="Save">Icon</Button>);

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('forwards ref', () => {
    let ref: HTMLButtonElement | null = null;
    render(() => <Button ref={(el) => { ref = el; }}>Ref Button</Button>);

    expect(ref).toBeInstanceOf(HTMLButtonElement);
    expect(ref).toHaveTextContent('Ref Button');
  });

  it('handles reactive props', async () => {
    const [isLoading, setIsLoading] = createSignal(false);

    render(() => <Button loading={isLoading()}>Reactive</Button>);

    const button = screen.getByRole('button', { name: /reactive/i });
    expect(button).not.toHaveClass(styles.loading!);
    expect(button).not.toBeDisabled();

    setIsLoading(true);

    // SolidJS updates are synchronous in tests usually, but let's verify
    expect(button).toHaveClass(styles.loading!);
    expect(button).toBeDisabled();
  });

  it('prevents events when disabled', () => {
    const handlers = {
      onClick: vi.fn(),
      onMouseDown: vi.fn(),
      onMouseUp: vi.fn(),
      onKeyDown: vi.fn()
    };

    render(() => (
      <Button
        disabled
        onClick={handlers.onClick}
        onMouseDown={handlers.onMouseDown}
        onMouseUp={handlers.onMouseUp}
        onKeyDown={handlers.onKeyDown}
      >
        No Events
      </Button>
    ));

    const button = screen.getByRole('button');

    fireEvent.click(button);
    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    fireEvent.keyDown(button, { key: 'Enter' });

    expect(handlers.onClick).not.toHaveBeenCalled();
    expect(handlers.onMouseDown).not.toHaveBeenCalled();
    expect(handlers.onMouseUp).not.toHaveBeenCalled();
    expect(handlers.onKeyDown).not.toHaveBeenCalled();
  });

  it('calls event handlers when enabled', () => {
    const handlers = {
      onClick: vi.fn(),
      onMouseDown: vi.fn(),
      onMouseUp: vi.fn(),
      onKeyDown: vi.fn(),
      onFocus: vi.fn(),
      onBlur: vi.fn(),
      onMouseEnter: vi.fn(),
      onMouseLeave: vi.fn()
    };

    render(() => (
      <Button
        onClick={handlers.onClick}
        onMouseDown={handlers.onMouseDown}
        onMouseUp={handlers.onMouseUp}
        onKeyDown={handlers.onKeyDown}
        onFocus={handlers.onFocus}
        onBlur={handlers.onBlur}
        onMouseEnter={handlers.onMouseEnter}
        onMouseLeave={handlers.onMouseLeave}
      >
        Events
      </Button>
    ));

    const button = screen.getByRole('button');

    fireEvent.click(button);
    fireEvent.mouseDown(button);
    fireEvent.mouseUp(button);
    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.focus(button);
    fireEvent.blur(button);
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);

    expect(handlers.onClick).toHaveBeenCalledTimes(1);
    expect(handlers.onMouseDown).toHaveBeenCalledTimes(1);
    expect(handlers.onMouseUp).toHaveBeenCalledTimes(1);
    expect(handlers.onKeyDown).toHaveBeenCalledTimes(1);
    expect(handlers.onFocus).toHaveBeenCalledTimes(1);
    expect(handlers.onBlur).toHaveBeenCalledTimes(1);
    expect(handlers.onMouseEnter).toHaveBeenCalledTimes(1);
    expect(handlers.onMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('handles className as function', () => {
    const dynamicClass = () => 'dynamic-class-test';
    render(() => <Button className={dynamicClass as unknown as string}>Dynamic Class</Button>);

    const button = screen.getByRole('button', { name: /dynamic class/i });
    expect(button).toHaveClass('dynamic-class-test');
  });

  it('handles class prop as function', () => {
    const dynamicClass = () => 'dynamic-class-prop';
    render(() => <Button class={dynamicClass as unknown as string}>Dynamic Class Prop</Button>);

    const button = screen.getByRole('button', { name: /dynamic class prop/i });
    expect(button).toHaveClass('dynamic-class-prop');
  });

  it('handles tabIndex as function', () => {
    const dynamicTabIndex = () => 5;
    render(() => <Button tabIndex={dynamicTabIndex as unknown as number}>Tab Index</Button>);

    const button = screen.getByRole('button', { name: /tab index/i });
    expect(button).toHaveAttribute('tabindex', '5');
  });

  it('sets tabIndex to -1 when disabled', () => {
    render(() => <Button disabled tabIndex={5}>Disabled Tab</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('tabindex', '-1');
  });

  it('applies additional ARIA attributes', () => {
    render(() => (
      <Button
        aria-expanded="true"
        aria-controls="menu-1"
        aria-haspopup="true"
        aria-describedby="desc-1"
      >
        ARIA Button
      </Button>
    ));

    const button = screen.getByRole('button', { name: /aria button/i });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveAttribute('aria-controls', 'menu-1');
    expect(button).toHaveAttribute('aria-haspopup', 'true');
    expect(button).toHaveAttribute('aria-describedby', 'desc-1');
  });

  it('applies data attributes', () => {
    render(() => (
      <Button
        data-testid="custom-test-id"
        data-gallery-element="custom-element"
        data-selected="true"
      >
        Data Button
      </Button>
    ));

    const button = screen.getByTestId('custom-test-id');
    expect(button).toHaveAttribute('data-gallery-element', 'custom-element');
    expect(button).toHaveAttribute('data-selected', 'true');
  });

  it('applies navigation and action variants', () => {
    const { unmount: unmount1 } = render(() => <Button variant="navigation">Nav</Button>);
    expect(screen.getByRole('button', { name: 'Nav' })).toHaveClass(styles['variant-navigation']!);
    unmount1();

    render(() => <Button variant="action">Action</Button>);
    expect(screen.getByRole('button', { name: 'Action' })).toHaveClass(styles['variant-action']!);
  });

  it('applies primary and secondary intents', () => {
    const { unmount: unmount1 } = render(() => <Button intent="primary">Primary</Button>);
    expect(screen.getByRole('button', { name: 'Primary' })).toHaveClass(styles['intent-primary']!);
    unmount1();

    render(() => <Button intent="secondary">Secondary</Button>);
    expect(screen.getByRole('button', { name: 'Secondary' })).toHaveClass(styles['intent-secondary']!);
  });

  it('does not warn for iconOnly with aria-labelledby', () => {
    render(() => (
      <>
        <span id="label-id">Download file</span>
        <Button variant="icon" iconOnly aria-labelledby="label-id">Icon</Button>
      </>
    ));

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('does not warn for iconOnly with title', () => {
    render(() => <Button variant="icon" iconOnly title="Download">Icon</Button>);

    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('applies form and id attributes', () => {
    render(() => <Button id="btn-1" type="submit">Submit</Button>);

    const button = screen.getByRole('button', { name: /submit/i });
    expect(button).toHaveAttribute('id', 'btn-1');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('sets aria-pressed when provided', () => {
    render(() => <Button aria-pressed="true">Toggle</Button>);

    const button = screen.getByRole('button', { name: /toggle/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('clears ref on unmount', () => {
    let ref: HTMLButtonElement | null = null;
    const { unmount } = render(() => <Button ref={(el) => { ref = el; }}>Unmount Test</Button>);

    expect(ref).toBeInstanceOf(HTMLButtonElement);

    unmount();

    expect(ref).toBeNull();
  });
});
