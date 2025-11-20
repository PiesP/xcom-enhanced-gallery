import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@test/utils/testing-library';
import { getSolid } from '@shared/external/vendors';

// Simple child component to echo accessor value
function Echo(props: { val: () => boolean }) {
  const { createEffect } = getSolid();
  let el: HTMLElement | null = null;
  createEffect(() => {
    const v = String(props.val());

    console.log('[Echo] val=', v);
    if (el) el.setAttribute('data-val', v);
  });
  return <div data-testid='echo' ref={r => (el = r)} data-val={String(props.val())} />;
}

describe('Solid accessor runtime test', () => {
  it('signals created in test are reactive in child components', async () => {
    const { createSignal, createComponent, createEffect } = getSolid();
    // Debug: ensure createEffect runs inside test
    const [dbg, setDbg] = createSignal(false);
    let dbgCount = 0;
    createEffect(() => {
      console.log('[DEBUG] test-effect-run: dbg=', dbg());
      dbgCount += 1;
    });
    // Debug: confirm single Solid runtime across test

    console.log(
      "[DEBUG] getSolid.createSignal === require('solid-js').createSignal =>",
      createSignal === require('solid-js').createSignal
    );
    const [val, setVal] = createSignal(false);

    render(() => createComponent(Echo, { val } as any));
    const el = screen.getByTestId('echo');
    expect(el.getAttribute('data-val')).toBe('false');

    setVal(true);
    setDbg(true);
    await waitFor(() => expect(el.getAttribute('data-val')).toBe('true'));

    console.log('[DEBUG] dbgCount=', dbgCount);
  });
});
