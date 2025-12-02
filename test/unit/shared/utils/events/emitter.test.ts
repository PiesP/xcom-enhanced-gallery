import { createEventEmitter } from '@shared/utils/events/emitter';
import { logger } from '@shared/logging';

vi.mock('@shared/logging', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('createEventEmitter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register and emit events', () => {
    const emitter = createEventEmitter<{ 'test-event': string }>();
    const callback = vi.fn();

    emitter.on('test-event', callback);
    emitter.emit('test-event', 'test-data');

    expect(callback).toHaveBeenCalledWith('test-data');
  });

  it('should unsubscribe correctly', () => {
    const emitter = createEventEmitter<{ 'test-event': string }>();
    const callback = vi.fn();

    const unsubscribe = emitter.on('test-event', callback);
    unsubscribe();
    emitter.emit('test-event', 'test-data');

    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle multiple listeners', () => {
    const emitter = createEventEmitter<{ 'test-event': string }>();
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    emitter.on('test-event', callback1);
    emitter.on('test-event', callback2);
    emitter.emit('test-event', 'test-data');

    expect(callback1).toHaveBeenCalledWith('test-data');
    expect(callback2).toHaveBeenCalledWith('test-data');
  });

  it('should isolate errors in listeners', () => {
    const emitter = createEventEmitter<{ 'test-event': string }>();
    const errorCallback = vi.fn().mockImplementation(() => {
      throw new Error('Test error');
    });
    const successCallback = vi.fn();

    emitter.on('test-event', errorCallback);
    emitter.on('test-event', successCallback);

    expect(() => emitter.emit('test-event', 'test-data')).not.toThrow();
    expect(errorCallback).toHaveBeenCalled();
    expect(successCallback).toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      '[EventEmitter] Listener error for event "test-event":',
      expect.any(Error)
    );
  });

  it('should dispose all listeners', () => {
    const emitter = createEventEmitter<{ 'test-event': string }>();
    const callback = vi.fn();

    emitter.on('test-event', callback);
    emitter.dispose();
    emitter.emit('test-event', 'test-data');

    expect(callback).not.toHaveBeenCalled();
  });

  it('should handle emitting events with no listeners', () => {
    const emitter = createEventEmitter<{ 'test-event': string }>();
    expect(() => emitter.emit('test-event', 'test-data')).not.toThrow();
  });

  it('should handle unsubscribe after dispose', () => {
    const emitter = createEventEmitter<{ 'test-event': string }>();
    const callback = vi.fn();
    const unsubscribe = emitter.on('test-event', callback);

    emitter.dispose();
    expect(() => unsubscribe()).not.toThrow();
  });
});
