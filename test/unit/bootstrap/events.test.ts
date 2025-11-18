/**
 * @fileoverview Global events bootstrap tests
 */

import { describe, expect, it, vi } from 'vitest';
import { setupGlobalTestIsolation } from '../../shared/global-cleanup-hooks';

const bootstrapEventsPath = '../../../src/bootstrap/events';

describe('wireGlobalEvents', () => {
  setupGlobalTestIsolation();

  it('invokes the cleanup callback once when pagehide fires', async () => {
    const cleanupSpy = vi.fn();
    const { wireGlobalEvents } = await import(bootstrapEventsPath);

    const unregister = wireGlobalEvents(cleanupSpy);

    window.dispatchEvent(new Event('pagehide'));
    window.dispatchEvent(new Event('pagehide'));

    expect(cleanupSpy).toHaveBeenCalledTimes(1);

    // ensure manual teardown after invocation is a no-op
    unregister();
  });

  it('allows manual teardown before pagehide', async () => {
    const cleanupSpy = vi.fn();
    const { wireGlobalEvents } = await import(bootstrapEventsPath);

    const unregister = wireGlobalEvents(cleanupSpy);
    unregister();

    window.dispatchEvent(new Event('pagehide'));

    expect(cleanupSpy).not.toHaveBeenCalled();
  });
});
