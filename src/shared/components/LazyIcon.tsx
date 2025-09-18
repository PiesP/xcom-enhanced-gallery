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

  // 커스텀 fallback이 제공되면 즉시 반환 (정책: 사용자가 전적으로 placeholder 구성)
  if (props.fallback) return props.fallback;

  const className = ['lazy-icon-loading', props.className].filter(Boolean).join(' ');
  const style = props.size ? { width: props.size, height: props.size } : undefined;

  // 표준 placeholder: 접근성 + 상태 data 속성
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
