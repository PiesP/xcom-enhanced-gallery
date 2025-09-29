/**
 * Solid 기반 Testing Library 호환 유틸리티
 *
 * Stage D Phase 5에서 preact-legacy 의존성을 제거하기 위해,
 * 기존 Preact 전용 래퍼를 Solid Testing Library 위로 재구현한다.
 * 기존 테스트 코드가 사용하는 API 모양(render, rerender, renderHook 등)을 유지한다.
 */

import { createComponent, createEffect, createSignal, type Component, type JSX } from 'solid-js';
import {
  render as solidRender,
  cleanup as solidCleanup,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@solidjs/testing-library';
import { queries as defaultQueries, type BoundFunctions, type Queries } from '@testing-library/dom';

type SolidRenderOptions = NonNullable<Parameters<typeof solidRender>[1]>;
type SolidRenderReturn = ReturnType<typeof solidRender>;

export type WrapperComponentProps = {
  readonly children?: JSX.Element;
};

export interface RenderOptions<Q extends Queries = typeof defaultQueries>
  extends Omit<SolidRenderOptions, 'wrapper' | 'queries'> {
  readonly wrapper?: Component<{ children: JSX.Element }>;
  readonly queries?: Q;
}

export interface RenderResult<Q extends Queries = typeof defaultQueries> extends BoundFunctions<Q> {
  readonly container: SolidRenderReturn['container'];
  readonly baseElement: SolidRenderReturn['baseElement'];
  readonly debug: SolidRenderReturn['debug'];
  readonly unmount: SolidRenderReturn['unmount'];
  readonly asFragment: SolidRenderReturn['asFragment'];
  readonly rerender: (ui: Renderable) => void;
}

type Renderable = JSX.Element | (() => JSX.Element);

function toComponent(ui: Renderable): () => JSX.Element {
  if (typeof ui === 'function') {
    return ui as () => JSX.Element;
  }
  return () => ui;
}

export function render<Q extends Queries = typeof defaultQueries>(
  ui: Renderable,
  options: RenderOptions<Q> = {}
): RenderResult<Q> {
  const { wrapper, ...rest } = options;
  let setView: ((next: () => JSX.Element) => void) | undefined;

  const RenderRoot = () => {
    const [view, setViewSignal] = createSignal<() => JSX.Element>(toComponent(ui));
    setView = next => setViewSignal(() => next);
    return view()();
  };

  const WrappedRoot: () => JSX.Element = wrapper
    ? () =>
        createComponent(wrapper, {
          get children() {
            return createComponent(RenderRoot, {});
          },
        })
    : RenderRoot;

  const solidResult = solidRender(WrappedRoot, rest as SolidRenderOptions);

  return {
    ...solidResult,
    rerender: (nextUi: Renderable) => {
      if (!setView) {
        throw new Error('render: rerender 호출 전에 컴포넌트가 마운트되지 않았습니다.');
      }
      setView(() => toComponent(nextUi));
    },
  } as RenderResult<Q>;
}

export function cleanup(): void {
  solidCleanup();
}

export interface RenderHookOptions<TProps> {
  readonly initialProps?: TProps;
  readonly wrapper?: Component<{ children: JSX.Element }>;
}

export interface RenderHookResult<TResult, TProps> {
  readonly result: { current: TResult };
  readonly rerender: (props?: TProps) => void;
  readonly unmount: () => void;
}

export function renderHook<TResult, TProps = void>(
  callback: (props: TProps) => TResult,
  options: RenderHookOptions<TProps> = {}
): RenderHookResult<TResult, TProps> {
  const { initialProps, wrapper } = options;
  const result: { current: TResult } = { current: undefined as TResult };
  let latestProps = initialProps;
  let setPropsSignal: ((next: TProps) => void) | undefined;

  const HookComponent = (props: { hookProps?: TProps }) => {
    const [currentProps, setCurrentProps] = createSignal(props.hookProps as TProps);

    if (props.hookProps !== undefined) {
      setPropsSignal = next => setCurrentProps(next);
    }

    createEffect(() => {
      if (props.hookProps !== undefined) {
        setCurrentProps(props.hookProps as TProps);
        if (!setPropsSignal) {
          setPropsSignal = next => setCurrentProps(next);
        }
      }
    });

    const propsProxy = new Proxy({} as TProps, {
      get(_, key: string | symbol) {
        const source = currentProps();
        if (source == null) {
          return undefined;
        }
        return (source as Record<string | symbol, unknown>)[key];
      },
      has(_, key: string | symbol) {
        const source = currentProps();
        if (source == null) {
          return false;
        }
        return key in (source as Record<string | symbol, unknown>);
      },
      ownKeys() {
        const source = currentProps();
        return source != null ? Reflect.ownKeys(source as Record<string | symbol, unknown>) : [];
      },
      getOwnPropertyDescriptor(_, key: string | symbol) {
        const source = currentProps();
        if (source == null) {
          return undefined;
        }
        return {
          configurable: true,
          enumerable: true,
          value: (source as Record<string | symbol, unknown>)[key],
          writable: true,
        };
      },
    });

    result.current = callback(propsProxy);
    return null;
  };

  const HookWithWrapper: Component<{ hookProps?: TProps }> = wrapper
    ? props =>
        createComponent(wrapper, {
          get children() {
            return createComponent(HookComponent, props);
          },
        })
    : HookComponent;

  const renderResult = render(() => createComponent(HookWithWrapper, { hookProps: initialProps }));

  return {
    result,
    rerender: (nextProps?: TProps) => {
      latestProps = nextProps ?? latestProps;
      renderResult.rerender(() =>
        createComponent(HookWithWrapper, {
          hookProps: latestProps,
        })
      );
      if (latestProps !== undefined && setPropsSignal) {
        setPropsSignal(latestProps as TProps);
      }
    },
    unmount: () => {
      renderResult.unmount();
    },
  };
}

export async function act(callback: () => void | Promise<void>): Promise<void> {
  const maybePromise = callback();
  if (maybePromise && typeof (maybePromise as Promise<unknown>).then === 'function') {
    await maybePromise;
  }
}

export { screen, fireEvent, waitFor, within };
