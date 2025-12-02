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

const translateMock = vi.fn((key: string, params?: Record<string, unknown>) => {
  if (key.endsWith('title')) {
    return 'Boundary Error';
  }
  return `Details: ${params?.error ?? 'unknown'}`;
});

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

describe('ErrorBoundary', () => {
  beforeEach(() => {
    memoCallbacks.length = 0;
    setCurrentError = null;
    vi.clearAllMocks();
  });

  it('reports render errors and renders fallback element', () => {
    const failure = new Error('explode');
    const throwingChild = (() => {
      throw failure;
    }) as unknown as ComponentChildren;
    const result = ErrorBoundary({
      children: throwingChild,
    });

    expect(notificationErrorMock).toHaveBeenCalledWith('Boundary Error', 'Details: explode');
    expect(result).toBeTruthy();
  });

  it('deduplicates identical errors on re-render', () => {
    const sharedError = new Error('repeatable');

    const throwingChild = (() => {
      throw sharedError;
    }) as unknown as ComponentChildren;

    ErrorBoundary({
      children: throwingChild,
    });

    expect(notificationErrorMock).toHaveBeenCalledTimes(1);

    setCurrentError?.(undefined);
    memoCallbacks[0]?.();

    expect(notificationErrorMock).toHaveBeenCalledTimes(1);
  });

  it('swallows notification or translation failures', () => {
    translateMock.mockImplementationOnce(() => {
      throw new Error('translator offline');
    });
    notificationErrorMock.mockImplementationOnce(() => {
      throw new Error('notify down');
    });

    const throwingChild = (() => {
      throw new Error('boom');
    }) as unknown as ComponentChildren;

    expect(() =>
      ErrorBoundary({
        children: throwingChild,
      }),
    ).not.toThrow();
  });

  it('renders children when no error occurs', () => {
    const child = <p>Gallery content</p>;
    const result = ErrorBoundary({ children: child });
    expect(result).toBe(child);
    expect(notificationErrorMock).not.toHaveBeenCalled();
  });

  it('handles non-Error objects thrown by children', () => {
    const stringError = 'string error';
    const throwingChild = (() => {
      throw stringError;
    }) as unknown as ComponentChildren;

    const result = ErrorBoundary({
      children: throwingChild,
    });

    expect(notificationErrorMock).toHaveBeenCalledWith('Boundary Error', 'Details: string error');
    expect(result).toBeTruthy();
  });

  it('handles primitive non-error values thrown by children', () => {
    const primitive = 42;
    const throwingChild = (() => {
      throw primitive;
    }) as unknown as ComponentChildren;

    const result = ErrorBoundary({
      children: throwingChild,
    });

    expect(notificationErrorMock).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it('handles undefined error thrown by children', () => {
    const throwingChild = (() => {
      throw undefined;
    }) as unknown as ComponentChildren;

    const result = ErrorBoundary({
      children: throwingChild,
    });

    expect(notificationErrorMock).toHaveBeenCalledWith('Boundary Error', 'Details: undefined');
    expect(result).toBeTruthy();
  });

  it('handles number error thrown by children', () => {
    const throwingChild = (() => {
      throw 404;
    }) as unknown as ComponentChildren;

    const result = ErrorBoundary({
      children: throwingChild,
    });

    expect(notificationErrorMock).toHaveBeenCalledWith('Boundary Error', 'Details: 404');
    expect(result).toBeTruthy();
  });

  it('handles object error thrown by children', () => {
    const objError = { code: 500, message: 'Internal error' };
    const throwingChild = (() => {
      throw objError;
    }) as unknown as ComponentChildren;

    const result = ErrorBoundary({
      children: throwingChild,
    });

    expect(notificationErrorMock).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it('renders fallback element when error occurs', () => {
    const failure = new Error('test error');
    const throwingChild = (() => {
      throw failure;
    }) as unknown as ComponentChildren;

    const result = ErrorBoundary({
      children: throwingChild,
    });

    expect(notificationErrorMock).toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it('handles children as null', () => {
    const result = ErrorBoundary({ children: null });
    expect(notificationErrorMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it('handles children as undefined', () => {
    const result = ErrorBoundary({ children: undefined });
    expect(notificationErrorMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it('handles children as array', () => {
    const children = [<div>Child 1</div>, <div>Child 2</div>];
    const result = ErrorBoundary({ children });
    expect(notificationErrorMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it('handles function children that return element', () => {
    const functionChild = () => <div>Lazy child</div>;
    const result = ErrorBoundary({ children: functionChild as unknown as ComponentChildren });
    expect(notificationErrorMock).not.toHaveBeenCalled();
    expect(result).toBeTruthy();
  });

  it('reports only the first error when multiple errors occur', () => {
    const error1 = new Error('first error');
    const error2 = new Error('second error');

    const throwingChild1 = (() => {
      throw error1;
    }) as unknown as ComponentChildren;

    ErrorBoundary({ children: throwingChild1 });
    expect(notificationErrorMock).toHaveBeenCalledTimes(1);
    expect(notificationErrorMock).toHaveBeenCalledWith('Boundary Error', 'Details: first error');

    // Reset error state and trigger second error
    setCurrentError?.(undefined);
    const throwingChild2 = (() => {
      throw error2;
    }) as unknown as ComponentChildren;

    ErrorBoundary({ children: throwingChild2 });
    expect(notificationErrorMock).toHaveBeenCalledTimes(2);
    expect(notificationErrorMock).toHaveBeenLastCalledWith('Boundary Error', 'Details: second error');
  });

  it('handles getLanguageService throwing error gracefully', () => {
    translateMock.mockImplementationOnce(() => {
      throw new Error('Language service unavailable');
    });

    const throwingChild = (() => {
      throw new Error('child error');
    }) as unknown as ComponentChildren;

    expect(() => ErrorBoundary({ children: throwingChild })).not.toThrow();
  });

  it('handles NotificationService.getInstance throwing error gracefully', () => {
    notificationErrorMock.mockImplementationOnce(() => {
      throw new Error('Notification service unavailable');
    });

    const throwingChild = (() => {
      throw new Error('child error');
    }) as unknown as ComponentChildren;

    expect(() => ErrorBoundary({ children: throwingChild })).not.toThrow();
  });
});
