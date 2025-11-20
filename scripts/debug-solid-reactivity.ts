import { getSolid, initializeVendors } from '@shared/external/vendors';
import { render } from '@solidjs/testing-library';

// Setup
await initializeVendors();
const solid = getSolid();
const { createSignal, createComponent } = solid;

function Echo(props: { val: () => boolean }) {
  const { createEffect, h } = solid;
  createEffect(() => {
    console.log('[Echo] val=', props.val());
  });
  return h('div', { 'data-testid': 'echo', 'data-val': String(props.val()) });
}

const [val, setVal] = createSignal(false);

render(() => createComponent(Echo, { val } as any));

console.log('initial DOM', document.body.innerHTML);

setTimeout(() => {
  setVal(true);
  setTimeout(() => console.log('after set', document.body.innerHTML), 100);
}, 100);
