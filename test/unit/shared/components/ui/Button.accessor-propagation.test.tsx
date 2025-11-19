import { describe, it, expect } from 'vitest';
import { render, screen, h, waitFor } from '@test/utils/testing-library';
import { getSolid } from '@shared/external/vendors';
import { Button } from '@/shared/components/ui/Button/Button';
import styles from '@/shared/components/ui/Button/Button.module.css';

describe('Button accessor propagation', () => {
  it('updates disabled and loading reactively when accessors change', async () => {
    const { createSignal, createComponent } = getSolid();
    const [loading, setLoading] = createSignal(false);
    const [disabled, setDisabled] = createSignal(false);

    render(() =>
      createComponent(
        Button,
        {
          'aria-label': 'dynamic-button',
          'data-testid': 'btn-dynamic',
          loading,
          disabled,
        },
        'Click'
      )
    );

    const btn = screen.getByRole('button', { name: 'dynamic-button' });
    expect(btn).not.toBeDisabled();

    setDisabled(true);
    await waitFor(() => expect(btn).toBeDisabled());

    setDisabled(false);
    setLoading(true);
    await waitFor(() => expect(btn.classList.contains(styles.loading)).toBeTruthy());
  });
});
