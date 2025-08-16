/**
 * Timing & Mutation Utilities (scroll 전용 공유)
 */
export function now(): number {
  return Date.now();
}

export function rafChain(count: number, cb: () => void): void {
  const exec = (n: number) => {
    if (n <= 0) return cb();
    requestAnimationFrame(() => exec(n - 1));
  };
  exec(count);
}

/**
 * MutationObserver 기반 조건 충족 대기 (성공 시 true 반환, timeout 시 false)
 * predicate 이 true 를 반환하면 종료
 */
export interface WaitForMutationHandle {
  readonly active: () => boolean; // 여전히 관찰 중인지
  cancel(): void; // 관찰 중단 (성공/타임아웃 전 취소)
}

export interface WaitForMutationOptions {
  signal?: AbortSignal; // 외부 abort 지원
}

export function waitForMutationUntil(
  root: Node | null,
  predicate: () => boolean,
  timeoutMs: number,
  options: WaitForMutationOptions = {}
): WaitForMutationHandle | null {
  if (!root) return null;
  let done = false;
  if (predicate())
    return {
      active: () => false,
      cancel: () => void 0,
    };
  const observer = new MutationObserver(() => {
    if (done) return;
    if (predicate()) {
      done = true;
      observer.disconnect();
      clearTimeout(timeoutId);
      options.signal?.removeEventListener('abort', abortHandler);
    }
  });
  try {
    observer.observe(root, { childList: true, subtree: true });
  } catch {
    return null;
  }
  const finish = () => {
    if (done) return;
    done = true;
    observer.disconnect();
    clearTimeout(timeoutId);
    options.signal?.removeEventListener('abort', abortHandler);
  };
  const abortHandler = () => finish();
  if (options.signal) {
    if (options.signal.aborted) {
      finish();
      return {
        active: () => false,
        cancel: () => void 0,
      };
    }
    options.signal.addEventListener('abort', abortHandler, { once: true });
  }
  const timeoutId = setTimeout(() => finish(), timeoutMs);
  return {
    active: () => !done,
    cancel: () => finish(),
  };
}
