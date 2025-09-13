/**
 * @fileoverview Heroicons(React) getter
 * @description 외부 아이콘 라이브러리 접근은 전용 getter를 통해서만 수행합니다.
 * - 사용 아이콘만 개별 import하여 트리셰이킹을 보장합니다.
 * - Preact 환경에서는 preact/compat alias 하에서 React 컴포넌트가 동작합니다.
 */

// Outline 세트에서 필요한 아이콘만 개별 import
import {
  ChevronLeftIcon as ReactChevronLeftIcon,
  ChevronRightIcon as ReactChevronRightIcon,
  ArrowDownTrayIcon as ReactArrowDownTrayIcon,
  Cog6ToothIcon as ReactCog6ToothIcon,
  XMarkIcon as ReactXMarkIcon,
  MagnifyingGlassPlusIcon as ReactMagnifyingGlassPlusIcon,
  ArrowsRightLeftIcon as ReactArrowsRightLeftIcon,
  ArrowsUpDownIcon as ReactArrowsUpDownIcon,
  ArrowsPointingOutIcon as ReactArrowsPointingOutIcon,
  ArchiveBoxArrowDownIcon as ReactArchiveBoxArrowDownIcon,
} from '@heroicons/react/24/outline';
import { getPreactCompat, getPreact } from './index';
import type { VNode } from './index';

// Solid 세트(향후 필요 시 확장)
// import { ... } from '@heroicons/react/24/solid';

export type HeroIconComponent = (props: Record<string, unknown>) => unknown;
export type HeroiconsOutline = {
  ChevronLeftIcon: HeroIconComponent;
  ChevronRightIcon: HeroIconComponent;
  ArrowDownTrayIcon: HeroIconComponent;
  Cog6ToothIcon: HeroIconComponent;
  XMarkIcon: HeroIconComponent;
  MagnifyingGlassPlusIcon: HeroIconComponent;
  ArrowsRightLeftIcon: HeroIconComponent;
  ArrowsUpDownIcon: HeroIconComponent;
  ArrowsPointingOutIcon: HeroIconComponent;
  ArchiveBoxArrowDownIcon: HeroIconComponent;
};

/**
 * Outline 아이콘 집합 getter
 * 주: 정적 import된 참조를 객체로 노출해 테스트에서 모킹이 용이합니다.
 */
export function getHeroiconsOutline(): HeroiconsOutline {
  // 주의: Vitest/jsdom 환경에서 preact/compat.createElement로 감싸면
  // ReactElement 형태가 그대로 전달되어 DOM 생성 시 tagName에 객체가 넘어가는 문제가 있었습니다.
  // 해결: forwardRef 객체의 .render(또는 함수형이면 직접 호출)를 사용해
  // preact/jsx-runtime으로 생성된 실제 VNode를 반환합니다.
  // (preset-vite가 react/jsx-runtime을 preact/jsx-runtime으로 alias 처리)

  // preact API를 불러와 타입 추론에 도움을 주되, 직접 호출은 하지 않습니다.
  void getPreact;
  void getPreactCompat;

  const wrap = (Comp: unknown): HeroIconComponent => {
    const { h, Fragment } = getPreact();
    // ReactElement -> Preact VNode 변환기 (항상 VNode | null 반환)
    const toVNode = (node: unknown): VNode | null => {
      // 원시 값/널 처리
      if (node == null || typeof node === 'boolean') return null;
      if (typeof node === 'string' || typeof node === 'number') {
        const hAny = h as unknown as (...args: unknown[]) => unknown;
        return hAny(Fragment, {}, node) as unknown as VNode;
      }
      if (Array.isArray(node)) {
        const hAny = h as unknown as (...args: unknown[]) => unknown;
        const kids = (node as unknown[]).map(toVNode).filter(Boolean) as VNode[];
        return hAny(Fragment, {}, ...kids) as unknown as VNode;
      }

      // ReactElement 추정: { type, props, key } 구조
      if (typeof node === 'object' && node !== null) {
        const el = node as { type?: unknown; props?: unknown; key?: unknown };
        if (el.type) {
          const type = el.type as unknown;
          const props = (el.props ?? {}) as Record<string, unknown>;
          const { children, ...rest } = props;
          const kidArray = Array.isArray(children) ? children : children != null ? [children] : [];
          const convertedKids = kidArray.map(toVNode) as VNode[];
          const hAny = h as unknown as (...args: unknown[]) => unknown;
          return hAny(type, rest, ...convertedKids) as unknown as VNode;
        }
      }
      // 알 수 없는 타입은 그대로 반환(Preact가 필터링)
      return null;
    };

    return (props: Record<string, unknown>): VNode | null => {
      // 함수형/forwardRef 컴포넌트 호출 → ReactElement(또는 PreactVNode) 획득
      let produced: unknown;
      if (typeof Comp === 'function') {
        produced = (Comp as (p: Record<string, unknown>) => unknown)(props);
      } else {
        const maybeObj = Comp as {
          render?: (p: Record<string, unknown>, ref?: unknown) => unknown;
        };
        if (maybeObj && typeof maybeObj.render === 'function') {
          produced = maybeObj.render(props, null as unknown as never);
        } else {
          // 최후: compat.createElement 시도
          const { createElement } = getPreactCompat();
          const ce = createElement as unknown as (...args: unknown[]) => unknown;
          produced = ce(Comp as unknown, props as unknown);
        }
      }

      // 이미 Preact VNode인지 확인: type이 string/function이며 객체가 동결되지 않음(휴리스틱)
      if (
        produced &&
        typeof produced === 'object' &&
        // Preact VNode는 내부 플래그 `type`과 `props`를 갖지만 React와 달리 동결되어 있지 않음
        // 단, 정확 판별이 어려워서 안전하게 변환 경로를 사용
        true
      ) {
        return toVNode(produced);
      }
      return produced as VNode | null;
    };
  };

  return {
    ChevronLeftIcon: wrap(ReactChevronLeftIcon),
    ChevronRightIcon: wrap(ReactChevronRightIcon),
    ArrowDownTrayIcon: wrap(ReactArrowDownTrayIcon),
    Cog6ToothIcon: wrap(ReactCog6ToothIcon),
    XMarkIcon: wrap(ReactXMarkIcon),
    MagnifyingGlassPlusIcon: wrap(ReactMagnifyingGlassPlusIcon),
    ArrowsRightLeftIcon: wrap(ReactArrowsRightLeftIcon),
    ArrowsUpDownIcon: wrap(ReactArrowsUpDownIcon),
    ArrowsPointingOutIcon: wrap(ReactArrowsPointingOutIcon),
    ArchiveBoxArrowDownIcon: wrap(ReactArchiveBoxArrowDownIcon),
  };
}

// 필요 시 Solid도 동일 패턴으로 제공
// export function getHeroiconsSolid() { return { ... } }
