import { getSolidCore } from '@shared/external/vendors';
import { createFocusTrap, type FocusTrapOptions } from '@shared/utils/focusTrap';

type MaybeAccessor<T> = T | (() => T);

function resolve<T>(value: MaybeAccessor<T>): T {
  return typeof value === 'function' ? (value as () => T)() : value;
}

interface FocusTrapApi {
  readonly isActive: boolean;
  activate: () => void;
  deactivate: () => void;
}

const scheduleMicrotask = (callback: () => void) => {
  if (typeof globalThis.queueMicrotask === 'function') {
    globalThis.queueMicrotask(callback);
    return;
  }

  void Promise.resolve().then(callback);
};

export function useFocusTrap(
  container: MaybeAccessor<HTMLElement | null | undefined>,
  initialActive: MaybeAccessor<boolean> = true,
  options: FocusTrapOptions = {}
): FocusTrapApi {
  const { createSignal, createEffect, onCleanup } = getSolidCore();

  const [isActive, setIsActive] = createSignal(false);

  let trap = null as ReturnType<typeof createFocusTrap> | null;
  let currentContainer: HTMLElement | null = null;

  const getContainer = () => {
    const resolved = resolve(container) ?? null;
    return resolved;
  };

  const ensureTrap = (): ReturnType<typeof createFocusTrap> | null => {
    const target = getContainer();
    if (!target) {
      return null;
    }

    if (!trap || currentContainer !== target) {
      trap?.destroy();
      trap = createFocusTrap(target, options);
      currentContainer = target;
    }

    return trap;
  };

  const activate = () => {
    const instance = ensureTrap();
    instance?.activate();
    setIsActive(instance?.isActive ?? false);
  };

  const deactivate = () => {
    if (!trap) {
      setIsActive(false);
      return;
    }

    trap.deactivate();
    setIsActive(trap.isActive);
  };

  createEffect(() => {
    const target = getContainer();
    if (!target) {
      trap?.destroy();
      trap = null;
      currentContainer = null;
      setIsActive(false);
      return;
    }

    if (!trap || currentContainer !== target) {
      trap?.destroy();
      trap = createFocusTrap(target, options);
      currentContainer = target;
      if (isActive()) {
        trap.activate();
      }
    }
  });

  let initialActivationQueued = false;

  if (!initialActivationQueued && resolve(initialActive)) {
    initialActivationQueued = true;
    scheduleMicrotask(() => {
      activate();
    });
  }

  onCleanup(() => {
    trap?.destroy();
    trap = null;
    currentContainer = null;
    setIsActive(false);
  });

  return {
    get isActive() {
      return isActive();
    },
    activate,
    deactivate,
  };
}
