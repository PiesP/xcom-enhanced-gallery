import { untrack } from 'solid-js';
// Temporary source-bound #502 diagnostic, removed before product delivery.
let count = 0;
export function traceGalleryScroll(
  event: string,
  fields: () => Record<string, unknown> = () => ({})
): void {
  if (!document.documentElement.hasAttribute('data-xeg-scroll-trace')) {
    return;
  }
  count += 1;
  if (count > 257) {
    return;
  }
  window.dispatchEvent(
    new CustomEvent('xeg:gallery-scroll-trace', {
      detail: JSON.stringify({
        event: count === 257 ? 'diagnostic-overflow' : event,
        at: performance.now(),
        ...untrack(fields),
      }),
    })
  );
}
