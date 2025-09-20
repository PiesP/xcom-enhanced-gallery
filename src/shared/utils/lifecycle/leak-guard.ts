/**
 * @fileoverview LeakGuard - 이벤트/타이머/옵저버 리소스 누수 방지 유틸리티
 * @description 테스트에서 카운트 측정을 지원하며, 엄격 모드 TypeScript를 준수합니다.
 */

export type Unsubscribe = () => void;

export class LeakGuard {
  private readonly timeouts = new Set<number>();
  private readonly intervals = new Set<number>();
  private readonly observers = new Set<MutationObserver>();
  private readonly eventUnsubs = new Set<Unsubscribe>();

  // 래핑된 setTimeout
  setTimeout(cb: () => void, ms: number): number {
    const id = globalThis.setTimeout(() => {
      try {
        cb();
      } finally {
        this.timeouts.delete(id as unknown as number);
      }
    }, ms) as unknown as number;
    this.timeouts.add(id);
    return id;
  }

  clearTimeout(id: number): void {
    globalThis.clearTimeout(id as unknown as number);
    this.timeouts.delete(id);
  }

  // 래핑된 setInterval
  setInterval(cb: () => void, ms: number): number {
    const id = globalThis.setInterval(cb, ms) as unknown as number;
    this.intervals.add(id);
    return id;
  }

  clearInterval(id: number): void {
    globalThis.clearInterval(id as unknown as number);
    this.intervals.delete(id);
  }

  // 이벤트 리스너 등록 추적
  addEventListener<K extends keyof DocumentEventMap>(
    target: Document | Window | Element,
    type: K,
    listener: (ev: DocumentEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): Unsubscribe {
    target.addEventListener(type as string, listener as EventListener, options);
    const unsub = () =>
      target.removeEventListener(type as string, listener as EventListener, options);
    this.eventUnsubs.add(unsub);
    return () => {
      unsub();
      this.eventUnsubs.delete(unsub);
    };
  }

  // MutationObserver 등록 추적
  observe(
    target: Node,
    options: MutationObserverInit,
    callback: MutationCallback
  ): MutationObserver {
    const observer = new MutationObserver(callback);
    observer.observe(target, options);
    this.observers.add(observer);
    return observer;
  }

  disconnectObserver(observer: MutationObserver): void {
    try {
      observer.disconnect();
    } finally {
      this.observers.delete(observer);
    }
  }

  // 전체 정리
  cleanup(): void {
    // 타이머 제거
    for (const id of Array.from(this.timeouts)) {
      globalThis.clearTimeout(id as unknown as number);
      this.timeouts.delete(id);
    }
    for (const id of Array.from(this.intervals)) {
      globalThis.clearInterval(id as unknown as number);
      this.intervals.delete(id);
    }

    // 옵저버 제거
    for (const obs of Array.from(this.observers)) {
      try {
        obs.disconnect();
      } finally {
        this.observers.delete(obs);
      }
    }

    // 이벤트 핸들러 제거
    for (const unsub of Array.from(this.eventUnsubs)) {
      try {
        unsub();
      } finally {
        this.eventUnsubs.delete(unsub);
      }
    }
  }

  // 테스트/진단용 통계
  getStats() {
    return {
      timeouts: this.timeouts.size,
      intervals: this.intervals.size,
      observers: this.observers.size,
      eventListeners: this.eventUnsubs.size,
    } as const;
  }
}
