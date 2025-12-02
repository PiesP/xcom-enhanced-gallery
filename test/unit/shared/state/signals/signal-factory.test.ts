import { logger } from '@shared/logging';

// Use vi.hoisted to define mocks that can be referenced in vi.mock
const { mockCreateSignal, mockCreateEffect, mockCreateMemo, mockCreateRoot } = vi.hoisted(() => ({
  mockCreateSignal: vi.fn((initial: unknown) => {
    let value = initial;
    const read = () => value;
    const write = (fn: unknown) => {
      value = typeof fn === 'function' ? (fn as (v: unknown) => unknown)(value) : fn;
      return value;
    };
    return [read, write];
  }),
  mockCreateEffect: vi.fn((fn: () => void) => fn()),
  mockCreateMemo: vi.fn((fn: () => unknown) => {
    const value = fn();
    return () => value;
  }),
  mockCreateRoot: vi.fn((fn: (dispose: () => void) => unknown) => fn(() => {})),
}));

vi.mock('@shared/external/vendors/solid-hooks', () => ({
  createSignal: mockCreateSignal,
  createEffect: mockCreateEffect,
  createMemo: mockCreateMemo,
  createRoot: mockCreateRoot,
}));

// Import after mock setup
import { computedSafe, createSignalSafe, effectSafe } from '@shared/state/signals/signal-factory';

describe('Signal Factory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockCreateSignal.mockImplementation((initial: unknown) => {
      let value = initial;
      const read = () => value;
      const write = (fn: unknown) => {
        value = typeof fn === 'function' ? (fn as (v: unknown) => unknown)(value) : fn;
        return value;
      };
      return [read, write];
    });
    mockCreateEffect.mockImplementation((fn: () => void) => fn());
    mockCreateMemo.mockImplementation((fn: () => unknown) => {
      const value = fn();
      return () => value;
    });
    mockCreateRoot.mockImplementation((fn: (dispose: () => void) => unknown) => fn(() => {}));
  });

  describe('Solid Mode', () => {
    it('should create signal with Solid', () => {
      const signal = createSignalSafe(10);
      expect(signal.value).toBe(10);

      signal.value = 20;
      expect(signal.value).toBe(20);
      expect(mockCreateSignal).toHaveBeenCalled();
    });

    it('should subscribe with Solid effect', () => {
      const signal = createSignalSafe(10);
      const callback = vi.fn();
      signal.subscribe(callback);

      expect(mockCreateRoot).toHaveBeenCalled();
      expect(mockCreateEffect).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(10);
    });

    it('should create effect with Solid', () => {
      const fn = vi.fn();
      effectSafe(fn);
      expect(mockCreateRoot).toHaveBeenCalled();
      expect(mockCreateEffect).toHaveBeenCalled();
      expect(fn).toHaveBeenCalled();
    });

    it('should create computed with Solid', () => {
      const computed = computedSafe(() => 10 * 2);
      expect(computed.value).toBe(20);
      expect(mockCreateRoot).toHaveBeenCalled();
      expect(mockCreateMemo).toHaveBeenCalled();
    });

    it('should return noop subscription when Solid subscribe fails', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
      mockCreateRoot.mockImplementation(() => {
        throw new Error('root-fail');
      });

      const signal = createSignalSafe(1);
      const unsubscribe = signal.subscribe(vi.fn());

      expect(typeof unsubscribe).toBe('function');
      expect(warnSpy).toHaveBeenCalledWith(
        'Solid subscribe failed',
        expect.objectContaining({ error: expect.any(Error) })
      );
    });

    it('should warn when signal write fails', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
      mockCreateSignal.mockImplementation((initial: unknown) => {
        const read = () => initial;
        const write = () => {
          throw new Error('write-fail');
        };
        return [read, write];
      });

      const signal = createSignalSafe(1);
      expect(() => {
        signal.value = 2;
      }).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith(
        'Solid write failed',
        expect.objectContaining({ error: expect.any(Error) })
      );
    });

    it('should warn and return noop when effect creation fails', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
      mockCreateRoot.mockImplementation(() => {
        throw new Error('effect-fail');
      });

      const dispose = effectSafe(vi.fn());
      expect(typeof dispose).toBe('function');
      expect(warnSpy).toHaveBeenCalledWith(
        'Solid effect failed',
        expect.objectContaining({ error: expect.any(Error) })
      );
    });

    it('should fall back when memo accessor throws', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
      mockCreateMemo.mockImplementation((fn: () => unknown) => {
        fn();
        return () => {
          throw new Error('memo-fail');
        };
      });

      const compute = vi.fn(() => 42);
      const computed = computedSafe(compute);

      expect(computed.value).toBe(42);
      expect(warnSpy).toHaveBeenCalledWith(
        'Solid memo access failed',
        expect.objectContaining({ error: expect.any(Error) })
      );
      expect(compute).toHaveBeenCalledTimes(2);
    });

    it('should compute directly when Solid computed setup fails', () => {
      const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
      mockCreateRoot.mockImplementation(() => {
        throw new Error('computed-fail');
      });

      const compute = vi.fn(() => 7);
      const computed = computedSafe(compute);

      expect(computed.value).toBe(7);
      expect(warnSpy).toHaveBeenCalledWith(
        'Solid computed failed',
        expect.objectContaining({ error: expect.any(Error) })
      );
      expect(compute).toHaveBeenCalledTimes(1);
    });
  });
});
