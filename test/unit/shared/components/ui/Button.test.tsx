import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import { Button } from '@/shared/components/ui/Button/Button';

describe('Button component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children and respects aria attributes', () => {
    const { container } = render(() => (
      <Button aria-label="Download" data-testid="btn-1" tabIndex={5}>
        Download
      </Button>
    ));
    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(btn).toBeInTheDocument();
    expect(btn.textContent).toContain('Download');
    expect(btn.getAttribute('aria-label')).toBe('Download');
    expect(btn.tabIndex).toBe(5);
  });

  it('warns if iconOnly and missing label', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    render(() => (
      <Button iconOnly>{/* no aria-label */}</Button>
    ));
    expect(consoleWarnSpy).toHaveBeenCalled();
    consoleWarnSpy.mockRestore();
  });

  it('shows spinner and disables button while loading', async () => {
    const { container } = render(() => <Button loading data-testid="btn-loading">Go</Button>);
    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    // Expect spinner element exists
    expect(container.querySelector('.xeg-spinner')).toBeTruthy();
    expect(btn.getAttribute('aria-disabled')).toBe('true');
  });

  it('prevents onClick when disabled', async () => {
    const mock = vi.fn();
    const { container } = render(() => (
      <Button onClick={mock} disabled>Disabled</Button>
    ));
    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    await fireEvent.click(btn);
    expect(mock).not.toHaveBeenCalled();
  });

  it('calls onClick when enabled', async () => {
    const mock = vi.fn();
    const { container } = render(() => <Button onClick={mock}>Click</Button>);
    const btn = container.querySelector('button') as HTMLButtonElement;
    await fireEvent.click(btn);
    expect(mock).toHaveBeenCalled();
  });

});
