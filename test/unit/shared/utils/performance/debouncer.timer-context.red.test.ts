import { describe, it, expect, vi, afterEach } from 'vitest';
import { Debouncer } from '@/shared/utils/performance/performance-utils';
import { globalTimerManager } from '@/shared/utils/timer-management';

describe('Debouncer – timer manager integration (RED)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('schedules via globalTimerManager with context "debouncer" and clears on cancel', () => {
    const setSpy = vi
      .spyOn(globalTimerManager, 'setTimeout')
      .mockImplementation((_cb: () => void, _d: number, context?: string) => {
        expect(context).toBe('debouncer');
        return 456;
      });
    const clearSpy = vi.spyOn(globalTimerManager, 'clearTimeout').mockImplementation(() => void 0);

    const fn = vi.fn();
    const d = new Debouncer(fn, 10);

    d.execute('a' as never);
    expect(setSpy).toHaveBeenCalledTimes(1);

    d.cancel();
    expect(clearSpy).toHaveBeenCalledWith(456);
  });
});
