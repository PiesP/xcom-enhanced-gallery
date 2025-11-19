import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@test/utils/testing-library';
import { getSolid } from '@shared/external/vendors';

// Simple child component to echo accessor value
function Echo(props: { val: () => boolean }) {
  const { createEffect } = getSolid();
  createEffect(() => {
    console.log('[Echo] val=', props.val());
  });
  return <div data-testid='echo' data-val={String(props.val())} />;
}

describe('Solid accessor runtime test', () => {
  it('signals created in test are reactive in child components', async () => {
    const { createSignal, createComponent } = getSolid();
    const [val, setVal] = createSignal(false);

    render(() => createComponent(Echo, { val } as any));
    const el = screen.getByTestId('echo');
    expect(el.getAttribute('data-val')).toBe('false');

    setVal(true);
    await waitFor(() => expect(el.getAttribute('data-val')).toBe('true'));
  });
});
