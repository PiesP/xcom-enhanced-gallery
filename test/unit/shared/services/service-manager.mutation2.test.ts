import { CoreService } from '@shared/services/service-manager';
import { logger } from '@shared/logging';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';

vi.mock('@shared/logging', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('CoreService mutation: isDisposable edge cases', () => {
  beforeEach(() => {
    CoreService.resetInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    CoreService.resetInstance();
  });

  it('should handle destroy getter throwing without bubbling', () => {
    const core = CoreService.getInstance();
    const obj = Object.create({
      get destroy() {
        throw new Error('boom');
      },
    });
    core.register('throws', obj as any);

    // Should not throw and should log error
    expect(() => core.cleanup()).not.toThrow();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should treat property destroy: undefined as non-disposable', () => {
    const core = CoreService.getInstance();
    core.register('undef', { destroy: undefined } as any);
    // Should not throw or call destroy
    expect(() => core.cleanup()).not.toThrow();
    expect(core.has('undef')).toBe(false);
  });

  it('should treat property destroy: null as non-disposable', () => {
    const core = CoreService.getInstance();
    core.register('nullDestroy', { destroy: null } as any);
    expect(() => core.cleanup()).not.toThrow();
    expect(core.has('nullDestroy')).toBe(false);
  });

  it('should clean up value even if destroy is non-function (no-op)', () => {
    const core = CoreService.getInstance();
    // store a numeric or string value that is not a function
    core.register('stringService', 'a string' as unknown as object);
    expect(() => core.cleanup()).not.toThrow();
    expect(core.has('stringService')).toBe(false);
  });
});
