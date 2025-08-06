/**
 * @fileoverview Timer Management Utilities
 * @description 타이머와 디바운싱 관리를 위한 유틸리티
 */

export interface TimerHandle {
  id: number;
  cancel: () => void;
}

/**
 * 디바운서 클래스
 */
export class Debouncer<T extends unknown[]> {
  private timerId: number | null = null;
  private readonly delay: number;
  private readonly callback: (...args: T) => void;

  constructor(callback: (...args: T) => void, delay: number) {
    this.callback = callback;
    this.delay = delay;
  }

  execute(...args: T): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
    }
    this.timerId = window.setTimeout(() => {
      this.callback(...args);
      this.timerId = null;
    }, this.delay);
  }

  cancel(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  get pending(): boolean {
    return this.timerId !== null;
  }
}

/**
 * 디바운서 생성 팩토리 함수
 */
export function createDebouncer<T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
): Debouncer<T> {
  return new Debouncer(callback, delay);
}

/**
 * 간단한 지연 실행
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 타이머 서비스 (싱글톤)
 */
class TimerServiceImpl {
  private readonly timers = new Map<number, TimerHandle>();
  private nextId = 1;

  setTimeout(callback: () => void, delay: number): TimerHandle {
    const id = this.nextId++;
    const timerId = window.setTimeout(() => {
      this.timers.delete(id);
      callback();
    }, delay);

    const handle: TimerHandle = {
      id,
      cancel: () => {
        clearTimeout(timerId);
        this.timers.delete(id);
      },
    };

    this.timers.set(id, handle);
    return handle;
  }

  clearAllTimers(): void {
    for (const handle of this.timers.values()) {
      handle.cancel();
    }
    this.timers.clear();
  }

  getActiveTimerCount(): number {
    return this.timers.size;
  }
}

export const TimerService = new TimerServiceImpl();
export const globalTimerService = TimerService;
