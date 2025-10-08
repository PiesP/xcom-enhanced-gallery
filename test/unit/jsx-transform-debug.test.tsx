/** @jsxImportSource solid-js */
/**
 * JSX Transform 디버깅 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@solidjs/testing-library';
import { getSolid } from '@shared/external/vendors';

describe('JSX Transform Debug', () => {
  it('should use Solid JSX transform', () => {
    const { createSignal } = getSolid();
    const [count, setCount] = createSignal(0);

    const Counter = () => {
      return <div data-testid='counter'>Count: {count()}</div>;
    };

    render(() => <Counter />);

    const counter = screen.getByTestId('counter');
    expect(counter.textContent).toBe('Count: 0');
  });
});
