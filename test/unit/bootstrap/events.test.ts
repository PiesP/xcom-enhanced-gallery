import { wireGlobalEvents } from '@/bootstrap/events';

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
  },
}));

describe('wireGlobalEvents', () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    if (originalWindow) {
      globalThis.window = originalWindow;
    }
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('skips wiring when window is unavailable and logs debug info', async () => {
    // @ts-expect-error Simulate missing window object
    globalThis.window = undefined;
    const onBeforeUnload = vi.fn();

    const unregister = wireGlobalEvents(onBeforeUnload);

    expect(unregister).toBeTypeOf('function');
    const { logger } = await import('@shared/logging');
    expect(logger.debug).toHaveBeenCalledWith(
      '[events] 🧩 Global events wiring skipped (no window context)',
    );
    unregister();
    expect(onBeforeUnload).not.toHaveBeenCalled();
  });

  it('wires pagehide handler and only invokes callback once', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    let capturedHandler: (event: Event) => void = () => {
      throw new Error('handler not registered');
    };
    addSpy.mockImplementation((type, listener, _options) => {
      if (type === 'pagehide') {
        capturedHandler = listener as (event: Event) => void;
      }
      return undefined as unknown as void;
    });

    const onBeforeUnload = vi.fn();
    const unregister = wireGlobalEvents(onBeforeUnload);

    expect(addSpy).toHaveBeenCalledWith('pagehide', expect.any(Function), {
      once: true,
      passive: true,
    });

    capturedHandler(new Event('pagehide'));
    capturedHandler(new Event('pagehide'));

    expect(onBeforeUnload).toHaveBeenCalledTimes(1);
    unregister();
    expect(removeSpy).not.toHaveBeenCalled();

    const { logger } = await import('@shared/logging');
    expect(logger.debug).toHaveBeenCalledWith('[events] 🧩 Global events wired (pagehide only)');
  });

  it('unregisters handler when dispose is called before pagehide', async () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    let capturedHandler: (event: Event) => void = () => {
      throw new Error('handler not registered');
    };

    addSpy.mockImplementation((type, listener, _options) => {
      if (type === 'pagehide') {
        capturedHandler = listener as (event: Event) => void;
      }
      return undefined as unknown as void;
    });

    const onBeforeUnload = vi.fn();
    const unregister = wireGlobalEvents(onBeforeUnload);

    unregister();

    expect(removeSpy).toHaveBeenCalledWith('pagehide', capturedHandler);
    expect(onBeforeUnload).not.toHaveBeenCalled();

    const { logger } = await import('@shared/logging');
    expect(logger.debug).toHaveBeenCalledWith('[events] 🧩 Global events unwired');
  });
});
