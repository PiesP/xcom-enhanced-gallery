import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from '@shared/components/ui/ErrorBoundary/ErrorBoundary';
import type { ComponentChildren } from '@shared/external/vendors';

const memoCallbacks: Array<() => unknown> = [];
let setCurrentError: ((value: unknown) => void) | null = null;

vi.mock('@shared/external/vendors/solid-hooks', () => ({
  children: (resolver: () => unknown) => {
    const value = resolver();
    if (typeof value === 'function') {
      return value as () => unknown;
    }
    return () => value;
  },
  createMemo: (fn: () => unknown) => {
    memoCallbacks.push(fn);
    return () => fn();
  },
  createSignal: (initial?: unknown) => {
    let state = initial;
    const getter = () => state;
    const setter = (next: unknown) => {
      state = next;
      setCurrentError = setter;
    };
    setCurrentError = setter;
    return [getter, setter] as const;
  },
}));

const translateMock = vi.fn((key: string, params?: Record<string, unknown>) =>
  key.endsWith('title') ? 'Boundary Error' : `Details: ${params?.error ?? 'unknown'}`,
);

vi.mock('@shared/container/service-accessors', () => ({
  getLanguageService: () => ({
    translate: translateMock,
  }),
}));

const notificationErrorMock = vi.fn();

vi.mock('@shared/services/notification-service', () => ({
  NotificationService: {
    getInstance: () => ({
      error: notificationErrorMock,
    }),
  },
}));

describe('ErrorBoundary (mutation scenarios)', () => {
  beforeEach(() => {
    memoCallbacks.length = 0;
    setCurrentError = null;
    vi.clearAllMocks();
  });

  it('reports distinct errors even after resetting signal state', () => {
    const firstError = new Error('first');
    const secondError = new Error('second');
    let current = firstError;

    const throwingChild = (() => {
      throw current;
    }) as unknown as ComponentChildren;

    ErrorBoundary({ children: throwingChild });
    expect(notificationErrorMock).toHaveBeenCalledTimes(1);

    setCurrentError?.(undefined);
    current = secondError;
    memoCallbacks[0]?.();

    expect(notificationErrorMock).toHaveBeenCalledTimes(2);
  });
});
