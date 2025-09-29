/**
 * Solid 기반 Legacy Preact 호환 유틸리티
 * Stage D Phase 5 이후 테스트 하네스에서 잔여 Preact API 사용을 제거하기 위해
 * 최소한의 API 모양만 유지하면서 Solid 구현 위에서 동작하도록 재구성했습니다.
 */

import {
  batch,
  createComponent,
  createEffect,
  createMemo,
  createSignal,
  Fragment,
  onCleanup,
  onMount,
  type Accessor,
  type JSX,
} from 'solid-js';
import hFactory from 'solid-js/h';
import { render as solidRender } from 'solid-js/web';

// ================================
// Legacy Preact `h`/`render`
// ================================

type LegacyElement = JSX.Element;
type LegacyComponent<P = Record<string, unknown>> = (props: P) => LegacyElement;

type LegacyNodeType<P = Record<string, unknown>> =
  | string
  | LegacyComponent<P>
  | (new (props: P) => LegacyComponentInstance<P>);

type LegacyChildren = Array<unknown>;

type LegacyRef<T> = { current: T | null };

interface LegacyComponentInstance<P = Record<string, unknown>> {
  props: P;
  state: Record<string, unknown>;
  setState(nextState: Record<string, unknown>): void;
  render(): LegacyElement | null;
}

const containerDisposers = new WeakMap<Element, () => void>();

function normalizeChildren(children: LegacyChildren): LegacyChildren {
  const result: LegacyChildren = [];
  for (const child of children) {
    if (Array.isArray(child)) {
      result.push(...normalizeChildren(child));
    } else if (child === false || child === true || child == null) {
      continue;
    } else {
      result.push(child);
    }
  }
  return result;
}

function buildProps(
  props: Record<string, unknown> | null | undefined,
  normalizedChildren: LegacyChildren
): Record<string, unknown> {
  const finalProps: Record<string, unknown> = props ? { ...props } : {};

  if (normalizedChildren.length > 0) {
    finalProps.children =
      normalizedChildren.length === 1 ? normalizedChildren[0] : normalizedChildren;
  }

  return finalProps;
}

function legacyH<P>(
  type: LegacyNodeType<P>,
  props?: Record<string, unknown> | null,
  ...children: LegacyChildren
): LegacyElement {
  const normalizedChildren = normalizeChildren(children);
  const finalProps = buildProps(props, normalizedChildren);

  if (type === Fragment) {
    if (normalizedChildren.length === 0) {
      return null;
    }
    if (normalizedChildren.length === 1) {
      return normalizedChildren[0] as LegacyElement;
    }
    return normalizedChildren as unknown as LegacyElement;
  }

  if (typeof type === 'function') {
    const { children: componentChildren, ...restProps } = finalProps;
    const componentProps = restProps as P;
    if (componentChildren !== undefined) {
      (componentProps as Record<string, unknown>).children = componentChildren;
    }
    return createComponent(type as LegacyComponent<P>, componentProps);
  }

  return hFactory(type as string, finalProps, ...normalizedChildren);
}

function legacyRender(node: LegacyElement | null, container: Element): void {
  const dispose = containerDisposers.get(container);
  if (dispose) {
    dispose();
    containerDisposers.delete(container);
  }

  if (node == null) {
    container.innerHTML = '';
    return;
  }

  const disposeFn = solidRender(() => node, container);
  containerDisposers.set(container, disposeFn);
}

function legacyCloneElement(
  element: LegacyElement,
  props: Record<string, unknown> | null | undefined
): LegacyElement {
  if (element == null || (typeof element !== 'object' && typeof element !== 'function')) {
    return element;
  }

  const typedElement = element as unknown as {
    type: LegacyNodeType;
    props?: Record<string, unknown>;
  };
  return legacyH(typedElement.type, { ...typedElement.props, ...props });
}

function legacyCreateRef<T = unknown>(): LegacyRef<T> {
  return { current: null };
}

class LegacyComponentBase<P = Record<string, unknown>> implements LegacyComponentInstance<P> {
  public props: P;
  public state: Record<string, unknown> = {};

  constructor(props: P) {
    this.props = props;
  }

  public setState(_nextState: Record<string, unknown>): void {
    // Solid 테스트 하네스에서는 클래스 컴포넌트를 사용하지 않으므로 noop 처리
  }

  public render(): LegacyElement | null {
    return null;
  }
}

function isValidElement(value: unknown): value is LegacyElement {
  return value != null && (typeof value === 'object' || typeof value === 'function');
}

const legacyOptions = Object.create(null) as Record<string, unknown>;

// ================================
// Hooks 호환 레이어
// ================================

type EffectCallback = () => void | (() => void);

function useEffect(callback: EffectCallback, _deps?: ReadonlyArray<unknown>): void {
  let cleanup: ReturnType<EffectCallback>;

  const run = () => {
    cleanup = callback();
  };

  onMount(run);
  onCleanup(() => {
    if (typeof cleanup === 'function') {
      cleanup();
    }
  });
}

function useLayoutEffect(callback: EffectCallback, deps?: ReadonlyArray<unknown>): void {
  useEffect(callback, deps);
}

function useRef<T>(initialValue: T | null = null): LegacyRef<T> {
  const ref: LegacyRef<T> = { current: initialValue };
  onCleanup(() => {
    ref.current = null;
  });
  return ref;
}

function useState<T>(initial: T): [Accessor<T>, (next: T) => void] {
  const [value, setValue] = createSignal<T>(initial);
  return [value, (next: T) => setValue(() => next)];
}

function useMemo<T>(factory: () => T): T {
  return createMemo(factory)();
}

function useCallback<T extends (...args: never[]) => unknown>(callback: T): T {
  return callback;
}

function useReducer<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S
): [S, (action: A) => void] {
  const [state, setState] = createSignal(initialState);
  const dispatch = (action: A) => {
    setState(prev => reducer(prev, action));
  };
  return [state(), dispatch];
}

// ================================
// Signals 호환 레이어
// ================================

interface LegacySignal<T> {
  value: T;
}

function legacySignal<T>(initial: T): LegacySignal<T> {
  const [value, setValue] = createSignal(initial);
  return {
    get value() {
      return value();
    },
    set value(next: T) {
      batch(() => setValue(() => next));
    },
  };
}

function legacyComputed<T>(factory: () => T): LegacySignal<T> {
  const memo = createMemo(factory);
  return {
    get value() {
      return memo();
    },
  } as LegacySignal<T>;
}

function legacyEffect(callback: () => void): void {
  createEffect(callback);
}

// ================================
// Compat 레이어 (forwardRef/memo)
// ================================

function legacyForwardRef<P extends Record<string, unknown>, R>(
  renderFn: (props: P, ref: LegacyRef<R> | null) => LegacyElement
): LegacyComponent<P & { ref?: LegacyRef<R> | null }> {
  return props => {
    const { ref = null, ...rest } = props;
    return renderFn(rest as P, ref ?? null);
  };
}

function legacyMemo<P>(component: LegacyComponent<P>): LegacyComponent<P> {
  return component;
}

// ================================
// Public API
// ================================

export function getPreact() {
  return {
    h: legacyH,
    render: legacyRender,
    Component: LegacyComponentBase,
    Fragment,
    cloneElement: legacyCloneElement,
    createRef: legacyCreateRef,
    isValidElement,
    options: legacyOptions,
    createElement: legacyH,
  };
}

export function getPreactHooks() {
  return {
    useEffect,
    useLayoutEffect,
    useMemo,
    useCallback,
    useState,
    useRef,
    useReducer,
  };
}

export function getPreactSignals() {
  return {
    signal: legacySignal,
    computed: legacyComputed,
    effect: legacyEffect,
    batch,
  };
}

export function getPreactCompat() {
  return {
    forwardRef: legacyForwardRef,
    memo: legacyMemo,
  };
}

export const h = legacyH;
export const render = legacyRender;
export { Fragment };
