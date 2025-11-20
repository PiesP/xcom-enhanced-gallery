import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@test/utils/testing-library';
import { getSolid } from '@shared/external/vendors';

describe('DOM disabled reactivity', () => {
  it('updates DOM disabled property when signal changes', async () => {
    const { createSignal } = getSolid();
    const [disabled, setDisabled] = createSignal(false);

    render(() => <button data-testid='test-button' disabled={disabled()} />);

    const btn = screen.getByTestId('test-button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);

    setDisabled(true);
    await waitFor(() => expect(btn.disabled).toBe(true));
  });
});
