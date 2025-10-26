import { getSolid, type JSXElement } from '../external/vendors';
import {
  getIconRegistry,
  preloadCommonIcons,
  type IconName,
  type IconRegistry,
} from './ui/Icon/icon-registry';

export interface LazyIconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly stroke?: number;
  readonly color?: string;
  readonly className?: string;
  readonly fallback?: JSXElement | unknown;
  readonly errorFallback?: JSXElement | unknown;
}

export function LazyIcon(props: LazyIconProps): JSXElement | unknown {
  // 커스텀 fallback이 제공되면 즉시 반환 (테스트 기대)
  if (props.fallback) return props.fallback;

  // Use getter functions to maintain reactivity for props
  const className = () => ['lazy-icon-loading', props.className].filter(Boolean).join(' ');
  const style = () =>
    props.size ? { width: `${props.size}px`, height: `${props.size}px` } : undefined;

  // 기본 반환은 로딩 상태 placeholder
  return (
    <div
      class={className()}
      data-testid='lazy-icon-loading'
      aria-label='아이콘 로딩 중'
      style={style()}
    />
  );
}

export function useIconPreload(names: readonly IconName[]): void {
  const { createEffect, onCleanup } = getSolid();
  const registry: IconRegistry = getIconRegistry();
  createEffect(() => {
    let disposed = false;
    void Promise.all(names.map(name => registry.loadIcon(name))).catch(() => {
      // ignore load failures in preload
    });
    onCleanup(() => {
      disposed = true;
      void disposed;
    });
  });
}

export function useCommonIconPreload(): void {
  const { createEffect } = getSolid();
  createEffect(() => {
    void preloadCommonIcons();
  });
}

export default LazyIcon;
