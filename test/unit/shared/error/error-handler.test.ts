import { GlobalErrorHandler } from '@shared/error/error-handler';
import { logger } from '@shared/logging';

// Mock logger
vi.mock('@shared/logging', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('GlobalErrorHandler', () => {
  let errorHandler: GlobalErrorHandler;

  beforeEach(() => {
    errorHandler = GlobalErrorHandler.getInstance();
    // Ensure clean state
    errorHandler.destroy();
    vi.clearAllMocks();
  });

  afterEach(() => {
    errorHandler.destroy();
  });

  it('should be a singleton', () => {
    const instance1 = GlobalErrorHandler.getInstance();
    const instance2 = GlobalErrorHandler.getInstance();
    expect(instance1).toBe(instance2);
  });

  it('should initialize and add event listeners', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    errorHandler.initialize();
    expect(addSpy).toHaveBeenCalledWith('error', expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
  });

  it('should not initialize twice', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    errorHandler.initialize();
    errorHandler.initialize();
    // Should be called once for 'error' and once for 'unhandledrejection' from the first call
    // Total calls should be 2.
    // If it initialized twice, it would be 4.
    // However, other tests might have added listeners to window, so we should be careful.
    // Better to check if the specific listener for this instance was added.
    // But since we can't easily access the private listener, we rely on call counts.
    // We cleared mocks in beforeEach, but window is global.
    // Let's rely on the implementation detail that it returns early.

    // Actually, let's just check that it doesn't add them again.
    expect(addSpy).toHaveBeenCalledTimes(2);
  });

  it('should destroy and remove event listeners', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    errorHandler.initialize();
    errorHandler.destroy();
    expect(removeSpy).toHaveBeenCalledWith('error', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
  });

  it('should handle ErrorEvent', () => {
    errorHandler.initialize();
    const preventDefaultSpy = vi.fn();
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
      filename: 'test.ts',
      lineno: 10,
      colno: 5,
    });
    Object.defineProperty(errorEvent, 'preventDefault', { value: preventDefaultSpy });

    window.dispatchEvent(errorEvent);

    expect(logger.error).toHaveBeenCalledWith(
      '[UncaughtError] Test error',
      expect.objectContaining({
        type: 'uncaught-error',
        location: 'test.ts:10:5',
      })
    );

    // Since __DEV__ is true in test config
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle ErrorEvent with missing location info', () => {
    errorHandler.initialize();
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
      // filename, lineno, colno undefined
    });

    window.dispatchEvent(errorEvent);

    expect(logger.error).toHaveBeenCalledWith(
      '[UncaughtError] Test error',
      expect.objectContaining({
        type: 'uncaught-error',
        location: undefined,
      })
    );
  });

  it('should handle PromiseRejectionEvent with Error object', () => {
    errorHandler.initialize();
    const preventDefaultSpy = vi.fn();
    const error = new Error('Promise failed');
    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.resolve(),
      reason: error,
    });
    Object.defineProperty(event, 'preventDefault', { value: preventDefaultSpy });

    window.dispatchEvent(event);

    expect(logger.error).toHaveBeenCalledWith(
      '[UnhandledRejection] Promise failed',
      expect.objectContaining({
        type: 'unhandled-rejection',
        reason: error,
      })
    );

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should handle PromiseRejectionEvent with string reason', () => {
    errorHandler.initialize();
    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.resolve(),
      reason: 'String failure',
    });

    window.dispatchEvent(event);

    expect(logger.error).toHaveBeenCalledWith(
      '[UnhandledRejection] String failure',
      expect.objectContaining({
        type: 'unhandled-rejection',
        reason: 'String failure',
      })
    );
  });

  it('should handle PromiseRejectionEvent with unknown reason', () => {
    errorHandler.initialize();
    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.resolve(),
      reason: 12345,
    });

    window.dispatchEvent(event);

    expect(logger.error).toHaveBeenCalledWith(
      '[UnhandledRejection] Unhandled rejection: 12345',
      expect.objectContaining({
        type: 'unhandled-rejection',
        reason: 12345,
      })
    );
  });

  it('should not initialize if window is undefined', () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error - Testing window undefined case
    delete globalThis.window;

    const localHandler = GlobalErrorHandler.getInstance();
    localHandler.initialize();

    // Should not throw or crash
    expect(true).toBe(true);

    globalThis.window = originalWindow;
  });

  it('should not destroy if not initialized', () => {
    // Ensure clean state
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    // Destroy should be a no-op when not initialized
    errorHandler.destroy();

    // removeEventListener should not be called because destroy returns early
    expect(removeSpy).not.toHaveBeenCalled();
  });

  it('should handle ErrorEvent with empty string message', () => {
    errorHandler.initialize();
    const preventDefaultSpy = vi.fn();
    const errorEvent = new ErrorEvent('error', {
      // message will be empty string by default when omitted
      filename: 'test.ts',
      lineno: 10,
      colno: 5,
    });
    Object.defineProperty(errorEvent, 'preventDefault', { value: preventDefaultSpy });

    window.dispatchEvent(errorEvent);

    // Empty string is not nullish, so it stays as empty string
    expect(logger.error).toHaveBeenCalledWith(
      '[UncaughtError] ',
      expect.objectContaining({
        type: 'uncaught-error',
        location: 'test.ts:10:5',
      })
    );
  });

  it('should handle ErrorEvent with explicit null-like message', () => {
    errorHandler.initialize();
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
      filename: 'test.ts',
      lineno: 10,
      colno: 5,
    });
    // Simulate null message to test the ?? operator
    Object.defineProperty(errorEvent, 'message', { value: null, writable: true });

    window.dispatchEvent(errorEvent);

    expect(logger.error).toHaveBeenCalledWith(
      '[UncaughtError] Unknown error occurred',
      expect.objectContaining({
        type: 'uncaught-error',
        location: 'test.ts:10:5',
      })
    );
  });

  it('should handle ErrorEvent with lineno and colno as 0', () => {
    errorHandler.initialize();
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
      filename: 'test.ts',
      lineno: 0,
      colno: 0,
    });

    window.dispatchEvent(errorEvent);

    expect(logger.error).toHaveBeenCalledWith(
      '[UncaughtError] Test error',
      expect.objectContaining({
        type: 'uncaught-error',
        location: 'test.ts:0:0',
      })
    );
  });

  it('should handle ErrorEvent without lineno (null/undefined)', () => {
    errorHandler.initialize();
    const errorEvent = new ErrorEvent('error', {
      message: 'Test error',
      filename: 'test.ts',
      // lineno is undefined
    });

    window.dispatchEvent(errorEvent);

    expect(logger.error).toHaveBeenCalledWith(
      '[UncaughtError] Test error',
      expect.objectContaining({
        type: 'uncaught-error',
        location: 'test.ts:0:0',
      })
    );
  });

  it('should handle PromiseRejectionEvent with null reason', () => {
    errorHandler.initialize();
    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.resolve(),
      reason: null,
    });

    window.dispatchEvent(event);

    expect(logger.error).toHaveBeenCalledWith(
      '[UnhandledRejection] Unhandled rejection: null',
      expect.objectContaining({
        type: 'unhandled-rejection',
        reason: null,
      })
    );
  });

  it('should handle PromiseRejectionEvent with undefined reason', () => {
    errorHandler.initialize();
    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.resolve(),
      reason: undefined,
    });

    window.dispatchEvent(event);

    expect(logger.error).toHaveBeenCalledWith(
      '[UnhandledRejection] Unhandled rejection: undefined',
      expect.objectContaining({
        type: 'unhandled-rejection',
        reason: undefined,
      })
    );
  });

  it('should handle PromiseRejectionEvent with object reason', () => {
    errorHandler.initialize();
    const objReason = { code: 500, message: 'Server error' };
    const event = new PromiseRejectionEvent('unhandledrejection', {
      promise: Promise.resolve(),
      reason: objReason,
    });

    window.dispatchEvent(event);

    expect(logger.error).toHaveBeenCalledWith(
      '[UnhandledRejection] Unhandled rejection: [object Object]',
      expect.objectContaining({
        type: 'unhandled-rejection',
        reason: objReason,
      })
    );
  });
});
