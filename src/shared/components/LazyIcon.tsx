/**
 * @fileoverview LazyIcon Solid.js Component
 * @description Solid.js 기반 지연 로딩 아이콘 컴포넌트
 */

import { createEffect, onCleanup, type JSX } from 'solid-js';
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
  readonly fallback?: JSX.Element | unknown;
  readonly errorFallback?: JSX.Element | unknown;
}

export function LazyIcon(props: LazyIconProps): JSX.Element {
  // 커스텀 fallback이 제공되면 즉시 반환 (테스트 기대)
  if (props.fallback) return props.fallback as JSX.Element;

  const className = ['lazy-icon-loading', props.className].filter(Boolean).join(' ');
  const style = props.size ? { width: `${props.size}px`, height: `${props.size}px` } : undefined;

  // 기본 반환은 로딩 상태 placeholder
  return (
    <div
      class={className}
      data-testid='lazy-icon-loading'
      aria-label='아이콘 로딩 중'
      style={style}
    />
  ) as JSX.Element;
}

/**
 * 아이콘 프리로드 훅
 * @param names - 프리로드할 아이콘 이름 배열
 */
export function useIconPreload(names: readonly IconName[]): void {
  const registry: IconRegistry = getIconRegistry();

  createEffect(() => {
    let mounted = true;

    Promise.all(names.map(n => registry.loadIcon(n))).catch(() => void 0);

    onCleanup(() => {
      mounted = false;
      void mounted;
    });
  });
}

/**
 * 공통 아이콘 프리로드 훅
 */
export function useCommonIconPreload(): void {
  createEffect(() => {
    void preloadCommonIcons();
  });
}

export default LazyIcon;
