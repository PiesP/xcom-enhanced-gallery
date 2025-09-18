import { getPreact, getPreactHooks, type VNode } from '@shared/external/vendors';
import {
  getIconRegistry,
  preloadCommonIcons,
  type IconName,
  type IconRegistry,
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

  // 1. 커스텀 fallback 우선
  if (props.fallback) return props.fallback;

  // 2. 하이브리드 프리로드: 이미 로드된 컴포넌트 동기 반환
  const loaded = registry.getLoadedIconSync(props.name);
  if (loaded) {
    try {
      return h(loaded as unknown as (p: Record<string, unknown>) => VNode, {
        size: props.size,
        stroke: props.stroke,
        color: props.color,
        className: props.className,
      });
    } catch {
      // 실패 시 placeholder로 폴백
    }
  }

  // 3. 아직 로드되지 않았다면 placeholder 즉시 렌더 후 비동기 로드 트리거 (미래 확장: state 업데이트)
  // 현재는 단순 placeholder 정책 (R3 범위: 프리로드된 경우만 즉시 렌더)
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
