/**
 * Solid Testing Library 유틸리티 래퍼
 * - 공통 테스트 헬퍼 경로에서 import 가능하도록 정리
 * - `@testing-library/preact` 대체: `renderHook` 호환 구현 포함
 * - Preact `h` 함수 호환 헬퍼 제공 (Solid.js로 전환용)
 */

import { createRoot } from 'solid-js';
import type { JSXElement } from 'solid-js';
import {
  fireEvent,
  getQueriesForElement,
  prettyDOM,
  queries,
  screen,
  waitFor,
  within,
} from '@testing-library/dom';
import type { BoundFunctions, Queries } from '@testing-library/dom';

import { getSolid } from '../../src/shared/external/vendors';

export { fireEvent, screen, waitFor, within };

const HYPERSCRIPT_MARKER = Symbol.for('xeg.testing.hyperscript');

interface HyperscriptNode {
  readonly type: any;
  readonly props: Record<string, any>;
  readonly __xegHyperscript: typeof HYPERSCRIPT_MARKER;
}

type Renderable = HyperscriptNode | JSXElement | (() => JSXElement);

interface MountedContainer {
  readonly container: HTMLElement;
  dispose: () => void;
  readonly removeOnCleanup: boolean;
}

const mountedContainers = new Set<MountedContainer>();

const isHyperscriptNode = (value: unknown): value is HyperscriptNode =>
  !!value &&
  typeof value === 'object' &&
  (value as Partial<HyperscriptNode>).__xegHyperscript === HYPERSCRIPT_MARKER;

const normalizeChildren = (input: unknown): unknown[] => {
  if (input === undefined || input === null) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.flatMap(child => normalizeChildren(child));
  }

  return [input];
};

const convertHyperscriptNode = (node: HyperscriptNode): JSXElement => {
  const solid = getSolid();
  const { type, props } = node;
  const { children: rawChildren, ...rest } = props ?? {};
  const normalized = normalizeChildren(rawChildren).map(child =>
    isHyperscriptNode(child) ? convertHyperscriptNode(child) : child
  );

  return solid.h(type, rest, ...normalized) as unknown as JSXElement;
};

const toRenderFunction = (input: Renderable): (() => JSXElement) => {
  if (typeof input === 'function' && !isHyperscriptNode(input)) {
    return input as () => JSXElement;
  }

  if (isHyperscriptNode(input)) {
    return () => convertHyperscriptNode(input);
  }

  return () => input as JSXElement;
};

export interface RenderOptions {
  container?: HTMLElement;
  baseElement?: HTMLElement;
}

export interface RenderResult<Q extends Queries = typeof queries> {
  container: HTMLElement;
  baseElement: HTMLElement;
  debug: (element?: Element | globalThis.DocumentFragment | null) => void;
  rerender: (ui: Renderable) => void;
  unmount: () => void;
  asFragment: () => globalThis.DocumentFragment;
  getByAltText: BoundFunctions<Q>['getByAltText'];
  getByDisplayValue: BoundFunctions<Q>['getByDisplayValue'];
  getByLabelText: BoundFunctions<Q>['getByLabelText'];
  getByPlaceholderText: BoundFunctions<Q>['getByPlaceholderText'];
  getByRole: BoundFunctions<Q>['getByRole'];
  getByTestId: BoundFunctions<Q>['getByTestId'];
  getByText: BoundFunctions<Q>['getByText'];
  getByTitle: BoundFunctions<Q>['getByTitle'];
  getAllByAltText: BoundFunctions<Q>['getAllByAltText'];
  getAllByDisplayValue: BoundFunctions<Q>['getAllByDisplayValue'];
  getAllByLabelText: BoundFunctions<Q>['getAllByLabelText'];
  getAllByPlaceholderText: BoundFunctions<Q>['getAllByPlaceholderText'];
  getAllByRole: BoundFunctions<Q>['getAllByRole'];
  getAllByTestId: BoundFunctions<Q>['getAllByTestId'];
  getAllByText: BoundFunctions<Q>['getAllByText'];
  getAllByTitle: BoundFunctions<Q>['getAllByTitle'];
  queryByAltText: BoundFunctions<Q>['queryByAltText'];
  queryByDisplayValue: BoundFunctions<Q>['queryByDisplayValue'];
  queryByLabelText: BoundFunctions<Q>['queryByLabelText'];
  queryByPlaceholderText: BoundFunctions<Q>['queryByPlaceholderText'];
  queryByRole: BoundFunctions<Q>['queryByRole'];
  queryByTestId: BoundFunctions<Q>['queryByTestId'];
  queryByText: BoundFunctions<Q>['queryByText'];
  queryByTitle: BoundFunctions<Q>['queryByTitle'];
  queryAllByAltText: BoundFunctions<Q>['queryAllByAltText'];
  queryAllByDisplayValue: BoundFunctions<Q>['queryAllByDisplayValue'];
  queryAllByLabelText: BoundFunctions<Q>['queryAllByLabelText'];
  queryAllByPlaceholderText: BoundFunctions<Q>['queryAllByPlaceholderText'];
  queryAllByRole: BoundFunctions<Q>['queryAllByRole'];
  queryAllByTestId: BoundFunctions<Q>['queryAllByTestId'];
  queryAllByText: BoundFunctions<Q>['queryAllByText'];
  queryAllByTitle: BoundFunctions<Q>['queryAllByTitle'];
  findByAltText: BoundFunctions<Q>['findByAltText'];
  findByDisplayValue: BoundFunctions<Q>['findByDisplayValue'];
  findByLabelText: BoundFunctions<Q>['findByLabelText'];
  findByPlaceholderText: BoundFunctions<Q>['findByPlaceholderText'];
  findByRole: BoundFunctions<Q>['findByRole'];
  findByTestId: BoundFunctions<Q>['findByTestId'];
  findByText: BoundFunctions<Q>['findByText'];
  findByTitle: BoundFunctions<Q>['findByTitle'];
  findAllByAltText: BoundFunctions<Q>['findAllByAltText'];
  findAllByDisplayValue: BoundFunctions<Q>['findAllByDisplayValue'];
  findAllByLabelText: BoundFunctions<Q>['findAllByLabelText'];
  findAllByPlaceholderText: BoundFunctions<Q>['findAllByPlaceholderText'];
  findAllByRole: BoundFunctions<Q>['findAllByRole'];
  findAllByTestId: BoundFunctions<Q>['findAllByTestId'];
  findAllByText: BoundFunctions<Q>['findAllByText'];
  findAllByTitle: BoundFunctions<Q>['findAllByTitle'];
}

export function render(ui: Renderable, options: RenderOptions = {}): RenderResult {
  const container = options.container ?? document.createElement('div');
  const baseElement = options.baseElement ?? container.ownerDocument?.body ?? document.body;

  if (!baseElement) {
    throw new Error('document.body is not available for render.');
  }

  const removeOnCleanup = !options.container;
  if (removeOnCleanup) {
    baseElement.appendChild(container);
  }

  const entry: MountedContainer = {
    container,
    dispose: () => {},
    removeOnCleanup,
  };

  const solid = getSolid();
  entry.dispose = solid.render(toRenderFunction(ui), container);
  mountedContainers.add(entry);

  const boundQueries = getQueriesForElement(container) as BoundFunctions<typeof queries>;

  const rerender = (nextUi: Renderable) => {
    entry.dispose();
    entry.dispose = solid.render(toRenderFunction(nextUi), container);
  };

  const unmount = () => {
    entry.dispose();
    mountedContainers.delete(entry);
    if (entry.removeOnCleanup && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  const asFragment = () => {
    const doc = container.ownerDocument ?? document;
    const fragment = doc.createDocumentFragment();
    fragment.appendChild(container.cloneNode(true));
    return fragment;
  };

  const debug = (element?: Element | globalThis.DocumentFragment | null) => {
    const targetElement = element ?? container;
    if (targetElement) {
      console.log(prettyDOM(targetElement as Element));
    }
  };

  return {
    container,
    baseElement,
    rerender,
    unmount,
    asFragment,
    debug,
    ...boundQueries,
  };
}

export function cleanup(): void {
  mountedContainers.forEach(entry => {
    entry.dispose();
    if (entry.removeOnCleanup && entry.container.parentNode) {
      entry.container.parentNode.removeChild(entry.container);
    }
  });
  mountedContainers.clear();
}

/**
 * Preact `h` 함수 호환 헬퍼
 * Solid.js JSX로 컴포넌트를 생성합니다.
 * @param component - 컴포넌트 타입 또는 태그명
 * @param props - 속성
 * @param children - 자식 요소들
 */
export function h(
  component: any,
  props?: Record<string, any> | null,
  ...children: any[]
): HyperscriptNode {
  const finalProps: Record<string, any> = {
    ...(props ?? {}),
  };

  if (children.length > 0) {
    finalProps.children = children.length === 1 ? children[0] : [...children];
  }

  return {
    type: component,
    props: finalProps,
    __xegHyperscript: HYPERSCRIPT_MARKER,
  };
}

export function act<T>(callback: () => T): T {
  return callback();
}

export interface RenderHookOptions<P> {
  initialProps?: P;
}

export interface RenderHookResult<R, P> {
  result: {
    current: R;
  };
  rerender: (nextProps?: P) => void;
  unmount: () => void;
}

export function renderHook<R, P = undefined>(
  callback: (props: P) => R,
  options?: RenderHookOptions<P>
): RenderHookResult<R, P> {
  let currentProps = options?.initialProps;
  const result = {
    current: undefined as unknown as R,
  };

  let dispose: (() => void) | undefined;

  const execute = (nextProps: P | undefined, updateStoredProps: boolean) => {
    if (updateStoredProps) {
      currentProps = nextProps;
    }

    const propsToUse = (updateStoredProps ? nextProps : currentProps) as P;

    act(() => {
      if (dispose) {
        dispose();
        dispose = undefined;
      }

      dispose = createRoot(disposeFn => {
        result.current = callback(propsToUse);
        return disposeFn;
      });
    });
  };

  execute(currentProps, false);

  const rerender = (...args: [P?]) => {
    if (args.length > 0) {
      execute(args[0], true);
      return;
    }

    execute(currentProps, false);
  };

  const unmount = () => {
    act(() => {
      if (dispose) {
        dispose();
        dispose = undefined;
      }
    });
  };

  return {
    result,
    rerender,
    unmount,
  };
}
