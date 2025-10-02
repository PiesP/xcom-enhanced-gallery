import type { JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { getSolidCore } from '@shared/external/vendors';
import {
  getIconRegistry,
  preloadCommonIcons,
  type IconName,
  type IconRegistry,
  type IconComponent,
} from '@shared/services/iconRegistry';

export interface LazyIconProps {
  readonly name: IconName;
  readonly size?: number | string;
  readonly stroke?: number;
  readonly color?: string;
  readonly className?: string;
  readonly fallback?: JSX.Element | string;
  readonly errorFallback?: JSX.Element | string;
}

export const LazyIcon = (props: LazyIconProps): JSX.Element => {
  const { createSignal, createEffect, createMemo, onCleanup } = getSolidCore();

  const registry = getIconRegistry();
  const [iconComponent, setIconComponent] = createSignal<IconComponent | null>(
    registry.getLoadedIconSync(props.name)
  );
  const [loadError, setLoadError] = createSignal(false);

  createEffect(() => {
    const name = props.name;
    setLoadError(false);
    let isActive = true;

    const loaded = registry.getLoadedIconSync(name);
    if (loaded) {
      setIconComponent(loaded);
      return;
    }

    registry
      .loadIcon(name)
      .then(component => {
        if (isActive) {
          setIconComponent(component);
        }
      })
      .catch(() => {
        if (isActive) {
          setLoadError(true);
          setIconComponent(null);
        }
      });

    onCleanup(() => {
      isActive = false;
    });
  });

  const iconProps = createMemo(() => {
    const record: Record<string, unknown> = {};
    if (props.size !== undefined) record.size = props.size;
    if (props.stroke !== undefined) record.stroke = props.stroke;
    if (props.color !== undefined) record.color = props.color;
    if (props.className !== undefined) record.className = props.className;
    // 테스트/디버그 용도로 data-icon 속성 추가
    record['data-icon'] = props.name;
    return record;
  });

  const placeholderStyle = createMemo(() => {
    if (props.size === undefined) {
      return undefined;
    }
    const sizeValue = typeof props.size === 'number' ? `${props.size}px` : props.size;
    return {
      width: sizeValue,
      height: sizeValue,
    } as Record<string, unknown>;
  });

  const component = iconComponent();
  if (component) {
    return <Dynamic component={component} {...(iconProps() as Record<string, unknown>)} />;
  }

  if (loadError() && props.errorFallback) {
    return <>{props.errorFallback}</>;
  }

  if (props.fallback) {
    return <>{props.fallback}</>;
  }

  return (
    <div
      class={['lazy-icon-loading', props.className].filter(Boolean).join(' ')}
      role='img'
      data-testid='lazy-icon-loading'
      data-xeg-icon-loading='true'
      aria-label='아이콘 로딩 중'
      aria-busy='true'
      style={placeholderStyle() as JSX.CSSProperties | undefined}
    />
  );
};

export function useIconPreload(names: readonly IconName[]): void {
  const { createEffect } = getSolidCore();
  createEffect(() => {
    const registry: IconRegistry = getIconRegistry();
    void Promise.all(names.map(name => registry.loadIcon(name))).catch(() => undefined);
  });
}

export function useCommonIconPreload(): void {
  const { createEffect } = getSolidCore();
  createEffect(() => {
    void preloadCommonIcons();
  });
}

export default LazyIcon;
