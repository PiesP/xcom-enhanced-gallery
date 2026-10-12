// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 PiesP

type SharedObserverApi = typeof import('@shared/utils/performance/observer-pool').SharedObserver;

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly observe = vi.fn<(target: Element) => void>();
  readonly unobserve = vi.fn<(target: Element) => void>();
  readonly disconnect = vi.fn<() => void>();

  constructor(
    private readonly callback: IntersectionObserverCallback,
    readonly options: IntersectionObserverInit
  ) {
    MockIntersectionObserver.instances.push(this);
  }

  emit(...targets: Element[]): void {
    const entries = targets.map(
      (target) =>
        ({
          target,
          isIntersecting: true,
          intersectionRatio: 1,
        }) as IntersectionObserverEntry
    );
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

describe('SharedObserver', () => {
  let SharedObserver: SharedObserverApi;

  beforeEach(async () => {
    vi.resetModules();
    MockIntersectionObserver.instances = [];
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    ({ SharedObserver } = await import('@shared/utils/performance/observer-pool'));
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
  });

  it('unobserves a disconnected target and removes the empty pool entry', () => {
    const target = document.createElement('div');
    document.body.append(target);
    const dispose = SharedObserver.observe(target, vi.fn(), { threshold: 0.5 });
    const observer = MockIntersectionObserver.instances[0];
    expect(observer).toBeDefined();

    target.remove();
    observer?.emit(target);

    expect(observer?.unobserve).toHaveBeenCalledWith(target);
    expect(observer?.disconnect).toHaveBeenCalledOnce();

    document.body.append(target);
    const replacementCallback = vi.fn();
    const disposeReplacement = SharedObserver.observe(target, replacementCallback, {
      threshold: 0.5,
    });
    expect(MockIntersectionObserver.instances).toHaveLength(2);

    dispose();
    observer?.emit(target);
    expect(replacementCallback).not.toHaveBeenCalled();
    MockIntersectionObserver.instances[1]?.emit(target);
    expect(replacementCallback).toHaveBeenCalledOnce();
    disposeReplacement();
  });

  it('reuses an observer until the last distinct target is disposed', () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    document.body.append(first, second);

    const disposeFirst = SharedObserver.observe(first, vi.fn(), { rootMargin: '10px' });
    const disposeSecond = SharedObserver.observe(second, vi.fn(), { rootMargin: '10px' });
    const observer = MockIntersectionObserver.instances[0];

    expect(MockIntersectionObserver.instances).toHaveLength(1);
    expect(observer?.observe).toHaveBeenCalledTimes(2);

    disposeFirst();
    expect(observer?.unobserve).toHaveBeenCalledWith(first);
    expect(observer?.disconnect).not.toHaveBeenCalled();

    disposeSecond();
    expect(observer?.unobserve).toHaveBeenCalledWith(second);
    expect(observer?.disconnect).toHaveBeenCalledOnce();
  });

  it('keeps callbacks independent for multiple subscriptions to one target', () => {
    const target = document.createElement('div');
    document.body.append(target);
    const firstCallback = vi.fn();
    const secondCallback = vi.fn();

    const disposeFirst = SharedObserver.observe(target, firstCallback);
    const disposeSecond = SharedObserver.observe(target, secondCallback);
    const observer = MockIntersectionObserver.instances[0];
    observer?.emit(target);

    expect(observer?.observe).toHaveBeenCalledOnce();
    expect(firstCallback).toHaveBeenCalledOnce();
    expect(secondCallback).toHaveBeenCalledOnce();

    disposeFirst();
    observer?.emit(target);
    expect(firstCallback).toHaveBeenCalledOnce();
    expect(secondCallback).toHaveBeenCalledTimes(2);
    expect(observer?.unobserve).not.toHaveBeenCalled();

    disposeSecond();
    expect(observer?.unobserve).toHaveBeenCalledWith(target);
    expect(observer?.disconnect).toHaveBeenCalledOnce();
  });

  it('separates explicit scroll roots, shares equivalent options, and ignores a retired callback', () => {
    const firstRoot = document.createElement('div');
    const secondRoot = document.createElement('div');
    const target = document.createElement('div');
    document.body.append(firstRoot, secondRoot, target);
    const first = vi.fn();
    const second = vi.fn();
    const sameRoot = vi.fn();
    const disposeFirst = SharedObserver.observe(target, first, {
      root: firstRoot, rootMargin: '400px 0px', threshold: 0,
    });
    const disposeSameRoot = SharedObserver.observe(target, sameRoot, {
      threshold: [0], rootMargin: '400px 0px', root: firstRoot,
    });
    const disposeSecond = SharedObserver.observe(target, second, {
      root: secondRoot, rootMargin: '400px 0px', threshold: 0,
    });

    expect(MockIntersectionObserver.instances).toHaveLength(2);
    expect(MockIntersectionObserver.instances[0]?.options.root).toBe(firstRoot);
    expect(MockIntersectionObserver.instances[1]?.options.root).toBe(secondRoot);
    MockIntersectionObserver.instances[0]?.emit(target);
    expect(first).toHaveBeenCalledOnce();
    expect(sameRoot).toHaveBeenCalledOnce();
    expect(second).not.toHaveBeenCalled();

    disposeFirst();
    MockIntersectionObserver.instances[0]?.emit(target);
    expect(first).toHaveBeenCalledOnce();
    expect(sameRoot).toHaveBeenCalledTimes(2);
    disposeSameRoot();
    MockIntersectionObserver.instances[0]?.emit(target);
    expect(sameRoot).toHaveBeenCalledTimes(2);
    expect(MockIntersectionObserver.instances[0]?.disconnect).toHaveBeenCalledOnce();
    MockIntersectionObserver.instances[1]?.emit(target);
    expect(second).toHaveBeenCalledOnce();
    disposeSecond();
  });

  it('keeps implicit roots and scroll margins separate from an explicit root', () => {
    const root = document.createElement('div');
    const target = document.createElement('div');
    document.body.append(root, target);
    const disposeImplicit = SharedObserver.observe(target, vi.fn(), { rootMargin: '20px' });
    const disposeExplicit = SharedObserver.observe(target, vi.fn(), {
      root, rootMargin: '20px',
    });
    const disposeScrollMargin = SharedObserver.observe(target, vi.fn(), {
      root, rootMargin: '20px', scrollMargin: '10px',
    });
    expect(MockIntersectionObserver.instances).toHaveLength(3);
    disposeImplicit();
    disposeExplicit();
    disposeScrollMargin();
    expect(MockIntersectionObserver.instances.every((observer) =>
      observer.disconnect.mock.calls.length === 1)).toBe(true);
  });
});
