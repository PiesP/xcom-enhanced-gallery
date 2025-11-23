import { getSolid, type JSXElement } from "@shared/external/vendors";
import {
  getIconRegistry,
  preloadCommonIcons,
  type IconName,
} from "./icon-registry";
import type { IconProps } from "./Icon";

export interface LazyIconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly stroke?: number;
  readonly color?: string;
  readonly className?: string;
  readonly fallback?: JSXElement | unknown;
}

export function LazyIcon(props: LazyIconProps): JSXElement | unknown {
  if (props.fallback) {
    return props.fallback;
  }

  const { Show, createResource } = getSolid();
  const registry = getIconRegistry();

  const [iconResource] = createResource(
    () => props.name,
    (name) => registry.loadIcon(name),
  );

  const className = () =>
    ["lazy-icon-loading", props.className].filter(Boolean).join(" ");
  const style = () =>
    typeof props.size === "number"
      ? { width: `${props.size}px`, height: `${props.size}px` }
      : undefined;

  const placeholder = () => (
    <div
      class={className()}
      data-testid="lazy-icon-loading"
      aria-label="Icon loading"
      style={style()}
    />
  );

  const buildIconProps = (): IconProps => {
    const forwarded: IconProps = {};

    if (typeof props.size === "number") {
      forwarded.size = props.size;
    }

    if (props.className) {
      forwarded.className = props.className;
    }

    if (typeof props.stroke === "number") {
      forwarded["stroke-width"] = props.stroke;
    }

    if (props.color) {
      forwarded.stroke = props.color;
    }

    return forwarded;
  };

  return (
    <Show when={iconResource()} fallback={placeholder()}>
      {(component) => {
        const resolved = component();
        return resolved ? resolved(buildIconProps()) : null;
      }}
    </Show>
  );
}

export function useIconPreload(names: readonly IconName[]): void {
  const { createEffect } = getSolid();
  const registry = getIconRegistry();

  createEffect(() => {
    if (!names.length) {
      return;
    }

    void Promise.all(
      names.map((name) => registry.loadIcon(name).catch(() => undefined)),
    );
  });
}

export function useCommonIconPreload(): void {
  const { createEffect } = getSolid();

  createEffect(() => {
    void preloadCommonIcons();
  });
}

export default LazyIcon;
