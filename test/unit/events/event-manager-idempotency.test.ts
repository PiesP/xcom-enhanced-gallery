import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventManager } from '@/shared/services/EventManager';

describe('EventManager — idempotency and ref-counted removal', () => {
  let target: {
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };
  let manager: EventManager;

  beforeEach(() => {
    target = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    manager = new EventManager();
  });

  it('dedups duplicate addListener calls (same target/type/handler/options)', () => {
    const handler = vi.fn();

    const id1 = manager.addListener(target as any, 'click', handler);
    const id2 = manager.addListener(target as any, 'click', handler);

    // Underlying DOM addEventListener should be called only once
    expect(target.addEventListener).toHaveBeenCalledTimes(1);
    expect(target.addEventListener).toHaveBeenCalledWith('click', handler, undefined);

    // First removal only decrements refCount — no DOM remove yet
    expect(manager.removeListener(id1)).toBe(true);
    expect(target.removeEventListener).not.toHaveBeenCalled();

    // Second removal actually detaches DOM listener once
    expect(manager.removeListener(id2)).toBe(true);
    expect(target.removeEventListener).toHaveBeenCalledTimes(1);
    expect(target.removeEventListener).toHaveBeenCalledWith('click', handler, undefined);

    // Re-adding after full removal should attach again exactly once
    const id3 = manager.addListener(target as any, 'click', handler);
    expect(target.addEventListener).toHaveBeenCalledTimes(2);

    // Cleanup last registration
    expect(manager.removeListener(id3)).toBe(true);
    expect(target.removeEventListener).toHaveBeenCalledTimes(2);
  });
});
