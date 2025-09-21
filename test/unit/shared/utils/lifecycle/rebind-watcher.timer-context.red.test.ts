import { describe, it, expect, vi, afterEach } from 'vitest';
import { RebindWatcher } from '@/shared/utils/lifecycle/rebind-watcher';
import { globalTimerManager } from '@/shared/utils/timer-management';

describe('RebindWatcher – timer manager integration (RED)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('schedules rebind via globalTimerManager with context "rebind-watcher" and clears on dispose', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const setSpy = vi
      .spyOn(globalTimerManager, 'setTimeout')
      // do not actually schedule to avoid flakiness; just return a dummy id
      .mockImplementation((cb: () => void, delay: number, context?: string) => {
        // validate types during call time as well
        expect(typeof cb).toBe('function');
        expect(typeof delay).toBe('number');
        expect(context).toBe('rebind-watcher');
        return 123;
      });

    const clearSpy = vi
      .spyOn(globalTimerManager, 'clearTimeout')
      .mockImplementation((_id: number) => void 0);

    const watcher = new RebindWatcher({
      root: document.body,
      isTargetNode: node => node === container,
      onContainerLost: vi.fn(),
      rebindDelayMs: 150,
    });

    watcher.start();
    // Trigger removal to schedule rebind
    container.remove();

    // Allow MutationObserver microtask to flush
    await Promise.resolve();

    expect(setSpy).toHaveBeenCalledTimes(1);

    // Dispose should clear the scheduled timer id (returned by our stub)
    watcher.dispose();
    expect(clearSpy).toHaveBeenCalledWith(123);
  });
});
