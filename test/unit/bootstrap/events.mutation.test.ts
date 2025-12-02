import { wireGlobalEvents } from '@/bootstrap/events';

vi.mock('@shared/logging', () => ({
  logger: {
    debug: vi.fn(),
  },
}));

describe('wireGlobalEvents (mutation)', () => {
  it('prevents onBeforeUnload after unregistering before pagehide', () => {
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
    capturedHandler(new Event('pagehide'));

    expect(onBeforeUnload).not.toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledTimes(1);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
