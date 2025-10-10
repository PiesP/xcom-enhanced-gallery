import { describe, it, expect, beforeEach } from 'vitest';
import {
  addListener,
  removeAllEventListeners,
  getEventListenerStatus,
} from '@/shared/utils/events';

describe('Event lifecycle with AbortSignal', () => {
  beforeEach(() => {
    removeAllEventListeners();
  });

  it('removes listener when signal is aborted and stops receiving events', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const controller = new globalThis.AbortController();
    let count = 0;
    const id = addListener(
      div,
      'click',
      () => {
        count += 1;
      },
      { signal: controller.signal }
    );

    // Sanity: listener attached and fires once
    div.dispatchEvent(new globalThis.MouseEvent('click', { bubbles: true }));
    expect(count).toBe(1);

    // Abort: should cleanup mapping and stop firing
    controller.abort();

    // After abort, ensure not called anymore
    div.dispatchEvent(new globalThis.MouseEvent('click', { bubbles: true }));
    expect(count).toBe(1);

    // Internal status should not include the listener anymore
    const status = getEventListenerStatus();
    const stillPresent = status.listeners.some(l => l.id === id);
    expect(stillPresent).toBe(false);
  });

  it('skips registration if signal is already aborted', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);

    const controller = new globalThis.AbortController();
    controller.abort();

    let count = 0;
    const id = addListener(
      div,
      'click',
      () => {
        count += 1;
      },
      { signal: controller.signal },
      'test-preaborted'
    );

    // Dispatching should not call handler
    div.dispatchEvent(new globalThis.MouseEvent('click', { bubbles: true }));
    expect(count).toBe(0);

    // Internal status should not include this id
    const status = getEventListenerStatus();
    const stillPresent = status.listeners.some(l => l.id === id);
    expect(stillPresent).toBe(false);
  });
});
