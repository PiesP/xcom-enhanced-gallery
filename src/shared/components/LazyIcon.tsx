import { getPreact, getPreactHooks, type VNode } from '@shared/external/vendors';
import {
  getIconRegistry,
  preloadCommonIcons,
  type IconName,
  type IconRegistry,
  type IconComponent,
} from '@shared/services/iconRegistry';

export interface LazyIconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly stroke?: number;
  readonly color?: string;
  readonly className?: string;
  /** 커스텀 placeholder. 제공되면 기본 placeholder를 건너뜀 */
  readonly fallback?: VNode | unknown;
  /** 로드 실패시 대체 (미구현; 향후 R4에서 활용 가능) */
  readonly errorFallback?: VNode | unknown;
}

export function LazyIcon(props: LazyIconProps): VNode | unknown {
  const { h } = getPreact();
  const registry = getIconRegistry();

  // ---------------------------------------------
  // Hook 가용성 탐지 (테스트에서 LazyIcon을 직접 호출하거나
  // getPreactHooks가 부분 모킹된 경우 useState/useEffect 부재 가능)
  // ---------------------------------------------
  let useState: (<S>(init: S) => [S, (v: S | ((p: S) => S)) => void]) | undefined;
  let useEffect: ((cb: () => void | (() => void), deps?: unknown[]) => void) | undefined;
  try {
    const hooks = getPreactHooks();
    // PreactHooksAPI 인터페이스가 보장되지 않는 모킹 시나리오 대응 위해 존재 여부만 조건부 할당
    interface PartialHooks {
      useState?<S>(init: S): [S, (v: S | ((p: S) => S)) => void];
      useEffect?(cb: () => void | (() => void), deps?: unknown[]): void;
    }
    const partial: PartialHooks = hooks as unknown as PartialHooks;
    if (typeof partial.useState === 'function') useState = partial.useState;
    if (typeof partial.useEffect === 'function') useEffect = partial.useEffect;
  } catch {
    // hooks 확보 실패 → fallback 경로 사용
  }

  const initial = registry.getLoadedIconSync(props.name) as IconComponent | null;

  // Hook 지원 불가 시(또는 테스트에서 함수 직접 호출) 비반응형 경로
  if (typeof useState !== 'function' || typeof useEffect !== 'function') {
    const component = initial; // 프리로드된 경우 즉시 사용
    if (!component) {
      // 비동기 로드 트리거 (재렌더 없으므로 최초 호출에서는 placeholder 유지)
      void registry.loadIcon(props.name).catch(() => void 0);
    }

    if (props.fallback && !component) return props.fallback;
    if (component) {
      try {
        const passedProps: Record<string, unknown> = {};
        if (props.size !== undefined) passedProps.size = props.size;
        if (props.stroke !== undefined) passedProps.stroke = props.stroke;
        if (props.color !== undefined) passedProps.color = props.color;
        if (props.className !== undefined) passedProps.className = props.className;
        return h(component as unknown as (p: Record<string, unknown>) => VNode, passedProps);
      } catch {
        // fallthrough → placeholder
      }
    }
    const className = ['lazy-icon-loading', props.className].filter(Boolean).join(' ');
    const style = props.size ? { width: props.size, height: props.size } : undefined;
    return h('div', {
      className,
      role: 'img',
      'data-testid': 'lazy-icon-loading',
      'data-xeg-icon-loading': 'true',
      'aria-label': '아이콘 로딩 중',
      'aria-busy': 'true',
      style,
    });
  }

  // 정상 Hook 경로
  let componentState: IconComponent | null = initial;
  const stateTuple = (() => {
    try {
      return useState!(initial);
    } catch {
      // useState 호출 실패 시 fallback 경로 재귀 (무한루프 방지 위해 직접 반환)
      return [initial, () => void 0] as [IconComponent | null, (v: IconComponent | null) => void];
    }
  })();
  const [component, setComponent] = stateTuple;
  componentState = component;

  try {
    useEffect!(() => {
      if (componentState) return; // already loaded
      let active = true;
      registry
        .loadIcon(props.name)
        .then(c => {
          if (active) setComponent(() => c as IconComponent);
        })
        .catch(() => {
          /* ignore */
        });
      return () => {
        active = false;
      };
    }, [props.name, componentState, registry]);
  } catch {
    // useEffect 실패 시 무시 (테스트 직접 호출 케이스)
  }

  if (props.fallback && !componentState) return props.fallback;
  if (componentState) {
    try {
      const passedProps: Record<string, unknown> = {};
      if (props.size !== undefined) passedProps.size = props.size;
      if (props.stroke !== undefined) passedProps.stroke = props.stroke;
      if (props.color !== undefined) passedProps.color = props.color;
      if (props.className !== undefined) passedProps.className = props.className;
      return h(componentState as unknown as (p: Record<string, unknown>) => VNode, passedProps);
    } catch {
      // swallow → placeholder
    }
  }

  const className = ['lazy-icon-loading', props.className].filter(Boolean).join(' ');
  const style = props.size ? { width: props.size, height: props.size } : undefined;
  return h('div', {
    className,
    role: 'img',
    'data-testid': 'lazy-icon-loading',
    'data-xeg-icon-loading': 'true',
    'aria-label': '아이콘 로딩 중',
    'aria-busy': 'true',
    style,
  });
}

export function useIconPreload(names: readonly IconName[]): void {
  const { useEffect } = getPreactHooks();
  const registry: IconRegistry = getIconRegistry();
  useEffect(() => {
    let mounted = true;
    Promise.all(names.map(n => registry.loadIcon(n))).catch(() => void 0);
    return () => {
      mounted = false;
      void mounted;
    };
  }, [names.join('|')]);
}

export function useCommonIconPreload(): void {
  const { useEffect } = getPreactHooks();
  useEffect(() => {
    void preloadCommonIcons();
  }, []);
}

export default LazyIcon;
