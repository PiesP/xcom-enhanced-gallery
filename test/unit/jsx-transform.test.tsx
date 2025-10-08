import { describe, it, expect } from 'vitest';
import { render, screen } from '@solidjs/testing-library';

describe('JSX Transform Test', () => {
  it('should render simple JSX', () => {
    const SimpleComponent = () => {
      return <div data-testid='simple'>Hello World</div>;
    };

    render(() => <SimpleComponent />);

    const element = screen.getByTestId('simple');
    expect(element.textContent).toBe('Hello World');
  });
});
