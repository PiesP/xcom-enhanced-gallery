import { render, screen } from '@solidjs/testing-library';
import { describe, it, expect } from 'vitest';
import { IconButton } from '@shared/components/ui/Button/IconButton';

// Simple svg icon for testing
const TestIcon = () => <svg data-testid="test-icon" />;

describe('IconButton unit tests', () => {
  it('should render icon button with children', () => {
    render(() => (
      <IconButton aria-label="test">
        <TestIcon />
      </IconButton>
    ));

    const icon = screen.getByTestId('test-icon');
    expect(icon).toBeInTheDocument();
  });

  it('fallbacks to md when invalid size provided', () => {
    render(() => (
      <IconButton aria-label="invalid-size" size={'invalid' as any}>
        <TestIcon />
      </IconButton>
    ));

    const button = screen.getByRole('button', { name: /invalid-size/i }) as HTMLElement;
    expect(button.className).toMatch(/size-md/);
  });

  it('renders gracefully when children are null/undefined', () => {
    render(() => <IconButton aria-label="no-children">{null as any}</IconButton>);
    const button = screen.getByRole('button', { name: /no-children/i });
    expect(button).toBeInTheDocument();
  });
});
