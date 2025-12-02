// Vitest globals are provided by tsconfig; avoid importing runtime helpers in test files to prevent duplicate identifiers
import { SharedObserver, _resetSharedObserverForTests } from '@shared/utils/performance/observer-pool';

// We'll use a MockIntersectionObserver inside the main test block below
// Single import already handled above

describe('SharedObserver', () => {
  type ObserverCtor = new (
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) => IntersectionObserver;
  const globalAny = globalThis as typeof globalThis & { IntersectionObserver?: ObserverCtor };
  const originalObserver = globalAny.IntersectionObserver;

  const mockObserverInstances: MockIntersectionObserver[] = [];

  class MockIntersectionObserver {
    readonly observe = vi.fn();
    readonly unobserve = vi.fn();
    readonly disconnect = vi.fn();
    constructor(
      private readonly callback: IntersectionObserverCallback,
      readonly options?: IntersectionObserverInit
    ) {
      mockObserverInstances.push(this);
    }

    trigger(entry: IntersectionObserverEntry) {
      this.callback([entry], this as unknown as IntersectionObserver);
    }
  }

  const createEntry = (target: Element): IntersectionObserverEntry =>
    ({
      time: 0,
      target,
      isIntersecting: true,
      intersectionRatio: 1,
      boundingClientRect: new DOMRect(),
      intersectionRect: new DOMRect(),
    // Internal data check removed - not required for test validation
    } as IntersectionObserverEntry);

  beforeEach(() => {
    mockObserverInstances.length = 0;
    _resetSharedObserverForTests();
    globalAny.IntersectionObserver = MockIntersectionObserver as unknown as ObserverCtor;
  });

  afterEach(() => {
    mockObserverInstances.length = 0;
    globalAny.IntersectionObserver = originalObserver;
  });

  it('reuses a single observer for identical options', () => {
    const elementA = document.createElement('div');
    const elementB = document.createElement('div');

    SharedObserver.observe(elementA, vi.fn(), { rootMargin: '4px', threshold: 0.5 });
    SharedObserver.observe(elementB, vi.fn(), { rootMargin: '4px', threshold: 0.5 });

    expect(mockObserverInstances).toHaveLength(1);
    expect(mockObserverInstances[0]?.observe).toHaveBeenCalledTimes(2);
    expect(mockObserverInstances[0]?.observe).toHaveBeenNthCalledWith(1, elementA);
    expect(mockObserverInstances[0]?.observe).toHaveBeenNthCalledWith(2, elementB);
  });

  it('reuses a single observer for default options (no options provided)', () => {
    const elementA = document.createElement('div');
    const elementB = document.createElement('div');

    SharedObserver.observe(elementA, vi.fn());
    SharedObserver.observe(elementB, vi.fn());

    expect(mockObserverInstances).toHaveLength(1);
    expect(mockObserverInstances[0]?.observe).toHaveBeenCalledTimes(2);
    expect(mockObserverInstances[0]?.observe).toHaveBeenNthCalledWith(1, elementA);
    expect(mockObserverInstances[0]?.observe).toHaveBeenNthCalledWith(2, elementB);
  });

  it('groups observers when threshold is provided as an array', () => {
    const elementA = document.createElement('div');
    const elementB = document.createElement('div');

    SharedObserver.observe(elementA, vi.fn(), { threshold: [0.25, 0.75] });
    SharedObserver.observe(elementB, vi.fn(), { threshold: [0.25, 0.75] });

    // Should result in a single observer for the matching array thresholds
    expect(mockObserverInstances).toHaveLength(1);
    expect(mockObserverInstances[0]?.observe).toHaveBeenCalledTimes(2);
    expect(mockObserverInstances[0]?.observe).toHaveBeenCalledWith(elementA);
    expect(mockObserverInstances[0]?.observe).toHaveBeenCalledWith(elementB);
  });

  it('should call observe only once per element per key when subscribing multiple times', () => {
    const element = document.createElement('div');
    SharedObserver.observe(element, vi.fn(), { rootMargin: '4px', threshold: 0.5 });
    SharedObserver.observe(element, vi.fn(), { rootMargin: '4px', threshold: 0.5 });

    expect(mockObserverInstances[0]?.observe).toHaveBeenCalledTimes(1);
  });

  it('routes intersection entries to the matching callback', () => {
    const elementA = document.createElement('div');
    const elementB = document.createElement('div');
    const callbackA = vi.fn();
    const callbackB = vi.fn();

    SharedObserver.observe(elementA, callbackA, { rootMargin: '0px', threshold: 0.3 });
    SharedObserver.observe(elementB, callbackB, { rootMargin: '0px', threshold: 0.3 });

    mockObserverInstances[0]?.trigger(createEntry(elementA));
    mockObserverInstances[0]?.trigger(createEntry(elementB));

    expect(callbackA).toHaveBeenCalledTimes(1);
    expect(callbackA).toHaveBeenCalledWith(expect.objectContaining({ target: elementA }));
    expect(callbackB).toHaveBeenCalledTimes(1);
    expect(callbackB).toHaveBeenCalledWith(expect.objectContaining({ target: elementB }));
  });

  it('allows multiple subscribers on the same element without conflicts', () => {
    const element = document.createElement('div');
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    const firstUnsubscribe = SharedObserver.observe(element, firstCallback, {
      threshold: 0.25,
    });
    SharedObserver.observe(element, secondCallback, { threshold: 0.25 });

    const observer = mockObserverInstances[0];
    observer?.trigger(createEntry(element));

    expect(firstCallback).toHaveBeenCalledTimes(1);
    expect(secondCallback).toHaveBeenCalledTimes(1);
    expect(observer?.unobserve).not.toHaveBeenCalled();

    firstUnsubscribe?.();

    observer?.trigger(createEntry(element));

    expect(firstCallback).toHaveBeenCalledTimes(1);
    expect(secondCallback).toHaveBeenCalledTimes(2);
    expect(observer?.unobserve).not.toHaveBeenCalled();

    SharedObserver.unobserve(element);
    observer?.trigger(createEntry(element));

    expect(secondCallback).toHaveBeenCalledTimes(2);
    expect(observer?.unobserve).toHaveBeenCalledWith(element);
  });

  it('stops dispatching once unobserve is called', () => {
    const element = document.createElement('div');
    const callback = vi.fn();

    SharedObserver.observe(element, callback, { threshold: 0.4 });
    const instance = mockObserverInstances[0];

    SharedObserver.unobserve(element);

    instance?.trigger(createEntry(element));

    expect(instance?.unobserve).toHaveBeenCalledWith(element);
    expect(callback).not.toHaveBeenCalled();
  });

  it('creates distinct observers when options differ', () => {
    const elementA = document.createElement('div');
    const elementB = document.createElement('div');

    SharedObserver.observe(elementA, vi.fn(), { rootMargin: '0px', threshold: 0 });
    SharedObserver.observe(elementB, vi.fn(), { rootMargin: '12px', threshold: [0.5, 1] });

    expect(mockObserverInstances).toHaveLength(2);
    expect(mockObserverInstances[0]?.observe).toHaveBeenCalledWith(elementA);
    expect(mockObserverInstances[1]?.observe).toHaveBeenCalledWith(elementB);
  });

  it('stops observing automatically when the last subscriber unsubscribes', () => {
    const element = document.createElement('div');
    const callbackA = vi.fn();
    const callbackB = vi.fn();

    const unsubscribeA = SharedObserver.observe(element, callbackA, { threshold: 0.1 });
    const unsubscribeB = SharedObserver.observe(element, callbackB, { threshold: 0.1 });
    const observer = mockObserverInstances[0];

    observer?.trigger(createEntry(element));
    expect(callbackA).toHaveBeenCalledTimes(1);
    expect(callbackB).toHaveBeenCalledTimes(1);

    unsubscribeA();
    expect(observer?.unobserve).not.toHaveBeenCalled();

    unsubscribeB();
    expect(observer?.unobserve).toHaveBeenCalledWith(element);

    observer?.trigger(createEntry(element));
    expect(callbackA).toHaveBeenCalledTimes(1);
    expect(callbackB).toHaveBeenCalledTimes(1);
  });

  it('resetSharedObserverForTests should clear observer pool and create fresh observer after reset', () => {
    const element = document.createElement('div');
    SharedObserver.observe(element, vi.fn(), { threshold: 0.5 });
    expect(mockObserverInstances).toHaveLength(1);

    _resetSharedObserverForTests();
    SharedObserver.observe(element, vi.fn(), { threshold: 0.5 });
    expect(mockObserverInstances).toHaveLength(2);
  });

  it('assigns unique callback id for each subscription across elements and options', () => {
    const keys: number[] = [];
    const originalSet = Map.prototype.set;
    // Intercept Map.set only for numeric keys and function values (callbacks)
    Map.prototype.set = function (this: Map<any, any>, k: any, v: any) {
      if (typeof k === 'number' && typeof v === 'function') {
        keys.push(k);
      }
      return originalSet.call(this, k, v);
    } as any;

    const elA = document.createElement('div');
    const elB = document.createElement('div');

    SharedObserver.observe(elA, vi.fn(), { threshold: 0.2 });
    SharedObserver.observe(elB, vi.fn(), { threshold: 0.2 });
    SharedObserver.observe(elA, vi.fn(), { threshold: 0.5 });
    SharedObserver.observe(elB, vi.fn(), { threshold: 0 });

    // Restore Map.prototype.set
    Map.prototype.set = originalSet;

    // We should have seen at least 4 numeric keys created for callback IDs
    expect(keys.length).toBeGreaterThanOrEqual(4);
    const last4 = keys.slice(-4);
    // All values should be unique (no duplicates)
    expect(new Set(last4).size).toBe(4);
    // Key ordering should be strictly increasing to catch ++ vs -- mutations
    for (let i = 1; i < last4.length; i++) {
      expect(last4[i]!).toBeGreaterThan(last4[i - 1]!);
    }
  });

  it('swallows errors from callbacks and continues dispatching', () => {
    const element = document.createElement('div');
    const throwing = vi.fn(() => {
      throw new Error('boom');
    });
    const normal = vi.fn();

    SharedObserver.observe(element, throwing, { threshold: 0.25 });
    SharedObserver.observe(element, normal, { threshold: 0.25 });

    const observer = mockObserverInstances[0];
    observer?.trigger(createEntry(element));

    expect(throwing).toHaveBeenCalled();
    expect(normal).toHaveBeenCalled();
  });
});
