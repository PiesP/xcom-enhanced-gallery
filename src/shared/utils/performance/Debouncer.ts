/**
 * @fileoverview 간소화된 디바운서 시스템
 * @version 2.0.0 - 간소화된 구현
 *
 * 복잡한 전략 시스템을 제거하고 기본적인 디바운싱 기능만 제공
 */

/**
 * 간소화된 디바운서 클래스
 */
export class Debouncer<T extends unknown[] = unknown[]> {
  private timerId: number | null = null;
  private lastArgs: T | null = null;

  constructor(
    private readonly fn: (...args: T) => void,
    private readonly delay: number
  ) {}

  /**
   * 디바운스된 함수 실행
   */
  execute(...args: T): void {
    this.lastArgs = args;
    this.clearTimer();
    this.timerId = window.setTimeout(() => {
      if (this.lastArgs) {
        this.fn(...this.lastArgs);
      }
      this.timerId = null;
    }, this.delay);
  }

  /**
   * 대기 중인 실행을 즉시 처리
   */
  flush(): void {
    if (this.lastArgs) {
      this.clearTimer();
      this.fn(...this.lastArgs);
      this.lastArgs = null;
    }
  }

  /**
   * 대기 중인 실행을 취소
   */
  cancel(): void {
    this.clearTimer();
    this.lastArgs = null;
  }

  /**
   * 현재 대기 중인 실행이 있는지 확인
   */
  isPending(): boolean {
    return this.timerId !== null;
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

/**
 * 디바운서 팩토리 함수
 */
export function createDebouncer<T extends unknown[]>(
  fn: (...args: T) => void,
  delay: number
): Debouncer<T> {
  return new Debouncer(fn, delay);
}

/**
 * 함수형 디바운스 (간단한 사용을 위한 유틸리티)
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = window.setTimeout(() => func(...args), wait);
  };
}
